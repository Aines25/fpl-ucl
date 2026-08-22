export default cachedEventHandler(
  async () => getBootstrap(),
  {
    maxAge: 60,
    swr: true,
    staleMaxAge: 60 * 60,
    getKey: () => 'fpl:bootstrap',
  },
)
