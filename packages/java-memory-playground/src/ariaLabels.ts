import { ReactFlowProps } from "@xyflow/react";

import { Translations } from "./translations";

/**
 * React Flow's own accessible text, in the playground's language.
 *
 * It ships these strings in English, so a German playground was announcing
 * "Zoom In" and "Press enter or space to select a node" beside its own
 * translated labels. `ariaLabelConfig` is the documented way to replace them,
 * and every key it does not carry keeps React Flow's default.
 */
export const ariaLabelsFor = (
  t: Translations,
): NonNullable<ReactFlowProps["ariaLabelConfig"]> => ({
  "node.a11yDescription.default": t.a11y.node,
  "node.a11yDescription.keyboardDisabled": t.a11y.nodeKeyboard,
  "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }) =>
    t.a11y.nodeMoved(direction, x, y),
  "edge.a11yDescription.default": t.a11y.edge,
  "controls.ariaLabel": t.a11y.controls,
  "controls.zoomIn.ariaLabel": t.a11y.zoomIn,
  "controls.zoomOut.ariaLabel": t.a11y.zoomOut,
  "controls.fitView.ariaLabel": t.a11y.fitView,
  "controls.interactive.ariaLabel": t.a11y.toggleInteractivity,
  "handle.ariaLabel": t.a11y.handle,
});
