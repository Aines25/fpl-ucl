<template>
  <div class="relative min-h-dvh bg-navy-950">
    <StageBackdrop />
    <div class="relative flex min-h-dvh flex-col">
      <div class="sticky top-0 z-20">
        <AppHeader />
        <AppNav />
      </div>
      <main class="mx-auto w-full max-w-page flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:pb-12">
        <slot />
      </main>
    </div>
  </div>
</template>
