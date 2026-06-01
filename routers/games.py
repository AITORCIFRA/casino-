# routers/games.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import random
from core.database import DB, init_user_data

router = APIRouter(prefix="/api/games", tags=["Juegos Arcade"])

XP_PER_LEVEL = 100

KENO_PAYTABLE = {
    1: {1: 3}, 2: {2: 10, 1: 1}, 3: {3: 25, 2: 2},
    4: {4: 80, 3: 5, 2: 1}, 5: {5: 200, 4: 15, 3: 3}
}

class KenoPlayRequest(BaseModel):
    username: str
    numbers: List[int]
    bet: int

class MinesStartRequest(BaseModel):
    username: str
    bet: int
    mines_count: int


def ensure_game_user(username: str):
    """Valida el usuario y asegura que los juegos siempre actualicen progreso."""
    if username not in DB["users"] and username not in DB["wallets"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if username in DB["users"]:
        init_user_data(username)

    if username not in DB["wallets"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if username not in DB["battlepass"]:
        DB["battlepass"][username] = {
            "level": 1,
            "xp": 0,
            "claimed_rewards": []
        }

    if username not in DB["leagues"]:
        DB["leagues"][username] = {
            "points": 0,
            "rank": "Bronce"
        }


def get_progress_snapshot(username: str):
    battlepass = DB["battlepass"][username]
    league = DB["leagues"][username]
    total_xp = battlepass.get("xp", 0)

    return {
        "battlepass": {
            "level": battlepass.get("level", 1),
            "xp": total_xp % XP_PER_LEVEL,
            "total_xp": total_xp,
            "xp_needed": XP_PER_LEVEL,
        },
        "league": {
            "points": league.get("points", 0),
            "rank": league.get("rank", "Bronce"),
        },
        "new_balance": DB["wallets"][username],
    }


# Función interna auxiliar para recompensar el juego en el Pase de Batalla y Ligas
def reward_activity(username: str, xp_gain: int, league_points: int):
    ensure_game_user(username)

    DB["battlepass"][username]["xp"] += xp_gain
    # Subida de nivel automática (ej: cada 100 XP)
    current_xp = DB["battlepass"][username]["xp"]
    DB["battlepass"][username]["level"] = (current_xp // XP_PER_LEVEL) + 1

    DB["leagues"][username]["points"] += league_points
    # Actualización de rango por puntos de liga
    pts = DB["leagues"][username]["points"]
    if pts > 500:
        DB["leagues"][username]["rank"] = "Oro"
    elif pts > 200:
        DB["leagues"][username]["rank"] = "Plata"
    else:
        DB["leagues"][username]["rank"] = "Bronce"


@router.post("/keno/play")
async def play_keno(request: KenoPlayRequest):
    username = request.username
    ensure_game_user(username)
    if DB["wallets"][username] < request.bet or request.bet <= 0:
        raise HTTPException(status_code=400, detail="Saldo insuficiente o apuesta inválida")
    if len(request.numbers) < 1 or len(request.numbers) > 5:
        raise HTTPException(status_code=400, detail="Elige entre 1 y 5 números")
    if len(set(request.numbers)) != len(request.numbers) or any(n < 1 or n > 80 for n in request.numbers):
        raise HTTPException(status_code=400, detail="Números de Keno inválidos")

    # Descontar apuesta
    DB["wallets"][username] -= request.bet

    # Lógica del Keno
    winning_numbers = sorted(random.sample(range(1, 81), 20))
    hits = list(set(request.numbers).intersection(set(winning_numbers)))
    hit_count = len(hits)

    multiplier = KENO_PAYTABLE.get(len(request.numbers), {}).get(hit_count, 0)
    win_amount = request.bet * multiplier

    # Añadir ganancias
    DB["wallets"][username] += win_amount

    # Dar recompensas por jugar (10 XP de Pase y 5 Puntos de Liga)
    reward_activity(username, xp_gain=10, league_points=5)

    return {
        "winning_numbers": winning_numbers,
        "hits": hit_count,
        "win_amount": win_amount,
        **get_progress_snapshot(username),
    }


@router.post("/mines/start")
async def start_mines(request: MinesStartRequest):
    username = request.username
    ensure_game_user(username)
    if DB["wallets"][username] < request.bet or request.bet <= 0:
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
    if request.mines_count < 1 or request.mines_count > 24:
        raise HTTPException(status_code=400, detail="Número de minas inválido")

    DB["wallets"][username] -= request.bet
    mine_positions = random.sample(range(25), request.mines_count)

    reward_activity(username, xp_gain=15, league_points=8)

    return {
        "status": "success",
        "mine_positions_hidden_debug": mine_positions, # Borrar o encriptar en prod
        **get_progress_snapshot(username),
    }
