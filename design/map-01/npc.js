import { IMGS, getFacingKey } from '../assets.js';

const SIZE = 96;
const FOOT_OFFSET = 16; // (x,y) 충돌 중심 기준 발 위치 (양수 = 아래)

export function drawNPC(ctx, npc) {
  const groggy = npc.grogyTime > 0;

  ctx.globalAlpha = npc.invTime > 0 ? (Math.sin(npc.invTime * 18) > 0 ? 0.3 : 1) : 1;

  const facing = npc.facing ?? { x: -1, y: 0 };
  const dir = getFacingKey(facing);
  const img = IMGS[`soccer_${dir}`];

  const spriteTop = npc.y + FOOT_OFFSET - SIZE;

  if (img) {
    ctx.drawImage(img, npc.x - SIZE / 2, spriteTop, SIZE, SIZE);
  } else {
    ctx.fillStyle = groggy ? '#AA5555' : '#E24B4A';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, npc.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 그로기 게이지
  if (groggy) {
    const bw = 36, bh = 4, bx = npc.x - bw / 2, by = spriteTop - 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#EF9F27';
    ctx.fillRect(bx, by, bw * (npc.grogyTime / 0.7), bh);
  }

  ctx.globalAlpha = 1;
}
