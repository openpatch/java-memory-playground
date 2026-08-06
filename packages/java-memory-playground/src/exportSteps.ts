import { toPng } from "html-to-image";

/** Chrome that belongs to the editor rather than to the diagram. */
export const excludeChrome = (node: HTMLElement) =>
  !(
    node?.classList?.contains("react-flow__minimap") ||
    node?.classList?.contains("react-flow__controls") ||
    node?.classList?.contains("button-group")
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

export const downloadStep = async (element: HTMLElement, name: string) => {
  download(await toPng(element, { filter: excludeChrome }), name);
};

/**
 * One image of a whole trace: every step stacked, each under its caption.
 *
 * A worksheet wants the sequence, not the last picture — which is what
 * exporting the step on screen gives you.
 */
export const downloadAllSteps = async ({
  element,
  stepCount,
  labelFor,
  showStep,
  fileName = "java-memory-playground.png",
}: {
  element: HTMLElement;
  stepCount: number;
  labelFor: (index: number) => string;
  /** Puts a step on screen and resolves once it has been drawn. */
  showStep: (index: number) => Promise<void>;
  fileName?: string;
}) => {
  const shots: { image: HTMLImageElement; caption: string }[] = [];

  for (let i = 0; i < stepCount; i++) {
    await showStep(i);
    const dataUrl = await toPng(element, { filter: excludeChrome });
    shots.push({
      image: await loadImage(dataUrl),
      caption: `${i + 1}/${stepCount}${labelFor(i) ? ` — ${labelFor(i)}` : ""}`,
    });
  }

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
