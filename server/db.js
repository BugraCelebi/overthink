const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'overthink.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    tasks_completed INTEGER DEFAULT 0
  );
`);

try { db.exec(`ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'doing'`); } catch (_) {}
try { db.exec(`ALTER TABLE tasks ADD COLUMN due_date TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE tasks ADD COLUMN user_id INTEGER`); } catch (_) {}
try { db.exec(`ALTER TABLE user_progress ADD COLUMN user_id INTEGER`); } catch (_) {}

db.exec(`
  UPDATE tasks SET status = 'done'  WHERE completed = 1 AND status = 'doing';
  UPDATE tasks SET status = 'doing' WHERE completed = 0 AND status IS NULL;
`);

module.exports = db;
