import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // Navy blue — sidebar, primary actions, headings
        primary: {
          DEFAULT: "#104c91",
          dark:    "#0a356b",
          light:   "#256ebf",
          50:  "#eef6ff",
          100: "#d9ecff",
          200: "#badcff",
          300: "#8ac4ff",
          400: "#54a3ff",
          500: "#2b82fa",
          600: "#1561e1",
          700: "#104c91",
          800: "#13407c",
          900: "#143868",
        },
        // Brand green — CTAs, success, badges
        secondary: {
          DEFAULT: "#00a651",
          dark:    "#00823e",
          light:   "#1ecb73",
          50:  "#effef5",
          100: "#d7fee7",
          200: "#b1fdd0",
          300: "#75f9b1",
          400: "#34f08e",
          500: "#0bd570",
          600: "#00b45a",
          700: "#00a651",
          800: "#04713c",
          900: "#055d34",
        },
        // Teal — tertiary accent
        accent: {
          DEFAULT: "#3AAFA9",
          dark:    "#2D908B",
          light:   "#4DC9C3",
        },
        surface: { light: "#FFFFFF", dark: "#1E293B" },
        body:    { light: "#F0F4F8", dark: "#0F172A" },
      },
      backgroundImage: {
        "sidebar-gradient":
          "linear-gradient(180deg, #13407c 0%, #104c91 40%, #0d3d75 100%)",
        "sidebar-gradient-dark":
          "linear-gradient(180deg, #0a2244 0%, #13407c 40%, #0c2a52 100%)",
        "radial-light":
          "radial-gradient(ellipse at top left, #EEF4FF 0%, #F0F4F8 55%, #E8EEF5 100%)",
        "radial-dark":
          "radial-gradient(circle at top left, #1E293B, #0F172A 100%)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.3s ease-out forwards",
        "fade-in":    "fadeIn 0.2s ease-out forwards",
        "slide-in":   "slideIn 0.25s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
      },
      boxShadow: {
        "card":       "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 6px 24px rgba(16,76,145,0.12), 0 1px 4px rgba(0,0,0,0.05)",
        "primary":    "0 4px 16px rgba(16,76,145,0.30)",
        "secondary":  "0 4px 16px rgba(0,166,81,0.30)",
        "sidebar":    "4px 0 24px rgba(0,0,0,0.18)",
        "topbar":     "0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
