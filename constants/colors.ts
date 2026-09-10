/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#2c201b',
    tint: '#567a91',

    // Core surfaces
    background: '#fbf8f2',
    foreground: '#2c201b',

    // Cards / elevated surfaces
    card: '#f2ede4',
    cardForeground: '#2c201b',

    // Primary action color (buttons, links, active states)
    primary: '#567a91',
    primaryForeground: '#fbf8f2',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e7dfd2',
    secondaryForeground: '#47342b',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#eee8de',
    mutedForeground: '#796f67',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#dce7eb',
    accentForeground: '#315367',

    // Destructive actions (delete, error states)
    destructive: '#ad5e4d',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#ded5c8',
    input: '#d7cdc0',

    // Product accents
    coffee: '#9a684d',
    coffeeDeep: '#58392d',
    blue: '#567a91',
    blueSoft: '#dce7eb',
    cream: '#fbf8f2',
    success: '#637d68',
  },

  dark: {
    text: '#f6efe6',
    tint: '#9db9c7',
    background: '#211b18',
    foreground: '#f6efe6',
    card: '#302722',
    cardForeground: '#f6efe6',
    primary: '#9db9c7',
    primaryForeground: '#211b18',
    secondary: '#473932',
    secondaryForeground: '#f6efe6',
    muted: '#3b302b',
    mutedForeground: '#b8aaa0',
    accent: '#29404e',
    accentForeground: '#cbe0e8',
    destructive: '#d88a77',
    destructiveForeground: '#211b18',
    border: '#4a3d35',
    input: '#4a3d35',
    coffee: '#d29a76',
    coffeeDeep: '#e9c2a3',
    blue: '#9db9c7',
    blueSoft: '#29404e',
    cream: '#211b18',
    success: '#a9c3ad',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
