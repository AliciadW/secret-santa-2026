<script setup lang="ts">
let nextId = 3
const people = ref(Array.from({ length: 3 }, (_, id) => ({ id, name: '', email: '' })))
const names = computed(() => people.value.map(person => person.name))
function addPerson() { people.value.push({ id: nextId++, name: '', email: '' }) }
function removePerson(index: number) { if (people.value.length > 3) people.value.splice(index, 1) }
const title = ref('Our Secret Santa')
const busy = ref(false)
const error = ref('')
const entered = computed(() => names.value.filter(name => name.trim()).length)
const complete = computed(() => entered.value === people.value.length && people.value.length >= 3)
const placeholders = ['The organiser (that’s you?)', 'Someone lovely', 'Your favourite troublemaker', 'The gift-wrapping pro', 'The one who has everything', 'The festive enthusiast', 'The last-minute shopper', 'And one more lovely person']

async function createDraw() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const draw = await $fetch('/api/draws', { method: 'POST', body: { title: title.value, names: names.value, emails: people.value.map(person => person.email) } })
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
      <p class="intro-copy">Your favourite people. Thoughtful gifts. One gloriously Christmassy secret. Gather your favourite people and let the merry mischief begin.</p>
      <div class="workshop-illustration">
        <NorthPoleScene />
        <span class="elf-seal" aria-hidden="true"><span>100%</span>ELF<br>APPROVED<span>✦ ✦ ✦</span></span>
      </div>
      <div class="promise"><span class="promise-icon" aria-hidden="true">♡</span><p>Everyone gives. Everyone receives.<br><strong>No doubles. No picking yourself. Pure Christmas joy.</strong></p></div>
    </section>

    <section class="setup-card" aria-labelledby="setup-title">
      <div class="card-ribbon" aria-hidden="true" />
      <div class="card-topline"><span class="step-label">SANTA’S VERY GOOD LIST</span><span class="count-pill">✦ {{ people.length }} PEOPLE</span></div>
      <h2 id="setup-title">Who’s in the circle?</h2>
      <p class="muted">Round up the Christmas crew. We’ll handle the ho, ho, who.</p>
      <div class="nice-list-progress" aria-hidden="true"><span v-for="n in people.length" :key="n" :class="{ lit: names[n - 1]?.trim() }" :style="{ '--ornament-index': n }">{{ names[n - 1]?.trim() ? '✦' : '·' }}</span></div>
      <form @submit.prevent="createDraw">
        <label class="field-label" for="draw-title">GIVE YOUR DRAW A NAME</label>
        <input id="draw-title" v-model="title" class="title-input" maxlength="80" placeholder="Our Secret Santa" autocomplete="off">
        <div class="names-heading"><span class="field-label">THE NICE LIST</span><span class="progress-caption" role="status" aria-live="polite">{{ complete ? 'The whole merry gang! ✦' : `${entered} of ${people.length} names added` }}</span></div>
        <div class="names-grid">
          <div v-for="(person, index) in people" :key="person.id" class="participant-fields">
            <div class="name-field" :class="{ 'is-filled': person.name.trim() }">
            <span class="name-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <label class="sr-only" :for="`name-${index}`">Person {{ index + 1 }}</label>
            <input :id="`name-${index}`" v-model="person.name" :placeholder="placeholders[index] || 'Someone lovely'" required maxlength="40" autocomplete="off">
            <span v-if="person.name.trim()" class="field-check" aria-hidden="true">✦</span>
            </div>
            <label class="email-label" :for="`email-${person.id}`">Email address (optional)</label>
            <input :id="`email-${person.id}`" v-model="person.email" class="email-input" type="email" maxlength="254" placeholder="name@example.com" autocomplete="off">
            <button type="button" class="text-button remove-person" :disabled="people.length <= 3 || busy" :aria-label="`Remove ${person.name || 'person ' + (index + 1)}`" @click="removePerson(index)">Remove</button>
          </div>
        </div>
        <button type="button" class="text-button" :disabled="busy" @click="addPerson">+ Add person</button>
        <p class="muted email-help">At least three people. Add an email to send their private invitation automatically, or leave it blank to share their link yourself.</p>
        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <button class="button primary create-button" :class="{ 'ready-to-create': complete }" type="submit" :disabled="busy || !complete"><span>{{ busy ? 'The elves are on it…' : 'Create our Secret Santa' }}</span><span aria-hidden="true">✧</span></button>
        <p class="privacy-note"><span aria-hidden="true">♧</span> Personal links. Private picks. Santa-level secrecy.</p>
      </form>
      <div class="card-bottom"><span aria-hidden="true">✦</span> Checked twice. Sprinkled with Christmas magic.</div>
    </section>
    <section class="how-it-works" aria-label="How it works">
      <div><span class="how-number" aria-hidden="true">✎</span><p><span class="step-tiny">01 · MAKE A LIST</span><strong>Gather the merry gang</strong><span>Three or more people. A whole lot of Christmas spirit.</span></p></div>
      <div><span class="how-number" aria-hidden="true">✉</span><p><span class="step-tiny">02 · KEEP A SECRET</span><strong>Deliver a little mystery</strong><span>Email invitations or share personal links.</span></p></div>
      <div><span class="how-number" aria-hidden="true">✧</span><p><span class="step-tiny">03 · SPREAD SOME JOY</span><strong>Make their Christmas</strong><span>Unwrap a name. Dream up the perfect gift.</span></p></div>
    </section>
    <div class="christmas-ticker" aria-hidden="true"><div><span v-for="n in 2" :key="n">HO HO WHO? <i>✦</i> MERRY EVERYTHING <i>✦</i> A LITTLE MYSTERY, A LOT OF JOY <i>✦</i> KEEP THE SECRET, SPREAD THE CHEER <i>✦</i> </span></div></div>
  </div>
</template>
