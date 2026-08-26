# 04 — Design System & PDF Technical Choice

## Overview

The visual design system and PDF print layout rules are defined in [`framework/GAS-all/DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/GAS-all/DesignSystem.gs) and [`framework/GAS-all/HTMLTemplate.html`](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/GAS-all/HTMLTemplate.html).

---

## Typography & Color Rules

1. **Typography:**
   - **Google Font:** `Lexend` (`'Lexend', sans-serif`). Loaded via Google Fonts CDN in all HTML templates.

2. **Color Contrast & Brand Rules:**
   - **Darkest Black Text:** `#1A1A1A` (*90% Gray* - used for main body text to reduce eye strain).
   - **Lightest White Text:** `#CCCCCC` (*20% Gray* - Used for text on dark table headers/rows).
   - **Pure White Background:** `#FFFFFF` (*Permitted for paper/invoice backgrounds*).
   - **Brand Accent Colors (Green):** The design system utilizes a specific shade of green as the primary brand color for highlights, headers, or borders (derived from the reference PDF document).

3. **Dual Output Generation:**
   - Every invoice generates both a viewable **`.html` web document** and an **A4 vector `.pdf` file** stored in Google Drive.
