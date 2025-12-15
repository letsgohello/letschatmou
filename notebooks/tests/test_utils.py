"""Tests for utils module."""

import numpy as np
import pandas as pd

from utils import BRONZE_DIR, GOLD_DIR, currency_to_float


class TestDataPaths:
    """Test data directory path resolution."""

    def test_bronze_dir_exists(self):
        """Bronze directory should exist."""
        assert BRONZE_DIR.exists(), f"Bronze dir not found: {BRONZE_DIR}"

    def test_gold_dir_exists(self):
        """Gold directory should exist."""
        assert GOLD_DIR.exists(), f"Gold dir not found: {GOLD_DIR}"

    def test_bronze_dir_has_salaries(self):
        """Bronze directory should contain salaries.json."""
        assert (BRONZE_DIR / "salaries.json").exists()

    def test_bronze_dir_has_job_descriptions(self):
        """Bronze directory should contain job-descriptions.json."""
        assert (BRONZE_DIR / "job-descriptions.json").exists()


class TestCleanSalaries:
    """Test salary cleaning function."""

    def test_basic_currency_format(self):
        """Test basic currency formats."""
        series = pd.Series(["$70.38", "$3,119.39", " $4,375.47 "])
        result = currency_to_float(series)
        expected = pd.Series([70.38, 3119.39, 4375.47])
        pd.testing.assert_series_equal(result, expected)

    def test_empty_and_null_values(self):
        """Test handling of empty strings and null values."""
        series = pd.Series(["", None, "na", "n/a", "null", "none"])
        result = currency_to_float(series)
        assert result.isna().all(), "All null/empty values should become NaN"

    def test_already_numeric(self):
        """Test that numeric values pass through."""
        series = pd.Series([100.0, 200, 300.5])
        result = currency_to_float(series)
        pd.testing.assert_series_equal(result, series.astype(float))

    def test_mixed_formats(self):
        """Test mixed valid and invalid values."""
        series = pd.Series(["$1,000", "invalid", "$50.25", "", "2,500.75"])
        result = currency_to_float(series)
        assert result.iloc[0] == 1000.0
        assert pd.isna(result.iloc[1])  # invalid
        assert result.iloc[2] == 50.25
        assert pd.isna(result.iloc[3])  # empty
        assert result.iloc[4] == 2500.75

    def test_negative_values(self):
        """Test negative currency values."""
        series = pd.Series(["-$100", "-$50.25"])
        result = currency_to_float(series)
        expected = pd.Series([-100.0, -50.25])
        pd.testing.assert_series_equal(result, expected)

    def test_whitespace_handling(self):
        """Test that whitespace is properly stripped."""
        series = pd.Series(["  $100  ", " $200 ", "\t$300\t"])
        result = currency_to_float(series)
        expected = pd.Series([100.0, 200.0, 300.0])
        pd.testing.assert_series_equal(result, expected)

    def test_nan_preservation(self):
        """Test that existing NaN values are preserved."""
        series = pd.Series([np.nan, "$100", np.nan])
        result = currency_to_float(series)
        assert pd.isna(result.iloc[0])
        assert result.iloc[1] == 100.0
        assert pd.isna(result.iloc[2])
