const BUILD_VERSION = 'analytics-mvp-2026-06-08';
const RUN_ID_KEY = 'tod_run_id';

let currentRunId = null;
let runStartedAt = 0;
let battleStartedAt = 0;
let deathCount = 0;
const floorAttempts = new Map();

function makeRunId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function send(eventName, params = {}) {
  const payload = {
    build_version: BUILD_VERSION,
    ...params,
  };
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.debug('[analytics]', eventName, payload);
  }
}

export function startRun(startType = 'first_start') {
  currentRunId = makeRunId();
  sessionStorage.setItem(RUN_ID_KEY, currentRunId);
  runStartedAt = performance.now();
  battleStartedAt = 0;
  deathCount = 0;
  floorAttempts.clear();

  send('game_start', {
    run_id: currentRunId,
    start_type: startType,
  });
}

export function ensureRun(startType = 'first_start') {
  if (!currentRunId) startRun(startType);
  return currentRunId;
}

export function getRunId() {
  return currentRunId;
}

export function trackFloorEnter(floor) {
  ensureRun();
  const attemptNo = (floorAttempts.get(floor) || 0) + 1;
  floorAttempts.set(floor, attemptNo);
  battleStartedAt = performance.now();

  send('floor_enter', {
    run_id: currentRunId,
    floor,
    attempt_no: attemptNo,
  });
}

export function trackBattleEnd({ floor, result, endReason, playerHpEnd, npcHpEnd, abilityCount }) {
  ensureRun();
  if (result === 'lose') deathCount += 1;

  send('battle_end', {
    run_id: currentRunId,
    floor,
    result,
    end_reason: endReason,
    duration_sec: Math.round((performance.now() - battleStartedAt) / 1000),
    player_hp_end: Math.round(playerHpEnd ?? 0),
    npc_hp_end: Math.round(npcHpEnd ?? 0),
    ability_count: Math.round(abilityCount ?? 0),
    attempt_no: floorAttempts.get(floor) || 1,
  });
}

export function trackRetry({ retryType, floor }) {
  ensureRun();
  send('retry', {
    run_id: currentRunId,
    retry_type: retryType,
    floor,
    retry_count: retryType === 'same_floor' ? (floorAttempts.get(floor) || 1) : deathCount,
  });
}

export function trackAbilitySelect({ floor, abilityId, abilityType }) {
  ensureRun();
  send('ability_select', {
    run_id: currentRunId,
    floor,
    ability_id: abilityId,
    ability_type: abilityType,
  });
}

export function trackGameEnd({ endType, lastFloor, totalDurationSec, abilityCombo, abilityCount }) {
  ensureRun();
  send('game_end', {
    run_id: currentRunId,
    end_type: endType,
    last_floor: lastFloor,
    total_duration_sec: Math.round(totalDurationSec ?? ((performance.now() - runStartedAt) / 1000)),
    death_count: deathCount,
    ability_combo: abilityCombo || 'none',
    ability_count: Math.round(abilityCount ?? 0),
  });
}
