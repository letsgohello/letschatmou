"""Shared utilities for notebooks."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

# Configure pandas display
pd.set_option("display.max_columns", 200)
pd.set_option("display.width", 140)
pd.set_option("display.max_colwidth", 120)


def _get_project_root() -> Path:
    """Find project root by locating this file and navigating up."""
    # This file is in notebooks/, so go up one level to project root
    return Path(__file__).parent.parent.parent


def _get_data_path(tier: str) -> Path:
    """Get path to data/<tier> directory relative to project root."""
    project_root = _get_project_root()
    return project_root / "data" / tier


# Data directories
BRONZE_DIR = _get_data_path("bronze")
GOLD_DIR = _get_data_path("gold")


def validate_paths(*paths: Path, raise_on_missing: bool = True) -> list[Path]:
    """Validate that paths exist.

    Args:
        *paths: Paths to validate.
        raise_on_missing: If True, raises FileNotFoundError for missing paths.
                         If False, returns list of missing paths.

    Returns:
        List of missing paths (only if raise_on_missing=False).

    Raises:
        FileNotFoundError: If any path is missing and raise_on_missing=True.
    """
    missing = [p for p in paths if not p.exists()]

    if missing and raise_on_missing:
        missing_str = "\n  ".join(str(p) for p in missing)
        raise FileNotFoundError(f"Required paths not found:\n  {missing_str}")

    return missing


def currency_to_float(value: object) -> float:
    """Parse a single currency value to float.

    Handles formats like '$3,119.39', ' $70.38 ', etc.
    Returns np.nan for invalid/empty values.
    """
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return np.nan

    if isinstance(value, (int, float)):
        return float(value)

    s = str(value).strip()
    if not s or s.lower() in {"na", "n/a", "null", "none"}:
        return np.nan

    # Remove currency symbols and format
    s = s.replace("$", "").replace(",", "").strip()

    try:
        return float(s)
    except (ValueError, OverflowError):
        return np.nan
