import { bootstrapApplication } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// O worker é copiado de node_modules/pdfjs-dist/build/ para public/ (ver scripts/copy-pdf-worker.mjs)
// para não depender de CDN externo — mantém o processamento 100% local.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.mjs';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
