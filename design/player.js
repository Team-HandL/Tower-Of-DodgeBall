import { IMGS, getFacingKey } from './assets.js';

const SIZE = 96; // 스프라이트 렌더 크기 (px)

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

  // 그로기 텍스트
  if (groggy) {
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(239,159,39,0.9)';
    ctx.fillText('그로기!', player.x, player.y - player.r - 18);
  }
}
