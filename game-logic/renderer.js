import { state, W, H } from './state.js';
import { drawBackground } from '../design/map-01/background.js';
import { drawNPC } from '../design/map-01/npc.js';
import { OBSTACLE_GROUPS, drawBlock } from '../design/map-01/obstacles.js';
import { drawBall } from '../design/ball.js';
import { drawPlayer } from '../design/player.js';

function drawMap(ctx) {
  drawBackground(ctx, W, H);
  OBSTACLE_GROUPS.forEach(group =>
    group.forEach(({ c, r }) => drawBlock(ctx, c, r))
  );
}

export function draw(ctx) {
  const { ball, player, npc } = state;
  ctx.clearRect(0, 0, W, H);
  drawMap(ctx);
  drawBall(ctx, ball, player, npc);
  drawPlayer(ctx, player, npc, ball);
  drawNPC(ctx, npc);

  // DEBUG: 공 속력 표시
  const spd = Math.hypot(ball.vx, ball.vy);
  ctx.font = '13px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText(`ball spd: ${spd.toFixed(0)}  bounces: ${ball.bounces}`, 10, 20);
}
