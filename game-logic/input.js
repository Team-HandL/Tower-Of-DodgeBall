import { state } from './state.js';
import { dist } from './physics.js';
import { pickUpBall, doThrow } from './actions.js';

export function setupInput() {
  document.addEventListener('keydown', e => {
    state.keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (state.gameState !== 'playing') return;

    const { player, ball, npc } = state;
    if (e.key === 'z' || e.key === 'Z' || e.key === 'ㅋ') {
      if (player.grogyTime > 0) return;
      if (!player.hasBall && ball.owner !== 'npc' && dist(ball, player) < ball.r + player.r + 32) {
        if (!ball.flying || ball.bounces > 0) pickUpBall('player');
      }
    }
    if (e.key === 'x' || e.key === 'X' || e.key === 'ㅌ') {
      if (player.grogyTime > 0) return;
      if (player.hasBall) {
        doThrow(player, npc.x + (Math.random() - 0.5) * 20, npc.y + (Math.random() - 0.5) * 20, 340, 'player');
      }
    }
  });

  document.addEventListener('keyup', e => { state.keys[e.key] = false; });
}
