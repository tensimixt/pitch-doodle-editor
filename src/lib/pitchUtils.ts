import { Point } from 'pixi.js';

export const calculateCurvePoints = (points: { x: number; y: number }[]): Point[] => {
  if (points.length < 2) return [];

  const curvePoints: Point[] = [];
  const tension = 0.5;
  const numOfSegments = 16;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let t = 0; t <= numOfSegments; t++) {
      const t1 = t / numOfSegments;

      const t2 = t1 * t1;
      const t3 = t2 * t1;

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t1 +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );

      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t1 +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );

      curvePoints.push(new Point(x, y));
    }
  }

  return curvePoints;
};