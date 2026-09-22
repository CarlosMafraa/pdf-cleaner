import { Injectable, computed, inject, signal } from '@angular/core';
import { PresetsStorageService } from './presets-storage.service';

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  margins: Margins;
  removeAnnotations: boolean;
  isDefault: boolean;
}

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'signature-right',
    name: 'Assinatura Digital (Direita)',
    description: 'Remove a faixa lateral direita comum em documentos assinados',
    margins: { top: 0, bottom: 0, left: 0, right: 25 },
    removeAnnotations: true,
    isDefault: true,
  },
  {
    id: 'signature-top-right',
    name: 'Assinatura + Cabeçalho',
    description: 'Remove cabeçalho e faixa lateral direita',
    margins: { top: 30, bottom: 0, left: 0, right: 25 },
    removeAnnotations: true,
    isDefault: true,
  },
  {
    id: 'watermark-all',
    name: "Marca d'água (Bordas)",
    description: 'Limpa todas as bordas do documento',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    removeAnnotations: false,
    isDefault: true,
  },
  {
    id: 'clean-header',
    name: 'Limpar Cabeçalho',
    description: 'Remove apenas a área superior',
    margins: { top: 40, bottom: 0, left: 0, right: 0 },
    removeAnnotations: false,
    isDefault: true,
  },
];

@Injectable({ providedIn: 'root' })
export class PresetsService {
  private readonly storage = inject(PresetsStorageService);

  private readonly _presets = signal<Preset[]>([...DEFAULT_PRESETS, ...this.storage.load()]);

  readonly presets = this._presets.asReadonly();
  readonly defaultPresets = computed(() => this._presets().filter((p) => p.isDefault));
  readonly customPresets = computed(() => this._presets().filter((p) => !p.isDefault));

  addPreset(preset: Omit<Preset, 'id' | 'isDefault'>): Preset {
    const newPreset: Preset = {
      ...preset,
      id: `custom-${Date.now()}`,
      isDefault: false,
    };
    const updated = [...this._presets(), newPreset];
    this._presets.set(updated);
    this.storage.save(updated.filter((p) => !p.isDefault));
    return newPreset;
  }

  deletePreset(id: string) {
    const updated = this._presets().filter((p) => p.id !== id || p.isDefault);
    this._presets.set(updated);
    this.storage.save(updated.filter((p) => !p.isDefault));
  }
}
