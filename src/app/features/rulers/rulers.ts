import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import type { Margins } from '../../core/presets.service';

interface Mark {
  pos: number;
  value: number;
  isMajor: boolean;
}

@Component({
  selector: 'app-rulers',
  standalone: true,
  template: `
    <div class="relative select-none">
      <!-- Canto - Editorial Indicator -->
      <div class="absolute top-0 left-0 bg-muted flex items-center justify-center" [style.width.px]="rulerSize" [style.height.px]="rulerSize">
        <span class="label-md opacity-40">PT</span>
      </div>

      <!-- Régua horizontal -->
      <div class="absolute top-0 bg-background overflow-hidden" [style.left.px]="rulerSize" [style.height.px]="rulerSize" [style.width.px]="width * scale">
        <svg [attr.width]="width * scale" [attr.height]="rulerSize">
          @for (mark of horizontalMarks(); track mark.pos) {
            <line [attr.x1]="mark.pos" [attr.y1]="mark.isMajor ? 8 : 14" [attr.x2]="mark.pos" [attr.y2]="rulerSize" stroke="currentColor" stroke-width="1" class="text-primary/40" />
            @if (mark.isMajor) {
              <text [attr.x]="mark.pos + 3" y="12" font-size="9" fill="currentColor" class="text-primary/70 font-mono">{{ mark.value }}</text>
            }
          }
        </svg>

        @if (margins.left > 0) {
          <div class="absolute top-0 bottom-0 bg-primary/5" style="left: 0" [style.width.px]="margins.left * scale">
            <div class="absolute right-0 w-[1px] h-full bg-primary/20"></div>
          </div>
        }
        @if (margins.right > 0) {
          <div class="absolute top-0 bottom-0 bg-primary/5" style="right: 0" [style.width.px]="margins.right * scale">
            <div class="absolute left-0 w-[1px] h-full bg-primary/20"></div>
          </div>
        }
      </div>

      <!-- Régua vertical -->
      <div class="absolute left-0 bg-background overflow-hidden" [style.top.px]="rulerSize" [style.width.px]="rulerSize" [style.height.px]="height * scale">
        <svg [attr.width]="rulerSize" [attr.height]="height * scale">
          @for (mark of verticalMarks(); track mark.pos) {
            <line [attr.x1]="mark.isMajor ? 8 : 14" [attr.y1]="mark.pos" [attr.x2]="rulerSize" [attr.y2]="mark.pos" stroke="currentColor" stroke-width="1" class="text-primary/40" />
            @if (mark.isMajor) {
              <text x="4" [attr.y]="mark.pos + 3" font-size="9" fill="currentColor" class="text-primary/70 font-mono" [attr.transform]="'rotate(-90, 4, ' + mark.pos + ')'">{{ mark.value }}</text>
            }
          }
        </svg>

        @if (margins.top > 0) {
          <div class="absolute left-0 right-0 bg-primary/5" style="top: 0" [style.height.px]="margins.top * scale">
            <div class="absolute bottom-0 w-full h-[1px] bg-primary/20"></div>
          </div>
        }
        @if (margins.bottom > 0) {
          <div class="absolute left-0 right-0 bg-primary/5" style="bottom: 0" [style.height.px]="margins.bottom * scale">
            <div class="absolute top-0 w-full h-[1px] bg-primary/20"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class RulersComponent {
  @Input({ required: true }) width!: number;
  @Input({ required: true }) height!: number;
  @Input({ required: true }) scale!: number;
  @Input({ required: true }) margins!: Margins;

  readonly rulerSize = 24;

  private buildMarks(length: number): Mark[] {
    const marks: Mark[] = [];
    const step = this.scale > 0.5 ? 50 : 100;
    for (let i = 0; i <= length; i += step) {
      marks.push({ pos: i * this.scale, value: Math.round(i), isMajor: i % (step * 2) === 0 });
    }
    return marks;
  }

  horizontalMarks(): Mark[] {
    return this.buildMarks(this.width);
  }

  verticalMarks(): Mark[] {
    return this.buildMarks(this.height);
  }
}

type DragEdge = 'top' | 'bottom' | 'left' | 'right' | null;

@Component({
  selector: 'app-crop-handles',
  standalone: true,
  template: `
    @if (margins.top > 0) {
      <div class="ruler-overlay" style="top:0;left:0;right:0" [style.height.px]="scaled().top"></div>
    }
    @if (margins.bottom > 0) {
      <div class="ruler-overlay" style="bottom:0;left:0;right:0" [style.height.px]="scaled().bottom"></div>
    }
    @if (margins.left > 0) {
      <div class="ruler-overlay" style="top:0;left:0" [style.bottom.px]="0" [style.width.px]="scaled().left"></div>
    }
    @if (margins.right > 0) {
      <div class="ruler-overlay" style="top:0;right:0" [style.bottom.px]="0" [style.width.px]="scaled().right"></div>
    }

    <div
      (mousedown)="handleMouseDown('top', $event)"
      class="ruler-handle cursor-ns-resize"
      [class.opacity-100]="dragging === 'top'"
      [class.opacity-40]="dragging !== 'top'"
      style="position:absolute;left:50%;transform:translateX(-50%);width:60px;height:4px;z-index:20"
      [style.top.px]="scaled().top - 2"
    ></div>

    <div
      (mousedown)="handleMouseDown('bottom', $event)"
      class="ruler-handle cursor-ns-resize"
      [class.opacity-100]="dragging === 'bottom'"
      [class.opacity-40]="dragging !== 'bottom'"
      style="position:absolute;left:50%;transform:translateX(-50%);width:60px;height:4px;z-index:20"
      [style.bottom.px]="scaled().bottom - 2"
    ></div>

    <div
      (mousedown)="handleMouseDown('left', $event)"
      class="ruler-handle cursor-ew-resize"
      [class.opacity-100]="dragging === 'left'"
      [class.opacity-40]="dragging !== 'left'"
      style="position:absolute;top:50%;transform:translateY(-50%);width:4px;height:60px;z-index:20"
      [style.left.px]="scaled().left - 2"
    ></div>

    <div
      (mousedown)="handleMouseDown('right', $event)"
      class="ruler-handle cursor-ew-resize"
      [class.opacity-100]="dragging === 'right'"
      [class.opacity-40]="dragging !== 'right'"
      style="position:absolute;top:50%;transform:translateY(-50%);width:4px;height:60px;z-index:20"
      [style.right.px]="scaled().right - 2"
    ></div>

    @if (margins.top > 20) {
      <div class="absolute left-1/2 -translate-x-1/2 label-md text-primary opacity-60 z-30" [style.top.px]="scaled().top / 2 - 8">
        {{ Math.round(margins.top) }}
      </div>
    }
    @if (margins.bottom > 20) {
      <div class="absolute left-1/2 -translate-x-1/2 label-md text-primary opacity-60 z-30" [style.bottom.px]="scaled().bottom / 2 - 8">
        {{ Math.round(margins.bottom) }}
      </div>
    }
    @if (margins.left > 20) {
      <div class="absolute top-1/2 -translate-y-1/2 label-md text-primary opacity-60 z-30" [style.left.px]="scaled().left / 2 - 12">
        {{ Math.round(margins.left) }}
      </div>
    }
    @if (margins.right > 20) {
      <div class="absolute top-1/2 -translate-y-1/2 label-md text-primary opacity-60 z-30" [style.right.px]="scaled().right / 2 - 12">
        {{ Math.round(margins.right) }}
      </div>
    }
  `,
})
export class CropHandlesComponent {
  @Input({ required: true }) width!: number;
  @Input({ required: true }) height!: number;
  @Input({ required: true }) scale!: number;
  @Input({ required: true }) margins!: Margins;
  @Output() marginsChange = new EventEmitter<Margins>();

  readonly Math = Math;
  dragging: DragEdge = null;
  private startPos = { x: 0, y: 0 };
  private startMargins: Margins = { top: 0, bottom: 0, left: 0, right: 0 };

  scaled() {
    return {
      top: this.margins.top * this.scale,
      bottom: this.margins.bottom * this.scale,
      left: this.margins.left * this.scale,
      right: this.margins.right * this.scale,
    };
  }

  handleMouseDown(edge: Exclude<DragEdge, null>, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.dragging = edge;
    this.startPos = { x: e.clientX, y: e.clientY };
    this.startMargins = { ...this.margins };
  }

  @HostListener('document:mousemove', ['$event'])
  handleMouseMove(e: MouseEvent) {
    if (!this.dragging) return;

    const deltaX = e.clientX - this.startPos.x;
    const deltaY = e.clientY - this.startPos.y;
    const minSize = 50;

    const newMargins = { ...this.startMargins };

    switch (this.dragging) {
      case 'top':
        newMargins.top = Math.max(0, Math.min(this.height - this.margins.bottom - minSize, this.startMargins.top + deltaY / this.scale));
        break;
      case 'bottom':
        newMargins.bottom = Math.max(0, Math.min(this.height - this.margins.top - minSize, this.startMargins.bottom - deltaY / this.scale));
        break;
      case 'left':
        newMargins.left = Math.max(0, Math.min(this.width - this.margins.right - minSize, this.startMargins.left + deltaX / this.scale));
        break;
      case 'right':
        newMargins.right = Math.max(0, Math.min(this.width - this.margins.left - minSize, this.startMargins.right - deltaX / this.scale));
        break;
    }

    this.marginsChange.emit(newMargins);
  }

  @HostListener('document:mouseup')
  handleMouseUp() {
    this.dragging = null;
  }
}
