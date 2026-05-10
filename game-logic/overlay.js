import { state } from './state.js';

export function updateHPUI() {
  const { player, npc } = state;
  for (let i = 1; i <= 3; i++) {
    document.getElementById('p' + i).className = 'hp-dot' + (player.hp < i ? ' empty' : '');
    document.getElementById('n' + i).className = 'hp-dot' + (npc.hp < i ? ' empty' : '');
  }
}

export function showOverlay(result, onRestart) {
  const ov = document.getElementById('overlay');
  ov.innerHTML = result === 'win'
    ? '<h2>🎉 승리!</h2><p>NPC를 쓰러뜨렸습니다</p><button id=startBtn>다시 하기</button>'
    : '<h2>💀 패배...</h2><p>3번 맞았습니다</p><button id=startBtn>다시 하기</button>';
  ov.style.display = 'flex';
  document.getElementById('startBtn').addEventListener('click', onRestart);
}

export function hideOverlay() {
  document.getElementById('overlay').style.display = 'none';
}
