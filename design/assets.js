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
  const keys = [
    'jindo_back', 'jindo_front', 'jindo_left', 'jindo_right',
    'soccer_back', 'soccer_front', 'soccer_left', 'soccer_right',
  ];
  return Promise.all(keys.map(key => new Promise(resolve => {
    const img = new Image();
    img.onload  = () => { IMGS[key] = img; resolve(); };
    img.onerror = () => { console.warn(`Asset missing: ${key}.png`); resolve(); };
    img.src = `./design/assets/${key}.png`;
  })));
}

export { IMGS };
