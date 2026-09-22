import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon';
import { ButtonDirective } from '../../ui/button/button';
import { cn } from '../../lib/utils';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="space-y-8">
      <div
        (click)="inputRef.click()"
        (drop)="handleDrop($event)"
        (dragover)="handleDragOver($event)"
        (dragleave)="handleDragLeave($event)"
        [class]="dropzoneClass()"
      >
        <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

        <input
          #fileInput
          type="file"
          accept=".pdf,application/pdf"
          [multiple]="multiple"
          (change)="handleInputChange($event)"
          class="hidden"
        />

        <div class="flex flex-col items-center relative z-10">
          <div [class]="iconWrapperClass()">
            <app-icon name="upload" [size]="32" />
          </div>

          <h3 class="title-md font-bold mb-3 tracking-tight text-primary">
            {{ isDragOver ? 'Pode Soltar Agora' : 'Inicie sua Limpeza' }}
          </h3>

          <p class="label-sm text-primary/40 mb-10 tracking-widest uppercase">
            {{ isDragOver ? 'Processando Documentos...' : 'Selecione ou arraste seus PDFs aqui' }}
          </p>

          <div class="flex items-center gap-10">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
              <p class="label-sm font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Standard PDF</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
              <p class="label-sm font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Secure Node</p>
            </div>
          </div>
        </div>
      </div>

      @if (error) {
        <div class="flex items-start gap-4 p-8 bg-destructive/5 rounded-3xl text-sm text-destructive animate-in slide-in-from-top-4 duration-300">
          <app-icon name="alert-circle" [size]="20" class="flex-shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-bold label-sm uppercase tracking-widest">Ops, houve um erro</p>
            <p class="opacity-70 leading-relaxed">{{ error }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class FileUploaderComponent {
  @Input() multiple = true;
  @Output() filesSelected = new EventEmitter<File[]>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  isDragOver = false;
  error: string | null = null;

  get inputRef() {
    return this.fileInputRef.nativeElement;
  }

  dropzoneClass() {
    return cn(
      'relative rounded-[3rem] p-12 sm:p-20 text-center cursor-pointer transition-all duration-300 ease-out overflow-hidden group',
      this.isDragOver
        ? 'bg-primary/5 scale-[1.02] ring-2 ring-primary/20'
        : 'bg-muted/40 hover:bg-muted/60 ring-1 ring-primary/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 hover:ring-primary/20'
    );
  }

  iconWrapperClass() {
    return cn(
      'w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-10 transition-all duration-300 shadow-sm',
      this.isDragOver ? 'bg-primary text-white scale-110 rotate-6' : 'bg-card text-primary/40 group-hover:text-primary'
    );
  }

  private validateFiles(files: File[]) {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        errors.push(`"${file.name}" não é um PDF válido`);
      } else if (file.size > 50 * 1024 * 1024) {
        errors.push(`"${file.name}" excede o limite de 50MB`);
      } else {
        validFiles.push(file);
      }
    }

    return { validFiles, errors };
  }

  private handleFiles(files: FileList) {
    this.error = null;
    const { validFiles, errors } = this.validateFiles(Array.from(files));

    if (errors.length > 0) {
      this.error = errors.join('. ');
    }

    if (validFiles.length > 0) {
      this.filesSelected.emit(this.multiple ? validFiles : [validFiles[0]]);
    }
  }

  handleDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
    if (e.dataTransfer?.files) this.handleFiles(e.dataTransfer.files);
  }

  handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = true;
  }

  handleDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
  }

  handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) this.handleFiles(target.files);
  }
}

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [IconComponent, ButtonDirective],
  template: `
    @if (files.length > 0) {
      <div class="space-y-8 animate-in fade-in duration-500">
        <div class="flex items-center justify-between px-2">
          <p class="label-sm tracking-[0.3em] text-primary uppercase font-bold">
            Fila de Atendimento <span class="opacity-20 ml-2">[{{ files.length }}]</span>
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
                    <p class="text-[10px] font-mono text-primary/40 uppercase tracking-widest">
                      {{ (file.size / 1024 / 1024).toFixed(2) }} MB
                    </p>
                    <div class="w-1 h-1 rounded-full bg-primary/10"></div>
                    <p class="text-[10px] font-mono text-primary/40 uppercase tracking-widest italic">Aguardando</p>
                  </div>
                </div>
              </div>

              <button
                appButton
                variant="ghost"
                size="icon"
                (click)="remove.emit($index)"
                class="h-10 w-10 text-primary/20 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
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
