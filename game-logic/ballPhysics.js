import { state, W, H, CONFIG, makeBall } from './state.js';
import { STATUS } from './status.js';
import { rectHit, hasLOS } from './physics.js';
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

// soft 블록이 파괴되는 순간 확률적으로 추가 공을 떨어뜨린다.
// 확률·최대 개수는 state.js의 CONFIG에서 조정한다.
function maybeSpawnBallFromBlock(o) {
  if (state.balls.length >= CONFIG.maxBalls) return;
  if (Math.random() >= CONFIG.blockBreakBallChance) return;
  state.balls.push(makeBall(o.x + o.w / 2, o.y + o.h / 2));
}

// 정지(자유) 상태의 공이 살아있는 블록과 겹쳐 있으면 가장 얕은 축으로 밀어낸다.
// 스폰·피격 드롭·정지 등 어떤 경로로 블록에 박혀도 이 함수가 빼낸다.
function pushOutOfObstacles(ball) {
  const obs = state.obstacles ?? OBSTACLES;
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const o of obs) {
      if (o.hp <= 0) continue;
      if (!rectHit(ball.x, ball.y, ball.r, o)) continue;
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

// 공 한 개의 물리·충돌·명중을 처리. 'win' | 'lose' | null 반환.
function updateOneBall(ball, dt) {
  const { npc, player } = state;
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
      if (o.type === 'soft' && !hitThisFrame.has(o)) {
        hitThisFrame.add(o);
        // 이 블록에 부딪히기 직전의 속도로 데미지를 계산한다.
        // 반사 후 다른 블록에 연속 충돌하면 그때는 이미 감쇠된 속도가 사용된다.
        const curSpd    = Math.hypot(ball.vx, ball.vy);
        const spdRatio  = ball.throwSpd > 0 ? Math.min(1, curSpd / ball.throwSpd) : 1;
        const ballDmg   = (ball.throwStr ?? 100) * 0.4 * (ball.power ?? 1) * spdRatio;
        const blockDmg  = ballDmg >= BLOCK_BREAK_THRESHOLD ? 2
                        : ballDmg >= BLOCK_MIN_THRESHOLD   ? 1
                        : 0;
        if (blockDmg > 0) {
          const wasAlive = o.hp > 0;
          o.hp = Math.max(0, o.hp - blockDmg);
          if (wasAlive && o.hp <= 0) maybeSpawnBallFromBlock(o);
        }
      }
      resolveObstacle(ball, o);
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
    const thrower = ball.thrownBy;
    const npcCenter    = { x: npc.x,    y: npc.y    + SPRITE_CENTER_OFFSET_Y };
    const playerCenter = { x: player.x, y: player.y + SPRITE_CENTER_OFFSET_Y };
    if (thrower !== 'npc' && ellipseHit(ball, npc) && npc.invTime <= 0
        && hasLOS(ball, npcCenter)) {
      applyHit(npc, false, damage, ball);
      if (npc.hp <= 0) return 'win';
    }
    if (thrower !== 'player' && ellipseHit(ball, player) && player.invTime <= 0
        && hasLOS(ball, playerCenter)) {
      applyHit(player, true, damage, ball);
      if (player.hp <= 0) return 'lose';
    }
  }

  return null;
}

// 모든 공을 갱신. 명중으로 게임이 끝나면 즉시 'win' | 'lose' 반환.
// balls를 복사해 순회하므로 이번 프레임에 생성된 공은 다음 프레임부터 처리된다.
export function updateBall(dt) {
  for (const ball of [...state.balls]) {
    const result = updateOneBall(ball, dt);
    if (result) return result;
  }
  // 정지한 자유 공이 블록에 박혀 있으면 빼낸다 (스폰/피격 드롭/정지 모두 커버).
  for (const ball of state.balls) {
    if (!ball.flying && ball.owner === null) pushOutOfObstacles(ball);
  }
  return null;
}
