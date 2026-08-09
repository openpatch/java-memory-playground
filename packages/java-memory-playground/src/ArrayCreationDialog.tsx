import { DataType } from "./memory";

interface ArrayCreationDialogProps {
  onConfirm: (name: string, length: number, elementType: DataType) => void;
  onCancel: () => void;
  availableTypes: DataType[];
}

export const ArrayCreationDialog = ({
  onConfirm,
  onCancel,
  availableTypes,
}: ArrayCreationDialogProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const length = parseInt(formData.get("length") as string, 10);
    const elementType = formData.get("elementType") as DataType;

    if (name && !isNaN(length) && length > 0 && elementType) {
      onConfirm(name, length, elementType);
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
          Create New Array
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
              Array Name
            </label>
            <input
              type="text"
              name="name"
              required
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
              Length
            </label>
            <input
              type="number"
              name="length"
              required
              min="1"
              defaultValue="5"
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
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--jmp-text-muted)",
              }}
            >
              Element Type
            </label>
            <select
              name="elementType"
              defaultValue="int"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--jmp-border)",
                fontSize: "14px",
                backgroundColor: "var(--jmp-surface)",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
              style={{
                backgroundColor: "var(--jmp-text)",
                color: "var(--jmp-surface)",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
