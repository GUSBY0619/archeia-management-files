from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import stat
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Tuple
from datetime import datetime, timezone
import shutil


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Storage configuration — default to backend/storage/
raw_storage = os.environ.get('STORAGE_DIR', str(ROOT_DIR / 'storage'))
STORAGE_DIR = Path(raw_storage)
if not STORAGE_DIR.is_absolute():
    STORAGE_DIR = (ROOT_DIR / raw_storage).resolve()
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# ── Response models ──────────────────────────────────────────

class FileEntry(BaseModel):
    name: str
    path: str
    extension: Optional[str] = None

class DirectoryContents(BaseModel):
    """Flat listing of a directory — no nested trees."""
    path: str
    parent: Optional[str] = None
    directories: List[FileEntry]
    files: List[FileEntry]

class FileContent(BaseModel):
    path: str
    content: str
    size: int
    modified: str

class CreateFileRequest(BaseModel):
    path: str
    content: str = ""

class UpdateFileRequest(BaseModel):
    content: str

class RenameRequest(BaseModel):
    old_path: str
    new_name: str

class CreateFolderRequest(BaseModel):
    path: str


# ── Helpers ──────────────────────────────────────────────────

SKIPPED_NAMES = {"desktop.ini", "thumbs.db", ".ds_store"}


def is_reparse_point(path: Path) -> bool:
    """Detect Windows junctions/symlinks (los @ en ls) usando lstat
    para NO seguir el reparse point y agarrar sus atributos reales."""
    try:
        attrs = os.lstat(str(path)).st_file_attributes
        return bool(attrs & stat.FILE_ATTRIBUTE_REPARSE_POINT)
    except (OSError, AttributeError):
        return False


def is_safe_filename(name: str) -> bool:
    """Blocks path traversal and weird chars."""
    if '..' in name or name.startswith('/') or name.startswith('\\'):
        return False
    return True


def get_safe_path(relative_path: str) -> Path:
    """Resolve a relative path within STORAGE_DIR safely."""
    full_path = (STORAGE_DIR / relative_path).resolve()
    if not str(full_path).startswith(str(STORAGE_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Path outside storage directory")
    return full_path


def file_info(path: Path, relative_to: Path = STORAGE_DIR) -> FileEntry:
    """Build a FileEntry for a single file (not folder)."""
    rel = str(path.relative_to(relative_to))
    ext = path.suffix[1:] if path.suffix else None
    return FileEntry(name=path.name, path=rel, extension=ext)


def list_directory(base: Path) -> Tuple[List[FileEntry], List[FileEntry]]:
    """Scan a directory and return (directories, files) — flat, no nesting.
    Skips Windows junctions (los @), symlinks, desktop.ini, thumbs.db, etc.
    """
    dirs: List[FileEntry] = []
    files: List[FileEntry] = []

    try:
        for item in sorted(base.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            if is_reparse_point(item) or item.name.lower() in SKIPPED_NAMES:
                continue

            if item.is_dir():
                dirs.append(FileEntry(name=item.name, path=str(item.relative_to(STORAGE_DIR)), extension=None))
            else:
                files.append(file_info(item, STORAGE_DIR))
    except PermissionError:
        pass

    return dirs, files


# ── Endpoints ────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "File Management API"}


@api_router.get("/files", response_model=DirectoryContents)
async def list_files(search: Optional[str] = None, path: Optional[str] = None):
    """List contents of a directory. Defaults to STORAGE_DIR root.
    Use ?path=subfolder to navigate deeper (never outside STORAGE_DIR).
    Returns a flat directory listing — no nested trees.
    """
    try:
        target = STORAGE_DIR
        if path:
            target = get_safe_path(path)
            if not target.is_dir():
                raise HTTPException(status_code=400, detail="Path is not a directory")

        directories, files = list_directory(target)

        # Compute parent path for "go up" navigation
        parent: Optional[str] = None
        if path:
            parent_path = Path(path).parent
            parent = str(parent_path).replace("\\", "/") if str(parent_path) != "." else None

        result = DirectoryContents(path=path or "", parent=parent, directories=directories, files=files)

        # Optional search filter
        if search:
            q = search.lower()
            result.files = [f for f in result.files if q in f.name.lower()]
            result.directories = [d for d in result.directories if q in d.name.lower()]

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/files/{file_path:path}/raw")
async def get_raw_file(file_path: str):
    """Serve a binary file (PDF, image, DOCX, etc.) with proper Content-Type."""
    full_path = get_safe_path(file_path)
    if not full_path.exists() or full_path.is_dir():
        raise HTTPException(status_code=404, detail="File not found")

    media_types = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".csv": "text/csv",
        ".json": "application/json",
        ".md": "text/markdown",
    }

    mime = media_types.get(full_path.suffix.lower())

    # Previewable types → inline (show in iframe/browser)
    # Others → attachment (download)
    previewable = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".csv", ".json", ".md"}
    disposition = "inline" if full_path.suffix.lower() in previewable else "attachment"
    headers = {"Content-Disposition": f'{disposition}; filename="{full_path.name}"'}

    return FileResponse(path=str(full_path), media_type=mime, headers=headers)


@api_router.get("/files/{file_path:path}", response_model=FileContent)
async def read_file(file_path: str):
    """Get file text content. For non-text files open the /raw endpoint instead."""
    try:
        full_path = get_safe_path(file_path)
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        if full_path.is_dir():
            raise HTTPException(status_code=400, detail="Path is a directory")

        try:
            content = full_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File is not a text file. Use /raw to download.")

        st = full_path.stat()
        return FileContent(
            path=file_path,
            content=content,
            size=st.st_size,
            modified=datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/files", response_model=FileEntry)
async def create_file(request: CreateFileRequest):
    """Create a new file."""
    if not is_safe_filename(request.path):
        raise HTTPException(status_code=400, detail="Invalid path")

    try:
        full_path = get_safe_path(request.path)
        if full_path.exists():
            raise HTTPException(status_code=400, detail="File already exists")

        full_path.parent.mkdir(parents=True, exist_ok=True)
        content_size = len(request.content.encode('utf-8'))
        if content_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE} bytes")

        full_path.write_text(request.content, encoding='utf-8')
        return file_info(full_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/files/upload", response_model=FileEntry)
async def upload_file(file: UploadFile = File(...), path: str = Form("")):
    """Upload a file. Optionally specify a subdirectory via `path`."""
    try:
        # Determine target directory
        if path:
            target_dir = get_safe_path(path)
            if not target_dir.is_dir():
                raise HTTPException(status_code=400, detail="Path is not a directory")
        else:
            target_dir = STORAGE_DIR

        save_path = target_dir / file.filename

        if save_path.exists():
            raise HTTPException(status_code=400, detail="File already exists")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE} bytes")

        save_path.write_bytes(content)
        return file_info(save_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/files/{file_path:path}", response_model=FileEntry)
async def update_file(file_path: str, request: UpdateFileRequest):
    """Update file content."""
    try:
        full_path = get_safe_path(file_path)
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        if full_path.is_dir():
            raise HTTPException(status_code=400, detail="Path is a directory")

        content_size = len(request.content.encode('utf-8'))
        if content_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE} bytes")

        full_path.write_text(request.content, encoding='utf-8')
        return file_info(full_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/files/{file_path:path}")
async def delete_file(file_path: str):
    """Delete a file or folder."""
    try:
        full_path = get_safe_path(file_path)
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File or folder not found")

        if full_path.is_dir():
            shutil.rmtree(full_path)
        else:
            full_path.unlink()

        return {"message": "Deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/files/rename")
async def rename_file(request: RenameRequest):
    """Rename a file or folder."""
    if not is_safe_filename(request.new_name):
        raise HTTPException(status_code=400, detail="Invalid name")

    try:
        old_path = get_safe_path(request.old_path)
        if not old_path.exists():
            raise HTTPException(status_code=404, detail="File or folder not found")

        new_path = old_path.parent / request.new_name
        if not str(new_path.resolve()).startswith(str(STORAGE_DIR.resolve())):
            raise HTTPException(status_code=400, detail="Invalid path")
        if new_path.exists():
            raise HTTPException(status_code=400, detail="Already exists")

        old_path.rename(new_path)
        return file_info(new_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/folders")
async def create_folder(request: CreateFolderRequest):
    """Create a new folder."""
    if not is_safe_filename(request.path):
        raise HTTPException(status_code=400, detail="Invalid path")

    try:
        full_path = get_safe_path(request.path)
        if full_path.exists():
            raise HTTPException(status_code=400, detail="Folder already exists")

        full_path.mkdir(parents=True, exist_ok=True)
        return {"message": "Folder created", "path": request.path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── App setup ────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)
 