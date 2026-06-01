# routers/battlepass_leagues.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from core.database import DB, init_user_data

router = APIRouter(prefix="/api/progression", tags=["Progreso: Pase y Ligas"])

XP_PER_LEVEL = 100


class BattlepassClaimRequest(BaseModel):
    level: int = Field(..., ge=1)
    reward_type: str = "free"


def ensure_progression_user(username: str):
    """Valida que el usuario exista y tenga sus perfiles de progreso creados."""
    if username not in DB["users"] and username not in DB["battlepass"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if username in DB["users"]:
        init_user_data(username)

    if username not in DB["battlepass"] or username not in DB["wallets"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")


def get_battlepass_reward(level: int, reward_type: str):
    """Devuelve la recompensa del nivel solicitado.

    El catálogo actual concede créditos en todos los niveles gratuitos. Dejar el
    tipo en el payload permite extender el pase a recompensas VIP/cosméticas sin
    cambiar el endpoint.
    """
    normalized_type = reward_type.strip().lower()
    if normalized_type != "free":
        raise HTTPException(status_code=404, detail="Recompensa no encontrada")

    return {
        "level": level,
        "reward_type": normalized_type,
        "reward_kind": "credits",
        "amount": level * 100,
    }


def build_battlepass_summary(username: str):
    data = DB["battlepass"][username]
    total_xp = data.get("xp", 0)
    return {
        "level": data.get("level", 1),
        "xp": total_xp % XP_PER_LEVEL,
        "total_xp": total_xp,
        "xp_needed": XP_PER_LEVEL,
        "claimed_rewards": data.setdefault("claimed_rewards", []),
    }


@router.get("/battlepass/{username}")
async def get_battlepass(username: str):
    ensure_progression_user(username)
    return build_battlepass_summary(username)


@router.post("/battlepass/{username}/claim")
async def claim_battlepass_reward(username: str, request: BattlepassClaimRequest):
    ensure_progression_user(username)

    battlepass = DB["battlepass"][username]
    current_level = battlepass.get("level", 1)
    if request.level > current_level:
        raise HTTPException(status_code=400, detail="Nivel no alcanzado")

    reward = get_battlepass_reward(request.level, request.reward_type)
    reward_key = f"{reward['reward_type']}:{request.level}"
    claimed_rewards = battlepass.setdefault("claimed_rewards", [])

    # Compatibilidad con datos antiguos que pudieran guardar solo el número.
    if reward_key in claimed_rewards or request.level in claimed_rewards:
        raise HTTPException(status_code=400, detail="Recompensa ya reclamada")

    if reward["reward_kind"] == "credits":
        DB["wallets"][username] += reward["amount"]

    claimed_rewards.append(reward_key)

    return {
        "status": "success",
        "reward": reward,
        "battlepass": build_battlepass_summary(username),
        "new_balance": DB["wallets"][username],
    }


@router.get("/leagues/leaderboard")
async def get_leaderboard():
    # Ordenar ranking de usuarios eficazmente de mayor a menor puntuación
    leaderboard = []
    for user, data in DB["leagues"].items():
        leaderboard.append({
            "username": user,
            "points": data["points"],
            "rank": data["rank"]
        })
    leaderboard.sort(key=lambda x: x["points"], reverse=True)
    return {"leaderboard": leaderboard}
