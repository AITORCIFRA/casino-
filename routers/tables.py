# routers/tables.py — Sistema de Mesas y Cuotas de Entrada
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import time
import random
from core.database import get_db_connection, get_balance

router = APIRouter(prefix="/api/tables", tags=["Mesas"])

# Configuración de las 10 mesas
MESAS = [
    {"nivel": 1, "nombre": "Escuela de Novatos",   "buy_in": 100,       "min_bet": 2,       "max_bet": 40,        "color": "#00FF99", "max_jugadores": 10},
    {"nivel": 2, "nombre": "Pub de la Esquina",    "buy_in": 500,       "min_bet": 10,      "max_bet": 200,       "color": "#00BFFF", "max_jugadores": 10},
    {"nivel": 3, "nombre": "Sala Bronce",          "buy_in": 2500,      "min_bet": 50,      "max_bet": 1000,      "color": "#CD7F32", "max_jugadores": 10},
    {"nivel": 4, "nombre": "Club Plata",           "buy_in": 10000,     "min_bet": 200,     "max_bet": 4000,      "color": "#C0C0C0", "max_jugadores": 10},
    {"nivel": 5, "nombre": "Casino Oro",           "buy_in": 50000,     "min_bet": 1000,    "max_bet": 20000,     "color": "#FFD700", "max_jugadores": 10},
    {"nivel": 6, "nombre": "Salón Platino",        "buy_in": 250000,    "min_bet": 5000,    "max_bet": 100000,    "color": "#E5E4E2", "max_jugadores": 10},
    {"nivel": 7, "nombre": "Liga Diamante",        "buy_in": 1000000,   "min_bet": 20000,   "max_bet": 400000,    "color": "#B9F2FF", "max_jugadores": 10},
    {"nivel": 8, "nombre": "Club de Caballeros",   "buy_in": 5000000,   "min_bet": 100000,  "max_bet": 2000000,   "color": "#FF1493", "max_jugadores": 10},
    {"nivel": 9, "nombre": "Salón de la Fama",     "buy_in": 25000000,  "min_bet": 500000,  "max_bet": 10000000,  "color": "#FFD700", "max_jugadores": 10},
    {"nivel": 10,"nombre": "Mesa VIP Imperial",    "buy_in": 100000000, "min_bet": 2000000, "max_bet": 40000000,  "color": "#FF6347", "max_jugadores": 10},
]

# Almacenamiento en memoria de salas activas: {room_id: {game, mesa_nivel, jugadores, created_at}}
_rooms: dict = {}

class JoinTableRequest(BaseModel):
    username: str
    game: str
    mesa_nivel: int

class LeaveTableRequest(BaseModel):
    username: str
    room_id: str

def _cleanup_old_rooms():
    """Elimina salas inactivas de más de 30 minutos."""
    now = time.time()
    to_delete = [rid for rid, r in _rooms.items() if now - r["created_at"] > 1800]
    for rid in to_delete:
        del _rooms[rid]

def _get_or_create_room(game: str, mesa_nivel: int) -> str:
    """Busca una sala disponible o crea una nueva."""
    _cleanup_old_rooms()
    for rid, room in _rooms.items():
        if room["game"] == game and room["mesa_nivel"] == mesa_nivel and len(room["jugadores"]) < 10:
            return rid
    room_id = f"{game}_{mesa_nivel}_{int(time.time())}_{random.randint(1000,9999)}"
    _rooms[room_id] = {
        "game": game,
        "mesa_nivel": mesa_nivel,
        "jugadores": [],
        "created_at": time.time()
    }
    return room_id

@router.get("/mesas")
async def get_mesas():
    """Devuelve la configuración de las 10 mesas."""
    return {"mesas": MESAS}

@router.get("/mesas/{game}")
async def get_mesas_game(game: str):
    """Devuelve las mesas con el número de jugadores activos para un juego."""
    _cleanup_old_rooms()
    result = []
    for mesa in MESAS:
        nivel = mesa["nivel"]
        # Contar jugadores en salas de esta mesa y juego
        jugadores_activos = sum(
            len(r["jugadores"])
            for r in _rooms.values()
            if r["game"] == game and r["mesa_nivel"] == nivel
        )
        result.append({**mesa, "jugadores_activos": jugadores_activos})
    return {"mesas": result, "game": game}

@router.post("/join")
async def join_table(req: JoinTableRequest):
    """Une a un jugador a una mesa. Verifica que tenga suficientes fichas."""
    # Verificar balance (get_balance devuelve int directamente)
    balance = get_balance(req.username) or 0

    mesa = next((m for m in MESAS if m["nivel"] == req.mesa_nivel), None)
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    if balance < mesa["buy_in"]:
        raise HTTPException(
            status_code=400,
            detail=f"Fichas insuficientes. Necesitas {mesa['buy_in']:,} para esta mesa."
        )

    room_id = _get_or_create_room(req.game, req.mesa_nivel)
    room = _rooms[room_id]

    # Quitar al jugador de otras salas del mismo juego
    for rid, r in _rooms.items():
        if rid != room_id and req.username in r["jugadores"] and r["game"] == req.game:
            r["jugadores"].remove(req.username)

    if req.username not in room["jugadores"]:
        room["jugadores"].append(req.username)

    return {
        "status": "joined",
        "room_id": room_id,
        "mesa": mesa,
        "jugadores": room["jugadores"],
        "jugadores_count": len(room["jugadores"])
    }

@router.post("/leave")
async def leave_table(req: LeaveTableRequest):
    """Saca a un jugador de su sala."""
    if req.room_id in _rooms:
        room = _rooms[req.room_id]
        if req.username in room["jugadores"]:
            room["jugadores"].remove(req.username)
        if not room["jugadores"]:
            del _rooms[req.room_id]
    return {"status": "left"}

@router.get("/room/{room_id}")
async def get_room(room_id: str):
    """Devuelve el estado de una sala."""
    if room_id not in _rooms:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    room = _rooms[room_id]
    mesa = next((m for m in MESAS if m["nivel"] == room["mesa_nivel"]), MESAS[0])
    return {
        "room_id": room_id,
        "game": room["game"],
        "mesa": mesa,
        "jugadores": room["jugadores"],
        "jugadores_count": len(room["jugadores"])
    }

@router.get("/auto/{username}/{game}")
async def auto_select_table(username: str, game: str):
    """Selecciona automáticamente la mesa más alta disponible para el jugador."""
    balance = get_balance(username) or 0

    best_mesa = MESAS[0]
    for mesa in MESAS:
        if balance >= mesa["buy_in"]:
            best_mesa = mesa
        else:
            break

    return {
        "username": username,
        "balance": balance,
        "mesa_recomendada": best_mesa,
        "mesas_disponibles": [m for m in MESAS if balance >= m["buy_in"]]
    }
