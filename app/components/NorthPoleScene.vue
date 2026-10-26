<script setup lang="ts">
const glow = useId()
const trees = [{ x: 35, y: 213, scale: .65 }, { x: 95, y: 190, scale: .85 }, { x: 540, y: 202, scale: .75 }, { x: 590, y: 225, scale: .5 }]
</script>

<template>
  <div class="north-pole-scene" aria-hidden="true">
    <svg viewBox="0 0 640 360" fill="none">
      <defs>
        <radialGradient :id="glow"><stop stop-color="#ffe17b" stop-opacity=".35" /><stop offset="1" stop-color="#ffe17b" stop-opacity="0" /></radialGradient>
      </defs>
      <circle cx="310" cy="196" r="167" :fill="`url(#${glow})`" />
      <g class="scene-moon"><path d="M514 39a29 29 0 1 0 29 38 29 29 0 0 1-29-38Z" fill="#ffcf37" /><circle cx="498" cy="65" r="2" fill="#d6b974" opacity=".6" /></g>
      <g fill="#ffbf19" class="scene-stars"><path d="m121 55 3 8 8 3-8 3-3 8-3-8-8-3 8-3Zm283-27 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM564 123l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" /><circle cx="217" cy="51" r="2" /><circle cx="441" cy="103" r="2" /><circle cx="77" cy="139" r="1.5" /><circle cx="347" cy="31" r="1.5" /><circle cx="601" cy="73" r="1.5" /></g>
      <g class="santa-sleigh" stroke="#e51e3e" stroke-linecap="round" stroke-linejoin="round">
        <path d="M194 95c23-6 32-8 51-6m13-4 17-4m-13 1-4-9m6 9 2-9m7 8 4 8m-8-9 5-8m-5 0-3-6m3 6 5-4" stroke-width="2" />
        <path d="m175 91 7 10h23l7-9m-36 16h35q7 0 9-6" stroke-width="3" /><path d="M184 92v-8h12l5 9" fill="#e51e3e" stroke="#e51e3e" stroke-width="3" /><circle cx="192" cy="79" r="5" fill="#f3d9b1" stroke="none" /><path d="m187 75 6-10 5 11Z" fill="#ef2342" stroke="none" />
      </g>
      <path d="M2 303c97-45 168-19 250-17 117 2 219-53 386-2v48H2Z" fill="#80d6aa" />
      <path d="M12 313c116-26 183-7 270-8 114-1 215-29 346-6v24c-112-10-207 15-320 16-128 1-220-20-296-4Z" fill="#ffffff" />
      <g v-for="(tree, i) in trees" :key="i" :transform="`translate(${tree.x} ${tree.y}) scale(${tree.scale})`">
        <path d="M-5 67h10v35H-5Z" fill="#9b7850" /><path d="m0-49 33 52H20l30 43H30l34 46H-64l34-46h-20l30-43h-13Z" fill="#009956" /><path d="m0-49 16 26-15-3-12 6Zm-24 51 22-5 24 5 7 11-31-4-30 4Zm-16 45 38-6 40 6 9 12-49-6-47 6Z" fill="#ffffff" />
      </g>
      <g class="workshop-cabin">
        <path d="M249 185h184v113H249Z" fill="#ee3b50" /><path d="M256 203h170m-170 20h170m-170 20h170m-170 20h170m-170 20h170" stroke="#d51c38" stroke-width="3" opacity=".7" />
        <path d="M380 115h23v54h-23Z" fill="#e52c3e" /><path d="M376 113h31v10h-31Z" fill="#ffffff" />
        <g class="chimney-smoke" stroke="#d5dbca" stroke-width="8" stroke-linecap="round" opacity=".4"><path d="M390 97c-17-15 10-20-3-34" /><path d="M402 82c-14-12 8-17-3-30" /></g>
        <path d="m226 186 115-85 115 85Z" fill="#007c43" /><path d="m226 186 115-85 115 85-27-5-88-62-88 62Z" fill="#ffffff" /><path d="M235 187h210" stroke="#ffffff" stroke-width="11" stroke-linecap="round" />
        <path d="m264 179 77-57 77 57" stroke="#d6b575" stroke-width="2" stroke-dasharray="1 15" stroke-linecap="round" />
        <rect x="270" y="216" width="39" height="41" rx="3" fill="#ffdb3b" class="cabin-window" /><path d="M289 216v41m-19-21h39" stroke="#cf243c" stroke-width="4" /><rect x="379" y="216" width="35" height="41" rx="3" fill="#ffdb3b" class="cabin-window" /><path d="M396 216v41m-17-21h35" stroke="#cf243c" stroke-width="4" />
        <path d="M323 235a19 19 0 0 1 38 0v64h-38Z" fill="#008a4b" /><path d="M318 299h49" stroke="#ffffff" stroke-width="7" stroke-linecap="round" /><circle cx="352" cy="268" r="2" fill="#eac780" />
        <circle cx="342" cy="244" r="10" stroke="#00ad5d" stroke-width="7" /><path d="m337 251 5-4 5 4-2 6-3-5-4 5Z" fill="#f32949" />
        <rect x="298" y="190" width="88" height="16" rx="2" fill="#ffffff" /><text x="342" y="201" fill="#704f37" font-family="Georgia,serif" font-size="7" letter-spacing="1.6" text-anchor="middle">SANTA’S WORKSHOP</text>
      </g>
      <g class="main-christmas-tree">
        <path d="M164 258h13v52h-13Z" fill="#997249" /><path d="m171 107 33 55h-14l32 48h-20l40 63H99l40-63h-20l32-48h-14Z" fill="#009553" /><path d="m171 107 15 26-16-5-13 6Zm-27 55 25-4 27 4 8 13-34-5-34 6Zm-29 57 53-9 56 9 9 14-62-11-65 12Z" fill="#ffffff" />
        <path d="M150 164q25 18 47 10m-60 29q39 23 72 7m-88 36q52 22 106 9" stroke="#dfb45f" stroke-width="2" />
        <g class="tree-light-group"><circle cx="154" cy="169" r="4" fill="#ffdf40" /><circle cx="191" cy="172" r="4" fill="#ff3d55" /><circle cx="141" cy="204" r="4" fill="#ff3d55" /><circle cx="172" cy="211" r="4" fill="#ffdf40" /><circle cx="207" cy="215" r="4" fill="#ff3d55" /><circle cx="128" cy="249" r="4" fill="#ffdf40" /><circle cx="158" cy="254" r="4" fill="#ff3d55" /><circle cx="193" cy="258" r="4" fill="#ffdf40" /><circle cx="223" cy="256" r="4" fill="#ff3d55" /></g>
        <path class="tree-top-star" d="m171 83 5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z" fill="#ffce27" />
      </g>
      <g><rect x="119" y="291" width="36" height="25" rx="2" fill="#ef2342" /><path d="M134 291v25m-15-16h36" stroke="#ffda3b" stroke-width="5" /><path d="M135 291c-23-12-17-24-6-12l6 12c20-14 25-25 13-20Z" stroke="#ffda3b" stroke-width="3" /><rect x="181" y="285" width="29" height="27" rx="2" fill="#ffcd2f" /><path d="M194 285v27m-13-17h29" stroke="#f3e6c1" stroke-width="5" /><rect x="207" y="299" width="25" height="18" rx="2" fill="#e3294a" /><path d="M218 299v18" stroke="#e4bb78" stroke-width="4" /></g>
      <g><path d="M474 229v83" stroke="#d8b67b" stroke-width="4" /><rect x="436" y="230" width="79" height="22" rx="3" fill="#ffffff" transform="rotate(-5 436 230)" /><text x="476" y="242" transform="rotate(-5 476 242)" text-anchor="middle" font-family="Georgia,serif" font-size="8" fill="#5e5238" letter-spacing="1">NORTH POLE →</text><path d="m455 220 18-12 18 12" stroke="#f4ead6" stroke-width="5" stroke-linecap="round" /></g>
      <path d="M14 328c100-13 154 9 245 7 137-4 244-23 368-12" stroke="#88c9d3" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round" />
    </svg>
    <p class="scene-caption"><span>78° N, 15° E</span> A little further north. A little more magic. <span>✧</span></p>
  </div>
</template>
