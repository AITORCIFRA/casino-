# server.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, wallet, games, battlepass_leagues, tables, craps, games_new

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

# Incluir routers de API PRIMERO (tienen prioridad)
app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(games.router)
app.include_router(battlepass_leagues.router)
app.include_router(tables.router)
app.include_router(craps.router)
app.include_router(games_new.router)

# Servir archivos estáticos desde public/
app.mount("/css", StaticFiles(directory="public/css"), name="css")
app.mount("/js", StaticFiles(directory="public/js"), name="js")
app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")

# Servir archivos HTML desde public/ (DEBE SER ÚLTIMO)
app.mount("/", StaticFiles(directory="public", html=True), name="public")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)
