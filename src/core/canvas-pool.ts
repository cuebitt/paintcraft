const pooledCanvases: HTMLCanvasElement[] = [];

export function acquireCanvas(w: number, h: number): HTMLCanvasElement {
  let canvas = pooledCanvases.pop();
  if (!canvas) {
    canvas = document.createElement("canvas");
  }
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export function releaseCanvas(canvas: HTMLCanvasElement) {
  if (pooledCanvases.length < 4) pooledCanvases.push(canvas);
}
