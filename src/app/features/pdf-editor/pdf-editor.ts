import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { IconComponent } from '../../ui/icon/icon';
import { ButtonDirective } from '../../ui/button/button';
import { BadgeDirective } from '../../ui/badge/badge';
import { InputDirective } from '../../ui/input/input';
import { RulersComponent } from '../rulers/rulers';
import { CropHandlesComponent } from '../rulers/crop-handles';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls';
import { MarginControlsComponent } from '../margin-controls/margin-controls';
import { PresetListComponent } from '../presets/preset-list';
import { PresetsService, type Margins, type Preset } from '../../core/presets.service';
import { PdfDocumentService, type PdfDocument, type PdfRenderTask } from '../../core/pdf-document.service';
import { downloadBlob } from '../../lib/utils';

export interface PdfInfo {
  totalPages: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-pdf-editor',
  standalone: true,
  imports: [
    FormsModule,
    IconComponent,
    ButtonDirective,
    BadgeDirective,
    InputDirective,
    RulersComponent,
    CropHandlesComponent,
    ZoomControlsComponent,
    MarginControlsComponent,
    PresetListComponent,
  ],
  templateUrl: './pdf-editor.html',
})
export class PdfEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) file!: File;
  @Input({ required: true }) pdfBytes!: Uint8Array;
  @Input({ required: true }) pdfInfo!: PdfInfo;
  @Input() processedPdf: Uint8Array | null = null;
  @Input() usedFallback = false;
  @Input() isProcessing = false;

  @Output() back = new EventEmitter<void>();
  @Output() process = new EventEmitter<{ margins: Margins; removeAnnotations: boolean }>();

  @ViewChild('containerRef') containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasContainerRef') canvasContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('processedCanvasRef') processedCanvasRef?: ElementRef<HTMLCanvasElement>;

  readonly presetsService = inject(PresetsService);
  private readonly pdfDocument = inject(PdfDocumentService);
  private readonly injector = inject(Injector);
  readonly Math = Math;

  // Estado reativo via signals: app zoneless (Angular 22 sem zone.js) — mutações
  // feitas depois de um `await` só disparam re-render se forem signals.
  readonly currentPage = signal(1);
  readonly zoom = signal(1);
  readonly showComparison = signal(false);
  readonly margins = signal<Margins>({ top: 0, bottom: 0, left: 0, right: 25 });
  readonly processedPdfDoc = signal<PdfDocument | null>(null);

  readonly removeAnnotations = true;
  newPresetName = '';

  private pdf: PdfDocument | null = null;
  private renderTask: PdfRenderTask | null = null;
  private processedRenderTask: PdfRenderTask | null = null;

  favorites() {
    return this.presetsService.presets();
  }

  scaledWidth() {
    return this.pdfInfo.width * this.zoom();
  }

  scaledHeight() {
    return this.pdfInfo.height * this.zoom();
  }

  async ngAfterViewInit() {
    this.zoom.set(this.calculateFitScale());
    try {
      this.pdf = await this.pdfDocument.load(this.pdfBytes);
      await this.renderOriginal();
    } catch (e) {
      console.error('Erro ao carregar documento:', e);
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['processedPdf'] && !changes['processedPdf'].firstChange) {
      if (this.processedPdf) {
        this.showComparison.set(true);
        // A comparação mostra duas páginas lado a lado — o zoom calculado pra uma
        // página só (ngAfterViewInit) pode não caber mais duas, especialmente em
        // PDFs paisagem (já largos). Recalcula considerando as duas e já
        // re-renderiza o original ANTES de carregar o processado: se fizesse na
        // ordem inversa, "Resultado Final" apareceria (processedPdfDoc setado)
        // enquanto o canvas original ainda estivesse na escala antiga — os dois
        // lados da comparação ficariam com tamanhos diferentes por um instante.
        this.zoom.set(this.calculateFitScale());
        await this.renderOriginal();
        await this.loadProcessedDocument(this.processedPdf);
      } else {
        this.processedPdfDoc.set(null);
      }
    }
  }

  ngOnDestroy() {
    this.renderTask?.cancel();
    this.processedRenderTask?.cancel();
  }

  private calculateFitScale(): number {
    // Mede o espaço real disponível (canvasContainerRef) em vez de usar constantes
    // fixas para altura do header/largura da sidebar — essas constantes ficavam
    // desatualizadas toda vez que o layout mudava e causavam overflow (scroll)
    // mesmo quando o PDF "deveria" caber inteiro na tela.
    const container = this.canvasContainerRef?.nativeElement;
    if (!container) return 1;

    const horizontalPadding = window.innerWidth >= 640 ? 96 : 32; // Tailwind p-12 / p-4 (dois lados)
    const rulerSize = 24;

    let availableWidth = container.clientWidth - horizontalPadding - rulerSize;
    const availableHeight = container.clientHeight - horizontalPadding - rulerSize;

    // No modo de comparação, duas páginas aparecem lado a lado (gap-16 = 64px
    // entre elas) — sem dividir a largura disponível por dois aqui, uma página
    // paisagem (já larga) sozinha já ocupa quase tudo, e a segunda não cabe.
    if (this.showComparison() && window.innerWidth >= 640) {
      availableWidth = (availableWidth - 64) / 2;
    }

    const scaleW = availableWidth / this.pdfInfo.width;
    const scaleH = availableHeight / this.pdfInfo.height;

    return Math.min(scaleW, scaleH, 1.5);
  }

  private async loadProcessedDocument(processedPdf: Uint8Array) {
    try {
      const doc = await this.pdfDocument.load(processedPdf);
      this.processedPdfDoc.set(doc);
      // O <canvas> só existe no DOM depois que o Angular processar o novo valor do
      // signal (o @if do template precisa rodar uma change detection primeiro).
      afterNextRender(() => this.renderProcessed(doc), { injector: this.injector });
    } catch (e) {
      console.error('Erro ao carregar PDF processado:', e);
    }
  }

  private async renderOriginal() {
    if (!this.pdf) return;
    this.renderTask = await this.pdfDocument.renderPage(
      this.pdf,
      this.canvasRef.nativeElement,
      this.currentPage(),
      this.zoom(),
      this.renderTask
    );
  }

  private async renderProcessed(doc: PdfDocument = this.processedPdfDoc()!) {
    if (!doc || !this.processedCanvasRef) return;
    this.processedRenderTask = await this.pdfDocument.renderPage(
      doc,
      this.processedCanvasRef.nativeElement,
      this.currentPage(),
      this.zoom(),
      this.processedRenderTask
    );
  }

  private async rerenderAll() {
    await this.renderOriginal();
    if (this.showComparison() && this.processedPdfDoc()) {
      await this.renderProcessed();
    }
  }

  goToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(this.pdfInfo.totalPages, page)));
    this.rerenderAll();
  }

  setZoom(zoom: number) {
    this.zoom.set(zoom);
    this.rerenderAll();
  }

  handleFitToScreen() {
    this.setZoom(this.calculateFitScale());
  }

  handleHideComparison() {
    this.showComparison.set(false);
    // Volta a caber uma página só (sem a segunda ao lado), então o zoom de
    // ajuste automático precisa ser recalculado de novo.
    this.setZoom(this.calculateFitScale());
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.containerRef.nativeElement.requestFullscreen().catch((err) => {
        console.error(`Erro ao ativar tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  handleProcess() {
    this.process.emit({ margins: this.margins(), removeAnnotations: this.removeAnnotations });
  }

  handleSelectPreset(preset: Preset) {
    this.margins.set({ ...preset.margins });
  }

  handleSavePreset() {
    if (this.newPresetName.trim()) {
      this.presetsService.addPreset({
        name: this.newPresetName.trim(),
        description: 'Configuração Personalizada',
        margins: this.margins(),
        removeAnnotations: this.removeAnnotations,
      });
      this.newPresetName = '';
    }
  }

  handleDownload() {
    if (!this.processedPdf) return;
    downloadBlob(this.processedPdf, this.file.name.replace('.pdf', '_limpo.pdf'), 'application/pdf');
  }
}
