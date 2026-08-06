import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";

import { CustomNodeType } from "./types";

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

/**
 * A picture of the diagram alone.
 *
 * Photographing the whole canvas loses the references: React Flow keeps them in
 * a transformed container that measures 0x0, which html-to-image drops. So the
 * viewport is captured instead, framed to the nodes — which also crops away the
 * empty canvas and every floating panel, none of which belong in a diagram.
 */
export const captureDiagram = async (
  flowElement: HTMLElement,
  nodes: CustomNodeType[],
): Promise<string | null> => {
  const viewport = flowElement.querySelector<HTMLElement>(
    ".react-flow__viewport",
  );
  if (!viewport || nodes.length === 0) return null;

  const bounds = getNodesBounds(nodes);
  const margin = 40;
  const width = Math.ceil(bounds.width) + margin * 2;
  const height = Math.ceil(bounds.height) + margin * 2;
  const framed = getViewportForBounds(bounds, width, height, 0.2, 4, 0.1);

  return toPng(viewport, {
    backgroundColor: "#ffffff",
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${framed.x}px, ${framed.y}px) scale(${framed.zoom})`,
    },
  });
};

export const downloadStep = async (
  flowElement: HTMLElement,
  nodes: CustomNodeType[],
  name: string,
) => {
  const dataUrl = await captureDiagram(flowElement, nodes);
  if (dataUrl) download(dataUrl, name);
};

/**
 * One image of a whole trace: every step stacked, each under its caption.
 *
 * A worksheet wants the sequence, not the last picture — which is what
 * exporting the step on screen gives you.
 */
export const downloadAllSteps = async ({
  flowElement,
  stepCount,
  labelFor,
  showStep,
  nodesNow,
  fileName = "java-memory-playground.png",
}: {
  flowElement: HTMLElement;
  stepCount: number;
  labelFor: (index: number) => string;
  /** Puts a step on screen and resolves once it has been drawn and measured. */
  showStep: (index: number) => Promise<void>;
  /** The nodes of the step now on screen, measured. */
  nodesNow: () => CustomNodeType[];
  fileName?: string;
}) => {
  const shots: { image: HTMLImageElement; caption: string }[] = [];

  for (let i = 0; i < stepCount; i++) {
    await showStep(i);
    const dataUrl = await captureDiagram(flowElement, nodesNow());
    if (!dataUrl) continue;
    shots.push({
      image: await loadImage(dataUrl),
      caption: `${i + 1}/${stepCount}${labelFor(i) ? ` — ${labelFor(i)}` : ""}`,
    });
  }

  if (shots.length === 0) return;

  const captionHeight = 44;
  const gap = 12;
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

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  let y = gap;
  shots.forEach(({ image, caption }) => {
    context.fillStyle = "#f1f5f9";
    context.fillRect(0, y, width, captionHeight);
    context.fillStyle = "#0f172a";
    context.font = "600 20px system-ui, sans-serif";
    context.textBaseline = "middle";
    context.fillText(caption, 16, y + captionHeight / 2);
    y += captionHeight;

    context.drawImage(image, 0, y);
    y += image.height + gap;
  });

  download(canvas.toDataURL("image/png"), fileName);
};
