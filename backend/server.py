from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
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
