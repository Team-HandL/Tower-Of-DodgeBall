import { state, W, H } from './state.js';
import { STATUS } from './status.js';
import { rectHit, dist } from './physics.js';
import { applyHit } from './actions.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';

const RESTITUTION     = 0.45;
const FRICTION        = 0.80;
const STOP_SPD        = 40;
const AIR_DRAG        = 0.25;
const BOUNCE_DRAG_INC = 0.20;

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

  const drag = 1 - (AIR_DRAG + ball.bounces * BOUNCE_DRAG_INC) * dt;
  ball.vx *= drag;
  ball.vy *= drag;

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
  if (Math.hypot(ball.vx, ball.vy) < STOP_SPD) {
    ball.flying = false; ball.vx = 0; ball.vy = 0; ball.thrownBy = null;
  }

  const ballSpd = Math.hypot(ball.vx, ball.vy);
  const attackerStr = ball.throwStr ?? (ball.thrownBy ? STATUS[ball.thrownBy].str : 100);
  const baseDmg = attackerStr * 0.4 * (ball.power ?? 1);
  const damage = ball.flying && ball.bounces === 0 ? baseDmg
               : ball.flying && ball.bounces === 1 && ballSpd >= STATUS.player.catchMinSpd ? baseDmg * 0.5
               : 0;
  if (damage > 0) {
    if (ball.thrownBy !== 'npc' && dist(ball, npc) < ball.r + npc.r && npc.invTime <= 0) {
      applyHit(npc, false, damage);
      if (npc.hp <= 0) return 'win';
    }
    if (ball.thrownBy !== 'player' && dist(ball, player) < ball.r + player.r && player.invTime <= 0) {
      applyHit(player, true, damage);
      if (player.hp <= 0) return 'lose';
    }
  }

  return null;
}
