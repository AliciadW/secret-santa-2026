<script setup lang="ts">
const route = useRoute()
const requestURL = useRequestURL()
const key = computed(() => typeof route.query.key === 'string' ? route.query.key : '')
const headers = computed(() => ({ authorization: `Bearer ${key.value}` }))
const { data: draw, error, refresh, status } = await useFetch(`/api/draws/${route.params.id}`, { headers, server: false })
const copied = ref('')
const copyError = ref('')
const opened = computed(() => draw.value?.participants.filter(person => person.opened).length || 0)
const organiserLink = computed(() => `${requestURL.origin}${route.fullPath}`)

function invitation(name: string, token: string) {
  return `${requestURL.origin}/pick?${new URLSearchParams({ name, token })}`
}
async function copy(value: string, id: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = id
    copyError.value = ''
    setTimeout(() => { if (copied.value === id) copied.value = '' }, 2500)
  } catch { copyError.value = 'Couldn’t copy automatically. Select and copy the link below.' }
}
</script>

<template>
  <div class="organiser-page">
    <NuxtLink to="/" class="back-link">← Create another draw</NuxtLink>
    <div v-if="status === 'pending' || status === 'idle'" class="state-card" role="status">Gathering your circle…</div>
    <div v-else-if="error" class="state-card"><span class="large-star">✧</span><h1>Let’s find your circle.</h1><p>{{ error.data?.statusMessage || 'We couldn’t load this draw. Try again.' }}</p><button class="button secondary" @click="refresh()">Try again</button></div>
    <template v-else-if="draw">
      <div class="organiser-heading"><div><p class="eyebrow">THE CIRCLE IS COMPLETE <span aria-hidden="true">✦</span></p><h1>{{ draw.title }}</h1><p class="muted">Eight personal invitations. Eight little surprises waiting to happen.</p></div><span class="status-badge">{{ opened }} / 8 revealed</span></div>
      <div class="organiser-grid">
        <section class="invitations-card" aria-labelledby="invitations-title">
          <div class="list-heading"><h2 id="invitations-title">Pass on the secret</h2><button class="text-button" @click="refresh()">Refresh status ↻</button></div>
          <p class="muted">Send each person only the link next to their name.</p>
          <ol class="invitation-list">
            <li v-for="(person, index) in draw.participants" :key="person.token">
              <span class="person-avatar" aria-hidden="true">{{ person.name.charAt(0).toLocaleUpperCase() }}</span>
              <div class="person-info"><strong>{{ person.name }}</strong><span :class="{ 'has-opened': person.opened }">{{ person.opened ? 'Surprise revealed ✓' : 'A secret is waiting' }}</span></div>
              <button class="copy-button" @click="copy(invitation(person.name, person.token), person.token)">{{ copied === person.token ? 'Copied ✓' : 'Copy link ↗' }}<span class="sr-only"> for {{ person.name }}</span></button>
              <details class="manual-link"><summary>View {{ person.name }}’s invitation link</summary><input :aria-label="`Invitation link for ${person.name}`" :value="invitation(person.name, person.token)" readonly @focus="($event.target as HTMLInputElement).select()"></details>
            </li>
          </ol>
        </section>
        <aside class="organiser-aside">
          <div class="save-card"><span class="large-star" aria-hidden="true">✧</span><p class="eyebrow">FOR YOUR EYES ONLY</p><h2>Keep the key<br>to your circle.</h2><p>This organiser link lets you return to these invitations and see who has revealed their name. Save it somewhere safe.</p><button class="button secondary" @click="copy(organiserLink, 'organiser')">{{ copied === 'organiser' ? 'Organiser link copied ✓' : 'Copy organiser link ↗' }}</button><details class="manual-link"><summary>View organiser link</summary><input aria-label="Organiser link" :value="organiserLink" readonly @focus="($event.target as HTMLInputElement).select()"></details></div>
          <div class="quiet-note"><span aria-hidden="true">♡</span><p><strong>The best secrets stay secret.</strong>Each link reveals one person’s recipient. Keep the organiser link to yourself and ask everyone to keep their personal link private.</p></div>
        </aside>
      </div>
      <p v-if="copyError" class="error-message" role="alert">{{ copyError }}</p>
      <p class="sr-only" role="status" aria-live="polite">{{ copied ? 'Link copied to clipboard' : '' }}</p>
    </template>
  </div>
</template>
