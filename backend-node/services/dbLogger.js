import { addLog } from './localLogStore.js';

export async function logDbOp(params) {
  try {
    const { userId, databaseId, databaseName, engine, operation, query, tables, severity, status, durationMs, rowsAffected, errorMessage, ip, source, metadata } = params;
    const entry = {
      userId, databaseId, databaseName, engine: engine || 'other',
      operation: operation || 'other', query: query?.substring(0, 10000),
      tables: tables || [], severity: severity || 'info',
      status: status || 'success', durationMs, rowsAffected,
      errorMessage: errorMessage?.substring(0, 2000), ip, source: source || 'frontend',
      metadata,
    };
    addLog(entry);
    return entry;
  } catch (e) {
    console.error('[dbLogger] Failed to log:', e.message);
  }
}

export function severityFromQuery(query = '') {
  const q = query.trim().toUpperCase();
  if (/^\s*(DROP|TRUNCATE|ALTER|DELETE)\s/.test(q)) return 'critical';
  if (/^\s*(UPDATE|INSERT|CREATE|REPLACE|GRANT|REVOKE)\s/.test(q)) return 'high';
  if (/^\s*(RENAME|MODIFY|CHANGE)\s/.test(q)) return 'medium';
  if (/^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)\s/.test(q)) return 'low';
  return 'info';
}

export function severityFromOp(operation, status) {
  if (status === 'error') return 'high';
  if (['connect', 'disconnect'].includes(operation)) return 'info';
  if (['query', 'scan'].includes(operation)) return 'low';
  if (['insert', 'update', 'delete'].includes(operation)) return 'medium';
  if (['create_table', 'drop_table', 'alter_table'].includes(operation)) return 'high';
  if (['backup', 'restore'].includes(operation)) return 'high';
  return 'info';
}
