import { test, expect, type Locator } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const FIXTURE_PDF = path.join(__dirname, 'fixtures', 'test.pdf');
const A4_FIXTURE_PDF = path.join(__dirname, 'fixtures', 'a4-test.pdf');
const LANDSCAPE_FIXTURE_PDF = path.join(__dirname, 'fixtures', 'landscape-test.pdf');
const SCREENSHOT_DIR = path.join(__dirname, '..', 'e2e-screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

// O campo numérico reage a teclas, não ao valor injetado por locator.fill() —
// então digita como um usuário digitaria.
async function typeMargin(input: Locator, value: string) {
  await input.click();
  await input.press('Control+A');
  await input.pressSequentially(value);
  await input.blur();
}

test.describe('PDF Cleaner - fluxo completo', () => {
  test('landing page carrega sem "Pro" no nome', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('PDF Cleaner');
    await expect(page.locator('h1')).toContainText('Apague cabeçalhos, rodapés e carimbos');

    const brandLabel = page.getByText('PDF Cleaner', { exact: true });
    await expect(brandLabel).toBeVisible();

    // Garante que "Pro"/"PRO" não aparece em lugar nenhum da página
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/\bpro\b/i);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing.png'), fullPage: true });
  });

  test('botão "Escolher arquivo" abre o seletor uma única vez e carrega o PDF', async ({ page }) => {
    await page.goto('/');

    let choosers = 0;
    page.on('filechooser', () => choosers++);

    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Escolher arquivo' }).click();
    const chooser = await chooserPromise;
    await page.waitForTimeout(300);
    expect(choosers).toBe(1);

    await chooser.setFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();
  });

  test('upload de PDF abre o editor e renderiza a página', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(FIXTURE_PDF);

    // Header do editor com o nome do arquivo
    await expect(page.getByText('test.pdf')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'test.pdf' })).toBeVisible();

    // Canvas original deve renderizar com dimensões reais
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await expect
      .poll(async () => canvas.evaluate((el: HTMLCanvasElement) => el.width))
      .toBeGreaterThan(0);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-editor-loaded.png'), fullPage: true });
  });

  test('processa o PDF, mostra o resultado e baixa o arquivo limpo', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    await typeMargin(page.getByLabel('Margem superior'), '30');

    const canvases = page.locator('canvas');
    const original = canvases.nth(0);
    const processed = canvases.nth(1);
    await expect.poll(async () => original.evaluate((el: HTMLCanvasElement) => el.width)).toBeGreaterThan(300);
    const originalBox = await original.boundingBox();

    await page.getByRole('button', { name: /ver resultado/i }).click();
    await expect(page.getByRole('button', { name: /baixar pdf/i })).toBeVisible({ timeout: 15_000 });

    // A chave vai sozinha pra "Resultado": o PDF limpo aparece no lugar do original.
    await expect(processed).toBeVisible();
    await expect(original).toBeHidden();

    // Para um PDF simples gerado com pdf-lib, não deve cair no fallback de rasterização
    await expect(page.getByText(/convertido em imagem/i)).toHaveCount(0);

    // O canvas processado renderizou a página de verdade (mesmas dimensões do
    // original) e não ficou com o tamanho padrão de um <canvas> vazio (300x150).
    const originalSize = await original.evaluate((el: HTMLCanvasElement) => ({ w: el.width, h: el.height }));
    await expect.poll(async () => processed.evaluate((el: HTMLCanvasElement) => el.width)).toBe(originalSize.w);
    await expect(processed).toHaveJSProperty('height', originalSize.h);

    // Trocar Original ↔ Resultado não pode fazer a página "pular" de lugar.
    const processedBox = await processed.boundingBox();
    expect(Math.abs(originalBox!.x - processedBox!.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(originalBox!.y - processedBox!.y)).toBeLessThanOrEqual(2);

    // A chave também volta pro original.
    await page.getByRole('button', { name: 'Original', exact: true }).click();
    await expect(original).toBeVisible();
    await expect(processed).toBeHidden();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-comparison.png'), fullPage: true });

    // Exporta e valida o download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /baixar pdf/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe('test_limpo.pdf');
    const downloadPath = path.join(SCREENSHOT_DIR, download.suggestedFilename());
    await download.saveAs(downloadPath);

    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('mudar a margem com o resultado aberto volta pro ajuste (não baixa resultado velho)', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    const top = page.getByLabel('Margem superior');
    await typeMargin(top, '30');
    await page.getByRole('button', { name: /ver resultado/i }).click();
    await expect(page.getByRole('button', { name: /baixar pdf/i })).toBeVisible({ timeout: 15_000 });

    await typeMargin(top, '200');

    await expect(page.getByRole('button', { name: /baixar pdf/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /ver resultado/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resultado', exact: true })).toBeDisabled();
    await expect(page.locator('canvas').nth(0)).toBeVisible();
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

    const rightMarginInput = page.getByLabel('Margem direita');
    await expect
      .poll(async () => parseInt(await rightMarginInput.inputValue(), 10))
      .toBeGreaterThan(25);
  });

  test('não existem presets prontos do sistema; salvar cria um Favorito próprio', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    const topMarginInput = page.getByLabel('Margem superior');
    await typeMargin(topMarginInput, '30');

    // Sem favoritos ainda: o menu mostra só a dica de como salvar, e não há
    // nenhum preset pronto do sistema.
    const favoritesButton = page.getByRole('button', { name: /favoritos/i });
    await favoritesButton.click();
    const emptyHint = page.getByText('Salve as margens atuais para usar de novo em outros PDFs.');
    await expect(emptyHint).toBeVisible();
    await expect(page.getByText('Modelos')).toHaveCount(0);
    await expect(page.getByText(/assinatura digital/i)).toHaveCount(0);

    await page.getByLabel('Nome do favorito').fill('Meu Teste');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await expect(emptyHint).toHaveCount(0);
    await expect(page.getByText('Meu Teste')).toBeVisible();
    await expect(page.getByText('Sup. 30 · Dir. 25 pt')).toBeVisible();
    await page.keyboard.press('Escape');

    // Selecionar o favorito de volta reaplica a margem salva (e fecha o menu)
    await typeMargin(topMarginInput, '0');
    await favoritesButton.click();
    await page.getByText('Meu Teste').click();
    await expect.poll(async () => parseInt(await topMarginInput.inputValue(), 10)).toBe(30);
    await expect(page.getByText('Sup. 30 · Dir. 25 pt')).toHaveCount(0);
  });

  test('PDF cabe na tela sem scroll, com a barra de margens visível', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();
    await page.waitForTimeout(300);

    const canvasArea = page.locator('[class*="overflow-auto"][class*="bg-muted"]').first();
    const canvasOverflow = await canvasArea.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(canvasOverflow).toBeLessThanOrEqual(2);

    const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(pageOverflow).toBeLessThanOrEqual(2);
    await expect(page.getByRole('toolbar', { name: 'Margens e ações' })).toBeInViewport();
  });

  test('com vários favoritos salvos, a página não rola inteira e o header continua visível', async ({ page }) => {
    // Bug antigo: bastava a lista de favoritos crescer pra empurrar a página
    // inteira pra baixo e o header sumir (faltava min-h-0 na cadeia de flex).
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(FIXTURE_PDF);
    await expect(page.getByText('test.pdf')).toBeVisible();

    await page.getByRole('button', { name: /favoritos/i }).click();
    for (const name of ['Favorito A', 'Favorito B', 'Favorito C']) {
      await page.getByLabel('Nome do favorito').fill(name);
      await page.getByRole('button', { name: 'Salvar', exact: true }).click();
    }
    await expect(page.getByText('Favorito A')).toBeVisible();
    await expect(page.getByText('Favorito C')).toBeVisible();

    const pageOverflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(pageOverflow).toBeLessThanOrEqual(2);

    await expect(page.getByRole('heading', { name: 'test.pdf' })).toBeVisible();
    await expect(page.getByRole('button', { name: /ver resultado/i })).toBeVisible();
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

  test('PDF paisagem: original e resultado cabem sem scroll lateral', async ({ page }) => {
    // Bug relatado: um PDF em modo paisagem (já largo) não cabia por completo e
    // precisava de scroll horizontal.
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(LANDSCAPE_FIXTURE_PDF);
    await expect(page.getByText('landscape-test.pdf')).toBeVisible();

    const canvasArea = page.locator('[class*="overflow-auto"][class*="bg-muted"]').first();
    await page.waitForTimeout(300);
    expect(await canvasArea.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);

    await page.getByRole('button', { name: /ver resultado/i }).click();
    await expect(page.getByRole('button', { name: /baixar pdf/i })).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(300);
    expect(await canvasArea.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
  });
});
