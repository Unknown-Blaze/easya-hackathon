from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, EmailStr, PositiveFloat
from typing import List
import re
import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

# === Load .env Variables ===
load_dotenv()

# === Firebase Admin Setup ===
cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")
if not cred_json_str:
    raise RuntimeError("FIREBASE_CREDENTIALS_JSON is not set!")

try:
    # Convert escaped string to dict
    cred_dict = json.loads(cred_json_str)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
except Exception as e:
    raise RuntimeError(f"Error initializing Firebase credentials: {e}")

db = firestore.client()

router = APIRouter()

# === XRPL Wallet Address Format ===
XRPL_ADDRESS_REGEX = r"^r[1-9A-HJ-NP-Za-km-z]{25,35}$"

# === Models ===
class Milestone(BaseModel):
    description: str = Field(..., example="Build first water well")
    amount: PositiveFloat = Field(..., example=1000.0)

class CharityProposal(BaseModel):
    name: str = Field(..., example="Water for All")
    description: str = Field(..., example="Providing clean water to rural villages.")
    contact_email: EmailStr = Field(..., example="info@waterforall.org")
    xrpl_wallet: str = Field(..., example="rEXAMPLExxxxxxxxxxxxxxxxxxxxxxxx")
    milestones: List[Milestone] = Field(default_factory=list)

# === Endpoint ===
@router.post("/propose")
async def propose_charity(proposal: CharityProposal):
    if not re.match(XRPL_ADDRESS_REGEX, proposal.xrpl_wallet):
        raise HTTPException(status_code=400, detail="Invalid XRPL wallet address format.")
    try:
        proposal_data = proposal.model_dump()
        doc_ref = db.collection("charity_proposals").add(proposal_data)
        return {
            "message": "Charity proposal with milestones saved to Firebase.",
            "doc_id": doc_ref[1].id,
            "proposal": proposal_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
