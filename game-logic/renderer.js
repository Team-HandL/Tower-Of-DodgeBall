import { state, W, H } from './state.js';
import { drawBackground } from '../design/map-01/background.js';
import { drawNPC } from '../design/map-01/npc.js';
import { OBSTACLE_GROUPS, drawBlock } from '../design/map-01/obstacles.js';
import { drawBall } from '../design/ball.js';
import { drawPlayer } from '../design/player.js';

function drawMap(ctx) {
  drawBackground(ctx, W, H);
  OBSTACLE_GROUPS.forEach(group =>
    group.forEach(({ c, r }) => {
      const obs = state.obstacles?.find(o => o.c === c && o.r === r);
      const hp = obs ? obs.hp : Infinity;
      drawBlock(ctx, c, r, hp);
    })
  );
}

export function draw(ctx) {
  const { ball, player, npc } = state;
  ctx.clearRect(0, 0, W, H);
  drawMap(ctx);
  drawBall(ctx, ball, player, npc);
  drawPlayer(ctx, player, npc, ball);
  drawNPC(ctx, npc);

  // 타이머
  const secs = Math.ceil(state.timer);
  const timeStr = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  ctx.font = state.timer <= 30 ? '30px PFStardustExtraBold, sans-serif' : '30px PFStardust, sans-serif';
  ctx.fillStyle = state.timer <= 30 ? 'rgba(220,60,60,1)' : 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, W / 2, 40);
}
