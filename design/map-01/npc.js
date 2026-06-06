import { IMGS, getFacingKey } from '../assets.js';

const SIZE = 96;
const FOOT_OFFSET = 16; // (x,y) 충돌 중심 기준 발 위치 (양수 = 아래)
const WALK_FRAME_DUR = 0.12;

function hpColor(hpRate) {
  const r = Math.max(0, Math.min(1, hpRate));
  return `rgb(${Math.round(220 - 160 * r)},${Math.round(40 + 160 * r)},40)`;
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
}
