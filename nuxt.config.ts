export default defineNuxtConfig({
  compatibilityDate: '2025-11-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'The Secret Santa Club',
      meta: [
        { name: 'description', content: 'Eight names. One lovely surprise. A private Secret Santa draw for your favourite people.' },
        { name: 'referrer', content: 'no-referrer' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
