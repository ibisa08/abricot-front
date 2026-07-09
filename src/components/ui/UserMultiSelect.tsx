"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, X, Check, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserSearch } from "@/lib/queries";
import { Avatar } from "@/components/ui/Avatar";
import type { UserRef } from "@/types";

/** Un utilisateur sélectionné (identité minimale). */
export type SelectedUser = UserRef;

export interface UserMultiSelectProps {
  /**
   * Détermine la clé d'identité : `emails` (contributeurs projet) ou `ids`
   * (assignés d'une tâche). La sélection est renvoyée en objets `UserRef` —
   * le parent extrait `.email` ou `.id` selon ce mode.
   */
  mode: "emails" | "ids";
  value: SelectedUser[];
  onChange: (users: SelectedUser[]) => void;
  placeholder?: string;
  /**
   * Liste fermée de candidats (ex. membres d'un projet pour les assignés).
   * Fournie → filtrage local, pas d'appel `/users/search`. Absente → recherche back.
   */
  options?: SelectedUser[];
  /** Id de l'élément déclencheur (pour lier un `<label htmlFor>`). */
  id?: string;
  "aria-describedby"?: string;
}

/** Petit debounce local (~300 ms) pour ne pas taper le back à chaque frappe. */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Sélecteur multiple d'utilisateurs (Radix Popover + pattern combobox ARIA).
 * Recherche debouncée sur `/users/search`, résultats navigables au clavier
 * (↑/↓ + Entrée), sélection matérialisée en puces retirables.
 */
export function UserMultiSelect({
  mode,
  value,
  onChange,
  placeholder = "Choisir un ou plusieurs collaborateurs",
  options,
  id,
  "aria-describedby": ariaDescribedBy,
}: UserMultiSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLocal = options !== undefined;
  const debouncedTerm = useDebounced(term, 300);
  // Recherche back : ≥ 2 caractères ; en mode local on filtre sans requête.
  const canSearch = debouncedTerm.trim().length >= 2;
  const { data: searchResults = [], isFetching } = useUserSearch(
    !isLocal && open && canSearch ? debouncedTerm : "",
  );

  const results = useMemo(() => {
    if (!isLocal) return searchResults;
    const q = debouncedTerm.trim().toLowerCase();
    if (!q) return options ?? [];
    return (options ?? []).filter(
      (u) => (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [isLocal, searchResults, options, debouncedTerm]);

  /** Clé d'identité selon le mode. */
  const keyOf = (u: SelectedUser) => (mode === "emails" ? u.email : u.id);
  const selectedKeys = useMemo(() => new Set(value.map(keyOf)), [value, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Réinitialise l'index actif quand la liste change.
  useEffect(() => setActiveIndex(0), [debouncedTerm, results.length]);

  function toggle(user: SelectedUser) {
    const key = keyOf(user);
    if (selectedKeys.has(key)) {
      onChange(value.filter((u) => keyOf(u) !== key));
    } else {
      onChange([...value, user]);
    }
    // On garde le focus sur la recherche pour enchaîner les sélections.
    inputRef.current?.focus();
  }

  function remove(user: SelectedUser) {
    onChange(value.filter((u) => keyOf(u) !== keyOf(user)));
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const user = results[activeIndex];
      if (user) toggle(user);
    } else if (e.key === "Backspace" && term === "" && value.length > 0) {
      // Backspace sur recherche vide → retire la dernière puce.
      remove(value[value.length - 1]);
    }
  }

  const activeOptionId = results[activeIndex] ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5",
          "focus-within:border-primary",
        )}
      >
        {value.map((user) => (
          <span
            key={keyOf(user)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft py-0.5 pl-1 pr-1.5 text-xs font-medium text-primary"
          >
            <Avatar name={user.name ?? user.email} size="sm" className="h-5 w-5 text-[9px]" />
            <span className="max-w-[12ch] truncate">{user.name ?? user.email}</span>
            <button
              type="button"
              onClick={() => remove(user)}
              aria-label={`Retirer ${user.name ?? user.email}`}
              className="rounded-full p-0.5 text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}

        <Popover.Trigger asChild>
          <button
            type="button"
            id={id}
            aria-describedby={ariaDescribedBy}
            className="flex min-w-[8rem] flex-1 items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-sm text-text-muted outline-none"
          >
            <span className={cn(value.length > 0 && "sr-only")}>
              {value.length > 0 ? "Ajouter un collaborateur" : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-border bg-surface p-2 shadow-card"
        >
          {/* Champ de recherche = combobox */}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-label="Rechercher un collaborateur"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder={isLocal ? "Filtrer les membres…" : "Rechercher par nom ou email…"}
            className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none placeholder:text-text-muted focus-visible:border-primary"
          />

          <ul id={listId} role="listbox" aria-label="Résultats" className="mt-2 max-h-56 overflow-y-auto">
            {isFetching && (
              <li className="flex items-center gap-2 px-2 py-2 text-sm text-text-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Recherche…
              </li>
            )}

            {!isFetching && !isLocal && !canSearch && (
              <li className="px-2 py-2 text-sm text-text-muted">
                Saisissez au moins 2 caractères pour rechercher.
              </li>
            )}

            {!isFetching && (isLocal || canSearch) && results.length === 0 && (
              <li className="px-2 py-2 text-sm text-text-muted">
                {isLocal ? "Aucun membre disponible." : "Aucun utilisateur trouvé."}
              </li>
            )}

            {!isFetching &&
              results.map((user, index) => {
                const selected = selectedKeys.has(keyOf(user));
                const active = index === activeIndex;
                return (
                  <li
                    key={user.id}
                    id={`${listId}-opt-${index}`}
                    role="option"
                    aria-selected={selected}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(user)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
                        active ? "bg-primary-soft" : "hover:bg-black/5",
                      )}
                    >
                      <Avatar name={user.name ?? user.email} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-text">
                          {user.name ?? "Sans nom"}
                        </span>
                        <span className="block truncate text-xs text-text-muted">{user.email}</span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
