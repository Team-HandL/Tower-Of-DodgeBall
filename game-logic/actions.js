import { state, heldBall, CONFIG, W, H } from './state.js';
import { BASE, STATUS } from './status.js';

// 공이 살아있는 블록과 겹치면 가장 얕은 축으로 '가장 가까운 면' 밖으로 밀어낸다.
// 던지는 방향으로 밀면 벽을 통과해 반대편에서 발사되므로, 최단 축 밀어내기를 쓴다.
function pushBallOutOfObstacles(ball) {
  const obs = state.obstacles ?? [];
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const o of obs) {
      if (o.hp <= 0) continue;
      if (!(ball.x + ball.r > o.x && ball.x - ball.r < o.x + o.w &&
            ball.y + ball.r > o.y && ball.y - ball.r < o.y + o.h)) continue;
      const left   = ball.x + ball.r - o.x;
      const right  = o.x + o.w - (ball.x - ball.r);
      const top    = ball.y + ball.r - o.y;
      const bottom = o.y + o.h - (ball.y - ball.r);
      const minX = Math.min(left, right);
      const minY = Math.min(top, bottom);
      if (minX < minY) ball.x += left < right ? -left : right;
      else             ball.y += top < bottom ? -top : bottom;
      moved = true;
    }
    if (!moved) break;
  }
  ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x));
  ball.y = Math.max(ball.r, Math.min(H - ball.r, ball.y));
}

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
  const ux = dx / d, uy = dy / d;
  ball.x = from.x;
  ball.y = oy;
  // 발사 위치가 블록과 겹치면(스프라이트 중심이 블록 모서리/아래에 박힌 경우)
  // 가장 가까운 면 밖으로 밀어 깨끗한 지점에서 출발시킨다 — 발사 직후 튕김/벽 통과 방지.
  pushBallOutOfObstacles(ball);
  ball.vx = ux * spd;
  ball.vy = uy * spd;
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
    const pickupAimDelay = npc.ai?.pickupAimDelay;
    if (pickupAimDelay) {
      npc.aimTimer = pickupAimDelay.min + Math.random() * (pickupAimDelay.max - pickupAimDelay.min);
      return;
    }
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
