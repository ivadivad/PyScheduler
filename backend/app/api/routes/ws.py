from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.executor.python_executor import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/executions/{execution_id}")
async def execution_ws(execution_id: str, websocket: WebSocket):
    await ws_manager.connect(execution_id, websocket)
    try:
        while True:
            # Keep connection alive; we only push from server side
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(execution_id, websocket)
    except Exception:
        ws_manager.disconnect(execution_id, websocket)
