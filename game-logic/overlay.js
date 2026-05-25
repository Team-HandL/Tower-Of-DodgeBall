import { state } from './state.js';

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

export function showOverlay(result, onRestart) {
  const ov = document.getElementById('overlay');
  ov.innerHTML = result === 'win'
    ? '<h2>🎉 승리!</h2><p>NPC를 쓰러뜨렸습니다</p><button id=startBtn>다시 하기</button>'
    : result === 'timeout'
    ? '<h2>⏱ 시간 초과</h2><p>시간이 종료되었습니다</p><button id=startBtn>다시 하기</button>'
    : '<h2>💀 패배...</h2><p>3번 맞았습니다</p><button id=startBtn>다시 하기</button>';
  ov.style.display = 'flex';
  document.getElementById('startBtn').addEventListener('click', onRestart);
}

export function hideOverlay() {
  document.getElementById('overlay').style.display = 'none';
}
