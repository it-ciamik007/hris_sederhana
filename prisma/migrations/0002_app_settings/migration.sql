CREATE TABLE app_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NULL,
  setting_key VARCHAR(150) NOT NULL,
  setting_value JSON NOT NULL,
  is_secret TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_app_setting (company_id, setting_key),
  KEY idx_app_settings_key (setting_key),
  CONSTRAINT fk_app_settings_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
