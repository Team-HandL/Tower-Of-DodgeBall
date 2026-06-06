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

// 코너 판정 여백: 캔버스 두 변에 동시에 이만큼 가까우면 "코너에 갇힘"으로 보고
// 무엇보다 먼저 빠져나오게 한다.
const CORNER_MARGIN = 120;

const DEFAULT_AI = {
  reactionDelay: 0.22,
  aimError: 35,
  dodgeSkill: 0.55,
  aggression: 0.7,
  pickupGreed: 0.65,
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

// 투척 경로가 공 반지름까지 고려해 비어 있는지 검사한다. hasLOS(점 기준)와 달리
// 공 몸통이 장애물 모서리에 스치는 경우까지 막아 "장애물에 헛던지는" 행동을 차단한다.
function clearThrowPath(from, to) {
  const obs = state.obstacles ?? OBSTACLES;
  const r = state.ball.r;
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(8, Math.ceil(len / 10));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    if (obs.some(o => o.hp > 0 &&
        x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h)) return false;
  }
  return true;
}

function lineIntersectsRect(a, b, o) {
  // hasLOS와 동일하게 샘플 간격을 ~12px로 유지 — 먼 거리에서 장애물을 건너뛰어
  // 우회 대상(blocker)을 못 찾는 일을 막는다.
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(8, Math.ceil(len / 12));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return true;
  }
  return false;
}

function blockingObstacle(a, b) {
  const obs = state.obstacles ?? OBSTACLES;
  return obs.find(o => o.hp > 0 && lineIntersectsRect(a, b, o)) || null;
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

function moveNPCSmart(dx, dy, speed) {
  const { npc } = state;
  const d = Math.hypot(dx, dy);
  if (d <= 0.001) return false;

  setFacing(npc, dx, dy);
  if (tryMove(npc, dx, dy, speed)) {
    npc.stuckTime = 0;
    return true;
  }

  // 1차 방향이 막힘 — 벽/장애물을 따라 미끄러질 수직·대각 방향을 시도한다.
  const nx = dx / d, ny = dy / d;
  const sideBias = npc.sideBias || 1;
  const candidates = [
    { x: -ny * sideBias, y: nx * sideBias },
    { x: ny * sideBias, y: -nx * sideBias },
    { x: nx * 0.45 - ny * sideBias, y: ny * 0.45 + nx * sideBias },
    { x: nx * 0.45 + ny * sideBias, y: ny * 0.45 - nx * sideBias },
    { x: -nx, y: -ny },
  ];

  for (const c of candidates) {
    if (tryMove(npc, c.x, c.y, speed * 0.85)) {
      setFacing(npc, c.x, c.y);
      // 미끄러져 나가는 것도 부분 진전 — stuck 카운터를 천천히 회복시킨다.
      npc.stuckTime = Math.max(0, (npc.stuckTime || 0) - 1);
      return true;
    }
  }

  // 어느 방향으로도 못 움직임 — 충분히 오래 갇히면 우회 방향(sideBias)을 뒤집는다.
  npc.stuckTime = (npc.stuckTime || 0) + 1;
  if (npc.stuckTime > 14) {
    npc.sideBias = -sideBias;
    npc.stuckTime = 0;
  }
  return false;
}

/** 캔버스 네 모서리 중 하나에 갇혀 있는가 (두 변에 동시에 근접) */
function isCornered(npc) {
  const horiz = npc.x < CORNER_MARGIN || npc.x > W - CORNER_MARGIN;
  const vert  = npc.y < CORNER_MARGIN || npc.y > H - CORNER_MARGIN;
  return horiz && vert;
}

// 코너에서 열린 공간(맵 중앙)으로 탈출한다. 플레이어가 중앙 쪽 진로를 막고 있으면
// 벽을 따라 도는 수직 성분을 더해 플레이어 정면으로 돌진하지 않게 한다.
function escapeCorner(dt) {
  const { npc, player } = state;
  let ex = W / 2 - npc.x, ey = H / 2 - npc.y;
  const ed = Math.hypot(ex, ey) || 1;
  ex /= ed; ey /= ed;

  const px = player.x - npc.x, py = player.y - npc.y;
  const pd = Math.hypot(px, py) || 1;
  // 중앙 방향이 곧 플레이어 방향이면(코너 맞은편에 플레이어) 벽을 따라 우회한다.
  if ((ex * px + ey * py) / pd > 0.3) {
    const perp1 = { x: -ey, y: ex }, perp2 = { x: ey, y: -ex };
    const far1 = Math.hypot(npc.x + perp1.x * 90 - player.x, npc.y + perp1.y * 90 - player.y);
    const far2 = Math.hypot(npc.x + perp2.x * 90 - player.x, npc.y + perp2.y * 90 - player.y);
    const perp = far1 > far2 ? perp1 : perp2;
    ex = ex * 0.5 + perp.x;
    ey = ey * 0.5 + perp.y;
    const nd = Math.hypot(ex, ey) || 1;
    ex /= nd; ey /= nd;
  }
  moveNPCSmart(ex, ey, STATUS.npc.spd * dt);
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
  // 두 수직 회피 방향 중 맵 중앙(열린 공간)에 가까운 쪽 — 벽·코너로 몰리지 않게 한다.
  const m1 = Math.hypot(npc.x + p1x * 60 - W / 2, npc.y + p1y * 60 - H / 2);
  const m2 = Math.hypot(npc.x + p2x * 60 - W / 2, npc.y + p2y * 60 - H / 2);
  return m1 < m2 ? { x: p1x, y: p1y } : { x: p2x, y: p2y };
}

function runFromPlayer(dt, speedMult) {
  const { player, npc } = state;
  const dx = npc.x - player.x, dy = npc.y - player.y, d = Math.hypot(dx, dy) || 1;
  // 중앙으로 약하게 당겨 벽·코너로 도망치는 것을 줄인다. 상수가 크면 flee 벡터(크기 1)를
  // centering force가 역전시켜 flip point(x≈650)에서 facing이 left↔right 매 프레임 교번하는
  // 버그가 생기므로 0.0014 유지.
  const cx = (W / 2 - npc.x) * 0.0014;
  const cy = (H / 2 - npc.y) * 0.0014;
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

  const cornered = isCornered(npc);

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
        const aimX = player.x + (Math.random() - 0.5) * cfg.aimError;
        const aimY = player.y + (Math.random() - 0.5) * cfg.aimError;
        // 실제 조준점까지 경로가 비어 있을 때만 던진다 — 장애물에 멍청하게 던지지 않음.
        if (clearThrowPath(npc, { x: aimX, y: aimY })) {
          doThrow(npc, aimX, aimY, STATUS.npc.velocity, 'npc');
          npc.aimTimer = Math.max(0.3, 1.2 - cfg.aggression * 0.7) + Math.random() * (0.7 - cfg.aggression * 0.35);
        } else {
          npc.aimTimer = 0.12; // 막혔으면 잠깐 뒤 다시 조준
        }
      }
    } else if (cornered) {
      // 막혔는데 코너에 갇혔으면 재배치보다 탈출 우선
      npc.state = 'escape';
      npc.bypassTarget = null;
      escapeCorner(dt);
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

  // 날아오는 공 회피 — 회피 자체가 탈출이므로 코너 탈출보다 먼저 처리한다.
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

  // 공 줍기 — 목표가 분명하므로 코너 탈출보다 먼저(코너의 공도 주우러 간다).
  if ((ballFree || ballBouncing) && (npcCloser || cfg.pickupGreed > 0.78) && !fastBounce1) {
    npc.state = 'fetch';
    const dx = ball.x - npc.x, dy = ball.y - npc.y, d = Math.hypot(dx, dy) || 1;
    if (d > 12) {
      moveNPCSmart(dx / d, dy / d, STATUS.npc.spd * dt);
    }
    if (dist(ball, npc) < ball.r + npc.r + 12) pickUpBall('npc');
    return;
  }

  // 코너 탈출 — 도망/관찰 상태에서 코너에 박히는 문제를 최우선으로 해결한다.
  if (cornered) {
    npc.state = 'escape';
    npc.bypassTarget = null;
    escapeCorner(dt);
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
