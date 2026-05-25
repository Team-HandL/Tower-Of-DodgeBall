import { state, W, H } from './state.js';
import { drawBackground } from '../design/map-01/background.js';
import { drawNPC } from '../design/map-01/npc.js';
import { OBSTACLE_GROUPS, drawBlock } from '../design/map-01/obstacles.js';
import { drawBall } from '../design/ball.js';
import { drawPlayer } from '../design/player.js';

function drawMap(ctx) {
  drawBackground(ctx, W, H);
  OBSTACLE_GROUPS.forEach(group =>
    group.forEach(({ c, r }) => drawBlock(ctx, c, r))
  );
}

function drawHUD(ctx, player, npc) {
  const maxHP = 3, barW = 200, barH = 12, barY = 20, margin = 20;
  function hpColor(hp) {
    const r = hp / maxHP;
    return `rgb(${Math.round(220 - 160 * r)},${Math.round(40 + 160 * r)},40)`;
  }
  // 배경
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.roundRect(margin, barY, barW, barH, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(W - margin - barW, barY, barW, barH, 4); ctx.fill();
  // 플레이어 바 (왼쪽, ← 방향으로 닳음)
  ctx.fillStyle = hpColor(player.hp);
  ctx.beginPath(); ctx.roundRect(margin, barY, barW * (player.hp / maxHP), barH, 4); ctx.fill();
  // NPC 바 (오른쪽, → 방향으로 닳음)
  const nw = barW * (npc.hp / maxHP);
  ctx.fillStyle = hpColor(npc.hp);
  ctx.beginPath(); ctx.roundRect(W - margin - nw, barY, nw, barH, 4); ctx.fill();
  // 레이블
  ctx.font = '11px PFStardust, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'left';  ctx.fillText('나',  margin, barY + barH + 14);
  ctx.textAlign = 'right'; ctx.fillText('NPC', W - margin, barY + barH + 14);

  // 타이머
  const secs = Math.ceil(state.timer);
  const timeStr = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  ctx.font = '20px PFStardust, sans-serif';
  ctx.fillStyle = state.timer <= 30 ? 'rgba(220,60,60,0.9)' : 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, W / 2, barY + barH);
}

export function draw(ctx) {
  const { ball, player, npc } = state;
  ctx.clearRect(0, 0, W, H);
  drawMap(ctx);
  drawBall(ctx, ball, player, npc);
  drawPlayer(ctx, player, npc, ball);
  drawNPC(ctx, npc);
  drawHUD(ctx, player, npc);
}
