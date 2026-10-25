<script setup lang="ts">
const route = useRoute()
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const headers = computed(() => ({ authorization: `Bearer ${token.value}` }))
const { data: invitation, error, status, refresh } = await useFetch('/api/picker', { headers, server: false })
const recipient = ref('')
const busy = ref(false)
const revealError = ref('')
// A different URL is a different invitation; never show the previous result.
watch(token, () => { recipient.value = ''; revealError.value = '' })

async function reveal() {
  if (busy.value) return
  busy.value = true
  revealError.value = ''
  const requestToken = token.value
  try {
    const result = await $fetch('/api/picker/reveal', { method: 'POST', headers: { authorization: `Bearer ${requestToken}` } })
    if (token.value === requestToken) recipient.value = result.recipient
  } catch (cause: any) {
    revealError.value = cause?.data?.statusMessage || 'We couldn’t open your surprise. Please try again.'
  } finally { busy.value = false }
}
</script>

<template>
  <div class="pick-page">
    <div v-if="status === 'pending' || status === 'idle'" class="state-card" role="status">Finding your little surprise…</div>
    <section v-else-if="error" class="state-card"><span class="large-star">✧</span><h1>A secret needs<br>its own key.</h1><p>{{ error.data?.statusMessage || 'We couldn’t load your invitation. Please try again.' }}</p><button class="button secondary" @click="refresh()">Try again</button></section>
    <section v-else-if="invitation" class="reveal-card" :class="{ revealed: recipient }">
      <p class="eyebrow">{{ invitation.title }} <span aria-hidden="true">✦</span></p>
      <template v-if="!recipient">
        <h1>A little secret<br>for <em>{{ invitation.name }}.</em></h1>
        <p class="reveal-intro">Someone in your circle is about to get very lucky.</p>
        <div class="single-gift" aria-hidden="true"><div class="gift gift-front"><span class="gift-bow" /><span class="gift-lid" /><span class="gift-ribbon" /><span class="gift-tag">just<br>for you</span></div><span class="scene-spark">✧</span></div>
        <p class="muted">{{ invitation.opened ? 'Your name is safely saved. Open it again whenever you need a reminder.' : 'Ready to find out who you’re gifting? Your name is waiting inside.' }}</p>
        <button class="button primary" :disabled="busy" @click="reveal">{{ busy ? 'Opening your surprise…' : invitation.opened ? 'See my name again' : 'Reveal my Secret Santa name' }} <span aria-hidden="true">✧</span></button>
        <p class="privacy-note">This invitation belongs to {{ invitation.name }}. Keep your link private.</p>
      </template>
      <template v-else>
        <div class="reveal-stars" aria-hidden="true">✧ &nbsp; ✦ &nbsp; ✧</div>
        <p class="eyebrow">{{ invitation.name }}, YOU’RE GIFTING TO</p>
        <h1 class="recipient-name" aria-live="polite">{{ recipient }}</h1>
        <p class="reveal-intro">A thoughtful gift. A happy little surprise.<br>Now the fun part is yours.</p>
        <div class="recipient-note"><span aria-hidden="true">♡</span><p>Keep it between us.<br><strong>You’re their Secret Santa.</strong></p></div>
        <p class="muted">Your pick is saved. Come back to this personal link any time for a reminder.</p>
        <button class="button secondary" @click="recipient = ''">Hide my name</button>
      </template>
      <p v-if="revealError" class="error-message" role="alert">{{ revealError }}</p>
    </section>
  </div>
</template>
