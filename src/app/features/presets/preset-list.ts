import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon';
import type { Preset } from '../../core/presets.service';

@Component({
  selector: 'app-preset-list',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (presets.length === 0) {
      <div class="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-2xl border border-dashed border-primary/10">
        <app-icon name="bookmark" [size]="24" class="text-primary/20 mb-3" />
        <p class="label-sm text-primary/40 uppercase tracking-widest">Nenhuma configuração salva</p>
      </div>
    } @else {
      <div class="space-y-2">
        @for (preset of presets; track preset.id) {
          <div
            class="group flex flex-col p-4 rounded-xl hover:bg-muted transition-all ring-1 ring-transparent hover:ring-primary/5 cursor-pointer"
            (click)="select.emit(preset)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 pr-4">
                <span class="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {{ preset.name }}
                </span>
                <p class="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider leading-relaxed">
                  {{ preset.description }}
                </p>
              </div>

              @if (onDelete) {
                <button
                  (click)="handleDelete($event, preset.id)"
                  class="p-2 rounded-lg text-primary/20 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <app-icon name="trash-2" [size]="16" />
                </button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class PresetListComponent {
  @Input() presets: Preset[] = [];
  @Input() onDelete = false;
  @Output() select = new EventEmitter<Preset>();
  @Output() delete = new EventEmitter<string>();

  handleDelete(e: Event, id: string) {
    e.stopPropagation();
    this.delete.emit(id);
  }
}
