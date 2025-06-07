from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from xrpl.wallet import Wallet
from xrpl.models.transactions import Payment
from xrpl.models.requests import AccountInfo, AccountTx
from xrpl.transaction import submit_and_wait
from xrpl.utils import xrp_to_drops
from services.xrpl_client import client
from xrpl.asyncio.clients import AsyncJsonRpcClient
from constants import NGO_WALLET_ADDRESS

router = APIRouter()

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
    
@router.get("/latest-transactions")
async def listen_for_transactions(latest_tx_hash: str | None):
    client = AsyncJsonRpcClient("https://s.altnet.rippletest.net:51234")

    try:
        """
        Requests the five latest transactions made to our NGO's wallet. We'll only keep the last
        five transactions in the frontend when we display as well.
        """
        req = AccountTx(
            account=f"{NGO_WALLET_ADDRESS}",
            ledger_index_min=-1,
            ledger_index_max=-1,
            limit=5,
            binary=False,
            forward=False,
        )
        response = await client.request(req)
        txs = response.result.get("transactions", [])

        # If no transaction hash exists (first transaction), return all.
        if not latest_tx_hash:
            return txs
        new_txs = []

        # If a transaction history exists, just iterate till you find the latest transaction hash from the frontend whilst polling.
        for num, tx in enumerate(txs):
            if tx[num]['hash'] == latest_tx_hash:
                break
            new_txs.append(tx)
        return new_txs
    
    except Exception as e:
        print("Error fetching latest transactions:", e)
