import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const FIXTURE_PDF = path.join(__dirname, 'fixtures', 'test.pdf');
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

    // Ajusta uma margem manualmente antes de processar (aba Manual)
    await page.getByRole('button', { name: 'Manual' }).click();
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

    await page.getByRole('button', { name: 'Manual' }).click();
    const rightMarginInput = page.locator('input[type="number"]').nth(3);
    await expect
      .poll(async () => Number(await rightMarginInput.inputValue()))
      .toBeGreaterThan(25);
  });
});
