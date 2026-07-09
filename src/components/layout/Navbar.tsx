"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LayoutGrid, FolderKanban, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/api";
import { useCurrentUser } from "@/lib/queries";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";

/** Liens principaux de navigation (centre de la navbar). */
const NAV_LINKS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/projets", label: "Projets", icon: FolderKanban },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  async function handleLogout() {
    try {
      await logout();
      queryClient.clear();
      router.replace("/login");
    } catch {
      toast.error("La déconnexion a échoué. Réessayez.");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        {/* Logo → retour dashboard */}
        <Link href="/dashboard" aria-label="Abricot — Tableau de bord">
          <Logo tone="primary" />
        </Link>

        {/* Liens centraux */}
        <ul className="flex items-center gap-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-ink text-white" // pastille noire = actif
                      : "text-text hover:bg-black/5",
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4", active ? "text-white" : "text-primary")}
                    aria-hidden="true"
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Avatar + menu compte */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            className="flex items-center gap-1 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Menu du compte"
          >
            {/* Avatar de l'utilisateur courant = fond plein orange */}
            <Avatar name={user?.name ?? user?.email} filled />
            <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-40 min-w-48 rounded-xl border border-border bg-surface p-1 shadow-card"
            >
              {user && (
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-text">
                    {user.name ?? "Utilisateur"}
                  </p>
                  <p className="truncate text-xs text-text-muted">{user.email}</p>
                </div>
              )}
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item asChild>
                <Link
                  href="/compte"
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-black/5"
                >
                  <UserIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                  Mon compte
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-black/5"
              >
                <LogOut className="h-4 w-4 text-primary" aria-hidden="true" />
                Se déconnecter
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </nav>
    </header>
  );
}
