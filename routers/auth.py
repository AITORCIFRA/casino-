# routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from core.database import DB, init_user_data

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

class AuthModel(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(data: AuthModel):
    username = data.username.strip()
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Usuario inválido (mínimo 3 caracteres)")
    
    if username in DB["users"]:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    # Registrar usuario
    DB["users"][username] = {"password": data.password}
    
    # Inicializar wallet, pase de batalla y liga de golpe de forma eficaz
    init_user_data(username)
    
    return {"status": "success", "message": f"Usuario {username} registrado con éxito"}

@router.post("/login")
async def login(data: AuthModel):
    if data.username not in DB["users"] or DB["users"][data.username]["password"] != data.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Asegurar que tiene perfiles creados por si acaso
    init_user_data(data.username)
    
    return {"status": "success", "message": "Login correcto", "username": data.username}