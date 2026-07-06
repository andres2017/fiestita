from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, UploadFile, File
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import hashlib
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

WOMPI_PUBLIC_KEY = os.environ['WOMPI_PUBLIC_KEY']
WOMPI_PRIVATE_KEY = os.environ['WOMPI_PRIVATE_KEY']
WOMPI_INTEGRITY_SECRET = os.environ['WOMPI_INTEGRITY_SECRET']
WOMPI_EVENTS_SECRET = os.environ['WOMPI_EVENTS_SECRET']
WOMPI_API_URL = os.environ['WOMPI_API_URL']
WOMPI_CHECKOUT_URL = os.environ['WOMPI_CHECKOUT_URL']
PRICE_CENTS = int(os.environ['PUBLISH_PRICE_CENTS'])
CURRENCY = "COP"

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ['EMERGENT_LLM_KEY']
APP_NAME = "fiestita"
storage_key = None


async def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    async with httpx.AsyncClient(timeout=30) as hc:
        r = await hc.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY})
        r.raise_for_status()
        storage_key = r.json()["storage_key"]
    return storage_key


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
    media: list = []


class Invitation(InvitationData):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    edit_token: str = Field(default_factory=lambda: secrets.token_urlsafe(16))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    paid: bool = False
    payment_status: str = ""
    wompi_reference: str = ""
    wompi_transaction_id: str = ""


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
    inv = Invitation(**data.model_dump())
    await db.invitations.insert_one(inv.model_dump())
    return {"id": inv.id, "edit_token": inv.edit_token}


@api_router.get("/config")
async def get_config():
    return {"price_cents": PRICE_CENTS, "currency": CURRENCY}


@api_router.get("/invitations/{inv_id}")
async def get_invitation(inv_id: str):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0, "edit_token": 0, "script_url": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if not doc.get("paid"):
        raise HTTPException(status_code=402, detail="Esta invitación aún no ha sido publicada")
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
    await db.invitations.update_one({"id": inv_id}, {"$set": data.model_dump()})
    return {"ok": True}


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


# ===== PAGOS WOMPI =====
@api_router.post("/invitations/{inv_id}/checkout")
async def create_checkout(inv_id: str, token: str = Query(...)):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if doc["edit_token"] != token:
        raise HTTPException(status_code=403, detail="Link de edición inválido")
    if doc.get("paid"):
        raise HTTPException(status_code=400, detail="Esta invitación ya está publicada")
    reference = f"FTA-{inv_id[:8]}-{secrets.token_hex(4)}"
    await db.invitations.update_one(
        {"id": inv_id},
        {"$set": {"wompi_reference": reference, "payment_status": "PENDING"}},
    )
    signature = hashlib.sha256(f"{reference}{PRICE_CENTS}{CURRENCY}{WOMPI_INTEGRITY_SECRET}".encode()).hexdigest()
    return {
        "checkout_url": WOMPI_CHECKOUT_URL,
        "public_key": WOMPI_PUBLIC_KEY,
        "currency": CURRENCY,
        "amount_in_cents": PRICE_CENTS,
        "reference": reference,
        "signature": signature,
    }


@api_router.get("/invitations/{inv_id}/verify-payment")
async def verify_payment(inv_id: str, transaction_id: str = Query(...)):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if doc.get("paid"):
        return {"paid": True, "status": "APPROVED"}
    async with httpx.AsyncClient(timeout=20) as hc:
        r = await hc.get(
            f"{WOMPI_API_URL}/transactions/{transaction_id}",
            headers={"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="No se pudo consultar la transacción en Wompi")
    tx = r.json().get("data", {})
    if (tx.get("reference") != doc.get("wompi_reference")
            or tx.get("amount_in_cents") != PRICE_CENTS
            or tx.get("currency") != CURRENCY):
        raise HTTPException(status_code=400, detail="La transacción no corresponde a esta invitación")
    tx_status = tx.get("status", "")
    updates = {"payment_status": tx_status, "wompi_transaction_id": tx.get("id", "")}
    if tx_status == "APPROVED":
        updates["paid"] = True
    await db.invitations.update_one({"id": inv_id}, {"$set": updates})
    return {"paid": tx_status == "APPROVED", "status": tx_status}


@api_router.post("/wompi/webhook")
async def wompi_webhook(request: Request):
    body = await request.json()
    sig = body.get("signature", {})
    timestamp = body.get("timestamp", "")
    data = body.get("data", {})
    concat = ""
    for prop in sig.get("properties", []):
        node = data
        for part in prop.split("."):
            node = node.get(part, "") if isinstance(node, dict) else ""
        concat += str(node)
    checksum = hashlib.sha256(f"{concat}{timestamp}{WOMPI_EVENTS_SECRET}".encode()).hexdigest()
    if checksum != sig.get("checksum"):
        raise HTTPException(status_code=403, detail="Firma de evento inválida")
    tx = data.get("transaction", {})
    if tx.get("status") == "APPROVED" and tx.get("amount_in_cents") == PRICE_CENTS and tx.get("currency") == CURRENCY:
        await db.invitations.update_one(
            {"wompi_reference": tx.get("reference")},
            {"$set": {"paid": True, "payment_status": "APPROVED", "wompi_transaction_id": tx.get("id", "")}},
        )
    return {"received": True}


# ===== FOTOS Y VIDEOS =====
ALLOWED_PHOTO = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO = {"video/mp4", "video/quicktime", "video/webm"}


@api_router.post("/media/upload")
async def upload_media(file: UploadFile = File(...)):
    ctype = file.content_type or ""
    if ctype in ALLOWED_PHOTO:
        mtype, max_mb = "photo", 10
    elif ctype in ALLOWED_VIDEO:
        mtype, max_mb = "video", 50
    else:
        raise HTTPException(status_code=400, detail="Formato no permitido. Fotos: JPG/PNG/WEBP. Video: MP4/MOV/WEBM")
    data = await file.read()
    if len(data) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Archivo demasiado grande (máximo {max_mb}MB)")
    ext = (file.filename or "bin").rsplit(".", 1)[-1].lower()
    path = f"{APP_NAME}/media/{uuid.uuid4()}.{ext}"
    key = await init_storage()
    async with httpx.AsyncClient(timeout=120) as hc:
        r = await hc.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": ctype},
            content=data,
        )
        r.raise_for_status()
        stored = r.json()
    media_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": stored["path"],
        "original_filename": file.filename,
        "content_type": ctype,
        "media_type": mtype,
        "size": len(data),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.media.insert_one(dict(media_doc))
    return {"id": media_doc["id"], "path": stored["path"], "type": mtype}


@api_router.get("/media/{path:path}")
async def serve_media(path: str):
    record = await db.media.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    key = await init_storage()
    async with httpx.AsyncClient(timeout=60) as hc:
        r = await hc.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key})
    if r.status_code != 200:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return Response(
        content=r.content,
        media_type=record["content_type"],
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.on_event("startup")
async def startup_storage():
    try:
        await init_storage()
        logging.getLogger(__name__).info("Storage inicializado")
    except Exception as e:
        logging.getLogger(__name__).error(f"Fallo init storage: {e}")


app.include_router(api_router)

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
