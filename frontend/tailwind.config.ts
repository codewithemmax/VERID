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
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
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
      },
      animation: {
        "float-slow": "float-slow 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
