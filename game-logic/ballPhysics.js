import { state, W, H } from './state.js';
import { rectHit, dist } from './physics.js';
import { applyHit } from './actions.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';

const RESTITUTION = 0.65;
const FRICTION    = 0.85;

function resolveObstacle(ball, o) {
  const left   = ball.x + ball.r - o.x;
  const right  = o.x + o.w - (ball.x - ball.r);
  const top    = ball.y + ball.r - o.y;
  const bottom = o.y + o.h - (ball.y - ball.r);
  const minX = Math.min(left, right);
  const minY = Math.min(top, bottom);
  if (minX < minY) {
    ball.x += left < right ? -left : right;
    ball.vx *= -RESTITUTION;
    ball.vy *=  FRICTION;
  } else {
    ball.y += top < bottom ? -top : bottom;
    ball.vy *= -RESTITUTION;
    ball.vx *=  FRICTION;
  }
}

// Returns 'win', 'lose', or null
export function updateBall(dt) {
  const { ball, npc, player } = state;
  if (!ball.flying) return null;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  let bounced = false;
  OBSTACLES.forEach(o => {
    if (!rectHit(ball.x, ball.y, ball.r, o)) return;
    resolveObstacle(ball, o);
    bounced = true;
  });

  if (ball.x - ball.r < 0) {
    ball.vx  = Math.abs(ball.vx) * RESTITUTION;
    ball.vy *= FRICTION;
    ball.x   = ball.r;
    bounced  = true;
  } else if (ball.x + ball.r > W) {
    ball.vx  = -Math.abs(ball.vx) * RESTITUTION;
    ball.vy *= FRICTION;
    ball.x   = W - ball.r;
    bounced  = true;
  }
  if (ball.y - ball.r < 0) {
    ball.vy  = Math.abs(ball.vy) * RESTITUTION;
    ball.vx *= FRICTION;
    ball.y   = ball.r;
    bounced  = true;
  } else if (ball.y + ball.r > H) {
    ball.vy  = -Math.abs(ball.vy) * RESTITUTION;
    ball.vx *= FRICTION;
    ball.y   = H - ball.r;
    bounced  = true;
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
