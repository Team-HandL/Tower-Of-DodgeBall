import { IMGS, getFacingKey } from '../assets.js';
import { W } from '../../game-logic/state.js';

const SIZE = 96;
const FOOT_OFFSET = 16; // (x,y) 충돌 중심 기준 발 위치 (양수 = 아래)
const WALK_FRAME_DUR = 0.12;

function hpColor(hpRate) {
  const r = Math.max(0, Math.min(1, hpRate));
  return `rgb(${Math.round(220 - 160 * r)},${Math.round(40 + 160 * r)},40)`;
}

// 픽셀 스타일 말풍선 — 흰 본체 + 검은 테두리/텍스트, 아래쪽 꼬리.
// cx: 가리키는 대상의 x, bottomY: 꼬리 끝이 닿을 y(스프라이트 위쪽).
function drawSpeechBubble(ctx, cx, bottomY, text) {
  const FONT = 13, padX = 8, padY = 6, border = 2, tail = 6;
  ctx.font = `${FONT}px 'PFStardust', monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const tw = Math.ceil(ctx.measureText(text).width);
  const bw = tw + padX * 2;
  const bh = FONT + padY * 2;
  let x = Math.round(cx - bw / 2);
  const y = Math.round(bottomY - tail - bh);
  x = Math.max(border + 2, Math.min(W - bw - border - 2, x)); // 좌우 화면 클램프

  // 테두리(검정) → 본체(흰색)
  ctx.fillStyle = '#000';
  ctx.fillRect(x - border, y - border, bw + border * 2, bh + border * 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, bw, bh);

  // 꼬리 — 대상 쪽을 가리키되 말풍선 폭 안으로 클램프
  const tcx = Math.max(x + tail + 2, Math.min(x + bw - tail - 2, Math.round(cx)));
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(tcx - tail, y + bh);
  ctx.lineTo(tcx + tail, y + bh);
  ctx.lineTo(tcx, y + bh + tail + border);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(tcx - tail + 2, y + bh - 1);
  ctx.lineTo(tcx + tail - 2, y + bh - 1);
  ctx.lineTo(tcx, y + bh + tail - 2);
  ctx.closePath();
  ctx.fill();

  // 텍스트
  ctx.fillStyle = '#000';
  ctx.fillText(text, x + padX, y + padY);
}

export function drawNPC(ctx, npc) {
  const groggy = npc.grogyTime > 0;

  ctx.globalAlpha = npc.invTime > 0 ? (Math.sin(npc.invTime * 18) > 0 ? 0.3 : 1) : 1;

  const facing = npc.facing ?? { x: -1, y: 0 };
  const dir = getFacingKey(facing);
  const base = npc.sprite ?? 'soccer';
  const prefix = npc.hasBall ? `${base}_ball` : base;
  // 걷기 사이클을 2→3→4→1 순으로 돌려 2번(정지 포즈, idle과 동일)에서 시작한다.
  // 짧은 미세 이동에서 1번(역동적 달리기 포즈)으로 튀어 "계속 뛰는 것처럼" 보이던 문제 해결.
  const frameIdx = npc.isMoving ? ((Math.floor(npc.animTime / WALK_FRAME_DUR) + 1) % 4) + 1 : 2;
  const img = (groggy || npc.hp <= 0) ? IMGS[`${base}_hit_1`] : IMGS[`${prefix}_${dir}_${frameIdx}`];

  const spriteTop = npc.y + FOOT_OFFSET - SIZE;

  if (img) {
    ctx.drawImage(img, npc.x - SIZE / 2, spriteTop, SIZE, SIZE);
  } else {
    ctx.fillStyle = groggy ? '#AA5555' : '#E24B4A';
    ctx.beginPath();
    ctx.arc(npc.x, npc.y, npc.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 그로기 게이지
  if (groggy) {
    const bw = 36, bh = 4, bx = npc.x - bw / 2, by = spriteTop - 6;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#EF9F27';
    ctx.fillRect(bx, by, bw * (npc.grogyTime / 0.7), bh);
  }

  ctx.globalAlpha = 1;

  // 캐릭터 하단 HP 바
  {
    const bw = 46, bh = 4;
    const bx = npc.x - bw / 2;
    const by = spriteTop + SIZE + 2;
    const hpRate = npc.hp / (npc.maxHp || 1);

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = hpColor(hpRate);
    ctx.fillRect(bx, by, bw * Math.max(0, Math.min(1, hpRate)), bh);
  }

  // 인게임 대사 말풍선 (스프라이트 위, 그로기 게이지보다 더 위)
  if (npc.speech && npc.speechTime > 0) {
    drawSpeechBubble(ctx, npc.x, spriteTop - 10, npc.speech);
  }
}
