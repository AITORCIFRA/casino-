# server.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, wallet, games, battlepass_leagues

app = FastAPI(
    title="Arcade Premium Ultimate API",
    description="Backend unificado para autenticación, juegos, economía y progresión",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(games.router)
app.include_router(battlepass_leagues.router)

# Servir archivos estáticos desde public/
app.mount("/", StaticFiles(directory="public", html=True), name="public")

# Servir también las carpetas css y js desde la raíz del proyecto
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)