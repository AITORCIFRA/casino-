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
    bet_type: str  # "pass", "field", "any7", "craps", "yo11", "hard4", "num4", etc.

@router.post("/roll")
async def roll_dice(req: CrapsPlayRequest):
    # 1. Cobrar apuesta
    res_cobro = await transaction(WalletTransactionRequest(
        username=req.username,
        game="craps",
        type="gasto_juego",
        amount=-req.bet_amount
    ))
    
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
    
    # Lógica de Pagos (Basada en Pokerist/Casino real)
    if req.bet_type == "pass":
        if total in [7, 11]:
            win = req.bet_amount * 2
            message += " - ¡GANASTE! (NATURAL)"
        elif total in [2, 3, 12]:
            win = 0
            message += " - CRAPS. PERDISTE."
        else:
            win = req.bet_amount # Devolvemos apuesta si es punto (Simulación simplificada)
            message += " - PUNTO ESTABLECIDO"
            
    elif req.bet_type == "field":
        # Field: 2 (x2), 12 (x3), 3, 4, 9, 10, 11 (x1)
        if total == 12:
            win = req.bet_amount * 4 # Triple (Paga 3 a 1 + original)
            message += " - ¡FIELD (TRIPLE)!"
        elif total == 2:
            win = req.bet_amount * 3 # Doble (Paga 2 a 1 + original)
            message += " - ¡FIELD (DOBLE)!"
        elif total in [3, 4, 9, 10, 11]:
            win = req.bet_amount * 2 # 1 a 1 + original
            message += " - ¡FIELD!"
        else:
            win = 0
            message += " - FIELD PERDEDOR."

    elif req.bet_type == "any7":
        if total == 7:
            win = req.bet_amount * 5 # 4 a 1
            message += " - ¡ANY SEVEN!"
        else:
            win = 0

    elif req.bet_type == "craps":
        if total in [2, 3, 12]:
            win = req.bet_amount * 8 # 7 a 1
            message += " - ¡ANY CRAPS!"
        else:
            win = 0

    elif req.bet_type == "yo11":
        if total == 11:
            win = req.bet_amount * 16 # 15 a 1
            message += " - ¡YO-LEVEN!"
        else:
            win = 0

    elif req.bet_type == "boxcars": # 12 específico
        if total == 12:
            win = req.bet_amount * 31 # 30 a 1
            message += " - ¡BOXCARS!"
        else:
            win = 0
            
    elif req.bet_type == "snakeeyes": # 2 específico
        if total == 2:
            win = req.bet_amount * 31 # 30 a 1
            message += " - ¡SNAKE EYES!"
        else:
            win = 0

    elif req.bet_type == "craps3": # 3 específico
        if total == 3:
            win = req.bet_amount * 16 # 15 a 1
            message += " - ¡ACE DEUCE!"
        else:
            win = 0

    elif req.bet_type == "dont_pass":
        if total in [2, 3]:
            win = req.bet_amount * 2
            message += " - ¡DON'T PASS WIN!"
        elif total == 12:
            win = req.bet_amount # PUSH
            message += " - DON'T PASS PUSH"
        elif total in [7, 11]:
            win = 0
            message += " - DON'T PASS LOSE"
        else:
            win = req.bet_amount # Punto establecido
            message += " - PUNTO ESTABLECIDO"

    elif req.bet_type.startswith("hard"):
        val = int(req.bet_type.replace("hard", ""))
        # Hardways: 4, 6, 8, 10 (Pares)
        if total == val and die1 == die2:
            mult = 8 if val in [4, 10] else 10 # 7 a 1 o 9 a 1
            win = req.bet_amount * mult
            message += f" - ¡HARDWAY {val}!"
        else:
            win = 0

    elif req.bet_type.startswith("num"):
        val = int(req.bet_type.replace("num", ""))
        if total == val:
            win = req.bet_amount * 2
            message += f" - ¡NÚMERO {val}!"
        else:
            win = 0

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
