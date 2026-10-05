import { ApplicationConfig, provideBrowserGlobalErrorListeners, signal } from '@angular/core';
import { provideTaiga, tuiTextfieldOptionsProvider } from '@taiga-ui/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideTaiga({ mode: 'light', scrollbars: 'native' }),
    // O botão "limpar" dos campos usa o ícone x.svg do pacote @taiga-ui/icons,
    // que não está instalado (o app usa os próprios ícones) — e nos campos de
    // margem ele não faz sentido: campo vazio já vale 0.
    tuiTextfieldOptionsProvider({ cleaner: signal(false) }),
  ]
};
