# PDF Cleaner Pro

Uma ferramenta profissional para limpeza de PDFs com réguas interativas. Remova assinaturas digitais, marcações e bordas indesejadas de forma visual e intuitiva.

## ✨ Funcionalidades

- 🎯 **Réguas Interativas** — Arraste as bordas diretamente sobre o PDF
- 👁️ **Preview em Tempo Real** — Visualize o que será removido
- 📐 **Comparação Lado a Lado** — Original vs processado
- 🔖 **Presets** — Configurações prontas ou personalizadas
- 🔒 **100% Privado** — Processamento local no navegador
- 📦 **Múltiplos Arquivos** — Processe vários PDFs

## 🛠️ Stack Técnica

| Biblioteca | Versão | Propósito |
|------------|--------|-----------|
| React | 18.x | Framework UI |
| shadcn/ui | latest | Componentes UI |
| Tailwind CSS | 3.x | Estilização |
| pdf-lib | 1.17.1 | Manipulação de PDF |
| pdfjs-dist | 3.11.x | Renderização de preview |
| Lucide React | 0.446.x | Ícones |
| Vite | 5.x | Build tool |

## 🚀 Início Rápido

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/pdf-cleaner-pro.git
cd pdf-cleaner-pro

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

---

## 🌐 Deploy Gratuito

### Opção 1: Vercel (Recomendado)

1. Crie uma conta em [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Clique em "Import Project"
4. Selecione o repositório
5. Clique em "Deploy"

**Ou via CLI:**

```bash
npm install -g vercel
vercel
```

Seu site estará em: `https://seu-projeto.vercel.app`

### Opção 2: Netlify

1. Crie uma conta em [netlify.com](https://netlify.com)
2. Arraste a pasta `dist/` para o Netlify Drop

**Ou via CLI:**

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Seu site estará em: `https://seu-projeto.netlify.app`

### Opção 3: Cloudflare Pages

1. Crie uma conta em [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecte seu repositório GitHub
3. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy

Seu site estará em: `https://seu-projeto.pages.dev`

### Opção 4: GitHub Pages

1. Adicione ao `vite.config.js`:

```js
export default defineConfig({
  base: '/pdf-cleaner-pro/', // nome do seu repo
  // ...resto da config
})
```

2. Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install and Build
        run: |
          npm install
          npm run build
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. Em Settings > Pages, selecione "gh-pages" branch

Seu site estará em: `https://seu-usuario.github.io/pdf-cleaner-pro`

---

## 📁 Estrutura do Projeto

```
pdf-cleaner-pro/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn/ui
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   └── ...
│   │   ├── FileUploader.jsx
│   │   ├── MarginControls.jsx
│   │   ├── PDFEditor.jsx
│   │   ├── Presets.jsx
│   │   ├── Rulers.jsx
│   │   └── ZoomControls.jsx
│   ├── hooks/
│   │   └── usePresets.js
│   ├── lib/
│   │   └── utils.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── components.json          # Config shadcn/ui
├── index.html
├── jsconfig.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## 🎨 Customização

### Tema

Edite as variáveis CSS em `src/index.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
```

### Adicionar componentes shadcn/ui

```bash
npx shadcn@latest add [componente]
```

## 📄 Licença

MIT License

---

Feito com ❤️ usando React + shadcn/ui
