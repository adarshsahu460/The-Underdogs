const Database = require('better-sqlite3');
const fs = require('fs');
const config = require('../config');

// Initialize DB (synchronous, fine for small MVP)
const db = new Database(config.db.file);

db.pragma('journal_mode = WAL');

// Schema
const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL,
    original_repo_url TEXT, -- if supplied GitHub URL
    bot_repo_full_name TEXT NOT NULL, -- org/repo
    title TEXT,
    description TEXT,
    ai_summary TEXT,
    ai_health JSON,
    ai_next_steps JSON,
    ai_last_generated_at DATETIME,
    keywords TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_user_id) REFERENCES users(id)
  );`,
  `CREATE TABLE IF NOT EXISTS adoptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    adopter_user_id INTEGER NOT NULL,
    fork_full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(adopter_user_id) REFERENCES users(id)
  );`,
  `CREATE TABLE IF NOT EXISTS ai_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    report JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );`
];

for (const m of migrations) db.prepare(m).run();

// Ensure new columns (idempotent ALTERs). SQLite doesn't support IF NOT EXISTS for columns, so we check pragma.
function ensureColumn(table, columnDef) {
  const [name] = columnDef.split(/\s+/);
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find(c => c.name === name)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`).run();
  }
}

// Additional evolving project metadata columns
[
  'category TEXT',
  'languages TEXT',           // JSON array string
  'reason_halted TEXT',
  'documentation_url TEXT',
  'demo_url TEXT',
  's3_object_key TEXT',
  's3_object_url TEXT',
  'source_type TEXT'          // e.g. s3_zip
].forEach(def => ensureColumn('projects', def));

module.exports = db;

// Ensure an anonymous user exists (used when auth is disabled)
try {
  const anonEmail = 'anonymous@system.local';
  let anon = db.prepare('SELECT id FROM users WHERE email = ?').get(anonEmail);
  if (!anon) {
    // password_hash required, store placeholder (not used for login)
    db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?,?,?)')
      .run(anonEmail, '!', 'Anonymous');
    anon = db.prepare('SELECT id FROM users WHERE email = ?').get(anonEmail);
  }
  db.anonymousUserId = anon.id;
} catch (e) {
  console.error('Failed to ensure anonymous user:', e);
}
