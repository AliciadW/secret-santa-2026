export default defineNuxtConfig({
  compatibilityDate: '2025-11-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  hooks: {
    async ready(nuxt) {
      if (!nuxt.options.dev || process.env.NETLIFY_DB_URL) return
      const { startLocalDatabase } = await import('./scripts/start-local-database.mjs')
      const database = await startLocalDatabase(nuxt.options.rootDir)
      const previousDriver = process.env.NETLIFY_DB_DRIVER
      process.env.NETLIFY_DB_URL = database.connectionString
      process.env.NETLIFY_DB_DRIVER = 'server'
      console.info('Local Secret Santa database ready. Development draws are separate from Netlify.')
      nuxt.hook('close', async () => {
        if (process.env.NETLIFY_DB_URL === database.connectionString) {
          delete process.env.NETLIFY_DB_URL
          if (previousDriver === undefined) delete process.env.NETLIFY_DB_DRIVER
          else process.env.NETLIFY_DB_DRIVER = previousDriver
        }
        await database.stop()
      })
    },
  },
  app: {
    head: {
      title: 'The Secret Santa Club',
      meta: [
        { name: 'description', content: 'Your favourite people. One lovely surprise. A private Secret Santa draw for your Christmas crew.' },
        { name: 'referrer', content: 'no-referrer' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
