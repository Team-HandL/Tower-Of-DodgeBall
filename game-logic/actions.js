import { state } from './state.js';
import { BASE, STATUS } from './status.js';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function getPowerMultiplier(who, gauge) {
  const stats = STATUS[who];
  const min = stats.minPower ?? BASE.player.minPower;
  const max = stats.maxPower ?? BASE.player.maxPower;
  return min + clamp01(gauge) * (max - min);
}

export function getThrowVelocity(who, gauge) {
  const stats = STATUS[who];
  const strSpeedBonus = Math.sqrt(stats.str / BASE.player.str);
  return stats.velocity * getPowerMultiplier(who, gauge) * strSpeedBonus;
}

export function catchBall() {
  const { ball, player } = state;
  ball.flying   = false;
  ball.vx       = 0;
  ball.vy       = 0;
  ball.owner    = 'player';
  ball.thrownBy = null;
  ball.bounces  = 0;
  player.hasBall = true;
}

export function doThrow(from, tx, ty, spd, who, power = 1) {
  const { ball } = state;
  const oy = from.spriteCenterY ?? from.y;
  const dx = tx - from.x, dy = ty - oy, d = Math.hypot(dx, dy) || 1;
  const offset = from.r + ball.r + 10;
  ball.x = from.x + (dx / d) * offset;
  ball.y = oy + (dy / d) * offset;
  ball.vx = (dx / d) * spd;
  ball.vy = (dy / d) * spd;
  ball.owner = null;
  ball.thrownBy = who;
  ball.flying = true;
  ball.bounces = 0;
  ball.power = power;
  ball.throwStr = STATUS[who]?.str ?? BASE.player.str;
  from.hasBall = false;
  if (from.charge) {
    from.charge.active = false;
    from.charge.value = 0;
  }
  from.invTime = Math.max(from.invTime, 0.3);
}

export function pickUpBall(who) {
  const { ball, player, npc } = state;
  ball.owner = who;
  ball.flying = false;
  ball.vx = 0;
  ball.vy = 0;
  ball.power = 1;
  ball.throwStr = STATUS[who]?.str ?? BASE.player.str;
  if (who === 'player') player.hasBall = true;
  if (who === 'npc') {
    npc.hasBall = true;
    npc.dodgeDir = null;
    npc.aimTimer = 0.5 + Math.random() * 0.5;
  }
}

export function applyHit(target, isPlayer, damage = 40) {
  const { ball } = state;
  target.hp = Math.max(0, target.hp - damage);
  target.invTime = 1.5;
  target.grogyTime = 0.7;
  target.hasBall = false;
  ball.flying = false;
  ball.vx = 0;
  ball.vy = 0;
  ball.owner = null;
  ball.thrownBy = null;
  ball.power = 1;
  ball.throwStr = BASE.player.str;
  ball.x = target.x + (isPlayer ? 1 : -1) * (target.r + ball.r + 6);
  ball.y = target.y;
}

export function startPlayerCharge() {
  const { player } = state;
  if (!player.hasBall || player.grogyTime > 0) return false;
  player.charge.active = true;
  player.charge.value = 0;
  return true;
}

export function updatePlayerCharge(dt) {
  const { player } = state;
  if (!player.charge?.active) return;
  if (!player.hasBall || player.grogyTime > 0) {
    player.charge.active = false;
    player.charge.value = 0;
    return;
  }
  const strRateBonus = STATUS.player.str / BASE.player.str;
  player.charge.value = clamp01(player.charge.value + BASE.player.chargeRate * strRateBonus * dt);
}

export function releasePlayerCharge() {
  const { player } = state;
  if (!player.charge?.active || !player.hasBall || player.grogyTime > 0) return false;
  const gauge = player.charge.value;
  const { facing } = player;
  doThrow(
    player,
    player.x + facing.x * 1000,
    player.y + facing.y * 1000,
    getThrowVelocity('player', gauge),
    'player',
    getPowerMultiplier('player', gauge)
  );
  return true;
}
