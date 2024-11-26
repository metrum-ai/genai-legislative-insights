# Created by Metrum AI for Dell
""""Utility methods for the auth module"""

import logging
import os
from functools import wraps

from fastapi import HTTPException, status


def configure_logger(logger_name: str) -> logging.Logger:
    """Configures a logger with the specified logger_name."""
    logging.basicConfig(
        filename="auth_server.log",
        filemode="a",
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        level=logging.INFO,
    )

    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)

    return logger


def read_config_vars(
    default_configs: dict[str, str],
    required_configs: list[str],
    logger: logging.Logger,
) -> dict[str, str]:
    """Read and set configurations based on set or default."""
    for var, default in default_configs.items():
        value = os.getenv(var, default)
        if var in required_configs and value is None:
            logger.error(f"{var} is not set.")
            raise RuntimeError(
                f"{var} must be set as an environment variable."
            )
        default_configs[var] = value

    return default_configs


def handle_exceptions(func):
    """Decorator to handle exceptions and return appropriate HTTP responses."""

    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=str(error)
            ) from error
        except RuntimeError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(error),
            ) from error

    return wrapper
