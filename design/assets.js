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
  const rootKeys = ['ball_basic', 'ball_180'];
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
    ...rootKeys.map(k => load(k, `./design/assets/images/${k}.png`)),
  ]);
}

export { IMGS };
