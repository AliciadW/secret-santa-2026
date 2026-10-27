<script setup lang="ts">
import { DEFAULT_PARTICIPANT_COUNT, MIN_PARTICIPANTS, MAX_PARTICIPANTS } from '#shared/utils/participants'

const participantCount = ref(DEFAULT_PARTICIPANT_COUNT)
const groupSizes = Array.from({ length: MAX_PARTICIPANTS - MIN_PARTICIPANTS + 1 }, (_, i) => i + MIN_PARTICIPANTS)
// Keep hidden names so reducing and then increasing the count never loses input.
const names = ref(Array.from({ length: DEFAULT_PARTICIPANT_COUNT }, () => ''))
const visibleNames = computed(() => Array.from({ length: participantCount.value }, (_, i) => names.value[i] || ''))
const title = ref('Our Secret Santa')
const busy = ref(false)
const error = ref('')
const entered = computed(() => visibleNames.value.filter(name => name.trim()).length)
const complete = computed(() => entered.value === participantCount.value)
const placeholders = ['The organiser (that’s you?)', 'Someone lovely', 'Your favourite troublemaker', 'The gift-wrapping pro', 'The one who has everything', 'The festive enthusiast', 'The last-minute shopper', 'And one more lovely person']

async function createDraw() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const draw = await $fetch('/api/draws', { method: 'POST', body: { title: title.value, names: visibleNames.value } })
    await navigateTo({ path: `/organise/${draw.id}`, query: { key: draw.adminKey } })
  } catch (cause: any) {
    error.value = cause?.data?.statusMessage || 'We couldn’t create your draw. Please try again.'
  } finally { busy.value = false }
}
</script>

<template>
  <div class="setup-layout">
    <section class="intro">
      <p class="eyebrow hero-eyebrow"><span aria-hidden="true">✦</span> A SPECIAL DELIVERY FROM THE NORTH POLE</p>
      <h1>Oh, what<br><em>fun it is</em><br>to give<span class="heading-star" aria-hidden="true">✷</span></h1>
      <p class="intro-copy">Your favourite people. Thoughtful gifts. One gloriously Christmassy secret. Gather your Christmas crew and let the merry mischief begin.</p>
      <div class="workshop-illustration">
        <NorthPoleScene />
        <span class="elf-seal" aria-hidden="true"><span>100%</span>ELF<br>APPROVED<span>✦ ✦ ✦</span></span>
      </div>
      <div class="promise"><span class="promise-icon" aria-hidden="true">♡</span><p>Everyone gives. Everyone receives.<br><strong>No doubles. No picking yourself. Pure Christmas joy.</strong></p></div>
    </section>

    <section class="setup-card" aria-labelledby="setup-title">
      <div class="card-ribbon" aria-hidden="true" />
      <div class="card-topline"><span class="step-label">SANTA’S VERY GOOD LIST</span><span class="count-pill">✦ {{ participantCount }} PEOPLE</span></div>
      <h2 id="setup-title">Who’s in the circle?</h2>
      <p class="muted">Round up the Christmas crew. We’ll handle the ho, ho, who.</p>
      <form @submit.prevent="createDraw">
        <label class="field-label" for="draw-title">GIVE YOUR DRAW A NAME</label>
        <input id="draw-title" v-model="title" class="title-input" maxlength="80" placeholder="Our Secret Santa" autocomplete="off">
        <div class="participant-settings">
          <label class="field-label" for="participant-count">HOW MANY IN YOUR CHRISTMAS CREW?</label>
          <div class="participant-count-control">
            <button type="button" aria-label="Remove one participant" :disabled="busy || participantCount <= MIN_PARTICIPANTS" @click="participantCount--">−</button>
            <select id="participant-count" v-model.number="participantCount" :disabled="busy"><option v-for="size in groupSizes" :key="size" :value="size">{{ size }} people</option></select>
            <button type="button" aria-label="Add one participant" :disabled="busy || participantCount >= MAX_PARTICIPANTS" @click="participantCount++">+</button>
          </div>
          <p class="participant-count-help">{{ MIN_PARTICIPANTS }}–{{ MAX_PARTICIPANTS }} people. Everyone gets one lovely surprise.</p>
        </div>
        <div class="nice-list-progress" aria-hidden="true"><span v-for="n in participantCount" :key="n" :class="{ lit: names[n - 1]?.trim() }" :style="{ '--ornament-index': n }">{{ names[n - 1]?.trim() ? '✦' : '·' }}</span></div>
        <div class="names-heading"><span class="field-label">THE NICE LIST</span><span class="progress-caption" role="status" aria-live="polite">{{ complete ? 'The whole merry gang! ✦' : `${entered} of ${participantCount} names added` }}</span></div>
        <div class="names-grid">
          <div v-for="(_, index) in visibleNames" :key="index" class="name-field" :class="{ 'is-filled': names[index]?.trim() }">
            <span class="name-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <label class="sr-only" :for="`name-${index}`">Person {{ index + 1 }}</label>
            <input :id="`name-${index}`" v-model="names[index]" :placeholder="placeholders[index] || `Lovely person ${index + 1}`" required maxlength="40" autocomplete="off" :disabled="busy">
            <span v-if="names[index]?.trim()" class="field-check" aria-hidden="true">✦</span>
          </div>
        </div>
        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <button class="button primary create-button" :class="{ 'ready-to-create': complete }" type="submit" :disabled="busy || !complete"><span>{{ busy ? 'The elves are on it…' : 'Create our Secret Santa' }}</span><span aria-hidden="true">✧</span></button>
        <p class="privacy-note"><span aria-hidden="true">♧</span> Personal links. Private picks. Santa-level secrecy.</p>
      </form>
      <div class="card-bottom"><span aria-hidden="true">✦</span> Checked twice. Sprinkled with Christmas magic.</div>
    </section>
    <section class="how-it-works" aria-label="How it works">
      <div><span class="how-number" aria-hidden="true">✎</span><p><span class="step-tiny">01 · MAKE A LIST</span><strong>Gather the merry gang</strong><span>Your favourite people. A whole lot of Christmas spirit.</span></p></div>
      <div><span class="how-number" aria-hidden="true">✉</span><p><span class="step-tiny">02 · KEEP A SECRET</span><strong>Deliver a little mystery</strong><span>Send everyone their own personal invitation.</span></p></div>
      <div><span class="how-number" aria-hidden="true">✧</span><p><span class="step-tiny">03 · SPREAD SOME JOY</span><strong>Make their Christmas</strong><span>Unwrap a name. Dream up the perfect gift.</span></p></div>
    </section>
    <div class="christmas-ticker" aria-hidden="true"><div><span v-for="n in 2" :key="n">HO HO WHO? <i>✦</i> MERRY EVERYTHING <i>✦</i> A LITTLE MYSTERY, A LOT OF JOY <i>✦</i> KEEP THE SECRET, SPREAD THE CHEER <i>✦</i> </span></div></div>
  </div>
</template>
