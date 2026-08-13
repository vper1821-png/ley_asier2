let wss = null;

export function setWSS(wsServer) {
  wss = wsServer;
}

export function sendAgentCommand(agentId, msg) {
  if (!wss) return false;
  for (const client of wss.clients) {
    if (client.agentId === agentId && client.readyState === 1) {
      client.send(JSON.stringify(msg));
      return true;
    }
  }
  return false;
}

export function getWSS() {
  return wss;
}
