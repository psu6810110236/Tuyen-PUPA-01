---
name: TUYEN (Smart Fridge Chef)
description: Premium, home-friendly, soft-tactile, and mobile-first kitchen assistant design system.
colors:
  primary: "#5C7CFA"
  primary-foreground: "#ffffff"
  secondary: "#748FFC"
  secondary-foreground: "#ffffff"
  neutral-bg: "#F5F7FB"
  neutral-foreground: "#1A1F36"
  outline: "#E5E8EE"
  surface: "#ffffff"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "clamp(1.75rem, 5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  base: "8px"
  gutter: "16px"
  container-padding: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.2xl}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#4263EB"
  card-standard:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.container-padding}"
---

# Design System: TUYEN (Smart Fridge Chef)

## 1. Overview

**Creative North Star: "The Clean Kitchen Sanctuary"**

TUYEN is designed to be a premium, home-friendly kitchen assistant that feels exceptionally clean, tactile, and responsive. Optimized strictly for mobile screens, it avoids the cold, clinical feel of SaaS tools by using a vibrant Indigo-Blue primary color paired with soft-tactile, white-surfaced cards that sport clean 2px borders and welcoming light blue shadows.

This design system explicitly rejects boring, cookie-cutter dashboard templates and generic utility apps that require excessive clicks or complex menus. Spacing is airy and layout flows naturally to give a breathable, home-friendly feeling.

**Key Characteristics:**
- **Soft-Tactile Warmth:** Soft blue shadows (`shadow-soft-blue`) and thick white borders (`border-2 border-white`) that make elements pop.
- **Vibrant Blue Accent:** Cool Indigo-Blue (`#5C7CFA`) as the guiding interactive hue.
- **Airy Breathing Room:** Generous paddings and margins for easy reading on mobile in busy kitchen settings.
- **High Readability:** Highly legible fonts paired with strong contrast.

## 2. Colors

The color palette is built on "Tinted Neutrals" and soft blue accents, avoiding dark mode by default to promote a bright, clean kitchen atmosphere.

### Primary
- **Cool Indigo-Blue** (`#5C7CFA`): The primary brand and action color. Used for key interactive controls, CTA buttons, and highlighted highlights.

### Secondary
- **Slate Periwinkle** (`#748FFC`): A softer supporting periwinkle shade. Used for secondary statuses, inactive interactive cues, and subtle indicators.

### Neutral
- **Clean Slate Ink** (`#1A1F36`): The standard dark body text color. Strong contrast without using harsh pure black.
- **Pantry Off-White** (`#F5F7FB`): The main background color. Clean, slightly cool-tinted to feel fresh.
- **Surface Pure White** (`#ffffff`): The card and button background color. Always framed with a 2px white border on top of the pantry background to create soft contrast.
- **Cool Gray Border** (`#E5E8EE`): Used for divider lines and subtle inputs.

### Named Rules
**The Tinted Neutral Rule.** Every background or neutral tone must carry a subtle cool-indigo tint (chroma ~0.01 in OKLCH) to feel premium. Never use pure, flat, un-tinted gray (`#808080`) or clinical black.
**The Blue Accent Budget Rule.** The vibrant Cool Indigo-Blue accent must not cover more than 15% of any given screen. Its effectiveness depends on its rarity as a focal pointer.

## 3. Typography

**Display Font:** Plus Jakarta Sans (sans-serif)
**Body Font:** Inter (sans-serif)
**Label/Mono Font:** IBM Plex Sans Thai (sans-serif)

**Character:** A pairing of geometric modern elegance (Plus Jakarta Sans) with highly readable Thai/English sans serif body text (IBM Plex Sans Thai and Inter).

### Hierarchy
- **Display** (Bold (700), `clamp(1.75rem, 5vw, 2.5rem)`, 1.2): Main headings, big welcome stats.
- **Headline** (SemiBold (600), `1.25rem`, 1.3): Section headers, drawer titles.
- **Title** (Medium (500), `1.125rem`, 1.4): Card headings, sub-features.
- **Body** (Regular (400), `1rem`, 1.5): Standard paragraphs, ingredients lists. Max line length capped at 65ch.
- **Label** (Medium (500), `0.875rem`, 0.05em, uppercase): Button labels, small metadata, captions.

## 4. Elevation

The system relies on a hybrid of structural borders and soft, tinted shadows to create depth. Elements feel tactile, as if resting on a clean kitchen counter.

### Shadow Vocabulary
- **Soft Blue Shadow** (`0px 8px 32px rgba(92, 124, 250, 0.10), 0px 2px 8px rgba(26, 31, 54, 0.04)`): Applied to cards, active headers, and primary FAB buttons.
- **Elevated Hover Shadow** (`0 12px 24px -4px rgba(92, 124, 250, 0.12), 0 4px 8px -4px rgba(26, 31, 54, 0.04)`): Applied when an interactive card is hovered or tapped to indicate lift.

### Named Rules
**The Soft-Tactile Layering Rule.** Depth is created by layering a pure white surface (`#ffffff`) over a pantry off-white background (`#F5F7FB`), bordered by a solid 2px white outline (`border-2 border-white`) and cast with a soft blue shadow (`shadow-soft-blue`).

## 5. Components

### Buttons
- **Shape:** Rounded-xl/3xl (16px to 24px) for a soft-tactile feel.
- **Primary:** Background in Cool Indigo-Blue (`#5C7CFA`), text in white, padded with `12px 24px` (`px-6 py-3`).
- **Hover / Focus:** Transitions smoothly via `transition-airy` to deep blue (`#4263EB`). Hover shifts the button slightly up.

### Cards / Containers
- **Corner Style:** Rounded-lg/xl (12px to 16px).
- **Background:** Surface Pure White (`#ffffff`).
- **Shadow Strategy:** Soft Blue Shadow (`shadow-soft-blue`).
- **Border:** Solid 2px white border (`border-2 border-white`) to pop off the light gray background.
- **Internal Padding:** Spacing container padding (24px).

### Inputs / Fields
- **Style:** Background white, outline border 2px cool gray (`#E5E8EE`), rounded-md (8px).
- **Focus:** Border shifts to Cool Indigo-Blue (`#5C7CFA`) with a soft blue shadow glow.

### Navigation
- **Style:** Sticky top header and bottom nav bar on mobile. Uses icons and Thai labels with active state indicators highlighted in Cool Indigo-Blue.

### Signature Component: Floating Action Button (FAB)
- **Style:** A large circular button (`h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-soft-blue`) at the bottom center of the viewport for zero-friction grocery photo-scanning.

## 6. Do's and Don'ts

### Do:
- **Do** wrap all major content cards with a `border-2 border-white` and apply `shadow-soft-blue`.
- **Do** use `IBM Plex Sans Thai` for native Thai translations to keep typography clean and legible.
- **Do** cap body text line lengths at 65ch to reduce reading strain in kitchen environments.
- **Do** use smooth, cubic-bezier state transitions (`transition-airy`) on interactive buttons and list items.

### Don't:
- **Don't** use boring, cookie-cutter dashboard templates.
- **Don't** build generic utility apps that require excessive clicks or complex menus.
- **Don't** use side-stripe borders (border-left or border-right > 1px as accent) on list items or cards.
- **Don't** use gradient text or glassmorphism as a default style.
- **Don't** use tiny uppercase tracked eyebrows above sections.
- **Don't** animate `<img>` elements on hover or transform them.
- **Don't** use pure black/dark gray (`#000000` or `#111111`) for body text; always use Clean Slate Ink (`#1A1F36`).
