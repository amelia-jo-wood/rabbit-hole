import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#15121a",
        paper: "#ffffff",
        haze: "#f7f6f8",
        coral: "#e63e30",
        "coral-soft": "#fdeceb",
        "coral-dark": "#c22e22",
        line: "#e7e5ea",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
