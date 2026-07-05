from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import httpx
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

VALID_THEMES = {"videojuegos", "princesas", "superheroes", "dinosaurios", "espacio", "unicornios"}

UPLOADS_DIR = ROOT_DIR / "uploads"
VIDEOS_DIR = UPLOADS_DIR / "videos"
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

MAX_VIDEO_BYTES = 50 * 1024 * 1024  # 50MB
ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/ogg": ".ogv",
}
VIDEO_URL_RE = re.compile(r"^/uploads/videos/[a-f0-9]{32}\.(mp4|webm|mov|ogv)$")


def _is_safe_link_url(url: str) -> bool:
    """Only allow http(s) links, so stored data can't smuggle a javascript:/data: URI
    into an <a href> rendered on the public invitation page."""
    return url == "" or url.startswith("http://") or url.startswith("https://")


def _is_valid_script_url(url: str) -> bool:
    """Restrict Apps Script forwarding to script.google.com, since this URL is user-supplied
    and otherwise the RSVP endpoint would POST guest data to any attacker-chosen host (SSRF)."""
    return url == "" or (url.startswith("https://script.google.com/macros/") and url.endswith("/exec"))


def _is_valid_video_url(url: str) -> bool:
    """video_url must point at a file this server generated via /uploads/video, so it can't
    be used to smuggle an arbitrary external or javascript: URL into the <video> src."""
    return url == "" or bool(VIDEO_URL_RE.match(url))


def _validate_invitation_links(data: "InvitationData") -> None:
    if not _is_safe_link_url(data.maps_url):
        raise HTTPException(status_code=400, detail="Link de Google Maps inválido")
    if not _is_safe_link_url(data.waze_url):
        raise HTTPException(status_code=400, detail="Link de Waze inválido")
    if not _is_valid_script_url(data.script_url):
        raise HTTPException(status_code=400, detail="La URL de Google Apps Script debe ser de script.google.com y terminar en /exec")
    if not _is_valid_video_url(data.video_url):
        raise HTTPException(status_code=400, detail="Video inválido")


class InvitationData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    theme: str = "videojuegos"
    child_name: str
    child_full_name: str = ""
    age: int
    event_date: str  # YYYY-MM-DD
    event_time: str  # HH:MM
    venue: str = ""
    address: str = ""
    how_arrive: str = ""
    maps_url: str = ""
    waze_url: str = ""
    whatsapp: str = ""
    message: str = ""
    script_url: str = ""
    host_names: str = ""
    video_url: str = ""


class Invitation(InvitationData):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    edit_token: str = Field(default_factory=lambda: secrets.token_urlsafe(16))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RsvpCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nombre: str
    telefono: str = ""
    asiste: str = "Sí"
    adultos: int = 0
    ninos: int = 0
    mensaje: str = ""


@api_router.get("/")
async def root():
    return {"message": "Invitaciones API"}


@api_router.post("/invitations")
async def create_invitation(data: InvitationData):
    if data.theme not in VALID_THEMES:
        raise HTTPException(status_code=400, detail="Temática inválida")
    _validate_invitation_links(data)
    inv = Invitation(**data.model_dump())
    await db.invitations.insert_one(inv.model_dump())
    return {"id": inv.id, "edit_token": inv.edit_token}


@api_router.get("/invitations/{inv_id}")
async def get_invitation(inv_id: str):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0, "edit_token": 0, "script_url": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    return doc


@api_router.get("/invitations/{inv_id}/edit")
async def get_invitation_for_edit(inv_id: str, token: str = Query(...)):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if doc["edit_token"] != token:
        raise HTTPException(status_code=403, detail="Link de edición inválido")
    return doc


@api_router.put("/invitations/{inv_id}")
async def update_invitation(inv_id: str, data: InvitationData, token: str = Query(...)):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if doc["edit_token"] != token:
        raise HTTPException(status_code=403, detail="Link de edición inválido")
    if data.theme not in VALID_THEMES:
        raise HTTPException(status_code=400, detail="Temática inválida")
    _validate_invitation_links(data)
    await db.invitations.update_one({"id": inv_id}, {"$set": data.model_dump()})
    return {"ok": True}


@api_router.post("/uploads/video")
async def upload_video(request: Request, file: UploadFile = File(...)):
    ext = ALLOWED_VIDEO_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Formato de video no soportado. Usa MP4, WebM, MOV u OGG.")

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_VIDEO_BYTES + 5_000_000:
        raise HTTPException(status_code=413, detail="El video no puede pesar más de 50MB.")

    contents = await file.read(MAX_VIDEO_BYTES + 1)
    if len(contents) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="El video no puede pesar más de 50MB.")

    filename = f"{uuid.uuid4().hex}{ext}"
    with open(VIDEOS_DIR / filename, "wb") as f:
        f.write(contents)

    return {"video_url": f"/uploads/videos/{filename}"}


@api_router.post("/invitations/{inv_id}/rsvp")
async def create_rsvp(inv_id: str, rsvp: RsvpCreate):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    record = rsvp.model_dump()
    record["id"] = str(uuid.uuid4())
    record["invitation_id"] = inv_id
    record["fecha_registro"] = datetime.now(timezone.utc).isoformat()
    await db.rsvps.insert_one(dict(record))

    script_url = doc.get("script_url", "")
    forwarded = False
    if script_url:
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as hc:
                await hc.post(script_url, data={
                    "fecha_registro": datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M"),
                    "nombre": rsvp.nombre,
                    "telefono": rsvp.telefono,
                    "asiste": rsvp.asiste,
                    "adultos": str(rsvp.adultos),
                    "ninos": str(rsvp.ninos),
                    "mensaje": rsvp.mensaje,
                })
                forwarded = True
        except Exception as e:
            logging.getLogger(__name__).warning(f"Apps Script forward failed: {e}")
    return {"ok": True, "sheet_forwarded": forwarded}


app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
