"""
CRUD/service layer for the Point of Sale checkout flow.

This is the file that benefits the most from the refactor: the old
routers/pos.py mixed stock validation, pricing math, alert creation,
and transaction persistence all inline inside the route function. Here
each piece is its own small function, so e.g. "does deducting stock
work correctly" can be tested by calling decrement_stock_for_item()
directly, with no HTTP request involved.
"""

from decimal import Decimal
from typing import List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from crud import products as products_crud


class CheckoutError(Exception):
    """Raised for any business-rule failure during checkout so the router
    can translate it into the right HTTP status code."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


def validate_and_price_items(
    db: Session, items: List[schemas.CartItem]
) -> Tuple[Decimal, List[Tuple[models.Product, schemas.CartItem, Decimal]]]:
    """Check stock availability for every line item and compute line totals.
    Raises CheckoutError on the first problem found. Nothing is written to
    the DB yet — this only reads and validates."""
    subtotal = Decimal("0.00")
    line_items = []

    for item in items:
        product = products_crud.get_active_product(db, item.product_id)
        if not product:
            raise CheckoutError(404, f"Product {item.product_id} not found")
        if product.quantity_in_stock < item.quantity:
            raise CheckoutError(
                400,
                f"Insufficient stock for '{product.product_name}'. "
                f"Available: {product.quantity_in_stock}",
            )

        line_total = (product.price * item.quantity) - item.line_discount
        subtotal += line_total
        line_items.append((product, item, line_total))

    return subtotal, line_items


def create_transaction(
    db: Session, order: schemas.TransactionCreate, user_id: int
) -> models.Transaction:
    """Run the full checkout: validate stock, price the cart, persist the
    transaction + line items, decrement stock, and raise low-stock alerts
    as needed. Everything commits together as one transaction."""
    subtotal, line_items = validate_and_price_items(db, order.items)

    tax_amount = (subtotal - order.discount_amount) * order.tax_rate
    total_amount = (subtotal - order.discount_amount) + tax_amount

    if order.amount_paid < total_amount:
        raise CheckoutError(400, "Amount paid is less than total amount due")

    change_due = order.amount_paid - total_amount

    new_transaction = models.Transaction(
        user_id=user_id,
        subtotal=subtotal,
        discount_amount=order.discount_amount,
        tax_amount=tax_amount,
        total_amount=total_amount,
        payment_method=order.payment_method,
        amount_paid=order.amount_paid,
        change_due=change_due,
        status="completed",
    )
    db.add(new_transaction)
    db.flush()  # get transaction_id before commit

    for product, item, line_total in line_items:
        db.add(models.TransactionItem(
            transaction_id=new_transaction.transaction_id,
            product_id=product.product_id,
            quantity=item.quantity,
            unit_price=product.price,
            line_discount=item.line_discount,
            line_total=line_total,
        ))
        decrement_stock(product, item.quantity)
        products_crud.check_and_create_low_stock_alert(db, product)

    db.commit()
    db.refresh(new_transaction)
    return new_transaction


def decrement_stock(product: models.Product, quantity: int) -> None:
    product.quantity_in_stock -= quantity


def restock_from_void(product: models.Product, quantity: int) -> None:
    product.quantity_in_stock += quantity


def list_transactions(db: Session, limit: int = 50) -> List[models.Transaction]:
    return (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.items))
        .order_by(models.Transaction.transaction_date.desc())
        .limit(limit)
        .all()
    )


def get_transaction(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    return (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.items))
        .filter(models.Transaction.transaction_id == transaction_id)
        .first()
    )


def get_transaction_for_void(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    return db.query(models.Transaction).filter(
        models.Transaction.transaction_id == transaction_id
    ).first()


def void_transaction(db: Session, txn: models.Transaction) -> models.Transaction:
    """Restock every item on the transaction and mark it voided."""
    for item in txn.items:
        product = products_crud.get_product(db, item.product_id)
        if product:
            restock_from_void(product, item.quantity)

    txn.status = "voided"
    db.commit()
    return txn
