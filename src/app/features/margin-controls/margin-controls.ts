import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent, type IconName } from '../../ui/icon/icon';
import { ButtonDirective } from '../../ui/button/button';
import { InputDirective } from '../../ui/input/input';
import type { Margins } from '../../core/presets.service';

interface MarginField {
  side: keyof Margins;
  icon: IconName;
  label: string;
}

const FIELDS: MarginField[] = [
  { side: 'top', icon: 'arrow-up', label: 'Topo' },
  { side: 'bottom', icon: 'arrow-down', label: 'Base' },
  { side: 'left', icon: 'arrow-left', label: 'Esq.' },
  { side: 'right', icon: 'arrow-right', label: 'Dir.' },
];

@Component({
  selector: 'app-margin-controls',
  standalone: true,
  imports: [IconComponent, ButtonDirective, InputDirective],
  template: `
    <div class="flex flex-col pt-2">
      <div class="pb-4 space-y-4">
        <div class="grid grid-cols-1 gap-4">
          @for (field of fields; track field.side) {
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-3 min-w-[80px]">
                <app-icon [name]="field.icon" [size]="16" class="text-primary/40" />
                <span class="label-sm text-primary/60 uppercase pt-0.5">{{ field.label }}</span>
              </div>
              <div class="relative flex-1">
                <input
                  appInput
                  type="number"
                  min="0"
                  [value]="Math.round(margins[field.side])"
                  (input)="handleChange(field.side, $any($event.target).value)"
                  class="h-12 text-base pr-10 font-mono bg-muted border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/10 transition-shadow"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/20 uppercase tracking-widest pointer-events-none">
                  PT
                </span>
              </div>
            </div>
          }
        </div>

        <div class="flex justify-end mt-4">
          <button
            appButton
            variant="ghost"
            size="sm"
            (click)="handleReset()"
            class="h-9 px-4 rounded-xl label-sm lowercase gap-2 text-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <app-icon name="rotate-ccw" [size]="14" />
            limpar ajustes
          </button>
        </div>
      </div>

      <!-- Visual Tuning Reference - Editorial Mirror -->
      <div class="pt-4 border-t border-primary/5 mt-4">
        <div class="relative w-full aspect-[4/5] max-w-[140px] min-h-[160px] mx-auto bg-muted rounded-[2rem] overflow-hidden ring-1 ring-primary/5 transition-all duration-700 shadow-inner">
          <div class="absolute inset-4 border border-primary/5 rounded-2xl opacity-50"></div>

          @if (margins.top > 0) {
            <div class="absolute top-0 left-0 right-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
                 [style.height.%]="Math.min(margins.top / 8, 48)"></div>
          }
          @if (margins.bottom > 0) {
            <div class="absolute bottom-0 left-0 right-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
                 [style.height.%]="Math.min(margins.bottom / 8, 48)"></div>
          }
          @if (margins.left > 0) {
            <div class="absolute top-0 bottom-0 left-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
                 [style.width.%]="Math.min(margins.left / 6, 48)"></div>
          }
          @if (margins.right > 0) {
            <div class="absolute top-0 bottom-0 right-0 bg-primary/20 backdrop-blur-sm transition-all duration-500"
                 [style.width.%]="Math.min(margins.right / 6, 48)"></div>
          }

          <div class="absolute inset-0 flex items-center justify-center">
            <span class="label-sm opacity-10 tracking-[0.4em] uppercase text-[10px] select-none">Editorial</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MarginControlsComponent {
  @Input({ required: true }) margins!: Margins;
  @Input({ required: true }) pdfDimensions!: { width: number; height: number };
  @Output() marginsChange = new EventEmitter<Margins>();

  readonly fields = FIELDS;
  readonly Math = Math;

  handleChange(side: keyof Margins, value: string) {
    const numValue = Math.max(0, parseInt(value, 10) || 0);
    const maxValue = side === 'top' || side === 'bottom' ? this.pdfDimensions.height / 2 : this.pdfDimensions.width / 2;

    this.marginsChange.emit({
      ...this.margins,
      [side]: Math.min(numValue, maxValue),
    });
  }

  handleReset() {
    this.marginsChange.emit({ top: 0, bottom: 0, left: 0, right: 0 });
  }
}
