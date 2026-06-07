import { state } from './state.js';
import { STATUS } from './status.js';
import { dist } from './physics.js';
import { pickUpBall, catchBall, startPlayerCharge, releasePlayerCharge } from './actions.js';

function tryInteract() {
  if (state.gameState !== 'playing') return;
  const { player, balls } = state;
  if (player.grogyTime > 0) return;

  const { catchRange, catchMinSpd } = STATUS.player;

  // 이미 공을 들고 있으면 차징(던지기 준비)부터.
  if (player.hasBall) { startPlayerCharge(); return; }

  // 1) 캐치 가능한, 날아오는 npc 공 (1바운드 이내 + 캐치 범위). 가장 가까운 것.
  const catchable = balls
    .filter(b => {
      if (!(b.flying && b.thrownBy === 'npc')) return false;
      const spd = Math.hypot(b.vx, b.vy);
      const fastBounce1 = b.bounces === 1 && spd >= catchMinSpd;
      return (b.bounces === 0 || fastBounce1) &&
             dist(b, player) < b.r + player.r + catchRange;
    })
    .sort((a, b) => dist(a, player) - dist(b, player))[0];
  if (catchable) { catchBall(catchable); return; }

  // 2) 주울 수 있는 공 (npc 소유 아님, 픽업 범위, 빠르게 날아가는 1바운드 공 제외). 가장 가까운 것.
  const pickable = balls
    .filter(b => {
      if (b.owner === 'npc' || b.owner === 'player') return false;
      if (dist(b, player) >= b.r + player.r + 32) return false;
      const spd = Math.hypot(b.vx, b.vy);
      return !b.flying || b.bounces > 1 || (b.bounces === 1 && spd < catchMinSpd);
    })
    .sort((a, b) => dist(a, player) - dist(b, player))[0];
  if (pickable) pickUpBall('player', pickable);
}

export function setupInput() {
  const canvas = document.getElementById('gameCanvas');

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    // 표시 크기(rect)와 내부 해상도(canvas.width/height)가 다르므로 좌표를 스케일 보정
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    state.mouse.x = (e.clientX - rect.left) * scaleX;
    state.mouse.y = (e.clientY - rect.top) * scaleY;
  });

  document.addEventListener('mousedown', () => tryInteract());
  document.addEventListener('mouseup', () => releasePlayerCharge());

  document.addEventListener('keydown', e => {
    state.keys[e.code] = true;
    if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space' && !e.repeat) tryInteract();
  });

  document.addEventListener('keyup', e => {
    state.keys[e.code] = false;
    if (e.code === 'Space') releasePlayerCharge();
  });
}
