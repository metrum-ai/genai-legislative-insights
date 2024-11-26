# Created by Metrum AI for Dell
""""Utility methods for the auth module"""

import os


def read_config_vars(
    default_configs: dict[str, str],
) -> dict[str, str]:
    """Read and set configurations based on set or default."""
    for var, default in default_configs.items():
        value = os.getenv(var, default)
        default_configs[var] = value
    return default_configs
