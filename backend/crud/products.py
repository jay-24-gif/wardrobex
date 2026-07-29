"""
CRUD layer for products, categories, stock-in records, and stock alerts.

These functions contain ONLY database access logic (SQLAlchemy queries,
object creation, commits). They know nothing about HTTP, status codes,
or permissions — that's the router's job. This keeps the query logic in
one place and makes it directly unit-testable without spinning up FastAPI.
"""

from typing import List, Optional

from sqlalchemy.orm import Session

import models
import schemas


# ---------- CATEGORIES ----------

def list_categories(db: Session) -> List[models.Category]:
    return db.query(models.Category).all()


def create_category(db: Session, category: schemas.CategoryCreate) -> models.Category:
    new_cat = models.Category(**category.model_dump())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


# ---------- PRODUCTS ----------

def list_products(
    db: Session,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    low_stock_only: bool = False,
) -> List[models.Product]:
    query = db.query(models.Product).filter(models.Product.is_active == True)  # noqa: E712
    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.Product.product_name.like(like))
            | (models.Product.sku.like(like))
            | (models.Product.barcode.like(like))
        )
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if low_stock_only:
        query = query.filter(models.Product.quantity_in_stock <= models.Product.reorder_threshold)
    return query.all()


def list_low_stock_products(db: Session) -> List[models.Product]:
    return db.query(models.Product).filter(
        models.Product.quantity_in_stock <= models.Product.reorder_threshold,
        models.Product.is_active == True,  # noqa: E712
    ).all()


def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.product_id == product_id).first()


def get_active_product(db: Session, product_id: int) -> Optional[models.Product]:
    """Same as get_product, but only returns the product if it's active.
    Used by the POS checkout flow, which should never sell a deactivated item."""
    return db.query(models.Product).filter(
        models.Product.product_id == product_id,
        models.Product.is_active == True,  # noqa: E712
    ).first()


def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.sku == sku).first()


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


def update_product(
    db: Session, product: models.Product, updates: schemas.ProductUpdate
) -> models.Product:
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def deactivate_product(db: Session, product: models.Product) -> models.Product:
    product.is_active = False
    db.commit()
    db.refresh(product)
    return product


# ---------- STOCK IN (Restocking) ----------

def create_stock_in(
    db: Session, product: models.Product, stock: schemas.StockInCreate, user_id: int
) -> models.Product:
    product.quantity_in_stock += stock.quantity_added

    log = models.StockIn(
        product_id=stock.product_id,
        user_id=user_id,
        quantity_added=stock.quantity_added,
        supplier=stock.supplier,
        notes=stock.notes,
    )
    db.add(log)

    # Resolve any open low-stock alerts if stock is now above threshold
    if product.quantity_in_stock > product.reorder_threshold:
        resolve_alerts_for_product(db, product.product_id)

    db.commit()
    db.refresh(product)
    return product


# ---------- STOCK ALERTS ----------

def get_open_alert_for_product(db: Session, product_id: int) -> Optional[models.StockAlert]:
    return db.query(models.StockAlert).filter(
        models.StockAlert.product_id == product_id,
        models.StockAlert.is_resolved == False,  # noqa: E712
    ).first()


def create_low_stock_alert(db: Session, product: models.Product) -> models.StockAlert:
    alert = models.StockAlert(
        product_id=product.product_id,
        alert_message=f"'{product.product_name}' is low on stock ({product.quantity_in_stock} left)",
    )
    db.add(alert)
    return alert


def check_and_create_low_stock_alert(db: Session, product: models.Product) -> None:
    """Create a low-stock alert for this product if it's under threshold
    and doesn't already have an unresolved one. Does not commit — caller
    controls the transaction boundary (e.g. POS checkout commits once
    at the end for the whole cart)."""
    if product.quantity_in_stock <= product.reorder_threshold:
        if not get_open_alert_for_product(db, product.product_id):
            create_low_stock_alert(db, product)


def resolve_alerts_for_product(db: Session, product_id: int) -> None:
    db.query(models.StockAlert).filter(
        models.StockAlert.product_id == product_id,
        models.StockAlert.is_resolved == False,  # noqa: E712
    ).update({"is_resolved": True})


def list_active_alerts(db: Session) -> List[models.StockAlert]:
    return db.query(models.StockAlert).filter(models.StockAlert.is_resolved == False).all()  # noqa: E712
