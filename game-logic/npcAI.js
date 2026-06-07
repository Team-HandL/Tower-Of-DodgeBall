import { state, SAFE_DIST, W, H, BALL_R } from './state.js';
import { STATUS } from './status.js';
import { moveEntity, dist } from './physics.js';
import { doThrow, pickUpBall } from './actions.js';
import { OBSTACLES, TILE } from '../design/map-01/obstacles.js';

// facing 평활 계수: 한 프레임에 목표 방향으로 이만큼만 회전(0~1).
// 작을수록 안정적이지만 방향 전환이 느려진다. 장애물에 막혀 희망 방향이
// 매 프레임 정반대로 뒤집혀도(±x 교번) 평활된 벡터는 거의 안 움직이므로
// left↔right 스프라이트 깜빡임이 사라진다.
const FACING_SMOOTH = 0.18;

// 코너 판정 여백: 캔버스 두 변에 동시에 이만큼 가까우면 "코너에 갇힘"으로 보고
// 무엇보다 먼저 빠져나오게 한다.
const CORNER_MARGIN = 120;
const GRID_COLS = Math.ceil(W / TILE);
const GRID_ROWS = Math.ceil(H / TILE);
const NAV_REPATH_TIME = 0.25;
const NAV_REACHED_DIST = 10;
const SHOT_PLAN_TIME = 0.35;
const SHOT_MIN_RANGE = 100;
const SHOT_MAX_RANGE = 420;
const SHOT_IDEAL_RANGE = 220;
const PLAYER_HIT_PATH_PADDING = 36;
const ATTACK_RANGE_SHORT_MAX = 220;
const ATTACK_RANGE_MID_MAX = 420;

const DEFAULT_AI = {
  reactionDelay: 0.22,
  aimError: 35,
  dodgeSkill: 0.55,
  aggression: 0.7,
  pickupGreed: 0.65,
  blockBreakPreference: 0,
  centerBias: 0.0014,
  wallAvoidMargin: 0,
  wallAvoidBias: 0,
  attackRangePreference: { short: 0.6, mid: 0.7, long: 0.5 },
};

function ai() {
  const npcAI = state.npc.ai || {};
  return {
    ...DEFAULT_AI,
    ...npcAI,
    attackRangePreference: {
      ...DEFAULT_AI.attackRangePreference,
      ...(npcAI.attackRangePreference || {}),
    },
  };
}

function attackPreferenceAt(range, cfg) {
  const band = range < ATTACK_RANGE_SHORT_MAX ? 'short'
    : range < ATTACK_RANGE_MID_MAX ? 'mid'
    : 'long';
  return Math.max(0, Math.min(1, cfg.attackRangePreference[band]));
}

function cellKey(c, r) {
  return `${c},${r}`;
}

function worldToCell(x, y) {
  return {
    c: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / TILE))),
    r: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / TILE))),
  };
}

function cellToWorld(c, r, radius) {
  return {
    x: Math.max(radius, Math.min(W - radius, c * TILE + TILE / 2)),
    y: Math.max(radius, Math.min(H - radius, r * TILE + TILE / 2)),
  };
}

function pointBlocked(x, y, radius) {
  if (x - radius < 0 || x + radius > W || y - radius < 0 || y + radius > H) return true;
  const obs = state.obstacles ?? OBSTACLES;
  return obs.some(o => o.hp > 0 &&
    x + radius > o.x && x - radius < o.x + o.w &&
    y + radius > o.y && y - radius < o.y + o.h);
}

function isWalkableCell(c, r, radius) {
  if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return false;
  const p = cellToWorld(c, r, radius);
  return !pointBlocked(p.x, p.y, radius);
}

function nearestWalkableCell(cell, radius) {
  if (isWalkableCell(cell.c, cell.r, radius)) return cell;
  const maxRadius = Math.max(GRID_COLS, GRID_ROWS);
  for (let ring = 1; ring <= maxRadius; ring++) {
    let best = null;
    let bestDist = Infinity;
    for (let r = cell.r - ring; r <= cell.r + ring; r++) {
      for (let c = cell.c - ring; c <= cell.c + ring; c++) {
        if (Math.max(Math.abs(c - cell.c), Math.abs(r - cell.r)) !== ring) continue;
        if (!isWalkableCell(c, r, radius)) continue;
        const d = Math.hypot(c - cell.c, r - cell.r);
        if (d < bestDist) {
          best = { c, r };
          bestDist = d;
        }
      }
    }
    if (best) return best;
  }
  return null;
}

function heuristic(a, b) {
  const dx = Math.abs(a.c - b.c);
  const dy = Math.abs(a.r - b.r);
  return 10 * Math.max(dx, dy) + 4 * Math.min(dx, dy);
}

function findPath(startPos, goalPos, radius) {
  const start = worldToCell(startPos.x, startPos.y);
  const goal = nearestWalkableCell(worldToCell(goalPos.x, goalPos.y), radius);
  if (!goal) return [];

  const startKey = cellKey(start.c, start.r);
  const goalKey = cellKey(goal.c, goal.r);
  if (startKey === goalKey) return [cellToWorld(goal.c, goal.r, radius)];

  const open = [{ ...start, g: 0, f: heuristic(start, goal) }];
  const scores = new Map([[startKey, 0]]);
  const cameFrom = new Map();
  const closed = new Set();
  const directions = [
    { dc: 1, dr: 0, cost: 10 }, { dc: -1, dr: 0, cost: 10 },
    { dc: 0, dr: 1, cost: 10 }, { dc: 0, dr: -1, cost: 10 },
    { dc: 1, dr: 1, cost: 14 }, { dc: 1, dr: -1, cost: 14 },
    { dc: -1, dr: 1, cost: 14 }, { dc: -1, dr: -1, cost: 14 },
  ];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    const currentKey = cellKey(current.c, current.r);
    if (closed.has(currentKey)) continue;
    if (currentKey === goalKey) {
      const cells = [{ c: current.c, r: current.r }];
      let key = currentKey;
      while (cameFrom.has(key)) {
        const prev = cameFrom.get(key);
        cells.push(prev);
        key = cellKey(prev.c, prev.r);
      }
      cells.reverse();
      return cells.slice(1).map(p => cellToWorld(p.c, p.r, radius));
    }
    closed.add(currentKey);

    for (const dir of directions) {
      const next = { c: current.c + dir.dc, r: current.r + dir.dr };
      const nextKey = cellKey(next.c, next.r);
      if (closed.has(nextKey) || !isWalkableCell(next.c, next.r, radius)) continue;
      if (dir.dc !== 0 && dir.dr !== 0 &&
          (!isWalkableCell(current.c + dir.dc, current.r, radius) ||
           !isWalkableCell(current.c, current.r + dir.dr, radius))) continue;

      const nextG = current.g + dir.cost;
      if (nextG >= (scores.get(nextKey) ?? Infinity)) continue;
      scores.set(nextKey, nextG);
      cameFrom.set(nextKey, { c: current.c, r: current.r });
      open.push({ ...next, g: nextG, f: nextG + heuristic(next, goal) });
    }
  }
  return [];
}

function pathLength(start, path) {
  let total = 0;
  let prev = start;
  for (const point of path) {
    total += Math.hypot(point.x - prev.x, point.y - prev.y);
    prev = point;
  }
  return total;
}

function canTraverseDirect(from, to, radius) {
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(len / 8));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    if (pointBlocked(x, y, radius)) return false;
  }
  return true;
}

function navigateTo(target, dt, speed) {
  const { npc } = state;
  const goal = nearestWalkableCell(worldToCell(target.x, target.y), npc.r);
  if (!goal) return false;

  const goalKey = cellKey(goal.c, goal.r);
  npc.navRepathTimer = (npc.navRepathTimer ?? 0) - dt;
  const pathBlocked = npc.navPath?.length > 0 &&
    !canTraverseDirect(npc, npc.navPath[0], npc.r);
  if (!npc.navPath || npc.navGoalKey !== goalKey || npc.navRepathTimer <= 0 || pathBlocked) {
    npc.navPath = findPath(npc, target, npc.r);
    npc.navGoalKey = goalKey;
    npc.navRepathTimer = NAV_REPATH_TIME;
  }

  while (npc.navPath.length > 0 && dist(npc, npc.navPath[0]) <= NAV_REACHED_DIST) {
    npc.navPath.shift();
  }
  if (npc.navPath.length === 0) {
    if (!canTraverseDirect(npc, target, npc.r)) return false;
    return moveNPCSmart(target.x - npc.x, target.y - npc.y, speed);
  }

  let waypointIndex = 0;
  for (let i = npc.navPath.length - 1; i > 0; i--) {
    if (canTraverseDirect(npc, npc.navPath[i], npc.r)) {
      waypointIndex = i;
      break;
    }
  }
  if (waypointIndex > 0) npc.navPath.splice(0, waypointIndex);
  const waypoint = npc.navPath[0];
  const dx = waypoint.x - npc.x;
  const dy = waypoint.y - npc.y;
  const d = Math.hypot(dx, dy) || 1;
  const px = npc.x;
  const py = npc.y;
  setFacing(npc, dx, dy);
  moveEntity(npc, dx / d, dy / d, speed);
  if (npc.x !== px || npc.y !== py) return true;
  return moveNPCSmart(dx, dy, speed);
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

// 투척 경로가 공 반지름까지 고려해 비어 있는지 검사한다.
function clearThrowPath(from, to, endPadding = 0) {
  const obs = state.obstacles ?? OBSTACLES;
  const r = BALL_R;
  if (pointBlocked(from.x, from.y, r)) return false;
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const checkedLen = Math.max(0, len - endPadding);
  const steps = Math.max(1, Math.ceil(checkedLen / 10));
  for (let i = 1; i <= steps; i++) {
    const t = len > 0 ? (i / steps) * (checkedLen / len) : 0;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    if (obs.some(o => o.hp > 0 &&
        x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h)) return false;
  }
  return true;
}

function firstBlockingObstacle(from, to) {
  const obs = state.obstacles ?? OBSTACLES;
  const r = BALL_R;
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(8, Math.ceil(len / 8));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const blocker = obs.find(o => o.hp > 0 &&
      x + r > o.x && x - r < o.x + o.w &&
      y + r > o.y && y - r < o.y + o.h);
    if (blocker) return blocker;
  }
  return null;
}

function throwOriginAt(position) {
  return { x: position.x, y: position.y - 32 };
}

function isValidShootingPosition(position, playerCenter) {
  const origin = throwOriginAt(position);
  const range = Math.hypot(playerCenter.x - origin.x, playerCenter.y - origin.y);
  return range >= SHOT_MIN_RANGE &&
    range <= SHOT_MAX_RANGE &&
    !pointBlocked(origin.x, origin.y, BALL_R) &&
    clearThrowPath(origin, playerCenter, PLAYER_HIT_PATH_PADDING);
}

function findShootingPlan(playerCenter) {
  const { npc } = state;
  // 선호 사격 거리 — AI별 idealRange가 있으면 사용(없으면 기본 중거리).
  // 값이 작을수록 더 가까이 붙어서 쏘는 사격 위치를 선호한다.
  const idealRange = ai().idealRange ?? SHOT_IDEAL_RANGE;
  const candidates = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!isWalkableCell(c, r, npc.r)) continue;
      const position = cellToWorld(c, r, npc.r);
      if (!isValidShootingPosition(position, playerCenter)) continue;
      candidates.push({
        position,
        directDist: Math.hypot(position.x - npc.x, position.y - npc.y),
      });
    }
  }

  candidates.sort((a, b) => a.directDist - b.directDist);
  let best = null;
  for (const candidate of candidates.slice(0, 80)) {
    const path = findPath(npc, candidate.position, npc.r);
    if (path.length === 0 && !canTraverseDirect(npc, candidate.position, npc.r)) continue;
    const cost = pathLength(npc, path);
    const origin = throwOriginAt(candidate.position);
    const range = Math.hypot(playerCenter.x - origin.x, playerCenter.y - origin.y);
    const score = cost + Math.abs(range - idealRange) * 0.35;
    if (!best || score < best.score) {
      best = { target: candidate.position, cost, score };
    }
  }
  return best;
}

function getShootingPlan(dt, playerCenter) {
  const { npc } = state;
  npc.shotPlanTimer = (npc.shotPlanTimer ?? 0) - dt;
  const playerCell = worldToCell(playerCenter.x, playerCenter.y);
  const playerCellKey = cellKey(playerCell.c, playerCell.r);
  const targetValid = npc.shotTarget &&
    isValidShootingPosition(npc.shotTarget, playerCenter);
  if (!targetValid || npc.shotPlayerCellKey !== playerCellKey || npc.shotPlanTimer <= 0) {
    const plan = findShootingPlan(playerCenter);
    npc.shotTarget = plan?.target ?? null;
    npc.shotPathCost = plan?.cost ?? Infinity;
    npc.shotPlayerCellKey = playerCellKey;
    npc.shotPlanTimer = SHOT_PLAN_TIME;
  }
  return npc.shotTarget
    ? { target: npc.shotTarget, cost: npc.shotPathCost }
    : null;
}

function shouldBreakBlock(blocker, routeCost, cfg) {
  if (!blocker || blocker.type !== 'soft' || cfg.blockBreakPreference <= 0) return false;
  const hitDamage = STATUS.npc.str * 0.4;
  if (hitDamage < 25) return false;
  if (cfg.blockBreakPreference >= 1) return true;
  const hitsNeeded = hitDamage >= 72 ? 1 : blocker.hp;
  const breakCost = hitsNeeded * 180;
  return !Number.isFinite(routeCost) ||
    routeCost * cfg.blockBreakPreference >= breakCost;
}

function tryBreakBlock(blocker, origin, cfg) {
  const { npc } = state;
  if (!blocker || blocker.hp <= 0) return false;
  const target = {
    x: blocker.x + blocker.w / 2,
    y: blocker.y + blocker.h / 2,
  };
  const firstBlocker = firstBlockingObstacle(origin, target);
  if (firstBlocker !== blocker) return false;

  npc.state = 'break-block';
  setFacing(npc, target.x - origin.x, target.y - origin.y);
  if (npc.aimTimer <= 0) {
    doThrow(npc, target.x, target.y, STATUS.npc.velocity, 'npc');
    npc.aimTimer = Math.max(0.35, 1.1 - cfg.aggression * 0.6);
  }
  return true;
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
  navigateTo(
    { x: npc.x + ex * 220, y: npc.y + ey * 220 },
    dt,
    STATUS.npc.spd * dt
  );
}

// npc를 향해 날아오는(아직 1바운드 전) 공 중 가장 가까운 것 — 회피 대상.
function incomingThreatBall() {
  const { npc } = state;
  let best = null, bestDist = Infinity;
  for (const b of state.balls) {
    if (!(b.flying && b.thrownBy === 'player' && b.bounces === 0)) continue;
    const bspd = Math.hypot(b.vx, b.vy);
    if (bspd < 1) continue;
    const toNx = npc.x - b.x, toNy = npc.y - b.y;
    if (toNx * (b.vx / bspd) + toNy * (b.vy / bspd) < 0) continue; // 이미 지나감
    const d = Math.hypot(toNx, toNy);
    if (d < bestDist) { bestDist = d; best = b; }
  }
  return best;
}

// 주울 수 있는 공(자유 또는 바운싱) 중 npc에서 가장 가까운 것 — 줍기/관찰 대상.
function nearestLooseBall() {
  const { npc } = state;
  let best = null, bestDist = Infinity;
  for (const b of state.balls) {
    const free = !b.flying && b.owner === null;
    const bouncing = b.flying && b.bounces > 0;
    if (!free && !bouncing) continue;
    const d = dist(npc, b);
    if (d < bestDist) { bestDist = d; best = b; }
  }
  return best;
}

function calcBallDodgeDir(ball) {
  const { npc } = state;
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
  const cfg = ai();
  const dx = npc.x - player.x, dy = npc.y - player.y, d = Math.hypot(dx, dy) || 1;
  // 중앙으로 약하게 당겨 벽·코너로 도망치는 것을 줄인다. 상수가 크면 flee 벡터(크기 1)를
  // centering force가 역전시켜 flip point(x≈650)에서 facing이 left↔right 매 프레임 교번하는
  // 버그가 생기므로 기본값은 낮게 유지하고, 특정 NPC만 AI 옵션으로 보정한다.
  let bias = cfg.centerBias;
  const margin = cfg.wallAvoidMargin;
  if (margin > 0 &&
      (npc.x < margin || npc.x > W - margin || npc.y < margin || npc.y > H - margin)) {
    bias += cfg.wallAvoidBias;
  }
  const cx = (W / 2 - npc.x) * bias;
  const cy = (H / 2 - npc.y) * bias;
  const ex = dx / d + cx, ey = dy / d + cy, ed = Math.hypot(ex, ey) || 1;
  navigateTo(
    { x: npc.x + (ex / ed) * 180, y: npc.y + (ey / ed) * 180 },
    dt,
    STATUS.npc.spd * (speedMult || 1) * dt
  );
}

function repositionForShot(dt) {
  const { npc, player } = state;
  const playerCenter = {
    x: player.x,
    y: player.spriteCenterY ?? player.y,
  };
  const origin = {
    x: npc.x,
    y: npc.spriteCenterY ?? npc.y,
  };
  const cfg = ai();
  const plan = getShootingPlan(dt, playerCenter);
  const blocker = firstBlockingObstacle(origin, playerCenter);

  if (shouldBreakBlock(blocker, plan?.cost ?? Infinity, cfg) &&
      tryBreakBlock(blocker, origin, cfg)) {
    return;
  }
  if (plan) {
    npc.state = 'reposition';
    navigateTo(plan.target, dt, STATUS.npc.spd * dt);
    return;
  }

  npc.state = 'escape';
  escapeCorner(dt);
}

export function updateNPC(dt) {
  const { npc, player } = state;
  const cfg = ai();
  if (npc.grogyTime > 0) return;
  npc.aimTimer -= dt;

  const cornered = isCornered(npc);
  const npcThrowOrigin = { x: npc.x, y: npc.spriteCenterY ?? npc.y };
  const playerAimCenter = { x: player.x, y: player.spriteCenterY ?? player.y };

  if (npc.hasBall) {
    npc.dodgeDir = null;
    if (clearThrowPath(npcThrowOrigin, playerAimCenter, PLAYER_HIT_PATH_PADDING)) {
      npc.state = 'aim';
      const d = dist(npc, player);
      if (d < SHOT_MIN_RANGE) {
        runFromPlayer(dt);
      } else {
        // 제자리 조준 — 플레이어 쪽을 바라봄
        const dx = playerAimCenter.x - npcThrowOrigin.x;
        const dy = playerAimCenter.y - npcThrowOrigin.y;
        setFacing(npc, dx, dy);
      }
      if (npc.aimTimer <= 0) {
        const attackPreference = attackPreferenceAt(d, cfg);
        if (Math.random() > attackPreference) {
          // 선호하지 않는 거리에서도 공격 기회는 계속 생기지만 재조준 시간이 길어진다.
          npc.aimTimer = 0.2 + (1 - attackPreference) * 0.65;
          return;
        }
        const aimX = player.x + (Math.random() - 0.5) * cfg.aimError;
        const aimY = (player.spriteCenterY ?? player.y) + (Math.random() - 0.5) * cfg.aimError;
        // 실제 조준점까지 경로가 비어 있을 때만 던진다 — 장애물에 멍청하게 던지지 않음.
        if (clearThrowPath(
          npcThrowOrigin,
          { x: aimX, y: aimY },
          PLAYER_HIT_PATH_PADDING
        )) {
          doThrow(npc, aimX, aimY, STATUS.npc.velocity, 'npc');
          npc.aimTimer = Math.max(0.3, 1.2 - cfg.aggression * 0.7) + Math.random() * (0.7 - cfg.aggression * 0.35);
        } else {
          npc.aimTimer = 0.12; // 막혔으면 잠깐 뒤 다시 조준
        }
      }
    } else {
      // 공의 실제 출발점까지 포함해 경로가 막혔으면 같은 자리에서 재시도하지 않는다.
      repositionForShot(dt);
    }
    return;
  }

  const playerHasBall = player.hasBall;

  // 날아오는 공 회피 — 여러 공 중 가장 위협적인 하나를 대상으로. 회피 자체가
  // 탈출이므로 코너 탈출보다 먼저 처리한다.
  const incoming = incomingThreatBall();
  if (incoming) {
    if (npc.threatBall !== incoming) {
      npc.threatBall = incoming;
      npc.reactionTimer = cfg.reactionDelay;
      npc.dodgeDecided = false;
      npc.dodgeDir = null;
    }
    npc.state = 'dodge';
    npc.reactionTimer = (npc.reactionTimer ?? cfg.reactionDelay) - dt;
    if (npc.reactionTimer > 0) return;
    if (!npc.dodgeDecided) {
      npc.dodgeDir = calcBallDodgeDir(incoming);
      npc.dodgeDecided = true;
    }
    if (npc.dodgeDir) {
      moveNPCSmart(npc.dodgeDir.x, npc.dodgeDir.y, STATUS.npc.spd * dt);
    } else {
      runFromPlayer(dt);
    }
    return;
  }
  npc.threatBall = null;
  npc.dodgeDir = null;
  npc.dodgeDecided = false;
  npc.reactionTimer = null;

  // 주울 대상 공(자유/바운싱) 중 가장 가까운 하나를 고른다.
  const loose = nearestLooseBall();
  const npcCloser  = loose && dist(npc, loose) < dist(player, loose);
  const looseSpd   = loose ? Math.hypot(loose.vx, loose.vy) : 0;
  const fastBounce1 = loose && loose.flying && loose.bounces === 1 && looseSpd >= STATUS.player.catchMinSpd;
  const playerGuardingBall = loose &&
    dist(player, loose) < loose.r + player.r + 72;

  // 같은 공이 계속 방치되면 거리 열세를 무시하고 회수한다.
  // pickupGreed가 높은 NPC일수록 눈치를 보는 시간이 짧다.
  if (loose !== npc.looseTarget) {
    npc.looseTarget = loose;
    npc.looseBallWaitTime = 0;
  } else if (loose && !fastBounce1 && !playerGuardingBall) {
    npc.looseBallWaitTime += dt;
  } else {
    npc.looseBallWaitTime = 0;
  }
  const forcePickupAfter = 1.2 + (1 - cfg.pickupGreed) * 4;
  const tiredOfWaiting = loose && npc.looseBallWaitTime >= forcePickupAfter;

  // 플레이어가 공 바로 앞에서 지키고 있으면 함정으로 보고 접근하지 않는다.
  // 너무 가까울 때만 후퇴하고, 안전거리가 확보되면 현재 위치에서 대기한다.
  if (playerGuardingBall) {
    npc.state = 'guard';
    if (dist(npc, player) < SAFE_DIST) runFromPlayer(dt);
    return;
  }

  // 공 줍기 — 목표가 분명하므로 코너 탈출보다 먼저(코너의 공도 주우러 간다).
  if (loose && (npcCloser || cfg.pickupGreed > 0.78 || tiredOfWaiting) && !fastBounce1) {
    npc.state = 'fetch';
    if (dist(loose, npc) > 12) navigateTo(loose, dt, STATUS.npc.spd * dt);
    if (dist(loose, npc) < loose.r + npc.r + 12) pickUpBall('npc', loose);
    return;
  }

  // 코너 탈출 — 도망/관찰 상태에서 코너에 박히는 문제를 최우선으로 해결한다.
  if (cornered) {
    npc.state = 'escape';
    escapeCorner(dt);
    return;
  }

  if (playerHasBall) {
    npc.state = 'evade';
    runFromPlayer(dt);
    return;
  }

  if (loose) {
    npc.state = 'watch';
    const d = dist(npc, player);
    if (d < SAFE_DIST) {
      runFromPlayer(dt, 0.8);
    } else {
      // 한 프레임 이동거리보다 가까우면 overshoot→oscillation 방지
      if (dist(npc, loose) > STATUS.npc.spd * 0.5 * dt + 1) {
        navigateTo(loose, dt, STATUS.npc.spd * 0.5 * dt);
      }
    }
    return;
  }

  npc.state = 'wait';
}
