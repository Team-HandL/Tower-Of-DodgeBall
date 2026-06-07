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

  // 1F 너드 — 펼쳐진 책 (open book)
  // 모든 장애물을 1×2 / 2×1 덩어리(도미노)로, 서로 2행·2열 이상 띄워 배치. 넓게 펼침(col 3~21, row 3~13).
  // 중앙 책등(spine) + 좌/우 페이지(윗변/아랫변 곡선 + 글줄). 공 스폰(12,8)·좌우 스폰 십자는 비움. (총 32: hard 12 / soft 20)
  1: [
    // 책등 (hard, 세로 도미노) — 위/아래 바인딩, 가운데(공 스폰 12,8)는 열린 골
    [{c:11,r:6, type:'hard'},{c:12,r:6, type:'hard'},{c:13,r:6, type:'hard'}],
    [{c:11,r:10,type:'hard'},{c:12,r:10,type:'hard'},{c:13,r:10,type:'hard'}],
    // 페이지 바깥 가장자리 (hard, 세로 도미노)
    [{c:3, r:5, type:'hard'},{c:3, r:6, type:'hard'}],
    [{c:3, r:10,type:'hard'},{c:3, r:11,type:'hard'}],
    [{c:21,r:5, type:'hard'},{c:21,r:6, type:'hard'}],
    [{c:21,r:10,type:'hard'},{c:21,r:11,type:'hard'}],
    // 페이지 윗변 (soft, 가로 도미노) — 바깥은 높고 책등 쪽으로 내려가는 곡선
    [{c:5, r:4, type:'soft'},{c:6, r:4, type:'soft'}],
    [{c:9, r:5, type:'soft'},{c:10,r:5, type:'soft'}],
    [{c:18,r:4, type:'soft'},{c:19,r:4, type:'soft'}],
    [{c:14,r:5, type:'soft'},{c:15,r:5, type:'soft'}],
    // 페이지 아랫변 (soft, 가로 도미노) — 윗변 미러
    [{c:5, r:12,type:'soft'},{c:6, r:12,type:'soft'}],
    [{c:9, r:11,type:'soft'},{c:10,r:11,type:'soft'}],
    [{c:18,r:12,type:'soft'},{c:19,r:12,type:'soft'}],
    [{c:14,r:11,type:'soft'},{c:15,r:11,type:'soft'}],
    // 페이지 글줄 (soft, 가로 도미노) — 좌/우 페이지 중앙 라인 (r8)
    [{c:6, r:8, type:'soft'},{c:7, r:8, type:'soft'}],
    [{c:17,r:8, type:'soft'},{c:18,r:8, type:'soft'}],
  ],

  // 2F CEO — 사무실 (4 코너 책상 + 중앙 회의 테이블)
  // 각 코너 책상 = hard 세로 3칸 + 가운데 오른쪽에 soft 서랍 1칸.
  // 중앙 우측 = 3×2 hard 회의 테이블. (총 22: hard 18 / soft 4)
  // 스폰 비움: 플레이어(1,8) · CEO(23,8) · 공(12,8).
  2: [
    // 좌상 책상
    [{c:4,  r:2,  type:'soft'},{c:4,  r:3,  type:'soft'},{c:4,  r:4,  type:'soft'},{c:5,  r:3,  type:'hard'}],
    // 좌하 책상
    [{c:4,  r:12, type:'soft'},{c:4,  r:13, type:'soft'},{c:4,  r:14, type:'soft'},{c:5,  r:13, type:'hard'}],
    // 중상 책상
    [{c:9,  r:2,  type:'soft'},{c:9,  r:3,  type:'soft'},{c:9,  r:4,  type:'soft'},{c:10, r:3,  type:'hard'}],
    // 중하 책상
    [{c:9,  r:12, type:'soft'},{c:9,  r:13, type:'soft'},{c:9,  r:14, type:'soft'},{c:10, r:13, type:'hard'}],
    // 우상 책상
    [{c:14, r:2,  type:'soft'},{c:14, r:3,  type:'soft'},{c:14, r:4,  type:'soft'},{c:15, r:3,  type:'hard'}],
    // 우하 책상
    [{c:14, r:12, type:'soft'},{c:14, r:13, type:'soft'},{c:14, r:14, type:'soft'},{c:15, r:13, type:'hard'}],
    // 중앙 우측 대표 책상
    [{c:19, r:7,  type:'soft'},{c:20, r:7,  type:'soft'},{c:19, r:8,  type:'soft'},{c:20, r:8,  type:'soft'},{c:19, r:9,  type:'soft'},{c:20, r:9,  type:'soft'}],
  ],

  // 3F 트레이너 — 바벨 바 + 다양한 무게의 플레이트
  // 원판을 점선(흩뿌린) 세로열로, 크기·높이를 다르게 양옆에 벌려 배치(작은·중간·큰).
  // 중앙 그립(hard)=바. 큰 원판=hard, 중/작은 원판=soft. (총 54: hard 26 / soft 28)
  3: [
    // 중앙 바 그립 (hard) — 가운데(12,8)는 공 스폰 자리라 비움
    [{c:9, r:8, type:'hard'},{c:10,r:8, type:'hard'},{c:11,r:8, type:'hard'},{c:13,r:8, type:'hard'},{c:14,r:8, type:'hard'},{c:15,r:8, type:'hard'}],
    // 왼쪽 원판 — 큰(col8) / 중(col5) / 작은(col2), 플레이트 간격 2칸·위상 어긋나게. 각 원판은 세로 2칸 블록(r, r+1)
    [{c:8, r:2, type:'hard'},{c:8, r:3, type:'hard'},{c:8, r:5, type:'hard'},{c:8, r:6, type:'hard'},{c:8, r:8, type:'hard'},{c:8, r:10, type:'hard'},{c:8, r:11,type:'hard'},{c:8, r:13,type:'hard'},{c:8, r:14,type:'hard'}],
    [{c:5, r:3, type:'soft'},{c:5, r:4, type:'soft'},{c:5, r:6, type:'soft'},{c:5, r:7, type:'soft'},{c:5, r:9,type:'soft'},{c:5, r:10,type:'soft'},{c:5, r:12,type:'soft'},{c:5, r:13,type:'soft'}],
    [{c:2, r:5, type:'soft'},{c:2, r:6, type:'soft'},{c:2, r:8, type:'soft'},{c:2, r:9,type:'soft'},{c:2, r:11,type:'soft'},{c:2, r:12,type:'soft'}], // r8은 플레이어 스폰(1,8) 보호로 비움
    // 오른쪽 원판 (미러)
    [{c:16,r:2, type:'hard'},{c:16,r:3, type:'hard'},{c:16,r:5, type:'hard'},{c:16,r:6, type:'hard'},{c:16,r:8, type:'hard'},{c:16,r:10, type:'hard'},{c:16,r:11,type:'hard'},{c:16,r:13,type:'hard'},{c:16,r:14,type:'hard'}],
    [{c:19,r:3, type:'soft'},{c:19,r:4, type:'soft'},{c:19,r:6, type:'soft'},{c:19,r:7, type:'soft'},{c:19,r:9, type:'soft'},{c:19,r:10,type:'soft'},{c:19,r:12,type:'soft'},{c:19,r:13,type:'soft'}],
    [{c:22,r:5, type:'soft'},{c:22,r:6, type:'soft'},{c:22,r:8, type:'soft'},{c:22,r:9,type:'soft'},{c:22,r:11,type:'soft'},{c:22,r:12,type:'soft'}], // r8은 NPC 스폰(23,8) 보호로 비움
  ],

  // 4F 축구선수 — 축구장 (양옆 골대 + 큰 센터 서클 + 하프라인 + 코너)
  // 스폰: 플레이어(2,8)/NPC(22,8) = 골대 입구(골키퍼 시작).
  // 센터 서클은 양옆(r8)이 열린 출입구라 가운데 공을 막지 않음. (총 42: hard 12 / soft 30)
  4: [
    // 좌 골대 ㄷ (back=col0, 오른쪽 개방) — 플레이어 스폰(2,8)이 골 입구
    [{c:1, r:6, type:'hard'},{c:1, r:7, type:'soft'},{c:1, r:9, type:'soft'},{c:1, r:10,type:'hard'}], // 골 뒷면 (가운데 r8=골문 비움, 스폰 보호)
    [{c:2, r:6, type:'soft'},{c:3, r:6, type:'hard'}],   // 상단 포스트
    [{c:2, r:10,type:'soft'},{c:3, r:10,type:'hard'}],   // 하단 포스트
    // 우 골대 ㄷ (back=col24, 왼쪽 개방) — NPC 스폰(22,8)이 골 입구
    [{c:23,r:6, type:'hard'},{c:23,r:7, type:'soft'},{c:23,r:9, type:'soft'},{c:23,r:10,type:'hard'}], // 골 뒷면 (가운데 r8=골문 비움, 스폰 보호)
    [{c:22,r:6, type:'soft'},{c:21,r:6, type:'hard'}],   // 상단 포스트
    [{c:22,r:10,type:'soft'},{c:21,r:10,type:'hard'}],   // 하단 포스트
    // 센터 서클 (soft) — 더 크게 + 양옆 r8에 출입구(빈칸)를 둬 가운데 공이 막히지 않음
    [{c:12,r:5, type:'soft'},{c:10,r:6, type:'soft'},{c:14,r:6, type:'soft'},{c:9, r:7, type:'soft'},{c:15,r:7, type:'soft'},{c:9, r:9, type:'soft'},{c:15,r:9, type:'soft'},{c:10,r:10,type:'soft'},{c:14,r:10,type:'soft'},{c:12,r:11,type:'soft'}],
    // 하프라인 (soft) — 서클 위/아래로 이어지는 중앙선 (서클과 겹치지 않게)
    [{c:12,r:2, type:'hard'},{c:12,r:3, type:'soft'},{c:12,r:4, type:'hard'}],
    [{c:12,r:12,type:'hard'},{c:12,r:13,type:'soft'},{c:12,r:14,type:'hard'}],
    // 코너 아크 (soft)
    [{c:0, r:1, type:'soft'}, {c:1, r:0, type:'soft'}, {c:1, r:1, type:'soft'}],
    [{c:24,r:1, type:'soft'}, {c:23,r:0, type:'soft'}, {c:23,r:1, type:'soft'}],
    [{c:0, r:14,type:'soft'}, {c:1, r:15,type:'soft'}, {c:1, r:14,type:'soft'}],
    [{c:24,r:14,type:'soft'}, {c:23,r:15,type:'soft'}, {c:23,r:14,type:'soft'}],
  ],

  // 5F 피구로이드 — 안드로이드 얼굴 (큰 점선 네모 + 화난 눈 + 입 + 안테나)
  // 얼굴을 크게 펼치고 테두리를 점선으로 띄움. 점선 사이로 진입 가능 + 가장 많은 장애물 = 최고 난이도.
  // (총 47: hard 28 / soft 19)
  5: [
    // 얼굴 윗변 (row2, 점선)
    [{c:4, r:2, type:'hard'},{c:6, r:2, type:'soft'},{c:8, r:2, type:'hard'},{c:10,r:2, type:'soft'},{c:12,r:2, type:'hard'},{c:14,r:2, type:'soft'},{c:16,r:2, type:'hard'},{c:18,r:2, type:'soft'},{c:20,r:2, type:'hard'}],
    // 얼굴 아랫변 (row14, 점선)
    [{c:4, r:14,type:'hard'},{c:6, r:14,type:'soft'},{c:8, r:14,type:'hard'},{c:10,r:14,type:'soft'},{c:12,r:14,type:'hard'},{c:14,r:14,type:'soft'},{c:16,r:14,type:'hard'},{c:18,r:14,type:'soft'},{c:20,r:14,type:'hard'}],
    // 얼굴 좌변 (col3, 점선)
    [{c:3, r:5, type:'hard'},{c:3, r:7, type:'soft'},{c:3, r:9, type:'hard'},{c:3, r:11,type:'soft'}],
    // 얼굴 우변 (col21, 점선)
    [{c:21,r:5, type:'hard'},{c:21,r:7, type:'soft'},{c:21,r:9, type:'hard'},{c:21,r:11,type:'soft'}],
    // 안테나 (hard) — 머리 위 (row1, 윗변 테두리 위로)
    [{c:8, r:1, type:'hard'}],[{c:16,r:1, type:'hard'}],
    // 화난 눈 (hard)
    [{c:7, r:5, type:'soft'},{c:8, r:5, type:'hard'},{c:9, r:6, type:'hard'}, {c:7, r:6, type:'hard'}, {c:8, r:6, type:'hard'},{c:8, r:7, type:'hard'}, {c:9, r:7, type:'hard'}],
    [{c:17,r:5, type:'soft'},{c:16,r:5, type:'hard'},{c:15,r:6, type:'hard'}, {c:17,r:6, type:'hard'}, {c:16,r:6, type:'hard'},{c:16,r:7, type:'hard'}, {c:15,r:7, type:'hard'}],
    // 입 (soft)
    [{c:10,r:11,type:'soft'}, {c:11,r:11,type:'soft'},{c:12,r:11,type:'soft'},{c:13,r:11,type:'soft'},{c:14,r:11,type:'soft'}],
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
