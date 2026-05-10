export function drawBall(ctx, ball, player, npc) {
  if (player.hasBall) {
    ctx.strokeStyle = 'rgba(239,159,39,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(npc.x, npc.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (ball.flying && ball.thrownBy === 'player') {
    const bspd = Math.hypot(ball.vx, ball.vy) || 1;
    ctx.strokeStyle = 'rgba(239,159,39,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(ball.x + ball.vx / bspd * 180, ball.y + ball.vy / bspd * 180);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (npc.hasBall && npc.state === 'aim' && npc.grogyTime <= 0) {
    ctx.strokeStyle = 'rgba(226,75,74,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(npc.x, npc.y);
    ctx.lineTo(player.x, player.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const ballDead = ball.flying && ball.bounces > 0;
  ctx.fillStyle = ballDead ? '#888860' : '#F0F0A0';
  ctx.strokeStyle = ballDead ? '#666640' : '#AAAA40';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
