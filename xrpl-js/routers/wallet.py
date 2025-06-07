from fastapi import APIRouter, HTTPException
from xrpl.wallet import generate_faucet_wallet
from services.xrpl_client import client

router = APIRouter()

@router.post("/create")
def create_wallet():
    try:
        wallet = generate_faucet_wallet(client, debug=True)
        return {
            "wallet": {
                "address": wallet.classic_address,
                "seed": wallet.seed,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))