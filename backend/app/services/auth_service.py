from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    def create_tokens(self, user_id: str) -> dict:
        return {
            "access_token": create_access_token(user_id),
            "refresh_token": create_refresh_token(user_id),
            "token_type": "bearer",
        }

    async def refresh_access_token(self, refresh_token: str) -> Optional[dict]:
        user_id = decode_token(refresh_token)
        if not user_id:
            return None
        user = await self.repo.get(user_id)
        if not user or not user.is_active:
            return None
        return self.create_tokens(str(user.id))
