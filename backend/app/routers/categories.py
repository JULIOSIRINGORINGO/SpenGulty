from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.db.dependencies import DBSession
from app.auth import CurrentUser
from app.models import Kategori, Transaksi
from app.schemas import KategoriRead, KategoriCreate

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/", response_model=list[KategoriRead])
async def get_categories(user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Kategori).where(Kategori.user_id == user.id).order_by(Kategori.id)
    )
    return result.scalars().all()


@router.post("/", response_model=KategoriRead, status_code=201)
async def create_category(data: KategoriCreate, user: CurrentUser, db: DBSession):
    nama_upper = data.nama.upper().strip()

    existing = await db.execute(
        select(Kategori).where(Kategori.nama == nama_upper, Kategori.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Kategori sudah ada!")

    kat = Kategori(nama=nama_upper, tipe=data.tipe, icon=data.icon, user_id=user.id)
    db.add(kat)
    await db.commit()
    await db.refresh(kat)
    return kat


@router.delete("/{kid}", status_code=204)
async def delete_category(kid: int, user: CurrentUser, db: DBSession):
    result = await db.execute(select(Kategori).where(Kategori.id == kid, Kategori.user_id == user.id))
    kat = result.scalar_one_or_none()
    if not kat:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")

    has_transaksi = await db.execute(
        select(Transaksi).where(Transaksi.kategori_id == kid).limit(1)
    )
    if has_transaksi.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Kategori dipakai transaksi!")

    await db.delete(kat)
    await db.commit()
