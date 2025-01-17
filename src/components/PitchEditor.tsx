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

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize PIXI Application with proper settings
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1F2937,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Store the app reference
    appRef.current = app;

    // Create and append the canvas
    containerRef.current.appendChild(app.view as HTMLCanvasElement);

    // Create graphics for lines and grid
    const lineGraphics = new PIXI.Graphics();
    const gridGraphics = new PIXI.Graphics();
    app.stage.addChild(gridGraphics);
    app.stage.addChild(lineGraphics);
    lineGraphicsRef.current = lineGraphics;
    gridGraphicsRef.current = gridGraphics;

    // Draw initial grid
    drawGrid();

    // Event listeners
    const canvas = app.view as HTMLCanvasElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Cleanup function
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
      }
      
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }

      if (containerRef.current && canvas.parentNode === containerRef.current) {
        containerRef.current.removeChild(canvas);
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
    if (!appRef.current) return;

    const texture = PIXI.Texture.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ODM1RTg1NDJCQzhFMTFFNjk0NjFBNjZEN0RFRjFGREIiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6ODM1RTg1NDNCQzhFMTFFNjk0NjFBNjZEN0RFRjFGREIiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo4MzVFODU0MEJDOEUxMUU2OTQ2MUE2NkQ3REVGMUZEQiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo4MzVFODU0MUJDOEUxMUU2OTQ2MUE2NkQ3REVGMUZEQiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsQ6PpgAAADWSURBVHjaYvz//z8DCDAyMjIwMQABCwMI/GVg4AFiRqACXiDmBGJWIGYHYlYgZgFiFiBmBmImIGYEYgYgZgBiBiAGKWACKQAp+AfE/6DiQPwXiP8A8W8g/gXEP4H4BxB/B+JvQPwViL8A8Wcg/gTEH4H4AxC/B+J3QPwWiN8A8SsgfgnEL4D4GRA/AeJHQPwQiB8A8X0gvgfEd4H4DhDfBuJbQHwTiG8A8XUgvgbEV4H4ChBfBuJLQHwRiC8A8XkgPgfEZ4H4DBCfBuJTQHwSiE8A8XEgPgYQYACL+jz1pFSYJQAAAABJRU5ErkJggg==');
    const sprite = new PIXI.Sprite(texture);
    
    sprite.anchor.set(0.5);
    sprite.width = 8;
    sprite.height = 8;
    sprite.tint = 0xFFFFFF;
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
    if (!appRef.current) return;

    const rect = (appRef.current.view as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on existing point
    const point = pointsRef.current.find(p => 
      Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5
    );

    if (point) {
      isDraggingRef.current = true;
      selectedPointRef.current = point;
    } else {
      createPoint(x, y);
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDraggingRef.current || !selectedPointRef.current || !appRef.current) return;

    const rect = (appRef.current.view as HTMLCanvasElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update point position
    selectedPointRef.current.x = Math.max(0, Math.min(width, x));
    selectedPointRef.current.y = Math.max(0, Math.min(height, y));
    selectedPointRef.current.sprite.x = selectedPointRef.current.x;
    selectedPointRef.current.sprite.y = selectedPointRef.current.y;

    drawCurve();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    selectedPointRef.current = null;
  };

  return <div ref={containerRef} className="rounded-lg overflow-hidden" />;
};

export default PitchEditor;