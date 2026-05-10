export const W = 660, H = 420;
export const SPD = 130;
export const SAFE_DIST = 250;

export const state = {
  player: null,
  npc: null,
  ball: null,
  keys: null,
  gameState: null,
  animId: null,
  last: null,
};

export function initState() {
  state.player = { x: 80,  y: 210, r: 16, hp: 3, hasBall: false, invTime: 0, grogyTime: 0 };
  state.npc    = { x: 580, y: 210, r: 16, hp: 3, hasBall: true,  invTime: 0, grogyTime: 0,
                   state: 'aim', aimTimer: 1.0, dodgeDir: null };
  state.ball   = { x: 580, y: 210, r: 10, vx: 0, vy: 0, owner: 'npc', thrownBy: null, flying: false, bounces: 0 };
  state.keys   = {};
  state.gameState = 'playing';
}
