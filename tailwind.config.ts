import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark telemetry surface
        bg: "#0B0E14",
        panel: "#131822",
        panel2: "#1A212E",
        edge: "#232C3B",
        fg: "#E6EDF3",
        muted: "#8B98A9",
        faint: "#5A6675",
        // Accent + band semantics
        emerald: "#34D399",
        amber: "#F59E0B",
        seen: "#34D399", // near-duplicate
        similar: "#F59E0B", // same topic, distinct
        novel: "#5A6675", // unrelated
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
