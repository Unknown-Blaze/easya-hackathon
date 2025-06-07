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

# Function returns the latest list of transactions to the NGO's wallet address.
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
