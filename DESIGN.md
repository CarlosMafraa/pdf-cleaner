# Design System Strategy: The Organic Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Atelier."** We are moving away from the rigid, sterile grids of bootstrap-era design and toward a high-end editorial experience that feels curated, tactile, and intentional. 

This system leverages the depth of **Deep Forest Green** and the warmth of **Soft Cream Skin** to create a workspace that feels like a premium heavy-stock paper journal. We achieve sophistication not through complexity, but through **intentional asymmetry** and **tonal layering**. Elements should never feel "pasted" on a page; they should feel like they are resting on or recessed into the surface.

---

## 2. Colors & Surface Philosophy
The palette is a balance of earth-toned grounding and sun-drenched highlights. 

*   **Primary (`#003629` / `#1B4D3E`):** Used for high-authority typography and structural anchors.
*   **Secondary (`#84531F` / `#C78C53`):** Reserved for "Moment of Action" highlights and primary buttons.
*   **Tertiary (`#5A1600` / `#D65A31`):** Used sparingly for micro-interactions, notifications, or "human" accents.
*   **Neutral Background (`#FFF8F0`):** The "Soft Cream Skin" base that provides a warm, low-eye-strain environment.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Layout boundaries must be achieved exclusively through background color shifts. 
*   *Example:* Place a `surface_container_low` section directly against a `surface` background. The subtle shift in hex code provides enough cognitive separation without the visual clutter of a line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper.
1.  **Base Layer:** `surface` (#FFF8F0)
2.  **Recessed Content:** `surface_container` (#F6EDDC)
3.  **Floating Elements:** `surface_container_lowest` (#FFFFFF) — use this for cards that need to "pop" off the cream background.

### The Glass & Gradient Rule
To prevent the UI from feeling flat, use **Glassmorphism** for navigation bars and floating modals.
*   **Spec:** Apply `surface_container_low` at 80% opacity with a `20px` backdrop-blur. 
*   **Signature Gradient:** For Hero backgrounds or Primary CTAs, use a subtle linear gradient from `primary` (#003629) to `primary_container` (#1B4D3E) at a 135-degree angle. This adds a "silk-screen" depth that flat colors lack.

---

## 3. Typography: The Editorial Voice
We use **Inter** not as a standard UI font, but as a modernist typeface. By playing with extreme scale contrasts, we create an editorial hierarchy.

*   **Display Large (3.5rem):** Set with `-0.02em` letter spacing. Use this for punchy, one-word anchors.
*   **Headline Medium (1.75rem):** The workhorse for section headers. Ensure `primary` color is used here to ground the page.
*   **Body Large (1rem):** Use `on_surface_variant` (#404945) rather than pure black to maintain the "organic" softness against the cream background.
*   **Label Medium (0.75rem):** Always Uppercase with `+0.05em` tracking for a "labeled archive" feel.

---

## 4. Elevation & Depth
Hierarchy is achieved through **Tonal Layering**, not shadows.

*   **The Layering Principle:** To lift a card, do not reach for a shadow first. Instead, place a `surface_container_lowest` card on top of a `surface_container` background.
*   **Ambient Shadows:** If a floating state is required (e.g., a dropdown), use a "Sun Gold" tinted shadow: `rgba(132, 83, 31, 0.08)` with a `32px` blur and `12px` Y-offset. This mimics natural light reflecting off the terracotta tones.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline_variant` (#C0C9C3) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Background `secondary`, Text `on_secondary`. 
    *   *Style:* 16px (xl) corner radius. No border.
*   **Secondary:** Background `transparent`, Border `ghost_border` (outline_variant @ 20%), Text `primary`.
*   **Tertiary:** Text `tertiary` (#5A1600) with a 2px underline offset by 4px.

### Cards
*   **Constraint:** Zero borders. 
*   **Structure:** Use `spacing.6` (2rem) internal padding. If multiple cards are present, use `spacing.4` (1.4rem) gaps to allow the cream background to act as a natural separator.

### Input Fields
*   **State:** Soft-filled. Use `surface_variant` (#EAE2D1) as the background. 
*   **Focus:** Transition background to `surface_container_lowest` (#FFFFFF) and add a 1px `secondary` (#84531F) ghost border.

### Chips & Tags
*   **Selection:** Use `primary_container` (#1B4D3E) with `on_primary_container` (#8ABDA9) text. 
*   **Shape:** Full pill (`roundness.full`).

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetric Padding:** Try using `spacing.12` on the left and `spacing.8` on the right for hero sections to create an editorial, non-templated look.
*   **Embrace Whitespace:** If you think you need a divider line, double the vertical spacing (`spacing.10` or `12`) instead.
*   **Color-Tint Everything:** Ensure your "greys" are actually muted greens (`outline`) or muted creams (`surface_dim`). Pure #808080 has no place here.

### Don’t:
*   **Don't use 1px Borders:** This is the quickest way to make a premium system look like a generic dashboard.
*   **Don't use Pure Black:** High-contrast black on cream is jarring. Always use `on_surface` (#1F1B11) or `primary` (#003629).
*   **Don't use Standard Shadows:** Avoid the "fuzzy grey halo." If an element needs to float, it needs a warm, ambient tint.