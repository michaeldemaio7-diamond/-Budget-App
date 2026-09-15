import type { Config } from "tailwindcss";

/**
 * Sentry-esque demo theme.
 * NOTE: these values approximate Sentry's public brand identity for a demo.
 * Swap in exact hex codes / logo / licensed type from Sentry's official
 * brand guide + Brandfetch page before any customer-facing use.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#120f1a",
          900: "#1a1625", // dominant near-black purple surface
          850: "#211b30",
          800: "#29223a",
          700: "#352c4b",
          600: "#4a3f63"
        },
        violet: {
          brand: "#7553FF", // signature glitch-purple accent
          deep: "#584774",
          soft: "#9e86ff"
        },
        flare: {
          orange: "#FF7738", // warm alert accent
          pink: "#E1567C"
        },
        paper: "#FAF9FB", // light-mode surface for embedded panels
        hairline: "rgba(250, 249, 251, 0.08)"
      },
      fontFamily: {
        sans: ["Rubik", "Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "6px"
      },
      boxShadow: {
        drawer: "-24px 0 60px rgba(0,0,0,0.55)",
        glass: "0 8px 32px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;
