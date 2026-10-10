import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: "#000000",
          soft: "#111111",
          light: "#1F1F1F",
        },
        white: {
          DEFAULT: "#FFFFFF",
          soft: "#FAFAFA",
          muted: "#F5F5F5",
        },
        gray: {
          DEFAULT: "#808080",
          light: "#D9D9D9",
          dark: "#333333",
          subtle: "#EAEAEA",
        },
      },

      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        serif: ["var(--font-cormorant)", "serif"],
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },

      boxShadow: {
        luxury: "0 10px 30px -10px rgba(0, 0, 0, 0.18)",
        subtle: "0 4px 16px rgba(0, 0, 0, 0.06)",
        elevated: "0 12px 40px rgba(0, 0, 0, 0.12)",
      },

      borderColor: {
        DEFAULT: "#E5E5E5",
      },
    },
  },

  plugins: [],
};

export default config;
