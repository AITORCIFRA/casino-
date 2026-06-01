# routers/battlepass_leagues.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from core.database import (
    ensure_user,
    get_battlepass,
    update_battlepass,
    get_league,
    update_league,
    get_balance,
    set_balance,
    add_transaction
)

router = APIRouter(prefix="/api/progression", tags=["Progreso: Pase y Ligas"])

XP_PER_LEVEL = 100

class BattlepassClaimRequest(BaseModel):
    level: int = Field(..., ge=1)
    reward_type: str = "free"

def get_battlepass_reward(level: int, reward_type: str):
    """Devuelve la recompensa del nivel solicitado."""
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
    bp = get_battlepass(username)
    total_xp = bp["xp"]
    return {
        "level": bp["level"],
        "xp": total_xp % XP_PER_LEVEL,
        "total_xp": total_xp,
        "xp_needed": XP_PER_LEVEL,
        "claimed_rewards": bp["claimed_rewards"],
    }

@router.get("/battlepass/{username}")
async def get_battlepass_endpoint(username: str):
    ensure_user(username)
    return build_battlepass_summary(username)

@router.post("/battlepass/{username}/claim")
async def claim_battlepass_reward(username: str, request: BattlepassClaimRequest):
    ensure_user(username)
    bp = get_battlepass(username)
    current_level = bp["level"]
    if request.level > current_level:
        raise HTTPException(status_code=400, detail="Nivel no alcanzado")

    reward = get_battlepass_reward(request.level, request.reward_type)
    reward_key = f"{reward['reward_type']}:{request.level}"
    claimed_rewards = bp["claimed_rewards"]

    if reward_key in claimed_rewards or str(request.level) in claimed_rewards:
        raise HTTPException(status_code=400, detail="Recompensa ya reclamada")

    if reward["reward_kind"] == "credits":
        current_balance = get_balance(username)
        new_balance = current_balance + reward["amount"]
        set_balance(username, new_balance)
        add_transaction(username, "compra_tienda", "battlepass", reward["amount"], new_balance)

    claimed_rewards.append(reward_key)
    # Guardar claimed_rewards en la BD (necesitamos una función para actualizarlos)
    # Por ahora, actualizamos el campo claimed_rewards en la tabla battlepass
    conn = None
    try:
        from core.database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        import json
        cursor.execute(
            "UPDATE battlepass SET claimed_rewards = %s WHERE username = %s",
            (json.dumps(claimed_rewards), username)
        )
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            cursor.close()
            conn.close()

    return {
        "status": "success",
        "reward": reward,
        "battlepass": build_battlepass_summary(username),
        "new_balance": get_balance(username),
    }

@router.get("/leagues/leaderboard")
async def get_leaderboard():
    from core.database import get_db_connection
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    cursor = conn.cursor()
    cursor.execute("SELECT username, points, rank_name FROM leagues ORDER BY points DESC LIMIT 50")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    leaderboard = [{"username": row[0], "points": row[1], "rank": row[2]} for row in rows]
    return {"leaderboard": leaderboard}