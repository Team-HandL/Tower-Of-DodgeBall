import { state } from './state.js';
import { STATUS } from './status.js';
import { dist } from './physics.js';
import { pickUpBall, catchBall, startPlayerCharge, releasePlayerCharge } from './actions.js';

function tryInteract() {
  if (state.gameState !== 'playing') return;
  const { player, ball } = state;
  if (player.grogyTime > 0) return;

  const ballSpd = Math.hypot(ball.vx, ball.vy);
  const { catchRange, catchMinSpd } = STATUS.player;
  const fastBounce1 = ball.flying && ball.bounces === 1 && ballSpd >= catchMinSpd;

  if (player.hasBall) {
    startPlayerCharge();
  } else if (ball.flying && ball.thrownBy === 'npc' &&
             (ball.bounces === 0 || fastBounce1) &&
             dist(ball, player) < ball.r + player.r + catchRange) {
    catchBall();
  } else if (ball.owner !== 'npc' && dist(ball, player) < ball.r + player.r + 32) {
    if (!ball.flying || ball.bounces > 1 || (ball.bounces === 1 && ballSpd < catchMinSpd)) {
      pickUpBall('player');
    }
  }
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
