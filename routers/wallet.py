# routers/wallet.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from core.database import get_db_connection, get_balance, set_balance, ensure_user, add_transaction

router = APIRouter(prefix="/api/wallet", tags=["Billetera / Wallet"])

class WalletActionRequest(BaseModel):
    username: str
    amount: int

class WalletTransactionRequest(BaseModel):
    username: str
    game: str
    type: str
    amount: int

@router.get("/balance/{username}")
async def get_balance_endpoint(username: str):
    ensure_user(username)
    balance = get_balance(username)
    return {"username": username, "balance": balance}

@router.post("/deposit")
async def deposit_credits(request: WalletActionRequest):
    ensure_user(request.username)
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Monto de depósito inválido")
    current = get_balance(request.username)
    new_balance = current + request.amount
    set_balance(request.username, new_balance)
    add_transaction(request.username, "compra_tienda", "tienda", request.amount, new_balance)
    return {"status": "success", "new_balance": new_balance}

@router.post("/transaction")
async def transaction(request: WalletTransactionRequest):
    ensure_user(request.username)
    current = get_balance(request.username)
    if request.amount < 0 and current + request.amount < 0:
        return JSONResponse(
            status_code=402,
            content={
                "success": False,
                "error": "INSUFFICIENT_FUNDS",
                "open_shop": True,
                "balance": current,
            },
        )
    new_balance = current + request.amount
    set_balance(request.username, new_balance)
    add_transaction(request.username, request.type, request.game, request.amount, new_balance)
    return {"success": True, "new_balance": new_balance, "balance": new_balance}
