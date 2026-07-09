import type { Config } from "tailwindcss";

/**
 * Design tokens Abricot — report EXACT de docs/DESIGN.md §2.
 * Les couleurs pointent vers les variables CSS déclarées dans globals.css (:root)
 * pour rester la source de vérité unique côté runtime.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette de marque
        primary: {
          DEFAULT: "var(--color-primary)", // #C2410C orange accessible (texte/boutons)
          hover: "var(--color-primary-hover)", // #9A3412
          bright: "var(--color-primary-bright)", // #EA580C orange vif (logo, gros titres)
          soft: "var(--color-primary-soft)", // #FFF1E9
        },
        ink: {
          DEFAULT: "var(--color-ink)", // #1A1A1A boutons pleins + texte fort
          hover: "var(--color-ink-hover)", // #000000
        },
        bg: "var(--color-bg)", // #F5F5F7 fond de page
        surface: "var(--color-surface)", // #FFFFFF cartes / navbar / modales
        border: "var(--color-border)", // #ECECEC
        text: {
          DEFAULT: "var(--color-text)", // #1A1A1A
          muted: "var(--color-text-muted)", // #6B7280
        },
        // Badges de statut
        status: {
          "todo-bg": "var(--todo-bg)",
          "todo-fg": "var(--todo-fg)",
          "doing-bg": "var(--doing-bg)",
          "doing-fg": "var(--doing-fg)",
          "done-bg": "var(--done-bg)",
          "done-fg": "var(--done-fg)",
          "cancel-bg": "var(--cancel-bg)",
          "cancel-fg": "var(--cancel-fg)",
        },
      },
      fontFamily: {
        // Titres : Poppins ; corps : Inter — chargés via next/font (variables CSS)
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Rayons DESIGN.md §2 : cartes ~16px, inputs/boutons ~8–10px
        lg: "0.625rem", // ~10px — inputs / boutons
        xl: "0.875rem",
        "2xl": "1rem", // ~16px — cartes
      },
      boxShadow: {
        // Ombre très légère des cartes
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
