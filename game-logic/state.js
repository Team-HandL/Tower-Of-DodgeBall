export const W = 900, H = 600;
export const SPD = 140;
export const THROW_SPD     = 340;
export const NPC_THROW_SPD = 340;
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

export function initState() {
  state.player = { x: 80,  y: 300, r: 16, hp: 3, hasBall: false, invTime: 0, grogyTime: 0, facing: { x: 1, y: 0 } };
  state.npc    = { x: 820, y: 300, r: 16, hp: 3, hasBall: true,  invTime: 0, grogyTime: 0,
                   state: 'aim', aimTimer: 1.0, dodgeDir: null, facing: { x: -1, y: 0 } };
  state.ball   = { x: 820, y: 300, r: 10, vx: 0, vy: 0, owner: 'npc', thrownBy: null, flying: false, bounces: 0 };
  state.keys   = {};
  state.gameState = 'playing';
}
