import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiHint, TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber } from '@taiga-ui/kit';
import { IconComponent } from '../../ui/icon/icon';
import type { Margins } from '../../core/presets.service';

interface MarginField {
  side: keyof Margins;
  label: string;
  ariaLabel: string;
}

const FIELDS: MarginField[] = [
  { side: 'top', label: 'Sup.', ariaLabel: 'Margem superior' },
  { side: 'bottom', label: 'Inf.', ariaLabel: 'Margem inferior' },
  { side: 'left', label: 'Esq.', ariaLabel: 'Margem esquerda' },
  { side: 'right', label: 'Dir.', ariaLabel: 'Margem direita' },
];

@Component({
  selector: 'app-margin-controls',
  standalone: true,
  imports: [FormsModule, IconComponent, TuiButton, TuiHint, TuiTextfield, TuiInputNumber],
  host: { class: 'contents' },
  template: `
    @for (field of fields; track field.side) {
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-semibold text-muted-foreground w-7 text-right" aria-hidden="true">{{ field.label }}</span>
        <tui-textfield tuiTextfieldSize="s" class="w-[76px]" [class.margin-on]="margins[field.side] > 0">
          <input
            tuiInputNumber
            [min]="0"
            [max]="maxFor(field.side)"
            postfix=" pt"
            [ngModel]="Math.round(margins[field.side])"
            (ngModelChange)="handleChange(field.side, $event)"
            [attr.aria-label]="field.ariaLabel"
            class="tabular-nums"
          />
        </tui-textfield>
      </div>
    }

    <button
      tuiIconButton
      type="button"
      appearance="flat"
      size="s"
      tuiHint="Zerar margens"
      tuiHintDirection="top"
      aria-label="Zerar margens"
      (click)="handleReset()"
    >
      <app-icon name="rotate-ccw" [size]="16" />
    </button>
  `,
})
export class MarginControlsComponent {
  @Input({ required: true }) margins!: Margins;
  @Input({ required: true }) pdfDimensions!: { width: number; height: number };
  @Output() marginsChange = new EventEmitter<Margins>();

  readonly fields = FIELDS;
  readonly Math = Math;

  maxFor(side: keyof Margins): number {
    return Math.floor(side === 'top' || side === 'bottom' ? this.pdfDimensions.height / 2 : this.pdfDimensions.width / 2);
  }

  handleChange(side: keyof Margins, value: number | null) {
    this.marginsChange.emit({
      ...this.margins,
      [side]: Math.max(0, Math.min(value ?? 0, this.maxFor(side))),
    });
  }

  handleReset() {
    this.marginsChange.emit({ top: 0, bottom: 0, left: 0, right: 0 });
  }
}
