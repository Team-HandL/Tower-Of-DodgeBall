import { initStatus, BASE, STATUS } from './status.js';
import { FLOOR_OBSTACLE_GROUPS, TILE, OBSTACLES } from '../design/map-01/obstacles.js';

export const W = 1200, H = 768;
export const SAFE_DIST = 250;
export const BALL_R = 20;

// 게임플레이 튜닝값 — 한 곳에서 조정.
// blockBreakBallChance: soft 블록 파괴 시 추가 공이 떨어질 확률(0~1).
// maxBalls: 동시에 존재할 수 있는 공의 최대 개수.
export const CONFIG = {
  blockBreakBallChance: 0.5,
  maxBalls: 4,
  // NPC 인게임 대사
  chatterInterval: 5,    // 대사 시도 간격(초)
  chatterChance: 0.6,    // 시도할 때 실제로 말할 확률 (나머지는 침묵)
  speechDuration: 2.5,   // 말풍선 표시 시간(초)
};

export const state = {
  player: null,
  npc: null,
  balls: [],          // 멀티볼: 모든 공의 배열 (held/flying/free 모두 포함)
  keys: null,
  mouse: { x: 0, y: 0 },
  gameState: null,
  animId: null,
  last: null,
};

// 공 1개 생성 (자유 상태). 블록 파괴 스폰과 initState가 공유.
export function makeBall(x, y) {
  return { x, y, r: BALL_R, vx: 0, vy: 0, owner: null, thrownBy: null,
           flying: false, bounces: 0, animTime: 0,
           power: 1, throwStr: BASE.player.str, throwSpd: 0 };
}

// who('player'|'npc')가 들고 있는 공 (없으면 null)
export function heldBall(who) {
  return state.balls.find(b => b.owner === who) || null;
}

// 다음 라운드에 스폰할 NPC의 스프라이트 시트 prefix (예: 'soccer', 'nerd').
// 층 진입 시 overlay가 설정하며, initState가 npc.sprite로 적용한다.
let _pendingNpcSprite = 'soccer';
let _pendingNpcAI = null;
let _pendingObstacleGroups = null;
let _pendingSpawnPositions = null;
let _pendingNpcChatter = null;

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

// NPC 인게임 대사 묶음 — { chatter: [...일상 대사], hit: [...피격 대사] }
export function setNextNPCChatter(lines) {
  _pendingNpcChatter = lines ? { ...lines } : null;
}

export function initState() {
  initStatus();
  const spawn = _pendingSpawnPositions;
  _pendingSpawnPositions = null;
  const px = spawn?.player ? spawn.player.c * TILE + TILE / 2 : 80;
  const py = spawn?.player ? spawn.player.r * TILE + TILE / 2 : H / 2;
  const nx = spawn?.npc    ? spawn.npc.c    * TILE + TILE / 2 : 1120;
  const ny = spawn?.npc    ? spawn.npc.r    * TILE + TILE / 2 : H / 2;
  console.log('[initState] spawn raw:', spawn, '→ player:', px, py, '/ npc:', nx, ny);
  state.player = { x: px,  y: py,  r: 16, hp: STATUS.player.hp, maxHp: STATUS.player.hp, hasBall: false, invTime: 0, grogyTime: 0, facing: { x: 1, y: 0 }, isMoving: false, animTime: 0,
                   charge: { active: false, value: 0 } };
  state.npc    = { x: nx,  y: ny,  r: 16, hp: STATUS.npc.hp,    maxHp: STATUS.npc.hp, hasBall: false, invTime: 0, grogyTime: 0,
                   state: 'aim', aimTimer: 1.0, dodgeDir: null, facing: { x: -1, y: 0 }, isMoving: false, animTime: 0,
                   sprite: _pendingNpcSprite, ai: _pendingNpcAI ? { ..._pendingNpcAI } : null,
                   navPath: [], navGoalKey: null, navRepathTimer: 0,
                   shotTarget: null, shotPathCost: Infinity, shotPlayerCellKey: null, shotPlanTimer: 0,
                   chatterLines: _pendingNpcChatter?.chatter ?? [],
                   hitLines: _pendingNpcChatter?.hit ?? [],
                   chatterTimer: CONFIG.chatterInterval, speech: null, speechTime: 0 };
  _pendingNpcChatter = null;
  state.balls  = [ makeBall(W / 2, H / 2) ];
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
