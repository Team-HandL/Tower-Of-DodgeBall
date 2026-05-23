export function drawBall(ctx, ball, player, npc) {
  const ballDead = ball.flying && ball.bounces > 0;
  ctx.fillStyle = ballDead ? '#888860' : '#F0F0A0';
  ctx.strokeStyle = ballDead ? '#666640' : '#AAAA40';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
