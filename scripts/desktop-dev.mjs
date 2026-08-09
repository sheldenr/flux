import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import process from 'node:process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const vite = spawn(npm, ['run', 'dev', '--', '--host', '127.0.0.1'], {
  stdio: 'inherit',
  env: { ...process.env, BROWSER: 'none' },
})

function waitForVite(port = 5173) {
  return new Promise((resolve) => {
    const attempt = () => {
      const socket = createConnection({ host: '127.0.0.1', port })
      socket.once('connect', () => { socket.destroy(); resolve() })
      socket.once('error', () => setTimeout(attempt, 100))
    }
    attempt()
  })
}

await waitForVite()
const electron = spawn(npm, ['exec', '--', 'electron', '.'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173' },
})

function shutdown() {
  vite.kill('SIGTERM')
  if (!electron.killed) electron.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
electron.on('exit', (code) => {
  shutdown()
  process.exit(code ?? 0)
})
