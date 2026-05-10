import { state, W, H } from './state.js';
import { rectHit, dist } from './physics.js';
import { applyHit } from './actions.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';

// Returns 'win', 'lose', or null
export function updateBall(dt) {
  const { ball, npc, player } = state;
  if (!ball.flying) return null;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  let bounced = false;
  OBSTACLES.forEach(o => {
    if (rectHit(ball.x, ball.y, ball.r, o)) {
      ball.vx *= -0.7;
      ball.vy *= -0.7;
      ball.x += ball.vx * dt * 4;
      ball.y += ball.vy * dt * 4;
      bounced = true;
    }
  });
  if (ball.x < ball.r || ball.x > W - ball.r) {
    ball.vx *= -0.8;
    ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x));
    bounced = true;
  }
  if (ball.y < ball.r || ball.y > H - ball.r) {
    ball.vy *= -0.8;
    ball.y = Math.max(ball.r, Math.min(H - ball.r, ball.y));
    bounced = true;
  }
  if (bounced) { ball.bounces++; npc.dodgeDir = null; }
  if (Math.hypot(ball.vx, ball.vy) < 18) {
    ball.flying = false; ball.vx = 0; ball.vy = 0; ball.thrownBy = null;
  }

  const canHit = ball.flying && ball.bounces === 0;
  if (canHit && ball.thrownBy !== 'npc' && dist(ball, npc) < ball.r + npc.r && npc.invTime <= 0) {
    applyHit(npc, false);
    if (npc.hp <= 0) return 'win';
  }
  if (canHit && ball.thrownBy !== 'player' && dist(ball, player) < ball.r + player.r && player.invTime <= 0) {
    applyHit(player, true);
    if (player.hp <= 0) return 'lose';
  }

  return null;
}
