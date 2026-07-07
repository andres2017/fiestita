from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
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

# Debe reflejar exactamente las categorías de frontend/src/themes.js — se usa para
# impedir que una invitación cambie de categoría (cumpleaños/boda/partido) al editarla.
THEME_CATEGORY = {
    "videojuegos": "cumple_infantil",
    "princesas": "cumple_infantil",
    "superheroes": "cumple_infantil",
    "dinosaurios": "cumple_infantil",
    "espacio": "cumple_infantil",
    "unicornios": "cumple_infantil",
    "magia": "cumple_infantil",
    "circo": "cumple_infantil",
    "piratas": "cumple_infantil",
    "sirenas": "cumple_infantil",
    "safari": "cumple_infantil",
    "granja": "cumple_infantil",
    "fiesta_adultos": "cumple_adulto",
    "boda": "boda",
    "mundial": "partido",
    "cumbre": "conferencia",
    "cielito": "bautizo",
    "llama_viva": "confirmacion",
    "tardeo": "parche",
    "gloria": "reto_deportivo",
    "aguinaldos": "novena",
}
VALID_THEMES = set(THEME_CATEGORY.keys())

# --- Pagos / administración -------------------------------------------------
# ADMIN_KEY: clave secreta para acceder al panel "Mis ventas" (header X-Admin-Key).
# WOMPI_EVENTS_SECRET: secreto de eventos de Wompi (pestaña Programadores),
# usado para verificar la firma de los webhooks.
ADMIN_KEY = os.environ.get('ADMIN_KEY', '')
WOMPI_EVENTS_SECRET = os.environ.get('WOMPI_EVENTS_SECRET', '')
WOMPI_PUBLIC_KEY = os.environ.get('WOMPI_PUBLIC_KEY', '')
WOMPI_INTEGRITY_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET', '')
INVITATION_PRICE_COP = int(os.environ.get('INVITATION_PRICE_COP', '59000'))
PAYMENT_REFERENCE_PREFIX = "FIESTITA-"

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


def _is_expired(event_date: str) -> bool:
    """An invitation can no longer be edited starting the day after its event_date
    (Colombia has no DST/multiple timezones so a plain UTC date compare is fine here)."""
    if not event_date:
        return False
    try:
        event_day = datetime.strptime(event_date, "%Y-%m-%d").date()
    except ValueError:
        return False
    return event_day < datetime.now(timezone.utc).date()


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
    age: int = 0
    event_date: str  # YYYY-MM-DD
    event_time: str  # HH:MM
    venue: str = ""
    address: str = ""
    how_arrive: str = ""
    maps_url: str = ""
    waze_url: str = ""
    whatsapp: str = ""
    message: str = ""
    event_subtitle: str = ""
    script_url: str = ""
    host_names: str = ""
    video_url: str = ""


class Invitation(InvitationData):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    edit_token: str = Field(default_factory=lambda: secrets.token_urlsafe(16))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    paid: bool = False


class AdminInvitationCreate(InvitationData):
    amount_cop: Optional[int] = None
    customer_email: str = ""
    payment_note: str = ""


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


@api_router.get("/pricing")
async def get_pricing():
    return {"price_cop": INVITATION_PRICE_COP}


@api_router.post("/invitations")
async def create_invitation(data: InvitationData):
    if not WOMPI_PUBLIC_KEY or not WOMPI_INTEGRITY_SECRET:
        raise HTTPException(status_code=503, detail="Pagos no configurados (falta WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET)")
    if data.theme not in VALID_THEMES:
        raise HTTPException(status_code=400, detail="Temática inválida")
    _validate_invitation_links(data)
    inv = Invitation(**data.model_dump())
    await db.invitations.insert_one(inv.model_dump())

    amount_in_cents = INVITATION_PRICE_COP * 100
    reference = f"{PAYMENT_REFERENCE_PREFIX}{inv.id}"
    return {
        "id": inv.id,
        "edit_token": inv.edit_token,
        "checkout": {
            "public_key": WOMPI_PUBLIC_KEY,
            "currency": "COP",
            "amount_in_cents": amount_in_cents,
            "reference": reference,
            "signature": _wompi_integrity_signature(reference, amount_in_cents, "COP"),
        },
    }


@api_router.get("/invitations/{inv_id}")
async def get_invitation(inv_id: str):
    doc = await db.invitations.find_one({"id": inv_id, "paid": True}, {"_id": 0, "edit_token": 0, "script_url": 0})
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
    doc["expired"] = _is_expired(doc.get("event_date", ""))
    return doc


@api_router.put("/invitations/{inv_id}")
async def update_invitation(inv_id: str, data: InvitationData, token: str = Query(...)):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if doc["edit_token"] != token:
        raise HTTPException(status_code=403, detail="Link de edición inválido")
    if _is_expired(doc.get("event_date", "")):
        raise HTTPException(status_code=403, detail="Esta invitación ya expiró porque el evento ya pasó. Crea una nueva invitación si necesitas otra.")
    if data.theme not in VALID_THEMES:
        raise HTTPException(status_code=400, detail="Temática inválida")
    if THEME_CATEGORY.get(data.theme) != THEME_CATEGORY.get(doc.get("theme")):
        raise HTTPException(status_code=400, detail="No puedes cambiar la categoría de una invitación ya creada (cumpleaños, boda, partido, etc). Crea una nueva invitación si quieres otra categoría.")
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


@api_router.get("/invitations/{inv_id}/rsvps")
async def list_rsvps(inv_id: str, token: str = Query(...)):
    doc = await db.invitations.find_one({"id": inv_id}, {"_id": 0, "edit_token": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Invitación no encontrada")
    if doc["edit_token"] != token:
        raise HTTPException(status_code=403, detail="Link de edición inválido")
    cursor = db.rsvps.find({"invitation_id": inv_id}, {"_id": 0}).sort("fecha_registro", -1)
    rsvps = await cursor.to_list(2000)
    return {"count": len(rsvps), "rsvps": rsvps}


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


# ============================================================================
# Pagos Wompi + panel "Mis ventas"
# ============================================================================

def _wompi_integrity_signature(reference: str, amount_in_cents: int, currency: str) -> str:
    """Firma de integridad que exige el Web Checkout de Wompi para que el monto/referencia
    no puedan alterarse desde el navegador: SHA-256 de <referencia><monto><moneda><secreto>."""
    concat = f"{reference}{amount_in_cents}{currency}{WOMPI_INTEGRITY_SECRET}"
    return hashlib.sha256(concat.encode("utf-8")).hexdigest()


def _wompi_checksum(body: dict) -> str:
    """Recalcula el checksum del evento según la documentación de Wompi:
    SHA-256 de la concatenación de los valores de signature.properties (en orden),
    el timestamp del evento y el secreto de eventos."""
    signature = body.get("signature") or {}
    props = signature.get("properties") or []
    data = body.get("data") or {}
    concat = ""
    for prop in props:
        val = data
        for part in str(prop).split("."):
            val = val.get(part, "") if isinstance(val, dict) else ""
        concat += str(val)
    concat += str(body.get("timestamp", ""))
    concat += WOMPI_EVENTS_SECRET
    return hashlib.sha256(concat.encode("utf-8")).hexdigest()


@api_router.post("/webhooks/wompi")
async def wompi_webhook(request: Request):
    """Recibe eventos de Wompi. Registra/actualiza la transacción en `payments`
    (idempotente por wompi_transaction_id) y, si queda APPROVED y la referencia
    es FIESTITA-<id>, marca la invitación como pagada."""
    if not WOMPI_EVENTS_SECRET:
        raise HTTPException(status_code=503, detail="Webhook de Wompi no configurado (falta WOMPI_EVENTS_SECRET)")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Cuerpo inválido")

    signature = body.get("signature") or {}
    expected = _wompi_checksum(body)
    received = str(signature.get("checksum", ""))
    if not received or not secrets.compare_digest(expected.lower(), received.lower()):
        raise HTTPException(status_code=403, detail="Firma de Wompi inválida")

    tx = (body.get("data") or {}).get("transaction") or {}
    if body.get("event") == "transaction.updated" and tx.get("id"):
        now = datetime.now(timezone.utc).isoformat()
        payment = {
            "wompi_transaction_id": tx.get("id", ""),
            "reference": tx.get("reference", ""),
            "status": tx.get("status", ""),
            "amount_in_cents": tx.get("amount_in_cents") or 0,
            "currency": tx.get("currency", "COP"),
            "payment_method_type": tx.get("payment_method_type", ""),
            "customer_email": tx.get("customer_email", ""),
            "finalized_at": tx.get("finalized_at", ""),
            "updated_at": now,
        }
        await db.payments.update_one(
            {"wompi_transaction_id": payment["wompi_transaction_id"]},
            {"$set": payment, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now}},
            upsert=True,
        )
        if payment["status"] == "APPROVED" and payment["reference"].startswith(PAYMENT_REFERENCE_PREFIX):
            inv_id = payment["reference"][len(PAYMENT_REFERENCE_PREFIX):]
            await db.invitations.update_one({"id": inv_id}, {"$set": {"paid": True, "paid_at": now}})

    return {"ok": True}


def _require_admin(request: Request) -> None:
    key = request.headers.get("X-Admin-Key", "")
    if not ADMIN_KEY or not key or not secrets.compare_digest(key, ADMIN_KEY):
        raise HTTPException(status_code=403, detail="No autorizado")


@api_router.post("/admin/invitations")
async def admin_create_invitation(data: AdminInvitationCreate, request: Request):
    """Crea una invitación ya marcada como pagada, sin pasar por Wompi, para cuando el
    administrador cobra por fuera (WhatsApp, efectivo, transferencia) y la crea a mano.
    También registra un pago APPROVED de tipo MANUAL para que aparezca en 'Mis ventas'."""
    _require_admin(request)
    if data.theme not in VALID_THEMES:
        raise HTTPException(status_code=400, detail="Temática inválida")
    _validate_invitation_links(data)

    inv_fields = data.model_dump(exclude={"amount_cop", "customer_email", "payment_note"})
    inv = Invitation(**inv_fields, paid=True)
    now = datetime.now(timezone.utc).isoformat()
    inv_doc = inv.model_dump()
    inv_doc["paid_at"] = now
    await db.invitations.insert_one(inv_doc)

    amount_cop = data.amount_cop if data.amount_cop is not None else INVITATION_PRICE_COP
    payment = {
        "id": str(uuid.uuid4()),
        "wompi_transaction_id": f"MANUAL-{inv.id}",
        "reference": f"{PAYMENT_REFERENCE_PREFIX}{inv.id}",
        "status": "APPROVED",
        "amount_in_cents": amount_cop * 100,
        "currency": "COP",
        "payment_method_type": "MANUAL",
        "customer_email": data.customer_email,
        "finalized_at": now,
        "created_at": now,
        "updated_at": now,
    }
    if data.payment_note:
        payment["payment_note"] = data.payment_note
    await db.payments.insert_one(payment)

    return {"id": inv.id, "edit_token": inv.edit_token}


@api_router.get("/admin/sales")
async def admin_sales(request: Request):
    """Panel privado: lista los pagos APPROVED de Wompi con la invitación asociada,
    total de ingresos en COP y desglose por mes. Requiere header X-Admin-Key."""
    _require_admin(request)

    payments = await db.payments.find({"status": "APPROVED"}, {"_id": 0}).sort("created_at", -1).to_list(2000)

    inv_ids = [
        p["reference"][len(PAYMENT_REFERENCE_PREFIX):]
        for p in payments
        if p.get("reference", "").startswith(PAYMENT_REFERENCE_PREFIX)
    ]
    inv_map = {}
    if inv_ids:
        cursor = db.invitations.find(
            {"id": {"$in": inv_ids}},
            {"_id": 0, "id": 1, "child_name": 1, "theme": 1, "event_date": 1, "paid": 1},
        )
        async for doc in cursor:
            inv_map[doc["id"]] = doc

    sales = []
    total_cents = 0
    by_month: dict = {}
    for p in payments:
        cents = p.get("amount_in_cents") or 0
        total_cents += cents
        month = (p.get("created_at") or "")[:7] or "sin-fecha"
        by_month[month] = by_month.get(month, 0) + cents
        ref = p.get("reference", "")
        inv = inv_map.get(ref[len(PAYMENT_REFERENCE_PREFIX):]) if ref.startswith(PAYMENT_REFERENCE_PREFIX) else None
        sales.append({**p, "invitation": inv})

    return {
        "count": len(sales),
        "total_cop": total_cents / 100,
        "by_month": [
            {"month": m, "total_cop": c / 100}
            for m, c in sorted(by_month.items(), reverse=True)
        ],
        "sales": sales,
    }


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
