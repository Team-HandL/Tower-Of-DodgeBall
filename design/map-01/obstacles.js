export const TILE = 48; // 타일 한 칸 크기 (background.js 와 동일)

// ─── 장애물 배치 ────────────────────────────────────────────────
// 각 그룹 = 이어 붙인 블록들의 타일 좌표 [{c(컬럼), r(로우)}, ...]
// 타일 1개 = 48 × 48 px
//
// 그리드 참고 (1200 × 800 기준)
//   컬럼: 0 ~ 24  (24 * 48 = 1152)
//   로우:  0 ~ 15  (15 * 48 = 720)
//   코트 중앙: 컬럼 12.5 (x = 600)
//   상하 중앙: 로우  8.3  (y = 400)

// ─── 대칭 배치 기준 ─────────────────────────────────────────────
//   좌우 대칭축: x = 600  (컬럼 12.5)
//     col 5  ↔  col 19   (x=240, x=912 — 중앙에서 ±360px)
//     col 11~13 = 중앙 벽 (x=528~672, 중심 x=600)
//   상하 대칭축: y = 400  (로우 8.3)
//     row 3-4  (y=144~240) ↔  row 12-13 (y=576~672)
//     row 5    (y=240)     ↔  row 9     (y=432)

export const OBSTACLE_GROUPS = [
  // 좌측 상단 기둥 — hard (부술 수 없음)
  [{c:5, r:3, type:'hard'}, {c:5, r:4, type:'hard'}],

  // 우측 상단 기둥 — hard
  [{c:19, r:3, type:'hard'}, {c:19, r:4, type:'hard'}],

  // 중앙 상단 벽 — soft (2회 피격 시 파괴)
  [{c:11, r:5, type:'soft'}, {c:12, r:5, type:'soft'}, {c:13, r:5, type:'soft'}],

  // 좌측 하단 기둥 — hard
  [{c:5, r:12, type:'hard'}, {c:5, r:13, type:'hard'}],

  // 우측 하단 기둥 — hard
  [{c:19, r:12, type:'hard'}, {c:19, r:13, type:'hard'}],

  // 중앙 하단 벽 — soft
  [{c:11, r:9, type:'soft'}, {c:12, r:9, type:'soft'}, {c:13, r:9, type:'soft'}],

  // 좌측 중앙 세로 벽 — soft
  [{c:3, r:7, type:'soft'}, {c:3, r:8, type:'soft'}, {c:3, r:9, type:'soft'}],

  // 우측 중앙 세로 벽 — soft (좌측 대칭)
  [{c:22, r:7, type:'soft'}, {c:22, r:8, type:'soft'}, {c:22, r:9, type:'soft'}],
];

// c, r 보존 — state.obstacles 렌더링 매핑에 사용
export const OBSTACLES = OBSTACLE_GROUPS
  .flat()
  .map(({ c, r, type = 'hard' }) => ({ x: c * TILE, y: r * TILE, w: TILE, h: TILE, type, c, r }));

// ─── 탑뷰 돌 블록 렌더러 ─────────────────────────────────────────

const GAP = 2; // 블록 사이 틈 (줄눈처럼 보이게)

function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// 탑뷰 돌 블록 1칸을 그린다 (hp: Infinity=hard, 2=정상, 1=금감, 0=파괴)
export function drawBlock(ctx, col, row, hp = Infinity) {
  if (hp <= 0) return;
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
    ctx.lineWidth = 0.6 + rand(s + 48) * 0.6;
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

  // ⑦ 금간 상태 오버레이 (hp === 1)
  if (hp === 1) {
    ctx.fillStyle = 'rgba(60,10,0,0.30)';
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(tx + tw * 0.25, ty + 2);
    ctx.lineTo(tx + tw * 0.45, ty + th * 0.55);
    ctx.lineTo(tx + tw * 0.70, ty + th * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx + tw * 0.55, ty + th * 0.15);
    ctx.lineTo(tx + tw * 0.30, ty + th * 0.50);
    ctx.lineTo(tx + tw * 0.60, ty + th - 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(tx + tw * 0.26, ty + 3);
    ctx.lineTo(tx + tw * 0.46, ty + th * 0.56);
    ctx.stroke();
  }
}
