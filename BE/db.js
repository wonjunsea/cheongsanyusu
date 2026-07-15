import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'mentor.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    case_type TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_user ON messages (user_id, case_type);
`);

const insertStmt = db.prepare(
  'INSERT INTO messages (user_id, case_type, role, content) VALUES (?, ?, ?, ?)',
);

export function saveMessage(userId, caseType, role, content) {
  insertStmt.run(userId, caseType, role, content);
}

export function getHistory(userId, caseType) {
  return db
    .prepare(
      'SELECT role, content, created_at FROM messages WHERE user_id = ? AND case_type = ? ORDER BY id ASC',
    )
    .all(userId, caseType);
}
