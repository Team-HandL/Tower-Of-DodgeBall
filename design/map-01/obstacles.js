export const TILE = 38; // 타일 한 칸 크기 (background.js 와 동일)

// ─── 장애물 배치 ────────────────────────────────────────────────
// 각 그룹 = 이어 붙인 블록들의 타일 좌표 [{c(컬럼), r(로우)}, ...]
// 타일 1개 = 38 × 38 px
//
// 그리드 참고 (660 × 420 기준)
//   컬럼: 0 ~ 17  (17 * 38 = 646)
//   로우:  0 ~ 11  (11 * 38 = 418)
//   코트 중앙: 컬럼 ≈ 8.7 (x = 330)
//   플레이어 시작: 컬럼 2, 로우 5 (x=80, y=210)
//   NPC 시작:     컬럼 15, 로우 5 (x=580, y=210)

export const OBSTACLE_GROUPS = [
  // 좌측 상단 기둥
  [{c:4, r:2}, {c:4, r:3}],

  // 우측 상단 기둥
  [{c:12, r:2}, {c:12, r:3}],

  // 중앙 상단 벽
  [{c:7, r:4}, {c:8, r:4}, {c:9, r:4}],

  // 좌측 하단 기둥
  [{c:4, r:6}, {c:4, r:7}],

  // 우측 하단 기둥
  [{c:12, r:6}, {c:12, r:7}],

  // 중앙 하단 벽
  [{c:7, r:9}, {c:8, r:9}, {c:9, r:9}],
];

// physics.js 호환용 — 타일 좌표 → {x, y, w, h} rect 자동 변환
export const OBSTACLES = OBSTACLE_GROUPS
  .flat()
  .map(({ c, r }) => ({ x: c * TILE, y: r * TILE, w: TILE, h: TILE }));

// ─── 탑뷰 돌 블록 렌더러 ─────────────────────────────────────────

const GAP = 2; // 블록 사이 틈 (줄눈처럼 보이게)

function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 탑뷰 돌 블록 1칸을 그린다 (col, row = 타일 그리드 좌표)
export function drawBlock(ctx, col, row) {
  const tx = col * TILE + GAP;
  const ty = row * TILE + GAP;
  const tw = TILE - GAP * 2;
  const th = TILE - GAP * 2;

  const s = col * 41 + row * 97; // 블록별 고유 시드

  // 명도 변화 — 바닥 타일보다 밝게 (raised 느낌)
  const tone = Math.floor(rand(s) * 22) - 11;
  const base = 148 + tone; // 137 ~ 159

  // ① 본체 (밝은 회색 돌)
  ctx.fillStyle = `rgb(${base},${base - 2},${base - 4})`;
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, 3);
  ctx.fill();

  // ② 표면 얼룩 (불규칙 패치)
  for (let p = 0; p < 2; p++) {
    const px = tx + 4 + Math.floor(rand(s + 1 + p * 11) * (tw - 8));
    const py = ty + 4 + Math.floor(rand(s + 2 + p * 11) * (th - 8));
    const pr = 3 + Math.floor(rand(s + 3 + p * 11) * 5);
    ctx.fillStyle = rand(s + 4 + p * 11) > 0.5
      ? `rgba(0,0,0,${0.07 + rand(s + 5 + p * 11) * 0.10})`
      : `rgba(255,255,255,${0.04 + rand(s + 5 + p * 11) * 0.06})`;
    ctx.beginPath();
    ctx.ellipse(px, py, pr, pr * 0.65, rand(s + 6 + p * 11) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // ③ 균열 — 약 60% 확률 (꺾인 2선분)
  if (rand(s + 30) > 0.40) {
    const cx0 = tx + 5 + Math.floor(rand(s + 31) * (tw - 10));
    const cy0 = ty + 5 + Math.floor(rand(s + 32) * (th - 10));
    const mx  = cx0 + Math.floor((rand(s + 33) - 0.5) * 12);
    const my  = cy0 + Math.floor((rand(s + 34) - 0.5) * 12);
    const cx1 = mx  + Math.floor((rand(s + 35) - 0.5) * 8);
    const cy1 = my  + Math.floor((rand(s + 36) - 0.5) * 8);

    ctx.strokeStyle = `rgba(0,0,0,${0.22 + rand(s + 37) * 0.18})`;
    ctx.lineWidth = 0.6 + rand(s + 38) * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(mx, my);
    ctx.lineTo(cx1, cy1);
    ctx.stroke();
  }

  // ④ 베벨 하이라이트 — 상·좌 (빛이 위에서 좌상단으로)
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.fillRect(tx + 2, ty + 2, tw - 4, 3);   // 상단 밝은 띠
  ctx.fillRect(tx + 2, ty + 2, 3, th - 4);   // 좌측 밝은 띠

  // ⑤ 베벨 그림자 — 하·우 (올라온 블록의 그림자)
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(tx + 2, ty + th - 5, tw - 4, 3); // 하단 어두운 띠
  ctx.fillRect(tx + tw - 5, ty + 2, 3, th - 4); // 우측 어두운 띠

  // ⑥ 외곽선
  ctx.strokeStyle = 'rgba(0,0,0,0.60)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, 3);
  ctx.stroke();
}
