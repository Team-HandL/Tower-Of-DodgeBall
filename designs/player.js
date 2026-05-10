export function drawPlayer(ctx, player, npc, ball) {
  const groggy = player.grogyTime > 0;

  ctx.globalAlpha = player.invTime > 0 ? (Math.sin(player.invTime * 18) > 0 ? 0.3 : 1) : 1;

  ctx.fillStyle = groggy ? '#5588AA' : '#378ADD';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#B5D4F4';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 4, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#185FA5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.stroke();

  if (groggy) {
    const bw = 36, bh = 4, bx = player.x - bw / 2, by = player.y - player.r - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#EF9F27';
    ctx.fillRect(bx, by, bw * (player.grogyTime / 0.7), bh);
  }

  ctx.globalAlpha = 1;

  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  const dBall = Math.hypot(ball.x - player.x, ball.y - player.y);
  const pickupRange = ball.r + player.r + 32;

  if (!ball.flying && ball.owner === null && dBall < pickupRange && player.grogyTime <= 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Z: 줍기', ball.x, ball.y - 18);
  }
  if (ball.flying && ball.bounces > 0 && dBall < pickupRange && player.grogyTime <= 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Z: 잡기', ball.x, ball.y - 18);
  }
  if (player.hasBall && player.grogyTime <= 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('X: 던지기', player.x, player.y - 28);
  }
  if (groggy) {
    ctx.fillStyle = 'rgba(239,159,39,0.9)';
    ctx.fillText('그로기!', player.x, player.y - 28);
  }
}
