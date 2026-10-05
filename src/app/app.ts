import { Component, inject, signal } from '@angular/core';
import { TuiRoot } from '@taiga-ui/core';

import { IconComponent } from './ui/icon/icon';
import { LogoComponent } from './ui/logo/logo';
import { FileUploaderComponent } from './features/file-uploader/file-uploader';
import { FileListComponent } from './features/file-uploader/file-list';
import { PdfEditorComponent, type PdfInfo } from './features/pdf-editor/pdf-editor';
import { PdfDocumentService } from './core/pdf-document.service';
import { PdfProcessingService, type ProcessOptions } from './core/pdf-processing.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TuiRoot, IconComponent, LogoComponent, FileUploaderComponent, FileListComponent, PdfEditorComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly pdfDocument = inject(PdfDocumentService);
  private readonly pdfProcessing = inject(PdfProcessingService);

  readonly steps = [
    { title: 'Envie o PDF', desc: 'Ele abre aqui mesmo, no navegador. Nada é enviado para servidor.' },
    { title: 'Marque as bordas', desc: 'Arraste as réguas sobre a página ou digite a margem de cada lado, em pontos (pt).' },
    { title: 'Compare e baixe', desc: 'Veja o antes e o depois lado a lado e baixe o PDF limpo.' },
  ];

  // Estado reativo via signals: esta app é "zoneless" (Angular 22 sem zone.js),
  // então mutações feitas depois de um `await` só disparam re-render se forem signals.
  readonly files = signal<File[]>([]);
  readonly currentFileIndex = signal(0);
  readonly pdfBytes = signal<Uint8Array | null>(null);
  readonly pdfInfo = signal<PdfInfo | null>(null);
  readonly processedPdf = signal<Uint8Array | null>(null);
  readonly usedFallback = signal(false);
  readonly isProcessing = signal(false);
  readonly view = signal<'upload' | 'editor'>('upload');

  private async loadPDF(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const info = await this.pdfDocument.getFirstPageInfo(bytes);

    this.pdfBytes.set(bytes);
    this.pdfInfo.set(info);
    this.processedPdf.set(null);
    this.view.set('editor');
  }

  async handleFilesSelected(selectedFiles: File[]) {
    this.files.set(selectedFiles);
    if (selectedFiles.length > 0) {
      await this.loadPDF(selectedFiles[0]);
    }
  }

  handleRemoveFile(index: number) {
    const hadOnlyOne = this.files().length === 1;
    this.files.update((files) => files.filter((_, i) => i !== index));
    if (hadOnlyOne) {
      this.view.set('upload');
      this.pdfBytes.set(null);
      this.pdfInfo.set(null);
    }
  }

  async handleProcess(options: ProcessOptions) {
    const bytes = this.pdfBytes();
    if (!bytes) return;

    this.isProcessing.set(true);

    try {
      const result = await this.pdfProcessing.process(bytes, options);
      this.processedPdf.set(result.bytes);
      this.usedFallback.set(result.usedFallback);
    } catch (e) {
      console.error('Erro ao processar:', e);
      alert('Erro ao processar o PDF: ' + (e as Error).message);
    }

    this.isProcessing.set(false);
  }

  handleBack() {
    this.view.set('upload');
    this.pdfBytes.set(null);
    this.pdfInfo.set(null);
    this.processedPdf.set(null);
  }
}
