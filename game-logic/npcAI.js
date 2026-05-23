import { state, SPD, SAFE_DIST, W, H, NPC_THROW_SPD } from './state.js';
import { moveEntity, dist, hasLOS } from './physics.js';
import { doThrow, pickUpBall, CATCH_MIN_SPD } from './actions.js';

/** 이동 방향 벡터로 NPC facing 갱신 */
function setFacing(entity, dx, dy) {
  const d = Math.hypot(dx, dy);
  if (d > 0.001) entity.facing = { x: dx / d, y: dy / d };
}

function calcBallDodgeDir() {
  const { ball, npc } = state;
  const bspd = Math.hypot(ball.vx, ball.vy);
  if (bspd < 1) return null;
  const bux = ball.vx / bspd, buy = ball.vy / bspd;
  const toNx = npc.x - ball.x, toNy = npc.y - ball.y;
  if (toNx * bux + toNy * buy < 0) return null;
  const crossDist = Math.abs(toNx * buy - toNy * bux);
  if (crossDist > 55) return null;
  const p1x = -buy, p1y = bux, p2x = buy, p2y = -bux;
  const d1 = Math.hypot(npc.x + p1x * 60 - ball.x, npc.y + p1y * 60 - ball.y);
  const d2 = Math.hypot(npc.x + p2x * 60 - ball.x, npc.y + p2y * 60 - ball.y);
  return d1 > d2 ? { x: p1x, y: p1y } : { x: p2x, y: p2y };
}

function runFromPlayer(dt, speedMult) {
  const { player, npc } = state;
  const dx = npc.x - player.x, dy = npc.y - player.y, d = Math.hypot(dx, dy) || 1;
  const cx = (W / 2 - npc.x) * 0.005, cy = (H / 2 - npc.y) * 0.005;
  const ex = dx / d + cx, ey = dy / d + cy, ed = Math.hypot(ex, ey) || 1;
  setFacing(npc, ex, ey);
  moveEntity(npc, ex / ed, ey / ed, SPD * (speedMult || 1) * dt);
}

export function updateNPC(dt) {
  const { npc, player, ball } = state;
  if (npc.grogyTime > 0) return;
  npc.aimTimer -= dt;

  if (npc.hasBall) {
    npc.dodgeDir = null;
    if (hasLOS(npc, player)) {
      npc.state = 'aim';
      const d = dist(npc, player);
      if (d > 200) {
        const dx = player.x - npc.x, dy = player.y - npc.y, dd = Math.hypot(dx, dy) || 1;
        setFacing(npc, dx, dy);
        moveEntity(npc, dx / dd, dy / dd, SPD * dt);
      } else if (d < 100) {
        const dx = npc.x - player.x, dy = npc.y - player.y, dd = Math.hypot(dx, dy) || 1;
        setFacing(npc, dx, dy);
        moveEntity(npc, dx / dd, dy / dd, SPD * dt);
      } else {
        // 제자리 조준 — 플레이어 쪽을 바라봄
        const dx = player.x - npc.x, dy = player.y - npc.y;
        setFacing(npc, dx, dy);
      }
      if (npc.aimTimer <= 0) {
        doThrow(npc, player.x + (Math.random() - 0.5) * 25, player.y + (Math.random() - 0.5) * 25, NPC_THROW_SPD, 'npc');
      }
    } else {
      npc.state = 'reposition';
      const dx = player.x - npc.x, dy = player.y - npc.y, d = Math.hypot(dx, dy) || 1;
      setFacing(npc, dx, dy);
      moveEntity(npc, dx / d, dy / d, SPD * dt);
    }
    return;
  }

  const ballFree      = !ball.flying && ball.owner === null;
  const ballBouncing  = ball.flying && ball.bounces > 0;
  const ballIncoming  = ball.flying && ball.thrownBy === 'player' && ball.bounces === 0;
  const playerHasBall = player.hasBall;
  const npcCloser     = dist(npc, ball) < dist(player, ball);

  if (ballIncoming) {
    npc.state = 'dodge';
    const dir = calcBallDodgeDir();
    if (dir && !npc.dodgeDir) npc.dodgeDir = dir;
    if (npc.dodgeDir) {
      setFacing(npc, npc.dodgeDir.x, npc.dodgeDir.y);
      moveEntity(npc, npc.dodgeDir.x, npc.dodgeDir.y, SPD * dt);
    } else {
      runFromPlayer(dt);
    }
    return;
  }
  npc.dodgeDir = null;

  const fastBounce1 = ball.flying && ball.bounces === 1 && Math.hypot(ball.vx, ball.vy) >= CATCH_MIN_SPD;

  if ((ballFree || ballBouncing) && npcCloser && !fastBounce1) {
    npc.state = 'fetch';
    const dx = ball.x - npc.x, dy = ball.y - npc.y, d = Math.hypot(dx, dy) || 1;
    if (d > 12) {
      setFacing(npc, dx, dy);
      moveEntity(npc, dx / d, dy / d, SPD * dt);
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
      setFacing(npc, dx, dy);
      moveEntity(npc, dx / dd, dy / dd, SPD * 0.5 * dt);
    }
    return;
  }

  npc.state = 'wait';
}
