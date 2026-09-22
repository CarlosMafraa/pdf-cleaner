# Histórico e Roadmap do Projeto

Este documento junta o que já foi feito (migração para Angular e revisões subsequentes) com o que ainda está pendente.

## Onde o projeto está hoje

O app é 100% client-side, sem backend: Angular 22 (standalone, zoneless) + Tailwind + `pdf-lib`/`pdfjs-dist`. Ver [design.md](design.md) para o sistema visual e [README.md](../README.md) para como rodar o projeto.

O app original foi escrito em React/Vite e migrado por completo para Angular (histórico na seção 2). O React não existe mais no working tree — continua disponível no histórico do git caso seja preciso consultar.

---

## 1. Pendências (Roadmap)

### Persistência local — Prioridade Alta, não feito
- [ ] Adicionar IndexedDB (via um wrapper simples) para persistir o PDF atual + estado de edição (margens, página, zoom), sobrevivendo a refresh da página.
  - Arquivos: `src/app/app.ts`, `src/app/features/pdf-editor/pdf-editor.ts`
- [ ] Migrar presets de `localStorage` para IndexedDB (opcional, só se o volume justificar — `localStorage` atende bem por enquanto).
  - Arquivo: `src/app/core/presets-storage.service.ts`
- [ ] Restaurar automaticamente a última sessão ao reabrir o app (perguntar ou continuar de onde parou).

**Decisão de arquitetura**: o projeto continua sem backend — persistência é sempre local, preservando a proposta de privacidade ("processamento nunca sai da máquina"). Backend só entraria se o produto evoluísse para conta de usuário, sincronização entre dispositivos ou processamento em lote no servidor; não iniciar sem decisão explícita, pois contradiz a proposta atual.

### Upload múltiplo (feature incompleta) — Prioridade Alta, não feito
- [ ] Decidir entre: (a) remover suporte a múltiplos arquivos da UI, ou (b) implementar de fato a navegação/edição entre arquivos.
  - Arquivo: `src/app/app.ts` (`currentFileIndex` nunca é atualizado, só o primeiro arquivo é carregado)
- [ ] Se optar por (b): adicionar uma lib de zip (ex. `jszip`) para permitir processar vários PDFs e exportar tudo em um `.zip`.
  - Arquivos: `src/app/app.ts`, `src/app/features/file-uploader/`, `package.json`
- [ ] Se optar por (a): simplificar `FileUploaderComponent`/`FileListComponent` para single-file.

### Robustez do processamento — Prioridade Média
- [x] Avisar o usuário quando o fallback por rasterização for acionado (texto deixa de ser selecionável) — `PdfProcessingService.process()` retorna `usedFallback`, exibido na tela de comparação.
- [x] Try/catch silencioso ao remover anotações — agora loga com `console.warn`.
- [ ] Adicionar tratamento de erro global (`ErrorHandler` do Angular) para evitar tela branca em erros não tratados de `pdfjsLib`/`pdf-lib`.

### Qualidade e organização — Contínua
- [x] Testes end-to-end com Playwright cobrindo o fluxo completo (upload → processar → comparar → exportar → drag de margem). Ver `e2e/pdf-cleaner.spec.ts`.
- [ ] Testes unitários para a lógica de cálculo de margens por rotação (`PdfProcessingService`).
- [x] Revisão SOLID completa do repositório (seção 3).

---

## 2. Migração de React para Angular

O app foi completamente reescrito de React/Vite para Angular 22, standalone e zoneless. Fases:

**Fase 0 — Scaffold + Tailwind.** Tailwind 3.4.1 + tokens de design portados 1:1.

**Fase 1-2 — Primitivos de UI.** Só `Button`, `Badge`, `Input` e `Tooltip` eram realmente usados no app original (`Card`, `Separator`, `Label`, `Switch`, `Slider`, `Popover` eram imports mortos) — portados como directives (`appButton`, `appBadge`, `appInput`). Ícones: `lucide-angular` não suporta Angular 22 (peer dep trava em 13-21), então criamos `IconComponent` com SVGs extraídos de `lucide-static`. `Tooltip` reimplementado com Tailwind puro (`group-hover`), sem Angular CDK.

**Fase 3 — Lógica de negócio.** `PdfProcessingService`: port fiel do algoritmo de margens por rotação + fallback de rasterização. `PresetsService`: port do hook `usePresets`, usando signals.

**Fase 4 — `PdfEditorComponent`.** Canvas, réguas com drag, zoom, tabs, sidebar de presets — tudo portado.
- **Bug real encontrado**: por ser uma app zoneless (sem `zone.js`), estado mutado depois de um `await` não disparava re-render sozinho. Todo o estado reativo dos componentes foi convertido para **signals**, o mecanismo correto em apps zoneless.
- **Segundo bug**: o canvas do PDF processado usava `queueMicrotask` para desenhar assim que o documento carregasse, mas o `<canvas>` só existe no DOM depois que o Angular processa a mudança do signal — trocado por `afterNextRender`.

**Fase 5 — Componentes restantes.** `FileUploader`/`FileList`, `MarginControls`, `PresetList`, `ZoomControls` — todos portados.

**Testes end-to-end.** `e2e/pdf-cleaner.spec.ts` cobre: landing sem "Pro" no texto; upload abre o editor e renderiza a página; processamento gera comparação lado a lado e exporta um `_limpo.pdf` não vazio; arrastar a alça da régua atualiza a margem numérica. Rodar: `npm run e2e` (sobe o `ng serve` sozinho via Playwright `webServer`).

Também corrigido durante os testes: o worker do `pdfjs-dist` vinha de CDN (`cdnjs`) — a v6 do pdfjs só distribui `.mjs`, o que quebraria em runtime. Trocado para copiar `pdf.worker.min.mjs` para `public/` via `scripts/copy-pdf-worker.mjs` (`postinstall`), removendo também uma dependência de rede externa.

**Fase 6 — Corte final.** App React removido da raiz; conteúdo do projeto Angular movido pra raiz do repo; projeto renomeado de `angular-app` para `pdf-cleaner`; favicon original recuperado do histórico do git.

**Fase 7 — Cores, responsividade e SOLID (primeira rodada).** Ver seção 1 do [design.md](design.md) para o histórico completo de paleta. Responsividade testada e corrigida em 375px/768px/1440px: header sem `flex-wrap` cortava o botão "Visualizar" fora da tela; sidebar com `h-full` incondicional espremia o canvas a quase zero no mobile; `calculateFitScale()` checava um breakpoint (768px) diferente do usado pela sidebar (640px), causando overflow do PDF entre 641-768px de largura — todos corrigidos.

---

## 3. Revisão SOLID (repositório completo)

Auditoria de todo o código-fonte (`src/app/**`) contra os 5 princípios:

- **SRP (Responsabilidade Única)**
  - `pdf-editor.ts` e `app.ts` cada um chamava `pdfjs-dist` diretamente e duplicava a mesma lógica de carregar documento/renderizar página em canvas. Extraído para `core/pdf-document.service.ts`.
  - `PresetsService` misturava regra de negócio (quais presets existem, computeds de default/custom) com acesso direto a `localStorage`. Separado em `core/presets-storage.service.ts` (só persistência).
  - `handleDownload()` (criar blob, link temporário, disparar clique) extraído para `downloadBlob()` em `lib/utils.ts`.
  - `file-uploader.ts` e `rulers.ts` tinham dois componentes cada num único arquivo (`FileUploaderComponent`+`FileListComponent`, `RulersComponent`+`CropHandlesComponent`) — separados em arquivos próprios (`file-uploader.ts`/`file-list.ts`, `rulers.ts`/`crop-handles.ts`).
- **OCP (Aberto/Fechado)**: `PdfProcessingService.process()` tentava a estratégia pdf-lib e caía num `catch` fixo para a estratégia de rasterização. Reescrito como uma lista ordenada de `ProcessingStrategy` — adicionar uma terceira estratégia no futuro é só incluir mais um item na lista, sem tocar na orquestração.
- **LSP (Substituição de Liskov)**: não há hierarquias de herança no projeto (tudo é standalone component/service sem subclasses) — não aplicável.
- **ISP (Segregação de Interface)**: os `@Input`/`@Output` de cada componente (`ZoomControls`, `MarginControls`, `PresetList`, `RulersComponent`, `CropHandlesComponent`) já são pequenos e coesos — nenhum consumidor é forçado a depender de propriedades que não usa.
- **DIP (Inversão de Dependência)**: componentes de UI não conhecem mais a API do `pdfjs-dist` diretamente (dependem de `PdfDocumentService`); `PresetsService` não toca mais `localStorage` diretamente (depende de `PresetsStorageService`). Segunda rodada: `pdf-editor.ts` importava os *tipos* `PDFDocumentProxy`/`RenderTask` direto de `pdfjs-dist` — `PdfDocumentService` agora exporta seus próprios alias (`PdfDocument`, `PdfRenderTask`); se um dia a lib de PDF for trocada, só o service muda de tipo, nenhum componente precisa saber.

**Limpeza de código morto encontrada na releitura completa**: as variantes `success` de `ButtonDirective`/`BadgeDirective` usavam `emerald-600`/`emerald-100` do Tailwind direto (cor de marca chumbada, não um token) e não eram usadas em lugar nenhum do app — removidas.

**Bug real encontrado na releitura completa (não é SOLID, é um bug de verdade)**: `tailwind.config.js` mapeia `--destructive`, `--destructive-foreground`, `--ring`, `--input`, `--popover` e `--popover-foreground`, mas nenhuma dessas variáveis jamais foi definida em `colors.css`. Resultado: `text-destructive` (mensagens de erro do upload), `focus-visible:ring-ring` (anel de foco em todo botão/input) e `bg-popover`/`text-popover-foreground` (o Tooltip) renderizavam com cor inválida — na prática, herdando a cor do elemento pai em vez da cor pretendida, silenciosamente. Confirmado via `getComputedStyle` (as variáveis retornavam string vazia) antes de corrigir. Adicionados os 6 tokens faltando em `colors.css`, com `--destructive` calculado como vermelho semântico independente da paleta de marca (não devia mudar junto com "Bound Ledger" vs. paletas futuras).

**Decisão deliberada de não fragmentar mais**: `PdfEditorComponent` continua relativamente grande (orquestra tabs, zoom, margens, presets e chamadas de render). Isso foi avaliado e mantido assim de propósito — é toda a state de uma única tela coesa, com um único consumidor; extrair um serviço de estado à parte só para "seguir SRP à risca" adicionaria indireção sem um segundo consumidor ou caso de reuso que justifique.

Rebuild + os 4 testes E2E do Playwright revalidados após cada mudança, incluindo verificação via `getComputedStyle` de que os tokens de cor corrigidos resolvem de verdade no navegador.

---

## Pipeline

**CI/CD** (`.github/workflows/deploy-pages.yml`): a cada push na `master`, builda com `ng build --base-href /pdf-cleaner/` e publica `dist/pdf-cleaner/browser` no GitHub Pages via `actions/deploy-pages`. Site: https://carlosmafraa.github.io/pdf-cleaner/ (o repositório foi renomeado de `pdf-cleaner-pro` para `pdf-cleaner` no GitHub — o `base-href` foi atualizado junto).

**Pipeline local de desenvolvimento**:
1. `npm install` → dispara `postinstall` (`scripts/copy-pdf-worker.mjs`), que copia o worker do `pdfjs-dist` para `public/`.
2. `npm start` → `ng serve`, dev server com hot-reload.
3. `npm run build` → build de produção em `dist/pdf-cleaner/`.
4. `npm run e2e` → Playwright sobe o `ng serve` sozinho, roda `e2e/pdf-cleaner.spec.ts` contra ele.

---

## Fase 8 — Remoção dos presets do sistema, sidebar em painel único

A sidebar do editor tinha duas abas: "Automático" (4 presets prontos do sistema + presets salvos pelo usuário) e "Manual" (ajuste fino + salvar preset). Essa organização foi revista em duas etapas:

**Etapa 1** — perceber que favoritos (dado do usuário, salvo em cache) e presets do sistema (dado fixo do app) não deveriam morar na mesma aba: renomeou-se para "Manual" (ajuste fino + Meus Favoritos, virou a aba padrão) e "Modelos" (só os 4 prontos, papel de atalho pra quem nunca usou o app).

**Etapa 2 — os 4 modelos prontos foram removidos por completo.** Motivo: os números desses presets (ex. margem direita de 25pt pra "assinatura", 40pt de topo pra "cabeçalho") eram valores de exemplo escolhidos sem embasamento em documentos reais — cada scanner, cada posição de assinatura e cada tipo de documento (um "Reservista" digitalizado é radicalmente diferente de um PDF gerado digitalmente, por exemplo) precisa de margens diferentes. Um preset genérico correto pra todo mundo não existe; na prática ele só teria valor como "exemplo de como usar a régua", o que não compensa manter 4 presets fixos, mais uma aba, mais a decisão de design de onde cada coisa mora.

Resultado: a sidebar virou um painel único, sem abas — Ajuste Fino → Meus Favoritos (só aparece se houver algum salvo) → Salvar como Favorito. `PresetsService` não tem mais o conceito de preset "padrão"/"customizado" (o campo `isDefault` foi removido do modelo `Preset`) — todo preset agora é, por definição, algo que o próprio usuário criou e salvou.

---

## Fase 9 — Bugs de layout descobertos testando com dados reais (não só o caso vazio)

Dois bugs de scroll/overflow só apareceram ao testar cenários mais realistas do que "PDF de teste pequeno, sem nada salvo":

**Página inteira rolava com favoritos salvos.** O teste de "cabe na tela" original só cobria o caso sem nenhum favorito salvo. Testando com 3 favoritos (sidebar mais alta), a página inteira passou a rolar e o **header sumia do topo** — faltava `min-h-0` na cadeia de flexbox entre a raiz do app (`app.html`) e o painel principal do editor (`pdf-editor.html`); sem isso, o flex item não tinha limite pra encolher e crescia com o conteúdo em vez de deixar a sidebar rolar só por dentro dela mesma. Corrigido adicionando `min-h-0` nos dois níveis da cadeia.

**PDF em modo paisagem não cabia na comparação (scroll lateral).** O zoom de "ajustar à tela" era calculado uma vez, pensando em exibir uma página só. Ao processar um PDF, a tela de comparação mostra duas páginas lado a lado — pra uma página paisagem (já larga), a soma das duas facilmente estourava a largura disponível, e nenhuma das duas ficava visível por completo. `calculateFitScale()` agora recebe o modo de comparação em conta e divide a largura disponível por dois (descontando o gap) quando as duas páginas estão sendo exibidas juntas; o zoom é recalculado tanto ao entrar quanto ao sair da comparação. Durante a correção, uma condição de corrida foi introduzida e pega pelos testes: re-renderizar o canvas processado antes do original terminava de aplicar a nova escala fazia os dois lados aparecerem com tamanhos diferentes por um instante — corrigido invertendo a ordem (original primeiro, processado depois).

Testes E2E adicionados para os dois casos, incluindo uma fixture de PDF paisagem (`landscape-test.pdf`, 841x595) gerada automaticamente pelo mesmo `globalSetup`.

---

## Histórico de datas
- 2026-09-21: Auditoria inicial do projeto React; decisão de migrar para Angular; migração concluída (Fases 0-6); testes E2E adicionados.
- 2026-09-22: Fase 7 (cores/responsividade/SOLID, primeira rodada); paleta refinada em várias iterações (ver design.md); revisão SOLID completa do repositório; documentação consolidada nesta pasta `docs/`. Fase 8: presets do sistema removidos, sidebar simplificada pra um painel único. Fase 9: bugs de scroll de página inteira (favoritos) e de comparação em PDF paisagem corrigidos, achados testando cenários com dados reais em vez do caso vazio.
