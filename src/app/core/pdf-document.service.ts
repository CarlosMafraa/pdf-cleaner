import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

export interface FirstPageInfo {
  totalPages: number;
  width: number;
  height: number;
}

// Tipos próprios do app em vez de vazar os tipos do pdfjs-dist para quem consome
// este serviço — se um dia trocarmos a lib de PDF, só este arquivo muda de tipo.
export type PdfDocument = PDFDocumentProxy;
export type PdfRenderTask = RenderTask;

/**
 * Única porta de entrada para o pdfjs-dist no app. Antes desta extração,
 * `App` e `PdfEditorComponent` chamavam `pdfjsLib.getDocument` cada um por
 * conta própria (SRP/DRY quebrados: duas classes de UI conheciam os detalhes
 * da biblioteca, e o comportamento de load/render podia divergir entre elas).
 */
@Injectable({ providedIn: 'root' })
export class PdfDocumentService {
  load(bytes: Uint8Array): Promise<PdfDocument> {
    return pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
  }

  async getFirstPageInfo(bytes: Uint8Array): Promise<FirstPageInfo> {
    const doc = await this.load(bytes);
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    return { totalPages: doc.numPages, width: viewport.width, height: viewport.height };
  }

  /**
   * Renderiza uma página no canvas, cancelando uma renderização anterior
   * (se houver) antes de começar. Retorna a nova RenderTask enquanto ela
   * está em voo, ou `null` quando termina/falha — o chamador guarda esse
   * valor e o devolve na chamada seguinte, para cancelar corretamente.
   * O serviço não guarda esse estado sozinho porque, aqui, é comum haver
   * duas renderizações concorrentes (canvas original + canvas processado),
   * e cada uma precisa da sua própria RenderTask rastreada separadamente.
   */
  async renderPage(
    doc: PdfDocument,
    canvas: HTMLCanvasElement,
    pageNumber: number,
    scale: number,
    previousTask: PdfRenderTask | null
  ): Promise<PdfRenderTask | null> {
    if (previousTask) {
      try {
        previousTask.cancel();
        await previousTask.promise;
      } catch {
        // Ignora erro de cancelamento
      }
    }

    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d')!;
    const task = page.render({ canvasContext: ctx, viewport, canvas } as any);

    try {
      await task.promise;
    } catch (e) {
      if ((e as Error).name !== 'RenderingCancelledException') {
        console.error('Erro ao renderizar página do PDF:', e);
      }
    }

    return null;
  }
}
