require('dotenv').config();
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'pifpafai.db');

let db;
let SQL;
let dbWrapper;

// Initialize database
async function initDb() {
  SQL = await initSqlJs();
  
  // Load existing database or create new
  let data = null;
  if (fs.existsSync(dbPath)) {
    data = fs.readFileSync(dbPath);
  }
  
  db = new SQL.Database(data);
  
  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS reels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reel_url TEXT NOT NULL,
      reel_id TEXT,
      views INTEGER DEFAULT 0,
      thumbnail_url TEXT,
      published_at DATE,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id)`);
  
  saveDb();
  console.log('SQL.js database initialized at:', dbPath);
  
  // Create wrapper after db is initialized
  dbWrapper = {
    prepare: (sql) => ({
      run: (...params) => {
        try {
          db.run(sql, params);
          saveDb();
          const lastId = db.exec("SELECT last_insert_rowid()");
          return { 
            lastInsertRowid: lastId[0]?.values[0]?.[0] || 0, 
            changes: db.getRowsModified() 
          };
        } catch (e) {
          console.error('DB run error:', e);
          throw e;
        }
      },
      get: (...params) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return null;
        } catch (e) {
          console.error('DB get error:', e);
          throw e;
        }
      },
      all: (...params) => {
        try {
          const results = [];
          const stmt = db.prepare(sql);
          stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (e) {
          console.error('DB all error:', e);
          throw e;
        }
      }
    }),
    exec: (sql) => {
      db.run(sql);
      saveDb();
    },
    save: saveDb
  };
  
  return dbWrapper;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Export initialization function and getter for db
module.exports = { 
  init: initDb, 
  getDb: () => dbWrapper,
  save: saveDb
};