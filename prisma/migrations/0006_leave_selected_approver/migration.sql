ALTER TABLE leave_requests
  ADD COLUMN selected_approver_id CHAR(36) NULL AFTER leave_type_id,
  ADD KEY idx_leave_selected_approver (selected_approver_id),
  ADD CONSTRAINT fk_leave_selected_approver FOREIGN KEY (selected_approver_id) REFERENCES employees(id);
