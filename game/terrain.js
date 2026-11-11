// Map painter. Each map is painted once, pixel by pixel, in continuous colour (textured ground, tiered pine
// forests, bloom trees, structures, props, shadows, lamp light), then locked to one night palette with
// ordered dithering. That is what gives the crisp, checker-dithered look instead of repeating flat tiles.

// ---------------------------------------------------------------- noise
function h2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, oct = 3) { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { t += vn(x * f, y * f, s + i * 31) * a; n += a; a *= 0.5; f *= 2; } return t / n; }
let CD1 = 0, CD2 = 0, CID = 0, CCX = 0, CCY = 0;          // cellular noise results (no allocation per pixel)
function cellN(x, y, size, s) {
  const gx = Math.floor(x / size), gy = Math.floor(y / size); CD1 = CD2 = 1e9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const X = gx + i, Y = gy + j, px = (X + 0.15 + h2(X, Y, s) * 0.7) * size, py = (Y + 0.15 + h2(X, Y, s + 5) * 0.7) * size;
    const d = Math.hypot(x - px, y - py);
    if (d < CD1) { CD2 = CD1; CD1 = d; CID = h2(X, Y, s + 9); CCX = px; CCY = py; } else if (d < CD2) CD2 = d;
  }
}

// ---------------------------------------------------------------- colour helpers
const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function grad(stops, t) {
  t = Math.max(0, Math.min(0.9999, t)) * (stops.length - 1);
  const i = Math.floor(t), f = t - i, a = stops[i], b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
const S = arr => arr.map(hx);
const C = {
  ink: hx("#1a1430"),
  grass: S(["#2c6a3c", "#3c8a44", "#52a64c", "#70c05a", "#94d66c"]),
  grassDry: S(["#4a8a3e", "#64a448", "#82bc56", "#a4d066"]),
  tall: S(["#1c5a3a", "#287a44", "#3a9a4c", "#56b85a", "#7cd06e"]),
  tallTip: hx("#c8f088"),
  path: S(["#8a6448", "#a8805a", "#c49c6c", "#dcb886", "#eed4a4"]),
  stone: S(["#62628a", "#7c7ca8", "#9a9ac4", "#b8b8dc", "#d4d4f0"]),
  mortar: hx("#46466a"), moss: S(["#3c7a4a", "#52964e", "#6cb058"]),
  ash: S(["#3a2c2c", "#4e3a34", "#644a3e", "#7a5c48", "#927054"]),
  ember: [hx("#c8401c"), hx("#f0782c"), hx("#ffc858")],
  water: S(["#1c4a8c", "#2462ae", "#327ec8", "#52a0de", "#86c6f0"]), ripple: hx("#e0f4ff"), mud: S(["#6a5a48", "#7e6a52"]),
  wall: S(["#4a4a6e", "#5e5e86", "#76769e", "#8e8eb8"]), wallHi: hx("#bcbcdc"),
  floor: hx("#14402e"),
  pine: S(["#0e4a4c", "#146262", "#1c7c74", "#289888"]), pineHi: hx("#62bcb4"), pineTip: hx("#c4ecec"),
  bloom: S(["#5a2a8c", "#7a3cb2", "#9a5ad2", "#bc80ea", "#dcb2fa"]),
  bark: S(["#3a2420", "#5a3828", "#7a5034", "#9c6a44"]),
  wood: S(["#4a2c1c", "#6a4026", "#8a5a34", "#ac7644", "#ca945a"]), iron: S(["#3a3e5a", "#5a6082", "#8088aa", "#b4bcd8"]),
  burlap: S(["#8a7450", "#a88c60", "#c4a874", "#e0c894"]),
  flower: [hx("#f05a7a"), hx("#ffffff"), hx("#ffd84a"), hx("#7ad0ff")],
  warm: [255, 190, 90],
  // the Hollow Wood: deep teal greens, violet earth
  grassH: S(["#163e34", "#1e503e", "#28644a", "#347a56", "#469264"]), grassDryH: S(["#245444", "#306652", "#3e7a5e", "#4c8e6a"]),
  tallH: S(["#0e3028", "#164236", "#1e5442", "#28684e", "#36805c"]), pineH: S(["#0a2436", "#10364a", "#18485c", "#205c6e"]), pineHiH: hx("#3e8ca0"), pineTipH: hx("#9cd4e4"),
  pathH: S(["#3e3240", "#544658", "#6c5c70", "#86768a", "#a092a4"]),
  // the High Shrines: midnight blue, frost-pale stone
  grassS: S(["#1e3444", "#284656", "#345a68", "#427080", "#548896"]), grassDryS: S(["#2c4a56", "#3a5e6a", "#4a7480", "#5c8a94"]),
  tallS: S(["#162a3a", "#1e3a4c", "#284c5e", "#345e70", "#427284"]), pineS: S(["#081a30", "#0e2844", "#143858", "#1c486c"]), pineHiS: hx("#4476a4"), pineTipS: hx("#b4cef0"),
  pathS: S(["#343450", "#484868", "#5e5e82", "#78789e", "#9494ba"]),
  rock: S(["#141428", "#22223c", "#323250", "#464668", "#5e5e82"]), rockHi: hx("#9898bc"),
  waterH: S(["#0c2634", "#123848", "#1a4c5c", "#266674", "#428a92"]), rippleH: hx("#8cd0d8"),
  waterS: S(["#08142a", "#0e243e", "#163654", "#204a6c", "#34668c"]), rippleS: hx("#a8c8f0"),
  wallC: S(["#1c1826", "#2a2436", "#3a3348", "#4c445c"]), wallHiC: hx("#6a6080"), mortarC: hx("#120e1a"), stoneC: S(["#2e2a3c", "#403a50", "#564e68", "#6e6682", "#8a8098"]), mossC: S(["#3a3a2a", "#4a4a34", "#5c5a3e"]),
  ruin: S(["#324038", "#44564c", "#586c60", "#708878", "#8ea496"]),
  rune: [hx("#1ec8ba"), hx("#6af0e4"), hx("#c8fff8")],
  shroom: [hx("#5ae890"), hx("#b0ffd0"), hx("#9a58d8"), hx("#d8a0f8")],
  throne: S(["#2a1a08", "#6a4410", "#b07c1c", "#e8b640", "#fff0a0"]), velvet: S(["#3a0a14", "#6a1424", "#9a2234"]),
};
// The palette every pixel is snapped to: every ramp colour above plus a few warm lights.
const PALETTE = (() => {
  const out = [], add = c => { if (!out.some(q => q[0] === c[0] && q[1] === c[1] && q[2] === c[2])) out.push(c); };
  for (const v of Object.values(C)) { if (typeof v[0] === "number") add(v); else v.forEach(add); }
  ["#fff4c8", "#fcd888", "#e8903a", "#f0c060", "#e8e4f4", "#0e0a1c", "#c8c0d8", "#5a78a8"].forEach(h => add(hx(h)));
  return out;
})();
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16 - 0.5);

// Regions repaint the same shaders in their own palette: the swap is in place so every shader and the battle backdrops follow it.
const PAL_SWAP = { hollow: { grass: "grassH", grassDry: "grassDryH", tall: "tallH", pine: "pineH", pineHi: "pineHiH", pineTip: "pineTipH", path: "pathH", water: "waterH", ripple: "rippleH" },
                   shrine: { grass: "grassS", grassDry: "grassDryS", tall: "tallS", pine: "pineS", pineHi: "pineHiS", pineTip: "pineTipS", path: "pathS", water: "waterS", ripple: "rippleS" },
                   citadel: { wall: "wallC", wallHi: "wallHiC", mortar: "mortarC", stone: "stoneC", moss: "mossC" } };
function withPal(pal, fn) {
  const sw = PAL_SWAP[pal]; if (!sw) return fn();
  const saved = {}; for (const k in sw) { saved[k] = C[k]; C[k] = C[sw[k]]; }
  try { return fn(); } finally { for (const k in saved) C[k] = saved[k]; }
}

// ---------------------------------------------------------------- canvas buffer
class Paint {
  constructor(w, h) { this.w = w; this.h = h; this.c = new Float32Array(w * h * 3); this.solid = new Uint8Array(w * h); this.lock = new Uint8Array(w * h); this.base = new Uint16Array(w * h); this.curBase = 0; }
  set(x, y, col) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 3; this.c[i] = col[0]; this.c[i + 1] = col[1]; this.c[i + 2] = col[2]; this.base[y * this.w + x] = this.curBase; }
  get(x, y) { const i = (y * this.w + x) * 3; return [this.c[i], this.c[i + 1], this.c[i + 2]]; }
  mul(x, y, k) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 3; this.c[i] *= k; this.c[i + 1] *= k; this.c[i + 2] *= k; }
  add(x, y, col, a) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 3; this.c[i] += col[0] * a; this.c[i + 1] += col[1] * a; this.c[i + 2] += col[2] * a; }
  // Snap to the palette. Strength = dither amplitude per channel.
  toCanvas(strength = 26, mask) {
    const cv = document.createElement("canvas"); cv.width = this.w; cv.height = this.h;
    const g = cv.getContext("2d"), img = g.createImageData(this.w, this.h), d = img.data;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const p = y * this.w + x; if (mask && !mask[p]) continue;
      const o = BAYER4[(y & 3) * 4 + (x & 3)] * strength, i = p * 3;
      const r = this.c[i] + o, gg = this.c[i + 1] + o, b = this.c[i + 2] + o;
      let best = 0, bd = 1e9;
      for (let k = 0; k < PALETTE.length; k++) {
        const q = PALETTE[k], dr = r - q[0], dg = gg - q[1], db = b - q[2], dd = dr * dr * 0.9 + dg * dg * 1.2 + db * db * 0.8;
        if (dd < bd) { bd = dd; best = k; }
      }
      const q = PALETTE[best]; d[p * 4] = q[0]; d[p * 4 + 1] = q[1]; d[p * 4 + 2] = q[2]; d[p * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0); return cv;
  }
}

// ---------------------------------------------------------------- ground shaders (x, y in map pixels)
function shGrass(x, y, s) {
  // soft mottled turf (no streaks), with small scattered tufts: two light tips over a dark root
  const big = fbm(x / 46, y / 46, s, 3), patch = fbm(x / 11, y / 11, s + 3, 2), fine = h2(x >> 1, y >> 1, s + 7), hh = h2(x, y, s + 11);
  let t = 0.44 + (big - 0.5) * 0.3 + (patch - 0.5) * 0.2 + (fine - 0.5) * 0.07;
  if (hh > 0.992) t += 0.22; else if (hh < 0.012) t -= 0.16;
  const cx = Math.floor(x / 7), cy = Math.floor(y / 6), hv = h2(cx, cy, s + 17);
  if (hv < 0.42 + (patch - 0.5) * 0.5) {
    const ox = cx * 7 + 2 + Math.floor(h2(cy, cx, s + 18) * 4), oy = cy * 6 + 2 + Math.floor(h2(cx + 9, cy, s + 19) * 3), dx = x - ox, dy = y - oy;
    if (dy === -2 && (dx === -1 || dx === 2)) t += 0.26;
    else if (dy === -1 && (dx === -1 || dx === 0 || dx === 2)) t += 0.17;
    else if (dy === 0 && dx >= -1 && dx <= 1) t += 0.06;
    else if (dy === 1 && dx >= -1 && dx <= 2) t -= 0.17;
  }
  return fbm(x / 22 + 40, y / 22, s + 13) > 0.76 ? grad(C.grassDry, t * 0.8 + 0.2) : grad(C.grass, t);
}
function shTall(x, y, s) {   // shaded undergrowth; the tufts themselves are stamped on top per tile
  const clump = fbm(x / 6, y / 6, s + 22, 2), hh = h2(x, y, s + 23);
  return grad(C.tall, 0.12 + clump * 0.3 + (hh > 0.9 ? 0.1 : 0));
}
function shPath(x, y, s) {
  let t = 0.38 + (fbm(x / 11, y / 11, s + 31, 3) - 0.5) * 0.5 + (h2(x, y, s + 32) - 0.5) * 0.12;
  cellN(x, y, 5, s + 33);
  const r = 0.9 + CID * 1.3;
  if (CID > 0.5 && CD1 < r) t = 0.55 + ((CCX - x) + (CCY - y)) * 0.12;
  else if (CID > 0.5 && CD1 < r + 1.2 && y > CCY) t -= 0.16;
  return grad(C.path, t);
}
function shCobble(x, y, s) {
  cellN(x * 1.15, y, 5.5, s + 41);
  if (CD2 - CD1 < 1.15) return fbm(x / 9, y / 9, s + 42) > 0.6 ? grad(C.moss, h2(x, y, s) * 0.9) : C.mortar;
  let t = 0.3 + CID * 0.35 + ((CCX - x * 1.15) + (CCY - y)) * 0.045 + (h2(x, y, s + 43) - 0.5) * 0.12;
  if (CD2 - CD1 < 2.1 && (x * 1.15 > CCX || y > CCY)) t -= 0.12;
  return grad(C.stone, t);
}
function shFlag(x, y, s) {      // great flagstones, dark grout
  const row = Math.floor(y / 14), off = (row % 2) * 13, col = Math.floor((x + off) / 26), lx = (x + off) % 26, ly = y % 14;
  if (ly === 0 || lx === 0) return C.ink;
  let t = 0.3 + h2(col, row, s + 95) * 0.4 + (fbm(x / 7, y / 7, s + 96, 2) - 0.5) * 0.3;
  if (ly === 1 || lx === 1) t += 0.14; if (ly === 13 || lx === 25) t -= 0.14;
  if (vn(x * 0.3, y * 0.9, s + 97) > 0.86) return C.ink;
  return grad(C.stone, t);
}
function shInlay(x, y, s) {     // citadel flagstones, with a sunburst of gold inlay centred on the hall
  const base = shFlag(x, y, s), cx = 20 * 16 + 8, cy = 10 * 16 + 8, d = Math.hypot(x - cx, y - cy);
  if (d > 78) return base;
  const a = Math.atan2(y - cy, x - cx), ring = Math.abs(d - 74) < 1.6 || Math.abs(d - 60) < 1.1, ray = d < 60 && d > 14 && Math.abs(((a + Math.PI) * 6 / Math.PI) % 1 - 0.5) < 0.03 + (60 - d) / 1000;
  const dark = d < 72 && d > 62;
  if (ring || ray) return grad(C.throne, 0.6 + (h2(x, y, s) - 0.5) * 0.2);
  if (dark) return base.map(v => v * 0.82);
  return base;
}
function shCarpet(x, y, s) {    // the runner to the throne: deep velvet, gilt edge
  const lx = x % 16;
  if (lx === 0 || lx === 15) return C.ink; if (lx === 1 || lx === 14) return C.throne[2];
  return grad(C.velvet, 0.35 + (fbm(x / 5, y / 9, s + 98, 2) - 0.5) * 0.5 + (y % 2 ? 0.05 : 0));
}
function shAsh(x, y, s) {
  let t = 0.45 + (fbm(x / 15, y / 15, s + 51, 3) - 0.5) * 0.6 + (vn(x * 0.5, y * 0.5, s + 52) - 0.5) * 0.25;
  const e = h2(x, y, s + 53);
  if (e > 0.996) return C.ember[2]; if (e > 0.99) return C.ember[0];
  return grad(C.ash, t);
}
function shWater(x, y, s, ph) {
  const n = fbm(x / 18, y / 9, s + 61, 3);
  let t = 0.45 + (n - 0.5) * 0.4 + y % 3 * 0.0;
  const rip = Math.sin(x * 0.42 + n * 7 + y * 1.9 + ph * 2.1);
  if (rip > 0.93 && h2(x, y >> 1, s + 62) > 0.4) return C.ripple;
  if (rip > 0.75) t += 0.18;
  return grad(C.water, t);
}
function shRuin(x, y, s) {      // old cut stone, half swallowed by moss and ivy
  const row = Math.floor(y / 8), off = Math.floor(h2(row, 0, s + 81) * 10), bx = Math.floor((x + off) / 11), lx = (x + off) % 11, ly = y % 8;
  const moss = fbm(x / 7, y / 7, s + 82, 3), ivy = fbm(x / 4, y / 13, s + 83, 2);
  if (ivy > 0.64 && h2(x, y, s + 84) > 0.35) return grad(C.tall, 0.3 + h2(y, x, s) * 0.5);
  if (moss > 0.6) return grad(C.tall, 0.15 + (moss - 0.6) * 2);
  if (ly === 0 || lx === 0) return C.ink;
  let t = 0.32 + h2(bx, row, s + 85) * 0.4 + (fbm(x / 6, y / 6, s + 86, 2) - 0.5) * 0.3;
  if (ly === 1 || lx === 1) t += 0.22; if (ly === 7) t -= 0.22;
  if (vn(x * 0.5, y * 1.3, s + 87) > 0.84) return C.ink;
  return grad(C.ruin, t);
}
function shRock(x, y, s) {      // cliff face: faceted strata, lit from above
  cellN(x, y * 0.55, 9, s + 88);
  const edge = CD2 - CD1 < 1.1, strata = fbm(x / 30, y / 4, s + 89, 2);
  if (edge) return grad(C.rock, 0.05 + h2(x, y, s) * 0.15);
  let t = 0.28 + CID * 0.4 + ((CCY - y * 0.55) * 0.06) + (strata - 0.5) * 0.35 + (h2(x, y, s + 90) - 0.5) * 0.1;
  if (CD2 - CD1 < 2.2 && y * 0.55 < CCY) t += 0.18;
  if (fbm(x / 9, y / 9, s + 91) > 0.68) return grad(C.tallS || C.tall, 0.3 + t * 0.4);
  return grad(C.rock, t);
}
function shWall(x, y, s) {
  const row = Math.floor(y / 7), off = Math.floor(h2(row, 0, s + 71) * 14), bx = Math.floor((x + off) / 13), lx = (x + off) % 13, ly = y % 7;
  if (ly === 0 || lx === 0) return C.mortar;
  let t = 0.35 + h2(bx, row, s + 72) * 0.35 + (fbm(x / 6, y / 6, s + 73, 2) - 0.5) * 0.35;
  if (ly === 1 || lx === 1) return C.wallHi.map((v, i) => v * 0.6 + grad(C.wall, t)[i] * 0.4);
  if (ly === 6) t -= 0.2;
  const crack = vn(x * 0.4, y * 1.5, s + 74);
  if (crack > 0.82 && h2(bx, row, s + 75) > 0.6) return C.mortar;
  if (fbm(x / 10, y / 5, s + 76) > 0.66) return grad(C.moss, t * 0.8);
  return grad(C.wall, t);
}

// ---------------------------------------------------------------- structures painted per tile
function paintTileDetail(P, c, tx, ty, s, map) {
  const X = tx * 16, Y = ty * 16, px = (lx, ly, col) => P.set(X + lx, Y + ly, col);
  const tile = (x, y) => (map.m[y] && map.m[y][x]) || "T";
  if (c === "r") {           // standing rune stone, carved light still burning in the grooves
    const hgt = 20 + Math.floor(h2(tx, ty, s) * 5), lean = h2(ty, tx, s) > 0.5 ? 1 : -1;
    for (let y = 16 - hgt; y < 16; y++) for (let x = 3; x < 13; x++) {
      const q = (16 - y) / hgt, hw = 4.6 - q * 1.6 + (vn((tx * 16 + x) * 0.6, (ty * 16 + y) * 0.6, s) - 0.5) * 1.2, cx = 8 + lean * q * 1.2;
      if (Math.abs(x - cx) > hw + 1) continue;
      if (Math.abs(x - cx) > hw) { px(x, y, C.ink); continue; }
      let col = grad(C.rock, 0.35 + (cx - x) * 0.08 + (h2(x, y + ty, s) - 0.5) * 0.25);
      if (x < cx - hw + 1.2) col = C.rockHi; if (y >= 14) col = grad(C.rock, 0.1);
      px(x, y, col);
    }
    for (let i = 0; i < 5; i++) { const ry = 16 - hgt + 4 + i * 3, rx = 7 + ((i * 3 + tx) % 3) - 1; px(rx, ry, C.rune[1]); px(rx + (i % 2 ? 1 : -1), ry, C.rune[0]); px(rx, ry + 1, C.rune[i === 2 ? 2 : 0]); }
    px(8, 16 - hgt - 1, C.ink);
  } else if (c === "I") {    // a hall column: fluted shaft two tiles tall, gilt capital and base
    for (let y = -14; y < 16; y++) for (let x = 2; x < 14; x++) {
      const cap = y < -10 || y > 12, hw = cap ? 6 : 4.5, cx = 8;
      if (Math.abs(x - cx + 0.5) > hw) continue;
      if (Math.abs(x - cx + 0.5) > hw - 1) { px(x, y, C.ink); continue; }
      if (cap) { px(x, y, y === -14 || y === 15 ? C.ink : grad(C.throne, 0.55 + (cx - x) * 0.04 + (y < 0 ? 0.1 : -0.05))); continue; }
      const flute = Math.floor((x - 4) / 2.2), t = 0.25 + (1 - Math.abs(x - 7.5) / 4.5) * 0.45 + ((x - 4) % 2.2 < 1 ? 0.08 : -0.06) + (vn(X + x, (Y + y) * 0.3, s) - 0.5) * 0.12;
      px(x, y, grad(C.stone, t));
    }
    px(8, -15, C.ink); px(7, -15, C.ink);
  } else if (c === "A") {    // a stone sentinel on a plinth: an armoured figure, hands on a planted sword
    for (let y = 9; y < 16; y++) for (let x = 1; x < 15; x++) px(x, y, x === 1 || x === 14 || y === 15 || y === 9 ? C.ink : grad(C.stone, 0.32 - (y - 9) * 0.02 + (x < 3 ? 0.1 : 0)));
    const body = (lx, ly, hw, t) => { for (let x = -hw; x <= hw; x++) px(lx + x, ly, Math.abs(x) === hw ? C.ink : grad(C.stone, t + (0.5 - Math.abs(x) / (hw + 1)) * 0.3)); };
    for (let y = -13; y < -8; y++) body(8, y, y < -12 ? 2 : 3, 0.5);                              // helm
    px(7, -11, C.ink); px(9, -11, C.ink); px(8, -14, C.stoneHi || C.wallHi);
    for (let y = -8; y < -5; y++) body(8, y, 6, 0.45);                                           // pauldrons
    for (let y = -5; y < 5; y++) body(8, y, 4 + (y > 0 ? 1 : 0), 0.38 - y * 0.012);              // cuirass and skirt
    for (let y = 5; y < 9; y++) { body(6, y, 1, 0.3); body(10, y, 1, 0.3); }                      // greaves
    for (let y = -4; y < 9; y++) { px(8, y, y === -4 ? C.ink : C.iron[2]); }                     // the sword, point down
    px(6, -4, C.iron[1]); px(7, -4, C.iron[2]); px(9, -4, C.iron[2]); px(10, -4, C.iron[1]);
    px(7, -3, grad(C.stone, 0.55)); px(9, -3, grad(C.stone, 0.55));                              // gauntlets on the pommel
    for (let x = 1; x < 15; x++) px(x, 8, C.ink);
  } else if (c === "G") {    // a tall stained-glass window in the hall wall: a sunburst in gold over violet, lit from outside
    for (let y = -14; y < 15; y++) for (let x = 2; x < 14; x++) {
      const dx = x - 7.5, top = -14 + 5.5, arch = y < top ? Math.hypot(dx, y - top) <= 5.6 : true; if (!arch) continue;
      if (y >= top ? (x === 2 || x === 13) : Math.hypot(dx, y - top) > 4.6) { px(x, y, C.ink); continue; }
      const dd = Math.hypot(dx, y - 1), ray = Math.abs(((Math.atan2(y - 1, dx) + Math.PI) * 4 / Math.PI) % 1 - 0.5) < 0.1;
      const lead = (x % 4 === 1 && y % 5 !== 2) || y % 5 === 0;
      let col = dd < 2.2 ? hx("#fff0a0") : dd < 4.4 || ray ? grad(C.throne, 0.72 - dd * 0.025) : dd < 8 ? hx("#7a3cb2") : hx("#3a1a6a");
      if (lead) col = hx("#1a1424");
      px(x, y, col);
    }
    for (let x = 1; x < 15; x++) { px(x, 15, C.ink); px(x, 14, grad(C.stone, 0.5)); }
  } else if (c === "s") {    // stone lantern with a candle inside
    for (let y = 10; y < 16; y++) for (let x = 5; x < 11; x++) px(x, y, x === 5 || x === 10 || y === 15 ? C.ink : grad(C.stone, 0.25 + (y - 10) * 0.05));
    for (let x = 3; x < 13; x++) { px(x, 9, C.ink); px(x, 8, grad(C.stone, 0.6)); }
    for (let y = 1; y < 8; y++) for (let x = 4; x < 12; x++) {
      const win = y >= 3 && y <= 6 && x >= 6 && x <= 9;
      px(x, y, x === 4 || x === 11 || y === 1 ? C.ink : win ? (y === 6 ? hx("#e8903a") : hx("#fff4c8")) : grad(C.stone, 0.4 + (x - 4) * 0.03));
    }
    for (let x = 2; x < 14; x++) { px(x, 0, C.ink); px(x, -1, grad(C.stone, 0.75)); } for (let x = 4; x < 12; x++) px(x, -2, C.ink); px(7, -3, C.ink); px(8, -3, C.ink);
  } else if (c === "g") {    // glowing fungi in the moss
    for (let i = 0; i < 3; i++) {
      const fx = 2 + Math.floor(h2(tx, ty * 5 + i, s) * 11), fy = 5 + Math.floor(h2(tx * 3 + i, ty, s) * 8), big = h2(i, tx + ty, s) > 0.5, cap = big ? C.shroom[2] : C.shroom[0], hi = big ? C.shroom[3] : C.shroom[1];
      px(fx, fy + 1, C.shroom[1]); px(fx, fy + 2, grad(C.tall, 0.2)); if (big) px(fx, fy + 3, grad(C.tall, 0.1));
      px(fx - 1, fy, cap); px(fx, fy, hi); px(fx + 1, fy, cap); if (big) { px(fx - 2, fy, C.ink); px(fx + 2, fy, C.ink); px(fx - 1, fy - 1, cap); px(fx, fy - 1, hi); px(fx + 1, fy - 1, cap); px(fx, fy - 2, C.ink); }
    }
  } else if (c === "Y") {    // the throne: gilt sunburst back, velvet seat
    for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8, len = i % 2 ? 9 : 13; for (let k = 4; k < len; k++) px(8 + Math.cos(a) * k, 2 + Math.sin(a) * k, k === len - 1 ? C.throne[4] : grad(C.throne, 0.55 + k * 0.03)); }
    for (let y = -12; y < 4; y++) for (let x = 2; x < 14; x++) { const d = Math.hypot(x - 7.5, y + 4); if (d < 6.2) px(x, y, d > 5.2 ? C.ink : d < 2 ? C.throne[4] : grad(C.throne, 0.9 - d * 0.1)); }
    for (let y = 3; y < 16; y++) for (let x = 1; x < 15; x++) px(x, y, x === 1 || x === 14 || y === 15 ? C.ink : y < 6 || x < 4 || x > 11 ? grad(C.throne, 0.35 + (y - 3) * 0.02) : grad(C.velvet, 0.4 + (y - 6) * 0.06));
    for (let y = 16; y < 19; y++) for (let x = -2; x < 18; x++) px(x, y, y === 18 || x === -2 || x === 17 ? C.ink : grad(C.throne, 0.3));
  } else if (c === "F") {           // palisade of sharpened stakes
    for (let lx = 0; lx < 16; lx++) {
      const st = lx % 4, top = st === 1 || st === 2 ? 1 : 3;
      for (let ly = 0; ly < 16; ly++) {
        if (st === 3 || ly < top) continue;
        const t = (st === 0 ? 0.65 : st === 1 ? 0.5 : 0.3) + (vn((X + lx) * 0.6, (Y + ly) * 0.2, s) - 0.5) * 0.35 - (ly > 12 ? 0.2 : 0);
        px(lx, ly, ly === top ? C.wood[4] : grad(C.wood, t));
      }
      if (st !== 3) { px(lx, 6, C.iron[1]); px(lx, 11, C.iron[1]); }
    }
    for (let lx = 0; lx < 16; lx++) for (let ly = 0; ly < 16; ly++) if (lx % 4 !== 3) P.solid[(Y + ly) * P.w + X + lx] = 1;
  } else if (c === "S") {    // sandbag wall
    for (let ly = 0; ly < 16; ly++) for (let lx = 0; lx < 16; lx++) {
      const row = Math.floor(ly / 5), off = row % 2 ? 4 : 0, bx = (lx + off) % 8, by = ly % 5;
      const e = Math.abs(bx - 3.5) / 4 + Math.abs(by - 2) / 3;
      if (e > 1.15) { px(lx, ly, C.ink); continue; }
      let t = 0.75 - e * 0.45 - (by - 1) * 0.08 + (h2(X + lx, Y + ly, s) - 0.5) * 0.15;
      px(lx, ly, grad(C.burlap, t));
    }
  } else if (c === "C") {    // supply crate
    for (let ly = 1; ly < 16; ly++) for (let lx = 1; lx < 15; lx++) {
      const edge = lx === 1 || lx === 14 || ly === 1 || ly === 15, top = ly < 5;
      let col;
      if (edge) col = C.ink;
      else if ((lx <= 3 || lx >= 12) && (ly <= 3 || ly >= 13)) col = C.iron[2];
      else if (top) col = grad(C.wood, 0.75 + (vn((X + lx) * 0.5, ly, s) - 0.5) * 0.3);
      else col = grad(C.wood, (ly % 4 === 0 ? 0.15 : 0.5) + (vn((X + lx) * 0.3, (Y + ly) * 2, s) - 0.5) * 0.3);
      px(lx, ly, col);
    }
    px(7, 9, C.ember[0]); px(8, 9, C.ember[0]); px(7, 10, C.ember[0]);
  } else if (c === "H") {    // plank bridge
    const railT = tile(tx, ty - 1) !== "H", railB = tile(tx, ty + 1) !== "H";
    for (let ly = 0; ly < 16; ly++) for (let lx = 0; lx < 16; lx++) {
      if ((railT && ly < 2) || (railB && ly > 13)) { px(lx, ly, ly === 0 || ly === 14 ? C.wood[3] : C.wood[1]); continue; }
      if (lx % 4 === 3) { px(lx, ly, C.ink); continue; }
      px(lx, ly, grad(C.wood, 0.4 + (lx % 4 === 0 ? 0.2 : 0) + (vn(lx + X, (Y + ly) * 0.25, s + 3) - 0.5) * 0.4));
    }
    px(1, 4, C.iron[3]); px(5, 11, C.iron[3]); px(9, 4, C.iron[3]); px(13, 11, C.iron[3]);
  } else if (c === "c") {    // shell crater
    for (let ly = -3; ly < 19; ly++) for (let lx = -3; lx < 19; lx++) {
      const dx = lx - 7.5, dy = (ly - 7.5) * 1.15, d = Math.hypot(dx, dy) + (vn((X + lx) / 3, (Y + ly) / 3, s) - 0.5) * 2.4;
      if (d > 10) continue;
      let col;
      if (d > 8) col = grad(C.ash, 0.75 - (dx + dy) * 0.02);
      else col = grad(C.ash, 0.05 + d / 8 * 0.35 + (dx + dy) * 0.025);
      P.set(X + lx, Y + ly, col);
    }
  } else if (c === "R") {    // rubble heap
    for (let ly = -2; ly < 18; ly++) for (let lx = -2; lx < 18; lx++) {
      if (Math.hypot(lx - 7.5, ly - 8) + (vn((X + lx) / 3, (Y + ly) / 3, s) - 0.5) * 4 > 9) continue;
      cellN(X + lx, Y + ly, 4, s + 2);
      if (CD2 - CD1 < 0.9) { P.set(X + lx, Y + ly, C.ink); continue; }
      P.set(X + lx, Y + ly, grad(C.stone, 0.25 + CID * 0.3 + ((CCX - X - lx) + (CCY - Y - ly)) * 0.1));
    }
  } else if (c === "d") {    // dead, splintered tree
    const tr = (x0, y0, x1, y1, w) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, ww = w * (1 - t * 0.6);
        for (let k = -ww; k <= ww; k += 0.5) { P.set(X + x + k, Y + y, k < -ww / 3 ? C.bark[3] : k > ww / 3 ? C.bark[0] : C.bark[2]); } } };
    for (let lx = 2; lx < 14; lx++) P.set(X + lx, Y + 15, C.ink);
    tr(8, 15, 8, 0, 2.2); tr(8, 7, 2, 1, 1); tr(8, 9, 14, 3, 1); tr(8, 3, 11, -4, 0.8); tr(6, 4, 4, -2, 0.7);
  } else if (c === "w") {    // barbed wire on posts
    for (const pxp of [2, 13]) for (let ly = 3; ly < 15; ly++) { px(pxp, ly, C.wood[2]); px(pxp + 1, ly, C.wood[0]); }
    for (let lx = 0; lx < 16; lx++) {
      for (const [base, ph] of [[7, 0], [10, 1.6]]) {
        const ly = Math.round(base + Math.sin((X + lx) * 0.7 + ph) * 2.2); px(lx, ly, h2(X + lx, ly, s + 1) > 0.7 ? C.ember[0] : C.iron[2]);
        if (h2(X + lx, ly, s) > 0.8) { px(lx, ly - 1, C.iron[1]); px(lx, ly + 1, C.ink); }
      }
    }
  } else if (c === "f") {    // ghost lilies
    for (let i = 0; i < 4; i++) {
      const fx = 2 + Math.floor(h2(tx, ty * 7 + i, s) * 12), fy = 3 + Math.floor(h2(tx * 5 + i, ty, s) * 10), col = C.flower[Math.floor(h2(tx, ty, s + i) * 3)];
      px(fx, fy + 1, C.tall[2]); px(fx, fy + 2, C.tall[1]); px(fx - 1, fy, col); px(fx + 1, fy, col); px(fx, fy - 1, col); px(fx, fy, C.flower[1]);
    }
  }
}

// ---------------------------------------------------------------- trees
function paintPine(P, x0, yb, h, w, s) {
  const tiers = h > 22 ? 4 : 3, outline = [];
  P.set(x0, yb, C.bark[1]); P.set(x0 - 1, yb, C.bark[2]); P.set(x0, yb - 1, C.bark[1]); P.set(x0 - 1, yb - 1, C.bark[2]); P.set(x0, yb + 1, C.ink); P.set(x0 - 1, yb + 1, C.ink);
  for (let i = 0; i < tiers; i++) {
    const top = yb - h + i * (h - 4) / tiers, bot = top + (h - 4) / tiers * 1.55, hw = w / 2 * (0.42 + i * (0.58 / (tiers - 1)));
    for (let y = Math.floor(top); y <= Math.floor(bot); y++) {
      const half = hw * (y - top) / (bot - top) + 0.5;
      for (let x = Math.floor(x0 - half - 1); x <= Math.ceil(x0 + half); x++) {
        const rel = (x - x0) / Math.max(1, half), lastRow = y >= Math.floor(bot) - (h2(x, y, s) > 0.5 ? 1 : 0);
        if (x < x0 - half - 0.5 || x > x0 + half) { P.set(x, y, C.ink); continue; }
        if (lastRow) { P.set(x, y, C.ink); P.set(x, y + 1, C.ink); continue; }
        let col;
        if (x <= x0 - half + 0.6) col = C.pineHi;
        else if (rel < -0.25) col = grad(C.pine, 0.75 + (h2(x, y, s + 1) > 0.7 ? 0.2 : 0));
        else if (rel < 0.3) col = grad(C.pine, 0.5 + ((x + y) & 1) * 0.15);
        else col = grad(C.pine, 0.2 + ((x + y) & 1) * 0.12);
        if (y === Math.floor(bot) - 2 && rel < 0 && h2(x, y, s + 4) > 0.55) col = C.pineTip;   // pale needle tips along each tier
        P.set(x, y, col);
      }
    }
  }
  P.set(x0, Math.floor(yb - h), C.pineTip); P.set(x0, Math.floor(yb - h) - 1, C.ink);
}
function paintBloomTree(P, cx, cy, s) {      // dark tree with drooping violet blossom
  for (let y = cy - 2; y < cy + 12; y++) for (let x = cx - 2; x <= cx + 1; x++) P.set(x, y, x === cx - 2 ? C.bark[3] : x === cx + 1 ? C.bark[0] : C.bark[2]);
  for (let x = cx - 4; x <= cx + 3; x++) P.set(x, cy + 12, C.ink);
  const blobs = [[0, -8, 9], [-8, -3, 7], [8, -3, 7], [-4, -12, 6], [5, -11, 6], [0, -1, 7]];
  for (const [bx, by, r] of blobs) for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = Math.hypot(x, y * 1.1) + (vn((cx + bx + x) / 2.5, (cy + by + y) / 2.5, s) - 0.5) * 3;
    if (d > r + 1) continue;
    if (d > r) { P.set(cx + bx + x, cy + by + y, C.ink); continue; }
    let t = 0.55 - (x + y) / r * 0.3 + (vn((cx + bx + x) * 0.7, (cy + by + y) * 0.7, s + 1) - 0.5) * 0.5;
    P.set(cx + bx + x, cy + by + y, grad(C.bloom, t));
  }
  for (let i = 0; i < 14; i++) {                // hanging strands
    const sx = cx - 14 + Math.floor(h2(i, cx, s) * 28), sy = cy - 2 + Math.floor(h2(cx, i, s) * 6), len = 3 + Math.floor(h2(i, i, s) * 6);
    for (let k = 0; k < len; k++) P.set(sx, sy + k, k === len - 1 ? C.bloom[4] : C.bloom[k % 2 ? 2 : 3]);
  }
}

// ---------------------------------------------------------------- the whole map
const NATURAL = new Set([".", ",", ";", "b", "p", "W", "T", "f", "Q", "P", "v"]);
function baseOf(c, map, tx, ty) {      // what ground lies under a structure tile: the most common natural neighbour
  if (c === "f") return ".";
  if (!"FSCwdRcrsgY".includes(c)) return c;
  const cnt = {};
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) {
    const n = map.m[ty + dy] && map.m[ty + dy][tx + dx]; if (n && ".,;bpPv".includes(n)) cnt[n] = (cnt[n] || 0) + 1;
  }
  return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || ".";
}
function paintMap(map) {
  if (map.interior) return paintInfirmary(map);
  return withPal(map.pal, () => paintMapInner(map));
}
function paintMapInner(map) {
  const m = map.m, tw = m[0].length, th = m.length, Wp = tw * 16, Hp = th * 16, s = map.seed || 7;
  const P = new Paint(Wp, Hp);
  const tileAt = (x, y) => { const tx = Math.floor(x / 16), ty = Math.floor(y / 16); return (m[ty] && m[ty][tx]) || "T"; };
  const water = [];
  // 1) ground, with organic borders between natural terrains
  for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
    let c = tileAt(x, y);
    if (NATURAL.has(c)) {
      const wx = x + (fbm(x / 9, y / 9, s + 91, 2) - 0.5) * 9, wy = y + (fbm(x / 9 + 50, y / 9, s + 92, 2) - 0.5) * 9;
      const cw = tileAt(Math.max(0, Math.min(Wp - 1, wx)), Math.max(0, Math.min(Hp - 1, wy)));
      if (NATURAL.has(cw)) c = cw;
    }
    c = baseOf(c, map, Math.floor(x / 16), Math.floor(y / 16));
    let col;
    if (c === "T" || c === "Q") col = C.floor;
    else if (c === ",") col = shPath(x, y, s);
    else if (c === ";") col = shTall(x, y, s);
    else if (c === "b") col = shAsh(x, y, s);
    else if (c === "p") col = shCobble(x, y, s);
    else if (c === "K" || c === "G") col = shWall(x, y, s);
    else if (c === "I" || c === "A") col = shFlag(x, y, s);
    else if (c === "M") col = shRuin(x, y, s);
    else if (c === "P") col = map.id === "citadel" ? shInlay(x, y, s) : shFlag(x, y, s);
    else if (c === "v") col = shCarpet(x, y, s);
    else if (c === "k") col = shRock(x, y, s);
    else if (c === "W") { col = shWater(x, y, s, 0); water.push(y * Wp + x); }
    else if (c === "H") col = shWater(x, y, s, 0);
    else col = shGrass(x, y, s);
    P.set(x, y, col);
    if (c === "K" || c === "G" || c === "T" || c === "Q" || c === "M" || c === "k") P.solid[y * Wp + x] = 1;
  }
  // cliff blocks: a lit lip along the top edge, a dark foot along the bottom
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) if (m[ty][tx] === "k") {
    const up = m[ty - 1] && m[ty - 1][tx] === "k", down = m[ty + 1] && m[ty + 1][tx] === "k", left = m[ty][tx - 1] === "k", right = m[ty][tx + 1] === "k";
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const X = tx * 16 + x, Y = ty * 16 + y; let k = 1;
      if (!up && y < 2) k = y === 0 ? 1.9 : 1.45; else if (!down && y > 12) k = y === 15 ? 0.35 : 0.6;
      if (!left && x === 0) k *= 1.3; if (!right && x === 15) k *= 0.6;
      if (k !== 1) P.mul(X, Y, k);
    }
  }
  // banks: darken land right next to water
  for (const i of water) { const x = i % Wp, y = (i / Wp) | 0;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const c = tileAt(x + dx, y + dy); if (c !== "W" && c !== "H") P.set(x + dx, y + dy, C.mud[(x + y) & 1]); } }
  // 1b) tall-grass blades, baked in under anything that stands on top of them
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) if (m[ty][tx] === ";") {
    const v = (tx * 7 + ty * 3) % 4, d = tallFor(map).data[v];
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const k = (j * 16 + i) * 4; if (d[k + 3]) P.set(tx * 16 + i, ty * 16 + j, [d[k], d[k + 1], d[k + 2]]); }
  }
  // 2) structures
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {
    const c = m[ty][tx];
    P.curBase = "FSCdrsYIA".includes(c) ? ty * 16 + 15 : 0;
    if ("FSCHcRdwfrsgYIAG".includes(c)) paintTileDetail(P, c, tx, ty, s + tx * 3 + ty, map);
    P.curBase = 0;
    if ("FSCrsYIAG".includes(c)) for (let y = ty * 16; y < ty * 16 + 16; y++) for (let x = tx * 16; x < tx * 16 + 16; x++) P.solid[y * Wp + x] = 1;
  }
  // 3) static props (houses, tents, gate, banners, signs) drawn into a layer, night-graded and composited
  const layer = document.createElement("canvas"); layer.width = Wp; layer.height = Hp;
  const lg = layer.getContext("2d"); lg.imageSmoothingEnabled = false;
  for (const tn of map.tents) { if (tn.kind === "house") drawHouse(lg, tn, 0, 0, 0); else if (tn.kind !== "hall" && tn.kind !== "tent") drawTent(lg, tn, 0, 0); }
  for (const pr of map.props) {
    if (pr.kind === "sign") drawSign(lg, pr.x * 16, pr.y * 16);
    else if (pr.kind === "gate") drawGate(lg, pr, 0, 0, Game.flags.beat_general);
    else if (pr.kind === "banner") drawBanner(lg, pr, 0, 0, 0);
  }
  const ld = lg.getImageData(0, 0, Wp, Hp).data;
  for (let i = 0; i < Wp * Hp; i++) {
    const a = ld[i * 4 + 3] / 255; if (!a) continue;
    let r = ld[i * 4], g = ld[i * 4 + 1], b = ld[i * 4 + 2];
    const emissive = (r > 240 && g > 200 && b < 120) || (r > 250 && g > 235 && b > 150 && b < 200);
    if (!emissive && map.mood !== "day") { const l = (r + g + b) / 3; if (l > 200) { r *= 0.78; g *= 0.78; b *= 0.82; } r = r * 0.3 + l * 0.06 + 6; g = g * 0.32 + l * 0.06 + 7; b = b * 0.46 + l * 0.08 + 16; }
    const x = i % Wp, y = (i / Wp) | 0, cur = P.get(x, y);
    P.set(x, y, [cur[0] * (1 - a) + r * a, cur[1] * (1 - a) + g * a, cur[2] * (1 - a) + b * a]);
    if (a > 0.5) P.solid[i] = 2;
  }
  for (const tn of map.tents) for (let y = tn.y * 16 + 6; y < (tn.y + tn.h) * 16; y++) for (let x = tn.x * 16; x < (tn.x + tn.w) * 16; x++) if (x >= 0 && y >= 0 && x < Wp && y < Hp) P.solid[y * Wp + x] = 1;
  // 4) contact shadows: light from the upper left, so shade falls down and to the right of solid things
  const sol = (x, y) => x >= 0 && y >= 0 && x < Wp && y < Hp && P.solid[y * Wp + x] === 1;
  for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
    if (P.solid[y * Wp + x]) continue;
    let k = 0;
    if (sol(x, y - 1) || sol(x - 1, y)) k = 0.5; else if (sol(x, y - 2) || sol(x - 2, y - 1)) k = 0.68; else if (sol(x, y - 3) || sol(x - 3, y - 2)) k = 0.82;
    if (k) { const c0 = P.get(x, y), i3 = (y * Wp + x) * 3; P.c[i3] = c0[0] * k * 0.92; P.c[i3 + 1] = c0[1] * k * 0.95; P.c[i3 + 2] = c0[2] * Math.min(1, k * 1.12); }
  }
  // 4b) detailed architecture
  const built = [];
  for (const tn of map.tents) {
    P.curBase = (tn.y + tn.h) * 16 - 1;
    if (tn.kind === "hall") built.push(...paintHall(P, tn, s + tn.x * 7)); else if (tn.kind === "tent") built.push(...paintTent(P, tn, s + tn.x * 7));
  }
  P.curBase = 0;
  // 5) forests: tiered pines on a jittered grid, painted back to front; bloom trees where marked
  const pines = [];
  for (let gy = 0; gy < Hp + 24; gy += 7) for (let gx = -4; gx < Wp + 8; gx += 8) {
    const x = gx + Math.floor(h2(gx, gy, s + 101) * 6), y = gy + Math.floor(h2(gx, gy, s + 102) * 5);
    if (tileAt(Math.max(0, Math.min(Wp - 1, x)), Math.max(0, Math.min(Hp - 1, y - 4))) !== "T") continue;
    if (y - 4 >= Hp) continue;
    pines.push([x, Math.min(y, Hp + 6), 20 + Math.floor(h2(x, y, s + 103) * 9), 13 + Math.floor(h2(y, x, s + 104) * 6)]);
  }
  pines.sort((a, b) => a[1] - b[1]);
  for (const [x, y, h, w] of pines) { P.curBase = Math.min(Hp + 40, y + 1); paintPine(P, x, y, h, w, s + x); }
  P.curBase = 0;
  const blooms = [];
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) if (m[ty][tx] === "Q" && (m[ty][tx - 1] !== "Q") && (!m[ty - 1] || m[ty - 1][tx] !== "Q")) blooms.push([tx * 16 + 16, ty * 16 + 18]);
  for (const [x, y] of blooms) { P.curBase = y + 12; paintBloomTree(P, x, y, s); }
  P.curBase = 0;
  // 6) warm light baked in: lamps, fires, braziers, windows, doors, tents
  const lights = [];
  lights.push(...built);
  for (const tn of map.tents) {
    if (tn.kind === "hall" || tn.kind === "tent") continue;
    if (tn.kind === "house") lights.push(...lightsForHouse(tn, 0, 0).map(L => ({ ...L, r: L.r * 1.25, y: L.y + 6 })));
    else lights.push({ x: tn.x * 16 + tn.w * 8, y: (tn.y + tn.h) * 16 + 2, r: 22, a: 0.45, col: tn.kind === "dominion" ? [230, 60, 50] : null });
  }
  for (const pr of map.props) {
    const X = pr.x * 16 + 8, Y = pr.y * 16 + 8;
    if (pr.kind === "fire") lights.push({ x: X, y: Y, r: 46, a: 1 });
    else if (pr.kind === "lamp") lights.push({ x: X, y: Y - 6, r: 34, a: 0.9 });
    else if (pr.kind === "brazier") lights.push({ x: X, y: Y, r: 40, a: 1, col: [255, 110, 50] });
  }
  for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) {              // rune stones, lanterns and fungi glow
    const c = m[ty][tx], X = tx * 16 + 8, Y = ty * 16 + 8;
    if (c === "r") lights.push({ x: X, y: Y - 6, r: 30, a: 0.8, col: [60, 230, 215] });
    else if (c === "G") lights.push({ x: X, y: Y + 22, r: 36, a: 0.7, col: [214, 150, 255] });
    else if (c === "s") lights.push({ x: X, y: Y - 4, r: 32, a: 0.9 });
    else if (c === "g") lights.push({ x: X, y: Y, r: 16, a: 0.6, col: [110, 240, 170] });
  }
  if (map.mood === "day") for (const L of lights) L.a *= L.r > 40 ? 0.45 : 0.25;
  for (const L of lights) {
    const col = L.col || C.warm;
    for (let y = Math.floor(L.y - L.r); y <= L.y + L.r; y++) for (let x = Math.floor(L.x - L.r); x <= L.x + L.r; x++) {
      if (x < 0 || y < 0 || x >= Wp || y >= Hp) continue;
      const d = Math.hypot(x - L.x, (y - L.y) * 1.25) / L.r; if (d >= 1) continue;
      const f = Math.pow(Math.min(1, (1 - d) * 1.5), 1.6) * L.a;
      const cur = P.get(x, y), lum = (cur[0] + cur[1] + cur[2]) / 3 / 110;
      const k = f * (0.5 - Math.max(0, lum - 0.7) * 0.35);
      P.add(x, y, col, k); if (f > 0.75) P.add(x, y, [80, 70, 30], (f - 0.75) * 0.6);
    }
  }
  map.lights = lights;
  // 7) snap to the palette
  const ground = P.toCanvas(14);
  // animated water frames, only water pixels
  const waterFrames = [1, 2].map(ph => {
    const Q = new Paint(Wp, Hp), mask = new Uint8Array(Wp * Hp);
    for (const i of water) { const x = i % Wp, y = (i / Wp) | 0; Q.set(x, y, shWater(x, y, s, ph)); mask[i] = 1; }
    for (const L of lights) for (const i of water) { const x = i % Wp, y = (i / Wp) | 0, d = Math.hypot(x - L.x, (y - L.y) * 1.25) / L.r; if (d < 1) Q.add(x, y, L.col || C.warm, (1 - d) * (1 - d) * L.a * 0.6); }
    return Q.toCanvas(14, mask);
  });
  const gdata = ground.getContext("2d").getImageData(0, 0, Wp, Hp).data;
  return { ground, water: [ground, ...waterFrames], base: P.base, gdata, w: Wp };
}

// Tall grass: each tile is three staggered rows of leafy tufts (4 arrangements x 2 sway frames), in each region's colours.
// Baked into the ground, and the lower half is redrawn over anything standing in it.
function makeTall(col) {
  const frames = [0, 1, 2, 3].map(v => [0, 1].map(f => mk(16, 16, x => {
    const tuft = (cx, base, hgt, k) => {
      const sway = f ? 1 : 0, tipC = h2(k, v, 8) > 0.7 ? col.tipB : col.tipA;
      for (const [bx, bh, lean] of [[-2, hgt - 2, -1], [2, hgt - 1, 1], [0, hgt, sway ? 1 : 0]]) for (let i = 0; i < bh; i++) {
        const q = i / (bh - 1 || 1), X = (cx + bx + Math.round(lean * q * 1.4 + (lean ? sway * q * 0.6 : 0)) + 32) % 16, Y = base - i; if (Y < 0) continue;
        R(x, i === bh - 1 ? tipC : q > 0.55 ? col.b3 : q > 0.25 ? col.b2 : col.b1, X, Y, 1, 1);
        if (i < bh - 1 && bx === 0) R(x, q > 0.5 ? col.b2 : col.mid, (X + 1) % 16, Y, 1, 1);
      }
      for (let i = -2; i <= 3; i++) R(x, col.shadow, (cx + i + 32) % 16, Math.min(15, base + 1), 1, 1);
    };
    let k = 0;
    for (const [base, off] of [[5, 2], [10, 5], [14, 0]]) for (let i = 0; i < 3; i++)
      tuft(off + i * 5 + Math.floor(h2(i + base, v, 5) * 3) - 1 + v, base - Math.floor(h2(v, i + base, 6) * 2), 5 + Math.floor(h2(i, base + v, 9) * 2), k++);
  })));
  frames.data = frames.map(v => v[0].getContext("2d").getImageData(0, 0, 16, 16).data);
  return frames;
}
const TALL_SETS = {
  day: makeTall({ tipA: "#8ed86c", tipB: "#c8f088", b3: "#56b85a", b2: "#3a9a4c", b1: "#287a44", mid: "#1f6a3c", shadow: "#17502f" }),
  hollow: makeTall({ tipA: "#5cb880", tipB: "#9ce0b0", b3: "#36805c", b2: "#28684e", b1: "#1e5442", mid: "#164236", shadow: "#0e3028" }),
  shrine: makeTall({ tipA: "#6aa0b0", tipB: "#a8d0dc", b3: "#427284", b2: "#345e70", b1: "#284c5e", mid: "#1e3a4c", shadow: "#162a3a" }),
};
const TALL_FG = TALL_SETS.day;
const tallFor = map => TALL_SETS[(map && map.pal) || "day"] || TALL_SETS.day;
const TALL_FG_DATA = TALL_FG.data;
