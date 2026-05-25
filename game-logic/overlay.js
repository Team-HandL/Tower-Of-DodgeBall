import { state } from './state.js';

// ─── HP UI (게임 루프가 매 프레임 호출) ────────────────────────────

function hpColor(hp) {
  const r = hp / 3;
  return `rgb(${Math.round(220 - 160 * r)},${Math.round(40 + 160 * r)},40)`;
}

export function updateHPUI() {
  const { player, npc } = state;
  const pb = document.getElementById('player-hp-bar');
  const nb = document.getElementById('npc-hp-bar');
  pb.style.width      = `${(player.hp / 3) * 100}%`;
  pb.style.background = hpColor(player.hp);
  nb.style.width      = `${(npc.hp / 3) * 100}%`;
  nb.style.background = hpColor(npc.hp);
}

// ─── 오버레이 플로우 (시작/층 진입/승리/패배) ─────────────────────
// 게임 로직(physics/npcAI/ball)에 의존하지 않습니다.
// 현재 층/누적 버프 상태는 이 모듈이 소유합니다.

const IMG = './design/assets/images';

// 층별 컨셉/대사. 지금은 4층(축구선수) 데이터만 있습니다.
// (1층 데이터가 준비되면 1: {...} 추가 후 INITIAL_FLOOR를 1로 바꾸세요.)
const FLOORS = {
  4: {
    title: '4F — 축구선수',
    sprite: 'soccer_front',
    introLines: [
      '...왜 축구가 아니라 피구를 하는거지?',
      '이상한 안드로이드잖아. 축구를 하는 안드로이드로 개조해주겠어.',
      '다음 층으로 가는 건 네가 아니라 나다.',
    ],
    timeoutLine: '시간 안에 끝내지도 못하다니. 스피드가 부족하군.',
    defeatLine: '느려 터졌어. 축구부터 배우고 와라.',
    victoryLine: '...스피드 하나는 인정해주지.',
  },
};

const INITIAL_FLOOR = 4; // 임시. 1층 컨텐츠가 준비되면 1로.

const flow = {
  floor: INITIAL_FLOOR,
  buffs: { throwPower: 0, catchRange: 0, moveSpeed: 0 }, // 누적 비율 (0.2 = +20%)
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
}

// 1) 최초 시작 화면 — tower.png + 진도 대사
function renderStart() {
  paint(`
    <div class="start-stage">
      <img class="start-tower" src="${IMG}/tower.png" alt="tower"/>
      <div class="start-jindo start-jindo-back">
        <div class="speech">여긴 어디..?</div>
        <img src="${IMG}/jindo_back.png" alt=""/>
      </div>
      <div class="start-jindo start-jindo-front">
        <div class="speech">탑..?</div>
        <img src="${IMG}/jindo_front.png" alt=""/>
      </div>
    </div>
    <button class="ov-btn primary" id="ov-start-btn">탑 오르기 시작</button>
  `, 'start');
  document.getElementById('ov-start-btn').onclick = () => renderFloorIntro();
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
  hideOverlay();
  flow.startGameFn();
}

// 3) 패배 화면 — 시간 초과 / HP 패배 분기 + 2개 재시작 옵션
function renderDefeat(reason) {
  const data = FLOORS[flow.floor] ?? {
    title: `${flow.floor}F`, sprite: 'soccer_front',
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
    flow.buffs = { throwPower: 0, catchRange: 0, moveSpeed: 0 };
    renderFloorIntro();
  };
  document.getElementById('ov-retry-floor').onclick = () => {
    renderFloorIntro();
  };
}

// 4) 승리 화면 — 3개 카드 선택 (버프 누적)
function renderVictory() {
  const data = FLOORS[flow.floor] ?? { title: `${flow.floor}F`, victoryLine: '클리어!' };

  paint(`
    <div class="floor-title">${data.title}</div>
    <h2 class="result-headline win">🎉 클리어!</h2>
    <p class="result-sub">${esc(data.victoryLine)}</p>
    <p class="card-hint">강화할 능력 하나를 선택하세요</p>
    <div class="card-row">
      <button class="upgrade-card" data-buff="throwPower">
        <div class="card-emoji">💥</div>
        <div class="card-title">투척 강화</div>
        <div class="card-desc">파워 <b>+20%</b></div>
      </button>
      <button class="upgrade-card" data-buff="catchRange">
        <div class="card-emoji">🧤</div>
        <div class="card-title">캐치 확대</div>
        <div class="card-desc">판정 <b>+30%</b></div>
      </button>
      <button class="upgrade-card" data-buff="moveSpeed">
        <div class="card-emoji">⚡</div>
        <div class="card-title">이동속도 증대</div>
        <div class="card-desc">달리기 <b>+20%</b></div>
      </button>
    </div>
    <div class="buff-status">
      누적 — 파워 +${pct(flow.buffs.throwPower)}% · 캐치 +${pct(flow.buffs.catchRange)}% · 속도 +${pct(flow.buffs.moveSpeed)}%
    </div>
  `, 'victory');

  document.querySelectorAll('.upgrade-card').forEach(c => {
    c.onclick = () => {
      const key = c.dataset.buff;
      if (key === 'throwPower') flow.buffs.throwPower += 0.2;
      else if (key === 'catchRange') flow.buffs.catchRange += 0.3;
      else if (key === 'moveSpeed') flow.buffs.moveSpeed += 0.2;

      const next = flow.floor + 1;
      flow.floor = FLOORS[next] ? next : flow.floor; // 다음 층 없으면 데모로 같은 층 반복
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
