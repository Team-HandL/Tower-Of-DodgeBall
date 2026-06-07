import { state, heldBall, CONFIG } from './state.js';
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

export function catchBall(ball) {
  const { player } = state;
  if (!ball) return;
  ball.flying   = false;
  ball.vx       = 0;
  ball.vy       = 0;
  ball.owner    = 'player';
  ball.thrownBy = null;
  ball.bounces  = 0;
  player.hasBall = true;
  player.catchTime = 1.6;
}

export function doThrow(from, tx, ty, spd, who, power = 1) {
  const ball = heldBall(who);
  if (!ball) return;
  const oy = from.spriteCenterY ?? from.y;
  const dx = tx - from.x, dy = ty - oy, d = Math.hypot(dx, dy) || 1;
  ball.x = from.x;
  ball.y = oy;
  ball.vx = (dx / d) * spd;
  ball.vy = (dy / d) * spd;
  ball.owner = null;
  ball.thrownBy = who;
  ball.flying = true;
  ball.bounces = 0;
  ball.power = power;
  ball.throwStr = STATUS[who]?.str ?? BASE.player.str;
  ball.throwSpd = spd;
  from.hasBall = false;
  if (from.charge) {
    from.charge.active = false;
    from.charge.value = 0;
  }
  from.invTime = Math.max(from.invTime, 0.3);
}

export function pickUpBall(who, ball) {
  const { player, npc } = state;
  if (!ball) return;
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
    const aggression = npc.ai?.aggression ?? 0.7;
    npc.aimTimer = Math.max(0.45, 1.1 - aggression * 0.55) + Math.random() * (0.8 - aggression * 0.35);
  }
}

export function applyHit(target, isPlayer, damage = 40, ball = null) {
  target.hp = Math.max(0, target.hp - damage);
  target.invTime = 1.5;
  target.grogyTime = 0.7;
  target.hasBall = false;

  // NPC가 맞으면 피격 전용 대사를 띄운다 (일상 대사보다 우선).
  if (!isPlayer && target.hp > 0 && target.hitLines?.length) {
    target.speech = target.hitLines[Math.floor(Math.random() * target.hitLines.length)];
    target.speechTime = CONFIG.speechDuration;
  }

  // 피격으로 그로기 — 들고 있던 공이 있으면 제자리에 떨어뜨린다.
  const heldByTarget = heldBall(isPlayer ? 'player' : 'npc');
  if (heldByTarget && heldByTarget !== ball) {
    heldByTarget.owner = null;
    heldByTarget.flying = false;
    heldByTarget.vx = 0;
    heldByTarget.vy = 0;
    heldByTarget.x = target.x;
    heldByTarget.y = target.y;
  }

  if (!ball) return;
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
