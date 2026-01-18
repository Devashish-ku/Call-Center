-- Initialize users table with default admin user
INSERT OR IGNORE INTO users (id, username, password, role, is_active, created_at) 
VALUES (1, 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, datetime('now'));

INSERT OR IGNORE INTO users (id, username, password, role, is_active, created_at) 
VALUES (2, 'Deva', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', 1, datetime('now'));