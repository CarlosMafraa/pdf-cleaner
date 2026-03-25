import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function createTestPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 700]);
  const { width, height } = page.getSize();
  
  page.drawText('TOP OF PAGE', { x: width / 2 - 50, y: height - 20, size: 12, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('BOTTOM OF PAGE', { x: width / 2 - 60, y: 10, size: 12, color: rgb(0.5, 0.5, 0.5) });

  page.drawText('PDF de Teste - PDF Cleaner Pro', {
    x: 50,
    y: height - 100,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText('Este é um PDF de teste para verificar se o visualizador está funcionando.', {
    x: 50,
    y: height - 150,
    size: 14,
    color: rgb(0, 0, 0.5),
  });

  // Desenhar algo que pareça uma assinatura
  page.drawRectangle({
    x: 50,
    y: 50,
    width: 200,
    height: 50,
    borderColor: rgb(1, 0, 0),
    borderWidth: 1,
  });
  page.drawText('ASSINATURA AQUI', { x: 60, y: 70, size: 10, color: rgb(1, 0, 0) });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test.pdf', pdfBytes);
  console.log('PDF de teste criado: test.pdf');
}

createTestPDF();
