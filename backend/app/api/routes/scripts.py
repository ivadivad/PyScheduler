from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/scripts", tags=["scripts"])

ALLOWED_EXTENSIONS = {".py"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.get("")
async def list_scripts(_: User = Depends(get_current_user)):
    scripts_dir = Path(settings.SCRIPTS_DIR)
    if not scripts_dir.exists():
        return {"scripts": []}
    files = sorted(f.name for f in scripts_dir.iterdir() if f.suffix == ".py")
    return {"scripts": files}


@router.post("/upload")
async def upload_script(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    if not file.filename or Path(file.filename).suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .py files are allowed")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    scripts_dir = Path(settings.SCRIPTS_DIR)
    scripts_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename).name
    dest = scripts_dir / safe_name
    dest.write_bytes(content)

    return {"filename": safe_name}
