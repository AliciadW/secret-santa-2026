<script setup lang="ts">
const magicPaused = ref(false)
const christmasCountdown = ref<number | null>(null)
onMounted(() => {
  magicPaused.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const today = new Date()
  const christmas = new Date(today.getFullYear(), 11, 25)
  if (today.getMonth() === 11 && today.getDate() > 25) christmas.setFullYear(christmas.getFullYear() + 1)
  christmasCountdown.value = Math.round((christmas.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000)
})
</script>

<template>
  <div class="christmas-app" :class="{ 'festivities-paused': magicPaused }">
    <ChristmasAtmosphere />
    <div class="site-shell">
    <header class="site-header">
      <NuxtLink to="/" class="wordmark" aria-label="The Secret Santa Club home">
        <span class="brand-icon" aria-hidden="true">✦<span class="brand-hat" /></span>
        <span>the secret<br><strong>santa club<span class="brand-dot">.</span></strong></span>
      </NuxtLink>
      <span class="header-note">A little ho, ho, who?</span>
      <div class="header-controls">
        <span class="season-tag"><span aria-hidden="true">✧</span> {{ christmasCountdown === null ? 'CHRISTMAS IS COMING' : christmasCountdown === 0 ? 'IT’S CHRISTMAS!' : `${christmasCountdown} SLEEPS TO CHRISTMAS` }}</span>
        <button class="magic-toggle" type="button" :aria-pressed="magicPaused" :aria-label="magicPaused ? 'Resume Christmas animations' : 'Pause Christmas animations'" @click="magicPaused = !magicPaused"><span aria-hidden="true">{{ magicPaused ? '▶' : 'Ⅱ' }}</span><span>{{ magicPaused ? 'More magic' : 'Pause the magic' }}</span></button>
      </div>
    </header>
    <main><NuxtPage /></main>
    <footer class="site-footer">
      <span><span aria-hidden="true">✦</span> Made with a little North Pole magic.</span>
      <span>Keep the secret. Spread the cheer. <span aria-hidden="true">♡</span></span>
    </footer>
    </div>
  </div>
</template>
