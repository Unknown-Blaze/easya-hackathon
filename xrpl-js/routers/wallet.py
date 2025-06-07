from fastapi import APIRouter, HTTPException
from web3 import Web3

from routers.donate import get_faucet_wallet

router = APIRouter()
w3 = Web3()


@router.post("/create")
def create_wallet():
    try:
        xrp_wallet = get_faucet_wallet()
        eth_wallet = w3.eth.account.create()
        return {
            {
                "eth_wallet": {
                    "address": eth_wallet.address,
                    "private_key": eth_wallet.key.hex(),
                }
            },
            {
                "xrp_wallet": {
                    "address": xrp_wallet.classic_address,
                    "seed": xrp_wallet.seed,
                }
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
