import { IMGS } from './assets.js';

// 공 애니메이션: ball_basic ↔ ball_180 교대 속도 (초)
const ANIM_INTERVAL = 0.1;

export function drawBall(ctx, ball, player, npc) {
  if (player.hasBall || npc.hasBall) return;
  // 날아가는 중엔 animTime 기준으로 두 이미지 교대, 정지 시 ball_basic 고정
  const frameIndex = ball.flying
    ? Math.floor(ball.animTime / ANIM_INTERVAL) % 2
    : 0;
  const imgKey = frameIndex === 0 ? 'ball_basic' : 'ball_180';
  const img = IMGS[imgKey];

  if (img) {
    const size = ball.r * 2;
    ctx.drawImage(img, ball.x - ball.r, ball.y - ball.r, size, size);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
