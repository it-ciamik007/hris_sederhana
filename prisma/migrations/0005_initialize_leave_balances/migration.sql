INSERT INTO leave_balances (
  id,
  employee_id,
  leave_type_id,
  period_year,
  quota,
  used,
  remaining,
  created_at
)
SELECT
  UUID(),
  e.id,
  lt.id,
  YEAR(CURDATE()),
  COALESCE(lp.annual_quota, 16.00),
  0.00,
  COALESCE(lp.annual_quota, 16.00),
  CURRENT_TIMESTAMP
FROM employees e
JOIN leave_types lt
  ON lt.company_id = e.company_id
  AND lt.deducts_balance = 1
  AND lt.is_active = 1
LEFT JOIN leave_policies lp
  ON lp.company_id = e.company_id
  AND lp.is_default = 1
WHERE NOT EXISTS (
  SELECT 1
  FROM leave_balances lb
  WHERE lb.employee_id = e.id
    AND lb.leave_type_id = lt.id
    AND lb.period_year = YEAR(CURDATE())
);
