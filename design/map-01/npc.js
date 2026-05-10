export function drawNPC(ctx, npc) {
  const groggy = npc.grogyTime > 0;

  ctx.globalAlpha = npc.invTime > 0 ? (Math.sin(npc.invTime * 18) > 0 ? 0.3 : 1) : 1;

  ctx.fillStyle = groggy ? '#AA5555' : '#E24B4A';
  ctx.beginPath();
  ctx.arc(npc.x, npc.y, npc.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F7C1C1';
  ctx.beginPath();
  ctx.arc(npc.x, npc.y - 4, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#A32D2D';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(npc.x, npc.y, npc.r, 0, Math.PI * 2);
  ctx.stroke();

  if (groggy) {
    const bw = 36, bh = 4, bx = npc.x - bw / 2, by = npc.y - npc.r - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#EF9F27';
    ctx.fillRect(bx, by, bw * (npc.grogyTime / 0.7), bh);
  }

  ctx.globalAlpha = 1;
}
