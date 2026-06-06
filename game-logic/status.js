export const BASE = {
  player: { hp: 120, str: 100, spd: 180, velocity: 500, catchRange: 24, catchMinSpd: 200,
            chargeRate: 0.85, minPower: 0.65, maxPower: 1.45 },
  npc:    { hp: 120, str: 100, spd: 180, velocity: 500 },
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

// 버프 key → STATUS.player 적용 함수 맵
// 새 버프 추가 시 여기에 항목 하나만 추가
const BUFF_STAT = {
  throwPower: v => { STATUS.player.velocity   = Math.round(BASE.player.velocity   * (1 + v)); },
  catchRange: v => { STATUS.player.catchRange = Math.round(BASE.player.catchRange * (1 + v)); },
  moveSpeed:  v => { STATUS.player.spd        = Math.round(BASE.player.spd        * (1 + v)); },
  str:        v => { STATUS.player.str        = Math.round(BASE.player.str        * (1 + v)); },
};

export function applyBuffsToStatus(buffs) {
  Object.entries(buffs).forEach(([key, val]) => {
    if (val && BUFF_STAT[key]) BUFF_STAT[key](val);
  });
  console.log('[버프 적용 후 STATUS.player]', { ...STATUS.player });
}
