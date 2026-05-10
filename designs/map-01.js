export const OBSTACLES = [
  {x:160,y:100,w:60,h:80},{x:440,y:100,w:60,h:80},
  {x:280,y:180,w:100,h:30},{x:160,y:260,w:60,h:80},
  {x:440,y:260,w:60,h:80},{x:260,y:340,w:140,h:30}
];

export function drawMap(ctx, W, H) {
  ctx.fillStyle = '#1a2a1a';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#2a3a2a';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  ctx.strokeStyle = '#4a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();

  OBSTACLES.forEach(o => {
    ctx.fillStyle = '#3a4a3a';
    ctx.strokeStyle = '#5a6a5a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 6);
    ctx.fill();
    ctx.stroke();
  });
}
