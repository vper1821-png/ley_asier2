import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import { connectDB } from './models/db.js';
import { logDbOp } from './services/dbLogger.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import captchaRoutes from './routes/captcha.js';
import passkeyRoutes from './routes/passkey.js';
import complianceRoutes from './routes/compliance.js';
import databaseRoutes from './routes/databases.js';
import agentRoutes from './routes/agents.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes, { cleanupLegacyReports } from './routes/reports.js';
import onboardingRoutes from './routes/onboarding.js';
import userMonitorRoutes from './routes/userMonitor.js';
import aiRoutes from './routes/ai.js';
import alertRoutes from './routes/alerts.js';
import assistantRoutes from './routes/assistant.js';
import chatRoutes from './routes/chat.js';
import ticketRoutes from './routes/tickets.js';
import smtpRoutes from './routes/smtp.js';
import notificationRoutes from './routes/notifications.js';
import compliantCompaniesRoutes from './routes/compliantCompanies.js';
import arcoRoutes from './routes/arco.js';
import hostMonitorRoutes from './routes/hostMonitor.js';
import paymentRoutes from './routes/payments.js';
import accountRoutes from './routes/account.js';
import adminExtrasRoutes from './routes/admin-extras.js';
import { startDbHealthCheck } from './services/dbHealthCheck.js';
import { startDataRetentionScheduler } from './services/dataRetention.js';
import { startReportScheduler } from './services/reportScheduler.js';
import { setWSS } from './services/agentWs.js';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import net from 'net';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Agent from './models/agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: CONFIG.CORS_ORIGIN }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '2mb' }));

app.set('trust proxy', 1);

const rateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
};
const apiLimiter = rateLimit({ ...rateLimitOptions, max: 500, message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde' } });
const authLimiter = rateLimit({ ...rateLimitOptions, max: 30, message: { error: 'Demasiados intentos de autenticación' } });
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/passkey', passkeyRoutes);
app.use('/api/invisia', complianceRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api', userMonitorRoutes);
app.use('/api', aiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/host-monitor', hostMonitorRoutes);
app.use('/api', ticketRoutes);
app.use('/api', assistantRoutes);
app.use('/api', chatRoutes);
app.use('/api/smtp', smtpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', compliantCompaniesRoutes);
app.use('/api', paymentRoutes);
app.use('/api', accountRoutes);
app.use('/api', adminExtrasRoutes);
app.use('/api', arcoRoutes);

// WAF check endpoint
app.get('/api/hardening/check-waf', async (req, res) => {
  try {
    let domain = req.query.domain || '';
    domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    if (!domain) return res.json({ waf: false, provider: null, error: 'no domain' });

    const resp = await axios.get(`https://${domain}`, {
      timeout: 10000,
      headers: { 'User-Agent': 'SecureLab-WAF-Checker/1.0' },
      validateStatus: () => true,
    });

    const headers = resp.headers;
    let provider = null;

    if (headers['cf-ray']) provider = 'Cloudflare';
    else if (headers['x-sucuri-id']) provider = 'Sucuri CloudProxy';
    else if (headers['x-iinfo']) provider = 'Imperva / Incapsula';
    else if (headers['server'] && headers['server'].toLowerCase().includes('cloudflare')) provider = 'Cloudflare';
    else if (headers['x-powered-by'] && headers['x-powered-by'].toLowerCase().includes('mod_security')) provider = 'ModSecurity';
    else if (headers['x-application-context']) provider = 'F5 BIG-IP ASM';
    else if (headers['x-akamai-*'] || headers['x-akamai-transformed']) provider = 'Akamai';

    res.json({ waf: !!provider, provider, status: resp.status });
  } catch (e) {
    res.json({ waf: false, provider: null, error: e.message });
  }
});

const distPath = path.resolve(__dirname, '..', 'frontend-react', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Ruta no encontrada' });
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
});

console.log('╔══════════════════════════════════════╗');
console.log('║     Compliance API                       ║');
console.log('╚══════════════════════════════════════╝');

await connectDB();

// On restart: mark all agents as needing reconnect
try {
  const result = await Agent.updateMany(
    { wsConnected: true },
    { $set: { status: 'offline', wsConnected: false } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[SERVER] Marked ${result.modifiedCount} agent(s) as offline (server restart)`);
  }
} catch (e) {
  console.log('[SERVER] Error resetting agent status on startup:', e.message);
}
await cleanupLegacyReports();
startDbHealthCheck();
startDataRetentionScheduler();
startReportScheduler();

const port = CONFIG.PORT || 3838;
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/agent' });
setWSS(wss);

wss.on('connection', (ws, req) => {
  const socketIP = req.socket.remoteAddress;
  let agentId = null;
  let agentIP = null;

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // Track tunnels for this WS connection
  ws.tunnels = {};

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'register') {
        agentId = msg.agentId || msg.agentid;
        agentIP = msg.ip || socketIP;
        if (agentId) {
          const existing = await Agent.findOne({ agentId });
          if (existing) {
            const updateIP = (agentIP && agentIP !== '::1' && agentIP !== '127.0.0.1') ? agentIP : (existing.ip || agentIP);
            await Agent.findOneAndUpdate({ agentId }, { $set: { status: 'online', ip: updateIP, lastHeartbeat: new Date(), wsConnected: true } });
            ws.agentId = agentId;
            ws.userId = existing.userId;
            ws.send(JSON.stringify({ type: 'registered', agentId }));
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Agent not found' }));
          }
        }
      } else if (msg.type === 'heartbeat' && agentId) {
        const updateIP = (agentIP && agentIP !== '::1' && agentIP !== '127.0.0.1') ? agentIP : socketIP;
        await Agent.findOneAndUpdate({ agentId }, { $set: { status: 'online', lastHeartbeat: new Date(), ip: updateIP } });
        ws.isAlive = true;
      } else if (msg.type === 'analyze_query' && agentId) {
        // Server-side AI analysis via Ollama (agent doesn't need Ollama)
        const query = msg.payload || '';
        const user = msg.source || 'unknown';
        if (query && ws.userId) {
          const prompt = `Eres un experto en seguridad de BD y cumplimiento Ley 21.719 Chile. Analiza esta consulta SQL:

Usuario: ${user}
Alerta: ${msg.title || 'N/A'}
Consulta: ${query}

Responde SOLO con JSON:
{"riesgo":"BAJO|MEDIO|ALTO|CRITICO","tipo":"tipo","datosPersonales":true|false,"razon":"explicación breve"}`;

          try {
            const aiRes = await axios.post(`${CONFIG.OLLAMA_HOST}/api/generate`, {
              model: CONFIG.AI_MODEL,
              prompt,
              stream: false,
              options: { temperature: 0.1, num_ctx: 4096 },
            }, { timeout: 30000 });
            const text = aiRes.data?.response || '';
            const { default: Alert } = await import('./models/alert.js');
            await Alert.create({
              userId: ws.userId,
              title: '🤖 IA: ' + (msg.title || 'Análisis de consulta'),
              message: text,
              severity: msg.severity || 'info',
              source: 'ai_agent',
              category: 'ai_analysis',
            }).catch(() => {});
          } catch (e) {
            // Ollama not available on server — silently skip
          }
        }
      } else if (msg.type === 'compliance_status' && agentId) {
        if (msg.compliance) {
          await Agent.findOneAndUpdate({ agentId }, { $set: { compliance: msg.compliance, lastHeartbeat: new Date() } }).catch(() => {});
        }
      } else if (msg.type === 'ai_analysis' && agentId) {
        const { default: Alert } = await import('./models/alert.js');
        if (ws.userId && msg.title) {
          await Alert.create({
            userId: ws.userId, title: '🤖 IA: ' + msg.title,
            message: msg.description || '',
            severity: msg.severity || 'info',
            source: 'ai_agent',
            category: 'ai_analysis',
          }).catch(() => {});
        }
      } else if (msg.type === 'telemetry' && agentId) {
        await Agent.findOneAndUpdate({ agentId }, { $set: { metrics: msg.metrics || msg.data, lastHeartbeat: new Date() } });
      } else if (msg.type === 'pong' || msg.type === 'ping') {
        ws.isAlive = true;
      } else if (msg.type === 'tunnel_connect' && agentId) {
        // Agent requests a TCP tunnel through the server to bypass network barriers
        const tunId = msg.tunnelId || `tun_${Date.now()}`;
        const host = msg.host;
        const port = parseInt(msg.port) || 3306;
        if (!host) {
          ws.send(JSON.stringify({ type: 'tunnel_error', tunnelId: tunId, error: 'No host specified' }));
          return;
        }
        const sock = net.createConnection({ host, port, timeout: 10000 }, () => {
          ws.tunnels[tunId] = sock;
          ws.send(JSON.stringify({ type: 'tunnel_open', tunnelId: tunId }));
          sock.on('data', (chunk) => {
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({ type: 'tunnel_data', tunnelId: tunId, data: chunk.toString('base64') }));
            }
          });
          sock.on('error', (e) => {
            ws.send(JSON.stringify({ type: 'tunnel_error', tunnelId: tunId, error: e.message }));
            delete ws.tunnels[tunId];
          });
          sock.on('close', () => {
            ws.send(JSON.stringify({ type: 'tunnel_close', tunnelId: tunId }));
            delete ws.tunnels[tunId];
          });
        });
        sock.on('error', (e) => {
          ws.send(JSON.stringify({ type: 'tunnel_error', tunnelId: tunId, error: e.message }));
          delete ws.tunnels[tunId];
        });
      } else if (msg.type === 'tunnel_data' && agentId) {
        const sock = ws.tunnels[msg.tunnelId];
        if (sock) {
          const b64 = msg.payload || msg.data;
          if (b64) {
            const buf = Buffer.from(b64, 'base64');
            sock.write(buf);
          }
        }
      } else if (msg.type === 'tunnel_close' && agentId) {
        const sock = ws.tunnels[msg.tunnelId];
        if (sock) {
          sock.end();
          delete ws.tunnels[msg.tunnelId];
        }
      } else if (msg.type === 'scan_result' && agentId) {
        const { dbId, connectionId, tables, metrics, scanResult } = msg;
        const dbIdActual = dbId || connectionId;
        const tablesActual = tables || scanResult?.tables || [];
        const metricsActual = metrics || scanResult?.metrics || {};
        const { DatabaseConnection, DataInventory } = await import('./models/db.js');
        if (dbIdActual) {
          let enc = 0, unenc = 0;
          const enriched = tablesActual.map(t => {
            if (t.encrypted) enc++; else unenc++;
            return {
              ...t,
              personalDataColumns: t.personalDataColumns || (t.columns || []).filter(c => c.isPersonal).map(c => c.name),
            };
          });
          await DatabaseConnection.findOneAndUpdate({ _id: dbIdActual, agentId }, { $set: {
            'metrics.tablesCount': metricsActual?.tablesCount || metricsActual?.totalTables,
            'metrics.recordsCount': metricsActual?.recordsCount || metricsActual?.totalRows,
            'metrics.lastScanned': new Date(),
            'metrics.encryptedTables': enc,
            'metrics.unencryptedTables': unenc,
            tables: enriched,
          } }).catch(() => {});
          // Log scan completion via WebSocket path
          const dbName = metricsActual?.database || scanResult?.database || 'unknown';
          logDbOp({
            userId: ws.userId, databaseId: dbIdActual, databaseName: dbName,
            engine: metricsActual?.engine || scanResult?.engine || 'other',
            operation: 'scan', severity: 'low', status: 'success',
            ip: ws._socket?.remoteAddress, source: 'agent',
            rowsAffected: metricsActual?.totalRows || metricsActual?.recordsCount || 0,
            metadata: {
              totalTables: metricsActual?.totalTables || metricsActual?.tablesCount || 0,
              personalDataColumns: metricsActual?.personalDataColumns || 0,
              encryptedTables: enc,
              unencryptedTables: unenc,
            },
          });
        }
        for (const t of tablesActual) {
          if (dbIdActual && ws.userId) {
            try {
              const existing = await DataInventory.findOne({ databaseId: dbIdActual, tableName: t.name || t.Table });
              if (!existing) await DataInventory.create({ userId: ws.userId, databaseId: dbIdActual, tableName: t.name || t.Table, columns: t.columns, rowCount: t.rowCount || t.RowCount, storageLocation: t.name || t.Table, sensitive: false });
            } catch {}
          }
        }
      } else if (msg.type === 'host_event' && agentId) {
        const { default: Alert } = await import('./models/alert.js');
        if (ws.userId && msg.title) {
          const sev = (msg.severity || 'info').toLowerCase();
          const title = (msg.title || '').toLowerCase();
          // Filter false positives: info/low severity, and known benign patterns
          const falsePosPatterns = ['web browser', 'browser (unknown', 'config modified: .git', 'config modified: node_modules', 'process connected to mongodb', 'process connected to mysql', 'process connected to redis'];
          const isFalsePositive = sev === 'info' || sev === 'low' || falsePosPatterns.some(p => title.includes(p));
          if (!isFalsePositive) {
            await Alert.create({
              userId: ws.userId,
              title: msg.title,
              message: msg.description || msg.detail || '',
              severity: sev,
              source: 'host_monitor',
              category: msg.event_type || 'agent_event',
              metadata: {
                eventType: msg.event_type,
                agentSource: msg.source,
                timestamp: msg.timestamp,
              },
            }).catch(() => {});
          }
        }
      } else if (msg.type === 'event' && agentId) {
        const { default: Alert } = await import('./models/alert.js');
        const sev = (msg.severity || 'info').toLowerCase();
        if (sev !== 'info' && sev !== 'low' && msg.title && ws.userId) {
          await Alert.create({ userId: ws.userId, title: msg.title, message: msg.description || '', severity: sev, source: 'agent', category: 'agent_event' }).catch(() => {});
        }
      } else if (msg.type === 'log_query' && agentId) {
        const { addLogs } = await import('./services/localLogStore.js');
        const queries = msg.queryLogs || [];
        if (queries.length && ws.userId) {
          const docs = queries.map(q => ({
            userId: ws.userId,
            databaseId: null,
            databaseName: q.Database || '',
            engine: q.Engine || 'other',
            operation: q.Operation || 'query',
            query: (q.Query || '').substring(0, 10000),
            tables: q.Tables || [],
            severity: 'low',
            status: 'success',
            ip: q.Host || ws._socket?.remoteAddress,
            source: 'agent',
            metadata: { loggedBy: 'agent-compliance', user: q.User, host: q.Host, timestamp: q.Timestamp },
          }));
          addLogs(docs);
        }
      }
    } catch (e) { /* ignore bad messages */ }
  });

  ws.on('close', async () => {
    if (agentId) {
      await Agent.findOneAndUpdate({ agentId }, { $set: { status: 'offline', wsConnected: false } });
    }
    for (const id of Object.keys(ws.tunnels || {})) {
      try { ws.tunnels[id].end(); } catch {}
    }
    ws.tunnels = {};
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.listen(port, () => console.log(`[SERVER] Running on http://localhost:${port}`));
