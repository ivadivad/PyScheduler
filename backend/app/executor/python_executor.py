import asyncio
import os
import sys
import uuid
import json
from datetime import datetime, timezone
from typing import Optional, Dict, List
from fastapi import WebSocket


class WebSocketManager:
    """Manages active WebSocket connections per execution."""

    def __init__(self):
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, execution_id: str, ws: WebSocket):
        await ws.accept()
        if execution_id not in self._connections:
            self._connections[execution_id] = []
        self._connections[execution_id].append(ws)

    def disconnect(self, execution_id: str, ws: WebSocket):
        if execution_id in self._connections:
            self._connections[execution_id].discard(ws) if hasattr(self._connections[execution_id], 'discard') else None
            try:
                self._connections[execution_id].remove(ws)
            except ValueError:
                pass
            if not self._connections[execution_id]:
                del self._connections[execution_id]

    async def broadcast(self, execution_id: str, message: dict):
        conns = self._connections.get(execution_id, [])
        dead = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(execution_id, ws)


ws_manager = WebSocketManager()


class PythonExecutor:
    """Executes Python scripts in isolated subprocesses with full lifecycle management."""

    def __init__(self, scripts_dir: str, max_concurrent: int = 5):
        self.scripts_dir = scripts_dir
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._running_processes: Dict[str, asyncio.subprocess.Process] = {}

    async def execute(
        self,
        execution_id: uuid.UUID,
        script_path: str,
        script_args: Optional[list] = None,
        env_vars: Optional[dict] = None,
        timeout: int = 300,
        on_log=None,
    ) -> dict:
        """
        Run a Python script as a subprocess.
        Returns dict with exit_code, duration_ms, error_message.
        """
        execution_id_str = str(execution_id)
        script_args = script_args or []
        env_vars = env_vars or {}

        # Resolve script path
        if not os.path.isabs(script_path):
            resolved = os.path.join(self.scripts_dir, script_path)
        else:
            resolved = script_path

        if not os.path.exists(resolved):
            return {
                "exit_code": -1,
                "duration_ms": 0,
                "error_message": f"Script not found: {resolved}",
                "pid": None,
            }

        # Build environment
        proc_env = os.environ.copy()
        proc_env.update(env_vars)
        proc_env["PYTHONUNBUFFERED"] = "1"

        # Build command
        cmd = [sys.executable, resolved] + [str(a) for a in script_args]

        start_time = datetime.now(timezone.utc)
        seq = [0]

        async def _log(stream: str, message: str):
            seq[0] += 1
            entry = {
                "type": "log",
                "stream": stream,
                "message": message,
                "sequence": seq[0],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await ws_manager.broadcast(execution_id_str, entry)
            if on_log:
                await on_log(stream, message, seq[0])

        async with self._semaphore:
            try:
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=proc_env,
                )
                self._running_processes[execution_id_str] = proc

                await _log("stdout", f"[scheduler] Starting: {' '.join(cmd)}")
                await _log("stdout", f"[scheduler] PID: {proc.pid}")

                async def read_stream(stream, stream_name: str):
                    while True:
                        line = await stream.readline()
                        if not line:
                            break
                        await _log(stream_name, line.decode("utf-8", errors="replace").rstrip())

                try:
                    await asyncio.wait_for(
                        asyncio.gather(
                            read_stream(proc.stdout, "stdout"),
                            read_stream(proc.stderr, "stderr"),
                            proc.wait(),
                        ),
                        timeout=timeout,
                    )
                    exit_code = proc.returncode
                    error_message = None
                    if exit_code != 0:
                        error_message = f"Process exited with code {exit_code}"

                except asyncio.TimeoutError:
                    try:
                        proc.kill()
                    except ProcessLookupError:
                        pass
                    exit_code = -1
                    error_message = f"Execution timed out after {timeout}s"
                    await _log("stderr", f"[scheduler] TIMEOUT: Execution killed after {timeout}s")

                finish_time = datetime.now(timezone.utc)
                duration_ms = int((finish_time - start_time).total_seconds() * 1000)

                status_msg = "success" if exit_code == 0 else ("timeout" if exit_code == -1 and "timed out" in (error_message or "") else "failed")
                await ws_manager.broadcast(execution_id_str, {
                    "type": "status",
                    "status": status_msg,
                    "exit_code": exit_code,
                    "duration_ms": duration_ms,
                })

                return {
                    "exit_code": exit_code,
                    "duration_ms": duration_ms,
                    "error_message": error_message,
                    "pid": proc.pid,
                }

            except Exception as e:
                return {
                    "exit_code": -1,
                    "duration_ms": 0,
                    "error_message": str(e),
                    "pid": None,
                }
            finally:
                self._running_processes.pop(execution_id_str, None)

    async def cancel(self, execution_id: uuid.UUID) -> bool:
        proc = self._running_processes.get(str(execution_id))
        if proc:
            try:
                proc.kill()
                return True
            except ProcessLookupError:
                return False
        return False


executor = PythonExecutor(
    scripts_dir=os.environ.get("SCRIPTS_DIR", "./scripts"),
    max_concurrent=int(os.environ.get("MAX_CONCURRENT_EXECUTIONS", "5")),
)
