export class ResourceMonitor {
  constructor() {
    this.started = false;
    this.cpuUsage = 0;
    this.memoryUsage = 0;
  }

  start() {
    this.started = true;
    setInterval(() => {
      this.cpuUsage = Math.random() * 100;
      this.memoryUsage = Math.random() * 100;
    }, 5000);
  }

  getStats() {
    return { cpuUsage: this.cpuUsage, memoryUsage: this.memoryUsage };
  }
}

export class WorkerManager {
  constructor() {
    this.enabled = true;
    this.minWorkers = 2;
    this.maxWorkers = 50;
    this.currentWorkers = 0;
    this.status = 'idle';
    this.tasksCompleted = 0;
  }

  start() { this.status = 'running'; }
  getStatus() { return { enabled: this.enabled, minWorkers: this.minWorkers, maxWorkers: this.maxWorkers, currentWorkers: this.currentWorkers, status: this.status, tasksCompleted: this.tasksCompleted }; }
  setEnabled(v) { this.enabled = v; }
  setMinWorkers(v) { this.minWorkers = v; }
  setMaxWorkers(v) { this.maxWorkers = v; }
}

export class MetricsCollector {
  constructor() {
    this.started = false;
    this.metrics = [];
  }

  start() {
    this.started = true;
    setInterval(() => {
      this.metrics.push({
        timestamp: new Date().toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        scans: Math.floor(Math.random() * 10),
      });
      if (this.metrics.length > 100) this.metrics.shift();
    }, 5000);
  }

  getSnapshot() {
    return {
      uptime: process.uptime(),
      currentMetrics: this.metrics.slice(-10),
      summary: {
        avgCpu: this.metrics.reduce((a, m) => a + m.cpu, 0) / (this.metrics.length || 1),
        avgMemory: this.metrics.reduce((a, m) => a + m.memory, 0) / (this.metrics.length || 1),
      },
    };
  }
}

export const GlobalResourceMonitor = new ResourceMonitor();
export const GlobalWorkerManager = new WorkerManager();
export const GlobalMetricsCollector = new MetricsCollector();
