ALTER TABLE evaluation_sections
  ADD COLUMN description TEXT NULL AFTER title,
  ADD COLUMN columns INT NOT NULL DEFAULT 2 AFTER sort_order;
