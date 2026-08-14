import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { execFileSync, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config.js';
import Agent from '../models/agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

export const pendingCommands = new Map();
export const agentEvents = new EventEmitter();
agentEvents.setMaxListeners(100);

// ── Plataformas soportadas ──
const PLATFORMS = {
  'win-x64':   { goos: 'windows', goarch: 'amd64', ext: '.exe' },
  'linux-x64': { goos: 'linux',   goarch: 'amd64', ext: ''     },
  'mac-x64':   { goos: 'darwin',  goarch: 'amd64', ext: ''     },
  'mac-arm64': { goos: 'darwin',  goarch: 'arm64', ext: ''     },
};

// ── Ruta donde se copian los binarios precompilados en el Dockerfile ──
const BIN_DIR = path.join(__dirname, '..', 'agent-bin');

const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

export async function markStaleAgentsOffline() {
  const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
  const result = await Agent.updateMany(
    { status: 'online', lastHeartbeat: { $lt: cutoff } },
    { $set: { status: 'offline' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[Agent] Marked ${result.modifiedCount} stale agent(s) offline`);
  }
}

setInterval(markStaleAgentsOffline, OFFLINE_THRESHOLD_MS);

function verifyToken(token) {
  try {
    return jwt.verify(token, CONFIG.JWT_SECRET);
  } catch {
    return null;
  }
}

router.post('/register', async (req, res) => {
  try {
    const { token, hostname, platform, arch, ip, version, agentId } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const agent = await Agent.findOneAndUpdate(
      { userId: decoded.userId, hostname },
      {
        $set: {
          agentId,
          token,
          platform,
          arch,
          ip,
          version,
          status: 'online',
          lastHeartbeat: new Date(),
        },
        $setOnInsert: {
          userId: decoded.userId,
          hostname,
          registeredAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    agentEvents.emit('agent:online', {
      agentId: agent.agentId,
      hostname: agent.hostname,
      userId: decoded.userId,
      timestamp: new Date(),
    });

    res.json({ agentId: agent.agentId, agent: { _id: agent._id } });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET /events - SSE endpoint for real-time agent events
router.get('/events', (req, res) => {
  const token = req.query.token;
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'token inválido' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write('data: {"type":"connected"}\n\n');

  const onAgentOnline = (data) => {
    if (data.userId === decoded.userId) {
      res.write(`data: ${JSON.stringify({ type: 'agent:online', ...data })}\n\n`);
    }
  };

  const onScanComplete = (data) => {
    if (data.userId === decoded.userId) {
      res.write(`data: ${JSON.stringify({ type: 'scan:complete', ...data })}\n\n`);
    }
  };

  agentEvents.on('agent:online', onAgentOnline);
  agentEvents.on('scan:complete', onScanComplete);

  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat"}\n\n');
  }, 30000);

  req.on('close', () => {
    agentEvents.off('agent:online', onAgentOnline);
    agentEvents.off('scan:complete', onScanComplete);
    clearInterval(heartbeat);
  });
});

router.post('/:id/heartbeat', async (req, res) => {
  try {
    const { token, metrics, status, activeUsers, firewallRules, activeFirewallRules, blockedUsers } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const agent = await Agent.findOne({ agentId: req.params.id, userId: decoded.userId });
    if (!agent) {
      return res.json({ error: 'agent not found' });
    }

    const wasOffline = agent.status !== 'online';
    agent.status = status?.online === false ? 'offline' : 'online';
    agent.lastHeartbeat = new Date();

    const metricData = metrics || status;
    if (metricData) {
      if (metricData.cpu !== undefined) agent.metrics.cpu = metricData.cpu;
      if (metricData.memory !== undefined) agent.metrics.memory = metricData.memory;
      if (metricData.load !== undefined) {
        agent.metrics.load = typeof metricData.load === 'object' && metricData.load !== null
          ? metricData.load.loadAvg ?? metricData.load.cpuCores
          : metricData.load;
        if (typeof metricData.load === 'object' && metricData.load !== null) {
          const { memUsed, memTotal } = metricData.load;
          if (memUsed != null && memTotal > 0) {
            agent.metrics.memory = Math.round((memUsed / memTotal) * 100);
          }
        }
      }
      if (metricData.users !== undefined) agent.metrics.users = metricData.users;
      if (metricData.uptime !== undefined) agent.metrics.uptime = metricData.uptime;
    }
    if (activeUsers !== undefined) agent.activeUsers = activeUsers;
    const fwRules = firewallRules || activeFirewallRules;
    if (fwRules !== undefined) agent.firewall = fwRules;
    if (status?.firewall !== undefined) agent.firewall = status.firewall;
    if (blockedUsers !== undefined) agent.blockedUsers = blockedUsers;
    await agent.save();

    if (wasOffline) {
      agentEvents.emit('agent:online', {
        agentId: agent.agentId,
        hostname: agent.hostname,
        userId: decoded.userId,
        timestamp: new Date(),
      });
    }

    const agentCommands = pendingCommands.get(agent.agentId) || [];
    const command = agentCommands.length > 0 ? agentCommands.shift() : {};
    if (agentCommands.length === 0) pendingCommands.delete(agent.agentId);

    const hasActionCommand = command?.type === 'scan_database' || command?.type === 'execute_query' || command?.type === 'test_connection';
    const response = {
      online: true,
      heartbeatInterval: hasActionCommand || agentCommands.length > 0 ? 2 : 5,
      pendingBlocks: command?.type === 'block_users' ? command.users || [] : [],
      pendingUnblocks: command?.type === 'unblock_users' ? command.users || [] : [],
      pendingRules: command?.type === 'apply_rules' ? command.rules || [] : [],
    };

    if (command?.type === 'scan_database') {
      response.scanCommand = command;
    }
    if (command?.type === 'execute_query') {
      response.queryCommand = command;
    }
    if (command?.type === 'test_connection') {
      response.testCommand = command;
    }
    if (command?.type === 'uninstall_agent' || command?.type === 'reconnect_db' || command?.type === 'reconnect_agent' || command?.type === 'restart_agent') {
      response.clientCommand = { type: command.type };
    }

    res.json(response);
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/:id/event', async (req, res) => {
  try {
    const { token, event } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const agent = await Agent.findOne({ agentId: req.params.id, userId: decoded.userId });
    if (!agent) return res.json({ error: 'agent not found' });

    const eventRecord = {
      agentId: agent.agentId,
      userId: decoded.userId,
      event,
      timestamp: new Date(),
    };

    res.json({ success: true, eventId: eventRecord.timestamp.getTime() });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/list', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    await markStaleAgentsOffline();
    const agents = await Agent.find({ userId: decoded.userId }).sort({ lastHeartbeat: -1 }).lean();
    res.json(agents);
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/download-token', (req, res) => {
  const { token } = req.body;
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'token inválido' });

  const dlToken = jwt.sign(
    { userId: decoded.userId, email: decoded.email, purpose: 'agent_download' },
    CONFIG.JWT_SECRET,
    { expiresIn: '365d' }
  );
  res.json({ token: dlToken });
});

router.post('/:id', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const agent = await Agent.findOne({ agentId: req.params.id, userId: decoded.userId }).lean();
    if (!agent) return res.json({ error: 'agent not found' });

    res.json(agent);
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/:id/command', async (req, res) => {
  try {
    const { token, command } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const agent = await Agent.findOne({ agentId: req.params.id, userId: decoded.userId });
    if (!agent) return res.json({ error: 'agent not found' });

    if (!pendingCommands.has(agent.agentId)) {
      pendingCommands.set(agent.agentId, []);
    }
    pendingCommands.get(agent.agentId).push(command);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

router.post('/:id/delete', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = verifyToken(token);
    if (!decoded) return res.json({ error: 'token inválido' });

    const agent = await Agent.findOneAndDelete({ agentId: req.params.id, userId: decoded.userId });
    if (!agent) return res.json({ error: 'agent not found' });

    pendingCommands.delete(agent.agentId);
    res.json({ success: true });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ── Descarga del agente (sirve binarios precompilados) ──
function handleAgentDownload(req, res) {
  const { platform } = req.params;
  const token = req.method === 'POST' ? req.body?.token : req.query?.token;

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'token inválido' });

  const plat = PLATFORMS[platform];
  if (!plat) return res.status(400).json({ error: 'Plataforma no válida' });

  const baseBinary = path.join(BIN_DIR, `agent-${platform}${plat.ext}`);
  if (!fs.existsSync(baseBinary)) {
    return res.status(503).json({ error: 'Agente no disponible para esta plataforma' });
  }

  try {
    const agentAPIBase = `${CONFIG.API_BASE_URL}/api/agents`;
    const dlDir = path.join(os.tmpdir(), `agent-dl-${Date.now()}`);
    fs.mkdirSync(dlDir, { recursive: true });

    const binaryName = `securelab-agent${plat.ext}`;
    const binaryPath = path.join(dlDir, binaryName);
    fs.copyFileSync(baseBinary, binaryPath);

    const config = {
      api_base: agentAPIBase,
      token: token,
      heartbeat_interval: 5,
      agent_version: "2.0.0"
    };
    const configPath = path.join(dlDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    if (!fs.existsSync(configPath)) {
      throw new Error('No se pudo crear config.json');
    }

    const archiveName = platform === 'win-x64'
      ? `SecureLab-Agent-${platform}.msi`
      : `SecureLab-Agent-${platform}.tar.gz`;
    const archivePath = path.join(os.tmpdir(), archiveName);

    if (platform === 'win-x64') {
      const wxsPath = path.resolve(__dirname, '../agent-go/installer/product.wxs');
      if (!fs.existsSync(wxsPath)) {
        throw new Error(`No se encontró el archivo .wxs: ${wxsPath}`);
      }

      const wixlCmd = '/usr/bin/wixl';
      const args = [
        '-D', `Version=2.0.0`,
        '-D', `ExeSource=${binaryPath}`,
        '-D', `ConfigSource=${configPath}`,
        '-o', archivePath,
        '--arch', 'x64',
        wxsPath
      ];
      console.log('[Agent Download] Ejecutando:', wixlCmd, args.join(' '));
      execFileSync(wixlCmd, args, { stdio: 'pipe', timeout: 60000 });
    } else {
      const cmd = `tar czf "${archivePath}" -C "${dlDir}" "${binaryName}" "config.json"`;
      execSync(cmd, { stdio: 'pipe', shell: '/bin/sh' });
    }

    const stat = fs.statSync(archivePath);
    res.writeHead(200, {
      'Content-Type': platform === 'win-x64' ? 'application/x-msi' : 'application/gzip',
      'Content-Disposition': `attachment; filename="${archiveName}"`,
      'Content-Length': stat.size,
    });
    fs.createReadStream(archivePath).pipe(res).on('finish', () => {
      try { fs.rmSync(dlDir, { recursive: true, force: true }); } catch {}
      try { fs.unlinkSync(archivePath); } catch {}
    });
  } catch (err) {
    let msg = err.message;
    if (err.stderr) {
      const stderr = err.stderr.toString().trim();
      console.error('[Agent Download] stderr:', stderr);
      if (stderr) msg = stderr;
    }
    console.error('[Agent Download] Error completo:', err);
    res.status(500).json({ error: `Error preparando agente: ${msg}` });
  }
}

router.get('/download/:platform', handleAgentDownload);
router.post('/download/:platform', handleAgentDownload);

export default router;
