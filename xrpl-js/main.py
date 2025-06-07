from fastapi import FastAPI
from routers import wallet, transaction

app = FastAPI(
    title="XRPL Wallet API",
    description="API to create XRPL wallets and send donations on the XRPL Testnet",
    version="0.1.0",
)

# Include routers for the wallet and transactions between the donor/NGO
app.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
app.include_router(transaction.router, prefix="/transaction", tags=["Transaction"])