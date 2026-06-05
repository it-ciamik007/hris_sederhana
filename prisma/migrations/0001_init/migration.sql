CREATE TABLE companies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200) NULL,
  tax_number VARCHAR(100) NULL,
  address TEXT NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  logo_file_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE files (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NULL,
  size_bytes BIGINT NULL,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
  storage_path TEXT NOT NULL,
  uploaded_by CHAR(36) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_files_company (company_id),
  CONSTRAINT fk_files_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE companies
  ADD CONSTRAINT fk_companies_logo_file FOREIGN KEY (logo_file_id) REFERENCES files(id);

CREATE TABLE branches (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  address TEXT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_branches_company (company_id),
  CONSTRAINT fk_branches_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  parent_department_id CHAR(36) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_departments_company (company_id),
  KEY idx_departments_parent (parent_department_id),
  CONSTRAINT fk_departments_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_departments_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE positions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  level_order INT NOT NULL DEFAULT 1,
  is_spv_level TINYINT(1) NOT NULL DEFAULT 0,
  is_manager_level TINYINT(1) NOT NULL DEFAULT 0,
  is_partner_level TINYINT(1) NOT NULL DEFAULT 0,
  is_hr_level TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_positions_company (company_id),
  CONSTRAINT fk_positions_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE employees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  branch_id CHAR(36) NULL,
  department_id CHAR(36) NULL,
  position_id CHAR(36) NULL,
  supervisor_id CHAR(36) NULL,
  employee_number VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  nik VARCHAR(16) NULL,
  gender VARCHAR(20) NULL,
  birth_place VARCHAR(100) NULL,
  birth_date DATE NULL,
  phone VARCHAR(30) NULL,
  whatsapp_number VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  address TEXT NULL,
  join_date DATE NOT NULL,
  resigned_date DATE NULL,
  employment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  bank_name VARCHAR(100) NULL,
  bank_account_number VARCHAR(100) NULL,
  npwp VARCHAR(100) NULL,
  bpjs_kesehatan VARCHAR(100) NULL,
  bpjs_ketenagakerjaan VARCHAR(100) NULL,
  fingerprint_user_id VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_employee_number (company_id, employee_number),
  UNIQUE KEY uq_employee_nik (company_id, nik),
  KEY idx_employees_company_name (company_id, full_name),
  KEY idx_employees_fingerprint (fingerprint_user_id),
  CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_employees_position FOREIGN KEY (position_id) REFERENCES positions(id),
  CONSTRAINT fk_employees_supervisor FOREIGN KEY (supervisor_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_company_code (company_id, code),
  CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NULL,
  code VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_permissions_company_code (company_id, code),
  CONSTRAINT fk_permissions_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE employee_documents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  file_id CHAR(36) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  expires_at DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_employee_documents_employee (employee_id),
  CONSTRAINT fk_employee_documents_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_employee_documents_file FOREIGN KEY (file_id) REFERENCES files(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leave_types (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  requires_attachment TINYINT(1) NOT NULL DEFAULT 0,
  deducts_balance TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_leave_type_code (company_id, code),
  CONSTRAINT fk_leave_types_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leave_policies (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  annual_quota DECIMAL(8,2) NOT NULL DEFAULT 12.00,
  allow_negative_balance TINYINT(1) NOT NULL DEFAULT 0,
  exclude_holidays TINYINT(1) NOT NULL DEFAULT 1,
  exclude_weekends TINYINT(1) NOT NULL DEFAULT 1,
  is_default TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_leave_policies_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE holidays (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  holiday_date DATE NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_national TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_holiday_date (company_id, holiday_date),
  CONSTRAINT fk_holidays_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shifts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  late_tolerance_minutes INT NOT NULL DEFAULT 15,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shift_code (company_id, code),
  CONSTRAINT fk_shifts_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE approval_requests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  module VARCHAR(100) NOT NULL,
  reference_id CHAR(36) NOT NULL,
  requester_id CHAR(36) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
  current_step_no INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  KEY idx_approval_reference (module, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE approval_steps (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  approval_request_id CHAR(36) NOT NULL,
  step_no INT NOT NULL,
  approver_type VARCHAR(50) NOT NULL,
  approver_employee_id CHAR(36) NULL,
  approver_role_code VARCHAR(50) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  action_by CHAR(36) NULL,
  action_at DATETIME NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_approval_step (approval_request_id, step_no),
  CONSTRAINT fk_approval_steps_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE approval_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  approval_request_id CHAR(36) NOT NULL,
  step_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_approval_token_hash (token_hash),
  CONSTRAINT fk_approval_tokens_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id),
  CONSTRAINT fk_approval_tokens_step FOREIGN KEY (step_id) REFERENCES approval_steps(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leave_requests (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  leave_type_id CHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time DATETIME NULL,
  end_time DATETIME NULL,
  duration_days DECIMAL(8,2) NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  attachment_file_id CHAR(36) NULL,
  approval_request_id CHAR(36) NULL,
  submitted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_leave_employee_status (employee_id, status),
  KEY idx_leave_approval (approval_request_id),
  CONSTRAINT fk_leave_requests_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_leave_requests_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  CONSTRAINT fk_leave_requests_approval FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE leave_balances (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  leave_type_id CHAR(36) NOT NULL,
  period_year INT NOT NULL,
  quota DECIMAL(8,2) NOT NULL DEFAULT 0,
  used DECIMAL(8,2) NOT NULL DEFAULT 0,
  remaining DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_leave_balance (employee_id, leave_type_id, period_year),
  CONSTRAINT fk_leave_balances_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_leave_balances_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  code VARCHAR(100) NOT NULL,
  channel VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP',
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notification_template (company_id, code, channel),
  CONSTRAINT fk_notification_templates_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_queue (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NULL,
  channel VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP',
  template_code VARCHAR(100) NULL,
  recipient_phone VARCHAR(30) NULL,
  payload JSON NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  scheduled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notification_status (status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE whatsapp_message_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  instance_id VARCHAR(100) NULL,
  phone VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'text',
  direction VARCHAR(20) NOT NULL DEFAULT 'outgoing',
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  provider_raw JSON NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  KEY idx_wa_phone_created (phone, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_import_batches (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  file_id CHAR(36) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  error_rows INT NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_raw_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  batch_id CHAR(36) NULL,
  company_id CHAR(36) NOT NULL,
  fingerprint_user_id VARCHAR(100) NOT NULL,
  log_time DATETIME NOT NULL,
  device_code VARCHAR(100) NULL,
  raw_payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_att_raw_user_time (fingerprint_user_id, log_time),
  CONSTRAINT fk_att_raw_batch FOREIGN KEY (batch_id) REFERENCES attendance_import_batches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attendance_daily (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  late_minutes INT NOT NULL DEFAULT 0,
  early_leave_minutes INT NOT NULL DEFAULT 0,
  overtime_minutes INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'ABSENT',
  source VARCHAR(50) NOT NULL DEFAULT 'GENERATED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_daily (employee_id, attendance_date),
  CONSTRAINT fk_attendance_daily_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evaluation_forms (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_evaluation_forms_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evaluation_sections (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  form_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_evaluation_sections_form FOREIGN KEY (form_id) REFERENCES evaluation_forms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evaluation_questions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  section_id CHAR(36) NOT NULL,
  question TEXT NOT NULL,
  answer_type VARCHAR(50) NOT NULL,
  weight DECIMAL(8,2) NOT NULL DEFAULT 1,
  options_json JSON NULL,
  sort_order INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_evaluation_questions_section FOREIGN KEY (section_id) REFERENCES evaluation_sections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evaluation_cycles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  form_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evaluation_cycles_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_evaluation_cycles_form FOREIGN KEY (form_id) REFERENCES evaluation_forms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evaluation_assignments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  cycle_id CHAR(36) NOT NULL,
  evaluator_id CHAR(36) NOT NULL,
  target_id CHAR(36) NOT NULL,
  review_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
  score DECIMAL(8,2) NULL,
  submitted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_eval_assignment_evaluator (evaluator_id, status),
  CONSTRAINT fk_eval_assign_cycle FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  CONSTRAINT fk_eval_assign_evaluator FOREIGN KEY (evaluator_id) REFERENCES employees(id),
  CONSTRAINT fk_eval_assign_target FOREIGN KEY (target_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evaluation_responses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  assignment_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  answer_json JSON NOT NULL,
  score DECIMAL(8,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eval_response_assignment FOREIGN KEY (assignment_id) REFERENCES evaluation_assignments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE test_templates (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  test_type VARCHAR(50) NOT NULL,
  layout_config JSON NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_templates_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE test_questions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  template_id CHAR(36) NOT NULL,
  number INT NOT NULL,
  answer_type VARCHAR(50) NOT NULL,
  answer_key VARCHAR(255) NULL,
  weight DECIMAL(8,2) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_test_question_number (template_id, number),
  CONSTRAINT fk_test_questions_template FOREIGN KEY (template_id) REFERENCES test_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE test_sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  template_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_sessions_template FOREIGN KEY (template_id) REFERENCES test_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE test_participants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  session_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NULL,
  candidate_id CHAR(36) NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  final_score DECIMAL(8,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_participants_session FOREIGN KEY (session_id) REFERENCES test_sessions(id),
  CONSTRAINT fk_test_participants_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payroll_periods (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  UNIQUE KEY uq_payroll_period (company_id, period_month, period_year),
  CONSTRAINT fk_payroll_periods_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payroll_components (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  component_type VARCHAR(50) NOT NULL,
  calculation_type VARCHAR(50) NOT NULL DEFAULT 'FIXED',
  formula TEXT NULL,
  is_taxable TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_payroll_component_code (company_id, code),
  CONSTRAINT fk_payroll_components_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reimbursement_types (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  max_amount DECIMAL(15,2) NULL,
  requires_attachment TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_reimbursement_types_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_openings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  position_id CHAR(36) NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_job_openings_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trainings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  trainer_name VARCHAR(150) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
  CONSTRAINT fk_trainings_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assets (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  asset_code VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NULL,
  serial_number VARCHAR(150) NULL,
  purchase_date DATE NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  UNIQUE KEY uq_asset_code (company_id, asset_code),
  CONSTRAINT fk_assets_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL DEFAULT 'ALL',
  target_config JSON NOT NULL DEFAULT ('{}'),
  published_by CHAR(36) NULL,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcements_company FOREIGN KEY (company_id) REFERENCES companies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_id CHAR(36) NULL,
  user_id CHAR(36) NULL,
  employee_id CHAR(36) NULL,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  reference_id CHAR(36) NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  ip_address VARCHAR(100) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_activity_company_module (company_id, module),
  KEY idx_activity_reference (module, reference_id),
  CONSTRAINT fk_activity_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_activity_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
