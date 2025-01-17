import * as PIXI from 'pixi.js';

export interface Point {
  x: number;
  y: number;
  sprite: PIXI.Sprite;
}

export const createPointSprite = (app: PIXI.Application, x: number, y: number): Point => {
  const graphics = new PIXI.Graphics();
  graphics.beginFill(0xFFFFFF);
  graphics.lineStyle(2, 0x3B82F6);
  graphics.drawCircle(0, 0, 8);
  graphics.endFill();

  const texture = app.renderer.generateTexture(graphics);
  const sprite = new PIXI.Sprite(texture);
  
  sprite.anchor.set(0.5);
  sprite.x = x;
  sprite.y = y;
  sprite.interactive = true;
  sprite.cursor = 'pointer';

  app.stage.addChild(sprite);
  graphics.destroy();

  return { x, y, sprite };
};