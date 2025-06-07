from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from xrpl.wallet import generate_faucet_wallet, Wallet
from xrpl.clients import JsonRpcClient
from xrpl.transaction import submit_and_wait
from xrpl.models.transactions import Payment
from xrpl.models.requests import AccountInfo
# from xrpl.models.amounts import XRP
# from xrpl.transaction import safe_sign_and_autofill_transaction
from xrpl.utils import xrp_to_drops

# Initialize FastAPI app
app = FastAPI()

# XRPL testnet JSON-RPC endpoint
JSON_RPC_URL = "https://s.altnet.rippletest.net:51234"
client = JsonRpcClient(JSON_RPC_URL)

NGO_WALLET_ADDRESS = "rNGovExampleTestnetAddressXxx"

# Request model for /donate endpoint
class DonationRequest(BaseModel):
    seed: str        # Donor's private key
    amount: float    # Amount of XRP to send


@app.get("/")
def read_root():
    return {"message": "XRPL Wallet API is running"}


@app.post("/create-wallet")
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


@app.post("/donate")
def donate(request: DonationRequest):
    try:
        wallet = Wallet(seed=request.seed, sequence=0)
        
        # Get latest account info to fetch current sequence number
        acct_info = AccountInfo(
            account=wallet.classic_address,
            ledger_index="validated",
            strict=True
        )
        response = client.request(acct_info)
        result = response.result
        wallet.sequence = result["account_data"]["Sequence"]

        # Prepare payment transaction
        tx = Payment(
            account=wallet.classic_address,
            amount=xrp_to_drops(request.amount),  # Convert XRP to drops
            destination=NGO_WALLET_ADDRESS,
        )

        # Sign and autofill transaction
        # signed_tx = safe_sign_and_autofill_transaction(tx, wallet, client)

        # Submit and wait for validation
        tx_response = submit_and_wait(signed_tx, client)

        return {
            "status": "success",
            # "tx_hash": signed_tx.get_hash(),
            "tx_result": tx_response.result["meta"]["TransactionResult"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Donation failed: {str(e)}")
