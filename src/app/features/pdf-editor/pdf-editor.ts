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
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

import { IconComponent } from '../../ui/icon/icon';
import { ButtonDirective } from '../../ui/button/button';
import { BadgeDirective } from '../../ui/badge/badge';
import { InputDirective } from '../../ui/input/input';
import { RulersComponent, CropHandlesComponent } from '../rulers/rulers';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls';
import { MarginControlsComponent } from '../margin-controls/margin-controls';
import { PresetListComponent } from '../presets/preset-list';
import { PresetsService, type Margins, type Preset } from '../../core/presets.service';

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
  private readonly injector = inject(Injector);
  readonly Math = Math;

  readonly tabs = [
    { id: 'automatico', label: 'Automático' },
    { id: 'manual', label: 'Manual' },
  ] as const;

  // Estado reativo via signals: app zoneless (Angular 22 sem zone.js) — mutações
  // feitas depois de um `await` só disparam re-render se forem signals.
  readonly currentPage = signal(1);
  readonly zoom = signal(1);
  readonly showComparison = signal(false);
  readonly activeTab = signal<'automatico' | 'manual'>('automatico');
  readonly margins = signal<Margins>({ top: 0, bottom: 0, left: 0, right: 25 });
  readonly processedPdfDoc = signal<PDFDocumentProxy | null>(null);

  readonly removeAnnotations = true;
  newPresetName = '';

  private pdf: PDFDocumentProxy | null = null;
  private renderTask: RenderTask | null = null;

  defaultPresets() {
    return this.presetsService.defaultPresets();
  }

  customPresets() {
    return this.presetsService.customPresets();
  }

  scaledWidth() {
    return this.pdfInfo.width * this.zoom();
  }

  scaledHeight() {
    return this.pdfInfo.height * this.zoom();
  }

  tabClass(id: string) {
    const base = 'flex-1 label-sm lowercase pt-2.5 pb-2 transition-all rounded-xl';
    return this.activeTab() === id ? `${base} bg-card text-primary shadow-sm` : `${base} text-muted-foreground/50 hover:text-primary/70`;
  }

  async ngAfterViewInit() {
    this.zoom.set(this.calculateFitScale());
    await this.loadDocument();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['processedPdf'] && !changes['processedPdf'].firstChange) {
      if (this.processedPdf) {
        this.showComparison.set(true);
        await this.loadProcessedDocument();
      } else {
        this.processedPdfDoc.set(null);
      }
    }
  }

  ngOnDestroy() {
    this.renderTask?.cancel();
  }

  private calculateFitScale(): number {
    if (!this.containerRef?.nativeElement) return 1;
    const sidebarWidth = 320;
    const headerHeight = 73;

    const availableWidth = this.containerRef.nativeElement.offsetWidth - (window.innerWidth > 768 ? sidebarWidth : 0) - 64;
    const availableHeight = window.innerHeight - headerHeight - 64;

    const scaleW = availableWidth / this.pdfInfo.width;
    const scaleH = availableHeight / this.pdfInfo.height;

    return Math.min(scaleW, scaleH, 1.5);
  }

  private async loadDocument() {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: this.pdfBytes.slice(0) });
      this.pdf = await loadingTask.promise;
      await this.renderPage(this.pdf, this.canvasRef.nativeElement, this.currentPage(), this.zoom());
    } catch (e) {
      console.error('Erro ao carregar documento:', e);
    }
  }

  private async loadProcessedDocument() {
    if (!this.processedPdf) return;
    try {
      const loadingTask = pdfjsLib.getDocument({ data: this.processedPdf.slice(0) });
      const doc = await loadingTask.promise;
      this.processedPdfDoc.set(doc);
      // O <canvas> só existe no DOM depois que o Angular processar o novo valor do
      // signal (o *ngIf/@if do template precisa rodar uma change detection primeiro).
      afterNextRender(
        () => {
          if (this.processedCanvasRef) {
            this.renderPage(doc, this.processedCanvasRef.nativeElement, this.currentPage(), this.zoom());
          }
        },
        { injector: this.injector }
      );
    } catch (e) {
      console.error('Erro ao carregar PDF processado:', e);
    }
  }

  private async renderPage(pdfDoc: PDFDocumentProxy, canvas: HTMLCanvasElement, pageNum: number, scale: number) {
    if (!canvas || !pdfDoc) return;

    try {
      if (this.renderTask) {
        try {
          this.renderTask.cancel();
          await this.renderTask.promise;
        } catch {
          // Ignora erro de cancelamento
        }
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d')!;
      const task = page.render({ canvasContext: ctx, viewport, canvas } as any);
      this.renderTask = task;

      await task.promise;
      this.renderTask = null;
    } catch (e) {
      if ((e as Error).name !== 'RenderingCancelledException') {
        console.error('Erro ao renderizar:', e);
      }
    }
  }

  private async rerenderAll() {
    if (this.pdf) {
      await this.renderPage(this.pdf, this.canvasRef.nativeElement, this.currentPage(), this.zoom());
    }
    const processedDoc = this.processedPdfDoc();
    if (processedDoc && this.showComparison() && this.processedCanvasRef) {
      await this.renderPage(processedDoc, this.processedCanvasRef.nativeElement, this.currentPage(), this.zoom());
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
      this.activeTab.set('automatico');
    }
  }

  handleDownload() {
    if (!this.processedPdf) return;
    const blob = new Blob([this.processedPdf as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.file.name.replace('.pdf', '_limpo.pdf');
    a.click();
    URL.revokeObjectURL(url);
  }
}
