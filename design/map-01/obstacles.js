export const TILE = 48; // 타일 한 칸 크기 (background.js 와 동일)

// ─── 층별 장애물 배치 ─────────────────────────────────────────────
// 각 그룹 = 이어 붙인 블록들의 타일 좌표 [{c(컬럼), r(로우)}, ...]
// 타일 1개 = 48 × 48 px
//
// 그리드 (1200 × 800 기준)
//   컬럼: 0 ~ 24  (25 * 48 = 1200px)
//   로우:  0 ~ 15  (16 * 48 = 768px, 하단 32px 여백)
//   중앙:  컬럼 12.5 (x=600), 로우 8.3 (y=400)

export const FLOOR_OBSTACLE_GROUPS = {

  // 1F 너드 — 컴퓨터실 / 회로 기판
  1: [
    // Hard: 서버 랙
    [{c:6,  r:4,  type:'hard'},{c:6,  r:5,  type:'hard'}],
    [{c:19, r:4,  type:'hard'},{c:19, r:5,  type:'hard'}],
    [{c:6,  r:12, type:'hard'},{c:6,  r:13, type:'hard'}],
    [{c:19, r:12, type:'hard'},{c:19, r:13, type:'hard'}],
    // Soft: 책상 / 박스
    [{c:10, r:5,  type:'soft'},{c:11, r:5,  type:'soft'}],
    [{c:14, r:5,  type:'soft'},{c:15, r:5,  type:'soft'}],
    [{c:10, r:12, type:'soft'},{c:11, r:12, type:'soft'}],
    [{c:14, r:12, type:'soft'},{c:15, r:12, type:'soft'}],
    [{c:8,  r:8,  type:'soft'},{c:8,  r:9,  type:'soft'}],
    [{c:17, r:8,  type:'soft'},{c:17, r:9,  type:'soft'}],
  ],

  // 2F CEO — 사무실 / 회의실
  2: [
    // Hard: 기둥
    [{c:7,  r:4,  type:'hard'}],
    [{c:7,  r:13, type:'hard'}],
    [{c:18, r:4,  type:'hard'}],
    [{c:18, r:13, type:'hard'}],
    [{c:11, r:6,  type:'hard'}],
    [{c:14, r:6,  type:'hard'}],
    [{c:11, r:11, type:'hard'}],
    [{c:14, r:11, type:'hard'}],
    // Soft: 파티션
    [{c:5,  r:7,  type:'soft'},{c:6,  r:7,  type:'soft'},{c:7,  r:7,  type:'soft'},{c:8,  r:7,  type:'soft'}],
    [{c:5,  r:10, type:'soft'},{c:6,  r:10, type:'soft'},{c:7,  r:10, type:'soft'},{c:8,  r:10, type:'soft'}],
    [{c:17, r:7,  type:'soft'},{c:18, r:7,  type:'soft'},{c:19, r:7,  type:'soft'},{c:20, r:7,  type:'soft'}],
    [{c:17, r:10, type:'soft'},{c:18, r:10, type:'soft'},{c:19, r:10, type:'soft'},{c:20, r:10, type:'soft'}],
    [{c:10, r:3,  type:'soft'},{c:10, r:4,  type:'soft'},{c:10, r:5,  type:'soft'}],
    [{c:15, r:3,  type:'soft'},{c:15, r:4,  type:'soft'},{c:15, r:5,  type:'soft'}],
    [{c:10, r:12, type:'soft'},{c:10, r:13, type:'soft'},{c:10, r:14, type:'soft'}],
    [{c:15, r:12, type:'soft'},{c:15, r:13, type:'soft'},{c:15, r:14, type:'soft'}],
  ],

  // 3F 트레이너 — 헬스장 / 서킷 트레이닝
  3: [
    // Hard: 운동기구 / 웨이트 기둥
    [{c:6,  r:4,  type:'hard'},{c:7,  r:4,  type:'hard'}],
    [{c:18, r:4,  type:'hard'},{c:19, r:4,  type:'hard'}],
    [{c:6,  r:13, type:'hard'},{c:7,  r:13, type:'hard'}],
    [{c:18, r:13, type:'hard'},{c:19, r:13, type:'hard'}],
    [{c:10, r:7,  type:'hard'}],
    [{c:15, r:7,  type:'hard'}],
    [{c:10, r:10, type:'hard'}],
    [{c:15, r:10, type:'hard'}],
    // Soft: 매트 / 이동식 장비
    [{c:4,  r:7,  type:'soft'},{c:4,  r:8,  type:'soft'},{c:4,  r:9,  type:'soft'},{c:4,  r:10, type:'soft'}],
    [{c:21, r:7,  type:'soft'},{c:21, r:8,  type:'soft'},{c:21, r:9,  type:'soft'},{c:21, r:10, type:'soft'}],
    [{c:9,  r:4,  type:'soft'},{c:10, r:4,  type:'soft'},{c:11, r:4,  type:'soft'}],
    [{c:14, r:4,  type:'soft'},{c:15, r:4,  type:'soft'},{c:16, r:4,  type:'soft'}],
    [{c:9,  r:13, type:'soft'},{c:10, r:13, type:'soft'},{c:11, r:13, type:'soft'}],
    [{c:14, r:13, type:'soft'},{c:15, r:13, type:'soft'},{c:16, r:13, type:'soft'}],
  ],

  // 4F 축구선수 — 축구장 / 포메이션
  4: [
    // Hard: 좌 골대 ㄷ (cols 2-3, rows 6-9, 오른쪽 개방)
    [{c:1, r:6, type:'hard'},{c:2, r:6, type:'hard'}],   // 상단 가로
    [{c:1, r:7, type:'hard'}],                            // 좌 세로
    [{c:1, r:8, type:'hard'}],                            // 좌 세로
    [{c:1, r:9, type:'hard'}],    
    [{c:1, r:10, type:'hard'},{c:2, r:10, type:'hard'}],   // 하단 가로
    // Hard: 우 골대 ㄷ 미러 (cols 21-22, rows 6-9, 왼쪽 개방)
    [{c:22, r:6, type:'hard'},{c:23, r:6, type:'hard'}], // 상단 가로
    [{c:23, r:7, type:'hard'}],                           // 우 세로
    [{c:23, r:8, type:'hard'}],                           // 우 세로
    [{c:23, r:9, type:'hard'}],
    [{c:22, r:10, type:'hard'},{c:23, r:10, type:'hard'}], // 하단 가로
  ],

  // 5F 피구로이드 — 기계실 / 프로세서 코어
  5: [
    // Hard: 십자형 코어
    [{c:10, r:6,  type:'hard'},{c:10, r:7,  type:'hard'}],
    [{c:15, r:6,  type:'hard'},{c:15, r:7,  type:'hard'}],
    [{c:10, r:10, type:'hard'},{c:10, r:11, type:'hard'}],
    [{c:15, r:10, type:'hard'},{c:15, r:11, type:'hard'}],
    [{c:8,  r:4,  type:'hard'}],
    [{c:17, r:4,  type:'hard'}],
    [{c:8,  r:13, type:'hard'}],
    [{c:17, r:13, type:'hard'}],
    [{c:6,  r:8,  type:'hard'},{c:6,  r:9,  type:'hard'}],
    [{c:19, r:8,  type:'hard'},{c:19, r:9,  type:'hard'}],
    // Soft: 진입 게이트
    [{c:11, r:5,  type:'soft'},{c:12, r:5,  type:'soft'},{c:13, r:5,  type:'soft'},{c:14, r:5,  type:'soft'}],
    [{c:11, r:7,  type:'soft'},{c:12, r:7,  type:'soft'}],
    [{c:13, r:10, type:'soft'},{c:14, r:10, type:'soft'}],
    [{c:11, r:12, type:'soft'},{c:12, r:12, type:'soft'},{c:13, r:12, type:'soft'},{c:14, r:12, type:'soft'}],
    [{c:8,  r:8,  type:'soft'},{c:9,  r:8,  type:'soft'}],
    [{c:16, r:9,  type:'soft'},{c:17, r:9,  type:'soft'}],
    [{c:4,  r:5,  type:'soft'},{c:4,  r:6,  type:'soft'},{c:4,  r:7,  type:'soft'}],
    [{c:21, r:10, type:'soft'},{c:21, r:11, type:'soft'},{c:21, r:12, type:'soft'}],
  ],
};

// 하위 호환용 — 1F 기본값
export const OBSTACLE_GROUPS = FLOOR_OBSTACLE_GROUPS[1];

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
  const isHard = hp === Infinity;

  // 명도 변화
  const tone = Math.floor(rand(s) * 22) - 11;

  // ① 본체
  // hard: 차가운 회색 돌 / soft: 따뜻한 갈색 벽돌 계열
  if (isHard) {
    const base = 148 + tone;
    ctx.fillStyle = `rgb(${base},${base - 2},${base - 4})`;
  } else {
    const br = 155 + tone, bg = 118 + tone, bb = 85 + tone;
    ctx.fillStyle = `rgb(${br},${bg},${bb})`;
  }
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, isHard ? 3 : 2);
  ctx.fill();

  // ② 표면 얼룩
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

  // soft 블록 — 벽돌 줄눈 라인 (가로 중앙선)
  if (!isHard) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, ty + th / 2);
    ctx.lineTo(tx + tw, ty + th / 2);
    ctx.stroke();
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

  // ⑦ 금간 상태 오버레이 (hp === 1) — 중앙 거미줄형 균열
  if (hp === 1) {
    ctx.fillStyle = 'rgba(40,8,0,0.28)';
    ctx.fillRect(tx, ty, tw, th);

    // 균열 중심점 (타일 중앙에서 시드 기반 미세 이동)
    const cx = tx + tw * (0.42 + rand(s + 60) * 0.16);
    const cy = ty + th * (0.42 + rand(s + 61) * 0.16);

    // 메인 균열 5갈래
    const branches = [
      { ax: rand(s+62)*0.3,      ay: rand(s+63)*0.25,      bx: -rand(s+64)*0.15,  by: rand(s+65)*0.1   }, // 좌상
      { ax: 0.6+rand(s+66)*0.35, ay: rand(s+67)*0.2,       bx: rand(s+68)*0.1,    by: -rand(s+69)*0.15 }, // 우상
      { ax: rand(s+70)*0.2,      ay: 0.65+rand(s+71)*0.3,  bx: -rand(s+72)*0.12,  by: rand(s+73)*0.1   }, // 좌하
      { ax: 0.7+rand(s+74)*0.28, ay: 0.6+rand(s+75)*0.35,  bx: rand(s+76)*0.08,   by: rand(s+77)*0.12  }, // 우하
      { ax: 0.4+rand(s+78)*0.2,  ay: rand(s+79)*0.18,      bx: rand(s+80)*0.1,    by: -rand(s+81)*0.08 }, // 상중
    ];

    branches.forEach((b, i) => {
      const ex = tx + tw * b.ax, ey = ty + th * b.ay;
      // 중간 꺾임점
      const mx = (cx + ex) / 2 + tw * b.bx;
      const my = (cy + ey) / 2 + th * b.by;

      ctx.strokeStyle = 'rgba(0,0,0,0.80)';
      ctx.lineWidth = 1.4 - i * 0.08;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // 하이라이트 (균열 옆 밝은 선)
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(cx + 0.8, cy + 0.8);
      ctx.lineTo(mx + 0.8, my + 0.8);
      ctx.lineTo(ex + 0.8, ey + 0.8);
      ctx.stroke();
    });

    // 중심점 강조
    ctx.fillStyle = 'rgba(0,0,0,0.70)';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
