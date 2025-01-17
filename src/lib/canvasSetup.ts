import * as PIXI from 'pixi.js';

export const setupCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  return canvas;
};

export const createPixiApp = (canvas: HTMLCanvasElement): PIXI.Application => {
  return new PIXI.Application({
    view: canvas,
    width: canvas.width,
    height: canvas.height,
    backgroundColor: 0x1F2937,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
};