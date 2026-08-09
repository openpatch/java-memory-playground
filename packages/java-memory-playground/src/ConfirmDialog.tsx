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
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          backgroundColor: "var(--jmp-surface)",
          padding: "24px",
          borderRadius: "8px",
          minWidth: "400px",
          maxWidth: "min(560px, 90vw)",
          maxHeight: "80vh",
          overflowY: "auto",
          border: "1px solid var(--jmp-border)",
          margin: "20px",
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
            style={{
              backgroundColor: "var(--jmp-surface)",
              color: "var(--jmp-text-muted)",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "1px solid var(--jmp-border)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: destructive ? "var(--jmp-danger)" : "var(--jmp-text)",
              color: "var(--jmp-surface)",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
