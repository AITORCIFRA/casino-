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
    
    # Lógica simplificada de Craps para la primera tirada (Come Out Roll)
    if req.bet_type == "pass":
        if total in [7, 11]:
            win = req.bet_amount * 2
            message += " - ¡Ganaste! (Natural)"
        elif total in [2, 3, 12]:
            win = 0
            message += " - Craps. Perdiste."
        else:
            # En una versión completa aquí se establecería el punto
            # Para esta versión arcade, devolvemos la apuesta si no es decisión inmediata
            win = req.bet_amount 
            message += " - Punto establecido (Empate en arcade)"
            
    elif req.bet_type == "field":
        # Apuesta de campo: gana en 2, 3, 4, 9, 10, 11, 12
        if total in [2, 12]:
            win = req.bet_amount * 3
            message += " - ¡Campo Ganador (x3)!"
        elif total in [3, 4, 9, 10, 11]:
            win = req.bet_amount * 2
            message += " - ¡Campo Ganador (x2)!"
        else:
            win = 0
            message += " - Campo Perdedor."

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
