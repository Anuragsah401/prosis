import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/packages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          975: "#030407",
          950: "#06070a",
          900: "#0b0d12",
          850: "#10131a",
          800: "#161a24",
          750: "#1d2230",
          700: "#272e40",
          600: "#3d4761",
        },
        slate: {
          850: "#151b28",
        },
        core: {
          cyan: "#38bdf8",
          neonCyan: "#00f0ff",
          violet: "#818cf8",
          cyberViolet: "#8b5cf6",
          amber: "#fbbf24",
          emerald: "#34d399",
          ruby: "#f87171",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        "glass-premium": "0 16px 40px -12px rgba(0, 0, 0, 0.56), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        "glass-elevated": "0 24px 64px -16px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "core-ambient": "0 0 80px -20px rgba(56, 189, 248, 0.15)",
        "hud-cyan": "0 0 25px -5px rgba(56, 189, 248, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
        "hud-violet": "0 0 25px -5px rgba(139, 92, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
      },
      animation: {
        "subtle-breathe": "breathe 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.85", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
