import { ReactNode } from "react";

/**
 * A yes/no dialog for a change that cannot be taken back by cancelling.
 *
 * The confirming button says what it does rather than "OK", so the choice can
 * be read without reading the title again.
 */
export function ConfirmDialog({
  title,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--jmp-scrim)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        className="jmp-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          backgroundColor: "var(--jmp-surface)",
          padding: "24px",
          borderRadius: "8px",
          // Never wider than the screen less its margin: a 400px minimum was
          // wider than a phone, and cut off the title and the OK button.
          width: "min(400px, calc(100vw - 32px))",
          boxSizing: "border-box",
          maxWidth: "min(560px, calc(100vw - 32px))",
          maxHeight: "80vh",
          overflowY: "auto",
          border: "1px solid var(--jmp-border)",
          margin: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--jmp-text)",
          }}
        >
          {title}
        </h3>
        <div style={{ fontSize: "14px", color: "var(--jmp-text-muted)", lineHeight: 1.6 }}>
          {children}
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end",
            marginTop: "20px",
          }}
        >
          <button
            onClick={onCancel}
            autoFocus
            className="button-ghost"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={destructive ? "button-danger" : "button-primary"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
