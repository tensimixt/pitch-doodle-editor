import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { calculateCurvePoints } from '@/lib/pitchUtils';
import { setupCanvas, createPixiApp } from '@/lib/canvasSetup';
import { Point, createPointSprite } from '@/lib/pointManager';

interface PitchEditorProps {
  width: number;
  height: number;
}

const PitchEditor = ({ width, height }: PitchEditorProps) => {
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
    graphics.clear();
    graphics.lineStyle(1, 0x374151, 0.3);

    for (let x = 0; x <= width; x += 50) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += 50) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
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
    if (!appRef.current || !isInitialized) return;

    const point = createPointSprite(appRef.current, x, y);
    pointsRef.current.push(point);
    pointsRef.current.sort((a, b) => a.x - b.x);
    drawCurve();
    return point;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = setupCanvas(width, height);
    canvasRef.current = canvas;
    containerRef.current.appendChild(canvas);

    const app = createPixiApp(canvas);
    appRef.current = app;

    const lineGraphics = new PIXI.Graphics();
    const gridGraphics = new PIXI.Graphics();
    app.stage.addChild(gridGraphics);
    app.stage.addChild(lineGraphics);
    lineGraphicsRef.current = lineGraphics;
    gridGraphicsRef.current = gridGraphics;

    drawGrid();
    setIsInitialized(true);

    const handleMouseDown = (event: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const point = pointsRef.current.find(p => 
        Math.abs(p.x - x) < 10 && Math.abs(p.y - y) < 10
      );

      if (point) {
        isDraggingRef.current = true;
        selectedPointRef.current = point;
        point.sprite.tint = 0x2563EB;
      } else if (pointsRef.current.length < 10) {
        createPoint(x, y);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !selectedPointRef.current || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      selectedPointRef.current.x = Math.max(0, Math.min(width, x));
      selectedPointRef.current.y = Math.max(0, Math.min(height, y));
      selectedPointRef.current.sprite.x = selectedPointRef.current.x;
      selectedPointRef.current.sprite.y = selectedPointRef.current.y;

      pointsRef.current.sort((a, b) => a.x - b.x);
      drawCurve();
    };

    const handleMouseUp = () => {
      if (selectedPointRef.current) {
        selectedPointRef.current.sprite.tint = 0xFFFFFF;
      }
      isDraggingRef.current = false;
      selectedPointRef.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    createPoint(50, height / 2);
    createPoint(width - 50, height / 2);

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
      }

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

  return <div ref={containerRef} className="rounded-lg overflow-hidden border border-gray-700" />;
};

export default PitchEditor;