// 게임 BGM — '도전 시작'을 처음 누른 순간부터 재생을 시작하고,
// 층 전환과 무관하게 파일 끝(약 3:31)까지 끊김 없이 한 번만 이어서 흐른다.
// 반복(loop) 없음: 끝나면 그대로 정지한다.

const bgm = new Audio('./design/assets/music/bgm_tod.mp3');
bgm.loop = false;
bgm.preload = 'auto';
bgm.volume = 0.5;

let started = false;

// '도전 시작' 버튼(사용자 클릭)에서 호출 — 클릭 제스처 안에서 호출되므로
// 브라우저 자동재생 정책에 걸리지 않는다.
// 이미 재생을 시작했다면 아무 것도 하지 않아, 층마다 다시 눌러도
// 트랙이 처음으로 되감기지 않고 끊김 없이 계속 흐르게 한다.
export function startBGM() {
  if (started) return;
  started = true;
  bgm.currentTime = 0;
  // play()가 거부되면(자동재생 차단 등) 다음 클릭에서 재시도할 수 있게 플래그 복구
  bgm.play().catch(() => { started = false; });
}
