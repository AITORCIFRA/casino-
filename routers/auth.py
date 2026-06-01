# routers/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.database import get_db_connection, ensure_user, set_balance, get_balance

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

class AuthModel(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(data: AuthModel):
    username = data.username.strip()
    password = data.password.strip()
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Usuario inválido (mínimo 3 caracteres)")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    cursor = conn.cursor()
    
    # Verificar si ya existe en users
    cursor.execute("SELECT username FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    # Insertar en users
    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, password))
    conn.commit()
    cursor.close()
    conn.close()
    
    # Inicializar datos en players y usuarios
    ensure_user(username)
    return {"status": "success", "message": f"Usuario {username} registrado con éxito"}

@router.post("/login")
async def login(data: AuthModel):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de base de datos")
    cursor = conn.cursor()
    
    cursor.execute("SELECT username, password FROM users WHERE username = %s", (data.username,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not row or row[1] != data.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    ensure_user(data.username)
    return {"status": "success", "message": "Login correcto", "username": data.username}