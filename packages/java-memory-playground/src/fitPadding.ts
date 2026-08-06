import { FitViewOptions } from "@xyflow/react";

import { Memory } from "./memory";

/** React Flow's own margin around a `<Panel>`. */
const PANEL_MARGIN = 15;

/** `.sidebar` in index.css: its width plus its padding. */
const PALETTE_WIDTH = 132 + 8;

/**
 * Enough of a gap that a node does not touch the panel beside it.
 *
 * Half of a handle hangs outside its node, and the bounds React Flow frames
 * to are the nodes alone, so the sides need a little more than the rest or
 * the outermost reference loses its dot.
 */
const BREATHING_ROOM = 15;
const SIDE_ROOM = 24;

const px = (value: number) => `${value}px` as const;

/**
 * Room to leave around the diagram when framing it.
 *
 * The palette, the toolbar and the step bar are drawn on top of the canvas
 * rather than beside it, so framing the nodes edge to edge parks them
 * underneath a panel — which is how the first frame of the default diagram
 * used to lose its name. Each side is only reserved when something is
 * actually floating there, so a diagram with the palette hidden gets its
 * width back.
 */
export const fitPaddingFor = (
  options: Memory["options"],
): NonNullable<FitViewOptions["padding"]> => ({
  top: px(PANEL_MARGIN + 26 + BREATHING_ROOM),
  right: px(SIDE_ROOM),
  bottom: px(
    options.hideSteps ? BREATHING_ROOM : PANEL_MARGIN + 46 + BREATHING_ROOM,
  ),
  left: px(
    options.hideSidebar
      ? SIDE_ROOM
      : PANEL_MARGIN + PALETTE_WIDTH + BREATHING_ROOM,
  ),
});
