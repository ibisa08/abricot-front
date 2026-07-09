"use client";

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Titre accessible — relié via `aria-labelledby` (géré par Radix). */
  title: ReactNode;
  /** Description optionnelle sous le titre. */
  description?: string;
  children?: ReactNode;
  /** Zone d'actions en pied de modale (boutons). */
  footer?: ReactNode;
  className?: string;
}

/**
 * Modale accessible basée sur Radix Dialog :
 *  - overlay + focus trap + fermeture par `Esc` (fournis par Radix),
 *  - croix ✕ en haut à droite,
 *  - titre relié par `aria-labelledby`, description par `aria-describedby`.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border bg-surface p-6 shadow-card focus:outline-none",
            className,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-heading text-lg font-semibold text-text">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Fermer"
              className="rounded-lg p-1 text-text-muted transition-colors hover:bg-black/5 hover:text-text"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {children}

          {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
