from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
from core.database import get_db_connection
from routers.wallet import transaction, WalletTransactionRequest

router = APIRouter(prefix="/api/games/craps", tags=["craps"])

# --- Simulación de la base de datos de mesas de Craps ---
class CrapsTable(BaseModel):
    table_id: str
    minimum_bet: int
    max_players: int = 8
    status: str = "open"

craps_tables_db = {
    "craps_low_stakes": CrapsTable(table_id="craps_low_stakes", minimum_bet=100),
    "craps_mid_stakes": CrapsTable(table_id="craps_mid_stakes", minimum_bet=1000),
    "craps_high_roller": CrapsTable(table_id="craps_high_roller", minimum_bet=10000),
}

class CrapsPlayRequest(BaseModel):
    username: str
    bet_amount: int
    bet_type: str  # "pass", "field", "any7", "craps", "yo11", "hard4", "num4", etc.
    table_id: Optional[str] = None # Añadir table_id a la solicitud de apuesta

# --- Endpoints para la gestión de mesas ---
@router.post("/tables")
async def create_table(table: CrapsTable):
    if table.table_id in craps_tables_db:
        raise HTTPException(status_code=400, detail="Table ID already exists")
    craps_tables_db[table.table_id] = table
    return table

@router.get("/tables/{table_id}")
async def get_table(table_id: str):
    if table_id not in craps_tables_db:
        raise HTTPException(status_code=404, detail="Table not found")
    table = craps_tables_db[table_id]
    return {
        "id": table.table_id,
        "name": table.table_id.replace('_', ' ').title(),
        "minimum_bet": table.minimum_bet,
        "max_players": table.max_players,
        "status": table.status
    }

@router.get("/tables")
async def list_tables():
    tables = []
    for table_id, table in craps_tables_db.items():
        tables.append({
            "id": table.table_id,
            "name": f"Mesa {table.table_id.replace('_', ' ').title()}",
            "minimum_bet": table.minimum_bet,
            "max_players": table.max_players,
            "status": table.status
        })
    return tables

@router.put("/tables/{table_id}")
async def update_table(table_id: str, updated_table: CrapsTable):
    if table_id not in craps_tables_db:
        raise HTTPException(status_code=404, detail="Table not found")
    if table_id != updated_table.table_id:
        raise HTTPException(status_code=400, detail="Table ID in path and body must match")
    craps_tables_db[table_id] = updated_table
    return updated_table

@router.delete("/tables/{table_id}")
async def delete_table(table_id: str):
    if table_id not in craps_tables_db:
        raise HTTPException(status_code=404, detail="Table not found")
    del craps_tables_db[table_id]
    return {"message": "Table deleted successfully"}

# --- Endpoint de tirada de dados (modificado para usar table_id) ---
@router.post("/roll")
async def roll_dice(req: CrapsPlayRequest):
    username = req.username
    bet_amount = req.bet_amount
    bet_type = req.bet_type
    table_id = req.table_id

    # Validar que el usuario existe (simulado)
    # if username not in user_balances:
    #     raise HTTPException(status_code=404, detail="User not found")

    # Validar que la mesa existe si se proporciona un table_id
    if table_id and table_id not in craps_tables_db:
        raise HTTPException(status_code=404, detail="Table not found")

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
