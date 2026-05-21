"""Unit tests for Task 1 normalization rules."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from task1_normalize import (  # noqa: E402
    color_norm,
    consolidate,
    name_norm,
    pick_photo,
    sku_norm,
)

COLOR_MAP = {
    "white": "WHITE",
    "White": "WHITE",
    "белый": "WHITE",
    "black": "BLACK",
    "Black": "BLACK",
    "черный": "BLACK",
    "чёрный": "BLACK",
}


def test_sku_norm_removes_hyphens_and_spaces():
    assert sku_norm("TSH-001") == "TSH001"
    assert sku_norm("tsh 001") == "TSH001"
    assert sku_norm("  bag-001  ") == "BAG001"


def test_name_norm_collapses_whitespace():
    assert name_norm("  Футболка   белая  ") == "Футболка белая"
    assert name_norm("Сумка") == "Сумка"


def test_color_norm_uses_color_map():
    assert color_norm("white", COLOR_MAP) == "WHITE"
    assert color_norm("белый", COLOR_MAP) == "WHITE"
    assert color_norm("BLACK", COLOR_MAP) == "BLACK"  # case-insensitive fallback
    assert color_norm("", COLOR_MAP) == ""
    assert color_norm("unknown", COLOR_MAP) == ""


def test_pick_photo_returns_first_non_empty():
    assert pick_photo(["", "https://img/2.jpg", "https://img/3.jpg"]) == "https://img/2.jpg"
    assert pick_photo(["", ""]) == ""


@pytest.fixture
def rows():
    return [
        {"id": 1, "sku": "TSH-001", "name": "Футболка белая", "color": "white", "photo_url": ""},
        {"id": 2, "sku": "TSH001", "name": "Футболка белая ", "color": "белый", "photo_url": "https://img/1.jpg"},
        {"id": 3, "sku": "BAG-001", "name": "Сумка тканевая", "color": "", "photo_url": "https://img/2.jpg"},
        {"id": 4, "sku": "BAG-001", "name": "Сумка тканевая (нов.)", "color": "black", "photo_url": ""},
    ]


def test_consolidate_groups_by_normalized_sku(rows):
    master, issues = consolidate(rows, COLOR_MAP)
    by_sku = {m["sku_norm"]: m for m in master}
    assert set(by_sku) == {"TSH001", "BAG001"}

    tsh = by_sku["TSH001"]
    assert tsh["color_norm"] == "WHITE"
    assert tsh["photo_url_best"] == "https://img/1.jpg"
    assert tsh["issues_flag"] == "DUPLICATE"

    bag = by_sku["BAG001"]
    assert bag["color_norm"] == "BLACK"
    assert bag["photo_url_best"] == "https://img/2.jpg"
    assert bag["issues_flag"] == "DUPLICATE"


def test_issues_lists_duplicates(rows):
    _, issues = consolidate(rows, COLOR_MAP)
    types = [i["issue_type"] for i in issues]
    assert types.count("DUPLICATE") == 2


def test_missing_attr_flag():
    rows = [
        {"id": 1, "sku": "CUP-1", "name": "Cup", "color": "", "photo_url": ""},
    ]
    master, issues = consolidate(rows, COLOR_MAP)
    assert master[0]["issues_flag"] == "MISSING_ATTR"
    assert any(i["issue_type"] == "MISSING_ATTR" for i in issues)
