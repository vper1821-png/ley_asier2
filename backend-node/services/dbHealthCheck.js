import mongoose from 'mongoose';
import DatabaseConnection from '../models/databaseConnection.js';
import Notification from '../models/notification.js';
import { AdminSettings } from '../models/db.js';
import { pendingCommands } from '../routes/agents.js';
import { sendNotificationEmail } from './email.js';
import Agent from '../models/agent.js';

let intervalHandle = null;
const CHECK_INTERVAL = 5 * 60 * 1000;
const DISCONNECT_THRESHOLD = 10 * 60 * 1000;

export async function startDbHealthCheck() {
  if (intervalHandle) clearInterval(intervalHandle);
  await runHealthCheck();
  intervalHandle = setInterval(runHealthCheck, CHECK_INTERVAL);
}

export function stopDbHealthCheck() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

async function runHealthCheck() {
  try {
    const connections = await DatabaseConnection.find({ status: 'connected' }).lean();
    for (const conn of connections) {
      await checkConnection(conn);
    }
    const errored = await DatabaseConnection.find({ healthCheckStatus: 'unreachable' }).lean();
    for (const conn of errored) {
      if (conn.status !== 'connected' && Date.now() - new Date(conn.updatedAt).getTime() > DISCONNECT_THRESHOLD) {
        const existingNotif = await Notification.findOne({
          userId: conn.userId,
          type: 'db_disconnected',
          relatedId: conn._id.toString(),
          read: false,
        });
        if (!existingNotif) {
          await Notification.create({
            userId: conn.userId,
            type: 'db_disconnected',
            title: 'Base de datos desconectada',
            message: `La conexión "${conn.name}" (${conn.engine}) lleva más de 10 minutos sin responder. Revisa que el servidor de bases de datos esté accesible.`,
            relatedId: conn._id.toString(),
            relatedModel: 'DatabaseConnection',
            metadata: { engine: conn.engine, host: conn.host, database: conn.database },
          });
          if (conn.notifyEmail) {
            await sendDbDisconnectEmail(conn);
          }
        }
      }
    }
  } catch (err) {
    console.error('[HealthCheck] Error:', err.message);
  }
}

async function checkConnection(conn) {
  try {
    const agent = await Agent.findOne({ userId: conn.userId, status: 'online' }).sort({ lastHeartbeat: -1 }).lean();
    if (!agent) {
      await DatabaseConnection.findByIdAndUpdate(conn._id, { healthCheckStatus: 'unreachable', lastHealthCheck: new Date() }).catch(() => {});
      return;
    }
    const testCommand = {
      type: 'test_connection',
      dbConnection: {
        engine: conn.engine, host: conn.host, port: conn.port,
        database: conn.database, username: conn.username,
        password: conn.password, ssl: conn.ssl,
      },
      connectionId: 'healthcheck-' + conn._id.toString(),
    };
    if (!pendingCommands.has(agent.agentId)) {
      pendingCommands.set(agent.agentId, []);
    }
    pendingCommands.get(agent.agentId).push(testCommand);
    const wasUnreachable = conn.healthCheckStatus === 'unreachable';
    await DatabaseConnection.findByIdAndUpdate(conn._id, {
      healthCheckStatus: 'ok',
      lastHealthCheck: new Date(),
    }).catch(() => {});
    if (wasUnreachable) {
      await Notification.create({
        userId: conn.userId,
        type: 'db_reconnected',
        title: 'Base de datos reconectada',
        message: `La conexión "${conn.name}" (${conn.engine}) ha vuelto a estar disponible.`,
        relatedId: conn._id.toString(),
        relatedModel: 'DatabaseConnection',
      });
      if (conn.notifyEmail) {
        await sendDbReconnectEmail(conn);
      }
    }
  } catch {
    await DatabaseConnection.findByIdAndUpdate(conn._id, {
      healthCheckStatus: 'unreachable',
      lastHealthCheck: new Date(),
    }).catch(() => {});
  }
}

async function sendDbDisconnectEmail(conn) {
  try {
    const user = await mongoose.model('User').findById(conn.userId).lean();
    if (!user) return;
    const smtpConfig = await AdminSettings.findOne().lean();
    const recipients = conn.notifyEmailRecipients?.length ? conn.notifyEmailRecipients : [user.email];
    await sendNotificationEmail(smtpConfig, {
      title: `🔴 Base de datos desconectada: ${conn.name}`,
      message: `La conexión "${conn.name}" (${conn.engine}://${conn.host}:${conn.port}/${conn.database}) no responde desde hace más de 10 minutos. Por favor, verifica que el servidor esté funcionando y accesible desde el agente.`,
      severity: 'high',
    }, recipients);
  } catch (err) {
    console.error('[HealthCheck] Email error:', err.message);
  }
}

async function sendDbReconnectEmail(conn) {
  try {
    const user = await mongoose.model('User').findById(conn.userId).lean();
    if (!user) return;
    const smtpConfig = await AdminSettings.findOne().lean();
    const recipients = conn.notifyEmailRecipients?.length ? conn.notifyEmailRecipients : [user.email];
    await sendNotificationEmail(smtpConfig, {
      title: `🟢 Base de datos reconectada: ${conn.name}`,
      message: `La conexión "${conn.name}" (${conn.engine}://${conn.host}:${conn.port}/${conn.database}) ha vuelto a estar disponible.`,
      severity: 'info',
    }, recipients);
  } catch (err) {
    console.error('[HealthCheck] Email error:', err.message);
  }
}
