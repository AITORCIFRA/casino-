# routers/battlepass_leagues.py
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import json
import random
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

class FriendActionRequest(BaseModel):
    friend_username: str

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
        
        cursor.execute("USE arcade_premium_db")
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
        cursor.execute("USE arcade_premium_db")
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

# ------------------------------------------------------------
# Perfil y Amigos
# ------------------------------------------------------------

@router.get("/profile/{username}")
async def get_profile(username: str):
    ensure_user(username)
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)
        cursor.execute("USE arcade_premium_db")
        cursor.execute("SELECT username, unique_id, avatar_url, current_level, current_xp FROM players WHERE username = %s", (username,))
        player = cursor.fetchone()
        
        if not player:
            raise HTTPException(status_code=404, detail="Jugador no encontrado")
            
        league = get_league(username)
        bp = build_battlepass_summary(username)
        
        return {
            "username": player["username"],
            "unique_id": player["unique_id"],
            "avatar": player["avatar_url"],
            "level": bp["level"],
            "xp": bp["xp"],
            "xp_needed": bp["xp_needed"],
            "league": league["rank"],
            "points": league["points"]
        }
    finally:
        conn.close()

@router.get("/friends/{username}")
async def get_friends(username: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)
        cursor.execute("USE arcade_premium_db")
        # Amigos aceptados
        cursor.execute("""
            SELECT friend_username as username, p.avatar_url, p.unique_id 
            FROM friends f
            JOIN players p ON f.friend_username = p.username
            WHERE f.username = %s AND f.status = 'accepted'
        """, (username,))
        friends = cursor.fetchall()
        
        # Solicitudes pendientes
        cursor.execute("""
            SELECT username, created_at 
            FROM friends 
            WHERE friend_username = %s AND status = 'pending'
        """, (username,))
        pending = cursor.fetchall()
        
        return {"friends": friends, "pending": pending}
    finally:
        conn.close()

@router.post("/friends/{username}/add")
async def add_friend(username: str, request: FriendActionRequest):
    if username == request.friend_username:
        raise HTTPException(status_code=400, detail="No puedes agregarte a ti mismo")
        
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    try:
        cursor = conn.cursor(buffered=True)
        cursor.execute("USE arcade_premium_db")
        # Verificar si el amigo existe (puede ser por username o por unique_id)
        cursor.execute("SELECT username FROM players WHERE username = %s OR unique_id = %s", (request.friend_username, request.friend_username))
        target = cursor.fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="Jugador no encontrado")
        
        target_username = target[0]
        
        # Verificar si ya son amigos o hay solicitud
        cursor.execute("SELECT status FROM friends WHERE (username = %s AND friend_username = %s) OR (username = %s AND friend_username = %s)", 
                       (username, target_username, target_username, username))
        existing = cursor.fetchone()
        if existing:
            return {"status": "already_exists", "message": "Ya existe una relación o solicitud"}
            
        cursor.execute("INSERT INTO friends (username, friend_username, status) VALUES (%s, %s, 'pending')", (username, target_username))
        conn.commit()
        return {"status": "success", "message": "Solicitud enviada"}
    finally:
        conn.close()

@router.get("/friends/{username}/recommendations")
async def get_recommendations(username: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    try:
        cursor = conn.cursor(dictionary=True, buffered=True)
        cursor.execute("USE arcade_premium_db")
        # Recomendar jugadores que no sean amigos ni el propio usuario
        cursor.execute("""
            SELECT username, unique_id, avatar_url 
            FROM players 
            WHERE username != %s 
            AND username NOT IN (
                SELECT friend_username FROM friends WHERE username = %s
                UNION
                SELECT username FROM friends WHERE friend_username = %s
            )
            ORDER BY RAND() LIMIT 5
        """, (username, username, username))
        recs = cursor.fetchall()
        return {"recommendations": recs}
    finally:
        conn.close()


# ============================================================
# Endpoints del Pase de Batalla Premium
# ============================================================

class BuyBattlePassRequest(BaseModel):
    username: str

class ClaimScratchPrizeRequest(BaseModel):
    username: str
    amount: int

@router.post("/buy-battlepass")
async def buy_battlepass(request: BuyBattlePassRequest):
    """Compra el Pase de Batalla Premium (5€ = 5000 fichas)."""
    username = request.username
    battlepass_cost = 5000  # 5 euros en fichas
    
    current_balance = get_balance(username)
    if current_balance < battlepass_cost:
        raise HTTPException(status_code=402, detail="Fichas insuficientes")
    
    new_balance = current_balance - battlepass_cost
    set_balance(username, new_balance)
    add_transaction(username, "compra_tienda", "battlepass", -battlepass_cost, new_balance)
    
    return {
        "success": True,
        "message": "Pase de Batalla comprado",
        "new_balance": new_balance
    }

@router.post("/claim-scratch-prize")
async def claim_scratch_prize(request: ClaimScratchPrizeRequest):
    """Reclama un premio del Rasca y Gana."""
    username = request.username
    prize_amount = request.amount
    
    if prize_amount <= 0:
        return {"success": False, "message": "Premio inválido"}
    
    current_balance = get_balance(username)
    new_balance = current_balance + prize_amount
    set_balance(username, new_balance)
    add_transaction(username, "premio_juego", "battlepass_scratch", prize_amount, new_balance)
    
    return {
        "success": True,
        "message": f"¡Ganaste {prize_amount} fichas!",
        "new_balance": new_balance
    }

@router.post("/add-free-spins")
async def add_free_spins(username: str, spins: int = 5):
    """Añade tiradas gratis al usuario."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    try:
        cursor = conn.cursor()
        cursor.execute("USE arcade_premium_db")
        cursor.execute(
            "UPDATE battlepass SET free_spins = COALESCE(free_spins, 0) + %s WHERE username = %s",
            (spins, username)
        )
        conn.commit()
        cursor.close()
        return {"success": True, "message": f"Se añadieron {spins} tiradas gratis"}
    finally:
        conn.close()
