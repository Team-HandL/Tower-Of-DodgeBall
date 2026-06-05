import { initStatus, BASE, STATUS } from './status.js';

export const W = 1200, H = 800;
export const SAFE_DIST = 250;

export const state = {
  player: null,
  npc: null,
  ball: null,
  keys: null,
  mouse: { x: 0, y: 0 },
  gameState: null,
  animId: null,
  last: null,
};

// 다음 라운드에 스폰할 NPC의 스프라이트 시트 prefix (예: 'soccer', 'nerd').
// 층 진입 시 overlay가 설정하며, initState가 npc.sprite로 적용한다.
let _pendingNpcSprite = 'soccer';
let _pendingNpcAI = null;

export function setNextNPCSprite(key) {
  _pendingNpcSprite = key;
}

export function setNextNPCAI(ai) {
  _pendingNpcAI = ai ? { ...ai } : null;
}

export function initState() {
  initStatus();
  state.player = { x: 80,  y: 300, r: 16, hp: STATUS.player.hp, maxHp: STATUS.player.hp, hasBall: false, invTime: 0, grogyTime: 0, facing: { x: 1, y: 0 }, isMoving: false, animTime: 0,
                   charge: { active: false, value: 0 } };
  state.npc    = { x: 820, y: 300, r: 16, hp: STATUS.npc.hp,    maxHp: STATUS.npc.hp, hasBall: false, invTime: 0, grogyTime: 0,
                   state: 'aim', aimTimer: 1.0, dodgeDir: null, facing: { x: -1, y: 0 }, isMoving: false, animTime: 0,
                   sprite: _pendingNpcSprite, ai: _pendingNpcAI ? { ..._pendingNpcAI } : null };
  state.ball   = { x: W / 2, y: H / 2, r: 20, vx: 0, vy: 0, owner: null, thrownBy: null, flying: false, bounces: 0, animTime: 0,
                   power: 1, throwStr: BASE.player.str };
  state.keys   = {};
  state.timer  = 180;
  state.gameState = 'playing';
}
