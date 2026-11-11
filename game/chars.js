// Characters: dark-fantasy sprites with a 32px body on a 48x48 canvas (room for weapon reach).
// Every frame is drawn from one posed rig, so proportions stay identical across idle, walk, attack and hurt.
// Parts are filled as flat regions, then shaded (light from top-left), separated by selective outlines,
// and wrapped in a 1px dark outline.
const CW = 48, LIFT = -2;
// Vertical squash: body compresses toward the feet, head a little less, so everyone stands ~28px tall.
const FEET_Y = 43, NECK_Y = 17, KB = 0.78, KH = 0.9, NECK_S = FEET_Y - (FEET_Y - NECK_Y) * KB;
const SY = y => y >= NECK_Y ? FEET_Y - (FEET_Y - y) * KB : NECK_S - (NECK_Y - y) * KH;                 // canvas size; feet sit on y=43, body centred on x=24
const OUTLINE = "#0d0a10";

// ramps: [light, base, shadow, deep]
const RAMP = {
  tunic:   ["#56607a", "#3c4356", "#2a2f3e", "#1a1d27"],
  leather: ["#8e6646", "#664831", "#463122", "#2a1c14"],
  boots:   ["#64483a", "#45322a", "#2e221c", "#1c1411"],
  gloves:  ["#4a3a34", "#332824", "#241c19", "#16110f"],
  white:   ["#d8d4cc", "#aca69c", "#7e786e", "#504c46"],
};
const CHAR_OPTS = {
  skin:   [["#e8c4a4", "#c89a7c", "#9c7058", "#6c4a3a"], ["#d0a07a", "#ac7c5a", "#845a40", "#5a3c2a"],
           ["#a8724e", "#86583a", "#643f28", "#422819"], ["#7c5038", "#5e3a28", "#42281c", "#2a1912"]],
  cloak:  [["#5e5868", "#3c3748", "#28242f", "#17141c"], ["#3c4866", "#2a334c", "#1d2336", "#121624"],
           ["#46523e", "#323b2c", "#232a1f", "#161a13"], ["#683438", "#4a2428", "#33181c", "#210e11"],
           ["#665e54", "#4a443c", "#34302a", "#221f1b"]],
  accent: [["#cc4646", "#9a2a32", "#681a22", "#420f17"], ["#d49c3e", "#a47026", "#704c1a", "#483010"],
           ["#3eaa9a", "#287a72", "#1a544e", "#0f3632"], ["#e4dccb", "#b8b0a0", "#86806e", "#585246"],
           ["#9460c4", "#6c4094", "#4a2a66", "#2e1a42"]],
  armor:  [["#ccd4e0", "#848ca2", "#535a6c", "#323744"], ["#c69860", "#926e3c", "#644a28", "#3e2e18"],
           ["#6a6c76", "#484a54", "#32333b", "#1f2026"]],
  eyes:   ["#ffc24a", "#8ee6ff", "#ff3a3a", "#c890ff"],
  hair:   [["#6e4a32", "#4e3222", "#362218", "#22150e"], ["#3a3a46", "#26262f", "#18181f", "#0e0e13"],
           ["#c8a460", "#9a7a40", "#6c542a", "#44341a"], ["#b0b0b8", "#84848e", "#5c5c66", "#3a3a42"],
           ["#9a4a30", "#743422", "#502418", "#32160e"]],
};
const CHAR_NAMES = { skin: ["Pale", "Tan", "Bronze", "Deep"], cloak: ["Charcoal", "Midnight", "Moss", "Oxblood", "Ash"],
                     accent: ["Crimson", "Ochre", "Teal", "Bone", "Violet"], armor: ["Gunmetal", "Bronze", "Black Iron"],
                     eyes: ["Ember", "Frost", "Blood", "Spirit"] };
const CHAR_KEYS = ["skin", "cloak", "accent", "armor", "eyes"];
function charSwatch(key, i) { const v = CHAR_OPTS[key][i]; return typeof v === "string" ? v : v[1]; }

// ---------------------------------------------------------------- rig
const HEXC = {};
const rgb = h => HEXC[h] || (HEXC[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const RIG_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
class Rig {
  constructor(size = CW, squash = true) { this.S = size; this.sq = squash; this.pid = new Int16Array(size * size).fill(-1); this.flat = []; this.parts = []; this.post = []; this.glows = []; this.ox = 0; this.oy = 0; }
  Y(v) { return this.sq ? SY(v) : v; }
  part(ramp, group) { this.parts.push({ ramp, group }); return this.parts.length - 1; }
  set(p, x, y, col) {
    x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.S || y >= this.S) return;
    const i = y * this.S + x; this.pid[i] = p; this.flat[i] = col;
  }
  poly(ramp, pts, group) {
    const p = this.part(ramp, group), P = pts.map(([x, y]) => [x + this.ox, this.Y(y + this.oy)]);
    const xs = P.map(q => q[0]), ys = P.map(q => q[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        const cx = x + 0.5, cy = y + 0.5; let inside = false;
        for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
          const [xi, yi] = P[i], [xj, yj] = P[j];
          if ((yi > cy) !== (yj > cy) && cx < (xj - xi) * (cy - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(p, x, y);
      }
    return p;
  }
  cap(ramp, ax, ay, bx, by, r, group) {
    const p = this.part(ramp, group); ax += this.ox; bx += this.ox; ay = this.Y(ay + this.oy); by = this.Y(by + this.oy);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.ceil(Math.max(ay, by) + r); y++)
      for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.ceil(Math.max(ax, bx) + r); x++) {
        const cx = x + 0.5, cy = y + 0.5, t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / L2));
        const ex = cx - (ax + t * dx), ey = cy - (ay + t * dy);
        if (ex * ex + ey * ey <= r * r) this.set(p, x, y);
      }
    return p;
  }
  rect(ramp, x0, y0, x1, y1, group) { return this.poly(ramp, [[x0, y0], [x1 + 1, y0], [x1 + 1, y1 + 1], [x0, y1 + 1]], group); }
  pixels(list) { const p = this.part(null); for (const [x, y, c] of list) this.set(p, x + this.ox, this.Y(y + this.oy + 0.5), c); return p; }
  dot(x, y, c, glow) { const q = [Math.floor(x + this.ox), Math.floor(this.Y(y + this.oy + 0.5)), c]; this.post.push(q); if (glow) this.glows.push(q); }
  render(flash) {
    const c = document.createElement("canvas"); c.width = c.height = this.S; const CW = this.S;
    const x2 = c.getContext("2d"), img = x2.createImageData(CW, CW), d = img.data, { pid, parts } = this;
    const at = (x, y) => (x < 0 || y < 0 || x >= CW || y >= CW) ? -1 : pid[y * CW + x];
    const put = (i, col) => { const [r, g, b] = rgb(col); d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; };
    for (let i = 0; i < CW * CW; i++) {
      const p = pid[i], x = i % CW, y = (i / CW) | 0;
      if (p < 0) { if (at(x - 1, y) >= 0 || at(x + 1, y) >= 0 || at(x, y - 1) >= 0 || at(x, y + 1) >= 0) put(i, OUTLINE); continue; }
      const P = parts[p];
      if (!P.ramp) { put(i, this.flat[i]); continue; }
      const same = q => q === p || (q >= 0 && P.group != null && parts[q].group === P.group);
      const behind = q => q >= 0 && q < p && !same(q);
      const u = at(x, y - 1), l = at(x - 1, y), dn = at(x, y + 1), r = at(x + 1, y);
      let k = 1;
      if (behind(u) || behind(l) || behind(dn) || behind(r)) k = 3;
      else if (!same(dn) || !same(r)) k = 2;
      else if (!same(u) || !same(l)) k = (u > p || l > p) ? 2 : 0;
      if (P.sph && k === 1) {           // rounded volume: light from upper left, ordered-dither band edges
        const [cx, cy, rx, ry] = P.sph, nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        const l = -(nx * 0.55 + ny * 0.8) + (RIG_BAYER[(y & 3) * 4 + (x & 3)] - 0.5) * 0.28;
        k = l > 0.38 ? 0 : l < -0.42 ? 2 : 1;
      }
      put(i, P.ramp[k]);
    }
    for (const [x, y, col] of this.post) if (x >= 0 && y >= 0 && x < CW && y < CW) put(y * CW + x, col);
    if (flash) for (let i = 0; i < CW * CW; i++) if (d[i * 4 + 3]) { d[i * 4] = 255 - (255 - d[i * 4]) * 0.25; d[i * 4 + 1] = 250 - (250 - d[i * 4 + 1]) * 0.3; d[i * 4 + 2] = 240 - (240 - d[i * 4 + 2]) * 0.35; }
    x2.putImageData(img, 0, 0);
    if (this.glows.length && !flash) {   // emissive layer drawn after world lighting so eyes burn in the dark
      const gl = document.createElement("canvas"); gl.width = gl.height = CW; const gx = gl.getContext("2d");
      for (const [x, y, col] of this.glows) { gx.fillStyle = col; gx.fillRect(x, y, 1, 1); }
      c.glow = gl;
    }
    return c;
  }
}

// ---------------------------------------------------------------- weapon
// Glaive: butt (x0,y0) to tip (x1,y1), axis-aligned. Long single blade, gold collar, accent ribbon.
function glaive(g, L, x0, y0, x1, y1) {
  const steel = ["#eef2fa", "#aab4c6", "#687286"], gold = ["#e8c870", "#b88c3a", "#7a5a22"];
  const px = [];
  const vert = x0 === x1, dir = vert ? Math.sign(y1 - y0) : Math.sign(x1 - x0);
  const len = Math.abs(vert ? y1 - y0 : x1 - x0);
  const at = (along, side) => vert ? [x1 + side, y1 - dir * along] : [x1 - dir * along, y1 + side];
  // shaft: dark ash wood with leather wraps
  for (let a = 7; a <= len; a++) px.push([...at(a, 0), a % 6 === 0 ? "#3a281a" : a % 2 ? "#5e4430" : "#4e3826"]);
  for (let a = len - 1; a <= len; a++) px.push([...at(a, 0), L.armor[1]]);           // butt cap
  const B = [[0, 0, 0], [1, -1, 0], [1, 0, 1], [2, -1, 0], [2, 0, 1], [2, 1, 2], [3, -1, 0], [3, 0, 1], [3, 1, 2],
             [4, -1, 0], [4, 0, 1], [4, 1, 2], [4, -2, 2], [5, 0, 2], [5, -1, 1]];
  for (const [a, s, k] of B) px.push([...at(a, vert ? s * (dir < 0 ? 1 : -1) : s), steel[k]]);
  px.push([...at(6, -1), gold[0]], [...at(6, 0), gold[1]], [...at(6, 1), gold[2]]);
  g.pixels(px);
  // ribbon tied below the collar
  const rib = L.accent || CHAR_OPTS.accent[0];
  g.pixels(vert ? [[...at(7, 1), rib[1]], [...at(8, 1), rib[1]], [...at(9, 2), rib[2]], [...at(10, 2), rib[2]]]
                : [[...at(7, 1), rib[1]], [...at(8, 2), rib[1]], [...at(9, 2), rib[2]], [...at(10, 3), rib[2]]]);
}
function swoosh(g, pts) { for (const [x, y, k] of pts) g.dot(x, y, k ? "#c8d4f0" : "#f4f8ff"); }

// ---------------------------------------------------------------- body parts
function legs(g, L, a, b, side) {
  for (const [lg, grp] of [[a, "legA"], [b, "legB"]]) {
    if (!lg) continue;
    let [hx, hy, kx, ky, fx, fy] = lg; hy += LIFT; ky += LIFT / 2;
    g.cap(L.pants, hx, hy, kx, ky, 1.75, grp);
    g.cap(RAMP.boots, kx, ky + 0.5, fx, fy - 2, 1.55, grp);
    if (side) g.poly(RAMP.boots, [[fx - 1.6, fy - 2.5], [fx + 1.2, fy - 2.5], [fx + 2.6, fy - 1], [fx + 2.6, fy + 0.6], [fx - 1.6, fy + 0.6]], grp);
    else g.poly(RAMP.boots, [[fx - 2, fy - 2.5], [fx + 2, fy - 2.5], [fx + 2.2, fy + 0.6], [fx - 2.2, fy + 0.6]], grp);
    g.poly(L.armor, [[kx - 1.6, ky - 1.2], [kx + 1.6, ky - 1.2], [kx + 1.3, ky + 1.3], [kx - 1.3, ky + 1.3]]);   // knee guard
  }
}
function arm(g, L, s, e, h, upper = true) {
  if (upper) g.cap(L.tunic, s[0], s[1], e[0], e[1], 1.45);
  g.cap(L.armor, e[0], e[1], h[0], h[1] - 0.6, 1.5);       // vambrace
  g.rect(RAMP.gloves, Math.round(h[0]) - 1, Math.round(h[1]) - 1, Math.round(h[0]) + 1, Math.round(h[1]));
}
function pauldron(g, L, m) {   // m = +1 sits on the viewer's right, -1 on the left
  const X = x => 24 + m * (x - 24);
  g.poly(L.armor, [[X(26), 19.5], [X(28.5), 18.6], [X(30.6), 19.4], [X(31.6), 21.6], [X(30.4), 22.2], [X(27), 21.6]]);
  g.poly(L.armor, [[X(28), 21.4], [X(31.6), 21.8], [X(32.1), 23.6], [X(29), 24.1]]);
  g.poly(L.armor, [[X(29), 23.5], [X(32.1), 23.5], [X(31.6), 25.6], [X(29.4), 25.6]]);
  g.dot(X(29), 20, L.armor[0]); g.dot(X(30.5), 22.6, L.armor[0]);
}

function headFront(g, L, P) {
  if (L.head === "hood") {
    g.poly(L.cloak, [[20.8, 13], [22, 11.2], [23.4, 9.8], [24.2, 8.4], [25.2, 9.9], [26.2, 11.2], [27.2, 13], [27.7, 16], [27.7, 18.6], [20.3, 18.6], [20.3, 16]]);
    g.pixels([[22, 13, "#08060b"], [23, 13, "#08060b"], [24, 13, "#08060b"], [25, 13, "#08060b"],
              ...[14, 15, 16].flatMap(y => [21, 22, 23, 24, 25, 26].map(x => [x, y, "#08060b"]))]);
    const e = P.hurt ? L.eyesDim : L.eyes;
    g.dot(22, 15, e, !P.hurt); g.dot(25, 15, e, !P.hurt); if (!P.hurt) { g.dot(22, 14, L.eyesDim); g.dot(25, 14, L.eyesDim); }
  } else if (L.head === "helm") {
    g.poly(L.armor, [[20.4, 13], [21.4, 11], [24, 9.8], [26.6, 11], [27.6, 13], [27.6, 18.8], [20.4, 18.8]]);
    g.poly(L.crest, [[23, 6.5], [25, 6.5], [24.6, 10.4], [23.4, 10.4]]);
    g.pixels([21, 22, 23, 24, 25, 26].map(x => [x, 15, "#08060b"]));
    g.dot(22, 15, L.eyes, true); g.dot(25, 15, L.eyes, true);
    g.dot(23, 17, L.armor[3]); g.dot(24, 17, L.armor[3]); g.dot(23, 18, L.armor[3]); g.dot(24, 18, L.armor[3]);
  } else {
    g.poly(L.skin, [[21, 12.5], [27, 12.5], [27.2, 16.5], [26, 18.6], [22, 18.6], [20.8, 16.5]]);
    g.poly(L.hair, [[20.3, 13], [21.3, 10.6], [24, 9.8], [26.7, 10.6], [27.7, 13], [27.7, 15.6], [26.6, 13.6], [21.4, 13.6], [20.3, 15.6]]);
    g.dot(22, 15, "#1a1218"); g.dot(25, 15, "#1a1218"); g.dot(22, 14, L.hair[2]); g.dot(25, 14, L.hair[2]);
    if (L.beard) g.poly(L.hair, [[21.5, 16.5], [26.5, 16.5], [26, 18.8], [24, 19.6], [22, 18.8]]);
    else g.dot(24, 17, L.skin[2]);
  }
}
function headBack(g, L) {
  if (L.head === "hood") {
    g.poly(L.cloak, [[20.8, 13], [22, 11.2], [23.4, 9.8], [24.2, 8.4], [25.2, 9.9], [26.2, 11.2], [27.2, 13], [27.7, 16], [27.4, 18.8], [24, 21.4], [20.6, 18.8], [20.3, 16]]);
    for (let y = 12; y <= 19; y++) g.dot(24, y, L.cloak[2]);
  } else if (L.head === "helm") {
    g.poly(L.armor, [[20.4, 13], [21.4, 11], [24, 9.8], [26.6, 11], [27.6, 13], [27.6, 18.8], [20.4, 18.8]]);
    g.poly(L.crest, [[23, 6.5], [25, 6.5], [24.6, 10.4], [23.4, 10.4]]);
  } else {
    g.poly(L.skin, [[21.5, 16], [26.5, 16], [26, 18.8], [22, 18.8]]);
    g.poly(L.hair, [[20.3, 13], [21.3, 10.6], [24, 9.8], [26.7, 10.6], [27.7, 13], [27.6, 17.4], [24, 18], [20.4, 17.4]]);
  }
}
function headSide(g, L, P) {
  if (L.head === "hood") {
    g.poly(L.cloak, [[20.2, 14], [20.6, 11.4], [19.8, 9.4], [22.6, 9.8], [24.6, 10.1], [26.4, 10.7], [27.9, 12.4], [28.4, 15.4], [28.2, 18.6], [22, 19.2], [19.6, 18.4], [19.4, 16.4]]);
    g.pixels([...[13, 14, 15, 16].flatMap(y => [25, 26, 27].map(x => [x, y, "#08060b"])), [24, 14, "#08060b"], [24, 15, "#08060b"], [24, 16, "#08060b"]]);
    g.dot(26, 15, P.hurt ? L.eyesDim : L.eyes, !P.hurt); if (!P.hurt) g.dot(26, 14, L.eyesDim);
    g.dot(22, 13, L.cloak[2]); g.dot(21, 14, L.cloak[2]);
  } else if (L.head === "helm") {
    g.poly(L.armor, [[20.4, 13], [21.6, 11], [24, 9.8], [26.6, 10.6], [28, 12.6], [28.4, 16], [27.8, 18.8], [20.6, 18.8]]);
    g.poly(L.crest, [[22.4, 6.5], [24.4, 6.8], [24.6, 10.4], [22.4, 10.6]]);
    g.pixels([25, 26, 27].map(x => [x, 15, "#08060b"])); g.dot(26, 15, L.eyes, true);
    g.dot(27, 17, L.armor[3]); g.dot(26, 17, L.armor[3]);
  } else {
    g.poly(L.skin, [[22.5, 12], [27.4, 12.4], [28.2, 15.4], [27.6, 17.4], [26.4, 18.8], [23, 18.8], [22, 16]]);
    g.poly(L.hair, [[20.4, 13.2], [21.6, 10.8], [24, 9.8], [26.6, 10.4], [28, 12.4], [27.2, 13.4], [24.6, 13.4], [24, 16.4], [22.4, 18], [20.4, 17]]);
    g.dot(26, 15, "#1a1218"); g.dot(26, 14, L.hair[2]);
    if (L.beard) g.poly(L.hair, [[24, 16.6], [27.8, 16.6], [27, 19], [24, 19.4]]);
  }
}

// ---------------------------------------------------------------- full figure, per facing
function torsoFront(g, L) {
  g.poly(L.tunic, [[19.5, 20], [28.5, 20], [28, 26], [27.5, 30.5], [20.5, 30.5], [20, 26]]);
  g.poly(RAMP.leather, [[20, 22], [28, 22], [27.5, 29.4], [20.5, 29.4]]);
  g.poly(L.armor, [[20.8, 20.4], [27.2, 20.4], [26.8, 24.4], [24, 25.6], [21.2, 24.4]]);
  g.cap(RAMP.leather, 21, 21.5, 27, 28, 0.62);
  g.poly(RAMP.gloves, [[20, 28.6], [28, 28.6], [28, 30.6], [20, 30.6]]);
  g.dot(23, 29, "#e0c068"); g.dot(24, 29, "#b88c3a"); g.dot(23, 30, "#9a7430"); g.dot(24, 30, "#6e5020");
  g.poly(RAMP.leather, [[19.8, 30.6], [23.4, 30.6], [23.4, 33.8], [20.4, 33.2]]);
  g.poly(RAMP.leather, [[24.6, 30.6], [28.2, 30.6], [27.6, 33.2], [24.6, 33.8]]);
}
function figFront(g, L, P) {
  const U = P.U, D = P.DX;
  g.ox = D; g.oy = U + LIFT;
  const sw = P.sway;
  if (L.cloak) g.poly(L.cloak, [[19, 20], [29, 20], [30.5, 30], [31 + sw, 39], [29.6, 40.2], [28, 38.6], [20, 38.6], [18.4, 40.2], [17 + sw, 39], [17.5, 30]]);
  if (P.spearBack && L.weapon) glaive(g, L, ...P.spear);
  g.ox = 0; g.oy = 0;
  legs(g, L, P.la, P.lb, false);
  g.ox = D; g.oy = U + LIFT;
  torsoFront(g, L);
  arm(g, L, ...P.aa);
  arm(g, L, ...P.ab);
  if (!P.spearBack && L.weapon) { glaive(g, L, ...P.spear); const h = P.aa[2]; g.rect(RAMP.gloves, Math.round(h[0]) - 1, Math.round(h[1]) - 1, Math.round(h[0]) + 1, Math.round(h[1])); if (P.twoHand) { const h2 = P.ab[2]; g.rect(RAMP.gloves, Math.round(h2[0]) - 1, Math.round(h2[1]) - 1, Math.round(h2[0]) + 1, Math.round(h2[1])); } }
  if (L.pauldron) pauldron(g, L, 1);
  if (L.drape && L.cloak) g.poly(L.cloak, [[17.4, 20], [19, 18.8], [23, 19], [23.2, 22], [21.6, 25.4], [20.4, 28.2], [19.2, 26.6], [17.8, 28.6], [16.4, 25], [16.4, 22]]);
  g.ox = D + (P.HX || 0); g.oy = U + LIFT + (P.HY || 0);
  headFront(g, L, P);
  if (L.accent) {
    g.poly(L.accent, L.head === "hood" ? [[20.4, 16.6], [27.6, 16.6], [28.1, 18.6], [27.6, 20.6], [20.4, 20.6], [19.9, 18.6]]
                                       : [[20.6, 18.4], [27.4, 18.4], [27.6, 20.6], [20.4, 20.6]]);
    g.ox = D; g.oy = U + LIFT;
    const t = P.tail || 0;
    g.poly(L.accent, [[26, 19.6], [27.6, 20], [27.6 + t, 23.6], [26.8 + t, 26], [25.6, 23.4]]);
  }
  g.ox = 0; g.oy = 0;
  if (P.swoosh) swoosh(g, P.swoosh);
}
function figBack(g, L, P) {
  const U = P.U, D = P.DX, sw = P.sway;
  g.ox = 0; g.oy = 0;
  legs(g, L, P.la, P.lb, false);
  g.ox = D; g.oy = U + LIFT;
  if (P.raised && L.weapon) { arm(g, L, ...P.aa); arm(g, L, ...P.ab); glaive(g, L, ...P.spear); }
  g.poly(L.tunic, [[19.5, 20], [28.5, 20], [28, 26], [27.5, 30.5], [20.5, 30.5], [20, 26]]);
  g.poly(RAMP.gloves, [[20, 28.6], [28, 28.6], [28, 30.6], [20, 30.6]]);
  if (!P.raised) { arm(g, L, ...P.aa); }
  if (L.cloak) {
    g.poly(L.cloak, [[19.4, 19], [28.6, 19], [30, 26], [31 + sw, 38], [29.6, 40.2], [28, 38.6], [26, 40.2], [24, 38.6], [22, 40.2], [20, 38.6], [18.4, 40.2], [17 + sw, 38], [18, 26]]);
    for (let y = 27; y <= 37; y++) { g.dot(21.5 + (y > 33 ? sw * 0.5 : 0), y, L.cloak[2]); g.dot(26.5 + (y > 33 ? sw * 0.5 : 0), y, L.cloak[2]); }
  } else { g.poly(RAMP.leather, [[19.8, 30.6], [28.2, 30.6], [27.6, 33.2], [20.4, 33.2]]); }
  if (!P.raised) {
    if (L.weapon) glaive(g, L, ...P.spear);
    arm(g, L, ...P.ab, false);
  }
  if (L.pauldron) pauldron(g, L, -1);
  if (L.accent) {
    g.poly(L.accent, [[20.4, 17.6], [27.6, 17.6], [27.6, 20.6], [20.4, 20.6]]);
    const t = P.tail || 0;
    g.poly(L.accent, [[23, 19.5], [25.2, 19.5], [25.6 + t, 26], [24.6 + t, 29.4], [23.6 + t, 27.4], [22.8, 25]]);
  }
  g.ox = D + (P.HX || 0); g.oy = U + LIFT + (P.HY || 0);
  headBack(g, L);
  g.ox = 0; g.oy = 0;
  if (P.swoosh) swoosh(g, P.swoosh);
}
function figSide(g, L, P) {
  const U = P.U, D = P.DX, sw = P.sway;
  g.ox = D; g.oy = U + LIFT;
  // far arm and far pauldron first
  arm(g, L, ...P.aa);
  if (L.pauldron) g.poly(L.armor, [[20.6, 18.8], [24.6, 18.6], [25.2, 20.8], [20.2, 21.4]]);
  if (L.cloak) g.poly(L.cloak, [[21.5, 19], [23.4, 20], [23, 27], [22, 35], [20.6, 39.6], [18.8 + sw, 38.4], [17.4 + sw, 40], [16 + sw, 37.4], [16.8 + sw * 0.6, 29], [18.6, 23]]);
  g.ox = 0; g.oy = 0;
  legs(g, L, P.la, null, true);
  g.ox = D; g.oy = U + LIFT;
  g.poly(L.tunic, [[21.4, 20], [26.6, 20], [27.2, 25], [26.6, 30.6], [21.4, 30.6], [21, 25]]);
  g.poly(RAMP.leather, [[21.6, 22], [26.8, 22], [26.6, 29.4], [21.8, 29.4]]);
  g.poly(L.armor, [[23.6, 20.4], [27, 20.8], [27.4, 24.6], [25, 25.8], [23.4, 24]]);
  g.poly(RAMP.gloves, [[21.4, 28.6], [26.8, 28.6], [26.8, 30.6], [21.4, 30.6]]);
  g.dot(26, 29, "#e0c068"); g.dot(26, 30, "#9a7430");
  g.ox = 0; g.oy = 0;
  legs(g, L, P.lb, null, true);
  g.ox = D; g.oy = U + LIFT;
  g.poly(RAMP.leather, [[21.8, 30.6], [26.6, 30.6], [26.2, 33.6], [22.4, 33.2]]);
  if (L.accent && P.flow) g.poly(L.accent, [[22, 18.4], [19, 19.6], [15.4, 20.6 + P.flow], [16, 22.2 + P.flow], [19, 21.6], [22, 21]]);
  else if (L.accent) g.poly(L.accent, [[21.6, 18.4], [20.4, 20.6], [19.8, 24.6], [20.8, 25.2], [22.2, 21.4]]);
  const nearArm = () => arm(g, L, ...P.ab);
  if (L.weapon) {
    if (P.spearFront) { nearArm(); glaive(g, L, ...P.spear); const h = P.ab[2]; g.rect(RAMP.gloves, Math.round(h[0]) - 1, Math.round(h[1]) - 1, Math.round(h[0]) + 1, Math.round(h[1])); }
    else { glaive(g, L, ...P.spear); nearArm(); }
  } else nearArm();
  if (L.drape && L.cloak) g.poly(L.cloak, [[21.2, 19], [25.6, 18.8], [26.8, 22], [26.2, 25.6], [24.4, 27.6], [23.2, 26], [21.8, 27.4], [20.8, 23]]);
  g.ox = D + (P.HX || 0); g.oy = U + LIFT + (P.HY || 0);
  headSide(g, L, P);
  if (L.accent) g.poly(L.accent, L.head === "hood" ? [[23.4, 16.6], [28.8, 16.6], [28.8, 18.6], [27.8, 20.6], [21.8, 20.6], [21.6, 18.2]]
                                                   : [[21.8, 18.4], [27, 18.4], [27, 20.6], [21.8, 20.6]]);
  g.ox = 0; g.oy = 0;
  if (P.swoosh) swoosh(g, P.swoosh);
}

// ---------------------------------------------------------------- poses
// legs: [hipX, hipY, kneeX, kneeY, footX, footY]
const FL = { a: [22, 31, 21.6, 36.5, 21, 42], b: [26, 31, 26.4, 36.5, 27, 42],
             aUp: [22, 31, 21.8, 35.4, 21.4, 40.4], bUp: [26, 31, 26.2, 35.4, 26.6, 40.4],
             aW: [22, 31, 21.2, 36.5, 20.4, 42], bW: [26, 31, 26.8, 36.5, 27.6, 42] };
const ARM_F = { a: [[20, 21], [19, 25.5], [18.5, 29]], b: [[28, 21], [29, 25.5], [29.5, 29]] };
function posesFront() {
  const base = (o) => ({ U: 0, DX: 0, sway: 0, la: FL.a, lb: FL.b, aa: ARM_F.a, ab: ARM_F.b, spear: [18, 45, 18, 4], tail: 0, ...o });
  return {
    idle: [base({}), base({ U: 1, sway: 1, tail: 1 })],
    walk: [base({ la: FL.aUp, sway: 1, ab: [[28, 21], [29, 25], [29.6, 28]] }), base({ U: 1, tail: 1 }),
           base({ lb: FL.bUp, sway: -1, ab: [[28, 21], [29, 26], [29.4, 30]] }), base({ U: 1, tail: 1 })],
    run: [
      base({ U: 0, la: [22, 31, 21.8, 34.2, 21.4, 38.6], lb: FL.b, sway: 2, tail: 1, ab: [[28, 21], [29.4, 24], [29.4, 26.4]] }),
      base({ U: 1, la: [22, 31, 21.6, 35.6, 21.2, 41], lb: FL.b, sway: 1, ab: [[28, 21], [29.2, 25], [29.6, 28]] }),
      base({ U: 1, la: FL.a, lb: FL.b, sway: 0, tail: 1, ab: [[28, 21], [29, 25.6], [29.6, 30]] }),
      base({ U: 0, la: FL.a, lb: [26, 31, 26.2, 34.2, 26.6, 38.6], sway: -2, tail: 1, ab: [[28, 21], [29, 26], [29.4, 31]] }),
      base({ U: 1, la: FL.a, lb: [26, 31, 26.4, 35.6, 26.8, 41], sway: -1, ab: [[28, 21], [29.2, 25], [29.6, 28]] }),
      base({ U: 1, la: FL.a, lb: FL.b, sway: 0, tail: 1, ab: [[28, 21], [29.4, 24.4], [29.4, 26.6]] }),
    ],
    attack: [
      base({ la: FL.aW, lb: FL.bW, aa: [[20, 21], [18.6, 24], [18.4, 23]], ab: [[28, 21], [26, 24.6], [19.6, 26.6]], spear: [19, 13, 19, 38], twoHand: true }),
      base({ U: 1, la: [22, 31, 21, 37, 20.2, 43], lb: FL.bW, aa: [[20, 21], [18.6, 26], [18.6, 30]], ab: [[28, 21], [26, 27], [19.6, 33]], spear: [19, 24, 19, 47], twoHand: true,
             swoosh: [[17, 38, 1], [17, 40, 0], [17, 42, 1], [21, 39, 1], [21, 41, 0], [21, 43, 1], [19, 46, 0]] }),
      base({ la: FL.aW, lb: FL.bW, aa: [[20, 21], [18.6, 25], [18.6, 27]], ab: [[28, 21], [26.4, 26], [19.6, 30]], spear: [19, 18, 19, 43], twoHand: true }),
    ],
    hurt: [base({ U: -1, HX: 1, HY: -1, sway: -1, aa: [[20, 21], [18, 23.4], [17, 25.4]], ab: [[28, 21], [30, 23.4], [31, 25.4]], spear: [17, 41, 17, 2], hurt: true })],
  };
}
function posesBack() {
  const base = (o) => ({ U: 0, DX: 0, sway: 0, la: FL.a, lb: FL.b, aa: ARM_F.a, ab: ARM_F.b, spear: [30, 45, 30, 4], tail: 0, ...o });
  return {
    idle: [base({}), base({ U: 1, sway: 1, tail: 1 })],
    walk: [base({ la: FL.aUp, sway: 1 }), base({ U: 1, tail: 1 }), base({ lb: FL.bUp, sway: -1 }), base({ U: 1, tail: 1 })],
    run: [
      base({ la: [22, 31, 21.8, 34.2, 21.4, 38.6], sway: 2, tail: 1 }), base({ U: 1, la: [22, 31, 21.6, 35.6, 21.2, 41], sway: 1 }), base({ U: 1, sway: 0, tail: 1 }),
      base({ lb: [26, 31, 26.2, 34.2, 26.6, 38.6], sway: -2, tail: 1 }), base({ U: 1, lb: [26, 31, 26.4, 35.6, 26.8, 41], sway: -1 }), base({ U: 1, sway: 0, tail: 1 }),
    ],
    attack: [
      base({ U: 1, la: FL.aW, lb: FL.bW, raised: true, aa: [[20, 21], [23, 25], [29, 25]], ab: [[28, 21], [29.6, 26], [29.6, 29]], spear: [29, 38, 29, 8] }),
      base({ U: -1, la: FL.aW, lb: FL.bW, raised: true, aa: [[20, 21], [24, 19], [29, 17]], ab: [[28, 21], [30, 20], [29.6, 21]], spear: [29, 28, 29, 2],
             swoosh: [[27, 1, 1], [27, 3, 0], [27, 5, 1], [31, 2, 1], [31, 4, 0], [31, 6, 1]] }),
      base({ la: FL.aW, lb: FL.bW, raised: true, aa: [[20, 21], [23.5, 23], [29, 22]], ab: [[28, 21], [29.6, 24], [29.6, 25]], spear: [29, 34, 29, 5] }),
    ],
    hurt: [base({ U: 1, HX: -1, HY: 1, sway: 1, aa: [[20, 21], [18, 23.4], [17, 25.4]], ab: [[28, 21], [30, 23.4], [31, 25.4]], spear: [31, 43, 31, 4], hurt: true })],
  };
}
function posesSide() {
  const S = (kx, fx, lift) => lift ? [24, 31, kx, 35.4, fx, 40.4] : [24, 31, kx, 36.6, fx, 42];
  const base = (o) => ({ U: 0, DX: 0, sway: 0, la: S(22.6, 21.6), lb: S(25.4, 26), aa: [[23, 21.5], [22.4, 26], [23, 29]],
                         ab: [[24, 21.5], [24.6, 25.6], [27, 28.6]], spear: [27, 45, 27, 4], ...o });
  return {
    idle: [base({}), base({ U: 1, sway: -1 })],
    walk: [base({ U: 1, la: S(22, 20.4), lb: S(26.6, 28), sway: -1, flow: 0, aa: [[23, 21.5], [22.6, 26], [24, 29]] }),
           base({ la: S(25, 24.6, 1), lb: S(24.6, 24.4), sway: -2, flow: 1 }),
           base({ U: 1, la: S(26.6, 28), lb: S(22, 20.4), sway: -1, flow: 0, aa: [[23, 21.5], [22, 26], [21.6, 29]] }),
           base({ la: S(24.6, 24.4), lb: S(25, 24.6, 1), sway: -2, flow: 1 })],
    run: [
      base({ DX: 1, U: 1, la: S(20.6, 18.4), lb: S(27.6, 30), sway: -3, flow: 2, aa: [[23, 21.5], [24.6, 25], [26, 27.4]] }),
      base({ DX: 1, U: 0, la: [24, 31, 21.6, 34.6, 19.6, 38.6], lb: S(26, 26.8), sway: -3, flow: 1, aa: [[23, 21.5], [23.6, 25.6], [24.6, 28.4]] }),
      base({ DX: 1, U: 0, la: [24, 31, 26.2, 35, 25, 39.6], lb: S(24.4, 23.8), sway: -2, flow: 2, aa: [[23, 21.5], [22.6, 26], [22.4, 29]] }),
      base({ DX: 1, U: 1, la: S(27.6, 30), lb: S(20.6, 18.4), sway: -3, flow: 1, aa: [[23, 21.5], [21.6, 25.6], [20.4, 27.6]] }),
      base({ DX: 1, U: 0, la: S(26, 26.8), lb: [24, 31, 21.6, 34.6, 19.6, 38.6], sway: -3, flow: 2, aa: [[23, 21.5], [22.6, 26], [22.4, 29]] }),
      base({ DX: 1, U: 0, la: S(24.4, 23.8), lb: [24, 31, 26.2, 35, 25, 39.6], sway: -2, flow: 1, aa: [[23, 21.5], [23.6, 25.6], [24.6, 28.4]] }),
    ],
    attack: [
      base({ DX: -1, la: S(22.6, 21), lb: S(26, 27), aa: [[23, 21.5], [23.4, 25.4], [25, 27.4]], ab: [[24, 21.5], [22.6, 25.6], [22, 27.6]], spear: [8, 27, 34, 27], spearFront: true, flow: 1, sway: -1 }),
      base({ DX: 2, U: 1, la: S(21, 18.6), lb: S(28.4, 30.4), aa: [[23, 21.5], [25, 25], [27, 27.4]], ab: [[24, 21.5], [27, 24.4], [30, 27.4]], spear: [18, 27, 45, 27], spearFront: true, flow: 2, sway: -2,
             swoosh: [[35, 25, 1], [37, 25, 0], [39, 25, 1], [36, 29, 1], [38, 29, 0], [40, 29, 1], [33, 26, 0]] }),
      base({ DX: 1, U: 1, la: S(21.8, 20), lb: S(27, 28.4), aa: [[23, 21.5], [24, 25.4], [25.4, 27.6]], ab: [[24, 21.5], [25.4, 25.2], [27, 27.6]], spear: [13, 27, 40, 27], spearFront: true, flow: 1, sway: -1 }),
    ],
    hurt: [base({ DX: -2, U: -1, HX: -1, la: S(22, 20.8), lb: S(24.6, 24.4), aa: [[23, 21.5], [21.6, 24.6], [20.6, 27]], ab: [[24, 21.5], [22.6, 23.4], [20.6, 21.6]], spear: [20, 42, 20, 3], sway: 1, hurt: true })],
  };
}

// ---------------------------------------------------------------- looks & building
function resolveLook(o) {
  const pick = (k, i, d) => i == null ? d : CHAR_OPTS[k][i];
  const eyes = o.eyesHex || pick("eyes", o.eyes, CHAR_OPTS.eyes[0]);
  const dim = "#" + rgb(eyes).map(v => Math.round(v * 0.45).toString(16).padStart(2, "0")).join("");
  return {
    head: o.head || "hood", skin: pick("skin", o.skin, CHAR_OPTS.skin[0]), hair: o.hairRamp || CHAR_OPTS.hair[o.hair || 0],
    cloak: o.noCloak ? null : (o.cloakRamp || pick("cloak", o.cloak, CHAR_OPTS.cloak[0])),
    accent: o.noAccent ? null : (o.accentRamp || pick("accent", o.accent, CHAR_OPTS.accent[0])),
    armor: o.armorRamp || pick("armor", o.armor, CHAR_OPTS.armor[0]),
    tunic: o.tunic || RAMP.tunic, pants: o.pants || RAMP.tunic, crest: o.crest || CHAR_OPTS.accent[0],
    eyes, eyesDim: dim, pauldron: o.pauldron !== false, drape: o.drape !== false, weapon: o.weapon === undefined ? "glaive" : o.weapon, beard: o.beard,
  };
}
function buildChar(o) {
  const L = resolveLook(o), out = {};
  const sets = { down: [posesFront(), figFront], up: [posesBack(), figBack], right: [posesSide(), figSide] };
  for (const [dir, [poses, fig]] of Object.entries(sets)) {
    out[dir] = {};
    for (const [anim, list] of Object.entries(poses)) {
      out[dir][anim] = [];
      for (const P of list) {
        const g = new Rig(); fig(g, L, P);
        out[dir][anim].push(g.render(false));
        if (anim === "hurt") out[dir][anim].push(g.render(true));
      }
    }
  }
  const flip = c => { const m = document.createElement("canvas"); m.width = m.height = CW;
    const x = m.getContext("2d"); x.translate(CW, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return m; };
  out.left = {};
  for (const [anim, list] of Object.entries(out.right)) out.left[anim] = list.map(c => { const m = flip(c); if (c.glow) m.glow = flip(c.glow); return m; });
  return out;
}

// Allied soldiers go bare-headed; the Dominion hides behind helms. Only the player wears the hood.
const NPC_LOOKS = {
  commander: { head: "bare", skin: 0, hair: 3, beard: true, cloak: 1, armor: 0, accent: 1, drape: false, weapon: null },
  medic: { head: "bare", skin: 1, hair: 2, noCloak: true, armorRamp: RAMP.leather, tunic: RAMP.white, accent: 0, pauldron: false, weapon: null },
  quarter: { head: "bare", skin: 2, hair: 1, beard: true, cloak: 4, armor: 1, noAccent: true, pauldron: false, weapon: null },
  scout: { head: "bare", skin: 0, hair: 4, cloak: 2, armorRamp: RAMP.leather, accent: 1, drape: false, weapon: null },
  rookie: { head: "bare", skin: 3, hair: 1, cloak: 2, armor: 0, noAccent: true, drape: false, pauldron: false, weapon: null },
  grunt: { head: "helm", armor: 2, cloak: 3, noAccent: true, drape: false, eyesHex: "#ff3a3a", crest: CHAR_OPTS.accent[0] },
  officer: { head: "helm", armor: 1, cloak: 3, accent: 0, eyesHex: "#ff3a3a", crest: CHAR_OPTS.accent[1] },
  general: { head: "bare", skin: 0, hair: 3, cloakRamp: CHAR_OPTS.accent[0], armor: 1, noAccent: true, pants: RAMP.gloves },
};
const DEFAULT_LOOK = { skin: 0, cloak: 0, accent: 0, armor: 0, eyes: 0 };
const CHAR = {};
function buildAllChars(playerLook) {
  for (const [k, v] of Object.entries(NPC_LOOKS)) CHAR[k] = buildChar(v);
  CHAR.player = buildChar({ ...DEFAULT_LOOK, ...playerLook, head: "hood" });
}
