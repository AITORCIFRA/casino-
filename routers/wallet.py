# routers/wallet.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from core.database import DB

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
async def get_balance(username: str):
    if username not in DB["wallets"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"username": username, "balance": DB["wallets"][username]}

@router.post("/deposit")
async def deposit_credits(request: WalletActionRequest):
    if request.username not in DB["wallets"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Monto de depósito inválido")

    DB["wallets"][request.username] += request.amount
    return {"status": "success", "new_balance": DB["wallets"][request.username]}


@router.post("/transaction")
async def transaction(request: WalletTransactionRequest):
    username = request.username.strip()
    if username not in DB["wallets"]:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    current_balance = DB["wallets"][username]
    if request.amount < 0 and current_balance + request.amount < 0:
        return JSONResponse(
            status_code=402,
            content={
                "success": False,
                "error": "INSUFFICIENT_FUNDS",
                "open_shop": True,
                "balance": current_balance,
            },
        )

    DB["wallets"][username] = current_balance + request.amount
    new_balance = DB["wallets"][username]
    return {"success": True, "new_balance": new_balance, "balance": new_balance}
