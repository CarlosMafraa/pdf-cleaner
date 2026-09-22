import { Injectable, computed, signal } from '@angular/core';

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

const STORAGE_KEY = 'pdf-cleaner-presets';

@Injectable({ providedIn: 'root' })
export class PresetsService {
  private readonly _presets = signal<Preset[]>(DEFAULT_PRESETS);

  readonly presets = this._presets.asReadonly();
  readonly defaultPresets = computed(() => this._presets().filter((p) => p.isDefault));
  readonly customPresets = computed(() => this._presets().filter((p) => !p.isDefault));

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const customPresets: Preset[] = JSON.parse(stored);
        this._presets.set([...DEFAULT_PRESETS, ...customPresets]);
      }
    } catch {
      this._presets.set(DEFAULT_PRESETS);
    }
  }

  private persist(all: Preset[]) {
    const customPresets = all.filter((p) => !p.isDefault);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
  }

  addPreset(preset: Omit<Preset, 'id' | 'isDefault'>): Preset {
    const newPreset: Preset = {
      ...preset,
      id: `custom-${Date.now()}`,
      isDefault: false,
    };
    const updated = [...this._presets(), newPreset];
    this._presets.set(updated);
    this.persist(updated);
    return newPreset;
  }

  deletePreset(id: string) {
    const updated = this._presets().filter((p) => p.id !== id || p.isDefault);
    this._presets.set(updated);
    this.persist(updated);
  }
}
