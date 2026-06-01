# routers/games.py
from typing import Any, Dict, List, Optional
import random

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from core.database import DB

router = APIRouter(prefix="/api/games", tags=["Juegos Arcade"])

XP_PER_LEVEL = 100

KENO_PAYTABLE = {
    1: {1: 3},
    2: {2: 10, 1: 1},
    3: {3: 25, 2: 2},
    4: {4: 80, 3: 5, 2: 1},
    5: {5: 200, 4: 15, 3: 3},
    6: {6: 500, 5: 50, 4: 8, 3: 1},
    7: {7: 1500, 6: 100, 5: 20, 4: 3},
    8: {8: 5000, 7: 500, 6: 80, 5: 10, 4: 2},
    9: {9: 8000, 8: 1000, 7: 150, 6: 20, 5: 4},
    10: {10: 10000, 9: 2000, 8: 300, 7: 50, 6: 10, 5: 2},
}

SLOTS_SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "7️⃣"]
MAGIC_TRAKKA_SYMBOLS = ["🪄", "💎", "🐉", "🌙", "✨"]
ROULETTE_NUMBERS = list(range(37))
ROULETTE_COLORS = {
    0: "green",
    **{n: "red" for n in range(1, 37, 2)},
    **{n: "black" for n in range(2, 37, 2)},
}


class GameBetRequest(BaseModel):
    username: str
    game: str
    bet: int


class GameResultRequest(GameBetRequest):
    win: int


class GameProgressResponse(BaseModel):
    new_balance: int
    xp: int
    battlepass_level: int
    league_points: int
    insufficient_funds: bool = False


class KenoPlayRequest(GameBetRequest):
    game: str = "keno"
    numbers: List[int]


class MinesStartRequest(GameBetRequest):
    game: str = "mines"
    mines_count: int


# Función interna auxiliar para recompensar el juego en el Pase de Batalla y Ligas
def reward_activity(username: str, xp_gain: int, league_points: int):
    if username in DB["battlepass"]:
        DB["battlepass"][username]["xp"] += xp_gain
        # Subida de nivel automática (ej: cada 100 XP)
        current_xp = DB["battlepass"][username]["xp"]
        DB["battlepass"][username]["level"] = (current_xp // 100) + 1

    if username in DB["leagues"]:
        DB["leagues"][username]["points"] += league_points
        # Actualización de rango por puntos de liga
        pts = DB["leagues"][username]["points"]
        if pts > 500:
            DB["leagues"][username]["rank"] = "Oro"
        elif pts > 200:
            DB["leagues"][username]["rank"] = "Plata"


def _progress_payload(username: str) -> Dict[str, Any]:
    battlepass = DB["battlepass"].get(username, {})
    league = DB["leagues"].get(username, {})
    return {
        "new_balance": DB["wallets"][username],
        "xp": battlepass.get("xp", 0),
        "battlepass_level": battlepass.get("level", 1),
        "league_points": league.get("points", 0),
        "insufficient_funds": False,
    }


def _insufficient_funds_response(username: str) -> JSONResponse:
    return JSONResponse(
        status_code=402,
        content={
            "detail": "INSUFFICIENT_FUNDS",
            "open_shop": True,
            "balance": DB["wallets"][username],
            "insufficient_funds": True,
        },
    )


def _validate_username_and_bet(username: str, bet: int) -> Optional[JSONResponse]:
    if username not in DB["wallets"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if bet <= 0:
        raise HTTPException(status_code=400, detail="La apuesta debe ser mayor que 0")
    if DB["wallets"][username] < bet:
        return _insufficient_funds_response(username)
    return None


def _settle_bet(
    username: str,
    bet: int,
    win_amount: int,
    xp_gain: int,
    league_points: int,
) -> Dict[str, Any]:
    DB["wallets"][username] -= bet
    DB["wallets"][username] += max(win_amount, 0)
    reward_activity(username, xp_gain=xp_gain, league_points=league_points)
    return _progress_payload(username)


def _settle_accepted_result(
    request: GameResultRequest,
    xp_gain: int,
    league_points: int,
) -> Dict[str, Any]:
    validation_error = _validate_username_and_bet(request.username, request.bet)
    if validation_error:
        return validation_error
    if request.win < 0:
        raise HTTPException(status_code=400, detail="La ganancia no puede ser negativa")

    payload = _settle_bet(request.username, request.bet, request.win, xp_gain, league_points)
    payload.update({"game": request.game, "win_amount": request.win})
    return payload


def _random_multiplier(chances: List[tuple[float, int]]) -> int:
    roll = random.random()
    cumulative = 0.0
    for probability, multiplier in chances:
        cumulative += probability
        if roll <= cumulative:
            return multiplier
    return 0


@router.post("/slots/spin")
async def spin_slots(request: GameBetRequest):
    validation_error = _validate_username_and_bet(request.username, request.bet)
    if validation_error:
        return validation_error

    reels = [random.choice(SLOTS_SYMBOLS) for _ in range(3)]
    if len(set(reels)) == 1:
        multiplier = 12 if reels[0] == "7️⃣" else 6
    elif len(set(reels)) == 2:
        multiplier = 2
    else:
        multiplier = 0
    win_amount = request.bet * multiplier

    payload = _settle_bet(request.username, request.bet, win_amount, xp_gain=10, league_points=5)
    payload.update({
        "game": request.game,
        "reels": reels,
        "multiplier": multiplier,
        "win_amount": win_amount,
    })
    return payload


@router.post("/magic-trakka/spin")
async def spin_magic_trakka(request: GameBetRequest):
    validation_error = _validate_username_and_bet(request.username, request.bet)
    if validation_error:
        return validation_error

    reels = [random.choice(MAGIC_TRAKKA_SYMBOLS) for _ in range(3)]
    if len(set(reels)) == 1:
        multiplier = 15 if reels[0] == "💎" else 7
    elif "🪄" in reels and "✨" in reels:
        multiplier = 3
    else:
        multiplier = 0
    win_amount = request.bet * multiplier

    payload = _settle_bet(request.username, request.bet, win_amount, xp_gain=12, league_points=6)
    payload.update({
        "game": request.game,
        "reels": reels,
        "multiplier": multiplier,
        "win_amount": win_amount,
    })
    return payload


@router.post("/blackjack/play")
async def play_blackjack(request: GameResultRequest):
    return _settle_accepted_result(request, xp_gain=12, league_points=6)


@router.post("/roulette/spin")
async def spin_roulette(request: GameBetRequest):
    validation_error = _validate_username_and_bet(request.username, request.bet)
    if validation_error:
        return validation_error

    number = random.choice(ROULETTE_NUMBERS)
    color = ROULETTE_COLORS[number]
    multiplier = 14 if number == 0 else _random_multiplier([(0.45, 2), (0.55, 0)])
    win_amount = request.bet * multiplier

    payload = _settle_bet(request.username, request.bet, win_amount, xp_gain=10, league_points=5)
    payload.update({
        "game": request.game,
        "number": number,
        "color": color,
        "multiplier": multiplier,
        "win_amount": win_amount,
    })
    return payload


@router.post("/poker/hand")
async def play_poker_hand(request: GameResultRequest):
    return _settle_accepted_result(request, xp_gain=15, league_points=8)


@router.post("/crash/play")
async def play_crash(request: GameBetRequest):
    validation_error = _validate_username_and_bet(request.username, request.bet)
    if validation_error:
        return validation_error

    crash_point = round(random.uniform(1.0, 5.0), 2)
    multiplier = 2 if crash_point >= 2.0 else 0
    win_amount = request.bet * multiplier

    payload = _settle_bet(request.username, request.bet, win_amount, xp_gain=10, league_points=5)
    payload.update({
        "game": request.game,
        "crash_point": crash_point,
        "multiplier": multiplier,
        "win_amount": win_amount,
    })
    return payload


@router.post("/three-in-one/play")
async def play_three_in_one(request: GameResultRequest):
    return _settle_accepted_result(request, xp_gain=15, league_points=8)


@router.post("/keno/play")
async def play_keno(request: KenoPlayRequest):
    validation_error = _validate_username_and_bet(request.username, request.bet)
    if validation_error:
        return validation_error
    if len(request.numbers) < 1 or len(request.numbers) > 10:
        raise HTTPException(status_code=400, detail="Elige entre 1 y 10 números")
    if len(set(request.numbers)) != len(request.numbers):
        raise HTTPException(status_code=400, detail="Los números elegidos no pueden repetirse")
    if any(number < 1 or number > 80 for number in request.numbers):
        raise HTTPException(status_code=400, detail="Los números deben estar entre 1 y 80")

    winning_numbers = sorted(random.sample(range(1, 81), 20))
    hits = sorted(set(request.numbers).intersection(set(winning_numbers)))
    hit_count = len(hits)
    multiplier = KENO_PAYTABLE.get(len(request.numbers), {}).get(hit_count, 0)
    win_amount = request.bet * multiplier

    payload = _settle_bet(request.username, request.bet, win_amount, xp_gain=10, league_points=5)
    payload.update({
        "game": request.game,
        "winning_numbers": winning_numbers,
        "hits": hit_count,
        "hit_numbers": hits,
        "multiplier": multiplier,
        "win_amount": win_amount,
    })
    return payload



@router.post("/mines/start")
async def start_mines(request: MinesStartRequest):
    validation_error = _validate_username_and_bet(request.username, request.bet)
    if validation_error:
        return validation_error
    if request.mines_count < 1 or request.mines_count > 24:
        raise HTTPException(status_code=400, detail="Número de minas inválido")

    mine_positions = random.sample(range(25), request.mines_count)
    payload = _settle_bet(request.username, request.bet, win_amount=0, xp_gain=15, league_points=8)
    payload.update({
        "status": "success",
        "game": request.game,
        "mine_positions_hidden_debug": mine_positions,  # Borrar o encriptar en prod
    })
    return payload
