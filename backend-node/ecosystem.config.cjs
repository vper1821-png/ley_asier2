module.exports = {
  apps: [
    {
      name: 'invisia-api',
      script: 'server.js',
      max_memory_restart: '1G',
      cron_restart: '0 4 * * *',
    },
    {
      name: 'ollama',
      script: 'C:\\Users\\asier\\AppData\\Local\\Programs\\Ollama\\ollama.exe',
      args: ['serve'],
      interpreter: 'none',
      max_memory_restart: '8G',
    },
  ],
};
