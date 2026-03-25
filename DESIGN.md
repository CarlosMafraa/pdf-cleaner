# Design System Strategy: The Silent Architect

## 1. Overview & Creative North Star
The creative North Star for this design system is **"The Silent Architect."** 

In the world of professional PDF utility, the interface should never compete with the document. This system moves beyond "minimalism" into "editorial precision." We are not building a tool; we are building a high-end digital desk. The aesthetic is defined by intentional asymmetry, high-contrast typographic scales, and an obsession with white space that mimics the margins of a premium architectural journal. 

By utilizing "The Silent Architect" approach, we break the generic "SaaS template" look. We reject 1px borders and rigid grids in favor of tonal depth and layered surfaces that guide the eye without shouting for attention.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a "Deep Emerald" primary and "Slate Gray" secondary, but the sophistication lies in the neutral transitions.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. 
Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` (#f3f4f5) sidebar sitting against a `surface` (#f8f9fa) canvas creates a clean, sophisticated break that feels structural rather than "drawn."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-paper sheets. 
- **Base Level:** `surface` (#f8f9fa)
- **Secondary Utility:** `surface-container-low` (#f3f4f5)
- **Active Workspace/Cards:** `surface-container-lowest` (#ffffff) to provide a soft "pop" of clarity.

### The "Glass & Gradient" Rule
To avoid a flat, "budget" feel, use **Glassmorphism** for floating elements (like document toolbars or hover menus). Apply `surface-container-lowest` at 80% opacity with a `24px` backdrop blur. 
**Signature Texture:** Main CTAs or active progress bars should use a subtle linear gradient from `primary` (#006948) to `primary-container` (#00855d) at a 135-degree angle. This adds a "soul" to the green that flat hex codes lack.

---

## 3. Typography: Editorial Authority
We use **Inter** not as a system font, but as a brand statement. The hierarchy relies on extreme contrast between `display` sizes and `label` sizes.

- **Display & Headlines:** Use `display-sm` (2.25rem) for main dashboard greetings or empty states. The tracking should be tightened (-0.02em) to feel "locked in."
- **Titles:** `title-md` (1.125rem) is our workhorse for document names. Use `on_surface` (#191c1d) for maximum legibility.
- **Body & Labels:** `body-md` (0.875rem) uses `on_surface_variant` (#3d4a42) for secondary information. This slight green-grey tint ensures the text feels integrated into the brand rather than a generic grey.
- **Micro-Copy:** `label-sm` (0.6875rem) should be used in All-Caps with +0.05em letter spacing for metadata (e.g., "FILE SIZE", "LAST EDITED") to evoke a technical, professional blueprint feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "loud" for a silent interface. We achieve depth through atmospheric light.

### The Layering Principle
Instead of a shadow, place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f3f4f5) background. The `0.5rem` (8px) difference in the spacing scale between the card edge and the container edge creates a "soft lift" that is felt rather than seen.

### Ambient Shadows
When an element must float (e.g., a Modal or a context menu), use an **Ambient Shadow**:
- **X/Y:** 0, 12px
- **Blur:** 32px
- **Color:** `on_surface` (#191c1d) at 4% opacity. 
This mimics natural light falling on thick paper.

### The "Ghost Border" Fallback
If accessibility requires a container definition (e.g., a text input), use a **Ghost Border**: `outline-variant` (#bccac0) at 20% opacity. 

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`). `12px` (md) rounded corners. Text is `on_primary` (#ffffff).
- **Secondary:** `surface-container-high` (#e7e8e9) background. No border. Text is `primary` (#006948).
- **Tertiary:** No background. Text is `secondary` (#515f74). 

### Cards & Lists
**Strict Rule:** No dividers. Separate list items using `spacing-4` (1.4rem) of vertical white space. If the list is dense, use alternating backgrounds between `surface` and `surface-container-low`.

### Input Fields
Soft containers using `surface-container-highest` (#e1e3e4). When focused, the background shifts to `surface-container-lowest` (#ffffff) with a `primary` (#006948) ghost border (20% opacity).

### Floating Utility Bar (App Specific)
A central, bottom-anchored bar for PDF tools (Merge, Split, Compress). Use the **Glassmorphism** rule: `surface-container-lowest` at 85% opacity, `20px` blur, and a `12px` (md) corner radius. This keeps the document visible behind the tools, maintaining the "Professional Utility" context.

---

## 6. Do’s and Don’ts

### Do
- **Do** use `spacing-12` (4rem) or `spacing-16` (5.5rem) for page margins to create an editorial feel.
- **Do** use the `primary-fixed-dim` (#68dba9) for success states or subtle highlights.
- **Do** align all text to a strict baseline grid to maintain architectural "silence."

### Don’t
- **Don't** use 100% black (#000000). Always use `on_surface` (#191c1d).
- **Don't** use "Drop Shadows" from standard software defaults. Use the Ambient Shadow formula.
- **Don't** use lines to separate content. Let the "Deep Emerald" primary accents and background shifts do the work.
- **Don't** crowd the interface. If a screen feels "busy," double the white space between sections.