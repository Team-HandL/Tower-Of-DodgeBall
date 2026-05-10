import { state } from './state.js';

export function doThrow(from, tx, ty, spd, who) {
  const { ball } = state;
  const dx = tx - from.x, dy = ty - from.y, d = Math.hypot(dx, dy) || 1;
  const offset = from.r + ball.r + 10;
  ball.x = from.x + (dx / d) * offset;
  ball.y = from.y + (dy / d) * offset;
  ball.vx = (dx / d) * spd;
  ball.vy = (dy / d) * spd;
  ball.owner = null;
  ball.thrownBy = who;
  ball.flying = true;
  ball.bounces = 0;
  from.hasBall = false;
  from.invTime = Math.max(from.invTime, 0.3);
}

export function pickUpBall(who) {
  const { ball, player, npc } = state;
  ball.owner = who;
  ball.flying = false;
  ball.vx = 0;
  ball.vy = 0;
  if (who === 'player') player.hasBall = true;
  if (who === 'npc') {
    npc.hasBall = true;
    npc.dodgeDir = null;
    npc.aimTimer = 0.5 + Math.random() * 0.5;
  }
}

export function applyHit(target, isPlayer) {
  const { ball } = state;
  target.hp = Math.max(0, target.hp - 1);
  target.invTime = 1.5;
  target.grogyTime = 0.7;
  target.hasBall = false;
  ball.flying = false;
  ball.vx = 0;
  ball.vy = 0;
  ball.owner = null;
  ball.thrownBy = null;
  ball.x = target.x + (isPlayer ? 1 : -1) * (target.r + ball.r + 6);
  ball.y = target.y;
}
