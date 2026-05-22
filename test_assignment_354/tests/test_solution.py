"""
Tests for the consecutive-deposit-days SQL query (issue #354).

The ClickHouse query is validated against an in-memory SQLite database.
SQLite uses DATE(Time) and date arithmetic via julianday() instead of
ClickHouse's toDate() / INTERVAL 1 DAY, but the logic is identical.
"""

import sqlite3
import pytest


SAMPLE_DATA = [
    # UserID, Event,     Time
    (1, "deposit", "2026-02-01 09:00:00"),
    (1, "login",   "2026-02-02 10:00:00"),
    (1, "deposit", "2026-02-02 12:00:00"),
    (1, "login",   "2026-02-04 11:00:00"),
    (2, "deposit", "2026-02-01 08:00:00"),
    (2, "deposit", "2026-02-02 08:30:00"),
    (2, "login",   "2026-02-03 09:00:00"),
    (3, "deposit", "2026-02-02 14:00:00"),
    (3, "deposit", "2026-02-03 15:00:00"),
    (4, "deposit", "2026-02-05 09:00:00"),
    (4, "deposit", "2026-02-06 09:30:00"),
    (5, "login",   "2026-02-01 16:00:00"),
    (5, "deposit", "2026-02-02 16:30:00"),
]

# SQLite equivalent of the ClickHouse query
SQLITE_QUERY = """
SELECT DISTINCT d1.UserID
FROM (
    SELECT DISTINCT UserID, DATE(Time) AS deposit_date
    FROM UserActivity
    WHERE Event = 'deposit'
) AS d1
INNER JOIN (
    SELECT DISTINCT UserID, DATE(Time) AS deposit_date
    FROM UserActivity
    WHERE Event = 'deposit'
) AS d2
    ON d1.UserID = d2.UserID
   AND julianday(d2.deposit_date) = julianday(d1.deposit_date) + 1
ORDER BY d1.UserID
"""


@pytest.fixture
def db():
    conn = sqlite3.connect(":memory:")
    conn.execute(
        "CREATE TABLE UserActivity (UserID INTEGER, Event TEXT, Time TEXT)"
    )
    conn.executemany(
        "INSERT INTO UserActivity VALUES (?, ?, ?)", SAMPLE_DATA
    )
    conn.commit()
    yield conn
    conn.close()


def run_query(conn):
    return [row[0] for row in conn.execute(SQLITE_QUERY).fetchall()]


class TestConsecutiveDepositDays:
    def test_all_qualifying_users_returned(self, db):
        """Users 1-4 each have deposits on two consecutive days."""
        result = run_query(db)
        assert result == [1, 2, 3, 4]

    def test_user1_consecutive_days(self, db):
        """User 1: deposits on 2026-02-01 and 2026-02-02."""
        result = run_query(db)
        assert 1 in result

    def test_user2_consecutive_days(self, db):
        """User 2: deposits on 2026-02-01 and 2026-02-02."""
        result = run_query(db)
        assert 2 in result

    def test_user3_consecutive_days(self, db):
        """User 3: deposits on 2026-02-02 and 2026-02-03."""
        result = run_query(db)
        assert 3 in result

    def test_user4_consecutive_days(self, db):
        """User 4: deposits on 2026-02-05 and 2026-02-06."""
        result = run_query(db)
        assert 4 in result

    def test_user5_excluded(self, db):
        """User 5 only has one deposit (2026-02-02); not two consecutive days."""
        result = run_query(db)
        assert 5 not in result

    def test_non_deposit_events_ignored(self, db):
        """Login events must not count toward consecutive deposit days."""
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (6, "login", "2026-02-01 10:00:00"),
        )
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (6, "login", "2026-02-02 10:00:00"),
        )
        db.commit()
        result = run_query(db)
        assert 6 not in result

    def test_single_deposit_day_excluded(self, db):
        """A user with deposits only on one day must not appear."""
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (7, "deposit", "2026-02-10 10:00:00"),
        )
        db.commit()
        result = run_query(db)
        assert 7 not in result

    def test_gap_day_excluded(self, db):
        """A user with deposits two days apart (not consecutive) must not appear."""
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (8, "deposit", "2026-02-01 10:00:00"),
        )
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (8, "deposit", "2026-02-03 10:00:00"),
        )
        db.commit()
        result = run_query(db)
        assert 8 not in result

    def test_multiple_deposits_same_day_counted_once(self, db):
        """Multiple deposits on the same day count as one distinct day."""
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (9, "deposit", "2026-02-01 10:00:00"),
        )
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (9, "deposit", "2026-02-01 18:00:00"),
        )
        db.execute(
            "INSERT INTO UserActivity VALUES (?, ?, ?)",
            (9, "deposit", "2026-02-02 10:00:00"),
        )
        db.commit()
        result = run_query(db)
        assert 9 in result

    def test_result_count(self, db):
        """Exactly 4 users qualify from the sample dataset."""
        result = run_query(db)
        assert len(result) == 4
