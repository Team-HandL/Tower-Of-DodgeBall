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

  // Facing direction arrow
  const { facing } = player;
  const aStart = player.r + 3, aEnd = player.r + 20;
  ctx.strokeStyle = groggy ? 'rgba(100,150,200,0.35)' : 'rgba(100,190,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(player.x + facing.x * aStart, player.y + facing.y * aStart);
  ctx.lineTo(player.x + facing.x * aEnd, player.y + facing.y * aEnd);
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

  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  if (groggy) {
    ctx.fillStyle = 'rgba(239,159,39,0.9)';
    ctx.fillText('그로기!', player.x, player.y - 28);
  }
}
