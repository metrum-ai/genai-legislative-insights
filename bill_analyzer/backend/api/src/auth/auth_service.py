# Created by Metrum AI for Dell
"""Authentication service for the Content Generator"""
import logging
import uuid
from functools import wraps

import bcrypt
import jwt
import redis
from fastapi import HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from .utils import read_config_vars


class AuthService:
    """Service for handling authentication."""

    def __init__(
        self, logger: logging.Logger, oauth2_scheme: OAuth2PasswordBearer
    ):
        """Initialize AuthService."""
        self.logger = logger

        self.oauth2_scheme = oauth2_scheme
        self.configs = self.read_configs()
        try:
            self.redis_client = redis.Redis(
                host=self.configs["REDIS_HOST"],
                port=self.configs["REDIS_PORT"],
                db=self.configs["REDIS_DB"],
            )

            hashed_password = bcrypt.hashpw(
                "default_pass".encode("utf-8"), bcrypt.gensalt()
            )
            self.redis_client.set("default_user", hashed_password)
        except redis.RedisError as error:
            err_msg = f"Failed to connect to Redis: {error}"
            self.logger.error(err_msg)
            raise RuntimeError(err_msg) from error

    def read_configs(self):
        """Read configurations from environment variables."""
        default_configs = {
            "SECRET_KEY": None,
            "ALGORITHM": "HS256",
            "REDIS_HOST": "redis",
            "REDIS_PORT": 6379,
            "REDIS_DB": 0,
        }

        return read_config_vars(default_configs, ["SECRET_KEY"], self.logger)

    def generate_token(self, username: str) -> str:
        """Generate a JWT token."""
        try:
            to_encode = {"sub": username, "jti": str(uuid.uuid4())}
            encoded_jwt = jwt.encode(
                to_encode,
                self.configs["SECRET_KEY"],
                algorithm=self.configs["ALGORITHM"],
            )
            self.redis_client.set(encoded_jwt, username)
            return encoded_jwt
        except jwt.PyJWTError as error:
            err_msg = f"Failed to generate token: {error}"
            self.logger.error(err_msg)
            raise ValueError(err_msg) from error
        except redis.RedisError as error:
            err_msg = f"Failed to store token in Redis: {error}"
            self.logger.error(err_msg)
            raise RuntimeError(err_msg) from error

    def validate_token(self, token: str) -> bool:
        """Validate the given JWT token."""
        try:
            payload = jwt.decode(
                token,
                self.configs["SECRET_KEY"],
                algorithms=[self.configs["ALGORITHM"]],
            )
            username = payload.get("sub")
            if (
                username is None
                or not self.redis_client.exists(token)
                or not self.redis_client.exists(username)
            ):
                return False
            return True
        except jwt.PyJWTError as error:
            self.logger.error("Failed to validate token: %s", error)
            return False
        except redis.RedisError as error:
            err_msg = f"Failed to validate token in Redis: {error}"
            self.logger.error(err_msg)
            raise RuntimeError(err_msg) from error

    def invalidate_token(self, token: str):
        """Invalidate the given JWT token."""
        try:
            self.redis_client.delete(token)
        except redis.RedisError as error:
            err_msg = f"Failed to invalidate token in Redis: {error}"
            self.logger.error(err_msg)
            raise RuntimeError(err_msg) from error

    def validate_credentials(self, username: str, password: str) -> bool:
        """Validate username and password against stored credentials in Redis."""
        try:
            stored_password = self.redis_client.get(username)
            if stored_password is None:
                return False
            return bcrypt.checkpw(password.encode("utf-8"), stored_password)
        except redis.RedisError as error:
            err_msg = f"Failed to validate credentials in Redis: {error}"
            self.logger.error(err_msg)
            raise RuntimeError(err_msg) from error

    def get_username_from_token(self, token: str) -> str:
        """Extract username from the given JWT token."""
        try:
            payload = jwt.decode(
                token,
                self.configs["SECRET_KEY"],
                algorithms=[self.configs["ALGORITHM"]],
            )
            return payload.get("sub")
        except jwt.PyJWTError as error:
            self.logger.error("Failed to decode token: %s", error)
            raise ValueError("Invalid token") from error

    def requires_auth(self, func):
        """Decorator to require authentication for a route."""

        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            token = await self.oauth2_scheme(request)
            if not self.validate_token(token):
                self.logger.error("Unauthorized access attempt")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Unauthorized",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return await func(request, *args, **kwargs)

        return wrapper

    def register_user(self, username: str, password: str):
        """Register a new user with a hashed password."""
        try:
            if self.redis_client.exists(username):
                self.logger.error("Username already registered: %s", username)
                raise ValueError("Username already registered")
            hashed_password = bcrypt.hashpw(
                password.encode("utf-8"), bcrypt.gensalt()
            )
            self.redis_client.set(username, hashed_password)
            self.logger.info("Registered new user: %s", username)
        except redis.RedisError as error:
            err_msg = f"Failed to register user in Redis: {error}"
            self.logger.error(err_msg)
            raise RuntimeError(err_msg) from error

    def change_password(self, username: str, new_password: str):
        """Change the user's password."""
        try:
            if not self.redis_client.exists(username):
                self.logger.error("Username does not exist: %s", username)
                raise ValueError("Username does not exist")
            hashed_password = bcrypt.hashpw(
                new_password.encode("utf-8"), bcrypt.gensalt()
            )
            self.redis_client.set(username, hashed_password)
            self.logger.info("Password changed for user: %s", username)
        except redis.RedisError as error:
            err_msg = f"Failed to change password in Redis: {error}"
            self.logger.error(err_msg)
            raise RuntimeError(err_msg) from error
