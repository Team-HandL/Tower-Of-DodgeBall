import { state, setNextNPCSprite } from './state.js';
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
  pb.style.width      = `${(player.hp / BASE.player.hp) * 100}%`;
  pb.style.background = hpColor(player.hp, BASE.player.hp);
  nb.style.width      = `${(npc.hp / BASE.npc.hp) * 100}%`;
  nb.style.background = hpColor(npc.hp, BASE.npc.hp);
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
    stats: { hp: 120, str: 100, spd: 130, velocity: 500 },
    introLines: [
      '어... 안녕.',
      '피구는 간단해. 공을 맞히면 데미지!\n상대 체력을 먼저 0으로 만들면 이겨.\n이동은 WASD, 조준은 마우스.\n좌클릭(또는 스페이스)으로 공을 줍고, 던지고, 캐치까지 다 할 수 있어.',
      '탑 어딘가에... 피구에 미친 안드로이드가 있다던데?\n대체 어떤 로직으로 공을 피하고 던지는 건지 너무 궁금해!',
    ],
    timeoutLine: '시간이 다 됐네!\n날 못 쓰러뜨렸구나.\n뭐, 데이터는 충분히 봤으니 난 만족이야.',
    defeatLine: '어라, 너 쓰러졌어?\n실력 없는 나한테 지다니...\n다시 도전해봐, 응원할게!',
    victoryLine: '우와, 역시!\n너의 그 회피 패턴, 잘 기록해뒀어.\n그럼 안녕.',
  },
  4: {
    title: '4F — 축구선수',
    sprite: 'soccer/soccer_portrait',
    npcSprite: 'soccer',
    hasCards: true,
    stats: { hp: 120, str: 100, spd: 200, velocity: 500 },
    introLines: [
      '...왜 축구가 아니라 피구를 하는거지?',
      '이상한 안드로이드잖아.\n축구를 하는 안드로이드로 개조해주겠어.',
      '다음 층으로 가는 건 네가 아니라 나다.',
    ],
    timeoutLine: '시간 안에 끝내지도 못하다니. 스피드가 부족하군.',
    defeatLine: '느려 터졌어. 축구부터 배우고 와라.',
    victoryLine: '...스피드 하나는 인정해주지.',
  },
};

const INITIAL_FLOOR = 1;

const flow = {
  floor: INITIAL_FLOOR,
  buffs: Object.fromEntries(CARDS.map(c => [c.key, 0])),
  startGameFn: null,
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
    renderFloorIntro();
  };
  document.getElementById('ov-retry-floor').onclick = () => {
    renderFloorIntro();
  };
}

// 4) 승리 화면 — 카드 선택 (CARDS 데이터 기반)
function renderVictory() {
  const data = FLOORS[flow.floor] ?? { title: `${flow.floor}F`, victoryLine: '클리어!' };

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

// 유틸 ──────────────────────────────────────────────────────────────

function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}
function pct(v) { return Math.round(v * 100); }
