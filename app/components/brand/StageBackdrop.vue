<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="absolute -top-32 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-cyan/8 blur-3xl" />
    <div class="absolute top-24 -left-24 size-[28rem] rounded-full bg-group-c/10 blur-3xl" />
    <div class="absolute right-0 bottom-0 size-[24rem] rounded-full bg-star/5 blur-3xl" />
    <svg class="absolute inset-0 size-full opacity-[var(--ucl-backdrop-opacity)]" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="currentColor" class="text-cyan" stroke-width="0.4">
        <circle cx="200" cy="80" r="70" />
        <circle cx="200" cy="80" r="48" />
        <circle cx="200" cy="80" r="24" />
      </g>
    </svg>
  </div>
</template>
