<template>
  <div class="relative min-h-dvh bg-navy-950">
    <StageBackdrop />
    <div class="relative flex min-h-dvh flex-col">
      <AppHeader />
      <AppNav />
      <main class="mx-auto w-full max-w-page flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-12">
        <slot />
      </main>
    </div>
  </div>
</template>
