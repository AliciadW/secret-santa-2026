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
        <span class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="29" fill="#008e50"/><circle cx="32" cy="32" r="24" stroke="#fff" stroke-opacity=".65" stroke-dasharray="2 5"/><path d="M18 29h28v22H18z" fill="#ed2142"/><path d="M15 25h34v9H15z" fill="#fa3d56"/><path d="M29 25h7v26h-7z" fill="#ffda46"/><path d="M32 25c-24-2-13-23 0 0 14-24 24-3 0 0Z" stroke="#ffda46" stroke-width="4" stroke-linejoin="round"/><path d="m13 15 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" fill="#fff"/><circle cx="50" cy="18" r="3" fill="#ffda46"/></svg>
        </span>
        <span>the secret<br><strong>santa club<span class="brand-dot">.</span></strong></span>
      </NuxtLink>
      <span class="header-note"><span aria-hidden="true">✦</span> Making spirits bright <span aria-hidden="true">✦</span></span>
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
