<script setup lang="ts">
// Deterministic positions keep server and client markup identical.
const snowflakes = Array.from({ length: 42 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  size: `${2 + i % 5}px`,
  duration: `${11 + i % 13}s`,
  delay: `${-((i * 7) % 27)}s`,
  drift: `${(i % 2 ? 1 : -1) * (25 + i % 60)}px`,
}))
const bulbs = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i + 0.5) / 24 * 100}%`,
  top: `${17 + Math.sin((i + 0.5) / 24 * Math.PI * 6) * 8}px`,
  delay: `${-(i % 5) * 0.7}s`,
}))
</script>

<template>
  <div class="christmas-atmosphere" aria-hidden="true">
    <div class="fairy-lights">
      <svg viewBox="0 0 1200 50" preserveAspectRatio="none"><path d="M-20 8 Q90 44 200 8 Q300 44 400 8 Q500 44 600 8 Q700 44 800 8 Q900 44 1000 8 Q1110 44 1220 8" /></svg>
      <span v-for="(bulb, i) in bulbs" :key="i" class="fairy-bulb" :class="`bulb-${i % 4}`" :style="{ left: bulb.left, top: bulb.top, animationDelay: bulb.delay }" />
    </div>
    <div class="snow-layer">
      <span v-for="(snow, i) in snowflakes" :key="i" class="snowflake" :style="{ left: snow.left, width: snow.size, height: snow.size, '--fall-duration': snow.duration, '--fall-delay': snow.delay, '--drift': snow.drift }" />
    </div>
    <div class="hanging-bauble bauble-left"><span /></div>
    <div class="hanging-bauble bauble-right"><span /></div>
  </div>
</template>
