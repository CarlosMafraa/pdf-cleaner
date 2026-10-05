# Sistema de Design

Norte criativo do projeto: **"The Digital Atelier"** — uma experiência editorial de alto padrão, tátil e intencional, longe das grades rígidas e genéricas de dashboard. O sistema busca sofisticação através de **assimetria intencional** e **camadas tonais**, não de complexidade: elementos devem parecer que repousam ou estão recessos na superfície, nunca "colados" por cima dela.

---

## 1. Cores

### 1.1 Onde mudar as cores

Toda cor do app vem de **uma única fonte**: [`src/styles/colors.css`](../src/styles/colors.css). É o único arquivo que deveria precisar de edição para trocar a paleta inteira — nenhum componente, diretiva ou classe utilitária deve ter cor fixa (hex/rgba solto). O restante do CSS e todos os componentes só consomem essas variáveis:

- No Tailwind: `tailwind.config.js` mapeia cada variável para uma classe (`bg-primary`, `text-muted-foreground`, etc.) — é isso que os componentes usam.
- No CSS puro: `hsl(var(--secondary) / 0.15)` (usado em `.ruler-overlay`, `.glass-panel`, sombras) — o formato `H S% L%` das variáveis existe justamente para permitir compor opacidade assim.

**Única exceção que precisa de sincronização manual**: [`public/favicon.svg`](../public/favicon.svg). É um SVG estático servido fora do contexto da página (o navegador carrega o ícone da aba antes/sem aplicar o CSS do app), então não consegue referenciar `var(--primary)` — o hex fica escrito direto no arquivo. Ficou com a cor de uma paleta antiga (emerald `#006948`, anterior até ao Deep Forest Green original) sem ninguém notar durante várias trocas de paleta. Ao trocar `--primary` em `colors.css`, lembrar de atualizar esse arquivo também à mão.

Antes desta organização, havia ~8 cores "chumbadas" em rgba (sombras, textura das réguas, um botão que ainda usava um verde do Tailwind direto) que **não acompanhavam** a troca de paleta — foram todas migradas para referenciar as variáveis.

**Tokens que existem além da paleta de marca**: `--destructive`/`--destructive-foreground` (vermelho de erro, propositalmente independente da paleta — não deve virar vinho/dourado junto com o resto), `--ring` (anel de foco, = `--primary`), `--input`/`--border` (contorno de campos), `--popover`/`--popover-foreground` (fundo/texto do `Tooltip`). Esses 6 eram referenciados pelo `tailwind.config.js` mas nunca tinham sido definidos em lugar nenhum — mensagens de erro, anel de foco e tooltip renderizavam com cor inválida (herdando a cor do elemento pai) sem nenhum aviso. Confirmado com `getComputedStyle` e corrigido.

### 1.2 A lógica da paleta

A paleta usa três famílias de cor com papéis bem separados — isso evita o efeito "poço de cores aleatórias" comum em paletas amadoras. Paleta atual, **"Bound Ledger"** (livro-razão encadernado):

| Papel | Cor | Hue (matiz) | Onde é usada |
|---|---|---|---|
| **Primária** (estrutura, autoridade) | `#6B1F3A` Vinho | ~339° (vermelho-magenta) | Títulos, ícones de marca, texto de navegação |
| **Secundária** (ação) | `#8C6318` Dourado Envelhecido | ~39° (âmbar) | Botões de ação primária ("Visualizar", "Exportar") |
| **Terciária** (acento) | `#3D1220` / `#8C2F44` | ~340-346° (vinho quase preto / rosa antigo) | Reservada para alertas/micro-interações (ver nota abaixo) |
| **Neutra** (base) | `#FAF3E4` Pergaminho | ~41° (bege quente) | Fundo geral |

Primária (339°) e Secundária (39°) ficam a **~120° de distância** no círculo cromático — uma harmonia triádica parcial, não complementar pura. O conceito é deliberadamente **livresco/editorial** — vinho de capa de couro + dourado de gravação em relevo.

**Nota sobre a Terciária**: hoje ela não aparece em nenhum lugar visível da UI — o par `--accent`/`--accent-foreground` só é consumido pelo hover padrão dos botões `ghost`/`outline` (`button.ts`), e todo botão do app já define seu próprio hover explícito (`hover:bg-primary/5`, `hover:bg-background/80`, etc.), que sempre vence via `tailwind-merge`. Ou seja, a Terciária existe na variável mas está "morta" na prática — não é um bug urgente, mas é uma inconsistência entre o token e o uso real, registrada aqui para não ser esquecida.

#### Histórico de iterações
1. Cor primária tinha divergido da proposta original (emerald claro `#006948` em vez do Deep Forest Green `#003629`) — revertida.
2. "Blueprint Atelier" (navy `#14314D` + latão `#8C5F22`) sobre fundo creme quente — rejeitada: fundo quente não combinava com azul frio, e saturação (60-61%) ficou "apagada".
3. Fundo trocado pra cinza-azulado frio (`#F3F6F8`) — corrigiu a combinação, mas ainda pouco vívida.
4. "Cobalt Precision" (azul `#1544A3` + laranja `#AE5516`, saturação 77-78%) — mais vívida, mas rejeitada por ser "azul e cinza genérico", o clichê de SaaS que a proposta original queria evitar.
5. **Paleta atual, "Bound Ledger"** (vinho `#6B1F3A` + dourado `#8C6318` sobre pergaminho `#FAF3E4`) — sai da dupla azul/verde, mantém saturação alta, vibe livro encadernado/editorial de luxo.

### 1.3 Contraste (WCAG 2.1)

Cor "bonita" não é o mesmo que cor **legível**. Todo par cor-de-texto/cor-de-fundo do app foi auditado com a fórmula de luminância relativa do WCAG antes de qualquer paleta entrar em produção.

Os tokens sólidos já eram bons (números medidos na paleta verde original, mas a régua vale para qualquer paleta):

| Combinação | Contraste | Mínimo WCAG AA | Resultado |
|---|---|---|---|
| Texto sobre fundo | 16.3:1 | 4.5:1 | ✅ Excelente |
| Primária sobre fundo (títulos) | 12.8:1 | 4.5:1 | ✅ Excelente |
| `muted-foreground` sobre fundo | 8.8:1 | 4.5:1 | ✅ Excelente |
| Branco sobre botão primário | 13.5:1 | 4.5:1 | ✅ Excelente |
| Texto sobre botão secundário | 6.0:1 | 4.5:1 | ✅ Bom |

**O problema real encontrado**: o padrão usado por todo o app para criar hierarquia visual (textos "secundários", legendas, rótulos) era pegar uma cor sólida já definida e aplicar uma opacidade Tailwind por cima (`text-primary/40`, `opacity-60`), às vezes **duas vezes empilhadas** (a classe `.label-sm` aplicava `opacity-80` globalmente, e várias instâncias ainda somavam um `text-primary/40` — resultando em ~32% de opacidade real, não 40% nem 80%). Isso derruba o contraste de forma silenciosa:

| Opacidade sobre o fundo | Contraste resultante | Passa em AA (4.5:1)? |
|---|---|---|
| `primary/20%` | 1.47:1 | ❌ Não |
| `primary/40%` | 2.32:1 | ❌ Não |
| `primary/50%` | 2.96:1 | ❌ Não |
| `primary/60%` | 3.88:1 | ❌ Não (passa só o limiar de 3:1 de texto grande/ícone) |
| `primary/70%` | 5.22:1 | ✅ Sim |
| `primary/80%` | 7.06:1 | ✅ Sim |

Isso afetava mais de 25 elementos de texto real (legendas, contadores, labels de campo, números de medida ao vivo nas réguas) — muitos ficavam quase ilegíveis contra o fundo, especialmente sob luz de tela forte ou para quem tem baixa visão.

**Regra adotada daqui pra frente:**

> Hierarquia visual se expressa trocando de token semântico (`text-foreground` → `text-muted-foreground` → `text-primary`), nunca aplicando opacidade sobre um token já escolhido. Opacidade continua permitida para elementos puramente decorativos (divisores, marcas d'água, blobs de fundo) e para estados de interação já cobertos por convenção (`disabled:opacity-50`, `opacity-0 group-hover:opacity-100`).

Mudanças concretas feitas: `opacity-80` removido de `.label-sm`; ~25 ocorrências de opacidade sobre texto real trocadas por `text-muted-foreground` ou cor sólida; duas exceções documentadas mantidas de propósito por serem texto grande (≥24px); bug à parte corrigido — `rulers.ts` usava uma classe `label-md` que nunca existiu no CSS; `primary-container`/`on-primary-container` cadastrados no Tailwind (existiam como variável CSS mas nunca eram consumidos).

### 1.4 Checklist para novas cores/telas

1. Ela tem um papel semântico claro (primária/secundária/terciária/neutra) ou é só um capricho?
2. Se for texto real (não decoração), o contraste sólido contra o fundo bate 4.5:1 (ou 3:1 se a fonte for ≥24px/≥18.7px em negrito)?
3. Está definida como variável HSL em `src/styles/colors.css` + token no `tailwind.config.js` — não como hex solto no meio de um componente?

---

## 2. Superfícies

### A regra "sem linha"
Não usar bordas sólidas de 1px para definir seções — limites de layout devem vir exclusivamente de mudanças de cor de fundo. Uma seção `surface_container` (recessa) direto contra o `surface` (base) já dá separação cognitiva suficiente sem a poluição visual de uma linha.

### Hierarquia de superfícies
Trate a UI como uma pilha física de papel fino:
1. **Camada base**: `surface` (fundo geral)
2. **Conteúdo recesso**: `surface_container` (`--muted`)
3. **Elementos flutuantes**: `surface_container_lowest` (`--card`, branco) — para cards que precisam "saltar" da superfície de base.

### Vidro e gradiente
Para a UI não parecer chapada, use glassmorphism em barras de navegação e modais flutuantes: `surface_container_low` a 80% de opacidade com `20px` de backdrop-blur (classe `.glass-panel`). Para heros ou CTAs primários, um gradiente sutil de `primary` para `primary_container` a 135° adiciona profundidade "silk-screen" que cores chapadas não têm.

---

## 3. Tipografia

Duas famílias, papéis bem separados — a dupla serifada/sans reforça a identidade "ateliê editorial" em vez de uma família de UI genérica cobrindo tudo:

- **`--font-display` (Fraunces)**: serifada, só em títulos, headlines e no wordmark da logo. Hospedada localmente em [`src/styles/fonts/`](../src/styles/fonts/) (ver [`fonts.css`](../src/styles/fonts.css)) em vez de um `<link>` do Google Fonts — o app já se vende como "processamento 100% local, sem cookies", então buscar fonte de um domínio externo a cada carga contradiz essa proposta. É uma fonte variável; o `@font-face` cobre uma faixa de peso (`400 600`) em vez de declarar cada peso num arquivo separado.
- **`--font-sans` (Public Sans)**: sans, usada em todo o resto — corpo de texto, labels, UI densa (sidebar, controles, badges). Serifada em tamanho pequeno perde legibilidade; por isso a UI funcional fica inteira em sans.

Escala (classes em [`styles.css`](../src/styles.css)):

- **`.display-sm`** (`clamp(1.9rem, 4.2vw, 3rem)`, Fraunces, `-0.01em` de tracking, `text-wrap: balance`): título do hero da landing.
- **`.headline-md`** (1.45rem, Fraunces, `-0.01em` de tracking): cabeçalhos de seção ("Como funciona") — texto normal, não caixa alta; mais editorial que um "eyebrow label" genérico.
- **`.title-md`** (1.25rem, Public Sans, negrito): títulos de UI densa (nomes de arquivo, cabeçalhos de sidebar).
- **`.body-large`** / **`.body-md`** (1.125rem / 1rem, Public Sans): usa `muted-foreground` em vez de preto puro, pra manter a suavidade "orgânica" contra o fundo.
- **`.label-sm`** (0.875rem, Public Sans, maiúsculo, `+0.08em` de tracking): sensação de "arquivo etiquetado".

---

## 4. Elevação e Profundidade

Hierarquia vem de **camadas tonais**, não de sombra.

- **Princípio de camadas**: para "levantar" um card, não recorra a sombra primeiro — coloque um `surface_container_lowest` sobre um `surface_container`.
- **Sombras ambiente**: quando um estado flutuante é necessário (ex.: dropdown), use uma sombra com tingimento quente (classe `.ambient-shadow`, `hsl(var(--secondary) / 0.08)`, 32px de blur, 12px de deslocamento Y) — imita luz natural refletindo em tons terrosos.
- **Fallback "ghost border"**: se acessibilidade exigir um traço, use `outline_variant` a 15% de opacidade (classe `.ghost-border`) — deve ser sentido, não visto.

---

## 5. Componentes

Botões, campos e tooltips vêm do **[Taiga UI](https://taiga-ui.dev)** (Apache-2.0, sem chave de licença). O PrimeNG foi testado e descartado: da v18 em diante ele exige chave de licença PrimeUI (mesmo no plano gratuito) e mostra um aviso na tela sem ela.

O Taiga **não tem modo "sem estilo"**: cada componente injeta o próprio CSS, que vence classes Tailwind escritas no elemento. Por isso **não se estiliza um componente do Taiga com classes Tailwind** — usa-se a API dele (`appearance`, `size`) e o tema:

- **Tema**: [`src/styles/taiga-theme.css`](../src/styles/taiga-theme.css) aponta as variáveis `--tui-*` pros tokens de `colors.css`/`fonts.css` (trocar a paleta lá já muda os componentes). Carrega depois de `taiga-ui-theme.less` (ordem em `angular.json`). O `taiga-ui-fonts.less` do Taiga ficou de fora de propósito: ele baixa a fonte Manrope do Google Fonts, o que contradiz o "processamento 100% local".
- **Ícones**: o app usa os próprios (`<app-icon>`), projetados dentro dos botões. O pacote `@taiga-ui/icons` não está instalado; por isso o botão "limpar" dos campos está desligado em `app.config.ts`.

### Botões (`tuiButton` / `tuiIconButton`)
- **Ação principal** ("Ver resultado", "Baixar PDF", "Escolher arquivo"): `appearance="primary"` — dourado (`--tui-background-accent-1` = `secondary`).
- **Ação secundária** ("Salvar" favorito): `appearance="secondary"`.
- **Ações discretas** (voltar, "Favoritos", zerar margens, zoom, remover arquivo): `appearance="flat"`.
- Botões só com ícone (`tuiIconButton`) sempre levam `aria-label`.

### Editor (tela depois de abrir o PDF)
Layout "foco no documento": a página ocupa a tela; no topo ficam o arquivo, a chave **Original / Resultado** (`tui-segmented`) e o zoom; embaixo, uma **barra flutuante** (`role="toolbar"`) com as quatro margens, o menu de **Favoritos** (`tuiDropdown`, abrindo pra cima) e a ação principal. "Resultado" só fica disponível enquanto o PDF processado corresponde às margens da tela — qualquer mudança de margem volta pro original e troca "Baixar PDF" por "Ver resultado". Campo de margem com valor > 0 fica dourado (`.margin-on`, em `taiga-theme.css`), a mesma cor das bordas hachuradas na página.

Números (zoom, régua, margens) usam a Public Sans com `tabular-nums` — nunca a fonte monoespaçada do sistema.

### Cards
Zero bordas. Padding interno generoso; quando há múltiplos cards, o espaçamento entre eles (não uma borda) é o que separa visualmente, deixando o fundo atuar como separador natural.

### Campos de entrada (`tui-textfield`)
Texto livre: `<input tuiInput>`. Números (margens): `<input tuiInputNumber [min] [max] postfix=" pt">` — o próprio Taiga limita ao mínimo/máximo, sem clamping manual. Todo campo sem `<label>` visível leva `aria-label`.

### Chips e tags
Fundo `primary_container`, texto `on_primary_container`, formato pílula completa.

---

## 6. O que fazer e o que evitar

**Fazer:**
- Padding assimétrico (ex.: mais à esquerda que à direita em heros) para um visual editorial, não "templateado".
- Abraçar espaço em branco: se parece que falta uma linha divisória, dobre o espaçamento vertical em vez de desenhar a linha.
- Tingir todos os "cinzas": cinza puro (`#808080`) não tem lugar aqui — use tons neutros derivados da própria paleta (`--muted-foreground`, `--border`).

**Evitar:**
- Bordas sólidas de 1px — é o jeito mais rápido de fazer um sistema premium parecer um dashboard genérico.
- Preto puro — sempre usar `--foreground` ou `--primary`.
- Sombras padrão (o "halo cinza turvo") — se algo precisa flutuar, precisa de um tingimento quente ambiente.

---

## 7. Logo

Conceito: **marcas de corte** (crop marks) — o símbolo de pré-impressão usado pra marcar onde uma página será cortada, aplicado diretamente à função do app (cortar margens de PDF). Não é um ícone de "arquivo" genérico; é um símbolo que já significa "corte" antes de qualquer contexto de marca.

**Forma**: 4 brackets em L, um em cada canto de um quadrado, insetados da borda (não encostam nos cantos do viewBox) — igual a mirar os cantos de uma página antes de cortar. Traços com `stroke-linecap="round"` e `stroke-linejoin="round"`, sem preenchimento.

**Cor**: 3 cantos em creme/branco (`currentColor`, herda branco quando usado sobre o tile `bg-primary`), 1 canto (inferior-direito) em dourado (`--secondary`) — o toque assimétrico intencional já defendido na seção 6 ("Fazer: padding assimétrico"), aplicado agora à marca em vez de só ao layout.

**Implementação**: componente único, [`src/app/ui/logo/logo.ts`](../src/app/ui/logo/logo.ts) (`<app-logo [size]="18" />`), reusado em dois lugares — não duas versões divergentes do mesmo mark:
- **Header** (`app.html`): dentro do mesmo tile `bg-primary rounded-2xl rotate-3` que a UI já usava para o ícone antigo — a leve rotação do tile lembra um carimbo de tinta, reforçando a metáfora "ateliê"/"ficha".
- **Favicon** ([`public/favicon.svg`](../public/favicon.svg)): mesmo desenho, hardcoded em SVG estático porque o favicon não executa CSS do app (ver nota da seção 1.1 sobre sincronização manual de cor).

O wordmark ao lado abandonou o tratamento antigo (tudo maiúsculo, tracking largo, sans) em favor de `font-display` (Fraunces) itálico semi-negrito, caixa normal — "PDF Cleaner" como um nome assinado, não como um rótulo de dashboard. A legenda pequena embaixo ("Edition v2.0") continua em mono/sans, estilo carimbo de ficha.
