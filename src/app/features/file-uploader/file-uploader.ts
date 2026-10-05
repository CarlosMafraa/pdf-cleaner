import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { IconComponent } from '../../ui/icon/icon';
import { cn } from '../../lib/utils';

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [IconComponent, TuiButton],
  template: `
    <div class="space-y-4">
      <div
        (click)="inputRef.click()"
        (drop)="handleDrop($event)"
        (dragover)="handleDragOver($event)"
        (dragleave)="handleDragLeave($event)"
        [class]="dropzoneClass()"
      >
        <input
          #fileInput
          type="file"
          accept=".pdf,application/pdf"
          [multiple]="multiple"
          (change)="handleInputChange($event)"
          class="hidden"
        />

        <div [class]="iconWrapperClass()">
          <app-icon name="upload" [size]="22" />
        </div>

        <p class="font-bold text-[1.1rem] text-foreground mb-1">
          {{ isDragOver ? 'Pode soltar' : 'Arraste seu PDF aqui' }}
        </p>
        <p class="text-[0.92rem] text-muted-foreground mb-4">Um ou vários arquivos, até 50 MB cada</p>

        <!-- Sem handler próprio: o clique sobe até a área inteira, que já abre o seletor. -->
        <button tuiButton type="button" appearance="primary" size="m">Escolher arquivo</button>
      </div>

      @if (error) {
        <div role="alert" class="flex items-start gap-3 p-4 bg-destructive/5 rounded-2xl text-sm text-destructive animate-in fade-in duration-300">
          <app-icon name="alert-circle" [size]="18" class="flex-shrink-0 mt-0.5" />
          <p class="leading-relaxed">{{ error }}</p>
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
      'rounded-[18px] px-6 py-7 text-center cursor-pointer border-[1.5px] transition-colors duration-200',
      this.isDragOver ? 'bg-primary/5 border-solid border-primary' : 'bg-card border-dashed border-primary/30 hover:border-primary/50'
    );
  }

  iconWrapperClass() {
    return cn(
      'w-[52px] h-[52px] rounded-full grid place-items-center mx-auto mb-3.5 transition-colors duration-200',
      this.isDragOver ? 'bg-primary text-primary-foreground' : 'bg-background text-primary'
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
