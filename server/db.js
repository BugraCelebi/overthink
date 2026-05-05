const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'overthink.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal',
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    xp_value INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    tasks_completed INTEGER DEFAULT 0
  );

  INSERT OR IGNORE INTO user_progress (id) VALUES (1);
`);

// Migration: add status column if it doesn't exist
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'doing'`);
} catch (_) {
  // Column already exists
}

// Migration: add due_date column if it doesn't exist
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN due_date TEXT`);
} catch (_) {
  // Column already exists
}

// Sync status with existing completed data
db.exec(`
  UPDATE tasks SET status = 'done'  WHERE completed = 1 AND status = 'doing';
  UPDATE tasks SET status = 'doing' WHERE completed = 0 AND status IS NULL;
`);

module.exports = db;
