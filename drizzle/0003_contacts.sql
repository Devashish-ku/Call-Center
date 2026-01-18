CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  assigned_employee_id INTEGER,
  call_status TEXT,
  call_time TEXT,
  call_duration_sec INTEGER,
  source_file_id INTEGER,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_assigned_employee FOREIGN KEY (assigned_employee_id) REFERENCES users(id),
  CONSTRAINT fk_source_file FOREIGN KEY (source_file_id) REFERENCES files(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_employee ON contacts(assigned_employee_id, phone_number);