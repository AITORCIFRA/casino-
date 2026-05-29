# core/database.py
from typing import Dict, Any

# Simulamos una base de datos en memoria persistente mientras el servidor esté vivo
DB: Dict[str, Dict[str, Any]] = {
    "users": {},       # username -> {password, email, joined_at}
    "wallets": {},     # username -> balance (int)
    "battlepass": {},  # username -> {level, xp, claimed_rewards: []}
    "leagues": {}      # username -> {points, rank_name}
}

def init_user_data(username: str):
    """Inicializa de golpe todos los datos de un nuevo usuario en el sistema"""
    if username not in DB["users"]:
        return
    
    if username not in DB["wallets"]:
        DB["wallets"][username] = 500  # Saldo inicial de cortesía
        
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