# PDF Cleaner

## 📋 Resumo
O **PDF Cleaner** é uma ferramenta web para limpeza de documentos PDF. Permite remover assinaturas digitais, marcas d'água e bordas indesejadas usando réguas interativas — basta arrastar as bordas diretamente sobre o documento para definir a área de corte.

## 🎯 O que faz

| Funcionalidade | Descrição |
| :--- | :--- |
| **Remover assinaturas digitais** | Elimina anotações de assinatura digital embutidas no PDF |
| **Cortar bordas customizáveis** | Réguas arrastáveis para definir corte em topo, base, esquerda e direita |
| **Preview antes/depois** | Comparação lado a lado do original vs processado |
| **Presets prontos** | Configurações pré-definidas para casos comuns |
| **Salvar presets** | Guarde suas configurações favoritas |
| **Processamento local** | 100% no navegador, nenhum arquivo é enviado a servidores |

## 🔒 Diferenciais

- **Privacidade total** — processamento 100% local no navegador
- **Sem backend** — não precisa de servidor, hospedagem simples e gratuita
- **Interface intuitiva** — réguas visuais estilo Photoshop/Figma
- **Zero custo** — sem limites de uso, sem assinatura

---

## 🛠️ Configuração Local

Stack: Angular 22 (standalone, zoneless) + Tailwind CSS + `pdf-lib`/`pdfjs-dist`.

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm start

# Gerar build de produção
npm run build

# Rodar os testes end-to-end (Playwright)
npm run e2e
```

Veja [docs/design.md](docs/design.md) para o sistema de design (cores, tipografia, componentes) e [docs/project-history.md](docs/project-history.md) para o histórico da migração de React para Angular, o roadmap pendente e o pipeline de CI/CD.

---
PDF Cleaner &copy; 2026. Processamento Local e Gratuito.
