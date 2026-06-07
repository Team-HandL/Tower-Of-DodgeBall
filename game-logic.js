import { state, initState, W, H, CONFIG } from './game-logic/state.js';
import { STATUS } from './game-logic/status.js';
import { movePlayer } from './game-logic/physics.js';
import { updateNPC } from './game-logic/npcAI.js';
import { updateBall } from './game-logic/ballPhysics.js';
import { draw } from './game-logic/renderer.js';
import { updateHPUI, showOverlay, hideOverlay, initOverlayFlow, addPlayTime } from './game-logic/overlay.js';
import { setupInput } from './game-logic/input.js';
import { updatePlayerCharge } from './game-logic/actions.js';
import { trackBattleEnd } from './game-logic/analytics.js';
import { loadAssets } from './design/assets.js';
import { SPRITE_CENTER_OFFSET_Y } from './design/player.js';

// 페이지 로드 시 이미지 미리 로드 (게임 시작 전 완료)
loadAssets();

const canvas = document.getElementById('gameCanvas');
// 내부 해상도는 1200x800 고정(게임 좌표 기준). 화면 표시 크기는 CSS가 비율 유지하며 확대.
canvas.width  = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

function endGame(result) {
  const floor = window.__todGetCurrentFloor?.() ?? 1;
  const analyticsResult = result === 'win' ? 'win' : 'lose';
  trackBattleEnd({
    floor,
    result: analyticsResult,
    endReason: result,
    playerHpEnd: state.player?.hp ?? 0,
    npcHpEnd: state.npc?.hp ?? 0,
  });
  state.gameState = result;
  showOverlay(result, startGame);
}

// NPC 인게임 대사: 표시 시간 차감 후, 일정 간격마다 확률적으로 한 마디.
// 피격 대사(grogy)나 이미 말하는 중이면 일상 대사로 덮어쓰지 않는다.
function updateNpcSpeech(dt) {
  const { npc } = state;
  if (npc.speechTime > 0) {
    npc.speechTime -= dt;
    if (npc.speechTime <= 0) npc.speech = null;
  }
  npc.chatterTimer -= dt;
  if (npc.chatterTimer <= 0) {
    npc.chatterTimer = CONFIG.chatterInterval;
    if (npc.grogyTime <= 0 && npc.speechTime <= 0 &&
        npc.chatterLines.length && Math.random() < CONFIG.chatterChance) {
      npc.speech = npc.chatterLines[Math.floor(Math.random() * npc.chatterLines.length)];
      npc.speechTime = CONFIG.speechDuration;
    }
  }
}

function startGame() {
  hideOverlay();
  initState();
  state.paused = false;
  if (state.animId) cancelAnimationFrame(state.animId);
  state.last = performance.now();
  state.animId = requestAnimationFrame(loop);
}

// 도움말 팝업 등 외부 UI가 게임을 잠시 멈출 때 호출 (index.html의 인라인 스크립트에서 사용).
// 일시정지 중엔 loop가 업데이트를 건너뛰고 rAF만 유지하다가 재개 시 dt 점프 없이 이어간다.
window.__gameSetPaused = (p) => {
  state.paused = p;
  if (!p && state.gameState === 'playing') state.last = performance.now();
};

function loop(ts) {
  if (state.gameState !== 'playing') { state.animId = null; return; }
  if (state.paused) { state.last = ts; state.animId = requestAnimationFrame(loop); return; }
  const dt = Math.min((ts - state.last) / 1000, 0.05);
  state.last = ts;

  const { player, npc } = state;
  player.spriteCenterY = player.y + SPRITE_CENTER_OFFSET_Y;
  npc.spriteCenterY    = npc.y    + SPRITE_CENTER_OFFSET_Y;
  if (player.invTime > 0)   player.invTime -= dt;
  if (player.grogyTime > 0) player.grogyTime -= dt;
  if (player.catchTime > 0) player.catchTime -= dt;
  if (npc.invTime > 0)      npc.invTime -= dt;
  if (npc.grogyTime > 0)    npc.grogyTime -= dt;

  player.isMoving = false;
  if (player.grogyTime <= 0) {
    let dx = 0, dy = 0;
    if (state.keys['KeyW']) dy = -1;
    if (state.keys['KeyS']) dy = 1;
    if (state.keys['KeyA']) dx = -1;
    if (state.keys['KeyD']) dx = 1;
    if (dx || dy) { const d = Math.hypot(dx, dy); movePlayer(player, dx / d, dy / d, STATUS.player.spd * dt); }
  }
  if (player.isMoving) player.animTime += dt;
  else player.animTime = 0;
  updatePlayerCharge(dt);

  const mdx = state.mouse.x - player.x, mdy = state.mouse.y - player.y;
  const md = Math.hypot(mdx, mdy);
  if (md > 5) player.facing = { x: mdx / md, y: mdy / md };

  // 들고 있는 공은 소유자를 따라가고, 날아가는 공은 애니메이션 타이머를 누적한다.
  for (const b of state.balls) {
    if (b.owner === 'player')   { b.x = player.x; b.y = player.y; }
    else if (b.owner === 'npc') { b.x = npc.x;    b.y = npc.y; }
    if (b.flying) b.animTime += dt;
    else b.animTime = 0;
  }

  state.timer -= dt;
  if (state.timer <= 0) { state.timer = 0; endGame('timeout'); return; }

  npc.isMoving = false;
  updateNPC(dt);
  if (npc.isMoving) npc.animTime += dt;
  else npc.animTime = 0;
  updateNpcSpeech(dt);
  const result = updateBall(dt);
  if (result) { endGame(result); return; }

  addPlayTime(dt);
  updateHPUI();
  draw(ctx);
  state.animId = requestAnimationFrame(loop);
}

setupInput();
initOverlayFlow(startGame);
