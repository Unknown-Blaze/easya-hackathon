import time
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from xrpl.account import get_balance
from xrpl.models import EscrowCreate
from xrpl.transaction.reliable_submission import submit_and_wait
from xrpl.wallet import generate_faucet_wallet

from services.xrpl_client import client

router = APIRouter()

class Milestone(BaseModel):
    task: str
    amount: int
    time: datetime


class DonationRequest(BaseModel):
    # seed: str
    client: str
    recipient: str
    milestones: List[Milestone]


RIPPLE_EPOCH_OFFSET = 946684800


def get_faucet_wallet(max_retries=15, backoff=3):
    for attempt in range(1, max_retries + 1):
        try:
            return generate_faucet_wallet(client)
        except Exception as e:
            print(f"[faucet] attempt {attempt} failed: {e}")
            if attempt == max_retries:
                raise
            time.sleep(backoff * attempt)


@router.post("/donate")
def donate(request: DonationRequest):
    try:
        wallet1 = get_faucet_wallet()
        wallet2 = get_faucet_wallet()

        print("Balances of wallets before Escrow tx was created:")
        print(get_balance(wallet1.address, client))
        print(get_balance(wallet2.address, client))

        print(type(wallet1))

        escrows = []
        idx = 0

        for milestone in request.milestones:
            unix_ts = int(milestone.time.timestamp())
            ripple_ts = unix_ts - RIPPLE_EPOCH_OFFSET
            if ripple_ts <= 0:
                raise ValueError("Milestone time must be in the future.")
            create_tx = EscrowCreate(
                account=wallet1.address,
                destination=wallet2.address,
                amount=str(milestone.amount),
                finish_after=ripple_ts,
            )

            create_escrow_response = submit_and_wait(create_tx, client, wallet1)
            print(create_escrow_response)

            seq = create_escrow_response.result["tx_json"]["Sequence"]
            escrows.append({"escrow_sequence": seq, "unlock_time": milestone.time})
            print(f"Escrow {idx+1} created for release after: {milestone.time}")
            idx += 1
        return escrows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
