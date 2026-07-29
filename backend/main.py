from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models
from routers import auth_router, products, pos, reports, users

# Auto-create tables if they don't exist yet (schema.sql is the source of truth for a fresh DB)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WardrobeX API",
    description="Point-of-Sale and Inventory Management System for a Retail Clothing Store",
    version="1.0.0",
)

# CORS - allow the Vite dev server to call this API
app.add_middleware(
    CORSMiddleware,
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(products.router)
app.include_router(pos.router)
app.include_router(reports.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "WardrobeX API is running", "docs": "/docs"}
