from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from xrpl.wallet import Wallet
from xrpl.models.transactions import Payment
from xrpl.models.requests import AccountInfo
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops
from services.xrpl_client import client

router = APIRouter()

# 🏦 Replace with actual admin address
NGO_WALLET_ADDRESS = "rNGovExampleTestnetAddressXxx"

class DonationRequest(BaseModel):
    seed: str
    amount: float

@router.post("/")
def donate(request: DonationRequest):
    try:
        wallet = Wallet(seed=request.seed, sequence=0)
        acct_info = AccountInfo(
            account=wallet.classic_address,
            ledger_index="validated",
            strict=True
        )
        result = client.request(acct_info).result
        wallet.sequence = result["account_data"]["Sequence"]

        tx = Payment(
            account=wallet.classic_address,
            amount=xrp_to_drops(request.amount),
            destination=NGO_WALLET_ADDRESS,
        )

        signed_tx = safe_sign_and_autofill_transaction(tx, wallet, client)
        tx_response = submit_and_wait(signed_tx, client)

        return {
            "status": "success",
            "tx_hash": signed_tx.get_hash(),
            "tx_result": tx_response.result["meta"]["TransactionResult"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Donation failed: {str(e)}")
