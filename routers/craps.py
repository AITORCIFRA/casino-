from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
from core.database import get_db_connection
from routers.wallet import transaction, WalletTransactionRequest

router = APIRouter(prefix="/api/games/craps", tags=["craps"])

class CrapsPlayRequest(BaseModel):
    username: str
    bet_amount: int
    bet_type: str  # "pass", "dont_pass", "field", etc.

@router.post("/roll")
async def roll_dice(req: CrapsPlayRequest):
    # 1. Cobrar apuesta
    # Simulamos la llamada al router de wallet internamente
    res_cobro = await transaction(WalletTransactionRequest(
        username=req.username,
        game="craps",
        type="gasto_juego",
        amount=-req.bet_amount
    ))
    
    # Si es un JSONResponse con error 402, lanzamos la excepción
    if hasattr(res_cobro, "status_code") and res_cobro.status_code == 402:
        raise HTTPException(status_code=402, detail="Créditos insuficientes")
    
    if not res_cobro.get("success"):
        raise HTTPException(status_code=400, detail="Error en la transacción")

    # 2. Tirar dados
    die1 = random.randint(1, 6)
    die2 = random.randint(1, 6)
    total = die1 + die2
    
    win = 0
    message = f"Tirada: {die1} + {die2} = {total}"
    
    # Lógica completa de Craps (Versión Arcade One-Roll)
    if req.bet_type == "pass":
        if total in [7, 11]:
            win = req.bet_amount * 2
            message += " - ¡GANASTE! (NATURAL)"
        elif total in [2, 3, 12]:
            win = 0
            message += " - CRAPS. PERDISTE."
        else:
            win = req.bet_amount # Devolvemos apuesta si es punto para no frustrar al jugador
            message += " - PUNTO ESTABLECIDO (EMPATE)"
            
    elif req.bet_type == "field":
        if total in [2, 12]:
            win = req.bet_amount * 3
            message += " - ¡CAMPO GANADOR (x3)!"
        elif total in [3, 4, 9, 10, 11]:
            win = req.bet_amount * 2
            message += " - ¡CAMPO GANADOR (x2)!"
        else:
            win = 0
            message += " - CAMPO PERDEDOR."

    elif req.bet_type == "any7":
        if total == 7:
            win = req.bet_amount * 5
            message += " - ¡ANY SEVEN! (x5)"
        else:
            win = 0
            message += " - PERDISTE."

    elif req.bet_type == "craps":
        if total in [2, 3, 12]:
            win = req.bet_amount * 8
            message += " - ¡ANY CRAPS! (x8)"
        else:
            win = 0
            message += " - PERDISTE."

    elif req.bet_type == "yo11":
        if total == 11:
            win = req.bet_amount * 16
            message += " - ¡YO-LEVEN! (x16)"
        else:
            win = 0
            message += " - PERDISTE."

    elif req.bet_type == "boxcars":
        if total == 12:
            win = req.bet_amount * 31
            message += " - ¡BOXCARS! (x31)"
        else:
            win = 0
            message += " - PERDISTE."

    elif req.bet_type.startswith("hard"):
        val = int(req.bet_type.replace("hard", ""))
        if total == val and die1 == die2:
            mult = 8 if val in [4, 10] else 10
            win = req.bet_amount * mult
            message += f" - ¡HARDWAY {val}! (x{mult})"
        else:
            win = 0
            message += " - PERDISTE."

    elif req.bet_type.startswith("num"):
        val = int(req.bet_type.replace("num", ""))
        if total == val:
            win = req.bet_amount * 2
            message += f" - ¡NÚMERO {val}! (x2)"
        else:
            win = 0
            message += " - PERDISTE."

    # 3. Pagar premio si existe
    new_balance = res_cobro["new_balance"]
    if win > 0:
        res_pago = await transaction(WalletTransactionRequest(
            username=req.username,
            game="craps",
            type="premio_juego",
            amount=win
        ))
        new_balance = res_pago["new_balance"]

    return {
        "success": True,
        "dice": [die1, die2],
        "total": total,
        "win_amount": win,
        "new_balance": new_balance,
        "message": message
    }
