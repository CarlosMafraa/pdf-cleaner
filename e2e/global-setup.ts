// Roda uma vez antes de toda a suíte. As fixtures de PDF não são versionadas
// no git (são geradas, não arquivos "de verdade"), então sem isso os testes
// falhariam de cara em qualquer clone novo do repositório ou no CI.
//
// Import dinâmico de propósito: o Playwright transpila este arquivo pra
// CommonJS, e um `require()` direto de um .mjs (que usa `import.meta`)
// quebra — `import()` dinâmico interopera com ESM corretamente mesmo
// a partir de um módulo CJS.
export default async function globalSetup() {
  const { writeFixtures } = await import('./fixtures/create-test-pdf.mjs');
  await writeFixtures();
}
