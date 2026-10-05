// jsdom não implementa window.matchMedia, e o Taiga UI chama essa API ao
// iniciar (tema/preferências do sistema). Stub mínimo: nenhuma media query casa.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
