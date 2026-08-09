---
version: 1.0.0
name: Woodpecker Operations Design System
description: UI contract for the Woodpecker CI workspace and infrastructure/deployment control plane, grounded in the functional prototype and current Vue application.
colors:
  primary: "#25c267"
  primary-strong: "#16a653"
  info: "#4c8dff"
  success: "#28c76f"
  warning: "#ffb548"
  danger: "#ff5d61"
  light-app: "#f4f7f8"
  light-surface: "#ffffff"
  light-border: "#dce5e9"
  light-text: "#15232d"
  dark-app: "#081017"
  dark-surface: "#0e1923"
  dark-border: "#22323f"
  dark-text: "#edf5f7"
typography:
  heading-24:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
    letterSpacing: -0.4px
  heading-18:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 700
    lineHeight: 26px
    letterSpacing: -0.2px
  label-14:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0
  copy-14:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
    letterSpacing: 0
  data-13:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 19px
    letterSpacing: 0
  mono-12:
    fontFamily: ui-monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0
  button-14:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
rounded:
  sm: 7px
  md: 11px
  lg: 16px
  pill: 999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.dark-app}"
    typography: "{typography.button-14}"
    rounded: "{rounded.sm}"
    height: 38px
  button-secondary:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    typography: "{typography.button-14}"
    rounded: "{rounded.sm}"
    height: 38px
  input:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    typography: "{typography.copy-14}"
    rounded: "{rounded.sm}"
    height: 38px
  card:
    backgroundColor: "{colors.dark-surface}"
    borderColor: "{colors.dark-border}"
    rounded: "{rounded.md}"
  badge:
    typography: "{typography.data-13}"
    rounded: "{rounded.pill}"
---

# Woodpecker Operations Design System

## Overview

The approved visual source is `woodpecker-functional-prototype-with-ops/`. Production UI must preserve Woodpecker's CI workflows while matching the prototype's operational shell, information density, state vocabulary, and responsive behavior. Existing tokens in `web/src/style.css` and `web/src/tailwind.css` are the production source of truth; new work extends those tokens instead of introducing a parallel design system.

## Colors

Brand actions use green, informational actions use blue, warnings use amber, and destructive actions use red. Every status color must be paired with text or an icon. Light and dark themes use equivalent semantic layers: app background, sidebar/topbar, card surface, nested surface, border, primary text, secondary text, and muted text. Page-local hex colors are forbidden unless first promoted to a semantic token.

## Typography

The current application uses Inter with platform fallbacks. Headings are compact and bold; body copy is 14px; dense tables and metadata use 11-13px; logs, configuration, commit identifiers, IP addresses, and commands use a monospace stack. Operational pages prioritize scanability over oversized marketing typography.

## Layout

Desktop shell uses a 248px sidebar and 64px topbar. Page content uses a responsive grid with 16-24px outer padding, 12-16px panel gaps, and full-width tables inside horizontally scrollable containers. At tablet widths the grid collapses before controls become unreadable. On mobile the sidebar becomes a drawer, tables remain scrollable, filters wrap, and primary actions remain reachable without horizontal page overflow.

Prototype coverage is all 67 documented routes and tab states in `woodpecker-functional-prototype-with-ops/ROUTES.md`. Delivery may be incremental, but each slice must record route/state coverage and visual evidence.

## Elevation & Depth

Use surface and border hierarchy first. Cards use the shared small shadow; drawers, popovers, and modals may use the stronger shared shadow. Sticky topbar and overlays use controlled z-index layers. Focus rings must remain visible in both themes. Heavy glow, glassmorphism, and arbitrary drop shadows are not part of the product language.

## Motion

Motion communicates navigation or state transition only: drawer entry, feed-sidebar entry, loading progress, deployment progress, and status changes. Normal duration is 150-300ms with ease-out. Avoid decorative looping motion. Respect reduced-motion preferences by removing nonessential transforms and transitions.

## Shapes

Controls use 7px radii, cards and tables use 11px radii, large dialogs use 16px radii, and badges/compact counters use pill radii. Avatars may be rounded rectangles or circles based on the existing component. A screen must not mix unrelated radius families.

## Components

Buttons, inputs, tables, cards, badges, tabs, filters, dialogs, toasts, empty states, skeleton/loading states, and navigation must use shared atomic/layout/ops components or shared global classes. Dense data tables use sticky or visually distinct headers, consistent row heights, explicit empty/loading/error states, and horizontally scrollable wrappers. Destructive actions require clear copy and existing confirmation patterns.

## Voice & Content

All user-visible copy goes through Vue i18n. Labels are concise operational language, not promotional prose. Status terms must be consistent across list, detail, audit, and action surfaces. Errors state what failed and what the user can do next. Empty states explain whether there is no data, no filter match, or insufficient permission.

## Theme & Internationalization

- Theme capability: `system` with resolved `light` and `dark` modes.
- Theme toggle policy: the topbar exposes direct light/dark switching; user settings additionally support `auto`, `light`, and `dark`.
- Prototype theme policy: review artifacts must cover dark mode and at least one representative light-mode screen.
- Internationalization: enabled through Vue i18n with lazy-loaded locale dictionaries.
- Supported locales: `ar`, `bar`, `bn`, `cs`, `de`, `en`, `eo`, `es`, `fi`, `fr`, `hi`, `hu`, `id`, `it`, `ja`, `ko`, `lv`, `nb-NO`, `nl`, `pl`, `pt`, `ru`, `th`, `uk`, `ur`, `zh-Hans`, `zh-Hant`.
- Default locale: browser locale when supported, otherwise its base language, with `en` as fallback.
- Prototype locale policy: route/state coverage uses Simplified Chinese for the user's review and English for fallback-copy verification.

## Do's and Don'ts

- Do use existing CSS variables, Tailwind mappings, shared components, and i18n keys.
- Do preserve responsive operation at desktop, tablet, and mobile widths.
- Do validate loading, empty, error, disabled, permission, and active states.
- Do pair status colors with text or icons.
- Don't introduce one-off colors, spacing, shadows, radii, or untranslated copy.
- Don't replace real API state with permanent prototype data in production.
- Don't declare prototype parity from a small screenshot subset; track all affected routes and states.
