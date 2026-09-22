# Migração para Angular

Trabalho feito na branch `feature/angular-migration`. O app React foi completamente substituído pelo Angular na raiz do repositório (Fase 6 concluída) — o histórico do React continua disponível via git (`master` e commits anteriores nesta branch).

Nome do produto já sai sem "Pro" nesta migração (título da aba, header, textos, `package.json`).

## Fase 0 — Scaffold + Tailwind — ✅ concluída
- Angular 22 (standalone, zoneless — sem `zone.js`), Tailwind 3.4.1 + tokens do `DESIGN.md` portados 1:1.

## Fase 1 e 2 — Primitivos de UI — ✅ concluída
- Só `Button`, `Badge`, `Input` e `Tooltip` eram realmente usados no app original (`Card`, `Separator`, `Label`, `Switch`, `Slider`, `Popover` eram imports mortos) — portados como directives (`appButton`, `appBadge`, `appInput`) usando a mesma lógica `class-variance-authority`/`cn` do projeto original.
- Ícones: `lucide-angular` não suporta Angular 22 ainda (peer dep trava em 13-21), então criamos `IconComponent` com os SVGs extraídos de `lucide-static` (mesmo pacote de ícones, sem dependência de framework).
- `Tooltip` reimplementado com Tailwind puro (`group-hover`), sem Angular CDK — o único uso real é estático (zoom controls), não precisa de overlay/collision.

## Fase 3 — Lógica de negócio — ✅ concluída
- `PdfProcessingService` (`core/pdf-processing.service.ts`): port fiel do algoritmo de margens por rotação + fallback de rasterização do `App.jsx` original.
- Melhoria feita durante a reescrita: o fallback agora retorna `usedFallback: true` e a UI avisa o usuário quando o PDF foi convertido em imagem (perda da camada de texto) — item que já estava registrado no `ROADMAP.md` (Fase 3) do app React.
- `PresetsService`: port do hook `usePresets.js`, usando signals + `localStorage`.

## Fase 4 — `PdfEditorComponent` — ✅ concluída
- Canvas, réguas com drag (`RulersComponent`/`CropHandlesComponent`), zoom, tabs, sidebar de presets — tudo portado.
- **Bug real encontrado e corrigido durante a migração**: por ser uma app zoneless (sem `zone.js`), estado mutado depois de um `await` (ex.: terminar de carregar um PDF, terminar de processar) não disparava re-render sozinho. Todo o estado reativo dos componentes foi convertido para **signals** (`signal()`), que é o mecanismo correto de notificação em apps zoneless.
- Segundo bug corrigido: o canvas do PDF processado usava `queueMicrotask` para tentar desenhar assim que o documento carregasse, mas o `<canvas>` só existe no DOM depois que o Angular processa a mudança do signal — trocado por `afterNextRender`, que garante que o DOM já foi atualizado.

## Fase 5 — Componentes restantes — ✅ concluída
`FileUploader`/`FileList`, `MarginControls`, `PresetList`, `ZoomControls` — todos portados.

## Testes end-to-end (Playwright) — ✅ concluído
`angular-app/e2e/pdf-cleaner.spec.ts` cobre o fluxo completo, rodando 3x seguidas sem flakiness:
1. Landing page carrega e **não contém "Pro"** em lugar nenhum do texto visível.
2. Upload de PDF abre o editor e renderiza a página no canvas.
3. Processamento gera a comparação lado a lado, sem cair no fallback (PDF de teste é compatível com pdf-lib), e a exportação baixa um arquivo `_limpo.pdf` não vazio.
4. Arrastar a alça da régua (`CropHandlesComponent`) atualiza a margem numérica correspondente.

Rodar localmente: `cd angular-app && npm run e2e` (usa Chromium, sobe o `ng serve` sozinho via `webServer` do Playwright).

Also corrigido durante os testes: o worker do `pdfjs-dist` estava configurado para vir de CDN (`cdnjs`) — como a v6 do pdfjs só distribui `.mjs`, isso quebraria em runtime. Trocado para copiar `pdf.worker.min.mjs` para `public/` via `scripts/copy-pdf-worker.mjs` (`postinstall`), o que também remove a dependência de rede externa e mantém a promessa de "processamento 100% local".

## Fase 6 — Corte final (mover para a raiz do repo) — ✅ concluída
- App React removido da raiz (`src/*.jsx`, `vite.config.js`, `jsconfig.json`, `components.json`, `postcss.config.js`, `tailwind.config.js`, `package.json`/`pnpm-lock.yaml` antigos).
- Conteúdo de `angular-app/` movido para a raiz do repositório; projeto Angular renomeado de `angular-app` para `pdf-cleaner` em `package.json`/`angular.json`.
- Favicon original (`public/favicon.svg`) recuperado do histórico do git e mantido no lugar do ícone genérico gerado pelo `ng new`; `index.html` com `lang="pt-BR"`.
- Build (`npm run build`) e os 4 testes E2E do Playwright revalidados a partir da raiz do repositório após a mudança — todos passando.

---
- 2026-09-21: Fases 0 a 6 concluídas. Migração para Angular finalizada na branch `feature/angular-migration`, com testes E2E do Playwright passando a partir da raiz do repositório.
