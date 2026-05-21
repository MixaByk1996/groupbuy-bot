-- =============================================================================
-- Task 2 — SQL data-quality checks for the orders / order_lines / payments
-- schema. PostgreSQL dialect.
--
-- Schema (per task brief):
--   orders(id, order_no, total_amount, currency, status)
--   order_lines(id, order_id, qty, price)
--   payments(id, order_id, amount, currency, status)  -- status in ('paid','failed')
-- =============================================================================


-- #1 — Orders without any order_lines.
SELECT
    o.id          AS order_id,
    o.order_no,
    o.status
FROM orders AS o
LEFT JOIN order_lines AS l ON l.order_id = o.id
WHERE l.id IS NULL
ORDER BY o.order_no;


-- #2 — Orders where the declared total_amount disagrees with SUM(qty*price)
-- by more than 1 unit. Orders with no lines are excluded (they belong to #1).
SELECT
    o.order_no,
    o.total_amount,
    COALESCE(s.lines_amount, 0)                       AS lines_amount,
    ROUND(o.total_amount - COALESCE(s.lines_amount, 0), 2) AS delta
FROM orders AS o
JOIN (
    SELECT order_id, SUM(qty * price) AS lines_amount
    FROM order_lines
    GROUP BY order_id
) AS s ON s.order_id = o.id
WHERE ABS(o.total_amount - s.lines_amount) > 1
ORDER BY ABS(o.total_amount - s.lines_amount) DESC;


-- #3 — Orders flagged as `paid` whose cumulative paid payments are still
-- below total_amount (under-paid). Only payments with status='paid' count
-- toward paid_amount.
SELECT
    o.order_no,
    o.total_amount,
    COALESCE(p.paid_amount, 0)                  AS paid_amount,
    ROUND(o.total_amount - COALESCE(p.paid_amount, 0), 2) AS unpaid_amount
FROM orders AS o
LEFT JOIN (
    SELECT order_id, SUM(amount) AS paid_amount
    FROM payments
    WHERE status = 'paid'
    GROUP BY order_id
) AS p ON p.order_id = o.id
WHERE o.status = 'paid'
  AND COALESCE(p.paid_amount, 0) < o.total_amount
ORDER BY unpaid_amount DESC;


-- #4 — Currency mismatch: a payment marked `paid` whose currency does not
-- match the order's currency.
SELECT
    o.order_no,
    o.currency  AS order_currency,
    p.currency  AS payment_currency,
    p.amount
FROM payments AS p
JOIN orders   AS o ON o.id = p.order_id
WHERE p.status = 'paid'
  AND p.currency <> o.currency
ORDER BY o.order_no, p.id;
