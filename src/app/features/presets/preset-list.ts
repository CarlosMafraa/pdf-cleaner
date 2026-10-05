import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { IconComponent } from '../../ui/icon/icon';
import type { Margins, Preset } from '../../core/presets.service';

const SIDE_LABELS: [keyof Margins, string][] = [
  ['top', 'Sup.'],
  ['bottom', 'Inf.'],
  ['left', 'Esq.'],
  ['right', 'Dir.'],
];

@Component({
  selector: 'app-preset-list',
  standalone: true,
  imports: [IconComponent, TuiButton],
  template: `
    <ul class="space-y-1.5">
      @for (preset of presets; track preset.id) {
        <li class="flex items-center gap-1 rounded-xl bg-muted/60 hover:bg-muted transition-colors">
          <button
            type="button"
            class="flex-1 min-w-0 text-left px-3 py-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            (click)="select.emit(preset)"
          >
            <span class="block font-semibold text-sm text-foreground truncate">{{ preset.name }}</span>
            <span class="block text-xs text-muted-foreground mt-0.5 tabular-nums">{{ summary(preset.margins) }}</span>
          </button>

          @if (onDelete) {
            <button
              tuiIconButton
              type="button"
              appearance="flat"
              size="xs"
              class="shrink-0 mr-1.5"
              [attr.aria-label]="'Excluir favorito ' + preset.name"
              (click)="delete.emit(preset.id)"
            >
              <app-icon name="trash-2" [size]="14" />
            </button>
          }
        </li>
      }
    </ul>
  `,
})
export class PresetListComponent {
  @Input() presets: Preset[] = [];
  @Input() onDelete = false;
  @Output() select = new EventEmitter<Preset>();
  @Output() delete = new EventEmitter<string>();

  summary(margins: Margins): string {
    const sides = SIDE_LABELS.filter(([side]) => margins[side] > 0).map(
      ([side, label]) => `${label} ${Math.round(margins[side])}`
    );
    return sides.length ? `${sides.join(' · ')} pt` : 'Sem margens';
  }
}
