<script setup lang="ts">
const names = ref(Array.from({ length: 8 }, () => ''))
const title = ref('Our Secret Santa')
const busy = ref(false)
const error = ref('')
const entered = computed(() => names.value.filter(name => name.trim()).length)
const complete = computed(() => entered.value === 8)
const placeholders = ['The organiser (that’s you?)', 'Someone lovely', 'Your favourite troublemaker', 'The gift-wrapping pro', 'The one who has everything', 'The festive enthusiast', 'The last-minute shopper', 'And one more lovely person']

async function createDraw() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const draw = await $fetch('/api/draws', { method: 'POST', body: { title: title.value, names: names.value } })
    await navigateTo({ path: `/organise/${draw.id}`, query: { key: draw.adminKey } })
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'We couldn’t create your draw. Please try again.'
  } finally { busy.value = false }
}
</script>

<template>
  <div class="setup-layout">
    <section class="intro">
      <p class="eyebrow"><span class="tiny-star" aria-hidden="true">✦</span> GOOD GIFTS START WITH A LITTLE SECRET</p>
      <h1>Eight names.<br>One lovely<br><em>surprise.</em></h1>
      <p class="intro-copy">Bring your people together for a little festive mystery. Add eight names, share their personal links, and let the gifting begin.</p>
      <div class="gift-scene" aria-hidden="true">
        <span class="scene-spark spark-one">✧</span><span class="scene-spark spark-two">✦</span><span class="scene-spark spark-three">✧</span>
        <div class="gift gift-back"><span class="gift-bow" /><span class="gift-lid" /><span class="gift-ribbon" /></div>
        <div class="gift gift-front"><span class="gift-bow" /><span class="gift-lid" /><span class="gift-ribbon" /><span class="gift-tag">a little<br>something</span></div>
        <span class="scene-note">a secret worth keeping <span>↗</span></span>
      </div>
      <div class="promise"><span class="promise-icon" aria-hidden="true">♡</span><p>Everyone gives. Everyone receives.<br><strong>No doubles. No picking yourself.</strong></p></div>
    </section>

    <section class="setup-card" aria-labelledby="setup-title">
      <div class="card-topline"><span class="step-label">LET’S MAKE SOME MAGIC</span><span class="count-pill">8 PEOPLE</span></div>
      <h2 id="setup-title">Who’s in the circle?</h2>
      <p class="muted">Add all eight names. We’ll take care of the secrets.</p>
      <form @submit.prevent="createDraw">
        <label class="field-label" for="draw-title">GIVE YOUR DRAW A NAME</label>
        <input id="draw-title" v-model="title" class="title-input" maxlength="80" placeholder="Our Secret Santa" autocomplete="off">
        <div class="names-heading"><span class="field-label">YOUR PEOPLE</span><span class="progress-caption">{{ entered }} of 8 added</span></div>
        <div class="names-grid">
          <div v-for="(_, index) in names" :key="index" class="name-field" :class="{ 'is-filled': names[index]?.trim() }">
            <span class="name-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <label class="sr-only" :for="`name-${index}`">Person {{ index + 1 }}</label>
            <input :id="`name-${index}`" v-model="names[index]" :placeholder="placeholders[index]" required maxlength="40" autocomplete="off">
            <span v-if="names[index]?.trim()" class="field-check" aria-hidden="true">✓</span>
          </div>
        </div>
        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <button class="button primary create-button" type="submit" :disabled="busy || !complete"><span>{{ busy ? 'Making a little magic…' : 'Create our Secret Santa' }}</span><span aria-hidden="true">↗</span></button>
        <p class="privacy-note"><span aria-hidden="true">♧</span> Personal links. Private picks. No accounts needed.</p>
      </form>
      <div class="card-bottom"><span aria-hidden="true">✦</span> A good surprise is only a few names away.</div>
    </section>
    <section class="how-it-works" aria-label="How it works">
      <div><span class="how-number">01</span><p><strong>Gather your people</strong><span>Eight names make the circle complete.</span></p></div>
      <div><span class="how-number">02</span><p><strong>Pass on the secret</strong><span>Send everyone their own private link.</span></p></div>
      <div><span class="how-number">03</span><p><strong>Make someone’s day</strong><span>Reveal a name. Find a thoughtful gift.</span></p></div>
    </section>
  </div>
</template>
