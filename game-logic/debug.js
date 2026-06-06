// ── DEV ONLY ──────────────────────────────────────────────────────────────
// 층 즉시 이동 패널. 제거: game-logic.js의 import 한 줄 삭제 + 이 파일 삭제.
// ──────────────────────────────────────────────────────────────────────────
import { jumpToFloor } from './overlay.js';

const FLOOR_LABELS = {
  1: '1F 너드',
  2: '2F CEO',
  3: '3F 트레이너',
  4: '4F 축구선수',
  5: '5F 피구로이드',
};

const panel = document.createElement('div');
panel.id = 'dev-floor-panel';
panel.style.cssText = [
  'position:fixed', 'top:8px', 'right:8px', 'z-index:9999',
  'display:flex', 'flex-direction:column', 'gap:4px',
  'background:rgba(0,0,0,0.80)', 'border:1px solid #f90',
  'border-radius:8px', 'padding:8px 10px',
  'font-family:monospace', 'font-size:12px',
  'box-shadow:0 2px 10px rgba(0,0,0,0.6)',
].join(';');

const title = document.createElement('div');
title.textContent = '🛠 DEV — 층 이동';
title.style.cssText = 'color:#f90;text-align:center;margin-bottom:4px;letter-spacing:1px;';
panel.appendChild(title);

Object.entries(FLOOR_LABELS).forEach(([n, label]) => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = [
    'padding:4px 10px', 'cursor:pointer',
    'background:rgba(255,144,0,0.12)', 'border:1px solid rgba(255,144,0,0.45)',
    'color:#f90', 'border-radius:4px',
    'font-family:monospace', 'font-size:12px', 'text-align:left',
  ].join(';');
  btn.onmouseenter = () => { btn.style.background = 'rgba(255,144,0,0.28)'; };
  btn.onmouseleave = () => { btn.style.background = 'rgba(255,144,0,0.12)'; };
  btn.onclick = () => jumpToFloor(Number(n));
  panel.appendChild(btn);
});

document.body.appendChild(panel);
