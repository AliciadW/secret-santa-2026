import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Run the exact SQL files Netlify will apply, against an isolated Postgres engine.
export async function createTestPostgres(directory) {
  const client = await PGlite.create(directory)
  try {
    const root = new URL('../../netlify/database/migrations/', import.meta.url)
    const entries = (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      const path = entry.isDirectory() ? `${entry.name}/migration.sql` : entry.name
      if (entry.isDirectory() || path.endsWith('.sql')) {
        await client.exec(await readFile(new URL(path, root), 'utf8'))
      }
    }
    return client
  } catch (error) {
    await client.close()
    throw error
  }
}
