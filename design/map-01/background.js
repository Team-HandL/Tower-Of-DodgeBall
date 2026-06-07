import { IMGS } from '../assets.js';

const TILE  = 48;  // 타일 크기 (px) — 더 작게
const GROUT = 2;   // 줄눈 두께 (px)

// 시드 기반 의사난수
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 층별 배경: assets.js가 미리 로드한 background_N PNG를 캔버스 전체에 그린다.
// 이미지 로드 전(또는 누락 시)에는 절차적 돌바닥(drawStoneFloor)으로 폴백한다.
export function drawBackground(ctx, W, H, floor = 1) {
  const img = IMGS[`background_${floor}`];
  if (img) {
    ctx.drawImage(img, 0, 0, W, H);
    return;
  }
  drawStoneFloor(ctx, W, H);
}

function drawStoneFloor(ctx, W, H) {
  const cols = Math.ceil(W / TILE) + 1;
  const rows = Math.ceil(H / TILE) + 1;

  // ── 1. 줄눈 (어두운 틈새) ────────────────────────────────
  ctx.fillStyle = '#181818';
  ctx.fillRect(0, 0, W, H);

  // ── 2. 돌 타일 ───────────────────────────────────────────
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const s = row * 59 + col * 23; // 타일별 고유 시드

      // 명도 편차 ± 20 → 거친 느낌
      const tone = Math.floor(rand(s) * 40) - 20;
      const base = 62 + tone; // 42 ~ 82

      // 미세한 색조 변화 (차가운 ↔ 따뜻한 돌)
      const rOff = Math.floor((rand(s + 1) - 0.5) * 8);
      const bOff = Math.floor((rand(s + 2) - 0.5) * 8);

      const tx = col * TILE + GROUT;
      const ty = row * TILE + GROUT;
      const tw = TILE - GROUT;
      const th = TILE - GROUT;

      // ① 타일 본체
      ctx.fillStyle = `rgb(${base + rOff},${base},${base + bOff})`;
      ctx.fillRect(tx, ty, tw, th);

      // ② 표면 얼룩 (돌 특유의 불규칙 패치)
      const patchCount = 1 + Math.floor(rand(s + 4) * 3); // 1~3개
      for (let p = 0; p < patchCount; p++) {
        const px = tx + Math.floor(rand(s + 5 + p * 7) * tw);
        const py = ty + Math.floor(rand(s + 6 + p * 7) * th);
        const pr = 3 + Math.floor(rand(s + 7 + p * 7) * 8);
        const dark = rand(s + 8 + p * 7) > 0.5;
        ctx.fillStyle = dark
          ? `rgba(0,0,0,${0.08 + rand(s + 9 + p * 7) * 0.12})`
          : `rgba(255,255,255,${0.03 + rand(s + 9 + p * 7) * 0.05})`;
        ctx.beginPath();
        ctx.ellipse(px, py, pr, pr * 0.6, rand(s + 10 + p * 7) * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // ③ 균열 — 약 55% 확률, 복수 선
      if (rand(s + 20) > 0.45) {
        const crackCount = rand(s + 21) > 0.6 ? 2 : 1;
        for (let c = 0; c < crackCount; c++) {
          const cx0 = tx + Math.floor(rand(s + 22 + c * 9) * tw);
          const cy0 = ty + Math.floor(rand(s + 23 + c * 9) * th);
          // 꺾인 균열 (2 선분)
          const mx  = cx0 + Math.floor((rand(s + 24 + c * 9) - 0.5) * 14);
          const my  = cy0 + Math.floor((rand(s + 25 + c * 9) - 0.5) * 14);
          const cx1 = mx  + Math.floor((rand(s + 26 + c * 9) - 0.5) * 10);
          const cy1 = my  + Math.floor((rand(s + 27 + c * 9) - 0.5) * 10);

          ctx.strokeStyle = `rgba(0,0,0,${0.20 + rand(s + 28 + c * 9) * 0.20})`;
          ctx.lineWidth = 0.5 + rand(s + 29 + c * 9) * 0.7;
          ctx.beginPath();
          ctx.moveTo(cx0, cy0);
          ctx.lineTo(mx, my);
          ctx.lineTo(cx1, cy1);
          ctx.stroke();
        }
      }

      // ④ 테두리 — 상/좌 하이라이트, 하/우 그림자
      ctx.fillStyle = `rgba(255,255,255,0.07)`;
      ctx.fillRect(tx, ty, tw, 1);
      ctx.fillRect(tx, ty, 1, th);

      ctx.fillStyle = `rgba(0,0,0,0.30)`;
      ctx.fillRect(tx, ty + th - 1, tw, 1);
      ctx.fillRect(tx + tw - 1, ty, 1, th);

      // ⑤ 모서리 마모 (작은 어두운 점)
      if (rand(s + 40) > 0.55) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        const corner = Math.floor(rand(s + 41) * 4);
        const ex = corner < 2 ? tx : tx + tw - 2;
        const ey = corner % 2 === 0 ? ty : ty + th - 2;
        ctx.fillRect(ex, ey, 2, 2);
      }
    }
  }

}
