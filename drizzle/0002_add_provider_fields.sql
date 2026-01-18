ALTER TABLE call_logs ADD COLUMN provider_call_id TEXT;
ALTER TABLE call_logs ADD COLUMN from_number TEXT;
ALTER TABLE call_logs ADD COLUMN to_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_call_logs_provider_call_id ON call_logs(provider_call_id);

CREATE TABLE IF NOT EXISTS phone_endpoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  employee_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES users(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_endpoints_endpoint ON phone_endpoints(endpoint);