"""Smoke test for Task 2 SQL queries.

We execute the 4 queries against an in-memory SQLite database with seed
data. SQLite shares the SQL syntax we depend on (LEFT JOIN, subqueries,
ROUND/2, <> operator), so this is a useful regression check even though
the deliverable targets PostgreSQL.
"""
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from task2_build_xlsx import extract_queries  # noqa: E402


SCHEMA = """
CREATE TABLE orders (
    id           INTEGER PRIMARY KEY,
    order_no     TEXT NOT NULL,
    total_amount REAL NOT NULL,
    currency     TEXT NOT NULL,
    status       TEXT NOT NULL
);
CREATE TABLE order_lines (
    id        INTEGER PRIMARY KEY,
    order_id  INTEGER NOT NULL REFERENCES orders(id),
    qty       REAL NOT NULL,
    price     REAL NOT NULL
);
CREATE TABLE payments (
    id        INTEGER PRIMARY KEY,
    order_id  INTEGER NOT NULL REFERENCES orders(id),
    amount    REAL NOT NULL,
    currency  TEXT NOT NULL,
    status    TEXT NOT NULL
);
"""

SEED = [
    # Order 1 — clean (700 = 2*350)
    ("INSERT INTO orders VALUES (1, 'SO-0001', 700, 'RUB', 'paid')", ()),
    ("INSERT INTO order_lines VALUES (1, 1, 2, 350)", ()),
    ("INSERT INTO payments VALUES (1, 1, 700, 'RUB', 'paid')", ()),

    # Order 2 — no lines (issue #1)
    ("INSERT INTO orders VALUES (2, 'SO-0002', 1000, 'RUB', 'new')", ()),

    # Order 3 — total mismatch: lines = 950, total = 900 (issue #2)
    ("INSERT INTO orders VALUES (3, 'SO-0003', 900, 'RUB', 'new')", ()),
    ("INSERT INTO order_lines VALUES (2, 3, 1, 500)", ()),
    ("INSERT INTO order_lines VALUES (3, 3, 1, 450)", ()),

    # Order 4 — paid but underpaid (issue #3)
    ("INSERT INTO orders VALUES (4, 'SO-0004', 500, 'RUB', 'paid')", ()),
    ("INSERT INTO order_lines VALUES (4, 4, 1, 500)", ()),
    ("INSERT INTO payments VALUES (2, 4, 300, 'RUB', 'paid')", ()),
    ("INSERT INTO payments VALUES (3, 4, 100, 'RUB', 'failed')", ()),

    # Order 5 — currency mismatch on a paid payment (issue #4)
    ("INSERT INTO orders VALUES (5, 'SO-0005', 100, 'USD', 'paid')", ()),
    ("INSERT INTO order_lines VALUES (5, 5, 1, 100)", ()),
    ("INSERT INTO payments VALUES (4, 5, 100, 'RUB', 'paid')", ()),
]


def _seed(conn):
    conn.executescript(SCHEMA)
    for sql, params in SEED:
        conn.execute(sql, params)
    conn.commit()


@pytest.fixture
def conn():
    c = sqlite3.connect(":memory:")
    c.row_factory = sqlite3.Row
    _seed(c)
    yield c
    c.close()


@pytest.fixture
def queries():
    return extract_queries(Path(__file__).resolve().parent.parent / "task2_sql_checks.sql")


def test_query_count(queries):
    assert len(queries) == 4


def test_q1_orders_without_lines(conn, queries):
    rows = conn.execute(queries[0]).fetchall()
    nos = [r["order_no"] for r in rows]
    assert nos == ["SO-0002"]


def test_q2_total_mismatch(conn, queries):
    rows = conn.execute(queries[1]).fetchall()
    nos = [r["order_no"] for r in rows]
    assert nos == ["SO-0003"]
    assert rows[0]["lines_amount"] == 950
    assert rows[0]["delta"] == -50  # total(900) - lines(950)


def test_q3_paid_underpaid(conn, queries):
    rows = conn.execute(queries[2]).fetchall()
    nos = [r["order_no"] for r in rows]
    assert nos == ["SO-0004"]
    assert rows[0]["paid_amount"] == 300
    assert rows[0]["unpaid_amount"] == 200


def test_q4_currency_mismatch(conn, queries):
    rows = conn.execute(queries[3]).fetchall()
    nos = [r["order_no"] for r in rows]
    assert nos == ["SO-0005"]
    assert rows[0]["order_currency"] == "USD"
    assert rows[0]["payment_currency"] == "RUB"
