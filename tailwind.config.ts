import type { Config } from "tailwindcss";

// Archive District brand tokens — see claude/brand-identity.md (project docs)
// for the source palette/type spec. Steel (#B7BAC0) is intentionally NOT
// wired in here: the brand board calls it out as "hardware/foil — physical
// finishes only, not a screen color."
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Ink-based dark scale. 950/700/500/400 are exact brand hexes
        // (Ink, Asphalt, Concrete, Concrete Light); the rest are
        // interpolated steps between them for card/border/hover states.
        ink: {
          950: "#16130F", // Ink — primary ground
          900: "#1C1812",
          800: "#241F19", // card surfaces
          700: "#3A3733", // Asphalt — rules/dividers/secondary panels
          600: "#4A4640",
          500: "#56524C", // Concrete — body copy/metadata
          400: "#8E8A82", // Concrete Light — muted text on dark grounds
          300: "#C9C3B6", // lightest step, used sparingly (near-Bone)
        },
        bone: {
          DEFAULT: "#EFE9DE", // default text/light surface color
          deep: "#E7E0D3", // card surfaces on light grounds
        },
        rule: "#D6CFC2", // hairline borders on light surfaces
        accent: {
          DEFAULT: "#E8451F", // Hazard — the one accent: drops, sold tags, buy button, stamp
          light: "#F17C56",
          dark: "#AE3417",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Black", "sans-serif"],
        sans: ["var(--font-sans)", "-apple-system", "Helvetica", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
