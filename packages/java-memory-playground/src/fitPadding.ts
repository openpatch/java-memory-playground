import { FitViewOptions } from "@xyflow/react";

import { Memory } from "./memory";

/** React Flow's own margin around a `<Panel>`. */
const PANEL_MARGIN = 15;

/** `.sidebar` in index.css, which is border-box: padding and border included. */
const PALETTE_WIDTH = 172;

/** `.jmp-toolbar`: one control high, its padding, and its border. */
const TOOLBAR_HEIGHT = 28 + 2 * 4 + 2;

/**
 * The step card with its navigation row and one line of task — the usual
 * height for a reader. A longer task or an open hint grows it upwards, over
 * the diagram, which is the price of the card floating rather than taking a
 * strip of the canvas for itself.
 */
const STEP_CARD_HEIGHT = 80;

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
  compact = false,
): NonNullable<FitViewOptions["padding"]> =>
  compact ? compactPaddingFor(options) : regularPaddingFor(options);

/**
 * The compact layout folds the palette behind a button in the top row and
 * lets the step card take the full width, so only the top row and the card
 * need room — on a phone, the palette's width was most of the screen.
 */
const COMPACT_MARGIN = 8;

/** The compact toolbar, whose controls are made bigger for a finger. */
const COMPACT_TOOLBAR_HEIGHT = 36 + 2 * 4 + 2;

const compactPaddingFor = (options: Memory["options"]) => ({
  top: px(COMPACT_MARGIN + COMPACT_TOOLBAR_HEIGHT + COMPACT_MARGIN),
  right: px(COMPACT_MARGIN + 4),
  bottom: px(
    options.hideSteps
      ? COMPACT_MARGIN
      : COMPACT_MARGIN + STEP_CARD_HEIGHT + COMPACT_MARGIN,
  ),
  left: px(COMPACT_MARGIN + 4),
});

const regularPaddingFor = (options: Memory["options"]) => ({
  top: px(PANEL_MARGIN + TOOLBAR_HEIGHT + BREATHING_ROOM),
  right: px(SIDE_ROOM),
  bottom: px(
    options.hideSteps
      ? BREATHING_ROOM
      : PANEL_MARGIN + STEP_CARD_HEIGHT + BREATHING_ROOM,
  ),
  // The collector is a card of the palette's width under it, so the left side
  // is reserved for either of them.
  left: px(
    options.hideSidebar && options.disableGarbageCollector
      ? SIDE_ROOM
      : PANEL_MARGIN + PALETTE_WIDTH + BREATHING_ROOM,
  ),
});
