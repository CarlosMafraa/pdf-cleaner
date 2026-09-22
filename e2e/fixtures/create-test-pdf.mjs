import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createTestPdfBytes() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 700]);
  const { width, height } = page.getSize();

  page.drawText('TOP OF PAGE', { x: width / 2 - 50, y: height - 20, size: 12, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('BOTTOM OF PAGE', { x: width / 2 - 60, y: 10, size: 12, color: rgb(0.5, 0.5, 0.5) });

  page.drawText('PDF de Teste - PDF Cleaner', {
    x: 50,
    y: height - 100,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText('Este é um PDF de teste para verificar o visualizador (E2E).', {
    x: 50,
    y: height - 150,
    size: 14,
    color: rgb(0, 0, 0.5),
  });

  page.drawRectangle({
    x: 50,
    y: 50,
    width: 200,
    height: 50,
    borderColor: rgb(1, 0, 0),
    borderWidth: 1,
  });
  page.drawText('ASSINATURA AQUI', { x: 60, y: 70, size: 10, color: rgb(1, 0, 0) });

  return pdfDoc.save();
}

// Página A4 em pontos (595x841) — mesmo tamanho de um PDF escaneado real
// (ex.: o "Carteira de Reservista.pdf" usado para reportar o bug de fit-to-screen).
export async function createA4PdfBytes() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 841]);
  const { width, height } = page.getSize();

  page.drawText('PDF A4 de Teste', { x: 50, y: height - 80, size: 22, color: rgb(0, 0, 0) });
  page.drawText('595 x 841 pt — usado para testar o ajuste automático de zoom', {
    x: 50,
    y: height - 110,
    size: 12,
    color: rgb(0.3, 0.3, 0.3),
  });

  return pdfDoc.save();
}

// A4 deitado (841x595) — reproduz o bug relatado de PDF em modo paisagem
// abrindo cortado, com scroll lateral.
export async function createLandscapePdfBytes() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841, 595]);
  const { width, height } = page.getSize();

  page.drawText('PDF Paisagem de Teste', { x: 50, y: height - 60, size: 22, color: rgb(0, 0, 0) });
  page.drawText('841 x 595 pt (A4 deitado)', { x: 50, y: height - 90, size: 12, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('CANTO DIREITO', { x: width - 150, y: height / 2, size: 14, color: rgb(1, 0, 0) });

  return pdfDoc.save();
}

async function writeFixtures() {
  fs.writeFileSync(path.join(__dirname, 'test.pdf'), await createTestPdfBytes());
  fs.writeFileSync(path.join(__dirname, 'a4-test.pdf'), await createA4PdfBytes());
  fs.writeFileSync(path.join(__dirname, 'landscape-test.pdf'), await createLandscapePdfBytes());
  console.log('Fixtures de PDF geradas em e2e/fixtures/ (test.pdf, a4-test.pdf, landscape-test.pdf)');
}

export { writeFixtures };

// Permite rodar `node e2e/fixtures/create-test-pdf.mjs` manualmente também
// (o Playwright já gera as fixtures sozinho via globalSetup antes dos testes).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFixtures();
}
