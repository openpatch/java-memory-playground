import { getNodesBounds, Viewport } from "@xyflow/react";
import { toPng } from "html-to-image";

import type { ColorMode } from "./colorMode";
import { paletteFor } from "./palette";
import { CustomNodeType } from "./types";

/**
 * Everything floating over the diagram rather than part of it.
 *
 * `react-flow__panel` covers the palette, the toolbar, the step bar, the
 * collector and React Flow's own zoom controls in one go, so a panel added
 * later does not have to be remembered here.
 */
const excludeChrome = (node: HTMLElement) =>
  !(
    node?.classList?.contains("react-flow__panel") ||
    node?.classList?.contains("react-flow__background") ||
    node?.classList?.contains("react-flow__minimap") ||
    node?.classList?.contains("react-flow__attribution")
  );

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const download = (dataUrl: string, name: string) => {
  const a = document.createElement("a");
  a.setAttribute("download", name);
  a.setAttribute("href", dataUrl);
  a.click();
};

const PIXEL_RATIO = 2;
const MARGIN = 28;

/**
 * A picture of the diagram alone, cropped to the nodes.
 *
 * The whole flow is photographed rather than just its viewport, because the
 * arrowheads are SVG markers defined outside the viewport and a reference
 * without its arrowhead has lost which way it points. The empty canvas around
 * the diagram is then cropped away.
 *
 * Callers are expected to have framed the diagram first — anything scrolled out
 * of view was never photographed and cannot be cropped back in.
 */
export const captureDiagram = async (
  flowElement: HTMLElement,
  nodes: CustomNodeType[],
  viewport: Viewport,
  mode: ColorMode = "light",
): Promise<string | null> => {
  if (nodes.length === 0) return null;

  // The picture's backdrop wears the scheme the diagram on screen is drawn
  // in — the photograph itself carries its own computed styles.
  const EXPORT_BACKGROUND = paletteFor(mode).SURFACE;

  const dataUrl = await toPng(flowElement, {
    filter: excludeChrome,
    backgroundColor: EXPORT_BACKGROUND,
    pixelRatio: PIXEL_RATIO,
  });
  const shot = await loadImage(dataUrl);

  // Where the nodes ended up on screen, in the flow element's own coordinates.
  const bounds = getNodesBounds(nodes);
  const left = bounds.x * viewport.zoom + viewport.x - MARGIN;
  const top = bounds.y * viewport.zoom + viewport.y - MARGIN;
  const width = bounds.width * viewport.zoom + MARGIN * 2;
  const height = bounds.height * viewport.zoom + MARGIN * 2;

  const clampedLeft = Math.max(0, Math.round(left));
  const clampedTop = Math.max(0, Math.round(top));
  const clampedWidth = Math.min(
    Math.round(width),
    Math.round(shot.width / PIXEL_RATIO) - clampedLeft,
  );
  const clampedHeight = Math.min(
    Math.round(height),
    Math.round(shot.height / PIXEL_RATIO) - clampedTop,
  );
  if (clampedWidth <= 0 || clampedHeight <= 0) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = clampedWidth * PIXEL_RATIO;
  canvas.height = clampedHeight * PIXEL_RATIO;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.fillStyle = EXPORT_BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    shot,
    clampedLeft * PIXEL_RATIO,
    clampedTop * PIXEL_RATIO,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/png");
};

export const downloadStep = async (
  flowElement: HTMLElement,
  nodes: CustomNodeType[],
  viewport: Viewport,
  name: string,
  mode: ColorMode = "light",
) => {
  const dataUrl = await captureDiagram(flowElement, nodes, viewport, mode);
  if (dataUrl) download(dataUrl, name);
};

/**
 * One image of a whole trace: every step stacked, each under its caption.
 *
 * A worksheet wants the sequence, not the last picture — which is what
 * exporting the step on screen gives you.
 */
export const downloadAllSteps = async ({
  stepCount,
  labelFor,
  showStep,
  captureNow,
  fileName = "java-memory-playground.png",
  mode = "light",
}: {
  stepCount: number;
  labelFor: (index: number) => string;
  /** Puts a step on screen, framed and measured, ready to be photographed. */
  showStep: (index: number) => Promise<void>;
  /** Photographs the step now on screen. */
  captureNow: () => Promise<string | null>;
  fileName?: string;
  /** The scheme the steps on screen are drawn in, for the caption strip. */
  mode?: ColorMode;
}) => {
  const palette = paletteFor(mode);
  const EXPORT_BACKGROUND = palette.SURFACE;
  const EXPORT_CAPTION_BACKGROUND = palette.SURFACE_SUNKEN;
  const EXPORT_CAPTION_TEXT = palette.TEXT;

  const shots: { image: HTMLImageElement; caption: string }[] = [];

  for (let i = 0; i < stepCount; i++) {
    await showStep(i);
    const dataUrl = await captureNow();
    if (!dataUrl) continue;
    shots.push({
      image: await loadImage(dataUrl),
      caption: `${i + 1}/${stepCount}${labelFor(i) ? ` — ${labelFor(i)}` : ""}`,
    });
  }

  if (shots.length === 0) return;

  const captionHeight = 44 * PIXEL_RATIO;
  const gap = 12 * PIXEL_RATIO;
  const width = Math.max(...shots.map((s) => s.image.width));
  const height = shots.reduce(
    (total, s) => total + s.image.height + captionHeight + gap,
    gap,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = EXPORT_BACKGROUND;
  context.fillRect(0, 0, width, height);

  let y = gap;
  shots.forEach(({ image, caption }) => {
    context.fillStyle = EXPORT_CAPTION_BACKGROUND;
    context.fillRect(0, y, width, captionHeight);
    context.fillStyle = EXPORT_CAPTION_TEXT;
    context.font = `600 ${20 * PIXEL_RATIO}px system-ui, sans-serif`;
    context.textBaseline = "middle";
    context.fillText(caption, 16 * PIXEL_RATIO, y + captionHeight / 2);
    y += captionHeight;

    context.drawImage(image, 0, y);
    y += image.height + gap;
  });

  download(canvas.toDataURL("image/png"), fileName);
};
