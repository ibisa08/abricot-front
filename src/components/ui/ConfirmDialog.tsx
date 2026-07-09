"use client";

import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style destructif (rouge) pour le bouton de confirmation. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

/** Boîte de confirmation accessible (focus trap Radix, Esc) pour actions sensibles. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="mt-2 flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="ink"
          onClick={onConfirm}
          disabled={loading}
          className={destructive ? "bg-status-todo-fg hover:bg-status-todo-fg/90" : undefined}
        >
          {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
