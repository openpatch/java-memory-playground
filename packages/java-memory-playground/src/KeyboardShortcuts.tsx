import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

import { fitPaddingFor } from "./fitPadding";
import useStore from "./storeContext";
import { useUndoRedo } from "./useUndoRedo";
import { KeyBinding, KeyBindings } from "./types";

interface KeyboardShortcutsProps {
  keyBindings?: Partial<KeyBindings>;
}

export const defaultKeyBindings: KeyBindings = {
  save: { key: "s", ctrl: true },
  undo: { key: "z", ctrl: true },
  redo: { key: "y", ctrl: true },
  toggleConfig: { key: ",", ctrl: true },
  zoomIn: { key: "+", ctrl: true },
  zoomOut: { key: "-", ctrl: true },
  resetZoom: { key: "0", ctrl: true },
  fitView: { key: "!", shift: true },
};

const matchesKeyBinding = (
  e: KeyboardEvent,
  binding: KeyBinding | undefined,
): boolean => {
  if (!binding) return false;

  const keyMatches = e.key.toLowerCase() === binding.key.toLowerCase();
  const ctrlMatches = binding.ctrl
    ? e.ctrlKey || e.metaKey
    : !(e.ctrlKey || e.metaKey);
  const shiftMatches = binding.shift ? e.shiftKey : !e.shiftKey;
  const altMatches = binding.alt ? e.altKey : !e.altKey;

  return keyMatches && ctrlMatches && shiftMatches && altMatches;
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
};

export const KeyboardShortcuts = ({
  keyBindings: customKeyBindings = {},
}: KeyboardShortcutsProps) => {
  const keyBindings = { ...defaultKeyBindings, ...customKeyBindings };

  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const { undo, redo } = useUndoRedo();

  const save = useStore((state) => state.save);
  const route = useStore((state) => state.route);
  const setRoute = useStore((state) => state.setRoute);
  const mode = useStore((state) => state.mode);
  const options = useStore((state) => state.options);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never steal a shortcut from someone editing an attribute value.
      if (isTypingTarget(e.target)) return;

      if (matchesKeyBinding(e, keyBindings.save)) {
        e.preventDefault();
        save();
      } else if (matchesKeyBinding(e, keyBindings.undo)) {
        e.preventDefault();
        undo();
      } else if (matchesKeyBinding(e, keyBindings.redo)) {
        e.preventDefault();
        redo();
      } else if (matchesKeyBinding(e, keyBindings.toggleConfig)) {
        // The student's playground has no configuration to toggle into.
        if (mode !== "edit") return;
        e.preventDefault();
        setRoute(route === "config" ? "view" : "config");
      } else if (matchesKeyBinding(e, keyBindings.zoomIn)) {
        e.preventDefault();
        zoomIn();
      } else if (matchesKeyBinding(e, keyBindings.zoomOut)) {
        e.preventDefault();
        zoomOut();
      } else if (matchesKeyBinding(e, keyBindings.resetZoom)) {
        e.preventDefault();
        zoomTo(1);
      } else if (matchesKeyBinding(e, keyBindings.fitView)) {
        e.preventDefault();
        fitView({ padding: fitPaddingFor(options) });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return null;
};

export default KeyboardShortcuts;
