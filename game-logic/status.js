export const BASE = {
  player: { hp: 120, str: 100, spd: 150, velocity: 500, catchRange: 24, catchMinSpd: 200 },
  npc:    { hp: 120, str: 100, spd: 150, velocity: 500 },
};

export const STATUS = {
  player: { ...BASE.player },
  npc:    { ...BASE.npc },
};

let _pendingNpcStats = null;

export function setNextNPCStats(stats) {
  _pendingNpcStats = stats;
}

export function initStatus() {
  STATUS.player = { ...BASE.player };
  STATUS.npc    = _pendingNpcStats ? { ...BASE.npc, ..._pendingNpcStats } : { ...BASE.npc };
  _pendingNpcStats = null;
}
