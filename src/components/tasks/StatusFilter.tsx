"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import type { Status } from "@/types";

export type StatusFilterValue = "ALL" | Status;

const OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminée" },
  { value: "CANCELLED", label: "Annulée" },
];

export interface StatusFilterProps {
  value: StatusFilterValue;
  onValueChange: (value: StatusFilterValue) => void;
}

/** Filtre de statut (Radix Select) accessible au clavier. */
export function StatusFilter({ value, onValueChange }: StatusFilterProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onValueChange(v as StatusFilterValue)}>
      <Select.Trigger
        aria-label="Filtrer par statut"
        className="inline-flex h-11 min-w-36 items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="text-text-muted">Statut&nbsp;:</span>
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[--radix-select-trigger-width] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-card"
        >
          <Select.Viewport>
            {OPTIONS.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-black/5"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
