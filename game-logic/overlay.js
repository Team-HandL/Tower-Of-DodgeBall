import { state, setNextNPCSprite, setNextNPCAI } from './state.js';
import { BASE, setNextNPCStats, applyBuffsToStatus } from './status.js';

// ─── HP UI (게임 루프가 매 프레임 호출) ────────────────────────────

function hpColor(hp, maxHp) {
  const r = hp / maxHp;
  return `rgb(${Math.round(220 - 160 * r)},${Math.round(40 + 160 * r)},40)`;
}

export function updateHPUI() {
  const { player, npc } = state;
  const pb = document.getElementById('player-hp-bar');
  const nb = document.getElementById('npc-hp-bar');
  pb.style.width      = `${(player.hp / player.maxHp) * 100}%`;
  pb.style.background = hpColor(player.hp, player.maxHp);
  nb.style.width      = `${(npc.hp / npc.maxHp) * 100}%`;
  nb.style.background = hpColor(npc.hp, npc.maxHp);
  document.getElementById('player-hp-text').textContent = Math.round(player.hp);
  document.getElementById('npc-hp-text').textContent    = Math.round(npc.hp);
}

// ─── 오버레이 플로우 (시작/층 진입/승리/패배) ─────────────────────
// 게임 로직(physics/npcAI/ball)에 의존하지 않습니다.
// 현재 층/누적 버프 상태는 이 모듈이 소유합니다.

const IMG = './design/assets/images';

// 업그레이드 카드 정의 — 새 카드 추가 시 여기에만 항목 추가
// key는 status.js의 BUFF_STAT 키와 일치해야 함
const CARDS = [
  { key: 'str',        emoji: '💪', title: '힘 강화',      desc: '데미지',  amount: 0.2 },
  { key: 'moveSpeed',  emoji: '⚡', title: '이동속도 강화', desc: '이동속도', amount: 0.2 },
  { key: 'throwPower', emoji: '💥', title: '투척 강화',    desc: '공 속도', amount: 0.2 },
];

// 층별 컨셉/대사.
// npcSprite: 인게임 스프라이트 시트 prefix. stats.spd는 NPC 이동속도
// (player 기본 spd = 150). nerd는 player와 동일한 150, soccer는 더 빠른 200.
const FLOORS = {
  1: {
    title: '1F — 너드',
    sprite: 'nerd/nerd_portrait',
    npcSprite: 'nerd',
    hasCards: true,
    stats: { hp: 20, str: 100, spd: 130, velocity: 500 },
    ai: { reactionDelay: 0.36, aimError: 62, dodgeSkill: 0.25, aggression: 0.55, pickupGreed: 0.55, wallAwareness: 0.35 },
    introLines: [
      '어... 안녕.',
      '피구는 간단해. 공을 맞히면 데미지!\n상대 체력을 먼저 0으로 만들면 이겨.\n이동은 WASD, 조준은 마우스.\n좌클릭(또는 스페이스)으로 공을 줍고, 던지고, 캐치까지 다 할 수 있어.',
      '탑 어딘가에... 피구에 미친 안드로이드가 있다던데?\n대체 어떤 로직으로 공을 피하고 던지는 건지 너무 궁금해!',
    ],
    timeoutLine: '시간이 다 됐네!\n날 못 쓰러뜨렸구나.\n뭐, 데이터는 충분히 봤으니 난 만족이야.',
    defeatLine: '어라, 너 쓰러졌어?\n실력 없는 나한테 지다니...\n다시 도전해봐, 응원할게!',
    victoryLine: '우와, 역시!\n너의 그 회피 패턴, 잘 기록해뒀어.\n그럼 안녕.',
  },
  2: {
    title: '2F — CEO',
    // ceo 폴더에는 portrait가 없어 정면 스프라이트를 초상으로 사용
    sprite: 'ceo/ceo_front_1',
    npcSprite: 'ceo',
    hasCards: true,
    stats: { hp: 20, str: 100, spd: 150, velocity: 510 },
    ai: { reactionDelay: 0.30, aimError: 52, dodgeSkill: 0.38, aggression: 0.62, pickupGreed: 0.60, wallAwareness: 0.48 },
    introLines: [
      '음? 여긴 어떻게 들어왔지.',
      '내 시간은 비싸. 짧게 끝내주겠어.',
    ],
    timeoutLine: '시간 초과군.\n마감도 못 지키는 자와는 거래하지 않아.',
    defeatLine: '수고했네.\n자네의 패배, 좋은 데이터로 잘 쓰지.',
    victoryLine: '이런, 내가 졌다고?\n좋아 — 자네, 스카우트하지.',
  },
  3: {
    title: '3F — 트레이너',
    // trainer 폴더에는 portrait가 없어 정면 스프라이트를 초상으로 사용
    sprite: 'trainer/trainer_front_1',
    npcSprite: 'trainer',
    hasCards: true,
    stats: { hp: 130, str: 105, spd: 180, velocity: 520 },
    ai: { reactionDelay: 0.24, aimError: 42, dodgeSkill: 0.50, aggression: 0.70, pickupGreed: 0.66, wallAwareness: 0.62 },
    introLines: [
      '어이 거기, 몸은 좀 풀었나?',
      '자, 오늘 운동량 제대로 채워주마. 덤벼!',
    ],
    timeoutLine: '시간 안에 못 끝내?\n지구력이 부족하군. 더 뛰어!',
    defeatLine: '벌써 지쳤어?\n기초 체력부터 다시다.',
    victoryLine: '제법인데!\n합격이야. 다음 층으로 가봐.',
  },
  4: {
    title: '4F — 축구선수',
    sprite: 'soccer/soccer_portrait',
    npcSprite: 'soccer',
    hasCards: true,
    stats: { hp: 20, str: 100, spd: 200, velocity: 500 },
    ai: { reactionDelay: 0.18, aimError: 34, dodgeSkill: 0.6, aggression: 0.78, pickupGreed: 0.72, wallAwareness: 0.75 },
    introLines: [
      '...왜 축구가 아니라 피구를 하는거지?',
      '이상한 안드로이드잖아.\n축구를 하는 안드로이드로 개조해주겠어.',
      '다음 층으로 가는 건 네가 아니라 나다.',
    ],
    timeoutLine: '시간 안에 끝내지도 못하다니. 스피드가 부족하군.',
    defeatLine: '느려 터졌어. 축구부터 배우고 와라.',
    victoryLine: '...스피드 하나는 인정해주지.',
  },
  5: {
    title: '5F — 피구로이드',
    // robot 폴더에는 portrait가 없어 정면 스프라이트를 초상으로 사용
    sprite: 'robot/robot_front_1',
    npcSprite: 'robot',
    isFinal: true,                  // 마지막 층: 승리 시 엔딩 오버레이
    stats: { hp: 150, str: 110, spd: 220, velocity: 560 },
    ai: { reactionDelay: 0.08, aimError: 18, dodgeSkill: 0.88, aggression: 0.92, pickupGreed: 0.82, wallAwareness: 0.95 },
    introLines: [
      '누구야..? 드디어 여기까지 올라왔구나.',
      '나는 피구로이드.\n피구 하나만 보고 만들어진 안드로이드야.\n피하고, 받고, 던지는 건 누구한테도 안 져.',
      '여기가 탑의 꼭대기야.\n가진 거 전부 보여줘 봐.\n날 이긴다면... 네가 진짜 최고인 거야.',
    ],
    timeoutLine: '시간 초과네.\n이번엔 날 못 이겼구나.\n다시 와서 도전해 봐.',
    defeatLine: '아, 졌다...\n아직 정상은 좀 이른가 보네.',
    victoryLine: '졌어...\n시스템... 정지...',
  },
};

const INITIAL_FLOOR = 1;

const flow = {
  floor: INITIAL_FLOOR,
  buffs: Object.fromEntries(CARDS.map(c => [c.key, 0])),
  startGameFn: null,
  playTime: 0,
};

// 게임 로직이 호출하는 외부 인터페이스 ────────────────────────────

export function initOverlayFlow(startGameFn) {
  flow.startGameFn = startGameFn;
  renderStart();
}

export function showOverlay(result /*, _onRestart */) {
  if (result === 'win') renderVictory();
  else renderDefeat(result); // 'timeout' | 'lose'
}

export function hideOverlay() {
  const ov = document.getElementById('overlay');
  ov.style.display = 'none';
  ov.innerHTML = '';
  ov.className = '';
  document.getElementById('ui').style.display = 'flex';
}

// 후속 작업에서 게임 로직이 읽을 수 있도록 노출 (현재는 미사용).
export function getBuffs() { return { ...flow.buffs }; }
export function getCurrentFloor() { return flow.floor; }
export function addPlayTime(dt) { flow.playTime += dt; }

// 내부 렌더링 ─────────────────────────────────────────────────────

function paint(html, variant) {
  const ov = document.getElementById('overlay');
  ov.innerHTML = html;
  ov.className = `ov ov-${variant}`;
  ov.style.display = 'flex';
  document.getElementById('ui').style.display = 'none';
}

// 1) 최초 시작 화면 — tower.png + 진도 대사
function renderStart() {
  paint(`
    <div class="start-top">
      <img src="${IMG}/tower.png" alt="tower"/>
    </div>
    <div class="start-mid" id="ov-start-btn">
      <div class="start-cta">
        <div class="arrow">▲</div>
        <div class="label">탑 오르기 시작</div>
      </div>
    </div>
    <div class="start-bot">
      <img src="${IMG}/jindo/jindo_back_1.png" alt="jindo"/>
    </div>
  `, 'start');
  const go = () => renderFloorIntro();
  document.getElementById('ov-start-btn').onclick = go;
  document.querySelector('.start-top').onclick = go;
}

// 2) 층 진입 화면 — NPC 대화 연출
function renderFloorIntro() {
  const data = FLOORS[flow.floor];
  if (!data) { startRound(); return; }
  let idx = 0;

  const render = () => {
    const last = idx >= data.introLines.length - 1;
    paint(`
      <div class="floor-title">${data.title}</div>
      <div class="npc-stage">
        <img class="npc-portrait" src="${IMG}/${data.sprite}.png" alt=""/>
        <div class="bubble">${esc(data.introLines[idx])}</div>
      </div>
      <button class="ov-btn primary" id="ov-next">${last ? '도전 시작' : '다음 ▸'}</button>
    `, 'intro');
    document.getElementById('ov-next').onclick = () => {
      idx++;
      if (idx >= data.introLines.length) startRound();
      else render();
    };
  };
  render();
}

function startRound() {
  const data = FLOORS[flow.floor];
  if (data?.stats) setNextNPCStats(data.stats);
  if (data?.npcSprite) setNextNPCSprite(data.npcSprite);
  if (data?.ai) setNextNPCAI(data.ai);
  hideOverlay();
  flow.startGameFn();             // → initState() → initStatus() (STATUS 초기화)
  applyBuffsToStatus(flow.buffs); // 초기화 직후 누적 버프 재적용
}

// 3) 패배 화면 — 시간 초과 / HP 패배 분기 + 2개 재시작 옵션
function renderDefeat(reason) {
  const data = FLOORS[flow.floor] ?? {
    title: `${flow.floor}F`, sprite: 'soccer/soccer_front_1',
    timeoutLine: '시간이 다 됐군.', defeatLine: '여기까지인가.',
  };
  const isTimeout = reason === 'timeout';
  const headline  = isTimeout ? '⏱ 시간 초과' : '💀 패배';
  const subline   = isTimeout
    ? '제한 시간 안에 NPC를 쓰러뜨리지 못했습니다.'
    : '체력이 모두 소진되었습니다.';
  const npcLine   = isTimeout ? data.timeoutLine : data.defeatLine;

  paint(`
    <div class="floor-title">${data.title}</div>
    <h2 class="result-headline lose">${headline}</h2>
    <p class="result-sub">${subline}</p>
    <div class="npc-stage">
      <img class="npc-portrait" src="${IMG}/${data.sprite}.png" alt=""/>
      <div class="bubble">${esc(npcLine)}</div>
    </div>
    <div class="btn-row">
      <button class="ov-btn" id="ov-retry-tower">처음부터 다시 탑 오르기</button>
      <button class="ov-btn primary" id="ov-retry-floor">이 층부터 다시 도전</button>
    </div>
  `, 'defeat');

  document.getElementById('ov-retry-tower').onclick = () => {
    flow.floor = INITIAL_FLOOR;
    flow.buffs = Object.fromEntries(CARDS.map(c => [c.key, 0]));
    flow.playTime = 0;
    renderFloorIntro();
  };
  document.getElementById('ov-retry-floor').onclick = () => {
    renderFloorIntro();
  };
}

// 4) 승리 화면 — 카드 선택 (CARDS 데이터 기반)
function renderVictory() {
  const data = FLOORS[flow.floor] ?? { title: `${flow.floor}F`, victoryLine: '클리어!' };

  // 마지막 층 클리어 → 엔딩 오버레이 (최종 스탯 표시, 다음 층 없음)
  if (data.isFinal) { renderFinale(data); return; }

  // hasCards가 false인 층은 카드 없이 바로 다음 층으로
  if (!data.hasCards) {
    paint(`
      <div class="floor-title">${data.title}</div>
      <h2 class="result-headline win">🎉 클리어!</h2>
      <p class="result-sub">${esc(data.victoryLine)}</p>
      <button class="ov-btn primary" id="ov-next-floor">다음 층으로 ▸</button>
    `, 'victory');
    document.getElementById('ov-next-floor').onclick = () => {
      const next = Object.keys(FLOORS).map(Number).filter(f => f > flow.floor).sort((a, b) => a - b)[0];
      flow.floor = next ?? flow.floor;
      renderFloorIntro();
    };
    return;
  }

  const cardHtml = CARDS.map(c => `
    <button class="upgrade-card" data-buff="${c.key}">
      <div class="card-emoji">${c.emoji}</div>
      <div class="card-title">${c.title}</div>
      <div class="card-desc">${c.desc} <b>+${Math.round(c.amount * 100)}%</b></div>
    </button>
  `).join('');

  const accumulated = CARDS.filter(c => flow.buffs[c.key] > 0)
    .map(c => `${c.desc} +${pct(flow.buffs[c.key])}%`).join(' · ');

  paint(`
    <div class="floor-title">${data.title}</div>
    <h2 class="result-headline win">🎉 클리어!</h2>
    <p class="result-sub">${esc(data.victoryLine)}</p>
    <p class="card-hint">강화할 능력 하나를 선택하세요</p>
    <div class="card-row">${cardHtml}</div>
    <div class="buff-status">${accumulated ? `누적 — ${accumulated}` : '누적 없음'}</div>
  `, 'victory');

  document.querySelectorAll('.upgrade-card').forEach(btn => {
    btn.onclick = () => {
      const card = CARDS.find(c => c.key === btn.dataset.buff);
      if (card) flow.buffs[card.key] = (flow.buffs[card.key] || 0) + card.amount;
      const next = Object.keys(FLOORS)
        .map(Number)
        .filter(f => f > flow.floor)
        .sort((a, b) => a - b)[0];
      flow.floor = next ?? flow.floor;
      renderFloorIntro();
    };
  });
}

// 5) 엔딩 화면 — 탑 정복 + 최종 스탯 (마지막 층 전용)
// 최종 스탯은 BASE + 누적 버프(flow.buffs)로 결정적으로 계산한다.
const FINAL_STATS = [
  { emoji: '❤️', label: '체력',     base: BASE.player.hp,       buffKey: null },
  { emoji: '💪', label: '힘',       base: BASE.player.str,      buffKey: 'str' },
  { emoji: '⚡', label: '이동 속도', base: BASE.player.spd,      buffKey: 'moveSpeed' },
  { emoji: '💥', label: '공 속도',   base: BASE.player.velocity, buffKey: 'throwPower' },
];

// 엔딩 컷신 — victoryLine(로봇 정지) → 칩 회수 → 칩 도난 → 스탯 화면.
// 각 장면의 visual은 img(있으면 ${IMG}/<img>.png) 또는 emoji 플레이스홀더.
// 실제 컷신 이미지가 생기면 emoji 대신 img 경로만 채우면 된다.
function buildEndingScenes(data) {
  return [
    // 1) 피구로이드 정지 — 로봇 초상 + 마지막 대사
    { img: data.sprite, speaker: '피구로이드', line: data.victoryLine },
    // 2) 유저(진도)의 독백 — 칩 발견
    { emoji: '💾', speaker: '진도', line: '저건... 칩?' },
    // 3) 칩 회수 — 나레이션
    { emoji: '🐾💾', line: '쓰러진 피구로이드의 머리에서 작은 칩을 빼냈다.\n완벽한 피구 로직의 정체가 이 안에...?' },
    // 4) 칩 도난 — 나레이션 (열린 결말)
    { emoji: '🥷💨', line: '그 순간, 누군가 칩을 낚아채 어둠 속으로 사라졌다...!' },
    // 5) TO BE CONTINUED...
    { line: 'TO BE CONTINUED...' },
  ];
}

function renderFinale(data) {
  renderEndingCutscene(data, () => renderFinaleStats(data));
}

function renderEndingCutscene(data, onDone) {
  const scenes = buildEndingScenes(data);
  let i = 0;

  const render = () => {
    const s = scenes[i];
    const last = i >= scenes.length - 1;
    const visual = s.img
      ? `<img class="cine-img" src="${IMG}/${s.img}.png" alt=""/>`
      : `<div class="cine-emoji">${s.emoji}</div>`;
    const caption = s.speaker
      ? `<div class="cine-caption speech"><span class="cine-speaker">${esc(s.speaker)}</span>${esc(s.line)}</div>`
      : `<div class="cine-caption narr">${esc(s.line)}</div>`;
    paint(`
      <div class="floor-title">${data.title}</div>
      <div class="cine-stage">
        ${visual}
        ${caption}
      </div>
      <button class="ov-btn primary" id="ov-cine-next">${last ? '엔딩 보기 ▸' : '다음 ▸'}</button>
    `, 'cine');
    document.getElementById('ov-cine-next').onclick = () => {
      i++;
      if (i >= scenes.length) onDone();
      else render();
    };
  };
  render();
}

function renderFinaleStats(data) {
  const statHtml = FINAL_STATS.map(s => {
    const buff  = s.buffKey ? (flow.buffs[s.buffKey] || 0) : 0;
    const final = Math.round(s.base * (1 + buff));
    const bonus = buff > 0 ? `<span class="stat-bonus">+${pct(buff)}%</span>` : '';
    return `
      <div class="stat-row">
        <span class="stat-name">${s.emoji} ${s.label}</span>
        <span class="stat-val">${final} ${bonus}</span>
      </div>`;
  }).join('');

  const totalBuff = CARDS.reduce((n, c) => n + (flow.buffs[c.key] > 0 ? 1 : 0), 0);
  const timeStr = formatTime(flow.playTime);

  const confetti = Array.from({ length: 24 }, (_, i) => {
    const colors = ['#FFE3A0', '#FF8B8B', '#8BD3FF', '#B6FF8B', '#E0A0FF'];
    const c = colors[i % colors.length];
    const left = Math.round((i / 24) * 100);
    const delay = (i % 8) * 0.35;
    const dur = 2.6 + (i % 5) * 0.4;
    return `<span class="confetti" style="left:${left}%;background:${c};animation-delay:${delay}s;animation-duration:${dur}s;"></span>`;
  }).join('');

  paint(`
    <div class="confetti-layer">${confetti}</div>
    <div class="floor-title">${data.title}</div>
    <h2 class="result-headline win">🏆 탑 정복!</h2>
    <p class="result-sub">피구의 정점에 올랐습니다. 모든 층을 클리어했어요!</p>
    <p class="result-sub" style="margin-top:0;color:rgba(255,255,255,0.5)">…그런데 그 칩은, 대체 누가 가져간 걸까?</p>
    <div class="final-panel">
      <div class="final-panel-title">최종 스탯</div>
      ${statHtml}
      <div class="final-buff-count">획득한 강화 ${totalBuff}개</div>
      <div class="final-playtime">⏱ 총 플레이 타임 &nbsp;<b>${timeStr}</b></div>
    </div>
    <button class="ov-btn primary" id="ov-restart">처음부터 다시 도전</button>
  `, 'finale');

  document.getElementById('ov-restart').onclick = () => {
    flow.floor = INITIAL_FLOOR;
    flow.buffs = Object.fromEntries(CARDS.map(c => [c.key, 0]));
    flow.playTime = 0;
    renderStart();
  };
}

// 유틸 ──────────────────────────────────────────────────────────────

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}
function pct(v) { return Math.round(v * 100); }
