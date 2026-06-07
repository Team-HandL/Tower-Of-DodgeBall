import { state, W, H } from './state.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';

export function rectHit(x, y, r, o) {
  return x+r > o.x && x-r < o.x+o.w && y+r > o.y && y-r < o.y+o.h;
}

function obsBlock(nx, ny, r) {
  const obs = state.obstacles ?? OBSTACLES;
  return obs.some(o => o.hp > 0 && rectHit(nx, ny, r, o));
}

function findPassageOffset(x, y, r, axis, direction, maxOffset) {
  for (let offset = 1; offset <= maxOffset; offset++) {
    for (const sign of [-1, 1]) {
      const shiftedX = axis === 'x' ? x : x + sign * offset;
      const shiftedY = axis === 'x' ? y + sign * offset : y;
      const aheadX = axis === 'x' ? shiftedX + direction * maxOffset : shiftedX;
      const aheadY = axis === 'y' ? shiftedY + direction * maxOffset : shiftedY;
      if (!obsBlock(aheadX, aheadY, r)) {
        return sign * offset;
      }
    }
  }
  return null;
}

function clamp(e) {
  e.x = Math.max(e.r, Math.min(W - e.r, e.x));
  e.y = Math.max(e.r, Math.min(H - e.r, e.y));
}

export function moveEntity(e, dx, dy, spd) {
  const px = e.x, py = e.y;
  const nx = e.x + dx * spd, ny = e.y + dy * spd;
  if (!obsBlock(nx, e.y, e.r)) e.x = nx;
  if (!obsBlock(e.x, ny, e.r)) e.y = ny;
  clamp(e);
  if (e.x !== px || e.y !== py) e.isMoving = true;
}

export function movePlayer(e, dx, dy, spd) {
  const px = e.x, py = e.y;
  const assist = e.passageAssist;
  if (assist) {
    const inputDir = assist.axis === 'x' ? Math.sign(dx) : Math.sign(dy);
    if (inputDir !== assist.direction) {
      e.passageAssist = null;
    } else {
      const orth = assist.axis === 'x' ? e.y : e.x;
      const offset = assist.target - orth;
      if (Math.abs(offset) > 0.5) {
        const step = Math.sign(offset) * Math.min(Math.abs(offset), spd * 0.45);
        if (assist.axis === 'x' && !obsBlock(e.x, e.y + step, e.r)) e.y += step;
        if (assist.axis === 'y' && !obsBlock(e.x + step, e.y, e.r)) e.x += step;
      } else {
        if (assist.axis === 'x' && !obsBlock(e.x, assist.target, e.r)) e.y = assist.target;
        if (assist.axis === 'y' && !obsBlock(assist.target, e.y, e.r)) e.x = assist.target;
        const stepX = assist.axis === 'x' ? assist.direction * spd : 0;
        const stepY = assist.axis === 'y' ? assist.direction * spd : 0;
        if (!obsBlock(e.x + stepX, e.y + stepY, e.r)) {
          e.x += stepX;
          e.y += stepY;
          assist.remaining -= spd;
        }
      }
      if (assist.remaining <= 0) e.passageAssist = null;
      clamp(e);
      if (e.x !== px || e.y !== py) e.isMoving = true;
      return;
    }
  }

  const nx = e.x + dx * spd;
  const ny = e.y + dy * spd;
  const blockedX = dx !== 0 && obsBlock(nx, e.y, e.r);
  const blockedY = dy !== 0 && obsBlock(e.x, ny, e.r);
  const maxAssist = 12;
  const assistStep = spd * 0.45;
  let assistedX = false;
  let assistedY = false;

  if (blockedX) {
    const offset = findPassageOffset(e.x, e.y, e.r, 'x', Math.sign(dx), maxAssist);
    if (offset !== null) {
      e.y += Math.sign(offset) * Math.min(Math.abs(offset), assistStep);
      assistedY = true;
      e.passageAssist = {
        axis: 'x',
        direction: Math.sign(dx),
        target: py + offset,
        remaining: 96,
      };
    }
  }

  const canContinueX = dx !== 0 && !obsBlock(nx, e.y, e.r);
  if (blockedY && !canContinueX) {
    const offset = findPassageOffset(e.x, e.y, e.r, 'y', Math.sign(dy), maxAssist);
    if (offset !== null) {
      e.x += Math.sign(offset) * Math.min(Math.abs(offset), assistStep);
      assistedX = true;
      e.passageAssist = {
        axis: 'y',
        direction: Math.sign(dy),
        target: px + offset,
        remaining: 96,
      };
    }
  }
  if (!assistedX && !obsBlock(nx, e.y, e.r)) e.x = nx;
  if (!assistedY && !obsBlock(e.x, ny, e.r)) e.y = ny;

  clamp(e);
  if (e.x !== px || e.y !== py) e.isMoving = true;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function hasLOS(a, b) {
  const obs = state.obstacles ?? OBSTACLES;
  // 샘플 간격을 거리에 맞춰 ~12px로 유지한다. 고정 16분할이면 먼 거리에서 간격이
  // 90px까지 벌어져 48px 장애물을 통째로 건너뛰어(LOS가 뚫린 것으로 오판) NPC가
  // 장애물 너머로 헛던지는 원인이 된다.
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(8, Math.ceil(len / 12));
  for (let i = 1; i < steps; i++) {
    const t = i / steps, cx = a.x + (b.x - a.x) * t, cy = a.y + (b.y - a.y) * t;
    if (obs.some(o => o.hp > 0 && cx > o.x && cx < o.x + o.w && cy > o.y && cy < o.y + o.h)) return false;
  }
  return true;
}
