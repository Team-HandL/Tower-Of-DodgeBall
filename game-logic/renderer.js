import { state, W, H } from './state.js';
import { drawBackground } from '../design/map-01/background.js';
import { drawNPC } from '../design/map-01/npc.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';
import { drawBall } from '../design/ball.js';
import { drawPlayer } from '../design/player.js';

function drawMap(ctx) {
  drawBackground(ctx, W, H);
  OBSTACLES.forEach(o => {
    ctx.fillStyle = '#3a4a3a';
    ctx.strokeStyle = '#5a6a5a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 6);
    ctx.fill();
    ctx.stroke();
  });
}

export function draw(ctx) {
  const { ball, player, npc } = state;
  ctx.clearRect(0, 0, W, H);
  drawMap(ctx);
  drawBall(ctx, ball, player, npc);
  drawPlayer(ctx, player, npc, ball);
  drawNPC(ctx, npc);
}
