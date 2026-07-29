from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import schemas
from database import get_db
from auth import get_current_user, require_roles
from crud import products as crud

router = APIRouter(prefix="/products", tags=["Inventory"])


# ---------- CATEGORIES ----------
@router.get("/categories", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.list_categories(db)


@router.post("/categories", response_model=schemas.CategoryOut)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager", "inventory_staff"])),
):
    return crud.create_category(db, category)


# ---------- PRODUCTS ----------
@router.get("", response_model=List[schemas.ProductOut])
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.list_products(db, search=search, category_id=category_id, low_stock_only=low_stock_only)


@router.get("/low-stock", response_model=List[schemas.ProductOut])
def low_stock_products(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return crud.list_low_stock_products(db)


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=schemas.ProductOut)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager", "inventory_staff"])),
):
    existing = crud.get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    return crud.create_product(db, product)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    updates: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager", "inventory_staff"])),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.update_product(db, product, updates)


@router.delete("/{product_id}")
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager"])),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    crud.deactivate_product(db, product)
    return {"detail": "Product deactivated"}


# ---------- STOCK IN (Restocking) ----------
@router.post("/stock-in", response_model=schemas.ProductOut)
def stock_in(
    stock: schemas.StockInCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager", "inventory_staff"])),
):
    product = crud.get_product(db, stock.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.create_stock_in(db, product, stock, user_id=current_user.user_id)


@router.get("/alerts/active")
def get_active_alerts(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    alerts = crud.list_active_alerts(db)
    return [
        {
            "alert_id": a.alert_id,
            "product_id": a.product_id,
            "product_name": a.product.product_name if a.product else None,
            "alert_message": a.alert_message,
            "created_at": a.created_at,
        }
        for a in alerts
    ]
