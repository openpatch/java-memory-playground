import {
  Memory,
  MemoryPlaygroundEditor,
  KeyBindings,
} from "@openpatch/java-memory-playground";
import "@openpatch/java-memory-playground/index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

interface VSCodeApi {
  postMessage(message: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
}

declare function acquireVsCodeApi(): VSCodeApi;
const vscode = acquireVsCodeApi();

type HostMessage =
  | { type: "update"; content: string }
  | { type: "flush" };

/** Long enough that a drag is one edit, short enough to feel immediate. */
const EDIT_DEBOUNCE = 250;

/**
 * The playground, wired to the document VS Code is holding.
 *
 * Every edit is sent to the extension, which writes it into the document —
 * that is what marks the tab dirty, and what makes Ctrl+S save the diagram
 * without this webview having a save of its own.
 */
function WebviewEditor() {
  const [memory, setMemory] = useState<string | undefined>(undefined);

  /** The newest diagram, whether or not the debounce has fired for it yet. */
  const pending = useRef<Memory | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((type: "edit" | "flushed" | "save") => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    vscode.postMessage({ type, content: pending.current });
  }, []);

  // The playground's own Save button writes the file, rather than sitting
  // there doing nothing because VS Code owns saving.
  const onSave = useCallback(
    (next: Memory) => {
      pending.current = next;
      send("save");
    },
    [send],
  );

  const onEdit = useCallback(
    (next: Memory) => {
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => send("edit"), EDIT_DEBOUNCE);
    },
    [send],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent<HostMessage>) => {
      const message = event.data;
      if (message.type === "update") {
        // The document changed under us — someone edited the source, or undid
        // something there. Whatever is in the file wins.
        pending.current = null;
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
        setMemory(message.content);
      } else if (message.type === "flush") {
        // A save is waiting on the keystroke the debounce is still holding.
        send("flushed");
      }
    };

    window.addEventListener("message", onMessage);
    vscode.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", onMessage);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [send]);

  if (memory === undefined) {
    return <div style={{ padding: "20px" }}>Loading the diagram…</div>;
  }

  return (
    <MemoryPlaygroundEditor
      memory={memory}
      onEdit={onEdit}
      onChange={onSave}
      // The document is the file; the playground must not also try to be one.
      persistence={false}
      // Ctrl+S belongs to VS Code, which saves the document the edits are
      // already in. Leaving the playground's own Save bound would fight it.
      keyBindings={vscodeKeyBindings}
    />
  );
}

const vscodeKeyBindings: Partial<KeyBindings> = {
  save: undefined,
};

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<WebviewEditor />);
}
