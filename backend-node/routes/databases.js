import { Router } from 'express';
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { authMiddleware, validateToken, isAdmin } from '../middleware/auth.js';
import DatabaseConnection from '../models/databaseConnection.js';
import Agent from '../models/agent.js';
import Alert from '../models/alert.js';
import { DataConsent, DataInventory, BreachReport } from '../models/compliance.js';
import { pendingCommands, agentEvents, markStaleAgentsOffline } from './agents.js';
import { sendAgentCommand } from '../services/agentWs.js';
import { logDbOp, severityFromOp } from '../services/dbLogger.js';

const router = Router();

const pendingScans = new Map();
const pendingQueryResults = new Map();
const pendingTestResults = new Map();

async function queueAutoScan(connection, userId) {
  try {
    await markStaleAgentsOffline();
    const agent = await Agent.findOne({ userId, status: 'online' }).sort({ lastHeartbeat: -1 });
    if (!agent) {
      console.log(`[auto-scan] No online agent for user ${userId}, skipping auto-scan for ${connection._id}`);
      return;
    }
    const scanCommand = {
      type: 'scan_database',
      dbConnection: {
        engine: connection.engine,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        ssl: connection.ssl,
      },
      connectionId: connection._id.toString(),
    };
    if (!pendingCommands.has(agent.agentId)) {
      pendingCommands.set(agent.agentId, []);
    }
    pendingCommands.get(agent.agentId).push(scanCommand);
    connection.agentId = agent.agentId;
    await connection.save();
  } catch (err) {
    console.error('[auto-scan] Error queueing scan:', err);
  }
}

router.use(authMiddleware);

// POST / - List all database connections for the user
router.post('/', async (req, res) => {
  try {
    const connections = await DatabaseConnection.find({ userId: req.user.UserID }).sort({ createdAt: -1 });
    res.json({ connections });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /list - Alias for listing databases (frontend compatibility)
router.post('/list', async (req, res) => {
  try {
    const connections = await DatabaseConnection.find({ userId: req.user.UserID }).sort({ createdAt: -1 });
    const agents = await Agent.find({ userId: req.user.UserID, wsConnected: true }).lean();
    const onlineAgentIds = new Set(agents.map(a => a.agentId));
    for (const c of connections) {
      if (c.agentId && !onlineAgentIds.has(c.agentId)) {
        c.status = 'disconnected';
      }
      // Compute missing personalDataColumns from column flags
      if (c.tables) {
        c.tables.forEach(t => {
          if (!t.personalDataColumns || t.personalDataColumns.length === 0) {
            t.personalDataColumns = (t.columns || [])
              .filter(col => col.isPersonal)
              .map(col => col.name);
          }
        });
      }
    }
    res.json({ connections });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /connect - Test and save a new database connection
router.post('/connect', async (req, res) => {
  try {
    const { name, engine, host, port, database, username, password, ssl, connectionString, isRemote, schedule } = req.body;

    if (!name || !engine) {
      return res.json({ error: 'Nombre y motor de base de datos requeridos' });
    }

    const requiredFields = {
      postgresql: ['host', 'port', 'database', 'username', 'password'],
      mysql: ['host', 'port', 'database', 'username', 'password'],
      mariadb: ['host', 'port', 'database', 'username', 'password'],
      mssql: ['host', 'port', 'database', 'username', 'password'],
      oracle: ['host', 'port', 'database', 'username', 'password'],
      mongodb: ['connectionString'],
      couchdb: ['host', 'port'],
      redis: ['host', 'port'],
      elasticsearch: ['host', 'port'],
      sqlite: ['database'],
      cassandra: ['host', 'port'],
      neo4j: ['host', 'port'],
      clickhouse: ['host', 'port', 'database'],
      influxdb: ['host', 'port'],
      firebase: ['connectionString'],
      dynamodb: ['connectionString'],
      bigquery: ['connectionString'],
    };

    const required = requiredFields[engine];
    if (required) {
      for (const field of required) {
        if (!req.body[field]) {
          return res.json({ error: `Campo requerido para ${engine}: ${field}` });
        }
      }
    }

    const connection = await DatabaseConnection.create({
      userId: req.user.UserID,
      name,
      engine,
      host: host || '',
      port: port || null,
      database: database || '',
      username: username || '',
      password: password || '',
      ssl: ssl || false,
      connectionString: connectionString || '',
      isRemote: isRemote || false,
      schedule: schedule || { reportEnabled: false, reportFormat: 'pdf' },
      status: 'connected',
      lastConnected: new Date(),
    });

    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: name, engine, operation: 'connect', status: 'success', durationMs: 0, ip: req.ip, source: 'frontend' });

    queueAutoScan(connection, req.user.UserID);

    res.json({ success: true, connection });
  } catch (err) {
    await logDbOp({ userId: req.user.UserID, engine: req.body?.engine, operation: 'connect', status: 'error', errorMessage: err.message, ip: req.ip, source: 'frontend' });
    res.json({ error: err.message });
  }
});

// POST /local-connect - Connect to local DB via agent
router.post('/local-connect', async (req, res) => {
  try {
    const { name, engine, host, port, database, username, password } = req.body;

    if (!name || !engine) return res.json({ error: 'Nombre y motor requeridos' });

    const portNum = parseInt(port) || 0;

    const connection = await DatabaseConnection.create({
      userId: req.user.UserID,
      name,
      engine,
      host: host || 'localhost',
      port: portNum,
      database: database || '',
      username: username || '',
      password: password || '',
      ssl: false,
      isRemote: false,
      status: 'connecting',
      lastConnected: new Date(),
    });

    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: name, engine, operation: 'connect', status: 'success', ip: req.ip, source: 'agent' });

    queueAutoScan(connection, req.user.UserID);

    res.json({ success: true, connection });
  } catch (err) {
    await logDbOp({ userId: req.user.UserID, engine: req.body?.engine, operation: 'connect', status: 'error', errorMessage: err.message, ip: req.ip, source: 'agent' });
    res.json({ error: err.message });
  }
});

// POST /:id - Update a database connection
router.post('/:id', async (req, res) => {
  try {
    const { name, engine, host, port, database, username, password, ssl, connectionString, isRemote, schedule, status } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (engine !== undefined) update.engine = engine;
    if (host !== undefined) update.host = host;
    if (port !== undefined) update.port = port;
    if (database !== undefined) update.database = database;
    if (username !== undefined) update.username = username;
    if (password !== undefined) update.password = password;
    if (ssl !== undefined) update.ssl = ssl;
    if (connectionString !== undefined) update.connectionString = connectionString;
    if (isRemote !== undefined) update.isRemote = isRemote;
    if (schedule !== undefined) update.schedule = schedule;
    if (status !== undefined) update.status = status;

    const connection = await DatabaseConnection.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.UserID },
      { $set: update },
      { new: true }
    );

    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    res.json({ success: true, connection });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// DELETE /:id - Delete a connection
router.delete('/:id', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOneAndDelete({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    // Clean up related data
    const { DataInventory } = await import('../models/compliance.js');
    const { deleteLogsByDatabaseId } = await import('../services/localLogStore.js');
    const invDeleted = await DataInventory.deleteMany({ storageLocation: connection.name });
    const deletedLogs = deleteLogsByDatabaseId(connection._id);

    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'disconnect', severity: 'info', status: 'success', ip: req.ip });
    res.json({ success: true, message: 'Conexión eliminada correctamente', deletedInventory: invDeleted.deletedCount, deletedLogs });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /:id/delete - Alias for delete (frontend compatibility)
router.post('/:id/delete', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOneAndDelete({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    // Clean up related data
    const { DataInventory } = await import('../models/compliance.js');
    const { deleteLogsByDatabaseId } = await import('../services/localLogStore.js');
    const invDeleted = await DataInventory.deleteMany({ storageLocation: connection.name });
    const deletedLogs = deleteLogsByDatabaseId(connection._id);

    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'disconnect', severity: 'info', status: 'success', ip: req.ip });
    res.json({ success: true, message: 'Conexión eliminada correctamente', deletedInventory: invDeleted.deletedCount, deletedLogs });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /:id/test - Test connection via agent
router.post('/:id/test', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    await markStaleAgentsOffline();
    const agent = await Agent.findOne({ userId: req.user.UserID, status: 'online' }).sort({ lastHeartbeat: -1 });
    if (!agent) return res.json({ error: 'No hay agente conectado. Instala SecureLab Agent en tu servidor.' });

    // Send test connection command to agent
    const testCommand = {
      type: 'test_connection',
      dbConnection: {
        engine: connection.engine,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        ssl: connection.ssl,
      },
      connectionId: connection._id.toString(),
    };

    if (!pendingCommands.has(agent.agentId)) {
      pendingCommands.set(agent.agentId, []);
    }
    pendingCommands.get(agent.agentId).push(testCommand);

    connection.status = 'testing';
    connection.agentId = agent.agentId;
    await connection.save();

    // Wait for agent result (up to 30s)
    const result = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pendingTestResults.delete(connection._id.toString());
        resolve({ timeout: true, message: 'El agente no respondió. Verifica que esté funcionando.' });
      }, 30000);

      pendingTestResults.set(connection._id.toString(), (data) => {
        clearTimeout(timeout);
        pendingTestResults.delete(connection._id.toString());
        resolve(data);
      });
    });

    if (result.timeout) {
      await DatabaseConnection.findByIdAndUpdate(connection._id, { status: 'error' });
      return res.json({ error: result.message });
    }

    if (!result.success) {
      await DatabaseConnection.findByIdAndUpdate(connection._id, { status: 'error', errorMessage: result.message });
      return res.json({ error: result.message });
    }

    connection.status = 'connected';
    connection.lastConnected = new Date();
    await connection.save();

    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'test', severity: 'info', status: 'success', durationMs: result.durationMs, ip: req.ip, source: 'agent' });
    res.json({ success: true, message: `Conexión exitosa a ${connection.name} (${connection.engine})` });
  } catch (err) {
    await logDbOp({ userId: req.user.UserID, databaseId: req.params.id, engine: req.body?.engine, operation: 'test', status: 'error', errorMessage: err.message, ip: req.ip });
    try {
      await DatabaseConnection.findByIdAndUpdate(req.params.id, { status: 'error' });
    } catch (_) {}
    res.json({ error: err.message });
  }
});

// ─── Personal Data Detection Patterns (matching Go agent) ─────────────
const personalDataPatterns = {
  nombre:    ['nombre','name','first_name','last_name','apellido','full_name','nombres','razon_social'],
  email:     ['email','e-mail','mail','correo','email_address','email_corporativo'],
  rut:       ['rut','run','dni','cedula','documento','id_number','national_id'],
  telefono:  ['telefono','phone','mobile','celular','phone_number','contact'],
  direccion: ['direccion','address','domicilio','street','calle','location','dire'],
  fecha_nac: ['fecha_nacimiento','birth_date','dob','date_of_birth','nacimiento'],
  salud:     ['salud','health','medical','diagnostico','enfermedad','seguro_medico'],
  biometrico:['biometrico','biometric','fingerprint','huella','iris','face_id'],
  bancario:  ['cuenta_bancaria','bank_account','credit_card','tarjeta','cvv','iban'],
  credencial:['password','contraseña','hash','secret','token','auth_key','api_key','clave','password_hash','refresh_token'],
  ip:        ['ip_address','ip','direccion_ip','client_ip'],
  ubicacion: ['ubicacion','location','gps','latitud','longitud','coordinates'],
  genero:    ['genero','gender','sexo','sex'],
  edad:      ['edad','age','birth_year'],
};
function detectPersonalData(colName) {
  const lower = colName.toLowerCase();
  for (const [category, patterns] of Object.entries(personalDataPatterns)) {
    for (const p of patterns) {
      if (lower.includes(p)) return { isPersonal: true, category };
    }
  }
  return { isPersonal: false, category: '' };
}

// ─── Direct MySQL/MariaDB scanner (used when no agent is available) ────
async function scanDirectMySQL(connection) {
  const { engine, host, port, database, username, password } = connection;
  const conn = await mysql.createConnection({
    host: host || '127.0.0.1', port: parseInt(port) || 3306,
    database, user: username, password: password || '',
    connectTimeout: 10000,
  });
  const [tables] = await conn.execute(
    "SELECT TABLE_NAME, TABLE_ROWS, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
    [database]
  );
  const resultTables = [];
  let totalRows = 0;
  for (const t of tables) {
    const tableName = t.TABLE_NAME;
    const [cols] = await conn.execute(
      "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, CHARACTER_MAXIMUM_LENGTH, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
      [database, tableName]
    );
    const [rowCount] = await conn.execute(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
    const rows = rowCount[0]?.cnt || 0;
    totalRows += rows;
    const columns = [];
    const personalDataColumns = [];
    for (const c of cols) {
      const colName = c.COLUMN_NAME;
      const { isPersonal, category } = detectPersonalData(colName);
      const col = {
        name: colName, type: c.COLUMN_TYPE, nullable: c.IS_NULLABLE === 'YES',
        primaryKey: c.COLUMN_KEY === 'PRI', isPersonal, category,
      };
      columns.push(col);
      if (isPersonal) personalDataColumns.push(colName);
    }
    resultTables.push({
      table: tableName, rows, engine: t.ENGINE || 'InnoDB',
      columns, personalDataColumns,
    });
  }
  await conn.end();
  return { tables: resultTables, totalTables: resultTables.length, totalRows };
}

// POST /:id/scan - Queue database scan via agent (or direct if agent unavailable)
router.post('/:id/scan', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    const dbEngine = (connection.engine || '').toLowerCase();

    await markStaleAgentsOffline();
    const agent = await Agent.findOne({ userId: req.user.UserID, status: 'online' }).sort({ lastHeartbeat: -1 });

    if (!agent && (dbEngine === 'mysql' || dbEngine === 'mariadb')) {
      // Direct scan without agent
      try {
        const scanResult = await scanDirectMySQL(connection);
        // Use native MongoDB driver to bypass Mongoose subdocument casting
        const db = mongoose.connection.db;
        await db.collection('databaseconnections').updateOne(
          { _id: new mongoose.Types.ObjectId(connection._id) },
          {
            $set: {
              status: 'connected',
              agentId: null,
              'metrics.tablesCount': scanResult.totalTables,
              'metrics.recordsCount': scanResult.totalRows,
              'metrics.lastScanned': new Date(),
              tables: scanResult.tables,
            },
          }
        );
        await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'scan', severity: 'low', status: 'success', ip: req.ip, source: 'direct' });
        return res.json({ success: true, status: 'connected', message: 'Escaneo completado.' });
      } catch (scanErr) {
        return res.json({ error: `Error al escanear: ${scanErr.message}` });
      }
    }

    if (!agent) return res.json({ error: 'No hay agente conectado. Instala y ejecuta SecureLab Agent en tu servidor.' });

    const scanCommand = {
      type: 'scan_database',
      dbConnection: {
        engine: connection.engine, host: connection.host, port: connection.port,
        database: connection.database, username: connection.username,
        password: connection.password, ssl: connection.ssl,
      },
      connectionId: connection._id.toString(),
    };

    if (!pendingCommands.has(agent.agentId)) pendingCommands.set(agent.agentId, []);
    pendingCommands.get(agent.agentId).push(scanCommand);

    connection.status = 'scanning';
    connection.agentId = agent.agentId;
    await connection.save();

    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'scan', severity: 'low', status: 'success', ip: req.ip, source: 'frontend' });

    res.json({ success: true, status: 'scanning', message: 'Escaneo iniciado. El resultado aparecerá automáticamente cuando el agente lo complete.' });

    // Background: wait for agent to report back and notify via event
    (async () => {
      try {
        const result = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            pendingScans.delete(connection._id.toString());
            resolve(null);
          }, 120000);
          pendingScans.set(connection._id.toString(), (data) => {
            clearTimeout(timeout);
            pendingScans.delete(connection._id.toString());
            resolve(data);
          });
        });
        if (result && connection.userId) {
          agentEvents.emit('scan:complete', {
            connectionId: req.params.id, dbName: connection.name,
            tablesCount: result.totalTables || 0, userId: connection.userId.toString(), timestamp: new Date(),
          });
        }
      } catch (_) {}
    })();
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /:id/report - Generate a weekly compliance report
router.post('/:id/report', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    const now = new Date();
    const lastReport = connection.schedule?.lastReportGenerated;

    if (lastReport) {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (lastReport > oneWeekAgo) {
        const nextAllowed = new Date(lastReport.getTime() + 7 * 24 * 60 * 60 * 1000);
        return res.json({
          error: `Ya se generó un reporte para esta conexión en los últimos 7 días. Próximo reporte disponible: ${nextAllowed.toISOString().split('T')[0]}`,
        });
      }
    }

    const reportData = {
      database: connection.name,
      engine: connection.engine,
      generatedAt: now.toISOString(),
      period: {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      },
      summary: {
        tablesScanned: connection.metrics?.tablesCount || 0,
        totalRecords: connection.metrics?.recordsCount || 0,
        databaseSize: connection.metrics?.sizeBytes || 0,
        status: connection.status,
        lastConnected: connection.lastConnected?.toISOString() || 'Nunca',
      },
      compliance: {
        gdprCompliant: true,
        lgpdCompliant: true,
        ccdsCompliant: connection.isRemote ? false : true,
        encryptionAtRest: connection.ssl,
        encryptionInTransit: connection.ssl,
        backupConfigured: false,
      },
      recommendations: [
        'Habilitar cifrado SSL/TLS si no está activo',
        'Configurar backups automáticos',
        'Revisar permisos de usuarios con acceso',
        connection.isRemote ? 'Considerar migrar a infraestructura local para cumplimiento CCDS' : null,
        connection.ssl ? null : 'Activar SSL para cumplir con estándares de seguridad',
      ].filter(Boolean),
    };

    await DatabaseConnection.findByIdAndUpdate(connection._id, {
      'schedule.lastReportGenerated': now,
      'schedule.reportFormat': req.body.format || 'pdf',
    });

    res.json({ success: true, report: reportData });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /:id/query - Execute a read-only query via agent
router.post('/:id/query', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    const { query } = req.body;
    if (!query) return res.json({ error: 'Query requerida' });

    const queryUpper = query.trim().toUpperCase();
    if (!queryUpper.startsWith('SELECT') && !queryUpper.startsWith('SHOW') && !queryUpper.startsWith('DESCRIBE') && !queryUpper.startsWith('EXPLAIN') && !queryUpper.startsWith('PRAGMA')) {
      await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'query', query: query.substring(0, 500), severity: 'medium', status: 'warning', errorMessage: 'Read-only query rejected', ip: req.ip, source: 'frontend' });
      return res.json({ error: 'Solo se permiten consultas de solo lectura (SELECT, SHOW, DESCRIBE, EXPLAIN)' });
    }

    await markStaleAgentsOffline();
    const agent = await Agent.findOne({ userId: req.user.UserID, status: 'online' }).sort({ lastHeartbeat: -1 });
    if (!agent) return res.json({ error: 'No hay agente conectado. Instala SecureLab Agent en tu servidor.' });

    const queryId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const queryCommand = {
      type: 'execute_query',
      dbConnection: {
        engine: connection.engine,
        host: connection.host,
        port: connection.port,
        database: connection.database,
        username: connection.username,
        password: connection.password,
        ssl: connection.ssl,
      },
      connectionId: connection._id.toString(),
      queryId,
      query,
    };

    if (!pendingCommands.has(agent.agentId)) {
      pendingCommands.set(agent.agentId, []);
    }
    pendingCommands.get(agent.agentId).push(queryCommand);

    // Wait for agent result (up to 60s)
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingQueryResults.delete(queryId);
        resolve({ timeout: true, message: 'El agente no respondió la consulta.' });
      }, 60000);

      pendingQueryResults.set(queryId, (data) => {
        clearTimeout(timeout);
        pendingQueryResults.delete(queryId);
        resolve(data);
      });
    });

    if (result.timeout) {
      return res.json({ error: result.message });
    }
    if (result.error) {
      return res.json({ error: result.error });
    }

    const severity = result.error ? 'high' : 'low';
    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'query', query: query.substring(0, 500), severity, tables: result.tables || [], status: result.error ? 'error' : 'success', durationMs: result.tookMs, rowsAffected: (result.rows || []).length, errorMessage: result.error, ip: req.ip, source: 'frontend' });

    res.json({
      success: true,
      query,
      columns: result.columns || [],
      rows: result.rows || [],
      tookMs: result.tookMs || 0,
      rowCount: (result.rows || []).length,
    });
  } catch (err) {
    await logDbOp({ userId: req.user.UserID, databaseId: req.params.id, operation: 'query', status: 'error', errorMessage: err.message, ip: req.ip });
    res.json({ error: err.message });
  }
});

// POST /:id/agent-query-result - Agent submits query results
router.post('/:id/agent-query-result', async (req, res) => {
  try {
    const { queryId, columns, rows, error, tookMs } = req.body;
    pendingQueryResults.forEach((resolve, qid) => {
      if (qid === queryId) {
        resolve({ columns, rows, error, tookMs });
      }
    });
    if (error) {
      await DatabaseConnection.findByIdAndUpdate(req.params.id, { status: 'error', errorMessage: error });
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /:id/agent-test-result - Agent submits test connection result
router.post('/:id/agent-test-result', async (req, res) => {
  try {
    const { success, message } = req.body;
    pendingTestResults.forEach((resolve, cid) => {
      if (cid === req.params.id) {
        resolve({ success, message });
      }
    });
    if (!success) {
      await DatabaseConnection.findByIdAndUpdate(req.params.id, { status: 'error', errorMessage: message });
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// POST /:id/sync-agent - Register a local agent for this database
router.post('/:id/sync-agent', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    if (connection.isRemote) {
      return res.json({ error: 'No se puede sincronizar agente para bases de datos remotas' });
    }

    let { agentId, hostname, version } = req.body;
    if (!agentId) {
      const agent = await Agent.findOne({ userId: req.user.UserID, status: 'online' }).sort({ lastHeartbeat: -1 });
      if (agent) {
        agentId = agent.agentId;
        hostname = hostname || agent.hostname;
      }
    }
    if (!agentId) return res.json({ error: 'No hay agente disponible. Instala SecureLab Agent en tu servidor.' });

    connection.agentId = agentId;
    connection.agentLastSeen = new Date();
    await connection.save();

    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'connect', severity: 'info', status: 'success', ip: req.ip, source: 'agent', metadata: { agentId } });
    res.json({
      success: true,
      message: 'Agente sincronizado correctamente',
      agent: {
        id: agentId,
        hostname: hostname || 'localhost',
        version: version || '1.0.0',
        registeredAt: new Date().toISOString(),
        database: connection.name,
      },
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─── Database Logs (local storage) ─────────────────────────────────

import { severityFromQuery } from '../services/dbLogger.js';
import { queryLogs, getStats, deleteLogsByUserId, deleteLogsByDatabaseId, skipQuery, deleteLogsByQuery } from '../services/localLogStore.js';

router.post('/logs/list', async (req, res) => {
  try {
    const filters = { ...req.body, userId: req.user.UserID };
    const result = queryLogs(filters);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logs/stats', async (req, res) => {
  try {
    const result = getStats(req.user.UserID);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logs/skip-query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query es requerida' });
    skipQuery(query);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/logs/skipped-queries', async (req, res) => {
  try {
    const { getSkippedQueries } = await import('../services/localLogStore.js');
    const list = getSkippedQueries();
    res.json({ queries: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logs/revoke-skip', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query es requerida' });
    const { revokeSkippedQuery } = await import('../services/localLogStore.js');
    revokeSkippedQuery(query);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/logs/delete-by-query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query es requerida' });
    const deleted = deleteLogsByQuery(query);
    res.json({ success: true, deleted });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Client Actions (Ajustar Cliente) ──────────────────────────────

async function queueAgentCommand(connection, userId, command) {
  if (connection.agentId) {
    const sent = sendAgentCommand(connection.agentId, command);
    if (!sent) {
      if (!pendingCommands.has(connection.agentId)) {
        pendingCommands.set(connection.agentId, []);
      }
      pendingCommands.get(connection.agentId).push(command);
    }
  }
}

router.post('/:id/client/uninstall', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });
    await queueAgentCommand(connection, req.user.UserID, { type: 'uninstall_agent' });
    connection.agentId = null;
    await connection.save();
    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'client_uninstall', severity: 'critical', status: 'success', ip: req.ip });
    res.json({ success: true, message: 'Desinstalación enviada al agente' });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/client/uninstall-all', async (req, res) => {
  try {
    const connections = await DatabaseConnection.find({ userId: req.user.UserID, agentId: { $ne: null } });
    let sent = 0;
    for (const connection of connections) {
      if (connection.agentId) {
        await queueAgentCommand(connection, req.user.UserID, { type: 'uninstall_agent' });
        sent++;
      }
      connection.agentId = null;
      await connection.save();
    }
    await logDbOp({ userId: req.user.UserID, databaseId: null, databaseName: 'all', engine: null, operation: 'client_uninstall_all', severity: 'critical', status: 'success', ip: req.ip });
    res.json({ success: true, message: `Desinstalación enviada a ${sent} cliente(s)` });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/:id/client/reconnect-db', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });
    await queueAgentCommand(connection, req.user.UserID, { type: 'reconnect_db' });
    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'client_reconnect_db', severity: 'info', status: 'success', ip: req.ip });
    res.json({ success: true, message: 'Reconexión de DB enviada al agente' });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/:id/client/reconnect-agent', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });
    await queueAgentCommand(connection, req.user.UserID, { type: 'reconnect_agent' });
    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'client_reconnect_agent', severity: 'info', status: 'success', ip: req.ip });
    res.json({ success: true, message: 'Reconexión de agente enviada' });
  } catch (e) {
    res.json({ error: e.message });
  }
});

router.post('/:id/client/restart', async (req, res) => {
  try {
    const connection = await DatabaseConnection.findOne({ _id: req.params.id, userId: req.user.UserID });
    if (!connection) return res.json({ error: 'Conexión no encontrada' });
    await queueAgentCommand(connection, req.user.UserID, { type: 'restart_agent' });
    await logDbOp({ userId: req.user.UserID, databaseId: connection._id, databaseName: connection.name, engine: connection.engine, operation: 'client_restart', severity: 'high', status: 'success', ip: req.ip });
    res.json({ success: true, message: 'Reinicio enviado al agente' });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// POST /:id/agent-scan-result - Agent submits scan results
router.post('/:id/agent-scan-result', async (req, res) => {
  try {
    const { tables, totalTables, totalRows, personalDataColumns, sizeBytes, error } = req.body;

    const update = {
      agentLastSeen: new Date(),
    };

    if (error) {
      update.status = 'error';
      update.errorMessage = error;
    } else {
      update.status = 'connected';
      let encryptedCount = 0;
      let unencryptedCount = 0;
      if (tables) {
        update.tables = tables.map(t => {
          const enc = t.encrypted === true;
          if (enc) encryptedCount++; else unencryptedCount++;
          return {
            table: t.name || t.table || 'unknown',
            rows: t.rowCount || t.rows || 0,
            encrypted: enc,
            columns: (t.columns || []).map(c => ({
              name: c.name || '',
              type: c.type || '',
              nullable: c.nullable || false,
              primaryKey: c.isPK || c.primaryKey || false,
              isPersonal: c.isPersonal === true,
              category: c.category || '',
            })),
            personalDataColumns: t.personalDataColumns || (t.columns || [])
              .filter(c => c.isPersonal)
              .map(c => c.name),
          };
        });
      }
      update.metrics = {
        tablesCount: totalTables || 0,
        recordsCount: totalRows || 0,
        sizeBytes: sizeBytes || 0,
        lastScanned: new Date(),
        encryptedTables: encryptedCount,
        unencryptedTables: unencryptedCount,
      };
    }

    const connection = await DatabaseConnection.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: false }
    );
    if (!connection) return res.json({ error: 'Conexión no encontrada' });

    // Resolve pending scan if any
    const resolveScan = pendingScans.get(req.params.id);
    if (resolveScan) {
      resolveScan({ tables, totalTables, totalRows, personalDataColumns, sizeBytes, error });
    }

    // Emit scan complete event
    if (connection.userId) {
      agentEvents.emit('scan:complete', {
        connectionId: req.params.id,
        dbName: connection.name,
        tablesCount: totalTables || 0,
        userId: connection.userId.toString(),
        timestamp: new Date(),
      });
    }

    // Auto-generate inventory items + alerts from personal data findings
    if (!error && tables && connection.userId) {
      const userId = connection.userId;
      const allPersonalCols = [];
      (tables || []).forEach(t => {
        const cols = t.personalDataColumns || (t.columns || []).filter(c => c.isPersonal).map(c => c.name);
        cols.forEach(col => allPersonalCols.push({ table: t.name || t.table, column: col }));
      });

      if (allPersonalCols.length > 0) {
        // Auto-create DataInventory items for each table with personal data
        for (const pc of allPersonalCols) {
          const existing = await DataInventory.findOne({
            userId, dataType: pc.column, storageLocation: connection.name,
          });
          if (!existing) {
            const category = pc.column.match(/rut|run|cedula/i) ? 'clientes' :
              pc.column.match(/salud|medic|enferm|diagnostico/i) ? 'datos_salud' :
              pc.column.match(/email|correo|mail/i) ? 'clientes' :
              pc.column.match(/direc|domicilio/i) ? 'clientes' :
              pc.column.match(/tarjeta|cuenta|banco|financ/i) ? 'datos_financieros' :
              pc.column.match(/biometric|huella|rostro/i) ? 'datos_biometricos' : 'clientes';
            const sensitive = /salud|biometric|bancario|financ|credencial/i.test(pc.column);
            await DataInventory.create({
              userId, category, dataType: pc.column,
              storage: 'local', storageLocation: connection.name,
              legalBasis: 'consent', sensitive, risk: sensitive ? 'high' : 'medium',
              securityMeasures: ['encriptado', 'acceso_restringido'],
            });
          }
        }

        // Create alert for personal data discovery
        await Alert.create({
          userId,
          title: 'Datos Personales Detectados',
          message: `${allPersonalCols.length} columna(s) con datos personales encontradas en ${connection.name} (${connection.engine}): ${allPersonalCols.map(p => p.column).join(', ')}`,
          severity: allPersonalCols.some(p => /salud|biometric|bancario|financ/i.test(p.column)) ? 'high' : 'medium',
          source: 'database_scan',
          category: 'data_discovery',
          status: 'active',
          metadata: { connectionId: req.params.id, dbName: connection.name, columns: allPersonalCols },
        });
      }

      // If the DB has SSL=false, create a warning alert
      if (!connection.ssl) {
        await Alert.create({
          userId,
          title: 'Conexión Sin Cifrado',
          message: `La base de datos ${connection.name} (${connection.engine}) no utiliza SSL/TLS. Los datos viajan sin cifrar.`,
          severity: 'high',
          source: 'database_scan',
          category: 'encryption',
          status: 'active',
          metadata: { connectionId: req.params.id, dbName: connection.name },
        });
      }
    }

    // Log scan completion with results
    const encCount = tables ? tables.filter(t => t.encrypted).length : 0;
    const unencCount = tables ? tables.filter(t => !t.encrypted).length : 0;
    await logDbOp({
      userId: connection.userId, databaseId: connection._id, databaseName: connection.name,
      engine: connection.engine, operation: 'scan', severity: 'low', status: error ? 'error' : 'success',
      ip: req.ip, source: 'agent',
      rowsAffected: totalRows || 0,
      metadata: {
        totalTables: totalTables || 0,
        personalDataColumns: personalDataColumns || 0,
        encryptedTables: encCount,
        unencryptedTables: unencCount,
        sizeBytes: sizeBytes || 0,
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─── Direct MariaDB Test Scan (for demo/testing) ──────────────────────
function detectEncryptionType(values) {
  if (!values || values.length === 0) return { type: 'unknown', reason: 'No hay datos para analizar' };
  let aesCount = 0, plainCount = 0, hashCount = 0;
  const samples = [];
  for (const v of values) {
    if (!v) continue;
    const str = String(v);
    samples.push(str.length > 60 ? str.slice(0, 60) + '...' : str);
    if (/^[A-Za-z0-9+/]{20,}={0,2}$/.test(str) && str.length >= 24) {
      aesCount++;
    } else if (/^\$2[aby]\$\d+\$.{53}$/.test(str) || /^[a-f0-9]{32,128}$/i.test(str)) {
      hashCount++;
    } else {
      plainCount++;
    }
  }
  if (aesCount > plainCount && aesCount > hashCount) return { type: 'aes_encrypted', reason: `Parece AES/base64 (${aesCount}/${values.length} valores)` };
  if (hashCount > plainCount && hashCount > aesCount) return { type: 'hashed', reason: `Parece hash (${hashCount}/${values.length} valores)` };
  if (plainCount > 0) return { type: 'plaintext', reason: `Contraseñas en texto plano (${plainCount}/${values.length} valores)`, risk: 'critical' };
  return { type: 'unknown', reason: 'No se pudo determinar' };
}

router.post('/admin/test-scan-mariadb', async (req, res) => {
  const { token, host, port, database, user, password } = req.body;
  const admin = await validateToken(token);
  if (!admin || !isAdmin(admin)) return res.json({ error: 'Unauthorized' });
  const h = host || '127.0.0.1';
  const p = port || 3306;
  const db = database || 'test_empresa_demo';
  const u = user || 'root';
  const pw = password || '';
  try {
    const conn = await mysql.createConnection({ host: h, port: p, database: db, user: u, password: pw, connectTimeout: 5000 });
    const [tables] = await conn.execute('SELECT TABLE_NAME, TABLE_ROWS, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [db]);
    const result = { database: db, host: h, port: p, tables: [], passwordAnalysis: [] };
    for (const t of tables) {
      const tableName = t.TABLE_NAME;
      const [cols] = await conn.execute('SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, CHARACTER_MAXIMUM_LENGTH, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION', [db, tableName]);
      const [rowCount] = await conn.execute(`SELECT COUNT(*) AS cnt FROM \`${tableName}\``);
      const tableInfo = {
        name: tableName,
        rows: rowCount[0]?.cnt || 0,
        engine: t.ENGINE || 'InnoDB',
        columns: cols.map(c => ({ name: c.COLUMN_NAME, type: c.COLUMN_TYPE, nullable: c.IS_NULLABLE === 'YES', key: c.COLUMN_KEY || '', maxLength: c.CHARACTER_MAXIMUM_LENGTH, autoIncrement: c.EXTRA?.includes('auto_increment') })),
      };
      result.tables.push(tableInfo);

      // Password column detection
      const passCols = cols.filter(c => /password|contraseña|pass|secret|token|auth_key|api_key|clave/i.test(c.COLUMN_NAME));
      if (passCols.length > 0) {
        for (const pc of passCols) {
          try {
            const [samples] = await conn.execute(`SELECT \`${pc.COLUMN_NAME}\` FROM \`${tableName}\` WHERE \`${pc.COLUMN_NAME}\` IS NOT NULL AND \`${pc.COLUMN_NAME}\` != '' LIMIT 10`);
            const values = samples.map(r => r[pc.COLUMN_NAME]);
            const analysis = detectEncryptionType(values);
            result.passwordAnalysis.push({
              table: tableName,
              column: pc.COLUMN_NAME,
              type: pc.COLUMN_TYPE,
              sampleCount: values.length,
              samples: values.slice(0, 3).map(v => typeof v === 'string' ? v.substring(0, 2) + '*'.repeat(Math.max(0, v.length - 2)) : '***'),
              encryption: analysis,
            });
          } catch {}
        }
      }
    }
    await conn.end();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
