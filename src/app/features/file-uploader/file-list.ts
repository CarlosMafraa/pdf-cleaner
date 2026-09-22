import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon';
import { ButtonDirective } from '../../ui/button/button';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [IconComponent, ButtonDirective],
  template: `
    @if (files.length > 0) {
      <div class="space-y-8 animate-in fade-in duration-500">
        <div class="flex items-center justify-between px-2">
          <p class="label-sm tracking-[0.3em] text-primary uppercase font-bold">
            Fila de Atendimento <span class="text-muted-foreground ml-2">[{{ files.length }}]</span>
          </p>
        </div>

        <div class="grid gap-3 max-h-[340px] overflow-y-auto scrollbar-thin pr-4 pt-1">
          @for (file of files; track file.name + $index) {
            <div class="flex items-center justify-between p-5 bg-muted rounded-[1.5rem] group hover:bg-card hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-primary/[0.02]">
              <div class="flex items-center gap-5 min-w-0">
                <div class="w-12 h-12 bg-card rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/[0.03]">
                  <app-icon name="file-text" [size]="22" class="text-primary/40 group-hover:text-primary transition-colors" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                    {{ file.name }}
                  </p>
                  <div class="flex items-center gap-3 mt-1">
                    <p class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      {{ (file.size / 1024 / 1024).toFixed(2) }} MB
                    </p>
                    <div class="w-1 h-1 rounded-full bg-primary/10"></div>
                    <p class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest italic">Aguardando</p>
                  </div>
                </div>
              </div>

              <button
                appButton
                variant="ghost"
                size="icon"
                (click)="remove.emit($index)"
                class="h-10 w-10 text-primary/60 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
              >
                <app-icon name="x" [size]="18" />
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class FileListComponent {
  @Input() files: File[] = [];
  @Output() remove = new EventEmitter<number>();
}
