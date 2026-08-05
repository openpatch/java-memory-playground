import { useCallback } from "react";
import { useTemporalStore } from "./storeContext";

/**
 * Undo/redo for the surrounding playground, backed by zundo's temporal store.
 *
 * Only the diagram is undoable — opening a dialog or switching to the config
 * view does not consume a step (see the temporal `partialize` in `store.ts`).
 */
export const useUndoRedo = () => {
  const undoFn = useTemporalStore((state) => state.undo);
  const redoFn = useTemporalStore((state) => state.redo);
  const clear = useTemporalStore((state) => state.clear);
  const canUndo = useTemporalStore((state) => state.pastStates.length > 0);
  const canRedo = useTemporalStore((state) => state.futureStates.length > 0);

  const undo = useCallback(() => undoFn(), [undoFn]);
  const redo = useCallback(() => redoFn(), [redoFn]);

  return { undo, redo, clear, canUndo, canRedo };
};
