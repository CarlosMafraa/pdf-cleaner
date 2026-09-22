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
                <span class="label-sm text-muted-foreground uppercase pt-0.5">{{ field.label }}</span>
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
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pointer-events-none">
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
            class="h-9 px-4 rounded-xl label-sm lowercase gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
          >
            <app-icon name="rotate-ccw" [size]="14" />
            limpar ajustes
          </button>
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
