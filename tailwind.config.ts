import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#F0F6FF", // cool paper (sibling Clause uses warm #FFFDF0)
        azure: "#2563EB", // retrieval accent
        cyan: "#06B6D4",
        acid: "#E8FF00",
        mint: "#00C2A8",
        // confidence-band semantics
        seen: "#00C2A8", // mint  — near-duplicate
        similar: "#E8FF00", // acid — same topic, distinct
        novel: "#CBD5E1", // slate — unrelated
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        brutal: "6px 6px 0 0 #0A0A0A",
        "brutal-sm": "4px 4px 0 0 #0A0A0A",
        "brutal-lg": "10px 10px 0 0 #0A0A0A",
        "brutal-azure": "6px 6px 0 0 #2563EB",
      },
      borderWidth: {
        3: "3px",
      },
    },
  },
  plugins: [],
};

export default config;
