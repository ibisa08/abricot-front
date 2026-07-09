import { Logo } from "./Logo";

/** Footer blanc : logo à gauche + « Abricot 2025 » à droite (DESIGN.md §3). */
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo tone="ink" />
        <p className="text-sm text-text-muted">Abricot 2025</p>
      </div>
    </footer>
  );
}
