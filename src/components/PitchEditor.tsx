import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { calculateCurvePoints } from '@/lib/pitchUtils';

interface Point {
  x: number;
  y: number;
  sprite: PIXI.Sprite;
}

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

  useEffect(() => {
    if (!containerRef.current) return;

    // Create and configure canvas
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    // Append canvas to container first
    containerRef.current.appendChild(canvas);

    // Initialize PIXI Application with the canvas
    const app = new PIXI.Application({
      view: canvas,
      width: canvas.width,
      height: canvas.height,
      backgroundColor: 0x1F2937,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Store app reference
    appRef.current = app;

    // Create graphics for lines and grid
    const lineGraphics = new PIXI.Graphics();
    const gridGraphics = new PIXI.Graphics();
    app.stage.addChild(gridGraphics);
    app.stage.addChild(lineGraphics);
    lineGraphicsRef.current = lineGraphics;
    gridGraphicsRef.current = gridGraphics;

    // Draw initial grid
    drawGrid();

    // Set initialization flag
    setIsInitialized(true);

    // Create initial points after initialization
    createPoint(50, height / 2);
    createPoint(width - 50, height / 2);

    // Add event listeners
    const handleMouseDownWrapper = (e: MouseEvent) => handleMouseDown(e);
    const handleMouseMoveWrapper = (e: MouseEvent) => handleMouseMove(e);
    const handleMouseUpWrapper = () => handleMouseUp();

    canvas.addEventListener('mousedown', handleMouseDownWrapper);
    canvas.addEventListener('mousemove', handleMouseMoveWrapper);
    canvas.addEventListener('mouseup', handleMouseUpWrapper);

    // Cleanup function
    return () => {
      // Remove event listeners
      canvas.removeEventListener('mousedown', handleMouseDownWrapper);
      canvas.removeEventListener('mousemove', handleMouseMoveWrapper);
      canvas.removeEventListener('mouseup', handleMouseUpWrapper);

      // Clean up PIXI resources
      if (appRef.current) {
        pointsRef.current.forEach(point => {
          if (point.sprite) {
            point.sprite.destroy();
          }
        });
        pointsRef.current = [];
        
        if (lineGraphicsRef.current) {
          lineGraphicsRef.current.destroy();
          lineGraphicsRef.current = null;
        }
        
        if (gridGraphicsRef.current) {
          gridGraphicsRef.current.destroy();
          gridGraphicsRef.current = null;
        }

        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }

      // Remove canvas from container
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, [width, height]);

  const drawGrid = () => {
    if (!gridGraphicsRef.current) return;

    const graphics = gridGraphicsRef.current;
    graphics.clear();
    graphics.lineStyle(1, 0x374151, 0.3);

    // Draw vertical lines
    for (let x = 0; x <= width; x += 50) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += 50) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
    }
  };

  const createPoint = (x: number, y: number) => {
    if (!appRef.current || !isInitialized || !appRef.current.renderer) return;

    const circle = new PIXI.Graphics();
    circle.beginFill(0x3B82F6);
    circle.drawCircle(0, 0, 6);
    circle.endFill();
    
    const texture = appRef.current.renderer.generateTexture(circle);
    const sprite = new PIXI.Sprite(texture);
    
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;
    sprite.interactive = true;
    sprite.cursor = 'pointer';

    appRef.current.stage.addChild(sprite);

    const point: Point = { x, y, sprite };
    pointsRef.current.push(point);
    
    // Sort points by x coordinate
    pointsRef.current.sort((a, b) => a.x - b.x);
    
    drawCurve();
    return point;
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

  const handleMouseDown = (event: MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on existing point
    const point = pointsRef.current.find(p => 
      Math.abs(p.x - x) < 10 && Math.abs(p.y - y) < 10
    );

    if (point) {
      isDraggingRef.current = true;
      selectedPointRef.current = point;
      point.sprite.tint = 0x2563EB;
    } else if (pointsRef.current.length < 10) { // Limit max points
      createPoint(x, y);
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDraggingRef.current || !selectedPointRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update point position
    selectedPointRef.current.x = Math.max(0, Math.min(width, x));
    selectedPointRef.current.y = Math.max(0, Math.min(height, y));
    selectedPointRef.current.sprite.x = selectedPointRef.current.x;
    selectedPointRef.current.sprite.y = selectedPointRef.current.y;

    // Sort points by x coordinate
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

  return <div ref={containerRef} className="rounded-lg overflow-hidden border border-gray-700" />;
};

export default PitchEditor;