import { state, setNextNPCSprite, setNextNPCAI, setNextObstacles, setNextSpawnPositions, setNextNPCChatter, setNextBalls } from './state.js';
import { FLOOR_OBSTACLE_GROUPS } from '../design/map-01/obstacles.js';
import { BASE, STATUS, setNextNPCStats, applyBuffsToStatus } from './status.js';
import { startBGM } from './bgm.js'
// ─── HP UI (게임 루프가 매 프레임 호출) ────────────────────────────

function hpColor(hp, maxHp) {
  const r = hp / maxHp;
  return `rgb(${Math.round(220 - 160 * r)},${Math.round(40 + 160 * r)},40)`;
}

const BASE_HP = 120;
const BASE_BAR_W = 200;
function barWidth(maxHp) { return Math.max(60, Math.round(maxHp * BASE_BAR_W / BASE_HP)); }

export function updateHPUI() {
  const { player, npc } = state;
  const pb = document.getElementById('player-hp-bar');
  const nb = document.getElementById('npc-hp-bar');
  pb.parentElement.style.width = `${barWidth(player.maxHp)}px`;
  nb.parentElement.style.width = `${barWidth(npc.maxHp)}px`;
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
  { key: 'hp',         emoji: '❤️', title: 'HP 증가',      desc: 'HP',     amount: 30, absolute: true },
  { key: 'str',        emoji: '💪', title: '힘 강화',      desc: '데미지',  amount: 0.12 },
  { key: 'moveSpeed',  emoji: '⚡', title: '이동속도 강화', desc: '이동속도', amount: 0.10 },
  { key: 'throwPower', emoji: '💥', title: '투척 강화',    desc: '공 속도', amount: 0.12 },
];

// 층별 컨셉/대사.
// npcSprite: 인게임 스프라이트 시트 prefix. stats.spd는 NPC 이동속도
// player 기본 spd = 210. 층별 역할에 따라 NPC 이동속도와 전투 스탯을 차등 적용한다.
const FLOORS = {
  1: {
    title: '1F — 너드',
    sprite: 'nerd/nerd_portrait',
    npcSprite: 'nerd',
    hasCards: true,
    stats: { hp: 120, str: 100, spd: 180, velocity: 520 },
    ai: {
      reactionDelay: 0.36, aimError: 62, dodgeSkill: 0.25, aggression: 0.55,
      pickupGreed: 0.55, blockBreakPreference: 0.1,
      attackRangePreference: { short: 0.40, mid: 0.70, long: 0.45 },
    },
    introLines: [
      '어... 안녕?',
      '여기가 뭐 하는 곳이냐고?',
      '나도 잘 모르지만, 뭔가.. 피구를 하게 되는 곳이야 다들 왜인지 꼭대기에 가고 싶어 해.',
      '난 이 탑 어딘가의 피구에 미친 안드로이드의 동작 원리를 알고 싶어서 여기에 왔어.',
      '나도 모르는 것들이 여기저기에 많아. 그건 직접 확인하는 수밖에 없어'
    ],
    timeoutLine: '벌써 시간이 다 됐네!\n한 번 더 할꺼야?',
    defeatLine: '어라, 쓰러졌어?\n괜찮아, 금방 잘하게 될 거야!\n다시 도전해봐, 응원할게!',
    victoryLine: '우와, 역시!\n금방 배우는 타입이구나?\n다음 층에서도 파이팅해!',
    chatterLines: [
      '오, 방금 그 움직임 좋았어!',
      'W A S D로 이동할 수 있어.',
      '클릭/SPACE로 공을 줍고 던질 수 있어.',
      '클릭/SPACE를 길게 누르면 공을 더 강하게 던질 수 있지.',
      '날아오는 공을 타이밍 맞춰 잡아봐.',
      '장애물을 부수면 공을 추가로 얻을 수도 있어.'
    ],
    hitLines: ['아얏!', '오, 제법인데!', '너 꽤 하는구나?'],
  },
  2: {
    title: '2F — CEO',
    sprite: 'ceo/ceo_portrait',
    npcSprite: 'ceo',
    hasCards: true,
    stats: { hp: 120, str: 105, spd: 200, velocity: 550 },
    ai: {
      reactionDelay: 0.30, aimError: 52, dodgeSkill: 0.38, aggression: 0.72,
      pickupGreed: 0.75, blockBreakPreference: 0.3,
      attackRangePreference: { short: 0.70, mid: 0.80, long: 0.50 },
    },
    introLines: [
      '아… 칩을 얻으면 큰 돈을 벌 수 있는데…',
      '응? 넌 뭐지?',
      '이 몸은 바쁘단 말이다. 널 상대할 시간이 없어.'
    ],
    timeoutLine: '시간 초과군.\n마감도 못 지키는 자와는 거래하지 않아.',
    defeatLine: '수고했네.\n하지만 다음엔 시간을 뺏지 말아 줬으면 좋겠군.',
    victoryLine: '이런, 내가 졌다고?\n자네, 나랑 일해볼 생각 없나?',
    chatterLines: [
      '시간은 곧 돈이야...',
      '이번에 투자 받았는데.. 제육 먹으러 가자고',
      '우리 직원들은 일하는 시간이 너무 적은 것 같아.',
      '자네, 시야가 좁군..',
      '탕비실에 커피와 과자가 왜 필요하지?',
    ],
    hitLines: ['큭.. 손실이군.', '이건 계산에 없었어.', '감히.. 넌 해고야!'],
  },
  3: {
    title: '3F — 트레이너',
    sprite: 'trainer/trainer_portrait',
    npcSprite: 'trainer',
    hasCards: true,
    stats: { hp: 170, str: 200, spd: 200, velocity: 520 },
    ai: {
      reactionDelay: 0.24, aimError: 42, dodgeSkill: 0.50, aggression: 0.70,
      pickupGreed: 0.66, blockBreakPreference: 1.0,
      attackRangePreference: { short: 0.95, mid: 0.55, long: 0.20 },
    },
    introLines: [
      '거기 너! 몸이 부실하군!',
      '나에게 PT를 받아라 너의 몸을 개조해 주마!',
      '나만큼 힘이 세면, 공으로 벽을 한 번에 부술 수도 있다고!!'
    ],
    timeoutLine: '시간 안에 못 끝내?\n지구력이 부족하군. 더 뛰어!',
    defeatLine: '벌써 지쳤어?\n기초 체력부터 다시!',
    victoryLine: '제법인데!\n합격이야. 다음 층으로 가봐.',
    chatterLines: [
      '하나! 둘! 좋아, 페이스 유지!',
      '그 정도로 지치면 안 되지!',
      '근성! 근성을 보여줘!',
      '땀이 곧 실력이다!',
      '자, 한 세트 더 간다!',
    ],
    hitLines: ['크윽! 좋은 근육이군!', '이 정도 자극은 환영이다!', '한 대 더 쳐봐!'],
  },
  4: {
    title: '4F — 축구선수',
    sprite: 'soccer/soccer_portrait',
    npcSprite: 'soccer',
    hasCards: true,
    stats: { hp: 150, str: 120, spd: 280, velocity: 640 },
    ai: {
      reactionDelay: 0.18, aimError: 40, dodgeSkill: 0.75, aggression: 0.78,
      pickupGreed: 0.72, blockBreakPreference: 0.4,
      idealRange: 170,   // 중거리(220)보다 가까이 붙어서 사격 — 스피드로 들이대는 히트앤런
      attackRangePreference: { short: 0.80, mid: 0.55, long: 0.45 },
    },
    spawn: { player: { c: 2, r: 8 }, npc: { c: 22, r: 8 } },
    balls: [{ c: 3, r: 8 }, { c: 21, r: 8 }],   // 플레이어 오른쪽 / NPC 왼쪽에 공 1개씩
    introLines: [
      '이 위에 피구를 하는 이상한 로봇이 있다는데 알아?',
      '축구가 더 재밌는데… 이런 게 뭐가 재밌다는 건지.',
      '역시 이상한 안드로이드잖아.\n얼른 가서 축구를 하게 만들어야겠어!',
    ],
    timeoutLine: '시간 안에 끝내지도 못하다니. 많이 느린데?',
    defeatLine: '느려 터졌어. 축구를 하지 않아서 그래!',
    victoryLine: '...공 좀 차는데?',
    chatterLines: [
      '느려.',
      '이건 드리블이 아니라 피구지만...',
      '스피드로 찍어 누른다!',
      '따라올 수 있겠어?',
      '슛! ...아니 던지기였지.',
    ],
    hitLines: ['심판! VAR 확인해!!', '이건 침대... 피구다!', '운이 좋았어.'],
  },
  5: {
    title: '5F — 피구로이드',
    sprite: 'robot/robot_portrait',
    npcSprite: 'robot',
    isFinal: true,                  // 마지막 층: 승리 시 엔딩 오버레이
    stats: { hp: 210, str: 215, spd: 260, velocity: 700 },
    ai: {
      reactionDelay: 0.08, aimError: 18, dodgeSkill: 0.88, aggression: 0.92,
      pickupGreed: 0.82, blockBreakPreference: 0.9,
      attackRangePreference: { short: 0.85, mid: 0.95, long: 0.85 },
    },
    introLines: [
      '.. 누구?',
      '나, 피구로이드.\n피구, 학습 데이터 확보, 탑... 세웠다.',
      '너, 전투 데이터, 유용할 것 같다.',
    ],
    timeoutLine: '시간 초과.',
    defeatLine: '너, 패배\n데이터, 무쓸모',
    victoryLine: '너, 승리\n시스템... 정지...',
    chatterLines: [
      '목표 포착. 승률 계산 중… 귀찮으니 100%',
      '패턴 학습, 완료.',
      '회피 알고리즘, 실행.',
      '공 재장전, 양심 미장착.',
      '이 정도, 예측 범위 안.',
    ],
    hitLines: ['경고. 상대, 주인공 보정 감지.', '...오차 범위 내.', '시스템 과열. 원인: 너, 생각보다 잘함.'],
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
  const oh = document.getElementById('overlay-help');
  if (oh) oh.style.display = 'none';   // 게임플레이 중엔 상단 #status가 트리거
}

// 후속 작업에서 게임 로직이 읽을 수 있도록 노출 (현재는 미사용).
export function getBuffs() { return { ...flow.buffs }; }
export function getCurrentFloor() { return flow.floor; }
export function addPlayTime(dt) { flow.playTime += dt; }

// DEV: 특정 층으로 즉시 점프 (인트로 생략, 버프/타이머 리셋 없음)
export function jumpToFloor(n) {
  flow.floor = n;
  startRound();
}

// 내부 렌더링 ─────────────────────────────────────────────────────

function paint(html, variant) {
  const ov = document.getElementById('overlay');
  ov.innerHTML = html;
  ov.className = `ov ov-${variant}`;
  ov.style.display = 'flex';
  document.getElementById('ui').style.display = 'none';
  const oh = document.getElementById('overlay-help');
  if (oh) oh.style.display = 'flex';   // 오버레이(시작/대화/결과)에선 캔버스 상단 버튼 노출
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
// 하단 풀폭 대사 바 + 우측 스프라이트, 좌우 흰색 삼각형 화살표로 대사 이동.
function renderFloorIntro() {
  const data = FLOORS[flow.floor];
  if (!data) { startRound(); return; }
  const speaker = (data.title.split('—')[1] || '').trim();
  let idx = 0;

  const render = () => {
    const total = data.introLines.length;
    const last  = idx >= total - 1;
    const first = idx === 0;
    const dots  = data.introLines
      .map((_, i) => `<span class="dot${i === idx ? ' on' : ''}"></span>`)
      .join('');
    paint(`
      <div class="stage-title">${data.title}</div>
      <button class="stage-nav left${first ? ' hidden' : ''}" id="ov-prev" aria-label="이전">◀</button>
      <button class="stage-nav right" id="ov-next" aria-label="${last ? '도전 시작' : '다음'}">▶${last ? '<span class="nav-label">도전 시작</span>' : ''}</button>
      <div class="stage-bottom">
        <img class="stage-sprite" src="${IMG}/${data.sprite}.png" alt=""/>
        <div class="stage-dialogue">
          ${speaker ? `<div class="stage-speaker">${esc(speaker)}</div>` : ''}
          <div class="stage-text">${esc(data.introLines[idx])}</div>
          <div class="stage-dots">${dots}</div>
        </div>
      </div>
    `, 'intro');
    document.getElementById('ov-prev').onclick = () => { if (idx > 0) { idx--; render(); } };
    document.getElementById('ov-next').onclick = () => {
      if (last) startRound();
      else { idx++; render(); }
    };
  };
  render();
}

function startRound() {
  startBGM();
  const data = FLOORS[flow.floor];
  if (data?.stats) setNextNPCStats(data.stats);
  if (data?.npcSprite) setNextNPCSprite(data.npcSprite);
  if (data?.ai) setNextNPCAI(data.ai);
  setNextSpawnPositions(data?.spawn ?? null);
  setNextBalls(data?.balls ?? null);
  setNextNPCChatter({ chatter: data?.chatterLines ?? [], hit: data?.hitLines ?? [] });
  setNextObstacles(FLOOR_OBSTACLE_GROUPS[flow.floor] ?? FLOOR_OBSTACLE_GROUPS[1]);
  hideOverlay();
  flow.startGameFn();             // → initState() → initStatus() (STATUS 초기화)
  applyBuffsToStatus(flow.buffs); // 초기화 직후 누적 버프 재적용
  state.player.hp    = STATUS.player.hp; // hp는 state에 복사된 값이라 버프 후 재동기화 필요
  state.player.maxHp = STATUS.player.hp;
}

// 3) 패배 화면 — 시간 초과 / HP 패배 분기 + 2개 재시작 옵션
// 무대 레이아웃 재사용: 중앙에 결과 헤드라인, 하단 패널에서 NPC가 도발 + 재시작 버튼.
function renderDefeat(reason) {
  const data = FLOORS[flow.floor] ?? {
    title: `${flow.floor}F`, sprite: 'soccer/soccer_portrait',
    timeoutLine: '시간이 다 됐군.', defeatLine: '여기까지인가.',
  };
  const speaker   = (data.title.split('—')[1] || '').trim();
  const isTimeout = reason === 'timeout';
  const headline  = isTimeout ? '⏱ 시간 초과' : '💀 패배';
  const subline   = isTimeout
    ? '제한 시간 안에 NPC를 쓰러뜨리지 못했습니다.'
    : '체력이 모두 소진되었습니다.';
  const npcLine   = isTimeout ? data.timeoutLine : data.defeatLine;

  paint(`
    <div class="stage-title">${data.title}</div>
    <div class="stage-center">
      <h2 class="result-headline lose">${headline}</h2>
      <p class="result-sub">${subline}</p>
    </div>
    <div class="stage-bottom">
      <img class="stage-sprite" src="${IMG}/${data.sprite}.png" alt=""/>
      <div class="stage-dialogue">
        ${speaker ? `<div class="stage-speaker">${esc(speaker)}</div>` : ''}
        <div class="stage-text">${esc(npcLine)}</div>
        <div class="stage-actions">
          <button class="ov-btn" id="ov-retry-tower">처음부터 다시 탑 오르기</button>
          <button class="ov-btn primary" id="ov-retry-floor">이 층부터 다시 도전</button>
        </div>
      </div>
    </div>
  `, 'defeat');

  document.getElementById('ov-retry-tower').onclick = () => {
    flow.floor = INITIAL_FLOOR;
    flow.buffs = Object.fromEntries(CARDS.map(c => [c.key, 0]));
    flow.playTime = 0;
    renderFloorIntro();
  };
  document.getElementById('ov-retry-floor').onclick = () => {
    startRound();   // 인트로 생략하고 같은 층 바로 재시작
  };
}

// 4) 승리 화면 — 카드 선택 (CARDS 데이터 기반)
// 무대 레이아웃 재사용: 중앙에 헤드라인/카드, 하단 패널에서 NPC가 패배를 인정.
function renderVictory() {
  const data = FLOORS[flow.floor] ?? { title: `${flow.floor}F`, victoryLine: '클리어!' };
  const speaker = (data.title.split('—')[1] || '').trim();

  // 마지막 층 클리어 → 엔딩 오버레이 (최종 스탯 표시, 다음 층 없음)
  if (data.isFinal) { renderFinale(data); return; }

  const npcPanel = `
    <div class="stage-bottom">
      <img class="stage-sprite" src="${IMG}/${data.sprite ?? 'soccer/soccer_portrait'}.png" alt=""/>
      <div class="stage-dialogue">
        ${speaker ? `<div class="stage-speaker">${esc(speaker)}</div>` : ''}
        <div class="stage-text">${esc(data.victoryLine)}</div>
        ${data.hasCards ? '' : '<div class="stage-actions"><button class="ov-btn primary" id="ov-next-floor">다음 층으로 ▶</button></div>'}
      </div>
    </div>`;

  // hasCards가 false인 층은 카드 없이 바로 다음 층으로
  if (!data.hasCards) {
    paint(`
      <div class="stage-title">${data.title}</div>
      <div class="stage-center">
        <h2 class="result-headline win">🎉 클리어!</h2>
      </div>
      ${npcPanel}
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
      <div class="card-desc">${c.desc} <b>+${c.absolute ? c.amount : Math.round(c.amount * 100) + '%'}</b></div>
    </button>
  `).join('');

  const accumulated = CARDS.filter(c => flow.buffs[c.key] > 0)
    .map(c => `${c.desc} +${c.absolute ? flow.buffs[c.key] : pct(flow.buffs[c.key]) + '%'}`).join(' · ');

  paint(`
    <div class="stage-title">${data.title}</div>
    <div class="stage-center">
      <h2 class="result-headline win">🎉 클리어!</h2>
      <p class="card-hint">강화할 능력 하나를 선택하세요</p>
      <div class="card-row">${cardHtml}</div>
      <div class="buff-status">${accumulated ? `누적 — ${accumulated}` : '누적 없음'}</div>
    </div>
    ${npcPanel}
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
  { emoji: '❤️', label: '체력',     base: BASE.player.hp,       buffKey: 'hp', absolute: true },
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
    { img: 'chip', speaker: '진도', line: '저건... 칩?' },
    // 3) 칩 회수 — 나레이션
    { img: 'jindo/jindo_back_1', line: '쓰러진 피구로이드의 머리에서 작은 칩을 빼냈다.\n완벽한 피구 로직의 정체가 이 안에...?' },
    // 4) 칩 도난 — 나레이션 (열린 결말)
    { img: 'thief', line: '그 순간, 누군가 칩을 낚아채 어둠 속으로 사라졌다...!' },
    // 5) TO BE CONTINUED... — 텍스트만
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
      : s.emoji
        ? `<div class="cine-emoji">${s.emoji}</div>`
        : '';
    const caption = s.speaker
      ? `<div class="cine-caption speech"><span class="cine-speaker">${esc(s.speaker)}</span>${esc(s.line)}</div>`
      : `<div class="cine-caption narr">${esc(s.line)}</div>`;
    paint(`
      <div class="floor-title">${data.title}</div>
      <div class="cine-stage">
        ${visual}
        ${caption}
      </div>
      <button class="ov-btn primary" id="ov-cine-next">${last ? '엔딩 보기 ▶' : '다음 ▶'}</button>
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
    const final = s.absolute ? s.base + buff : Math.round(s.base * (1 + buff));
    const bonus = buff > 0 ? `<span class="stat-bonus">+${s.absolute ? buff : pct(buff) + '%'}</span>` : '';
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
