import * as PIXI from 'pixi.js';

export interface Point {
  x: number;
  y: number;
  sprite: PIXI.Sprite;
}

export const createPointSprite = (app: PIXI.Application, x: number, y: number): Point => {
  if (!app || !app.renderer) {
    throw new Error('PIXI Application or renderer not initialized');
  }

  const circle = new PIXI.Graphics();
  circle.beginFill(0x3B82F6);
  circle.drawCircle(0, 0, 6);
  circle.endFill();
  
  const renderTexture = PIXI.RenderTexture.create({
    width: 12,
    height: 12,
    resolution: window.devicePixelRatio || 1
  });
  
  app.renderer.render(circle, { renderTexture });
  const sprite = new PIXI.Sprite(renderTexture);
  
  sprite.anchor.set(0.5);
  sprite.x = x;
  sprite.y = y;
  sprite.interactive = true;
  sprite.cursor = 'pointer';

  app.stage.addChild(sprite);
  circle.destroy();

  return { x, y, sprite };
};