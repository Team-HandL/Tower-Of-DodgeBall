import { IMGS, getFacingKey } from './assets.js';

const SIZE = 96;       // 스프라이트 렌더 크기 (px)
const ARROW_SIZE = SIZE / 3 + 6; // 화살표 시작 거리 (캐릭터 중심 기준)

export function drawPlayer(ctx, player) {
  const groggy = player.grogyTime > 0;

  ctx.globalAlpha = player.invTime > 0 ? (Math.sin(player.invTime * 18) > 0 ? 0.3 : 1) : 1;

  const dir = getFacingKey(player.facing);
  const img = IMGS[`jindo_${dir}`];

  if (img) {
    ctx.drawImage(img, player.x - SIZE / 2, player.y - SIZE / 2, SIZE, SIZE);
  } else {
    // 이미지 로딩 전 폴백 — 원형
    ctx.fillStyle = groggy ? '#5588AA' : '#378ADD';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 그로기 게이지 (깜빡임 효과 안에 포함)
  if (groggy) {
    const bw = 36, bh = 4, bx = player.x - bw / 2, by = player.y - player.r - 14;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#EF9F27';
    ctx.fillRect(bx, by, bw * (player.grogyTime / 0.7), bh);
  }

  ctx.globalAlpha = 1;

  // 던지기 방향 화살표
  const { facing } = player;
  const aStart = ARROW_SIZE, aEnd = ARROW_SIZE + 20;
  ctx.strokeStyle = groggy ? 'rgba(80,160,80,0.3)' : 'rgba(80,220,100,0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(player.x + facing.x * aStart, player.y + facing.y * aStart);
  ctx.lineTo(player.x + facing.x * aEnd,   player.y + facing.y * aEnd);
  ctx.stroke();
  ctx.setLineDash([]);
  const tip = { x: player.x + facing.x * aEnd, y: player.y + facing.y * aEnd };
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
    ctx.fillText('그로기!', player.x, player.y - player.r - 18);
  }
}
