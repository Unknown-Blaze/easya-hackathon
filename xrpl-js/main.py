from fastapi import FastAPI
from routers import wallet, transaction, donate
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="XRPL Wallet API",
    description="API to create XRPL wallets and send donations on the XRPL Testnet",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for creating the wallet, viewing transactions, donating, and proposing initiatives
app.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
app.include_router(transaction.router, prefix="/transaction", tags=["Transaction"])
app.include_router(donate.router, prefix="/donate", tags=["Donate"])