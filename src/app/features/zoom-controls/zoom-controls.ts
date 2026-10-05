import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TuiButton, TuiHint } from '@taiga-ui/core';
import { IconComponent } from '../../ui/icon/icon';

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

@Component({
  selector: 'app-zoom-controls',
  standalone: true,
  imports: [IconComponent, TuiButton, TuiHint],
  template: `
    <div class="flex items-center bg-primary/5 p-0.5 rounded-xl">
      <button
        tuiIconButton
        type="button"
        appearance="flat"
        size="xs"
        tuiHint="Diminuir zoom"
        tuiHintDirection="bottom"
        aria-label="Diminuir zoom"
        (click)="handleZoomOut()"
        [disabled]="zoom <= zoomLevels[0]"
      >
        <app-icon name="zoom-out" [size]="14" />
      </button>

      <span class="px-2 text-sm font-semibold text-primary text-center min-w-[52px] tabular-nums select-none">
        {{ Math.round(zoom * 100) }}%
      </span>

      <button
        tuiIconButton
        type="button"
        appearance="flat"
        size="xs"
        tuiHint="Aumentar zoom"
        tuiHintDirection="bottom"
        aria-label="Aumentar zoom"
        (click)="handleZoomIn()"
        [disabled]="zoom >= zoomLevels[zoomLevels.length - 1]"
      >
        <app-icon name="zoom-in" [size]="14" />
      </button>

      <div class="w-px h-3 bg-primary/15 mx-1"></div>

      <button
        tuiIconButton
        type="button"
        appearance="flat"
        size="xs"
        tuiHint="Ajustar à tela"
        tuiHintDirection="bottom"
        aria-label="Ajustar à tela"
        (click)="fitToScreen.emit()"
      >
        <app-icon name="maximize-2" [size]="14" />
      </button>

      <button
        tuiIconButton
        type="button"
        appearance="flat"
        size="xs"
        tuiHint="Tela cheia"
        tuiHintDirection="bottom"
        aria-label="Tela cheia"
        (click)="fullscreen.emit()"
        class="!hidden sm:!inline-flex"
      >
        <app-icon name="maximize-2" [size]="14" class="rotate-45" />
      </button>
    </div>
  `,
})
export class ZoomControlsComponent {
  @Input({ required: true }) zoom!: number;
  @Output() zoomChange = new EventEmitter<number>();
  @Output() fitToScreen = new EventEmitter<void>();
  @Output() fullscreen = new EventEmitter<void>();

  readonly zoomLevels = ZOOM_LEVELS;
  readonly Math = Math;

  private get currentIndex() {
    return ZOOM_LEVELS.findIndex((z) => z >= this.zoom);
  }

  handleZoomIn() {
    const nextIndex = Math.min(this.currentIndex + 1, ZOOM_LEVELS.length - 1);
    this.zoomChange.emit(ZOOM_LEVELS[nextIndex]);
  }

  handleZoomOut() {
    const prevIndex = Math.max(this.currentIndex - 1, 0);
    this.zoomChange.emit(ZOOM_LEVELS[prevIndex]);
  }
}
