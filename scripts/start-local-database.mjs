import { resolve } from 'node:path'
import { NetlifyDB } from '@netlify/database-dev'

// Used only by Nuxt development mode when no database is configured. Migrations
// run against this newly started local instance, never a supplied/live URL.
export async function startLocalDatabase(root) {
  const database = new NetlifyDB({ directory: resolve(root, '.netlify/local-postgres'), logger: () => {} })
  try {
    const connectionString = await database.start()
    await database.applyMigrations(resolve(root, 'netlify/database/migrations'))
    return { connectionString, stop: () => database.stop() }
  } catch (error) {
    await database.stop()
    throw error
  }
}
