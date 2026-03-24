import os
import shutil
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from sqlalchemy import select

from app.db.dependencies import DBSession
from app.auth import CurrentUser, hash_password
from app.schemas import UserRead
from app.config import get_settings

router = APIRouter(prefix="/api/profile", tags=["profile"])
settings = get_settings()


@router.get("/", response_model=UserRead)
async def get_profile(user: CurrentUser):
    return UserRead.model_validate(user)


@router.put("/", response_model=UserRead)
async def update_profile(
    user: CurrentUser,
    db: DBSession,
    nama: str = Form(None),
    pekerjaan: str = Form(None),
    password: str = Form(None),
    foto: Optional[UploadFile] = File(None),
):
    if nama:
        user.nama = nama
    if pekerjaan is not None:
        user.pekerjaan = pekerjaan
    if password:
        user.password = hash_password(password)

    if foto and foto.filename:
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"user_{user.id}_{foto.filename}"
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(foto.file, f)
        user.foto = filename

    await db.commit()
    await db.refresh(user)
    return UserRead.model_validate(user)
