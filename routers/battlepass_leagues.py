# routers/battlepass_leagues.py
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import json
from core.database import (
    ensure_user,
    get_battlepass,
    update_battlepass,
    get_league,
    update_league,
    get_balance,
    set_balance,
    add_transaction,
    get_db_connection
)

router = APIRouter(prefix="/api/progression", tags=["Progreso: Pase y Ligas"])

XP_PER_LEVEL = 100

class BattlepassClaimRequest(BaseModel):
    level: int = Field(..., ge=1)
    reward_type: str = "free"

def get_battlepass_reward(level: int, reward_type: str) -> Dict[str, Any]:
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

def build_battlepass_summary(username: str) -> Dict[str, Any]:
    bp = get_battlepass(username)
    total_xp_val = bp.get("xp", 0)
    total_xp = int(total_xp_val) if isinstance(total_xp_val, (int, float, str)) else 0
    level_val = bp.get("level", 1)
    level = int(level_val) if isinstance(level_val, (int, float, str)) else 1
    return {
        "level": level,
        "xp": total_xp % XP_PER_LEVEL,
        "total_xp": total_xp,
        "xp_needed": XP_PER_LEVEL,
        "claimed_rewards": bp.get("claimed_rewards", []),
    }

@router.get("/battlepass/{username}")
async def get_battlepass_endpoint(username: str):
    ensure_user(username)
    return build_battlepass_summary(username)

@router.post("/battlepass/{username}/claim")
async def claim_battlepass_reward(username: str, request: BattlepassClaimRequest):
    ensure_user(username)
    bp = get_battlepass(username)
    level_val = bp.get("level", 1)
    current_level = int(level_val) if isinstance(level_val, (int, float, str)) else 1
    if request.level > current_level:
        raise HTTPException(status_code=400, detail="Nivel no alcanzado")

    reward = get_battlepass_reward(request.level, request.reward_type)
    reward_key = f"{reward['reward_type']}:{request.level}"
    claimed_rewards = bp.get("claimed_rewards", [])

    if not isinstance(claimed_rewards, list):
        claimed_rewards = []

    if reward_key in claimed_rewards or str(request.level) in claimed_rewards:
        raise HTTPException(status_code=400, detail="Recompensa ya reclamada")

    if reward["reward_kind"] == "credits":
        current_balance = get_balance(username)
        amt_val = reward["amount"]
        amount = int(amt_val) if isinstance(amt_val, (int, float, str)) else 0
        new_balance = current_balance + amount
        set_balance(username, new_balance)
        add_transaction(username, "compra_tienda", "battlepass", amount, new_balance)

    claimed_rewards.append(reward_key)
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    try:
        cursor = conn.cursor(buffered=True)
        if not cursor:
             raise HTTPException(status_code=500, detail="Error al crear cursor")
        
        cursor.execute(
            "UPDATE battlepass SET claimed_rewards = %s WHERE username = %s",
            (json.dumps(claimed_rewards), username)
        )
        conn.commit()
        cursor.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    return {
        "status": "success",
        "reward": reward,
        "battlepass": build_battlepass_summary(username),
        "new_balance": get_balance(username),
    }

@router.get("/leagues/leaderboard")
async def get_leaderboard():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    try:
        cursor = conn.cursor(buffered=True)
        if not cursor:
             raise HTTPException(status_code=500, detail="Error al crear cursor")
        cursor.execute("SELECT username, points, rank_name FROM leagues ORDER BY points DESC LIMIT 50")
        rows = cursor.fetchall()
        cursor.close()
        leaderboard = []
        if rows:
            for row in rows:
                if isinstance(row, (list, tuple)):
                    pts_val = row[1]
                    leaderboard.append({
                        "username": str(row[0]), 
                        "points": int(pts_val) if isinstance(pts_val, (int, float, str)) else 0, 
                        "rank": str(row[2])
                    })
        return {"leaderboard": leaderboard}
    finally:
        conn.close()
