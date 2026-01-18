const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'local.db');
const db = new Database(dbPath);

async function initAdmin() {
  try {
    console.log('Initializing admin user...');
    
    // Check if admin already exists
    const existingAdmin = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('admin');
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run('admin', hashedPassword, 'admin', 1, now);
    
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    db.close();
  }
}

initAdmin();