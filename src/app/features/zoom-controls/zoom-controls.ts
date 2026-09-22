import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon';
import { ButtonDirective } from '../../ui/button/button';
import { TooltipComponent } from '../../ui/tooltip/tooltip';

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

@Component({
  selector: 'app-zoom-controls',
  standalone: true,
  imports: [IconComponent, ButtonDirective, TooltipComponent],
  template: `
    <div class="flex items-center bg-muted p-1 px-2 rounded-full ring-1 ring-primary/5 shadow-sm">
      <app-tooltip text="Diminuir zoom">
        <button
          appButton
          variant="ghost"
          size="icon"
          (click)="handleZoomOut()"
          [disabled]="zoom <= zoomLevels[0]"
          class="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
        >
          <app-icon name="zoom-out" [size]="14" class="text-primary/60" />
        </button>
      </app-tooltip>

      <span class="px-3 label-sm font-mono text-primary text-center pt-0.5 min-w-[56px] select-none">
        {{ Math.round(zoom * 100) }}%
      </span>

      <app-tooltip text="Aumentar zoom">
        <button
          appButton
          variant="ghost"
          size="icon"
          (click)="handleZoomIn()"
          [disabled]="zoom >= zoomLevels[zoomLevels.length - 1]"
          class="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
        >
          <app-icon name="zoom-in" [size]="14" class="text-primary/60" />
        </button>
      </app-tooltip>

      <div class="w-px h-3 bg-primary/10 mx-2"></div>

      <app-tooltip text="Ajustar à tela">
        <button
          appButton
          variant="ghost"
          size="icon"
          (click)="fitToScreen.emit()"
          class="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
        >
          <app-icon name="maximize-2" [size]="14" class="text-primary/60" />
        </button>
      </app-tooltip>

      <app-tooltip text="Tela cheia">
        <button
          appButton
          variant="ghost"
          size="icon"
          (click)="fullscreen.emit()"
          class="h-7 w-7 rounded-full hover:bg-background/80 transition-colors"
        >
          <app-icon name="maximize-2" [size]="14" class="rotate-45 text-primary/60" />
        </button>
      </app-tooltip>
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
