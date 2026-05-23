import { state } from './state.js';
import { dist } from './physics.js';
import { pickUpBall, doThrow } from './actions.js';

function doAction() {
  if (state.gameState !== 'playing') return;
  const { player, ball } = state;
  if (player.grogyTime > 0) return;
  if (player.hasBall) {
    const { facing } = player;
    doThrow(player, player.x + facing.x * 1000, player.y + facing.y * 1000, 340, 'player');
  } else if (ball.owner !== 'npc' && dist(ball, player) < ball.r + player.r + 32) {
    if (!ball.flying || ball.bounces > 0) pickUpBall('player');
  }
}

export function setupInput() {
  const canvas = document.getElementById('gameCanvas');

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mousedown', () => doAction());

  document.addEventListener('keydown', e => {
    state.keys[e.key] = true;
    if ([' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) e.preventDefault();
    if (e.key === ' ') doAction();
  });

  document.addEventListener('keyup', e => { state.keys[e.key] = false; });
}
