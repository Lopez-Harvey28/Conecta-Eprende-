import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <section
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div>
            {variant === "danger" && (
              <span className="eyebrow" style={{ color: "var(--danger)" }}>
                <AlertTriangle size={14} />{" "}
              </span>
            )}
            <h2 id="confirm-dialog-title">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {description && (
          <div className="dialog-body">{description}</div>
        )}

        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}

interface InfoDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

export function InfoDialog({
  open,
  onClose,
  title,
  description,
  children,
}: InfoDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-dialog-title"
    >
      <section
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div>
            <span className="eyebrow">
              <Info size={14} />{" "}
            </span>
            <h2 id="info-dialog-title">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {description && (
          <div className="dialog-body">{description}</div>
        )}

        {children}

        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </section>
    </div>
  );
}