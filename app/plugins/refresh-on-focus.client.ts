export default defineNuxtPlugin(() => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible')
      refreshNuxtData()
  })
})
