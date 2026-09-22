import { Injectable } from '@angular/core';
import type { Preset } from './presets.service';

const STORAGE_KEY = 'pdf-cleaner-presets';

/**
 * Isola o acesso ao localStorage. `PresetsService` depende desta abstração
 * em vez de chamar `localStorage` diretamente — separa "regra de negócio de
 * presets" (o service) de "onde os presets são persistidos" (aqui).
 */
@Injectable({ providedIn: 'root' })
export class PresetsStorageService {
  load(): Preset[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  save(customPresets: Preset[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
  }
}
