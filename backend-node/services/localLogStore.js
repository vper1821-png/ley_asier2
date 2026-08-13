import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'data', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'database_logs.jsonl');

let logs = [];
let loaded = false;
let writeQueue = [];
let writeTimer = null;

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function load() {
  if (loaded) return;
  loaded = true;
  ensureDir();
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        logs.push(JSON.parse(line));
      } catch {}
    }
  }
}

function flushWriteQueue() {
  if (writeQueue.length === 0) return;
  ensureDir();
  const stream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  for (const entry of writeQueue) {
    stream.write(JSON.stringify(entry) + '\n');
  }
  stream.end();
  writeQueue = [];
}

function scheduleWrite() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    flushWriteQueue();
  }, 2000);
}

export function addLog(entry) {
  load();
  if (entry.query && isQuerySkipped(entry.query)) return null;
  const doc = {
    _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    ...entry,
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  logs.push(doc);
  writeQueue.push(doc);
  scheduleWrite();
  return doc;
}

export function addLogs(entries) {
  load();
  const docs = entries
    .filter(e => !e.query || !isQuerySkipped(e.query))
    .map(e => ({
      _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      ...e,
      createdAt: e.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  if (docs.length === 0) return [];
  logs.push(...docs);
  writeQueue.push(...docs);
  scheduleWrite();
  return docs;
}

export function queryLogs(filters = {}) {
  load();
  let result = [...logs];

  if (filters.userId) {
    const uid = filters.userId.toString();
    result = result.filter(l => (l.userId || '').toString() === uid);
  }
  if (filters.databaseId) {
    const did = filters.databaseId.toString();
    result = result.filter(l => (l.databaseId || '').toString() === did);
  }
  if (filters.engine) {
    result = result.filter(l => l.engine === filters.engine);
  }
  if (filters.operation) {
    result = result.filter(l => l.operation === filters.operation);
  }
  if (filters.severity) {
    result = result.filter(l => l.severity === filters.severity);
  }
  if (filters.status) {
    result = result.filter(l => l.status === filters.status);
  }
  if (filters.startDate) {
    const sd = new Date(filters.startDate).getTime();
    result = result.filter(l => new Date(l.createdAt).getTime() >= sd);
  }
  if (filters.endDate) {
    const ed = new Date(filters.endDate).getTime();
    result = result.filter(l => new Date(l.createdAt).getTime() <= ed);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(l =>
      (l.query || '').toLowerCase().includes(s) ||
      (l.databaseName || '').toLowerCase().includes(s) ||
      (l.errorMessage || '').toLowerCase().includes(s) ||
      (l.tables || []).some(t => t.toLowerCase().includes(s))
    );
  }

  // Sort by createdAt desc
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = result.length;
  const offset = parseInt(filters.offset) || 0;
  const limit = parseInt(filters.limit) || 100;
  const page = result.slice(offset, offset + limit);

  return { logs: page, total, offset, limit };
}

export function getStats(userId) {
  load();
  const userLogs = userId ? logs.filter(l => (l.userId || '').toString() === userId.toString()) : logs;

  const bySeverity = {};
  const byOperation = {};
  const byEngine = {};
  const recentErrors = [];

  for (const l of userLogs) {
    bySeverity[l.severity || 'info'] = (bySeverity[l.severity || 'info'] || 0) + 1;
    byOperation[l.operation || 'query'] = (byOperation[l.operation || 'query'] || 0) + 1;
    byEngine[l.engine || 'other'] = (byEngine[l.engine || 'other'] || 0) + 1;
  }

  const sorted = [...userLogs]
    .filter(l => l.status === 'error')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const format = obj => Object.entries(obj).map(([k, v]) => ({ _id: k, count: v }));

  return {
    bySeverity: format(bySeverity),
    byOperation: format(byOperation),
    byEngine: format(byEngine),
    recentErrors: sorted,
  };
}

export function deleteLogsByUserId(userId) {
  load();
  const uid = userId.toString();
  const before = logs.length;
  logs = logs.filter(l => (l.userId || '').toString() !== uid);
  // Re-write entire file
  ensureDir();
  const stream = fs.createWriteStream(LOG_FILE, { flags: 'w' });
  for (const entry of logs) {
    stream.write(JSON.stringify(entry) + '\n');
  }
  stream.end();
  return before - logs.length;
}

export function deleteLogsByDatabaseId(databaseId) {
  load();
  const did = databaseId.toString();
  const before = logs.length;
  logs = logs.filter(l => (l.databaseId || '').toString() !== did);
  ensureDir();
  const stream = fs.createWriteStream(LOG_FILE, { flags: 'w' });
  for (const entry of logs) {
    stream.write(JSON.stringify(entry) + '\n');
  }
  stream.end();
  return before - logs.length;
}

export function getLogCount() {
  load();
  return logs.length;
}

let skippedQueries = null;
const SKIP_FILE = path.join(LOG_DIR, 'skipped_queries.json');

function loadSkipped() {
  if (skippedQueries) return;
  ensureDir();
  if (fs.existsSync(SKIP_FILE)) {
    try {
      skippedQueries = new Set(JSON.parse(fs.readFileSync(SKIP_FILE, 'utf8')));
    } catch { skippedQueries = new Set(); }
  } else {
    skippedQueries = new Set();
  }
}

function saveSkipped() {
  ensureDir();
  fs.writeFileSync(SKIP_FILE, JSON.stringify([...skippedQueries]));
}

export function isQuerySkipped(query) {
  if (!query) return false;
  loadSkipped();
  for (const pattern of skippedQueries) {
    if (query.trim() === pattern.trim()) return true;
    if (query.includes(pattern.trim())) return true;
  }
  return false;
}

export function skipQuery(query) {
  loadSkipped();
  skippedQueries.add(query.trim());
  saveSkipped();
}

export function getSkippedQueries() {
  loadSkipped();
  return [...skippedQueries];
}

export function revokeSkippedQuery(query) {
  loadSkipped();
  const q = query.trim();
  for (const pattern of skippedQueries) {
    if (pattern === q || pattern.trim() === q) {
      skippedQueries.delete(pattern);
      break;
    }
  }
  saveSkipped();
}

export function deleteLogsByQuery(query) {
  load();
  const q = query.trim();
  const before = logs.length;
  logs = logs.filter(l => !l.query || l.query.trim() !== q);
  ensureDir();
  const stream = fs.createWriteStream(LOG_FILE, { flags: 'w' });
  for (const entry of logs) {
    stream.write(JSON.stringify(entry) + '\n');
  }
  stream.end();
  return before - logs.length;
}

// Flush on exit
process.on('exit', () => {
  flushWriteQueue();
});
process.on('SIGINT', () => {
  flushWriteQueue();
  process.exit(0);
});
process.on('SIGTERM', () => {
  flushWriteQueue();
  process.exit(0);
});
