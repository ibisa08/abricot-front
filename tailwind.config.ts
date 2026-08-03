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
          DEFAULT: "var(--color-primary)", // #D3590B marque : logo, gros titres, graphiques (3:1)
          text: "var(--color-primary-text)", // #C2410C orange en PETIT texte (AA 4.5:1)
          strong: "var(--color-primary-strong)", // #C2410C FOND sous contenu blanc (AA 5.17:1)
          hover: "var(--color-primary-hover)", // #9A3412
          soft: "var(--color-primary-soft)", // #FFF1E9
        },
        ink: {
          DEFAULT: "var(--color-ink)", // #1F1F1F boutons pleins + texte fort
          hover: "var(--color-ink-hover)", // #000000
        },
        bg: {
          DEFAULT: "var(--color-bg)", // #F5F5F7 fond de page
          auth: "var(--color-bg-auth)", // #F9FAFB fond pages auth
        },
        surface: {
          DEFAULT: "var(--color-surface)", // #FFFFFF cartes / navbar / modales
          alt: "var(--color-surface-alt)", // #F3F4F6 barre Contributeurs
        },
        border: "var(--color-border)", // #E5E7EB
        text: {
          DEFAULT: "var(--color-text)", // #1F1F1F
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
        // Titres : Manrope ; corps : Inter — chargés via next/font (variables CSS)
        heading: ["var(--font-manrope)", "system-ui", "sans-serif"],
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
