import { IMGS, getFacingKey } from './assets.js';

const SIZE = 96;           // 스프라이트 렌더 크기 (px)
const FOOT_OFFSET = 16;    // (x,y) 충돌 중심 기준 발 위치 (양수 = 아래)
export const SPRITE_CENTER_OFFSET_Y = FOOT_OFFSET - SIZE / 2; // 물리 중심 → 시각 중앙 오프셋
const ARROW_SIZE = SIZE / 3 + 6;
const WALK_FRAME_DUR = 0.12;

export function drawPlayer(ctx, player) {
  const groggy = player.grogyTime > 0;

  ctx.globalAlpha = player.invTime > 0 ? (Math.sin(player.invTime * 18) > 0 ? 0.3 : 1) : 1;

  const dir = getFacingKey(player.facing);
  const prefix = player.hasBall ? 'jindo_ball' : 'jindo';
  const frameIdx = player.isMoving ? (Math.floor(player.animTime / WALK_FRAME_DUR) % 4) + 1 : 1;
  const img = IMGS[`${prefix}_${dir}_${frameIdx}`];

  const spriteTop = player.y + FOOT_OFFSET - SIZE;

  if (img) {
    ctx.drawImage(img, player.x - SIZE / 2, spriteTop, SIZE, SIZE);
  } else {
    ctx.fillStyle = groggy ? '#5588AA' : '#378ADD';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 그로기 게이지
  if (groggy) {
    const bw = 36, bh = 4, bx = player.x - bw / 2, by = spriteTop - 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#EF9F27';
    ctx.fillRect(bx, by, bw * (player.grogyTime / 0.7), bh);
  }

  // 파워 게이지
  if (player.charge?.active) {
    const bw = 44, bh = 5, bx = player.x - bw / 2, by = spriteTop - 14;
    const v = Math.max(0, Math.min(1, player.charge.value));
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = v >= 1 ? '#FFF08A' : '#FFE35A';
    ctx.fillRect(bx, by, bw * v, bh);
  }

  ctx.globalAlpha = 1;

  // 던지기 방향 화살표 — 스프라이트 시각 중앙 기준
  const spriteCenterY = player.y + FOOT_OFFSET - SIZE / 2;
  const { facing } = player;
  const aStart = ARROW_SIZE, aEnd = ARROW_SIZE + 20;
  ctx.strokeStyle = groggy ? 'rgba(80,160,80,0.3)' : 'rgba(80,220,100,0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(player.x + facing.x * aStart, spriteCenterY + facing.y * aStart);
  ctx.lineTo(player.x + facing.x * aEnd,   spriteCenterY + facing.y * aEnd);
  ctx.stroke();
  ctx.setLineDash([]);
  const tip = { x: player.x + facing.x * aEnd, y: spriteCenterY + facing.y * aEnd };
  const ang = Math.atan2(facing.y, facing.x);
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - Math.cos(ang - 0.45) * 7, tip.y - Math.sin(ang - 0.45) * 7);
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - Math.cos(ang + 0.45) * 7, tip.y - Math.sin(ang + 0.45) * 7);
  ctx.stroke();

  // 그로기 텍스트
  if (groggy) {
    ctx.font = '11px PFStardust, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(239,159,39,0.9)';
    ctx.fillText('그로기!', player.x, spriteTop - 10);
  }
}
