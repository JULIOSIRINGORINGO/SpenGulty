from __future__ import annotations

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload

from app.db.dependencies import DBSession
from app.auth import CurrentUser
from app.models import Transaksi, Kategori
from app.schemas import (
    TransaksiRead, TransaksiCreate, TransaksiUpdate,
    DashboardData, UserRead, ChartData, ChartItem,
    BudgetRead, BudgetUpdate,
)
from app.models import Budget

router = APIRouter(prefix="/api", tags=["transactions"])


# --- Dashboard ---
@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard(user: CurrentUser, db: DBSession):
    budget_result = await db.execute(select(Budget).where(Budget.user_id == user.id))
    budget = budget_result.scalar_one_or_none()
    saldo_awal = budget.amount if budget else 0

    pengeluaran = await db.execute(
        select(func.coalesce(func.sum(Transaksi.nominal), 0))
        .where(Transaksi.user_id == user.id, Transaksi.tipe == "Pengeluaran")
    )
    total_pengeluaran = pengeluaran.scalar()

    pemasukan = await db.execute(
        select(func.coalesce(func.sum(Transaksi.nominal), 0))
        .where(Transaksi.user_id == user.id, Transaksi.tipe == "Pemasukan")
    )
    total_pemasukan = pemasukan.scalar()

    sisa = (saldo_awal + total_pemasukan) - total_pengeluaran

    return DashboardData(
        user=UserRead.model_validate(user),
        total_pengeluaran=total_pengeluaran,
        total_pemasukan=total_pemasukan,
        sisa_saldo=sisa,
        budget=saldo_awal,
    )


# --- Transactions ---
@router.get("/transactions", response_model=list[TransaksiRead])
async def get_transactions(
    user: CurrentUser,
    db: DBSession,
    q: str | None = None,
    cat_id: int | None = None,
    month: str | None = None,
    sort: str | None = None,
):
    query = (
        select(Transaksi)
        .options(selectinload(Transaksi.kategori))
        .where(Transaksi.user_id == user.id)
    )

    if cat_id:
        query = query.where(Transaksi.kategori_id == cat_id)
    if month and "-" in month:
        y, m = month.split("-")
        query = query.where(
            extract("year", Transaksi.tanggal) == int(y),
            extract("month", Transaksi.tanggal) == int(m),
        )
    if q:
        query = query.join(Kategori).where(
            Transaksi.keterangan.ilike(f"%{q}%") | Kategori.nama.ilike(f"%{q}%")
        )

    if sort == "terbanyak":
        query = query.order_by(Transaksi.nominal.desc())
    elif sort == "terkecil":
        query = query.order_by(Transaksi.nominal.asc())
    else:
        query = query.order_by(Transaksi.tanggal.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/transactions", response_model=TransaksiRead, status_code=201)
async def create_transaction(data: TransaksiCreate, user: CurrentUser, db: DBSession):
    kat_result = await db.execute(select(Kategori).where(Kategori.id == data.kategori_id))
    kat = kat_result.scalar_one_or_none()
    if not kat:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")

    t = Transaksi(
        nominal=data.nominal,
        keterangan=data.keterangan,
        tanggal=data.tanggal,
        tipe=kat.tipe,
        user_id=user.id,
        kategori_id=data.kategori_id,
    )
    db.add(t)
    await db.commit()
    await db.refresh(t, attribute_names=["kategori"])
    return t


@router.put("/transactions/{tid}", response_model=TransaksiRead)
async def update_transaction(tid: int, data: TransaksiUpdate, user: CurrentUser, db: DBSession):
    result = await db.execute(
        select(Transaksi).options(selectinload(Transaksi.kategori)).where(Transaksi.id == tid, Transaksi.user_id == user.id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")

    if data.nominal is not None:
        t.nominal = data.nominal
    if data.keterangan is not None:
        t.keterangan = data.keterangan
    if data.tanggal is not None:
        t.tanggal = data.tanggal
    if data.kategori_id is not None:
        kat_result = await db.execute(select(Kategori).where(Kategori.id == data.kategori_id))
        kat = kat_result.scalar_one_or_none()
        if kat:
            t.kategori_id = data.kategori_id
            t.tipe = kat.tipe

    await db.commit()
    await db.refresh(t, attribute_names=["kategori"])
    return t


@router.delete("/transactions/{tid}", status_code=204)
async def delete_transaction(tid: int, user: CurrentUser, db: DBSession):
    result = await db.execute(select(Transaksi).where(Transaksi.id == tid, Transaksi.user_id == user.id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    await db.delete(t)
    await db.commit()


# --- Budget ---
@router.get("/budget", response_model=Optional[BudgetRead])
async def get_budget(user: CurrentUser, db: DBSession):
    result = await db.execute(select(Budget).where(Budget.user_id == user.id))
    return result.scalar_one_or_none()


@router.post("/budget", response_model=BudgetRead)
async def set_budget(data: BudgetUpdate, user: CurrentUser, db: DBSession):
    result = await db.execute(select(Budget).where(Budget.user_id == user.id))
    budget = result.scalar_one_or_none()

    if budget:
        budget.amount = data.amount
    else:
        budget = Budget(user_id=user.id, amount=data.amount)
        db.add(budget)

    await db.commit()
    await db.refresh(budget)
    return budget


# --- Chart ---
@router.get("/chart", response_model=ChartData)
async def get_chart(user: CurrentUser, db: DBSession, month: str | None = None):
    if not month:
        now = datetime.now()
        month = now.strftime("%Y-%m")

    try:
        current_date = datetime.strptime(month, "%Y-%m")
    except ValueError:
        current_date = datetime.now()
        month = current_date.strftime("%Y-%m")

    nama_bulan = [
        "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ]
    display_month = f"{nama_bulan[current_date.month]} {current_date.year}"

    y, m = month.split("-")
    result = await db.execute(
        select(Transaksi)
        .options(selectinload(Transaksi.kategori))
        .where(
            Transaksi.user_id == user.id,
            Transaksi.tipe == "Pengeluaran",
            extract("year", Transaksi.tanggal) == int(y),
            extract("month", Transaksi.tanggal) == int(m),
        )
    )
    transaksi = result.scalars().all()

    cat_totals: dict[str, float] = {}
    grand_total = 0.0
    for t in transaksi:
        nama = t.kategori.nama
        nominal = t.nominal or 0
        cat_totals[nama] = cat_totals.get(nama, 0) + nominal
        grand_total += nominal

    data_list = []
    for k, v in cat_totals.items():
        persen = round((v / grand_total) * 100) if grand_total > 0 else 0
        data_list.append(ChartItem(nama=k, total=v, persen=persen))

    data_list.sort(key=lambda x: x.total, reverse=True)

    return ChartData(display_month=display_month, current_month=month, data_list=data_list)
