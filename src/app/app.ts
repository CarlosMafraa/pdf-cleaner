import { Component, inject, signal } from '@angular/core';

import { IconComponent, type IconName } from './ui/icon/icon';
import { FileUploaderComponent } from './features/file-uploader/file-uploader';
import { FileListComponent } from './features/file-uploader/file-list';
import { PdfEditorComponent, type PdfInfo } from './features/pdf-editor/pdf-editor';
import { PdfDocumentService } from './core/pdf-document.service';
import { PdfProcessingService, type ProcessOptions } from './core/pdf-processing.service';

interface Feature {
  icon: IconName;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IconComponent, FileUploaderComponent, FileListComponent, PdfEditorComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly pdfDocument = inject(PdfDocumentService);
  private readonly pdfProcessing = inject(PdfProcessingService);

  readonly features: Feature[] = [
    { icon: 'file-text', title: 'Limpeza de Camadas', desc: 'Identifica e neutraliza assinaturas digitais e anotações nativas.' },
    { icon: 'ruler', title: 'Corte de Precisão', desc: 'Réguas milimétricas para definir o perímetro exato de exibição.' },
    { icon: 'shield', title: 'Segurança Absoluta', desc: 'Processamento síncrono no navegador. Seus dados nunca saem da máquina.' },
  ];

  readonly values = [
    { title: 'Soberania de Dados', desc: 'Todo o processamento ocorre no seu hardware local.' },
    { title: 'Acesso Livre', desc: 'Sem assinaturas, sem logins, sem interrupções.' },
    { title: 'Interface Editorial', desc: 'Design focado em legibilidade e redução de fadiga visual.' },
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
