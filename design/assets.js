const IMGS = {};

/**
 * facing 벡터 → 'back' | 'front' | 'left' | 'right'
 */
export function getFacingKey(facing) {
  const ax = Math.abs(facing.x), ay = Math.abs(facing.y);
  if (ax >= ay) return facing.x >= 0 ? 'right' : 'left';
  return facing.y >= 0 ? 'front' : 'back';
}

export function loadAssets() {
  const dirs = ['back', 'front', 'left', 'right'];
  const jindoKeys = dirs.flatMap(d => [1, 2, 3, 4].flatMap(f => [`jindo_${d}_${f}`, `jindo_ball_${d}_${f}`]));
  const soccerKeys = dirs.flatMap(d => [1, 2, 3, 4].flatMap(f => [`soccer_${d}_${f}`, `soccer_ball_${d}_${f}`]));
  const nerdKeys = dirs.flatMap(d => [1, 2, 3, 4].flatMap(f => [`nerd_${d}_${f}`, `nerd_ball_${d}_${f}`]));
  const ceoKeys = dirs.flatMap(d => [1, 2, 3, 4].flatMap(f => [`ceo_${d}_${f}`, `ceo_ball_${d}_${f}`]));
  const trainerKeys = dirs.flatMap(d => [1, 2, 3, 4].flatMap(f => [`trainer_${d}_${f}`, `trainer_ball_${d}_${f}`]));
  const robotKeys = dirs.flatMap(d => [1, 2, 3, 4].flatMap(f => [`robot_${d}_${f}`, `robot_ball_${d}_${f}`]));
  const hitKeys = ['jindo', 'nerd', 'ceo', 'trainer', 'soccer', 'robot']
    .map(c => ({ key: `${c}_hit_1`, path: `./design/assets/images/${c}/${c}_hit_1.png` }));
  const rootKeys = ['ball_basic', 'ball_180'];
  // 층별 배경: map-0N/background_0N.png → IMGS['background_N']
  const bgKeys = [1, 2, 3, 4, 5].map(n => ({
    key: `background_${n}`,
    path: `./design/map-0${n}/background_0${n}.png`,
  }));
  const load = (key, path) => new Promise(resolve => {
    const img = new Image();
    img.onload  = () => { IMGS[key] = img; resolve(); };
    img.onerror = () => { console.warn(`Asset missing: ${path}`); resolve(); };
    img.src = path;
  });
  return Promise.all([
    ...jindoKeys.map(k => load(k, `./design/assets/images/jindo/${k}.png`)),
    ...soccerKeys.map(k => load(k, `./design/assets/images/soccer/${k}.png`)),
    ...nerdKeys.map(k => load(k, `./design/assets/images/nerd/${k}.png`)),
    ...ceoKeys.map(k => load(k, `./design/assets/images/ceo/${k}.png`)),
    ...trainerKeys.map(k => load(k, `./design/assets/images/trainer/${k}.png`)),
    ...robotKeys.map(k => load(k, `./design/assets/images/robot/${k}.png`)),
    ...rootKeys.map(k => load(k, `./design/assets/images/${k}.png`)),
    ...hitKeys.map(({ key, path }) => load(key, path)),
    ...bgKeys.map(({ key, path }) => load(key, path)),
  ]);
}

export { IMGS };
