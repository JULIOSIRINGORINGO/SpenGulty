from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Auth Schemas ---
class RegisterRequest(BaseModel):
    nama: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=4)
    konfirmasi: str
    pekerjaan: str | None = None
    tgl_lahir: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


# --- User Schemas ---
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nama: str
    email: str
    pekerjaan: str | None = None
    tgl_lahir: str | None = None
    foto: str | None = None


class UserUpdate(BaseModel):
    nama: str | None = None
    pekerjaan: str | None = None
    password: str | None = None


# --- Budget Schemas ---
class BudgetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    amount: int


class BudgetUpdate(BaseModel):
    amount: int


# --- Kategori Schemas ---
class KategoriRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nama: str
    tipe: str
    icon: str
    user_id: int


class KategoriCreate(BaseModel):
    nama: str = Field(min_length=1, max_length=100)
    tipe: str = "Pengeluaran"
    icon: str = "fas fa-hashtag"


# --- Transaksi Schemas ---
class TransaksiRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nominal: float
    keterangan: str | None = None
    tanggal: date
    tipe: str
    user_id: int
    kategori_id: int
    kategori: KategoriRead | None = None


class TransaksiCreate(BaseModel):
    nominal: int
    keterangan: str | None = None
    tanggal: date
    kategori_id: int


class TransaksiUpdate(BaseModel):
    nominal: int | None = None
    keterangan: str | None = None
    tanggal: date | None = None
    kategori_id: int | None = None


# --- Dashboard Schemas ---
class DashboardData(BaseModel):
    user: UserRead
    total_pengeluaran: float
    total_pemasukan: float
    sisa_saldo: float
    budget: int


# --- Chart Schemas ---
class ChartItem(BaseModel):
    nama: str
    total: float
    persen: int


class ChartData(BaseModel):
    display_month: str
    current_month: str
    data_list: list[ChartItem]
