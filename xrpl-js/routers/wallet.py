from fastapi import APIRouter, HTTPException
from xrpl.wallet import generate_faucet_wallet
from services.xrpl_client import client
from routers.donate import get_faucet_wallet

router = APIRouter()

@router.post("/create")
def create_wallet():
    try:
        wallet = get_faucet_wallet()
        return {
            "wallet": {
                "address": wallet.classic_address,
                "seed": wallet.seed,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))