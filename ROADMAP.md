# Roadmap: Correções e Otimizações

Documento de acompanhamento das atividades levantadas na auditoria do projeto (2026-09-21). Desde então o app foi migrado de React para Angular (ver [ANGULAR_MIGRATION.md](ANGULAR_MIGRATION.md)) — os caminhos de arquivo abaixo já refletem a nova estrutura.

**Decisão de arquitetura:** o projeto continua 100% client-side (sem backend). O problema de "não salvamos nada" é resolvido com persistência local (IndexedDB), preservando a proposta de privacidade ("processamento nunca sai da máquina"). Backend só entra se/quando decidirmos suportar conta de usuário, sincronização entre dispositivos ou processamento em lote no servidor — está registrado como item em aberto na Fase 4, não como trabalho planejado.

---

## Fase 1 — Persistência local (sem backend)
Prioridade: **Alta** — ainda não feito

- [ ] Adicionar IndexedDB (via um wrapper simples) para persistir o PDF atual + estado de edição (margens, página, zoom), sobrevivendo a refresh da página.
  - Arquivos: `src/app/app.ts`, `src/app/features/pdf-editor/pdf-editor.ts`
- [ ] Migrar presets de `localStorage` para IndexedDB (opcional, só se o volume justificar; localStorage atende bem por enquanto).
  - Arquivo: `src/app/core/presets.service.ts`
- [ ] Restaurar automaticamente a última sessão ao reabrir o app (perguntar ou continuar de onde parou).

## Fase 2 — Corrigir upload múltiplo (feature incompleta)
Prioridade: **Alta** — ainda não feito

- [ ] Decidir entre: (a) remover suporte a múltiplos arquivos da UI, ou (b) implementar de fato a navegação/edição entre arquivos.
  - Arquivo: `src/app/app.ts` (`currentFileIndex` nunca é atualizado, só o primeiro arquivo é carregado — mesmo comportamento do app React original, preservado na migração)
- [ ] Se optar por (b): adicionar uma lib de zip (ex. `jszip`) para permitir processar vários PDFs e exportar tudo em um `.zip`.
  - Arquivos: `src/app/app.ts`, `src/app/features/file-uploader/file-uploader.ts`, `package.json`
- [ ] Se optar por (a): simplificar `FileUploaderComponent`/`FileListComponent` para single-file.

## Fase 3 — Robustez do processamento de PDF
Prioridade: **Média** — parcialmente concluído durante a migração para Angular

- [x] Avisar o usuário quando o fallback por rasterização (imagem) for acionado, deixando claro que o texto selecionável será perdido.
  - `PdfProcessingService.process()` agora retorna `usedFallback`, e `PdfEditorComponent` exibe um aviso na tela de comparação.
- [x] Revisar o `try/catch` silencioso ao remover anotações (`removeAnnotations`) — agora loga com `console.warn`.
  - Arquivo: `src/app/core/pdf-processing.service.ts`
- [ ] Adicionar tratamento de erro global (ex. `ErrorHandler` do Angular) para evitar tela branca em erros não tratados de `pdfjsLib`/`pdf-lib`.

## Fase 4 — Qualidade e organização
Prioridade: **Baixa/Contínua**

- [x] Testes end-to-end com Playwright cobrindo o fluxo completo (upload → processar → comparar → exportar → drag de margem). Ver `e2e/pdf-cleaner.spec.ts`.
- [ ] Testes unitários para a lógica de cálculo de margens por rotação (`PdfProcessingService`).
- [ ] **[Em aberto]** Avaliar necessidade futura de backend — só se o produto evoluir para: conta de usuário, histórico entre dispositivos, compartilhamento de link do PDF processado, ou processamento server-side de arquivos muito grandes. Não iniciar sem decisão explícita, pois contradiz a proposta atual de privacidade 100% local.

---

## Histórico
- 2026-09-21: Documento criado a partir da auditoria inicial do projeto (app React).
- 2026-09-21: App migrado para Angular; itens da Fase 3 sobre aviso de fallback e log de erro resolvidos durante a reescrita; testes E2E com Playwright adicionados (Fase 4).
