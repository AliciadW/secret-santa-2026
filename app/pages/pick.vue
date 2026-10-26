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
    <div v-if="status === 'pending' || status === 'idle'" class="state-card loading-card" role="status"><span class="loading-snowflake" aria-hidden="true">❄</span> A little Christmas magic is on its way…</div>
    <section v-else-if="error" class="state-card"><span class="large-star">✧</span><h1>A secret needs<br>its own key.</h1><p>{{ error.data?.statusMessage || 'We couldn’t load your invitation. Please try again.' }}</p><button class="button secondary" @click="refresh()">Try again</button></section>
    <section v-else-if="invitation" class="reveal-card" :class="{ revealed: recipient, unwrapping: busy }">
      <div class="card-ribbon" aria-hidden="true" />
      <p class="eyebrow">{{ invitation.title }} <span aria-hidden="true">✦</span></p>
      <div v-if="!recipient" class="present-state">
        <h1>Ho, ho,<br><em>{{ invitation.name }}!</em></h1>
        <p class="reveal-intro">There’s a little Christmas secret with your name on it.</p>
        <ChristmasPresent />
        <p class="muted">{{ invitation.opened ? 'Still the same lovely name. Unwrap it again for a little reminder.' : 'Someone’s Christmas is in your hands. Ready to find out whose?' }}</p>
        <button class="button primary" :disabled="busy" @click="reveal">{{ busy ? 'Opening your surprise…' : invitation.opened ? 'See my name again' : 'Reveal my Secret Santa name' }} <span aria-hidden="true">✧</span></button>
        <p class="privacy-note">This invitation belongs to {{ invitation.name }}. Keep your link private.</p>
      </div>
      <div v-else class="recipient-state">
        <div class="confetti-burst" aria-hidden="true"><span v-for="n in 32" :key="n" :style="{ '--confetti-x': `${(n * 47 % 100) - 50}vw`, '--confetti-y': `${-90 - n * 29 % 300}px`, '--confetti-spin': `${n * 73}deg`, '--confetti-delay': `${n % 6 * .04}s` }" /></div>
        <div class="reveal-stars" aria-hidden="true"><span>✧</span><span>✦</span><span>✧</span></div>
        <p class="eyebrow">{{ invitation.name }}, YOU’RE GIFTING TO</p>
        <h1 class="recipient-name" aria-live="polite">{{ recipient }}</h1>
        <p class="reveal-intro">Cue the sleigh bells.<br>You’re about to make their Christmas.</p>
        <div class="recipient-note"><span aria-hidden="true">♡</span><p>Mum’s the word. Even to the reindeer.<br><strong>You’re their Secret Santa.</strong></p></div>
        <p class="muted">Your pick is saved. Come back to this personal link any time for a reminder.</p>
        <button class="button secondary" @click="recipient = ''">Hide my name</button>
        <p class="reveal-signoff">With love from the North Pole <span aria-hidden="true">✦</span></p>
      </div>
      <p v-if="revealError" class="error-message" role="alert">{{ revealError }}</p>
    </section>
  </div>
</template>
