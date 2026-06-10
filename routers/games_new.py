from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import random
import time

router = APIRouter(prefix="/api/games/new", tags=["games_new"])

# ─── Modelos ──────────────────────────────────────────────────────────────────

class SpinRequest(BaseModel):
    player_id: str
    bet: int
    game_id: str

class SpinResult(BaseModel):
    game_id: str
    reels: list[list[str]]
    win: int
    win_type: Optional[str]
    jackpot_contribution: int
    message: str
    new_balance: Optional[int] = None

class PenaltyKickRequest(BaseModel):
    player_id: str
    bet: int
    zone: int  # 0-5

class PenaltyResult(BaseModel):
    scored: bool
    goalkeeper_zone: int
    goals: int
    shots_left: int
    multiplier: int
    win: int
    message: str

class GameInfoResponse(BaseModel):
    game_id: str
    name: str
    category: str
    rtp: float
    min_bet: int
    max_bet: int
    jackpot: int
    description: str

# ─── Configuración de juegos ──────────────────────────────────────────────────

GAMES_CONFIG = {
    "triad_pigs_olympus": {
        "name": "The Triad Pigs of Olympus",
        "category": "Video Slot",
        "rtp": 96.5,
        "symbols": ["🐷","🏛️","⚡","🪙","🍇","🍋","🍒","⭐"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🐷":500,"🏛️":200,"⚡":100,"🪙":50,"🍇":20,"🍋":15,"🍒":10,"⭐":5},
        "jackpot_base": 8432,
        "description": "Tres cerdos en el Olimpo — apuesta y activa el Bonus Pot"
    },
    "penalty_pro_championship": {
        "name": "Penalty Pro Championship",
        "category": "Arcade",
        "rtp": 95.0,
        "jackpot_base": 5000,
        "description": "5 tiros a portería — consigue goles y multiplica"
    },
    "jolly_pigs_christmas": {
        "name": "Jolly Pigs Christmas Pot",
        "category": "Video Slot",
        "rtp": 96.0,
        "symbols": ["🐷","🎅","🎁","🪙","⭐","🔔","🍬","❄️"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🐷":500,"🎅":200,"🎁":100,"🪙":50,"⭐":25,"🔔":15,"🍬":10,"❄️":5},
        "jackpot_base": 12525,
        "description": "Navidad con los cerdos — Christmas Pot acumulado"
    },
    "gold_mine_blast": {
        "name": "Gold Mine Blast",
        "category": "Video Slot",
        "rtp": 96.2,
        "symbols": ["💎","🥇","💣","⛏️","🪨","🔦","🪣","🧱"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"💎":500,"🥇":200,"💣":100,"⛏️":50,"🪨":20,"🔦":15,"🪣":10,"🧱":5},
        "jackpot_base": 6789,
        "description": "Mina de oro — explota y extrae ganancias"
    },
    "inferno_phoenix_blaze": {
        "name": "Inferno Phoenix Blaze",
        "category": "Video Slot",
        "rtp": 97.0,
        "symbols": ["🦅","🔥","3️⃣","⚡","💀","🌋","🌊","💎"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🦅":500,"🔥":200,"3️⃣":150,"⚡":100,"💀":50,"🌋":25,"🌊":15,"💎":5},
        "jackpot_base": 33333,
        "description": "Fénix de fuego — el 333 trae poder"
    },
    "golden_goal_nations": {
        "name": "Golden Goal Nations",
        "category": "Video Slot",
        "rtp": 95.8,
        "symbols": ["🏆","⚽","🥇","🌟","🎽","🏟️","🎯","🏅"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🏆":500,"⚽":200,"🥇":100,"🌟":50,"🎽":25,"🏟️":15,"🎯":10,"🏅":5},
        "jackpot_base": 15000,
        "description": "Copa dorada de naciones — gol y a cobrar"
    },
    "steam_train_tycoon": {
        "name": "Steam Train Tycoon",
        "category": "Hold & Win",
        "rtp": 96.8,
        "symbols": ["🚂","💰","🥇","🎩","🔧","⚙️","🪙","🎫"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🚂":500,"💰":200,"🥇":100,"🎩":50,"🔧":30,"⚙️":20,"🪙":10,"🎫":5},
        "jackpot_base": 9876,
        "description": "Tren a vapor cargado de oro — Hold & Win"
    },
    "witchs_wicked_wares": {
        "name": "Witch's Wicked Wares",
        "category": "Video Slot",
        "rtp": 96.3,
        "symbols": ["🧙","🔮","🧪","⚗️","📜","🕯️","🦇","🌙"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🧙":500,"🔮":200,"🧪":100,"⚗️":50,"📜":25,"🕯️":15,"🦇":10,"🌙":5},
        "jackpot_base": 7777,
        "description": "Tienda de la bruja — pociones mágicas y premios"
    },
    "ufo_farm_abduction": {
        "name": "UFO Farm Abduction",
        "category": "Tapper",
        "rtp": 95.5,
        "symbols": ["🛸","🐄","👽","⭐","🌽","🌾","🐖","🚜"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🛸":500,"🐄":200,"👽":100,"⭐":50,"🌽":25,"🌾":15,"🐖":10,"🚜":5},
        "jackpot_base": 4200,
        "description": "Abducción en la granja — el OVNI rapta tus ganancias"
    },
    "sky_eagle_cash": {
        "name": "Sky Eagle Cash Collect",
        "category": "Cash Collect",
        "rtp": 96.6,
        "symbols": ["🦅","💰","🌅","🏔️","🪶","🌵","🏜️","💎"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🦅":500,"💰":200,"🌅":100,"🏔️":50,"🪶":25,"🌵":15,"🏜️":10,"💎":5},
        "jackpot_base": 11111,
        "description": "Águila americana — recoge el cash antes de volar"
    },
    "viking_raidmark": {
        "name": "Viking Raidmark",
        "category": "Video Slot",
        "rtp": 96.9,
        "symbols": ["⚔️","🛡️","🪓","⛵","🏰","🐉","🧊","💀"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"⚔️":500,"🛡️":200,"🪓":100,"⛵":50,"🏰":25,"🐉":20,"🧊":10,"💀":5},
        "jackpot_base": 13337,
        "description": "Vikings raideando — runas de poder en los rodillos"
    },
    "mystic_genie_dreams": {
        "name": "Mystic Genie Dreams",
        "category": "Video Slot",
        "rtp": 96.4,
        "symbols": ["🧞","🪔","💜","👑","✨","🌙","🎭","💎"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🧞":500,"🪔":200,"💜":100,"👑":50,"✨":25,"🌙":15,"🎭":10,"💎":5},
        "jackpot_base": 19999,
        "description": "El genio concede 3 deseos — y el tercero es jackpot"
    },
    "outlaw_roadquake": {
        "name": "Outlaw Roadquake",
        "category": "Video Slot",
        "rtp": 95.7,
        "symbols": ["🏍️","💣","☠️","🔧","⛽","🔥","🌪️","💀"],
        "weights": [1,2,3,5,8,10,12,15],
        "pays": {"🏍️":500,"💣":200,"☠️":100,"🔧":50,"⛽":25,"🔥":15,"🌪️":10,"💀":5},
        "jackpot_base": 5555,
        "description": "Biker post-apocalíptico — rode o muere"
    },
}

# Jackpots en memoria (en producción usar BD)
_jackpots = {gid: cfg["jackpot_base"] for gid, cfg in GAMES_CONFIG.items()}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def weighted_choice(symbols: list, weights: list) -> str:
    total = sum(weights)
    r = random.uniform(0, total)
    cumul = 0
    for sym, w in zip(symbols, weights):
        cumul += w
        if r < cumul:
            return sym
    return symbols[-1]

def evaluate_reels(reels: list[list[str]], pays: dict, bet: int) -> tuple[int, str]:
    """Evaluate middle row win."""
    middle = [row[1] for row in reels]
    counts: dict = {}
    for s in middle:
        counts[s] = counts.get(s, 0) + 1
    best_sym, best_count = "", 0
    for sym, cnt in counts.items():
        if cnt >= 3 and cnt > best_count:
            best_count = cnt
            best_sym = sym
    if best_count >= 3:
        multiplier = 5 if best_count == 5 else (3 if best_count == 4 else 1)
        win = int(pays[best_sym] * bet * multiplier)
        if win >= bet * 50:
            return win, "MEGA_WIN"
        elif win >= bet * 20:
            return win, "BIG_WIN"
        else:
            return win, "WIN"
    return 0, ""

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/list", response_model=list[GameInfoResponse])
async def list_new_games():
    """Lista todos los nuevos juegos con su info."""
    result = []
    for gid, cfg in GAMES_CONFIG.items():
        result.append(GameInfoResponse(
            game_id=gid,
            name=cfg["name"],
            category=cfg["category"],
            rtp=cfg["rtp"],
            min_bet=1,
            max_bet=100,
            jackpot=_jackpots[gid],
            description=cfg["description"],
        ))
    return result

@router.get("/info/{game_id}", response_model=GameInfoResponse)
async def get_game_info(game_id: str):
    """Info de un juego concreto."""
    if game_id not in GAMES_CONFIG:
        raise HTTPException(status_code=404, detail=f"Juego '{game_id}' no encontrado")
    cfg = GAMES_CONFIG[game_id]
    return GameInfoResponse(
        game_id=game_id,
        name=cfg["name"],
        category=cfg["category"],
        rtp=cfg["rtp"],
        min_bet=1,
        max_bet=100,
        jackpot=_jackpots[game_id],
        description=cfg["description"],
    )

@router.get("/jackpots")
async def get_all_jackpots():
    """Devuelve todos los jackpots actuales."""
    # Simulamos crecimiento orgánico
    for gid in _jackpots:
        _jackpots[gid] += random.randint(1, 5)
    return {"jackpots": _jackpots, "timestamp": int(time.time())}

@router.post("/spin", response_model=SpinResult)
async def spin_slot(req: SpinRequest):
    """Gira los rodillos de un slot."""
    game_id = req.game_id
    if game_id not in GAMES_CONFIG:
        raise HTTPException(status_code=404, detail=f"Juego '{game_id}' no encontrado")
    cfg = GAMES_CONFIG[game_id]
    if "symbols" not in cfg:
        raise HTTPException(status_code=400, detail="Este juego no es un slot de rodillos")
    
    symbols = cfg["symbols"]
    weights = cfg["weights"]
    pays = cfg["pays"]
    
    # Generar 5 rodillos × 3 filas
    reels = [[weighted_choice(symbols, weights) for _ in range(3)] for _ in range(5)]
    
    win, win_type = evaluate_reels(reels, pays, req.bet)
    
    # Contribución al jackpot
    jackpot_contrib = max(1, int(req.bet * 0.1))
    _jackpots[game_id] += jackpot_contrib
    
    messages = {
        "MEGA_WIN": f"🔥 MEGA WIN! +{win} créditos",
        "BIG_WIN": f"⭐ BIG WIN! +{win} créditos",
        "WIN": f"🎯 Win: +{win} créditos",
        "": "Sin premio esta tirada",
    }
    
    return SpinResult(
        game_id=game_id,
        reels=reels,
        win=win,
        win_type=win_type or None,
        jackpot_contribution=jackpot_contrib,
        message=messages.get(win_type, ""),
    )
