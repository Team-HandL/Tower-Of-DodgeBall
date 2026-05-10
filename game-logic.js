import { state, initState, SPD } from './game-logic/state.js';
import { moveEntity } from './game-logic/physics.js';
import { updateNPC } from './game-logic/npcAI.js';
import { updateBall } from './game-logic/ballPhysics.js';
import { draw } from './game-logic/renderer.js';
import { updateHPUI, showOverlay, hideOverlay } from './game-logic/overlay.js';
import { setupInput } from './game-logic/input.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function endGame(result) {
  state.gameState = result;
  showOverlay(result, startGame);
}

function startGame() {
  hideOverlay();
  initState();
  if (state.animId) cancelAnimationFrame(state.animId);
  state.last = performance.now();
  state.animId = requestAnimationFrame(loop);
}

function loop(ts) {
  if (state.gameState !== 'playing') { state.animId = null; return; }
  const dt = Math.min((ts - state.last) / 1000, 0.05);
  state.last = ts;

  const { player, npc } = state;
  if (player.invTime > 0)   player.invTime -= dt;
  if (player.grogyTime > 0) player.grogyTime -= dt;
  if (npc.invTime > 0)      npc.invTime -= dt;
  if (npc.grogyTime > 0)    npc.grogyTime -= dt;

  if (player.grogyTime <= 0) {
    let dx = 0, dy = 0;
    if (state.keys['ArrowUp'])    dy = -1;
    if (state.keys['ArrowDown'])  dy = 1;
    if (state.keys['ArrowLeft'])  dx = -1;
    if (state.keys['ArrowRight']) dx = 1;
    if (dx || dy) { const d = Math.hypot(dx, dy); moveEntity(player, dx / d, dy / d, SPD * dt); }
  }

  if (player.hasBall) { state.ball.x = player.x; state.ball.y = player.y; }
  if (npc.hasBall)    { state.ball.x = npc.x;    state.ball.y = npc.y; }

  updateNPC(dt);
  const result = updateBall(dt);
  if (result) { endGame(result); return; }

  updateHPUI();
  draw(ctx);
  state.animId = requestAnimationFrame(loop);
}

setupInput();
document.getElementById('startBtn').addEventListener('click', startGame);
