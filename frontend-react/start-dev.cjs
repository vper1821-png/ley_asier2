const { spawn } = require('child_process');
const npmPath = 'C:\\Progra~1\\nodejs\\npm.cmd';
const child = spawn(npmPath, ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});
process.on('SIGINT', () => { if (!child.killed) child.kill('SIGINT'); });
process.on('SIGTERM', () => { if (!child.killed) child.kill('SIGTERM'); });
child.on('exit', (code) => process.exit(code));
