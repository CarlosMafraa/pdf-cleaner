# The Design System: High-End Editorial Specification

## 1. Overview & Creative North Star: "The Silent Architect"
This design system is built on the philosophy of **The Silent Architect**. It rejects the noisy, over-stimulated patterns of "Standard SaaS" in favor of a high-end editorial experience. It is professional, disciplined, and sophisticated.

The goal is to move beyond the grid. We achieve a "custom" feel through **intentional asymmetry**, generous white space, and a hierarchy driven by tonal shifts rather than structural lines. The interface should feel like a premium printed monograph: authoritative, calm, and meticulously composed.

**Key Principles:**
*   **Low Visual Noise:** If an element doesn't serve a functional purpose, it is removed.
*   **Tonal Layering:** Depth is created through surface shifts, not borders.
*   **Editorial Scale:** Bold typographic contrast between massive display headers and precise, legible body text.

---

## 2. Colors & Surface Logic
The palette is a study in neutrals. We use a range of cool grays and off-whites to create a sophisticated, monochromatic environment.

### The "No-Line" Rule
**1px solid borders are strictly prohibited for sectioning.** To separate the sidebar from the main content, or a header from a body, use a background color shift (e.g., `surface-container-low` against a `background` page). 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Hierarchy is defined by "nesting" tokens:
*   **Page Background:** `surface` (#f9f9f9)
*   **Main Content Area:** `surface-container-low` (#f2f4f4)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Elevated Overlays:** `surface-container-high` (#e4e9ea) with backdrop blur.

### Signature Palette
*   **Primary Text:** `on_surface` (#2d3435) - Use for high-readability.
*   **Secondary Text:** `on_surface_variant` (#5a6061) - Use for metadata and hints.
*   **The Highlight:** `primary` (#565e74) - A muted blue-gray used sparingly for focus states and primary actions.

---

## 3. Typography: The Inter Monograph
We utilize **Inter** exclusively, but we treat it with editorial intent. The "High-End" feel comes from the extreme variance between `display` and `label` sizes.

*   **Display (lg/md):** Letter-spacing set to `-0.02em`. Used for "Hero" moments or dashboard summaries. It should feel architectural.
*   **Headline (sm):** The workhorse for section titles. Always `500` weight.
*   **Body (md):** Main reading content. Standard `400` weight with a generous line-height (1.6) to ensure an editorial, "airy" feel.
*   **Label (sm/md):** All-caps with `0.05em` letter-spacing. Use this for category headers or small UI hints to create a "technical" contrast against the soft body text.

---

## 4. Elevation & Depth
In this system, depth is "felt," not "seen." We avoid heavy drop shadows in favor of light and translucency.

### The Layering Principle
Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. The 2% difference in hex value is enough for the human eye to perceive a "lift" without the "mud" of a shadow.

### Ambient Shadows
For floating elements (Modals, Popovers), use a "Whisper Shadow":
*   **Shadow:** `0px 12px 32px rgba(45, 52, 53, 0.04)`
*   The shadow color is derived from `on_surface`, creating a natural ambient occlusion rather than a generic gray smudge.

### The Ghost Border
If an edge is functionally required for accessibility, use a **Ghost Border**:
*   `outline-variant` (#adb3b4) at **15% opacity**.
*   It should be barely perceptible, serving only to guide the eye in high-density areas.

---

## 5. Components

### Buttons
*   **Primary:** Background: `primary` (#565e74), Text: `on_primary` (#f7f7ff). Corner radius: `md` (12px). No shadow.
*   **Secondary:** Background: `surface-container-highest` (#dde4e5), Text: `on_surface` (#2d3435).
*   **Tertiary:** Text-only with an underline that appears on hover.

### Input Fields
*   **Style:** Background: `surface-container-lowest` (#ffffff).
*   **Border:** `outline_variant` at 20% opacity.
*   **Focus:** Border becomes `primary` (#565e74) at 100% opacity. No "glow" effects.

### Cards
*   **Rules:** No borders. No dividers.
*   **Separation:** Use `spacing-6` (2rem) as the default internal padding. Use vertical white space from the spacing scale (`8`, `12`) to separate content sections within the card rather than lines.

### Chips
*   Used for filtering. Background: `surface-container-low`, Corner Radius: `full`. Text: `label-md`. 

### Specialized Component: The "Content Ledger"
Instead of a standard Table, use a "Ledger" style. Rows are separated by a 24px gap (`spacing-6`). The "header" is small `label-sm` text. The row itself is a `surface-container-low` strip with a radius of `sm`. It feels like a list of curated items rather than a database export.

---

## 6. Do’s and Don'ts

### Do:
*   **Embrace Asymmetry:** Align a header to the far left and the action button to the far right, leaving a "void" in the center to create an editorial feel.
*   **Use Large Radius:** Stick to `lg` (16px) for main containers and `md` (12px) for buttons. It softens the "professional tool" into something human.
*   **Trust the Spacing:** When in doubt, add more white space. Use `spacing-16` (5.5rem) for section breaks.

### Don't:
*   **No 1px Dividers:** Never use a line to separate "Header" from "Body." Use a background tint or whitespace.
*   **No Purple/Gradients:** Keep the palette strictly neutral. The "soul" comes from the blue-gray `primary` and the off-white textures.
*   **No High-Contrast Borders:** Avoid `outline` at 100% opacity. It breaks the "Silent Architect" immersion.
*   **No Standard Grids:** Avoid the "Dashboard Card Soup" (3x3 grid of identical boxes). Vary card widths (e.g., one card at 66% width, another at 33%).