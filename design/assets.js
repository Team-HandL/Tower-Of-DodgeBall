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
  const rootKeys = [
    'soccer_back', 'soccer_front', 'soccer_left', 'soccer_right',
    'ball_basic', 'ball_180',
  ];
  const load = (key, path) => new Promise(resolve => {
    const img = new Image();
    img.onload  = () => { IMGS[key] = img; resolve(); };
    img.onerror = () => { console.warn(`Asset missing: ${path}`); resolve(); };
    img.src = path;
  });
  return Promise.all([
    ...jindoKeys.map(k => load(k, `./design/assets/images/jindo/${k}.png`)),
    ...rootKeys.map(k => load(k, `./design/assets/images/${k}.png`)),
  ]);
}

export { IMGS };
