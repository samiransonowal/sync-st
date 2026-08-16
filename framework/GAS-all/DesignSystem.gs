/**
 * Studio Tunnel Design System & Typography Specifications
 * Program: ST-fin-com-prog (v0.2 inclusion)
 * Format: GAS-Compatible Object Schema (JSON-like)
 * 
 * Instructions:
 * Use these constants across HTML templates (HTMLTemplate.html),
 * Apps Script PDF builders, Google Sheets formatting scripts,
 * and Looker Studio theme properties.
 */

var DESIGN_SYSTEM = {
  // --------------------------------------------------------------------------
  // 🔤 TYPOGRAPHY SPECIFICATION
  // --------------------------------------------------------------------------
  typography: {
    fontFamily: "'Lexend', sans-serif",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap",
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700
    }
  },

  // --------------------------------------------------------------------------
  // 🎨 COLOR PALETTE SPECIFICATION
  // --------------------------------------------------------------------------
  colors: {
    // Backgrounds (Pure White permitted ONLY for paper/invoice backgrounds)
    background: {
      pureWhite: "#FFFFFF",        // 100% White (Backgrounds only)
      offWhite: "#FAFAFA",         // Soft subtle background tint
      darkModeBackground: "#121212"// Sleek dark mode background
    },

    // Text Colors (STRICT RULE: Pure #000000 and Pure #FFFFFF prohibited for body text)
    text: {
      darkestBlack: "#1A1A1A",    // 90% Gray (Used for primary headings, dark text, and table values)
      bodyDark: "#2D2D2D",        // 80% Gray (Used for standard body text)
      subtleMuted: "#666666",      // 60% Gray (Used for captions, HSN codes, dates)
      lightestWhite: "#CCCCCC"     // 20% Gray (Used ONLY for text on dark backgrounds - NEVER pure #FFFFFF)
    },

    // Brand Colors (Studio Tunnel Theme)
    brand: {
      primaryGreen: "#008738",    // Studio Tunnel Signature Green
      darkGreen: "#005F27",       // Deep Accent Green
      lightGreenTint: "#E6F4ED"   // Soft table row highlight tint
    },

    // UI Borders & Dividers
    borders: {
      lightDivider: "#E0E0E0",    // Subtle table border line
      darkDivider: "#333333"      // Dark mode divider line
    }
  },

  // --------------------------------------------------------------------------
  // 📄 PRINT & VECTOR PDF SPECIFICATION
  // --------------------------------------------------------------------------
  print: {
    pageSize: "A4",
    margins: "15mm 15mm 15mm 15mm",
    dpi: 300
  }
};

/* ============================================================================
 * 🛠️ HOW TO USE THIS DESIGN SYSTEM IN YOUR CODE:
 * ============================================================================
 * 
 * 1. IN HTML/CSS TEMPLATES (HTMLTemplate.html):
 *    Import the Lexend Google Font in your <head>:
 *      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet">
 * 
 *    Apply CSS rules enforcing the color contrast constraints:
 *      body {
 *        font-family: 'Lexend', sans-serif;
 *        background-color: #FFFFFF; /* Pure White background allowed * /
 *        color: #1A1A1A;            /* 90% Gray for primary text (NO pure #000000) * /
 *      }
 *      .dark-card {
 *        background-color: #1A1A1A;
 *        color: #CCCCCC;            /* 20% Gray for light text (NO pure #FFFFFF) * /
 *      }
 * 
 * 2. IN APPS SCRIPT SPREADSHEET FORMATTING (4_MenuUI.gs / 3_PdfAndEmailer.gs):
 *    Access the properties directly in Javascript:
 *      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *      sheet.getRange("A1:Z1").setFontFamily(DESIGN_SYSTEM.typography.fontFamily);
 *      sheet.getRange("A1:Z1").setFontColor(DESIGN_SYSTEM.colors.text.darkestBlack);
 *      sheet.getRange("A1:Z1").setBackground(DESIGN_SYSTEM.colors.background.pureWhite);
 * 
 * 3. IN GOOGLE LOOKER STUDIO DASHBOARDS:
 *    Set the primary theme font to 'Lexend'.
 *    Set primary text metric cards to #1A1A1A (90% Gray) and background cards to #FFFFFF.
 * ============================================================================ */
