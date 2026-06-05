import { state, W, H } from './state.js';
import { OBSTACLES } from '../design/map-01/obstacles.js';

export function rectHit(x, y, r, o) {
  return x+r > o.x && x-r < o.x+o.w && y+r > o.y && y-r < o.y+o.h;
}

function obsBlock(nx, ny, r) {
  const obs = state.obstacles ?? OBSTACLES;
  return obs.some(o => o.hp > 0 && rectHit(nx, ny, r, o));
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

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function hasLOS(a, b) {
  for (let i = 1; i < 16; i++) {
    const t = i / 16, cx = a.x + (b.x - a.x) * t, cy = a.y + (b.y - a.y) * t;
    if (OBSTACLES.some(o => cx > o.x && cx < o.x+o.w && cy > o.y && cy < o.y+o.h)) return false;
  }
  return true;
}
