import { useEffect } from 'react';
import { usePitchEditor } from '@/hooks/usePitchEditor';

interface PitchEditorProps {
  width: number;
  height: number;
}

const PitchEditor = ({ width, height }: PitchEditorProps) => {
  const {
    containerRef,
    canvasRef,
    isInitialized,
    createPoint,
    isDraggingRef,
    selectedPointRef,
    pointsRef,
    drawCurve
  } = usePitchEditor({ width, height });

  useEffect(() => {
    if (!canvasRef.current || !isInitialized) return;

    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const scale = window.devicePixelRatio || 1;
      const scaledX = x * scale;
      const scaledY = y * scale;

      const point = pointsRef.current.find(p => 
        Math.abs(p.x - scaledX) < 10 && Math.abs(p.y - scaledY) < 10
      );

      if (point) {
        isDraggingRef.current = true;
        selectedPointRef.current = point;
        point.sprite.tint = 0x2563EB;
      } else if (pointsRef.current.length < 10) {
        createPoint(scaledX, scaledY);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !selectedPointRef.current || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      const x = (event.clientX - rect.left) * scale;
      const y = (event.clientY - rect.top) * scale;

      selectedPointRef.current.x = Math.max(0, Math.min(width * scale, x));
      selectedPointRef.current.y = Math.max(0, Math.min(height * scale, y));
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

    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [width, height, isInitialized, createPoint, drawCurve]);

  return <div ref={containerRef} className="rounded-lg overflow-hidden border border-gray-700" />;
};

export default PitchEditor;