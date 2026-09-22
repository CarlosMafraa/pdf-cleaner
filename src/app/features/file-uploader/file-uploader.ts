import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { IconComponent } from '../../ui/icon/icon';
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

          <p class="label-sm text-muted-foreground mb-10 tracking-widest uppercase">
            {{ isDragOver ? 'Processando Documentos...' : 'Selecione ou arraste seus PDFs aqui' }}
          </p>

          <div class="flex items-center gap-10">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
              <p class="label-sm font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Standard PDF</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
              <p class="label-sm font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Secure Node</p>
            </div>
          </div>
        </div>
      </div>

      @if (error) {
        <div class="flex items-start gap-4 p-8 bg-destructive/5 rounded-3xl text-sm text-destructive animate-in slide-in-from-top-4 duration-300">
          <app-icon name="alert-circle" [size]="20" class="flex-shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-bold label-sm uppercase tracking-widest">Ops, houve um erro</p>
            <p class="leading-relaxed">{{ error }}</p>
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
      this.isDragOver ? 'bg-primary text-white scale-110 rotate-6' : 'bg-card text-primary/60 group-hover:text-primary'
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
