# Тестовое задание — Разработчик (issue #354)

Implementation of the test assignment attached to
[issue #354](https://github.com/MixaByk1996/groupbuy-bot/issues/354).

## Task

> **ClickHouse SQL query** — вывести список UserID, у которых хотя бы один раз
> был депозит в каждый из двух последовательных календарных дней.
> Например: 02-01 и 02-02. Или: 02-05 и 02-06.

Source table: `UserActivity (UserID, Event, Time)`

## Solution

See [`solution.sql`](solution.sql).

### Approach

1. Extract distinct `(UserID, deposit_date)` pairs where `Event = 'deposit'`.
2. Self-join on the same `UserID` where one date is exactly one calendar day
   after the other (`d2.deposit_date = d1.deposit_date + INTERVAL 1 DAY`).
3. Return `DISTINCT UserID` from the join, ordered for stable output.

```sql
SELECT DISTINCT d1.UserID
FROM (
    SELECT DISTINCT
        UserID,
        toDate(Time) AS deposit_date
    FROM UserActivity
    WHERE Event = 'deposit'
) AS d1
INNER JOIN (
    SELECT DISTINCT
        UserID,
        toDate(Time) AS deposit_date
    FROM UserActivity
    WHERE Event = 'deposit'
) AS d2
    ON d1.UserID = d2.UserID
   AND d2.deposit_date = d1.deposit_date + INTERVAL 1 DAY
ORDER BY d1.UserID;
```

### Expected result on the sample data

| UserID | Deposit days with consecutive pair |
|--------|------------------------------------|
| 1      | 2026-02-01, 2026-02-02             |
| 2      | 2026-02-01, 2026-02-02             |
| 3      | 2026-02-02, 2026-02-03             |
| 4      | 2026-02-05, 2026-02-06             |

User 5 is **excluded** — only one deposit day (2026-02-02).

## Tests

The query logic is validated with an in-memory SQLite fixture (SQLite shares
the relevant date-arithmetic behaviour with ClickHouse for this problem).

```bash
pytest test_assignment_354/tests/ -v
```

```
11 passed
```

### Coverage

- Qualifying users from the sample dataset (users 1–4).
- Excluded user (user 5 — single deposit day).
- Non-deposit events (logins) do not count.
- Single deposit day → excluded.
- Gap of two days → excluded (not consecutive).
- Multiple deposits on the same day count as one distinct day.

## Layout

```
test_assignment_354/
├── README.md          # this file
├── solution.sql       # ClickHouse query (the deliverable)
└── tests/
    ├── __init__.py
    └── test_solution.py   # 11 unit tests
```
