import { IMGS, getFacingKey } from '../assets.js';

const SIZE = 96; // 스프라이트 렌더 크기 (px)

export function drawNPC(ctx, npc) {
  const groggy = npc.grogyTime > 0;

  ctx.globalAlpha = npc.invTime > 0 ? (Math.sin(npc.invTime * 18) > 0 ? 0.3 : 1) : 1;

  const facing = npc.facing ?? { x: -1, y: 0 };
  const dir = getFacingKey(facing);
  const img = IMGS[`soccer_${dir}`];

  if (img) {
    ctx.drawImage(img, npc.x - SIZE / 2, npc.y - SIZE / 2, SIZE, SIZE);
  } else {
    // 이미지 로딩 전 폴백 — 원형
    ctx.fillStyle = groggy ? '#AA5555' : '#E24B4A';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, npc.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 그로기 게이지 (깜빡임 효과 안에 포함)
  if (groggy) {
    const bw = 36, bh = 4, bx = npc.x - bw / 2, by = npc.y - npc.r - 14;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#EF9F27';
    ctx.fillRect(bx, by, bw * (npc.grogyTime / 0.7), bh);
  }

  ctx.globalAlpha = 1;
}
