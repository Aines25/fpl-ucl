export default cachedEventHandler(
  async () => getBootstrap(),
  {
    maxAge: 60,
    swr: true,
    getKey: () => 'fpl:bootstrap',
  },
)
