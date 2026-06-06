import { state, W, H } from './state.js';
import { STATUS } from './status.js';
import { rectHit } from './physics.js';
import { applyHit } from './actions.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';
import { SPRITE_CENTER_OFFSET_Y, HITBOX_SEMI_X, HITBOX_SEMI_Y } from '../design/player.js';

const RESTITUTION     = 0.45;
const FRICTION        = 0.80;
const STOP_SPD        = 40;
const AIR_DRAG        = 0.25;
const BOUNCE_DRAG_INC = 0.20;
const BLOCK_BREAK_THRESHOLD = 72; // 이 이상 데미지면 soft 블록 즉시 파괴
const BLOCK_MIN_THRESHOLD   = 25; // 이 미만 데미지면 soft 블록 무효

function ellipseHit(ball, entity) {
  const cx = entity.x;
  const cy = entity.y + SPRITE_CENTER_OFFSET_Y;
  const ea = HITBOX_SEMI_X + ball.r;
  const eb = HITBOX_SEMI_Y + ball.r;
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  return (dx * dx) / (ea * ea) + (dy * dy) / (eb * eb) <= 1;
}

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
  const hitThisFrame = new Set();
  for (let iter = 0; iter < 3; iter++) {
    let hit = false;
    state.obstacles.forEach(o => {
      if (o.hp <= 0) return;
      if (!rectHit(ball.x, ball.y, ball.r, o)) return;
      resolveObstacle(ball, o);
      if (o.type === 'soft' && !hitThisFrame.has(o)) {
        hitThisFrame.add(o);
        const curSpd    = Math.hypot(ball.vx, ball.vy);
        const spdRatio  = ball.throwSpd > 0 ? Math.min(1, curSpd / ball.throwSpd) : 1;
        const ballDmg   = (ball.throwStr ?? 100) * 0.4 * (ball.power ?? 1) * spdRatio;
        const blockDmg  = ballDmg >= BLOCK_BREAK_THRESHOLD ? 2
                        : ballDmg >= BLOCK_MIN_THRESHOLD   ? 1
                        : 0;
        if (blockDmg > 0) o.hp = Math.max(0, o.hp - blockDmg);
      }
      hit = true;
    });
    if (!hit) break;
    bounced = true;
  }

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
  const speedRatio = ball.throwSpd > 0 ? Math.min(1, ballSpd / ball.throwSpd) : 1;
  const baseDmg = attackerStr * 0.4 * (ball.power ?? 1) * speedRatio;
  const damage = ball.flying && ball.bounces === 0 ? baseDmg
               : ball.flying && ball.bounces === 1 && ballSpd >= STATUS.player.catchMinSpd ? baseDmg * 0.5
               : 0;
  if (damage > 0) {
    if (ball.thrownBy !== 'npc' && ellipseHit(ball, npc) && npc.invTime <= 0) {
      applyHit(npc, false, damage);
      if (npc.hp <= 0) return 'win';
    }
    if (ball.thrownBy !== 'player' && ellipseHit(ball, player) && player.invTime <= 0) {
      applyHit(player, true, damage);
      if (player.hp <= 0) return 'lose';
    }
  }

  return null;
}
