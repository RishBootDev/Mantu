from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CatalogProduct

SEED_PRODUCTS = [
    CatalogProduct(
        id="headphones",
        name="Aria Wireless Headphones",
        description="Over-ear, 40-hour battery, soft memory-foam cups.",
        price_amount_units=299900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1702047135360-e549c2e1f7df?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="keyboard",
        name="Tactile 75 Keyboard",
        description="Compact 75% mechanical keyboard with hot-swap switches.",
        price_amount_units=449900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1681139800938-cfd98d370a08?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="mug",
        name="Pour-over Ceramic Mug",
        description="Hand-glazed 350 ml mug that keeps the first cup warm.",
        price_amount_units=49900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1574291046548-8ac793d95371?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="mouse",
        name="Precision Wireless Mouse",
        description="Ergonomic wireless mouse with silent clicks and USB-C charging.",
        price_amount_units=189900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="desk-lamp",
        name="Architect LED Desk Lamp",
        description="Adjustable warm-to-cool task light with matte aluminum arm.",
        price_amount_units=249900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1524820801657-fd59673fbb05?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="speaker",
        name="Studio Compact Speaker",
        description="Balanced near-field desktop speaker with rich bass and Bluetooth 5.3.",
        price_amount_units=599900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1525004277915-9e455d05ca5d?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="microphone",
        name="Condenser Desk Microphone",
        description="Cardioid USB-C studio microphone for crisp calls and recordings.",
        price_amount_units=389900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1640042588752-d21006e65082?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="monitor-stand",
        name="Walnut Monitor Riser",
        description="Solid wood monitor stand that elevates your display and clears desk space.",
        price_amount_units=349900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1742198865450-cf9ce4335a33?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
    CatalogProduct(
        id="laptop-stand",
        name="Aluminum Laptop Stand",
        description="Precision-milled anodized stand for better posture and airflow.",
        price_amount_units=219900,
        currency="INR",
        image_url="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=800&q=80",
        active=True,
    ),
]


def seed_catalog(db: Session) -> None:
    existing = {p.id: p for p in db.scalars(select(CatalogProduct))}
    for p in SEED_PRODUCTS:
        row = existing.get(p.id)
        if row is None:
            db.add(
                CatalogProduct(
                    id=p.id,
                    name=p.name,
                    description=p.description,
                    price_amount_units=p.price_amount_units,
                    currency=p.currency,
                    image_url=p.image_url,
                    active=p.active,
                )
            )
        elif row.image_url != p.image_url:
            row.image_url = p.image_url
    db.commit()
