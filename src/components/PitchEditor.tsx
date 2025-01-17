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

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize PIXI Application
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1F2937,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      canvas: document.createElement('canvas'),
    });

    // Store app reference
    appRef.current = app;

    // Append canvas to container
    if (app.view instanceof HTMLCanvasElement) {
      containerRef.current.appendChild(app.view);
    }

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

    // Cleanup function
    return () => {
      if (app && app.view) {
        app.view.removeEventListener('mousedown', handleMouseDown);
        app.view.removeEventListener('mousemove', handleMouseMove);
        app.view.removeEventListener('mouseup', handleMouseUp);
      }
      app.destroy(true);
      appRef.current = null;
    };
  }, [width, height]);

  // Add event listeners after initialization
  useEffect(() => {
    if (!isInitialized || !appRef.current?.view) return;

    const view = appRef.current.view;
    view.addEventListener('mousedown', handleMouseDown);
    view.addEventListener('mousemove', handleMouseMove);
    view.addEventListener('mouseup', handleMouseUp);

    // Create initial points after initialization
    createPoint(50, height / 2);
    createPoint(width - 50, height / 2);
  }, [isInitialized, height, width]);

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
    if (!appRef.current || !isInitialized) return;

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
    if (!appRef.current?.view || !isInitialized) return;

    const rect = appRef.current.view.getBoundingClientRect();
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
    if (!isDraggingRef.current || !selectedPointRef.current || !appRef.current?.view) return;

    const rect = appRef.current.view.getBoundingClientRect();
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
