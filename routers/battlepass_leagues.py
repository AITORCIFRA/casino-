# routers/battlepass_leagues.py
from fastapi import APIRouter, HTTPException
from core.database import DB

router = APIRouter(prefix="/api/progression", tags=["Progreso: Pase y Ligas"])

@router.get("/battlepass/{username}")
async def get_battlepass(username: str):
    if username not in DB["battlepass"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return DB["battlepass"][username]

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