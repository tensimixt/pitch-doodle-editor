import * as PIXI from 'pixi.js';

export interface Point {
  x: number;
  y: number;
  sprite: PIXI.Sprite;
}

export const createPointSprite = (app: PIXI.Application, x: number, y: number): Point => {
  const circle = new PIXI.Graphics();
  circle.beginFill(0x3B82F6);
  circle.drawCircle(0, 0, 6);
  circle.endFill();
  
  const texture = app.renderer.generateTexture(circle);
  const sprite = new PIXI.Sprite(texture);
  
  sprite.anchor.set(0.5);
  sprite.x = x;
  sprite.y = y;
  sprite.interactive = true;
  sprite.cursor = 'pointer';

  app.stage.addChild(sprite);

  return { x, y, sprite };
};