CREATE TABLE file_contents (
  file_id CHAR(36) NOT NULL,
  data LONGBLOB NOT NULL,
  PRIMARY KEY (file_id),
  CONSTRAINT fk_file_contents_file FOREIGN KEY (file_id) REFERENCES files(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE overtime_requests (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  selected_approver_id CHAR(36) NULL,
  overtime_date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  duration_minutes INT NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  approval_request_id CHAR(36) NULL,
  submitted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_overtime_employee_status (employee_id, status),
  CONSTRAINT fk_overtime_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_overtime_approver FOREIGN KEY (selected_approver_id) REFERENCES employees(id),
  CONSTRAINT fk_overtime_approval FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reimbursement_requests (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  employee_id CHAR(36) NOT NULL,
  reimbursement_type_id CHAR(36) NOT NULL,
  selected_approver_id CHAR(36) NULL,
  expense_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  attachment_file_id CHAR(36) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  paid_at DATETIME NULL,
  paid_by CHAR(36) NULL,
  approval_request_id CHAR(36) NULL,
  submitted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_reimb_employee_status (employee_id, status),
  CONSTRAINT fk_reimb_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_reimb_type FOREIGN KEY (reimbursement_type_id) REFERENCES reimbursement_types(id),
  CONSTRAINT fk_reimb_approver FOREIGN KEY (selected_approver_id) REFERENCES employees(id),
  CONSTRAINT fk_reimb_attachment FOREIGN KEY (attachment_file_id) REFERENCES files(id),
  CONSTRAINT fk_reimb_paid_by FOREIGN KEY (paid_by) REFERENCES users(id),
  CONSTRAINT fk_reimb_approval FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
