import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        burgundy: { DEFAULT: "#6B0F1A", dark: "#4A0A12", light: "#8E1B2B" },
        saffron: { DEFAULT: "#FF9933", deep: "#E67E00" },
        gold: { DEFAULT: "#D4AF37", light: "#F0D77B" },
        ivory: { DEFAULT: "#FFF8E7", dark: "#F3E7C9" },
        paper: "#FFFBF7",
        blush: "#FCEBEB",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "var(--font-telugu)", "serif"],
        script: ["var(--font-script)", "cursive"],
        serif: ["var(--font-cormorant)", "var(--font-telugu)", "serif"],
        sans: ["var(--font-poppins)", "var(--font-telugu)", "system-ui", "sans-serif"],
        telugu: ["var(--font-telugu)", "var(--font-poppins)", "sans-serif"],
      },
      boxShadow: {
        royal: "0 10px 30px -10px rgba(107,15,26,0.45)",
        glow: "0 0 24px rgba(212,175,55,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
