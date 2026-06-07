# clips/ — 플레이 영상 & 커버

`promo/index.html`(▶ 슬라이드쇼)에서 쓰는 영상·이미지 폴더.

## 현재 슬라이드 순서 (index.html 의 `SLIDES`)
1. `TowerOfDodgeBall_cover.png` — 시작 화면
2. `00_start.mov`
3. `01_control.png` — "WASD 이동 · 마우스 조준 · 클릭으로 줍고 던지기"
4. `02_nerd.mp4` — "조작법을 배우며 1층부터 클리어!"
5. `04_catch.mp4` — "캐치와 장애물을 활용해 다양한 플레이…"
6. `05_variable_map.mov` — "층마다 달라지는 맵과 지형을 활용해 공략…"
7. `../03_challengers.html` — "다양한 도전 상대와의 박진감 넘치는 대결"
8. `03_choose_stat.mp4` — "층을 클리어하며 원하는 능력을 강화…"
9. `06_clear.mov` — "강력한 보스 안드로이드를 클리어하고, 최종 클리어 시간을 단축…"
10. `TowerOfDodgeBall_cover.png` + **▶ 지금 플레이** 버튼 → 게임(`../index.html`)

> clips 안의 모든 시각 자산이 리일에 사용됩니다.

## 슬라이드 추가/변경
`../index.html` 상단 `SLIDES` 배열을 편집:
```js
{ image:'clips/x.png' },                 // 이미지
{ clip:'clips/x.mp4' },                  // 영상(음소거·루프)
{ scene:'x.html' },                      // 기존 장면 HTML
{ clip:'clips/x.mp4', caption:'<b>강조</b> 문구' },  // 캡션 얹기
{ image:'clips/cover.png', cta:'../index.html' },    // CTA 버튼
{ image:'clips/cover.png', start:true },             // 시작 힌트
```

## 여는 법 (중요)
`promo/serve.command` 더블클릭 → 브라우저에서 자동으로 열림.
(저장소 **루트**에서 서빙해야 `../design` 의 이미지·폰트·BGM 이 로드됩니다. 그냥
`index.html` 을 더블클릭(file://)하면 상위 폴더 이미지가 차단돼 안 보입니다.)

- 영상은 음소거·루프. BGM(`design/assets/music/bgm_tod.mp3`)이 접속 3초 뒤 재생.
- 이동은 **키보드 전용**: → / Space 다음, ← 이전. (화살표·음소거 아이콘 없음)
