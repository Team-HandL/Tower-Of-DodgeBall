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
| W / A / S / D | 이동 |
| 마우스 이동 | 조준 방향 설정 |
| 마우스 클릭 / Space | 공 줍기 / 던지기 / 캐치 |

---

### 파일 구조

```
.
├── index.html                  # HTML 구조, CSS 스타일, 게임 엔트리포인트
├── game-logic.js               # 게임 루프, 시작/종료 처리, 모듈 부트스트랩
├── game-logic/
│   ├── state.js                # 게임 상태 객체와 기본 상수
│   ├── status.js               # 플레이어/NPC 능력치와 층별 스탯 초기화
│   ├── input.js                # 키보드/마우스 입력 바인딩
│   ├── actions.js              # 공 줍기, 던지기, 캐치, 피격 처리
│   ├── physics.js              # 이동, 충돌, 거리, 시야선 계산 유틸리티
│   ├── npcAI.js                # NPC 조준, 회피, 추적, 대기 상태머신
│   ├── ballPhysics.js          # 공 이동, 반사, 감속, 명중 판정
│   ├── overlay.js              # 시작/층 진입/승패/강화 오버레이 UI
│   └── renderer.js             # 캔버스 렌더링
└── design/
    ├── assets.js               # 이미지 에셋 사전 로딩
    ├── ball.js                 # 공과 궤적 가이드선 렌더링
    ├── player.js               # 플레이어 캐릭터 렌더링
    ├── map-01/
    │   ├── background.js       # 맵 배경 렌더링
    │   ├── obstacles.js        # 장애물 데이터와 렌더링
    │   └── npc.js              # NPC 캐릭터 렌더링
    └── assets/
        ├── fonts/              # 게임 폰트
        └── images/             # 캐릭터, 공, 탑 이미지
```
