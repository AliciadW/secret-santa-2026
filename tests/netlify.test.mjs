import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { createTestPostgres } from './helpers/postgres.mjs'

test('the built Netlify handler accepts Web Request bodies and creates a complete, stable draw', { timeout: 30000 }, async () => {
  const database = await createTestPostgres()
  const postgres = new PGLiteSocketServer({ db: database, host: '127.0.0.1', port: 0, maxConnections: 20 })
  let runner
  try {
    await postgres.start()
    // Invoke the actual deployed entry point with Web Requests. A Node HTTP
    // server does not exercise Netlify's adapted IncomingMessage.
    runner = spawn(process.execPath, [fileURLToPath(new URL('./helpers/netlify-requests.mjs', import.meta.url))], {
      env: {
        ...process.env,
        NETLIFY_DB_URL: `postgresql://postgres:postgres@${postgres.getServerConn()}/postgres?sslmode=disable`,
        NETLIFY_DB_DRIVER: 'server',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    runner.stdout.on('data', chunk => { output += chunk })
    runner.stderr.on('data', chunk => { output += chunk })
    const [code, signal] = await once(runner, 'close')
    assert.equal(code, 0, `Netlify request check failed (${signal || code}): ${output}`)
  } finally {
    if (runner && runner.exitCode === null && runner.signalCode === null) {
      const closed = once(runner, 'close')
      runner.kill('SIGTERM')
      await closed
    }
    await postgres.stop()
    await database.close()
  }
})
