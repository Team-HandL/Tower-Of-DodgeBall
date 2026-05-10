## Tower-Of-DodgeBall

캔버스 기반 1:1 피구 게임. 플레이어가 NPC와 대결하며 공을 피하고, 줍고, 던져서 상대방 HP를 먼저 0으로 만들면 승리합니다.

---

### 실행 방법

로컬 서버가 필요합니다 (ES Module 사용).

```bash
npx serve .
# 또는
python3 -m http.server 8080
```

브라우저에서 `http://localhost:포트` 접속

---

### 조작법

| 키 | 동작 |
|---|---|
| 방향키 | 이동 |
| Z / ㅋ | 공 줍기 / 잡기 |
| X / ㅌ | 공 던지기 |

---

### 파일 구조

```
index.html              HTML 구조 + CSS 스타일, 엔트리포인트
game-logic.js           게임 루프, startGame, endGame, 부트스트랩

game-logic/             게임 로직 모듈
  state.js              게임 상태 객체(player, npc, ball, keys)와 상수(W, H, SPD)
  physics.js            충돌 판정, 이동, 시야선(LOS) 계산 유틸리티
  actions.js            공 던지기(doThrow), 줍기(pickUpBall), 피격(applyHit)
  npcAI.js              NPC 상태머신 — 조준/회피/추적/대기 로직
  ballPhysics.js        공 이동, 장애물/벽 반사, 명중 판정 (승패 반환)
  overlay.js            HP UI 업데이트, 시작/승리/패배 오버레이 DOM 관리
  input.js              키보드 이벤트 바인딩
  renderer.js           매 프레임 캔버스 렌더링 (맵 + 캐릭터 + 공)

design/                 그래픽 모듈
  ball.js               공 그리기 (궤적 가이드선 포함)
  player.js             플레이어 캐릭터 그리기 (그로기 바, 힌트 텍스트)
  map-01/               맵 구성 요소
    background.js       배경 그리기 (그리드, 중앙선)
    obstacles.js        장애물 위치/크기 데이터
    npc.js              NPC 캐릭터 그리기
```
