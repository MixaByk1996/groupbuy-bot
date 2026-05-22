-- ClickHouse SQL: find UserIDs with at least one deposit on each of two consecutive calendar days.
--
-- Strategy:
--   1. Extract distinct (UserID, deposit_date) pairs from UserActivity where Event = 'deposit'.
--   2. Self-join on the same UserID where one date is exactly one day after the other.
--   3. Return distinct UserIDs that satisfy the condition.

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
