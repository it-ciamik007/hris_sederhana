UPDATE leave_policies
SET annual_quota = 16.00
WHERE is_default = 1
  AND annual_quota = 12.00;
