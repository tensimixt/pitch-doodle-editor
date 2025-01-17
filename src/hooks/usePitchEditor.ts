import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { setupCanvas, createPixiApp } from '@/lib/canvasSetup';
import { Point, createPointSprite } from '@/lib/pointManager';
import { calculateCurvePoints } from '@/lib/pitchUtils';

interface UsePitchEditorProps {
  width: number;
  height: number;
}

export const usePitchEditor = ({ width, height }: UsePitchEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const lineGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const gridGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const selectedPointRef = useRef<Point | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawGrid = () => {
    if (!gridGraphicsRef.current) return;

    const graphics = gridGraphicsRef.current;
    const scale = window.devicePixelRatio || 1;
    graphics.clear();
    graphics.lineStyle(1, 0x374151, 0.3);

    for (let x = 0; x <= width * scale; x += 50 * scale) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height * scale);
    }

    for (let y = 0; y <= height * scale; y += 50 * scale) {
      graphics.moveTo(0, y);
      graphics.lineTo(width * scale, y);
    }
  };

  const drawCurve = () => {
    if (!lineGraphicsRef.current || pointsRef.current.length < 2) return;

    const graphics = lineGraphicsRef.current;
    graphics.clear();
    graphics.lineStyle(2, 0x3B82F6);

    const points = pointsRef.current;
    const curvePoints = calculateCurvePoints(points);

    graphics.moveTo(curvePoints[0].x, curvePoints[0].y);
    for (let i = 1; i < curvePoints.length; i++) {
      graphics.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
  };

  const createPoint = (x: number, y: number) => {
    if (!appRef.current || !isInitialized) return null;

    try {
      const point = createPointSprite(appRef.current, x, y);
      pointsRef.current.push(point);
      pointsRef.current.sort((a, b) => a.x - b.x);
      drawCurve();
      return point;
    } catch (error) {
      console.error('Error creating point:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scale = window.devicePixelRatio || 1;
    const canvas = setupCanvas(width * scale, height * scale);
    canvasRef.current = canvas;
    containerRef.current.appendChild(canvas);

    const app = createPixiApp(canvas);
    appRef.current = app;

    // Wait for the next frame to ensure PIXI is fully initialized
    requestAnimationFrame(() => {
      const lineGraphics = new PIXI.Graphics();
      const gridGraphics = new PIXI.Graphics();
      app.stage.addChild(gridGraphics);
      app.stage.addChild(lineGraphics);
      lineGraphicsRef.current = lineGraphics;
      gridGraphicsRef.current = gridGraphics;

      drawGrid();
      setIsInitialized(true);

      // Create initial points after initialization
      const scale = window.devicePixelRatio || 1;
      createPoint(50 * scale, (height / 2) * scale);
      createPoint((width - 50) * scale, (height / 2) * scale);
    });

    return () => {
      pointsRef.current.forEach(point => {
        if (point.sprite && point.sprite.parent) {
          point.sprite.parent.removeChild(point.sprite);
          point.sprite.destroy();
        }
      });
      pointsRef.current = [];

      if (lineGraphicsRef.current?.parent) {
        lineGraphicsRef.current.parent.removeChild(lineGraphicsRef.current);
        lineGraphicsRef.current.destroy();
        lineGraphicsRef.current = null;
      }

      if (gridGraphicsRef.current?.parent) {
        gridGraphicsRef.current.parent.removeChild(gridGraphicsRef.current);
        gridGraphicsRef.current.destroy();
        gridGraphicsRef.current = null;
      }

      if (appRef.current) {
        try {
          appRef.current.destroy(true);
        } catch (error) {
          console.error('Error during PIXI application cleanup:', error);
        }
        appRef.current = null;
      }

      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, [width, height]);

  return {
    containerRef,
    canvasRef,
    isInitialized,
    createPoint,
    isDraggingRef,
    selectedPointRef,
    pointsRef,
    drawCurve
  };
};