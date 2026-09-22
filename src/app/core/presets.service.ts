import { Injectable, inject, signal } from '@angular/core';
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
}

// Só existem presets salvos pelo usuário — não há "padrões do sistema" com
// números pré-definidos. Um valor fixo de margem não tem como servir pra
// qualquer documento (assinaturas, scans e cabeçalhos variam demais de
// documento pra documento), então um exemplo genérico teria mais chance de
// confundir do que ajudar.
@Injectable({ providedIn: 'root' })
export class PresetsService {
  private readonly storage = inject(PresetsStorageService);

  private readonly _presets = signal<Preset[]>(this.storage.load());

  readonly presets = this._presets.asReadonly();

  addPreset(preset: Omit<Preset, 'id'>): Preset {
    const newPreset: Preset = { ...preset, id: `custom-${Date.now()}` };
    const updated = [...this._presets(), newPreset];
    this._presets.set(updated);
    this.storage.save(updated);
    return newPreset;
  }

  deletePreset(id: string) {
    const updated = this._presets().filter((p) => p.id !== id);
    this._presets.set(updated);
    this.storage.save(updated);
  }
}
