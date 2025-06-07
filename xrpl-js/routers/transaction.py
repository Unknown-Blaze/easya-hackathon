from fastapi import APIRouter, HTTPException
from xrpl.asyncio.clients import AsyncJsonRpcClient # Ensure this is the client you use
from xrpl.models.requests import AccountTx
from constants import NGO_WALLET_ADDRESS # Make sure this is correctly defined

router = APIRouter()

@router.get("/latest-transactions")
async def listen_for_transactions(latest_tx_hash: str | None = None): # Added default None
    # Use your shared client instance if available, or create one
    # client = AsyncJsonRpcClient("https://s.altnet.rippletest.net:51234") # If creating here

    # If you have a globally defined async client (e.g., from services.xrpl_client):
    from services.xrpl_client import client as async_xrpl_client # Assuming you have one

    try:
        req = AccountTx(
            account=NGO_WALLET_ADDRESS,
            ledger_index_min=-1, # Use -1 for unvalidated, or specific ledger indexes
            ledger_index_max=-1, # Use -1 for unvalidated, or specific ledger indexes
            limit=10, # Fetch a bit more to ensure we find the last_tx_hash if it's slightly older
            binary=False,
            forward=False, # Newest first
        )
        response = await async_xrpl_client.request(req) # Use your shared async client
        
        if response.is_successful() and response.result:
            all_fetched_txs = response.result.get("transactions", [])
        else:
            print("Error in XRPL response or no result:", response)
            return [] # Return empty on error or no result

        if not all_fetched_txs:
            return []

        if not latest_tx_hash: # First call or no previous hash
            return all_fetched_txs[:5] # Return up to the latest 5

        new_txs_to_return = []
        for tx_data in all_fetched_txs:
            # The actual transaction object is often under 'tx' or 'transaction'
            # The 'hash' might be top-level in tx_data or inside tx_data['tx']
            current_tx_hash = tx_data.get("hash") # Prefer top-level hash
            if not current_tx_hash and tx_data.get("tx"):
                 current_tx_hash = tx_data["tx"].get("hash")
            elif not current_tx_hash and tx_data.get("transaction"):
                 current_tx_hash = tx_data["transaction"].get("hash")


            if current_tx_hash == latest_tx_hash:
                break # Stop when we find the last known transaction
            new_txs_to_return.append(tx_data)
        
        return new_txs_to_return[:5] # Return up to 5 new transactions

    except Exception as e:
        print(f"Error fetching latest transactions from XRPL: {e}")
        # Consider raising HTTPException for client-side error handling
        # raise HTTPException(status_code=500, detail=f"Error fetching transactions: {str(e)}")
        return [] # Return empty on exception