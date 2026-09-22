import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const FIXTURE_PDF = path.join(__dirname, 'fixtures', 'test.pdf');
const A4_FIXTURE_PDF = path.join(__dirname, 'fixtures', 'a4-test.pdf');
const LANDSCAPE_FIXTURE_PDF = path.join(__dirname, 'fixtures', 'landscape-test.pdf');
const SCREENSHOT_DIR = path.join(__dirname, '..', 'e2e-screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.describe('PDF Cleaner - fluxo completo', () => {
  test('landing page carrega sem "Pro" no nome', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('PDF Cleaner');
    await expect(page.locator('h1')).toContainText('Limpeza Profissional');

    const brandLabel = page.getByText('PDF CLEANER', { exact: true });
    await expect(brandLabel).toBeVisible();

    // Garante que "Pro"/"PRO" não aparece em lugar nenhum da página
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/\bpro\b/i);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing.png'), fullPage: true });
  });

  test('upload de PDF abre o editor e renderiza a página', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PDF);

    // Header do editor com o nome do arquivo
    await expect(page.getByText('test.pdf')).toBeVisible();
    await expect(page.getByText('Atelier de Edição')).toBeVisible();

    // Canvas original deve renderizar com dimensões reais
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await expect
      .poll(async () => canvas.evaluate((el: HTMLCanvasElement) => el.width))
      .toBeGreaterThan(0);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-editor-loaded.png'), fullPage: true });
  });

  test('processa o PDF, mostra comparação e exporta o arquivo limpo', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    // "Manual" já é a aba padrão ao abrir o editor
    const topMarginInput = page.locator('input[type="number"]').first();
    await topMarginInput.fill('30');
    await topMarginInput.blur();

    // Dispara o processamento ("Visualizar")
    await page.getByRole('button', { name: /visualizar/i }).click();

    // Aguarda a comparação aparecer
    await expect(page.getByText('Resultado Final')).toBeVisible({ timeout: 15_000 });

    // Para um PDF simples gerado com pdf-lib, não deve cair no fallback de rasterização
    await expect(page.getByText(/convertido em imagem/i)).toHaveCount(0);

    const canvases = page.locator('canvas');
    await expect(canvases).toHaveCount(2);

    // Verifica que o canvas processado realmente renderizou a página (mesmas dimensões
    // do canvas original) e não ficou com o tamanho padrão de um <canvas> vazio (300x150).
    const originalSize = await canvases.nth(0).evaluate((el: HTMLCanvasElement) => ({ w: el.width, h: el.height }));
    await expect
      .poll(async () => canvases.nth(1).evaluate((el: HTMLCanvasElement) => el.width))
      .toBe(originalSize.w);
    await expect(canvases.nth(1)).toHaveJSProperty('height', originalSize.h);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-comparison.png'), fullPage: true });

    // Exporta e valida o download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /exportar arquivo/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe('test_limpo.pdf');
    const downloadPath = path.join(SCREENSHOT_DIR, download.suggestedFilename());
    await download.saveAs(downloadPath);

    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('remover margens via drag handle atualiza a régua', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    const rightHandle = page.locator('.ruler-handle.cursor-ew-resize').nth(1);
    const box = await rightHandle.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 40, box.y + box.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    const rightMarginInput = page.locator('input[type="number"]').nth(3);
    await expect
      .poll(async () => Number(await rightMarginInput.inputValue()))
      .toBeGreaterThan(25);
  });

  test('não existem presets prontos do sistema; salvar cria um Favorito próprio', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    // Sem favoritos ainda: a seção "Meus Favoritos" não deve existir, e não há
    // mais nenhum preset pronto do sistema em lugar nenhum da sidebar.
    await expect(page.getByText('Meus Favoritos')).toHaveCount(0);
    await expect(page.getByText('Modelos')).toHaveCount(0);
    await expect(page.getByText(/assinatura digital/i)).toHaveCount(0);

    const topMarginInput = page.locator('input[type="number"]').first();
    await topMarginInput.fill('30');
    await topMarginInput.blur();

    await page.getByPlaceholder('Nome da configuração...').fill('Meu Teste');
    await page.getByRole('button', { name: 'salvar' }).click();

    await expect(page.getByText('Meus Favoritos')).toBeVisible();
    await expect(page.getByText('Meu Teste')).toBeVisible();

    // Selecionar o favorito de volta reaplica a margem salva
    await page.locator('input[type="number"]').first().fill('0');
    await page.getByText('Meu Teste').click();
    await expect.poll(async () => Number(await topMarginInput.inputValue())).toBe(30);
  });

  test('PDF cabe na tela sem precisar de scroll no canvas nem na sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();
    await page.waitForTimeout(300);

    const canvasArea = page.locator('[class*="overflow-auto"][class*="bg-muted"]').first();
    const canvasOverflow = await canvasArea.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(canvasOverflow).toBeLessThanOrEqual(2);

    const sidebar = page.locator('[class*="w-full"][class*="sm:w-80"]').first();
    const sidebarOverflow = await sidebar.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(sidebarOverflow).toBeLessThanOrEqual(2);
  });

  test('com vários favoritos salvos, a página não rola inteira e o header continua visível', async ({ page }) => {
    // Este é o caso que expôs o bug de verdade: com pouco conteúdo (sem favoritos)
    // a página cabia por acaso, mas o container faltava min-h-0 na cadeia de flex,
    // então bastava a sidebar crescer (com favoritos) pra empurrar a página inteira
    // pra baixo e o header sumir — sem isso o teste anterior não pegava o problema.
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    for (const name of ['Favorito A', 'Favorito B', 'Favorito C']) {
      await page.getByPlaceholder('Nome da configuração...').fill(name);
      await page.getByRole('button', { name: 'salvar' }).click();
    }
    await expect(page.getByText('Favorito C')).toBeVisible();

    // A PÁGINA (html/body) não deve crescer além da viewport...
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(pageOverflow).toBeLessThanOrEqual(2);

    // ...então o header continua visível e clicável mesmo com a sidebar cheia.
    await expect(page.getByText('Atelier de Edição')).toBeVisible();
    await expect(page.getByRole('button', { name: /visualizar/i })).toBeVisible();

    // A sidebar, por outro lado, PODE (e deve) rolar por dentro — é o comportamento
    // esperado de uma lista de dados que cresce, diferente da página toda rolar.
    const sidebar = page.locator('[class*="w-full"][class*="sm:w-80"]').first();
    const sidebarOverflow = await sidebar.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(sidebarOverflow).toBeGreaterThan(2);
  });

  // Resoluções comuns de notebook/desktop — cobre o bug relatado originalmente
  // ("PDF não cabia na tela, aparecia scroll") com um PDF tamanho A4 de verdade
  // (595x841pt, mesmo tamanho de um documento escaneado real).
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    test(`PDF A4 (595x841) cabe sem scroll em ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.locator('input[type="file"]').setInputFiles(A4_FIXTURE_PDF);
      await expect(page.getByText('a4-test.pdf')).toBeVisible();
      await page.waitForTimeout(300);

      const canvasArea = page.locator('[class*="overflow-auto"][class*="bg-muted"]').first();
      const canvasOverflow = await canvasArea.evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(canvasOverflow).toBeLessThanOrEqual(2);

      const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      expect(pageOverflow).toBeLessThanOrEqual(2);
    });
  }

  test('PDF paisagem: as duas páginas da comparação cabem sem scroll lateral', async ({ page }) => {
    // Bug relatado: com um PDF em modo paisagem, o zoom era calculado pra uma
    // página só; ao processar, a comparação mostra DUAS páginas lado a lado e
    // nenhuma das duas cabia por completo (precisava de scroll horizontal).
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(LANDSCAPE_FIXTURE_PDF);
    await expect(page.getByText('landscape-test.pdf')).toBeVisible();

    await page.getByRole('button', { name: /visualizar/i }).click();
    await expect(page.getByText('Resultado Final')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(300);

    const canvasArea = page.locator('[class*="overflow-auto"][class*="bg-muted"]').first();
    const canvasOverflow = await canvasArea.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(canvasOverflow).toBeLessThanOrEqual(2);

    // Voltar pra visão de uma página só deve caber de novo em 100%-ish da largura
    // (o zoom recalcula pra uma página, não fica "preso" no valor de duas).
    await page.getByRole('button', { name: /voltar/i }).click();
    await expect(page.getByText('Resultado Final')).toHaveCount(0);
    const singlePageOverflow = await canvasArea.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(singlePageOverflow).toBeLessThanOrEqual(2);
  });
});
