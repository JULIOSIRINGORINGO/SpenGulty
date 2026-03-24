from __future__ import annotations

from datetime import date
from typing import Optional
from sqlalchemy import String, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    nama: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    pekerjaan: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tgl_lahir: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    password: Mapped[str] = mapped_column(String(200))
    foto: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    budget: Mapped[Optional[Budget]] = relationship(back_populates="user", uselist=False)
    kategori_list: Mapped[list[Kategori]] = relationship(back_populates="user")
    transaksi_list: Mapped[list[Transaksi]] = relationship(back_populates="user")


class Budget(TimestampMixin, Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    amount: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="budget")


class Kategori(TimestampMixin, Base):
    __tablename__ = "kategori"

    id: Mapped[int] = mapped_column(primary_key=True)
    nama: Mapped[str] = mapped_column(String(100))
    tipe: Mapped[str] = mapped_column(String(20), default="Pengeluaran")
    icon: Mapped[str] = mapped_column(String(50), default="fas fa-wallet")
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    user: Mapped[User] = relationship(back_populates="kategori_list")
    transaksi_list: Mapped[list[Transaksi]] = relationship(back_populates="kategori")


class Transaksi(TimestampMixin, Base):
    __tablename__ = "transaksi"

    id: Mapped[int] = mapped_column(primary_key=True)
    nominal: Mapped[float] = mapped_column(Float)
    keterangan: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    tanggal: Mapped[date] = mapped_column(Date)
    tipe: Mapped[str] = mapped_column(String(20))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    kategori_id: Mapped[int] = mapped_column(ForeignKey("kategori.id"))

    user: Mapped[User] = relationship(back_populates="transaksi_list")
    kategori: Mapped[Kategori] = relationship(back_populates="transaksi_list")
