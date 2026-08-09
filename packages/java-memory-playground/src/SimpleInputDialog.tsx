import { useState } from "react";

interface SimpleInputDialogProps {
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function SimpleInputDialog({
  title,
  label,
  placeholder = "",
  initialValue = "",
  onConfirm,
  onCancel,
}: SimpleInputDialogProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

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
        style={{
          backgroundColor: "var(--jmp-surface)",
          padding: "24px",
          borderRadius: "8px",
          minWidth: "400px",
          maxWidth: "90vw",
          border: "1px solid var(--jmp-border)",
          margin: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--jmp-text)",
          }}
        >
          {title}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--jmp-text-muted)",
              }}
            >
              {label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--jmp-border)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              style={{
                backgroundColor: value.trim() ? "var(--jmp-text)" : "var(--jmp-text-faint)",
                color: "var(--jmp-surface)",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                border: "none",
                borderRadius: "6px",
                cursor: value.trim() ? "pointer" : "not-allowed",
              }}
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
