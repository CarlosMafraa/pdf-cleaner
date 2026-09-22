import { Injectable } from '@angular/core';
import { PDFDocument, PDFName, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { Margins } from './presets.service';

export interface ProcessOptions {
  margins: Margins;
  removeAnnotations: boolean;
}

export interface ProcessResult {
  bytes: Uint8Array;
  usedFallback: boolean;
}

interface ProcessingStrategy {
  name: string;
  /** Se true, a UI avisa o usuário que o texto do PDF deixou de ser selecionável. */
  usesFallback: boolean;
  run(pdfBytes: Uint8Array, options: ProcessOptions): Promise<Uint8Array>;
}

@Injectable({ providedIn: 'root' })
export class PdfProcessingService {
  // Tentadas em ordem — a primeira que não lançar erro vence. Adicionar uma
  // nova estratégia de processamento é só incluir mais um item aqui, sem
  // mexer em process().
  private readonly strategies: ProcessingStrategy[] = [
    { name: 'pdf-lib', usesFallback: false, run: (bytes, opts) => this.processWithPdfLib(bytes, opts) },
    { name: 'raster-fallback', usesFallback: true, run: (bytes, opts) => this.processWithRasterFallback(bytes, opts) },
  ];

  async process(pdfBytes: Uint8Array, options: ProcessOptions): Promise<ProcessResult> {
    let lastError: unknown;

    for (const strategy of this.strategies) {
      try {
        const bytes = await strategy.run(pdfBytes, options);
        return { bytes, usedFallback: strategy.usesFallback };
      } catch (err) {
        lastError = err;
        console.warn(`Estratégia de processamento "${strategy.name}" falhou:`, (err as Error).message);
      }
    }

    throw lastError;
  }

  private async processWithPdfLib(pdfBytes: Uint8Array, options: ProcessOptions): Promise<Uint8Array> {
    // Alguns PDFs têm bytes extras antes do header %PDF — busca e remove
    let bytesToLoad = pdfBytes;
    const maxSearch = Math.min(1024, pdfBytes.length - 4);
    for (let i = 1; i < maxSearch; i++) {
      if (pdfBytes[i] === 0x25 && pdfBytes[i + 1] === 0x50 && pdfBytes[i + 2] === 0x44 && pdfBytes[i + 3] === 0x46) {
        bytesToLoad = pdfBytes.slice(i);
        break;
      }
    }

    const srcDoc = await PDFDocument.load(bytesToLoad, { ignoreEncryption: true });
    const pages = srcDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const rotation = page.getRotation().angle;

      if (options.removeAnnotations) {
        try {
          const annotsRef = page.node.lookup(PDFName.of('Annots'));
          if (annotsRef) page.node.delete(PDFName.of('Annots'));
        } catch (e) {
          console.warn('Não foi possível remover anotações da página:', e);
        }
      }

      const { margins } = options;
      const drawRect = (rect: { x: number; y: number; width: number; height: number }) =>
        page.drawRectangle({ ...rect, color: rgb(1, 1, 1), borderWidth: 0 });

      // pdf-lib desenha no sistema de coordenadas da página (que pode estar rotacionado).
      // width/height de getSize() são os originais (antes da rotação visual do leitor).
      if (rotation === 0) {
        if (margins.top > 0) drawRect({ x: 0, y: height - margins.top, width, height: margins.top });
        if (margins.bottom > 0) drawRect({ x: 0, y: 0, width, height: margins.bottom });
        if (margins.left > 0) drawRect({ x: 0, y: 0, width: margins.left, height });
        if (margins.right > 0) drawRect({ x: width - margins.right, y: 0, width: margins.right, height });
      } else if (rotation === 90) {
        if (margins.top > 0) drawRect({ x: 0, y: 0, width: margins.top, height });
        if (margins.bottom > 0) drawRect({ x: width - margins.bottom, y: 0, width: margins.bottom, height });
        if (margins.left > 0) drawRect({ x: 0, y: 0, width, height: margins.left });
        if (margins.right > 0) drawRect({ x: 0, y: height - margins.right, width, height: margins.right });
      } else if (rotation === 180) {
        if (margins.top > 0) drawRect({ x: 0, y: 0, width, height: margins.top });
        if (margins.bottom > 0) drawRect({ x: 0, y: height - margins.bottom, width, height: margins.bottom });
        if (margins.left > 0) drawRect({ x: width - margins.left, y: 0, width: margins.left, height });
        if (margins.right > 0) drawRect({ x: 0, y: 0, width: margins.right, height });
      } else if (rotation === 270) {
        if (margins.top > 0) drawRect({ x: width - margins.top, y: 0, width: margins.top, height });
        if (margins.bottom > 0) drawRect({ x: 0, y: 0, width: margins.bottom, height });
        if (margins.left > 0) drawRect({ x: 0, y: height - margins.left, width, height: margins.left });
        if (margins.right > 0) drawRect({ x: 0, y: 0, width, height: margins.right });
      }
    }

    return srcDoc.save();
  }

  private async processWithRasterFallback(pdfBytes: Uint8Array, options: ProcessOptions): Promise<Uint8Array> {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const newDoc = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      const { margins } = options;
      const s = viewport.scale;
      ctx.fillStyle = 'white';
      if (margins.top > 0) ctx.fillRect(0, 0, viewport.width, margins.top * s);
      if (margins.bottom > 0) ctx.fillRect(0, viewport.height - margins.bottom * s, viewport.width, margins.bottom * s);
      if (margins.left > 0) ctx.fillRect(0, 0, margins.left * s, viewport.height);
      if (margins.right > 0) ctx.fillRect(viewport.width - margins.right * s, 0, margins.right * s, viewport.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const imgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
      const img = await newDoc.embedJpg(imgBytes);

      const origViewport = page.getViewport({ scale: 1 });
      const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(img, { x: 0, y: 0, width: origViewport.width, height: origViewport.height });
    }

    return newDoc.save();
  }
}
