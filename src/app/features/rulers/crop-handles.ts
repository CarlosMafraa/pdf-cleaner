import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import type { Margins } from '../../core/presets.service';

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
      <div class="absolute left-1/2 -translate-x-1/2 label-sm text-primary z-30" [style.top.px]="scaled().top / 2 - 8">
        {{ Math.round(margins.top) }}
      </div>
    }
    @if (margins.bottom > 20) {
      <div class="absolute left-1/2 -translate-x-1/2 label-sm text-primary z-30" [style.bottom.px]="scaled().bottom / 2 - 8">
        {{ Math.round(margins.bottom) }}
      </div>
    }
    @if (margins.left > 20) {
      <div class="absolute top-1/2 -translate-y-1/2 label-sm text-primary z-30" [style.left.px]="scaled().left / 2 - 12">
        {{ Math.round(margins.left) }}
      </div>
    }
    @if (margins.right > 20) {
      <div class="absolute top-1/2 -translate-y-1/2 label-sm text-primary z-30" [style.right.px]="scaled().right / 2 - 12">
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
