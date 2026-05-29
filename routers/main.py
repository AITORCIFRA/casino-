# main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, wallet, games, battlepass_leagues

app = FastAPI(
    title="Arcade Premium Ultimate API",
    description="Backend eficaz unificado para autenticación, juegos, economía y progresión",
    version="2.0.0"
)

# Configuración Global de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REGISTRO EFICAZ DE NUESTROS ROUTERS ENDPOINTS
app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(games.router)
app.include_router(battlepass_leagues.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Servidor del Arcade Premium corriendo de manera óptima."
    }

if __name__ == "__main__":
    # Recuerda arrancar esto dentro de tu (.venv) activo
    uvicorn.run("main.py:app", host="0.0.0.0", port=5000, reload=True)