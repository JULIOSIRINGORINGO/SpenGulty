from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.db.dependencies import DBSession
from app.models import User, Kategori
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserRead
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEFAULT_CATEGORIES = [
    {"nama": "MAKAN", "icon": "fas fa-utensils", "tipe": "Pengeluaran"},
    {"nama": "TRANSPORTASI", "icon": "fas fa-bus", "tipe": "Pengeluaran"},
    {"nama": "BELANJA", "icon": "fas fa-shopping-bag", "tipe": "Pengeluaran"},
    {"nama": "HIBURAN", "icon": "fas fa-gamepad", "tipe": "Pengeluaran"},
    {"nama": "GAJI", "icon": "fas fa-wallet", "tipe": "Pemasukan"},
]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: DBSession):
    if data.password != data.konfirmasi:
        raise HTTPException(status_code=400, detail="Password dan konfirmasi tidak cocok!")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email ini sudah terdaftar!")

    user = User(
        nama=data.nama,
        email=data.email,
        pekerjaan=data.pekerjaan,
        tgl_lahir=data.tgl_lahir,
        password=hash_password(data.password),
    )
    db.add(user)
    await db.flush()

    for cat in DEFAULT_CATEGORIES:
        db.add(Kategori(nama=cat["nama"], tipe=cat["tipe"], icon=cat["icon"], user_id=user.id))
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: DBSession):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Email atau password salah!")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))
