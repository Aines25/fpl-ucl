<template>
  <svg
    class="absolute inset-0 size-full"
    viewBox="0 0 100 140"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <rect width="100" height="140" class="fill-[#0b2f24]" />
    <rect v-for="n in 8" :key="n" x="0" :y="(n - 1) * 17.5" width="100" height="17.5" :class="n % 2 === 0 ? 'fill-[#0e3a2c]' : 'fill-[#124a38]'" />
    <rect x="4" y="4" width="92" height="132" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.7" />
    <line x1="4" y1="70" x2="96" y2="70" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
    <circle cx="50" cy="70" r="11" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
    <circle cx="50" cy="70" r="0.8" class="fill-white/50" />
    <rect x="22" y="4" width="56" height="22" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
    <rect x="34" y="4" width="32" height="10" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
    <rect x="22" y="114" width="56" height="22" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
    <rect x="34" y="126" width="32" height="10" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
    <path d="M 38 26 A 12 12 0 0 0 62 26" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
    <path d="M 38 114 A 12 12 0 0 1 62 114" fill="none" stroke="currentColor" class="text-white/35" stroke-width="0.6" />
  </svg>
</template>
