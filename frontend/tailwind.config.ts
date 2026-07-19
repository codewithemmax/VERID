import type { Config } from "tailwindcss";

/**
 * Marketplace design system — "vibrant expressive" (see ui-context.md).
 *
 * The palette is deliberately clear of the green/amber/red status spectrum:
 * those three hues belong to Verid alone and are NOT defined here. If a
 * marketplace component ever needs green/amber/red, that is a bug — the color
 * rule in ui-context.md is what keeps Verid's status colors meaningful.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canvas & ink — warm, not white
        canvas: "#FBF5EC",
        surface: "#FFFFFF",
        tint: "#F3E3D0",
        ink: "#1C1420",
        "ink-soft": "#6C5F6E",
        line: "#E7DAC9",
        // Expressive brand palette — saturated, cool-leaning
        magenta: "#E22C8B",
        violet: "#6D3BF5",
        cyan: "#12B5C9",
        cobalt: "#2547E8",
        // Verid overlay tokens — cold instrument, never used in marketplace
        verid: {
          surface: "#0F1115",
          "surface-alt": "#1A1D24",
          border: "#2A2F3A",
          text: "#E8EAED",
          "text-dim": "#9AA0AA",
          clear: "#22C55E",
          caution: "#F59E0B",
          block: "#EF4444",
          unknown: "#6B7280",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        // Verid overlay typefaces — never used in marketplace components
        "verid-head": ["var(--font-verid-head)", "system-ui", "sans-serif"],
        "verid-body": ["var(--font-verid-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        lift: "0 18px 40px -18px rgba(28, 20, 32, 0.35)",
        "lift-sm": "0 8px 20px -12px rgba(28, 20, 32, 0.3)",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "verid-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "float-slow": "float-slow 7s ease-in-out infinite",
        "verid-pulse": "verid-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
