import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        cursive: ["var(--font-dancing)", "cursive"],
        script: ["var(--font-great-vibes)", "cursive"],
      },
      colors: {
        background: "#F5F5F5",
        foreground: "#111111",
        accent: "#D4AF37",
        "accent-light": "#E6C878",
        "accent-dark": "#B8860B",
        gold: {
          50: "#FDF8E8",
          100: "#F8F0C8",
          200: "#F0E0A0",
          300: "#E6C878",
          400: "#D4AF37",
          500: "#C49E30",
          600: "#B8860B",
          700: "#8B6508",
          800: "#5E4406",
          900: "#302203",
        },
        charcoal: {
          50: "#F5F5F5",
          100: "#E5E5E5",
          200: "#D9D9D9",
          300: "#999999",
          400: "#666666",
          500: "#444444",
          600: "#333333",
          700: "#2C2C2C",
          800: "#1A1A1A",
          900: "#111111",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px rgba(0, 0, 0, 0.05)",
        elevated: "0 10px 40px rgba(0, 0, 0, 0.08)",
        glow: "0 0 20px rgba(212, 175, 55, 0.3)",
        "glow-lg": "0 0 40px rgba(212, 175, 55, 0.2)",
        "gold-glow": "0 0 30px rgba(212, 175, 55, 0.15)",
        "inner-glow": "inset 0 0 20px rgba(212, 175, 55, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out",
        "fade-up": "fadeUp 0.8s ease-out",
        "slide-in": "slideIn 0.6s ease-out",
        "scale-in": "scaleIn 0.5s ease-out",
        float: "float 8s ease-in-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        shimmer: "shimmer 3s infinite",
        "gold-shine": "goldShine 4s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGold: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        goldShine: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D4AF37 0%, #E6C878 50%, #D4AF37 100%)",
        "gold-gradient-dark": "linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)",
        "dark-gradient": "linear-gradient(180deg, #111111 0%, #2C2C2C 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
