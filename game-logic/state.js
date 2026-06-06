import { initStatus, BASE, STATUS } from './status.js';
import { FLOOR_OBSTACLE_GROUPS, TILE, OBSTACLES } from '../design/map-01/obstacles.js';

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
let _pendingObstacleGroups = null;
let _pendingSpawnPositions = null;

export function setNextObstacles(groups) {
  _pendingObstacleGroups = groups ? [...groups] : null;
}

export function setNextNPCSprite(key) {
  _pendingNpcSprite = key;
}

export function setNextNPCAI(ai) {
  _pendingNpcAI = ai ? { ...ai } : null;
}

export function setNextSpawnPositions(pos) {
  _pendingSpawnPositions = pos ? { ...pos } : null;
}

export function initState() {
  initStatus();
  const spawn = _pendingSpawnPositions;
  _pendingSpawnPositions = null;
  const px = spawn?.player ? spawn.player.c * TILE + TILE / 2 : 80;
  const py = spawn?.player ? spawn.player.r * TILE + TILE / 2 : 400;
  const nx = spawn?.npc    ? spawn.npc.c    * TILE + TILE / 2 : 1120;
  const ny = spawn?.npc    ? spawn.npc.r    * TILE + TILE / 2 : 400;
  console.log('[initState] spawn raw:', spawn, '→ player:', px, py, '/ npc:', nx, ny);
  state.player = { x: px,  y: py,  r: 16, hp: STATUS.player.hp, maxHp: STATUS.player.hp, hasBall: false, invTime: 0, grogyTime: 0, facing: { x: 1, y: 0 }, isMoving: false, animTime: 0,
                   charge: { active: false, value: 0 } };
  state.npc    = { x: nx,  y: ny,  r: 16, hp: STATUS.npc.hp,    maxHp: STATUS.npc.hp, hasBall: false, invTime: 0, grogyTime: 0,
                   state: 'aim', aimTimer: 1.0, dodgeDir: null, facing: { x: -1, y: 0 }, isMoving: false, animTime: 0,
                   sprite: _pendingNpcSprite, ai: _pendingNpcAI ? { ..._pendingNpcAI } : null };
  state.ball   = { x: W / 2, y: H / 2, r: 20, vx: 0, vy: 0, owner: null, thrownBy: null, flying: false, bounces: 0, animTime: 0,
                   power: 1, throwStr: BASE.player.str, throwSpd: 0 };
  const obsGroups = _pendingObstacleGroups ?? FLOOR_OBSTACLE_GROUPS[1];
  state.obstacleGroups = obsGroups;
  state.obstacles = obsGroups.flat()
    .map(({ c, r, type = 'hard' }) => ({
      x: c * TILE, y: r * TILE, w: TILE, h: TILE, type, c, r,
      hp: type === 'soft' ? 2 : Infinity,
    }));
  state.keys   = {};
  state.timer  = 180;
  state.gameState = 'playing';
}
