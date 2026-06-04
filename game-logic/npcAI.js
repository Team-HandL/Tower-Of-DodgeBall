import { state, SAFE_DIST, W, H } from './state.js';
import { STATUS } from './status.js';
import { moveEntity, dist, hasLOS } from './physics.js';
import { doThrow, pickUpBall } from './actions.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';

// facing 평활 계수: 한 프레임에 목표 방향으로 이만큼만 회전(0~1).
// 작을수록 안정적이지만 방향 전환이 느려진다. 장애물에 막혀 희망 방향이
// 매 프레임 정반대로 뒤집혀도(±x 교번) 평활된 벡터는 거의 안 움직이므로
// left↔right 스프라이트 깜빡임이 사라진다.
const FACING_SMOOTH = 0.18;
const DEFAULT_AI = {
  reactionDelay: 0.22,
  aimError: 35,
  dodgeSkill: 0.55,
  aggression: 0.7,
  pickupGreed: 0.65,
  wallAwareness: 0.65,
};

function ai() {
  return { ...DEFAULT_AI, ...(state.npc.ai || {}) };
}

/** 이동 방향 벡터로 NPC facing 갱신 (지수 평활) */
function setFacing(entity, dx, dy) {
  const d = Math.hypot(dx, dy);
  if (d <= 0.001) return;
  const tx = dx / d, ty = dy / d;
  const f = entity.facing ?? { x: tx, y: ty };
  const sx = f.x + (tx - f.x) * FACING_SMOOTH;
  const sy = f.y + (ty - f.y) * FACING_SMOOTH;
  const sd = Math.hypot(sx, sy) || 1;
  entity.facing = { x: sx / sd, y: sy / sd };
}

function wallAvoidance(entity, strength) {
  const margin = 74;
  let ax = 0, ay = 0;
  if (entity.x < margin) ax += (margin - entity.x) / margin;
  if (entity.x > W - margin) ax -= (entity.x - (W - margin)) / margin;
  if (entity.y < margin) ay += (margin - entity.y) / margin;
  if (entity.y > H - margin) ay -= (entity.y - (H - margin)) / margin;
  return { x: ax * strength, y: ay * strength };
}

function tryMove(entity, dx, dy, speed) {
  const d = Math.hypot(dx, dy);
  if (d <= 0.001) return false;
  const ux = dx / d, uy = dy / d;
  const px = entity.x, py = entity.y;
  moveEntity(entity, ux, uy, speed);
  const mx = entity.x - px, my = entity.y - py;
  const progress = mx * ux + my * uy;
  return progress > speed * 0.35;
}

function wouldOpenShot(x, y, player) {
  return hasLOS({ x, y }, player);
}

function lineIntersectsRect(a, b, o) {
  for (let i = 1; i < 18; i++) {
    const t = i / 18;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return true;
  }
  return false;
}

function blockingObstacle(a, b) {
  return OBSTACLES.find(o => lineIntersectsRect(a, b, o)) || null;
}

function clampPoint(p) {
  return {
    x: Math.max(36, Math.min(W - 36, p.x)),
    y: Math.max(36, Math.min(H - 36, p.y)),
  };
}

function getBypassTarget(blocker) {
  const { npc, player } = state;
  if (!blocker) return null;
  const pad = npc.r + 34;
  const corners = [
    { x: blocker.x - pad, y: blocker.y - pad },
    { x: blocker.x + blocker.w + pad, y: blocker.y - pad },
    { x: blocker.x - pad, y: blocker.y + blocker.h + pad },
    { x: blocker.x + blocker.w + pad, y: blocker.y + blocker.h + pad },
  ].map(clampPoint);

  const sideBias = npc.sideBias || 1;
  const scored = corners.map(p => {
    const open = wouldOpenShot(p.x, p.y, player) ? 0 : 600;
    const toNpc = Math.hypot(p.x - npc.x, p.y - npc.y);
    const toPlayer = Math.hypot(p.x - player.x, p.y - player.y);
    const side = Math.sign((player.x - npc.x) * (p.y - npc.y) - (player.y - npc.y) * (p.x - npc.x)) || 1;
    const sidePenalty = side === sideBias ? 0 : 90;
    return { p, score: open + toNpc + toPlayer * 0.25 + sidePenalty };
  }).sort((a, b) => a.score - b.score);

  return scored[0]?.p ?? null;
}

function moveNPCSmart(dx, dy, speed, opts = {}) {
  const { npc } = state;
  const cfg = ai();
  const avoid = opts.avoidWalls === false ? { x: 0, y: 0 } : wallAvoidance(npc, 1.2 * cfg.wallAwareness);
  let mx = dx + avoid.x;
  let my = dy + avoid.y;
  const d = Math.hypot(mx, my);
  if (d <= 0.001) return false;

  setFacing(npc, mx, my);
  if (tryMove(npc, mx, my, speed)) {
    npc.stuckTime = 0;
    return true;
  }

  npc.stuckTime = (npc.stuckTime || 0) + 1;
  const nx = mx / d, ny = my / d;
  const sideBias = npc.sideBias || 1;
  const candidates = [
    { x: -ny * sideBias, y: nx * sideBias },
    { x: ny * sideBias, y: -nx * sideBias },
    { x: nx * 0.45 - ny * sideBias, y: ny * 0.45 + nx * sideBias },
    { x: nx * 0.45 + ny * sideBias, y: ny * 0.45 - nx * sideBias },
    { x: -nx + avoid.x * 2, y: -ny + avoid.y * 2 },
  ];

  for (const c of candidates) {
    if (tryMove(npc, c.x, c.y, speed * 0.85)) {
      setFacing(npc, c.x, c.y);
      return true;
    }
  }

  if (npc.stuckTime > 18) {
    npc.sideBias = -sideBias;
    npc.stuckTime = 0;
  }
  return false;
}

function calcBallDodgeDir() {
  const { ball, npc } = state;
  const cfg = ai();
  const bspd = Math.hypot(ball.vx, ball.vy);
  if (bspd < 1) return null;
  const bux = ball.vx / bspd, buy = ball.vy / bspd;
  const toNx = npc.x - ball.x, toNy = npc.y - ball.y;
  if (toNx * bux + toNy * buy < 0) return null;
  const crossDist = Math.abs(toNx * buy - toNy * bux);
  const dangerWidth = 38 + cfg.dodgeSkill * 36;
  if (crossDist > dangerWidth) return null;
  if (Math.random() > cfg.dodgeSkill) return null;
  const p1x = -buy, p1y = bux, p2x = buy, p2y = -bux;
  const d1 = Math.hypot(npc.x + p1x * 60 - ball.x, npc.y + p1y * 60 - ball.y);
  const d2 = Math.hypot(npc.x + p2x * 60 - ball.x, npc.y + p2y * 60 - ball.y);
  return d1 > d2 ? { x: p1x, y: p1y } : { x: p2x, y: p2y };
}

function runFromPlayer(dt, speedMult) {
  const { player, npc } = state;
  const cfg = ai();
  const dx = npc.x - player.x, dy = npc.y - player.y, d = Math.hypot(dx, dy) || 1;
  // 0.005 → 0.001: 상수가 크면 flee 벡터(크기 1)를 centering force(최대 2.25)가
  // 역전시켜 flip point(x≈650)에서 facing이 left↔right 매 프레임 교번하는 버그 발생
  const cx = (W / 2 - npc.x) * 0.0014 * cfg.wallAwareness;
  const cy = (H / 2 - npc.y) * 0.0014 * cfg.wallAwareness;
  const ex = dx / d + cx, ey = dy / d + cy, ed = Math.hypot(ex, ey) || 1;
  moveNPCSmart(ex / ed, ey / ed, STATUS.npc.spd * (speedMult || 1) * dt);
}

function repositionForShot(dt) {
  const { npc, player } = state;
  if (npc.bypassTarget && (hasLOS(npc, player) || Math.hypot(npc.bypassTarget.x - npc.x, npc.bypassTarget.y - npc.y) < 18)) {
    npc.bypassTarget = null;
  }
  const blocker = blockingObstacle(npc, player);
  const target = npc.bypassTarget || getBypassTarget(blocker);
  if (target) {
    npc.bypassTarget = target;
    const tx = target.x - npc.x, ty = target.y - npc.y;
    if (Math.hypot(tx, ty) > 10) {
      moveNPCSmart(tx, ty, STATUS.npc.spd * dt);
      return;
    }
  }

  const dx = player.x - npc.x, dy = player.y - npc.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = dx / d, ny = dy / d;
  const sideBias = npc.sideBias || 1;
  const step = 96;
  const sides = [
    { x: -ny * sideBias, y: nx * sideBias },
    { x: ny * sideBias, y: -nx * sideBias },
  ];
  const preferred = sides.find(s => wouldOpenShot(npc.x + s.x * step, npc.y + s.y * step, player)) || sides[0];
  const pullToMid = { x: (W / 2 - npc.x) * 0.002, y: (H / 2 - npc.y) * 0.002 };
  const mx = preferred.x + nx * 0.35 + pullToMid.x;
  const my = preferred.y + ny * 0.35 + pullToMid.y;
  moveNPCSmart(mx, my, STATUS.npc.spd * dt);
}

export function updateNPC(dt) {
  const { npc, player, ball } = state;
  const cfg = ai();
  if (npc.grogyTime > 0) return;
  npc.aimTimer -= dt;

  if (npc.hasBall) {
    npc.dodgeDir = null;
    if (hasLOS(npc, player)) {
      npc.bypassTarget = null;
      npc.state = 'aim';
      const d = dist(npc, player);
      if (d > 200) {
        const dx = player.x - npc.x, dy = player.y - npc.y, dd = Math.hypot(dx, dy) || 1;
        moveNPCSmart(dx / dd, dy / dd, STATUS.npc.spd * dt);
      } else if (d < 100) {
        const dx = npc.x - player.x, dy = npc.y - player.y, dd = Math.hypot(dx, dy) || 1;
        moveNPCSmart(dx / dd, dy / dd, STATUS.npc.spd * dt);
      } else {
        // 제자리 조준 — 플레이어 쪽을 바라봄
        const dx = player.x - npc.x, dy = player.y - npc.y;
        setFacing(npc, dx, dy);
      }
      if (npc.aimTimer <= 0) {
        doThrow(npc, player.x + (Math.random() - 0.5) * cfg.aimError, player.y + (Math.random() - 0.5) * cfg.aimError, STATUS.npc.velocity, 'npc');
        npc.aimTimer = Math.max(0.3, 1.2 - cfg.aggression * 0.7) + Math.random() * (0.7 - cfg.aggression * 0.35);
      }
    } else {
      npc.state = 'reposition';
      repositionForShot(dt);
    }
    return;
  }

  const ballFree      = !ball.flying && ball.owner === null;
  const ballBouncing  = ball.flying && ball.bounces > 0;
  const ballIncoming  = ball.flying && ball.thrownBy === 'player' && ball.bounces === 0;
  const playerHasBall = player.hasBall;
  const npcCloser     = dist(npc, ball) < dist(player, ball);

  if (ballIncoming) {
    npc.bypassTarget = null;
    npc.state = 'dodge';
    npc.reactionTimer = (npc.reactionTimer ?? cfg.reactionDelay) - dt;
    if (npc.reactionTimer > 0) return;
    if (!npc.dodgeDecided) {
      npc.dodgeDir = calcBallDodgeDir();
      npc.dodgeDecided = true;
    }
    if (npc.dodgeDir) {
      moveNPCSmart(npc.dodgeDir.x, npc.dodgeDir.y, STATUS.npc.spd * dt);
    } else {
      runFromPlayer(dt);
    }
    return;
  }
  npc.dodgeDir = null;
  npc.dodgeDecided = false;
  npc.reactionTimer = null;

  const fastBounce1 = ball.flying && ball.bounces === 1 && Math.hypot(ball.vx, ball.vy) >= STATUS.player.catchMinSpd;

  if ((ballFree || ballBouncing) && (npcCloser || cfg.pickupGreed > 0.78) && !fastBounce1) {
    npc.state = 'fetch';
    const dx = ball.x - npc.x, dy = ball.y - npc.y, d = Math.hypot(dx, dy) || 1;
    if (d > 12) {
      moveNPCSmart(dx / d, dy / d, STATUS.npc.spd * dt);
    }
    if (dist(ball, npc) < ball.r + npc.r + 12) pickUpBall('npc');
    return;
  }

  if (playerHasBall) {
    npc.state = 'evade';
    runFromPlayer(dt);
    return;
  }

  if (ballFree || ballBouncing) {
    npc.state = 'watch';
    const d = dist(npc, player);
    if (d < SAFE_DIST) {
      runFromPlayer(dt, 0.8);
    } else {
      const dx = ball.x - npc.x, dy = ball.y - npc.y, dd = Math.hypot(dx, dy) || 1;
      // dd가 한 프레임 이동거리보다 작으면 overshoot→oscillation 방지
      if (dd > STATUS.npc.spd * 0.5 * dt + 1) moveNPCSmart(dx / dd, dy / dd, STATUS.npc.spd * 0.5 * dt);
    }
    return;
  }

  npc.state = 'wait';
}
