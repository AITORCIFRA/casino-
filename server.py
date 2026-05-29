# /home/cifra/arcade-premium/server.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <-- IMPORTANTE
from routers import auth, wallet, games, battlepass_leagues

app = FastAPI(
    title="Arcade Premium Ultimate API",
    description="Backend unificado para autenticación, juegos, economía y progresión",
    version="2.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REGISTRO DE ROUTERS
app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(games.router)
app.include_router(battlepass_leagues.router)

# MONTA LA CARPETA PUBLIC PARA QUE SE VEA EL CASINO
# html_to_source=True hace que busque un index.html por defecto al entrar
app.mount("/", StaticFiles(directory="public", html=True), name="public")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)