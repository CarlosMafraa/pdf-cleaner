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
import { TuiButton, TuiDropdown, TuiInput } from '@taiga-ui/core';
import { TuiSegmented } from '@taiga-ui/kit';

import { IconComponent } from '../../ui/icon/icon';
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
    TuiButton,
    TuiDropdown,
    TuiInput,
    TuiSegmented,
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
  @ViewChild('captionRef') captionRef?: ElementRef<HTMLElement>;

  readonly presetsService = inject(PresetsService);
  private readonly pdfDocument = inject(PdfDocumentService);
  private readonly injector = inject(Injector);
  readonly Math = Math;

  // Estado reativo via signals: app zoneless (Angular 22 sem zone.js) — mutações
  // feitas depois de um `await` só disparam re-render se forem signals.
  readonly currentPage = signal(1);
  readonly zoom = signal(1);
  readonly view = signal<'original' | 'result'>('original');
  // true só enquanto o PDF processado corresponde às margens da tela — qualquer
  // mudança de margem invalida o resultado (e "Baixar PDF" some até reprocessar).
  readonly resultFresh = signal(false);
  readonly margins = signal<Margins>({ top: 0, bottom: 0, left: 0, right: 25 });
  readonly processedPdfDoc = signal<PdfDocument | null>(null);
  readonly favoritesOpen = signal(false);

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
        await this.loadProcessedDocument(this.processedPdf);
        this.resultFresh.set(true);
        this.view.set('result');
      } else {
        this.processedPdfDoc.set(null);
        this.resultFresh.set(false);
        this.view.set('original');
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

    const padding = window.innerWidth >= 640 ? 64 : 32; // Tailwind p-8 / p-4 (dois lados)
    const rulerSize = 24;
    // A legenda acima da página (dica / aviso) + o gap-3 entre ela e a página.
    const caption = (this.captionRef?.nativeElement.offsetHeight ?? 0) + 12;

    const availableWidth = container.clientWidth - padding - rulerSize;
    const availableHeight = container.clientHeight - padding - rulerSize - caption;

    const scaleW = availableWidth / this.pdfInfo.width;
    const scaleH = availableHeight / this.pdfInfo.height;

    return Math.min(scaleW, scaleH, 1.5);
  }

  private async loadProcessedDocument(processedPdf: Uint8Array) {
    try {
      const doc = await this.pdfDocument.load(processedPdf);
      this.processedPdfDoc.set(doc);
      // Renderiza depois do próximo ciclo de render, quando o canvas do resultado
      // já está visível com o tamanho certo.
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
    if (this.processedPdfDoc()) {
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

  setView(view: 'original' | 'result') {
    if (view === 'result' && !this.resultFresh()) return;
    this.view.set(view);
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

  setMargins(margins: Margins) {
    this.margins.set(margins);
    // O resultado (e o arquivo que "Baixar PDF" entregaria) foi gerado com as
    // margens antigas — invalida e volta pro original, pra não baixar algo
    // diferente do que está pedido na tela.
    this.resultFresh.set(false);
    this.view.set('original');
  }

  handleSelectPreset(preset: Preset) {
    this.setMargins({ ...preset.margins });
    this.favoritesOpen.set(false);
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
    if (!this.processedPdf || !this.resultFresh()) return;
    downloadBlob(this.processedPdf, this.file.name.replace('.pdf', '_limpo.pdf'), 'application/pdf');
  }
}
