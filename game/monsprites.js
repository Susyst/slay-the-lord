// Mon sprites: every species is drawn in code on a 32x32 rig (shaded parts, selective outlines, dithered volume),
// one generator per evolution line so each stage grows out of the last. Front faces left; back is the
// same body seen from behind (no face, mirrored).
const MS = 32;
const msh = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const PAL = {
  ink: "#1a1430", white: "#ffffff",
  gold: ["#ffe896", "#f4b84a", "#c47a2a", "#7a4418"], cream: ["#fff6d8", "#f4dca2", "#c8a870", "#8a6c40"],
  ember: ["#ffc070", "#f47a32", "#b84420", "#6a2010"], sun: ["#fff6b0", "#ffcc44", "#f08a2c", "#a04a1c"],
  halo: ["#ffffe0", "#fff08a", "#f0c040", "#b08020"],
  fawn: ["#e0b484", "#b47e50", "#7c5232", "#46301e"], moss: ["#b8f078", "#70c450", "#3c8a44", "#1e4e30"],
  stone: ["#eeeef8", "#b4b4cc", "#76769a", "#40405e"], bronze: ["#ffe29a", "#e4a440", "#a46a20", "#5a3a10"],
  batPink: ["#ffc8ec", "#e888c8", "#a8509a", "#5e2458"], batEar: ["#ffe4f6", "#ffb0dc", "#e070b0", "#9a3a78"],
  membrane: ["#d8b0f4", "#a878dc", "#7048a8", "#3c2468"], nightBat: ["#7e86c8", "#4c5294", "#2c3062", "#161834"],
};
const EYE = "#1a1430";

// drawing helpers; T = this stage's transform (scale about the feet)
function mkT(k, ax = 16, ay = 30) { return { k, X: x => ax + (x - ax) * k, Y: y => ay - (ay - y) * k }; }
function E(g, T, ramp, cx, cy, rx, ry, group) {
  const X = T.X(cx), Y = T.Y(cy), RX = rx * T.k, RY = ry * T.k, pts = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push([X + Math.cos(a) * RX, Y + Math.sin(a) * RY]); }
  const p = g.poly(ramp, pts, group); g.parts[p].sph = [X, Y, RX, RY]; return p;
}
function Cp(g, T, ramp, x1, y1, x2, y2, r, group) { return g.cap(ramp, T.X(x1), T.Y(y1), T.X(x2), T.Y(y2), Math.max(0.7, r * T.k), group); }
function Pg(g, T, ramp, pts, group) { return g.poly(ramp, pts.map(([x, y]) => [T.X(x), T.Y(y)]), group); }
function D(g, T, x, y, c) { g.dot(Math.round(T.X(x)), Math.round(T.Y(y)), c); }
function eye(g, T, x, y, size = 1, col = EYE, shine = PAL.white) {
  const X = Math.round(T.X(x)), Y = Math.round(T.Y(y));
  if (size >= 2) { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.dot(X + dx, Y + dy, col); g.dot(X, Y, shine); }
  else { g.dot(X, Y, col); g.dot(X, Y + 1, col); }
}
function glowEye(g, T, x, y, col, w = 2) { const X = Math.round(T.X(x)), Y = Math.round(T.Y(y)); for (let i = 0; i < w; i++) g.dot(X + i, Y, col); g.dot(X, Y, "#ffffff"); }

// ---------------------------------------------------------------- 1-4 Lumkit line: sun lion
function drawLion(g, s, back) {
  const T = mkT([0.66, 0.8, 0.92, 1.0][s]), hk = [1.35, 1.15, 1.0, 1.0][s];
  const fur = PAL.gold, belly = PAL.cream, mane = [null, PAL.ember, PAL.ember, PAL.sun][s];
  const hx = 9 - (hk - 1) * 2, hy = 13 - (hk - 1) * 3;
  // tail and far legs
  Cp(g, T, fur, 25, 19, 28.5, 13, 0.9); E(g, T, mane || PAL.ember, 28.8, 12, 1.8, 1.8);
  Cp(g, T, fur.map((c, i) => fur[Math.min(3, i + 1)]), 22.5, 22, 24.6, 29.4, s >= 2 ? 2 : 1.8);
  Cp(g, T, fur.map((c, i) => fur[Math.min(3, i + 1)]), 13.5, 22, 15, 29.4, s >= 2 ? 2 : 1.8);
  // body
  E(g, T, fur, 18, 20, s >= 2 ? 8.4 : 7.6, s >= 2 ? 5.2 : 5);
  E(g, T, belly, 16.5, 22.6, 5.4, 2.2);
  if (s >= 2) { for (const sx of [17, 20, 23]) Pg(g, T, fur.map((c, i) => fur[Math.min(3, i + 1)]), [[sx, 16], [sx + 1.4, 16], [sx + 0.6, 19.5]]); }
  // near legs and paws
  for (const lx of [20.5, 12]) {
    Cp(g, T, fur, lx + 0.6, 22, lx - 0.8, 29, s >= 2 ? 2.3 : 2);
    E(g, T, belly, lx - 0.8, 29.4, 2.3, 1.2);
    if (s === 2) { D(g, T, lx - 2.6, 29.6, PAL.halo[1]); D(g, T, lx - 1.6, 30, PAL.halo[1]); }
  }
  // mane: a disc that grows sun rays
  if (mane) {
    const mr = [0, 5.2, 6.2, 7.2][s];
    if (s >= 2) for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.35 + i / 10 * 1.5), r1 = mr - 0.5, r2 = mr + (s === 3 ? 2.6 : 1.8);
      Pg(g, T, mane, [[hx + 1 + Math.cos(a - 0.18) * r1, hy + Math.sin(a - 0.18) * r1], [hx + 1 + Math.cos(a) * r2, hy + Math.sin(a) * r2], [hx + 1 + Math.cos(a + 0.18) * r1, hy + Math.sin(a + 0.18) * r1]]);
    }
    E(g, T, mane, hx + 1.2, hy - 0.2, mr, mr);
  }
  // head
  E(g, T, fur, hx, hy, 4.4 * hk, 4.1 * hk);
  if (!mane) { E(g, T, fur, hx + 2.6 * hk, hy - 3.4 * hk, 1.6 * hk, 1.6 * hk); E(g, T, PAL.ember, hx + 2.6 * hk, hy - 3.3 * hk, 0.8 * hk, 0.8 * hk); }
  if (!back) {
    E(g, T, belly, hx - 3 * hk, hy + 1.8 * hk, 2.4 * hk, 1.7 * hk);
    D(g, T, hx - 5.2 * hk, hy + 0.9 * hk, "#6a2a1a"); D(g, T, hx - 4.6 * hk, hy + 0.9 * hk, "#6a2a1a");
    if (s === 3) { for (const ex of [-2.2, 0.6]) { D(g, T, hx + ex * hk, hy - 0.4, EYE); D(g, T, hx + ex * hk + 1, hy - 0.4, EYE); } }   // calm, half-closed
    else eye(g, T, hx - 1.6 * hk, hy - 1.4 * hk, s === 0 ? 2 : 1);
    if (s === 0) D(g, T, hx + 1.4 * hk, hy - 1.0 * hk, EYE);
    D(g, T, hx - 3.2 * hk, hy + 3.1 * hk, "#8a4a2a");
  }
  // Solarchon's floating halo
  if (s === 3) {
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, x = hx + 1 + Math.cos(a) * 5, y = hy - 8.6 + Math.sin(a) * 1.4; D(g, T, x, y, Math.sin(a) < 0 ? PAL.halo[0] : PAL.halo[2]); }
  }
}

// ---------------------------------------------------------------- 5-8 Mossfawn line: temple deer
function drawDeer(g, s, back) {
  const T = mkT([0.62, 0.78, 0.9, 1.0][s]), hk = [1.35, 1.15, 1.0, 0.95][s];
  const fur = PAL.fawn, dark = fur.map((c, i) => fur[Math.min(3, i + 1)]), belly = PAL.cream;
  const hx = 8 - (hk - 1) * 2, hy = 9.5 + (hk - 1) * 3;
  Cp(g, T, dark, 22, 20, 24.4, 29.4, 1.3); Cp(g, T, dark, 13.5, 20, 15, 29.4, 1.3);
  Cp(g, T, fur, 25, 17, 26.6, 15.6, 1.1);                                                                  // flag tail
  E(g, T, fur, 18, 18.6, 7.6, 4.6);
  E(g, T, belly, 17, 21, 5, 1.8);
  // moss saddle with pebbles; grows with each stage
  E(g, T, PAL.moss, 19, 14.6, 4 + s * 0.8, 1.8 + s * 0.2);
  for (let i = 0; i <= s; i++) E(g, T, PAL.stone, 16.5 + i * 2.2, 13.2 - (i % 2) * 0.6, 1.1, 0.9);
  for (const lx of [21, 12]) { Cp(g, T, fur, lx + 0.5, 20, lx - 1, 29, 1.5); E(g, T, PAL.stone[3] ? ["#6a5a5a", "#4a3a3a", "#2e2424", "#1a1414"] : PAL.stone, lx - 0.4, 29.6, 1.5, 0.9); }
  // neck and head
  Cp(g, T, fur, 12, 16, hx + 1.5, hy + 1.5, 2.4);
  E(g, T, fur, hx, hy, 3.4 * hk, 3 * hk);
  E(g, T, fur, hx - 3 * hk, hy + 1.4 * hk, 2.2 * hk, 1.5 * hk);
  E(g, T, fur, hx + 2.6 * hk, hy - 1.6 * hk, 2.2 * hk, 0.9 * hk);                                          // ear
  // antlers: nubs -> river stones -> cairns -> branching with bells
  if (s === 1) { E(g, T, PAL.stone, hx + 0.6, hy - 3.6, 1.2, 1); }
  if (s >= 2) for (const [ax, n] of [[hx + 0.4, s === 2 ? 3 : 4], [hx + 2.6, s === 2 ? 2 : 3]]) for (let i = 0; i < n; i++) E(g, T, PAL.stone, ax + (i % 2) * 0.6, hy - 3.6 - i * 2.1, 1.6 - i * 0.18, 1.05);
  if (s === 3) {
    Cp(g, T, PAL.stone, hx + 1, hy - 9, hx - 3.5, hy - 12, 0.8); Cp(g, T, PAL.stone, hx + 3, hy - 8, hx + 7, hy - 11.5, 0.8);
    for (const [bx, by] of [[hx - 3.5, hy - 10.5], [hx + 7, hy - 10]]) { Cp(g, T, PAL.bronze, bx, by, bx, by + 1.6, 0.3); E(g, T, PAL.bronze, bx, by + 2.6, 1.2, 1.3); }
    E(g, T, ["#fff4c8", "#fcd888", "#e8903a", "#a8441c"], hx + 7.4, hy - 6.4, 0.9, 1.2);                      // a small lit lantern
  }
  if (!back) {
    eye(g, T, hx - 1.2 * hk, hy - 0.6 * hk, s === 0 ? 2 : 1);
    D(g, T, hx - 5 * hk, hy + 0.8 * hk, EYE);
    if (s === 3) { D(g, T, hx - 1.8, hy - 1.4, PAL.moss[0]); }
  }
}

// ---------------------------------------------------------------- 9-12 Echit line: sound bat
function drawBat(g, s, back) {
  const T = mkT([0.82, 0.8, 0.92, 1.0][s], 16, s === 0 ? 30 : 27);
  const body = s === 3 ? PAL.nightBat : PAL.batPink, ear = PAL.batEar, mem = s === 3 ? ["#9a7ad8", "#6a4aa8", "#40287a", "#20143e"] : PAL.membrane;
  const cx = 16, cy = s === 0 ? 21 : 16;
  if (s === 0) {                                                                                           // perched pup: wings folded
    Cp(g, T, body.map((c, i) => body[Math.min(3, i + 1)]), 14, 26, 13.6, 29.6, 0.9); Cp(g, T, body.map((c, i) => body[Math.min(3, i + 1)]), 18, 26, 18.4, 29.6, 0.9);
    Pg(g, T, mem, [[10, 18], [6, 25], [11, 26], [13, 22]]); Pg(g, T, mem, [[22, 18], [26, 25], [21, 26], [19, 22]]);
    E(g, T, body, cx, cy, 6.6, 6.4);
    Pg(g, T, body, [[10.5, 15], [8, 4], [14.4, 12]]); Pg(g, T, ear, [[11.2, 13.6], [9.2, 6.4], [13.4, 12]]);
    Pg(g, T, body, [[17.6, 12], [21.6, 4.6], [21.6, 15]]); Pg(g, T, ear, [[18.4, 12.6], [21, 7], [20.8, 14]]);
    E(g, T, PAL.cream, cx - 0.6, cy + 3, 3.2, 2.2);
    if (!back) { eye(g, T, 12.6, 19, 2); eye(g, T, 17.4, 19, 2); D(g, T, 15, 22.4, "#5e2458"); D(g, T, 14.4, 23.2, PAL.white); }
    return;
  }
  // flying forms: spread membranes with finger bones
  const span = [0, 13, 14.5, 15.5][s];
  for (const side of [-1, 1]) {
    const tip = [cx + side * span, cy - 7], pts = [[cx + side * 3, cy - 3], tip, [cx + side * (span - 1), cy + 3], [cx + side * (span - 4), cy + 1.2], [cx + side * (span - 5.5), cy + 6], [cx + side * 8, cy + 3.4], [cx + side * 6, cy + 7], [cx + side * 3, cy + 3]];
    Pg(g, T, side < 0 ? mem : mem.map((c, i) => mem[Math.min(3, i + 1)]), pts);
    for (const f of [[span - 1, 3], [span - 5.5, 6], [6, 7]]) Cp(g, T, body, cx + side * 3, cy - 2, cx + side * f[0], cy + f[1], 0.35);
    Cp(g, T, body, cx + side * 3, cy - 3, tip[0], tip[1], 0.55);
    D(g, T, tip[0] - side * 0.4, tip[1] - 1, body[3]);
  }
  if (s === 3) { Cp(g, T, body, cx + 2, cy + 5, cx + 9, cy + 13, 0.9); Pg(g, T, PAL.batPink, [[cx + 8, cy + 12], [cx + 11.5, cy + 12.4], [cx + 9.6, cy + 15]]); }   // dragon tail
  E(g, T, body, cx, cy + 1, s >= 2 ? 5 : 4.4, s >= 2 ? 5.6 : 5);
  E(g, T, s === 3 ? ["#c8ccec", "#9aa0d0", "#6a70a8", "#3e4270"] : PAL.cream, cx - 0.4, cy + 3, 2.8, 3);
  for (const lx of [-2, 2]) Cp(g, T, body.map((c, i) => body[Math.min(3, i + 1)]), cx + lx, cy + 5.5, cx + lx * 1.3, cy + 8.5, 0.7);
  // head with huge ears
  const hy = cy - 5.2, er = [0, 5, 6, 6.4][s];
  Pg(g, T, body, [[cx - 4.4, hy], [cx - 5.6 - s * 0.6, hy - er - 2], [cx - 1, hy - 2]]); Pg(g, T, ear, [[cx - 4, hy - 0.8], [cx - 5 - s * 0.6, hy - er], [cx - 2, hy - 2]]);
  Pg(g, T, body, [[cx + 4.4, hy], [cx + 5.6 + s * 0.6, hy - er - 2], [cx + 1, hy - 2]]); Pg(g, T, ear, [[cx + 4, hy - 0.8], [cx + 5 + s * 0.6, hy - er], [cx + 2, hy - 2]]);
  if (s === 3) { Pg(g, T, PAL.stone, [[cx - 1.8, hy - 3], [cx - 2.6, hy - 6.6], [cx - 0.6, hy - 3.4]]); Pg(g, T, PAL.stone, [[cx + 1.8, hy - 3], [cx + 2.6, hy - 6.6], [cx + 0.6, hy - 3.4]]); }
  E(g, T, body, cx, hy, 4, 3.4);
  if (!back) {
    if (s === 3) { glowEye(g, T, cx - 2.6, hy - 0.4, "#ff70d0"); glowEye(g, T, cx + 1.2, hy - 0.4, "#ff70d0"); }
    else { eye(g, T, cx - 2.4, hy - 0.8, 1); eye(g, T, cx + 1.6, hy - 0.8, 1); }
    D(g, T, cx - 0.4, hy + 1.8, PAL.white); D(g, T, cx + 0.6, hy + 1.8, PAL.white);
    if (s >= 2) for (let i = 0; i < 3; i++) for (let a = -0.6; a <= 0.6; a += 0.2) D(g, T, cx - 6 - i * 2.2 + Math.cos(a) * 0, hy + 2 + Math.sin(a) * (2 + i * 1.4), i === 0 ? PAL.batEar[1] : PAL.batEar[2]);   // sound rings
  }
}


// shared helpers for the rest of the roster
const dk = r => r.map((c, i) => r[Math.min(3, i + 1)]);
Object.assign(PAL, {
  mothFur: ["#fffbe8", "#f4e4b4", "#c8ac7c", "#7c6644"], mothWing: ["#fff4b0", "#ffd658", "#e49a34", "#8a5418"], flame: ["#fffbe0", "#ffe27c", "#ff9a40", "#c0501c"],
  fox: ["#9a88d8", "#6252a6", "#3c2e74", "#1e1644"], foxBelly: ["#e0d4fa", "#b8a8e8", "#8070c0", "#4a3c88"], voidGlow: ["#ffd8ff", "#e090ff", "#a050e0", "#5a2098"],
  crow: ["#6a7cbc", "#3c4886", "#222a58", "#10142e"], beak: ["#ffe27a", "#f0b034", "#a8701c", "#5a3a0c"], bone: ["#ffffff", "#e4e2f0", "#a8a6c4", "#62607e"],
  frog: ["#a8f8d0", "#52d0a0", "#2a9070", "#145448"], frogBelly: ["#f4ffe4", "#d8f4b8", "#a4c888", "#607c4c"], pad: ["#a4ec70", "#5cb446", "#32782e", "#1a441c"],
  lotus: ["#fff0f8", "#ffb0d4", "#e06aa4", "#8a2c62"],
  shell: ["#8af8e8", "#34c4b4", "#1a7c84", "#0c424a"], chitin: ["#b8f08a", "#74c454", "#3c8238", "#1c4a22"], amber: ["#ffe29a", "#f8a83c", "#b8641c", "#6a300c"],
  wolf: ["#d8dcec", "#9aa0be", "#5e6488", "#30344e"], wolfDark: ["#7a7e9c", "#4e5272", "#2e3250", "#181a2e"], scar: ["#ff9a8a", "#e0503c", "#9a2420", "#501010"],
  hide: ["#d8a07c", "#a46c4a", "#704030", "#3c2018"], tusk: ["#fffaf0", "#ecdcc4", "#b4a084", "#6e604c"], plate: ["#c4cadc", "#868ea8", "#545a76", "#2c3046"],
  steel: ["#eef2fa", "#aeb6cc", "#6c7494", "#383e5c"], gun: ["#8a8ea8", "#5a5e7a", "#363a52", "#1c1e30"], rust: ["#eca878", "#bc6c40", "#7c3e22", "#40200e"],
  red: ["#ff9a80", "#e44430", "#9e2020", "#52100e"], soot: ["#7470a0", "#48446a", "#2a2644", "#141226"], violet: ["#d8a8ff", "#9858e8", "#5e2ca8", "#30145c"],
  wmetal: ["#ffffff", "#dee6f6", "#9ea8ca", "#5c6688"], goldM: ["#fff4b0", "#f4cc4c", "#bc8c28", "#6c4c10"], rune: ["#ccd0dc", "#9096aa", "#5c6276", "#32364c"],
});

// ---------------------------------------------------------------- 13-15 Glimmote line: lantern moth
function drawMoth(g, s, back) {
  const T = mkT([0.74, 0.88, 1.0][s], 16, 29), cx = 16, cy = 15;
  const wing = PAL.mothWing, far = dk(wing), span = [8, 12, 15][s], h = [6, 9, 11][s];
  for (const side of [-1, 1]) {
    const r = side < 0 ? wing : far;
    Pg(g, T, r, [[cx + side * 2, cy - 1], [cx + side * span, cy - h], [cx + side * (span + 1), cy - h * 0.3], [cx + side * (span - 2), cy + 2], [cx + side * 2, cy + 2]]);   // forewing
    Pg(g, T, dk(r), [[cx + side * 2, cy + 1], [cx + side * (span - 3), cy + 3], [cx + side * (span - 4), cy + h * 0.8], [cx + side * 3, cy + 6]]);               // hindwing
    if (s >= 1) E(g, T, PAL.flame, cx + side * (span - 1), cy - h + 1.6, 1.8 + s * 0.4, 1.8 + s * 0.4);                                                     // flame tips
    if (s === 2) { E(g, T, PAL.flame, cx + side * 8, cy - 4, 2.4, 2.4); E(g, T, ["#3a2460", "#24143e", "#140a24", "#0a0614"], cx + side * 8, cy - 4, 1.2, 1.2); D(g, T, cx + side * 8 - 0.5, cy - 4.6, PAL.white); }   // signal eye-spots
    for (let i = 1; i < 4; i++) D(g, T, cx + side * (2 + i * span / 5), cy - i * h / 5, wing[3]);
  }
  E(g, T, PAL.mothFur, cx, cy + 4.6, 2.4, 3.6 + s * 0.4);                                                                                                         // abdomen
  for (let y = 0; y < 3; y++) D(g, T, cx, cy + 3 + y * 1.6, PAL.mothFur[2]);
  E(g, T, PAL.mothFur, cx, cy, 3.4 + s * 0.3, 3.2 + s * 0.3);                                                                                                     // fuzzy thorax
  E(g, T, PAL.mothFur, cx, cy - 4, 2.6, 2.2);
  for (const side of [-1, 1]) { Cp(g, T, PAL.mothFur[3] ? ["#c8ac7c", "#8a6c48", "#5a4428", "#2e2214"] : PAL.mothFur, cx + side * 1, cy - 5.6, cx + side * (4 + s), cy - 10 - s * 1.5, 0.5); E(g, T, PAL.flame, cx + side * (4 + s), cy - 10.4 - s * 1.5, 1.2, 1.2); }
  if (!back) { eye(g, T, cx - 2, cy - 4.4, 2); eye(g, T, cx + 1, cy - 4.4, 2); }
  for (const lx of [-1.4, 1.4]) Cp(g, T, ["#a08060", "#705038", "#4a3220", "#281a10"], cx + lx, cy + 2, cx + lx * 2.2, cy + 13.6, 0.4);
}

function canineHead(g, T, fur, light, hx, hy, hk, earCol, opts = {}) {
  Pg(g, T, dk(fur), [[hx + 1.6 * hk, hy - 2 * hk], [hx + 3.6 * hk, hy - (opts.earH || 6.4) * hk], [hx + 4.2 * hk, hy - 1 * hk]]);                     // far ear
  E(g, T, fur, hx, hy, 3.6 * hk, 3.2 * hk);
  E(g, T, fur, hx - 3.4 * hk, hy + 1.2 * hk, (opts.snout || 2.6) * hk, 1.6 * hk);                                                              // muzzle
  E(g, T, light, hx - 2.4 * hk, hy + 2 * hk, 2.2 * hk, 1 * hk);                                                                               // pale jaw
  Pg(g, T, fur, [[hx - 0.6 * hk, hy - 2.2 * hk], [hx + 0.8 * hk, hy - (opts.earH || 6.4) * hk - 0.6], [hx + 2.6 * hk, hy - 2.4 * hk]]);           // near ear
  Pg(g, T, earCol, [[hx + 0.1 * hk, hy - 2.6 * hk], [hx + 0.9 * hk, hy - (opts.earH || 6.4) * hk * 0.78], [hx + 1.9 * hk, hy - 2.7 * hk]]);
}
// ---------------------------------------------------------------- 16-18 Shadeling line: shadow fox
function drawFox(g, s, back) {
  const T = mkT([0.7, 0.88, 1.0][s]), hk = [1.4, 1.1, 1.0][s], fur = PAL.fox, belly = PAL.foxBelly, hx = 8.6 - (hk - 1) * 2, hy = 15 - (hk - 1) * 2;
  // tails
  const tails = s === 2 ? [[-0.6, 1], [0, 1], [0.6, 1]] : [[0, 1]];
  for (const [ang] of tails) {
    const a = -0.9 + ang, x2 = 25 + Math.cos(a) * (s === 0 ? 5 : 8), y2 = 19 + Math.sin(a) * (s === 0 ? 5 : 9);
    Cp(g, T, s === 2 ? dk(fur) : fur, 23, 20, x2, y2, s === 0 ? 2 : 2.6);
    E(g, T, s === 0 ? fur : PAL.voidGlow, x2, y2, 1.8, 1.8);
    if (s === 2) E(g, T, ["#0a0614", "#0a0614", "#0a0614", "#0a0614"], (23 + x2) / 2 + 1, (20 + y2) / 2, 1, 1);                                                  // holes in the light
  }
  Cp(g, T, dk(fur), 21.6, 22, 23.6, 29.4, 1.4); Cp(g, T, dk(fur), 13.5, 22, 14.6, 29.4, 1.4);
  E(g, T, fur, 17.6, 21, s === 0 ? 6 : 7.4, s === 0 ? 4.6 : 4.2);
  E(g, T, belly, 16, 23, 4.4, 1.6);
  if (s === 2) for (const sx of [14, 16.4, 18.8, 21.2]) Pg(g, T, PAL.voidGlow, [[sx, 17.6], [sx + 0.8, 14], [sx + 1.8, 17.4]]);                                // feral ridge
  for (const lx of [20.4, 12.2]) { Cp(g, T, fur, lx + 0.6, 22, lx - 0.8, 29.2, 1.5); D(g, T, lx - 1.4, 29.6, fur[3]); }
  // head
  Cp(g, T, fur, 13, 19, hx + 1, hy + 1, 2.4 * hk);
  canineHead(g, T, fur, belly, hx, hy, hk, PAL.voidGlow, { earH: 6.8, snout: 2.8 });
  if (!back) { glowEye(g, T, hx - 1.8 * hk, hy - 0.8 * hk, s === 2 ? "#ff60c0" : "#d890ff", 2); D(g, T, hx - 5.8 * hk, hy + 0.8 * hk, EYE); }
  if (s === 0) for (let i = 0; i < 10; i++) D(g, T, 10 + msh(i, 1, 3) * 16, 25 + msh(i, 2, 3) * 4, fur[2]);                                                         // wisps
}

// ---------------------------------------------------------------- 19-21 Gloamcrow line: war crow
function drawCrow(g, s, back) {
  const T = mkT([0.7, 0.88, 1.0][s]), body = PAL.crow, cx = 17, cy = [19, 18, 16.5][s];
  for (const lx of [-1, 1.4]) { Cp(g, T, PAL.beak, cx + lx, cy + 5, cx + lx - 0.4, 29.4, 0.5); Cp(g, T, PAL.beak, cx + lx - 0.4, 29.4, cx + lx - 2.2, 29.6, 0.4); }
  Pg(g, T, dk(body), [[cx + 4, cy + 1], [cx + 11, cy + 6], [cx + 10, cy + 8], [cx + 3, cy + 5]]);                                                              // tail
  if (s === 2) {                                                                                                                                                   // wings half open, tattered
    Pg(g, T, dk(body), [[cx + 2, cy - 4], [cx + 13, cy - 11], [cx + 14, cy - 6], [cx + 12, cy - 5], [cx + 13, cy - 1], [cx + 10, cy - 1], [cx + 10, cy + 2], [cx + 4, cy + 2]]);
  }
  E(g, T, body, cx, cy, s === 2 ? 6.6 : 5.4, s === 2 ? 6.4 : 5);
  Pg(g, T, body, [[cx - 1, cy - 2], [cx + 7, cy + 4], [cx + 1, cy + 5]]);                                                                                         // folded wing
  for (let i = 0; i < 3; i++) D(g, T, cx + 2 + i * 1.6, cy + 1 + i * 1.2, body[0]);
  const hx = cx - 3.6, hy = cy - 5.6 + (s === 0 ? 1 : 0);
  if (s >= 1) Pg(g, T, ["#4a3a6a", "#2e2448", "#1c1630", "#0e0a1c"], [[hx - 1, hy - 4.6], [hx + 5.6, hy - 2], [cx + 4, cy + 1], [cx - 4, cy + 1], [hx - 3.6, hy + 1]]);   // the hood / mantle
  E(g, T, body, hx, hy, 3.4, 3.2);
  if (s === 2 && !back) E(g, T, PAL.bone, hx - 1, hy, 2.4, 2.2);                                                                                                  // pale bone mask
  Pg(g, T, PAL.beak, [[hx - 2.6, hy - 0.6], [hx - 6.8 - s * 0.6, hy + 0.8], [hx - 2.4, hy + 1.8]]);
  if (!back) { if (s === 2) glowEye(g, T, hx - 1.6, hy - 0.6, "#60e0ff", 1); else eye(g, T, hx - 1.2, hy - 0.8, s === 0 ? 2 : 1); }
  if (s === 1) { E(g, T, PAL.goldM, cx - 2, cy + 1, 1, 1); D(g, T, cx - 2, cy + 2.4, PAL.red[1]); }                                                                 // stolen Dominion medal
}

// ---------------------------------------------------------------- 22-24 Lotadpole line: lotus frog
function drawFrog(g, s, back) {
  if (s === 0) {
    const T = mkT(0.9, 16, 29);
    Cp(g, T, PAL.frog, 19, 21, 25, 19, 2); Pg(g, T, PAL.frogBelly, [[23, 17.4], [29.6, 15], [28.6, 21.4], [23, 20.6]]);                                             // tail fin
    E(g, T, PAL.frog, 14.5, 21, 6.2, 5.4); E(g, T, PAL.frogBelly, 13.6, 23.4, 4, 2.4);
    E(g, T, PAL.pad, 14.6, 15.6, 6.4, 1.8); Cp(g, T, PAL.pad, 14.6, 15.4, 13.6, 13.4, 0.4);                                                                        // lily pad hat
    if (!back) { eye(g, T, 11.2, 19.4, 2); eye(g, T, 15.6, 19.4, 2); D(g, T, 13.2, 23, PAL.frog[3]); D(g, T, 14, 23.4, PAL.frog[3]); }
    return;
  }
  const T = mkT(s === 1 ? 0.86 : 1.0, 16, 30), big = s === 2;
  if (big) {                                                                                                                                                       // lotus throne
    for (let i = 0; i < 7; i++) { const a = Math.PI * (1 + i / 6), x = 16 + Math.cos(a) * 12, y = 27 + Math.sin(a) * 3.6; Pg(g, T, i % 2 ? PAL.lotus : dk(PAL.lotus), [[16 + Math.cos(a - 0.3) * 6, 27.6], [x, y - 3.6], [16 + Math.cos(a + 0.3) * 6, 27.6]]); }
    E(g, T, PAL.pad, 16, 28.6, 12.6, 2.4);
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; D(g, T, 16 + Math.cos(a) * 7, 6 + Math.sin(a) * 1.6, i % 2 ? PAL.halo[1] : PAL.halo[0]); }
  } else E(g, T, PAL.pad, 16, 28.6, 9, 2.2);
  const by = big ? 17 : 21, bw = big ? 10 : 7.4, bh = big ? 8.6 : 6.4;
  for (const side of [-1, 1]) { E(g, T, dk(PAL.frog), 16 + side * (bw - 1.4), by + bh - 2.2, 3, 2.2); E(g, T, PAL.frog, 16 + side * (bw - 3.4), by + bh - 0.6, 2.4, 1.4); }   // folded legs
  E(g, T, PAL.frog, 16, by, bw, bh);
  E(g, T, PAL.frogBelly, 16, by + 2.6, bw * 0.66, bh * 0.6);
  for (const side of [-1, 1]) { E(g, T, PAL.frog, 16 + side * bw * 0.52, by - bh + 1.6, 2.6, 2.4); }                                                              // eye bumps
  for (const side of [-1, 1]) Cp(g, T, PAL.frog, 16 + side * bw * 0.6, by + 1, 16 + side * 2, by + 4.6, 1.4);                                                       // hands together
  if (!back) {
    for (const side of [-1, 1]) { const ex = 16 + side * bw * 0.52; D(g, T, ex - 1, by - bh + 2, EYE); D(g, T, ex, by - bh + 2.2, EYE); D(g, T, ex + 1, by - bh + 2, EYE); }   // closed, meditating
    for (let x = -2; x <= 2; x++) D(g, T, 16 + x, by - bh + 5 + Math.abs(x) * 0.3, PAL.frog[3]);
    if (big) { E(g, T, PAL.halo, 16, by - bh + 3.4, 1, 1); }
    D(g, T, 16, by + 4.6, PAL.lotus[1]);
  }
  for (let i = 0; i < (big ? 9 : 5); i++) D(g, T, 16 - bw + 3 + msh(i, s, 5) * (bw * 2 - 6), by - 2 + msh(s, i, 6) * bh, PAL.frog[0]);                               // speckles
}

// ---------------------------------------------------------------- 25-27 Antennelle line: hum beetle to mantis
function drawBug(g, s, back) {
  if (s === 0) {
    const T = mkT(0.92, 16, 30);
    for (const lx of [-4, 0, 4]) { Cp(g, T, ["#3e4460", "#2a2e46", "#1a1c30", "#0e0e1c"], 16 + lx, 25, 16 + lx * 1.4 - 1, 29.4, 0.5); }
    E(g, T, PAL.shell, 16.6, 22.4, 7.6, 5.4);
    Cp(g, T, PAL.shell[3] ? ["#0c424a", "#0c424a", "#0c424a", "#0c424a"] : PAL.shell, 16.6, 17.4, 16.6, 27, 0.3);
    for (const [x, y] of [[13.6, 20], [19, 21], [14.6, 24]]) E(g, T, PAL.amber, x, y, 1, 0.9);
    E(g, T, ["#4e5478", "#323656", "#1e2038", "#10101e"], 9.4, 23, 3, 2.8);
    for (const a of [-1, 1]) { Cp(g, T, ["#4e5478", "#323656", "#1e2038", "#10101e"], 8.6, 21, 4 + a * 1.4, 12 - a, 0.4); D(g, T, 4 + a * 1.4, 11.4 - a, PAL.amber[1]); }
    if (!back) { eye(g, T, 7.8, 22.2, 1, PAL.amber[1]); D(g, T, 7.8, 22.2, PAL.amber[0]); }
    return;
  }
  const T = mkT(s === 1 ? 0.86 : 1.0, 16, 30), mantis = s === 2, body = mantis ? PAL.chitin : PAL.shell;
  for (const [x1, x2] of [[19, 24], [17, 15]]) Cp(g, T, dk(body), x1, 23, x2, 29.4, 0.6);
  E(g, T, body, 20.5, 21.5, mantis ? 6.4 : 5.4, mantis ? 2.8 : 3.8);                                                                                              // abdomen
  if (mantis) for (let i = 0; i < 3; i++) D(g, T, 18 + i * 2.6, 20.2, body[3]);
  Cp(g, T, body, 15, 21, 12.6, 12.4, mantis ? 1.4 : 1.8);                                                                                                         // upright thorax
  if (mantis) { Pg(g, T, dk(body), [[16, 14], [27, 11], [26, 15], [17, 18]]); }                                                                                 // folded wing
  // raptor forelegs: blades on Thrumantis
  const blade = mantis ? PAL.amber : body;
  Cp(g, T, body, 12.6, 14.6, 8.8, 18.6, 0.8); Cp(g, T, blade, 8.8, 18.6, mantis ? 4 : 7.4, mantis ? 9.6 : 14, mantis ? 0.9 : 0.7);
  if (mantis) for (let i = 1; i < 4; i++) D(g, T, 8.8 - i * 1.2, 18.6 - i * 2.2 + 0.6, PAL.white);
  Cp(g, T, dk(body), 13.6, 15, 11, 19.4, 0.7); Cp(g, T, dk(blade), 11, 19.4, mantis ? 8.4 : 9.6, mantis ? 10.4 : 15.4, 0.7);
  // head: triangle with big eyes and antennae
  Pg(g, T, body, [[9.6, 9], [15.6, 9.6], [12.4, 14.4]]);
  for (const a of [-1, 1]) Cp(g, T, body, 12 + a, 9.4, 10 + a * 3, mantis ? 3 : 4.6, 0.35);
  if (!back) { E(g, T, mantis ? PAL.amber : ["#ffe29a", "#f8a83c", "#b8641c", "#6a300c"], 10.6, 10.4, 1.4, 1.4); E(g, T, mantis ? PAL.amber : PAL.amber, 14.4, 10.6, 1.2, 1.2); D(g, T, 10.4, 10, PAL.white); }
}

// ---------------------------------------------------------------- 28-31 Howlpup line: wolf
function drawWolf(g, s, back) {
  const T = mkT([0.66, 0.8, 0.92, 1.0][s]), hk = [1.35, 1.12, 1.0, 1.0][s], fur = s === 3 ? PAL.wolf : s >= 2 ? PAL.wolfDark : PAL.wolf;
  const hx = 8.4 - (hk - 1) * 2, hy = 13.6 - (hk - 1) * 2;
  Cp(g, T, fur, 24.4, 18.6, 29, 22, s === 0 ? 1.8 : 2.4); E(g, T, fur, 29, 22.6, 1.8, 2.2);                                                                     // bushy tail
  Cp(g, T, dk(fur), 22.4, 22, 24.4, 29.4, 1.6); Cp(g, T, dk(fur), 13.5, 22, 15, 29.4, 1.6);
  E(g, T, fur, 18, 20, 7.8, 4.8);
  E(g, T, s === 3 ? PAL.stone : ["#c8ccdc", "#9aa0be", "#6a7090", "#3a3e58"], 16.4, 23, 4.2, 1.4);
  if (s >= 2) for (let i = 0; i < 6; i++) { const sx = 13 + i * 2.2; Pg(g, T, s === 3 ? PAL.sun : PAL.scar, [[sx, 16.4], [sx + 0.6, 12.4 - (i % 2)], [sx + 1.8, 16]]); }   // raised hackles
  if (s === 1) { D(g, T, 18, 18, PAL.scar[1]); D(g, T, 19, 19, PAL.scar[1]); }
  for (const lx of [20.6, 12.2]) { Cp(g, T, fur, lx + 0.6, 22, lx - 0.8, 29, 1.8); E(g, T, dk(fur), lx - 1.2, 29.4, 1.8, 1); }
  if (s === 3) { for (let i = 0; i < 9; i++) { const a = Math.PI * (0.4 + i / 8 * 1.3); Pg(g, T, PAL.sun, [[hx + 1 + Math.cos(a - 0.2) * 5, hy + 1 + Math.sin(a - 0.2) * 5], [hx + 1 + Math.cos(a) * 8.4, hy + 1 + Math.sin(a) * 8.4], [hx + 1 + Math.cos(a + 0.2) * 5, hy + 1 + Math.sin(a + 0.2) * 5]]); } E(g, T, PAL.sun, hx + 1, hy + 1, 5.4, 5.4); }
  Cp(g, T, fur, 13, 18.6, hx + 1, hy + 1, 2.6 * hk);
  canineHead(g, T, fur, ["#e8ecf6", "#c0c6da", "#8a90aa", "#4e526c"], hx, hy, hk, s >= 2 ? PAL.scar : ["#ffc8c0", "#e09088", "#a05a58", "#5a2a2a"], { earH: 6, snout: 3.2 });
  if (!back) {
    glowEye(g, T, hx - 1.8 * hk, hy - 0.8 * hk, s === 3 ? PAL.sun[1] : PAL.amber[1], s === 0 ? 2 : 1);
    D(g, T, hx - 6.4 * hk, hy + 0.6 * hk, EYE);
    if (s >= 1) { D(g, T, hx - 4.6 * hk, hy + 2.6 * hk, PAL.white); D(g, T, hx - 3.4 * hk, hy + 2.6 * hk, PAL.white); }                                       // bared fangs
    if (s >= 2) { D(g, T, hx - 1.4, hy - 2.6, PAL.scar[1]); D(g, T, hx - 0.6, hy - 1.8, PAL.scar[1]); }
  }
}

// ---------------------------------------------------------------- 32-34 Tuskit line: war boar
function drawBoar(g, s, back) {
  const T = mkT([0.7, 0.88, 1.0][s]), hide = PAL.hide, hx = 9, hy = 18;
  Cp(g, T, dk(hide), 22, 23, 23, 29.4, 2); Cp(g, T, dk(hide), 13.6, 23, 14, 29.4, 2);
  E(g, T, hide, 18.4, 20.4, 9, 6.4);
  for (let i = 0; i < 7; i++) Pg(g, T, ["#5a3424", "#3e2218", "#28140e", "#160a06"], [[12 + i * 2, 15.2 - Math.sin(i / 6 * Math.PI) * 1.4], [12.8 + i * 2, 11.6 - Math.sin(i / 6 * Math.PI) * 2.4], [14 + i * 2, 15 - Math.sin(i / 6 * Math.PI) * 1.4]]);   // bristle ridge
  if (s >= 1) for (const [px, py] of [[17, 17], [21.5, 18], [19.6, 22]]) E(g, T, s === 2 ? PAL.stone : PAL.plate, px, py, 2.6, 2);                                // armor plates / rock
  if (s === 2) { E(g, T, PAL.moss, 20, 14.6, 3, 1.2); E(g, T, PAL.moss, 16, 15, 1.6, 0.8); }
  for (const lx of [20.6, 12.6]) { Cp(g, T, hide, lx, 24, lx - 0.4, 29.2, 2.2); E(g, T, ["#4a3428", "#30201a", "#1e140e", "#0e0806"], lx - 0.6, 29.6, 2, 0.9); }
  E(g, T, hide, hx, hy, 5.4, 4.6);
  E(g, T, ["#f0b4a0", "#d08870", "#9a5840", "#5a3020"], hx - 4.6, hy + 1.6, 2.4, 2.2);                                                                           // snout
  if (!back) { D(g, T, hx - 5.6, hy + 1.2, EYE); D(g, T, hx - 4.6, hy + 2.2, EYE); }
  Pg(g, T, hide, [[hx + 1.6, hy - 3.4], [hx + 4.4, hy - 6.8], [hx + 4.4, hy - 2.6]]);
  const tl = [2.6, 4.2, 6][s];
  Pg(g, T, PAL.tusk, [[hx - 3.4, hy + 3], [hx - 3.8 - tl * 0.4, hy + 2 - tl], [hx - 2.4, hy + 3.4]]);
  if (!back) { if (s === 2) glowEye(g, T, hx - 1.6, hy - 1.4, "#ffa040", 2); else eye(g, T, hx - 1.4, hy - 1.4, s === 0 ? 2 : 1); }
}

// ---------------------------------------------------------------- 35 Eclipsar: half sun, half moon
function drawEclipsar(g, s, back) {
  const T = mkT(1.0), sun = PAL.gold, moon = PAL.nightBat;
  Pg(g, T, ["#ffe896", "#f4b84a", "#c47a2a", "#7a4418"], [[17, 13], [29, 2], [30, 8], [27, 9], [29, 13], [25, 14], [26, 17], [20, 17]]);                          // sun wing, feathered
  Pg(g, T, ["#9a7ad8", "#6a4aa8", "#40287a", "#20143e"], [[15, 13], [6, 1], [5.4, 7], [8, 8], [5, 12], [10, 13], [9, 16], [14, 17]]);                            // moon wing, membrane
  Cp(g, T, dk(moon), 22.6, 22, 24.4, 29.4, 1.8); Cp(g, T, dk(sun), 13.5, 22, 15, 29.4, 1.8);
  E(g, T, sun, 15, 20.4, 5.4, 4.8); E(g, T, moon, 21, 20.4, 5.4, 4.8);
  Cp(g, T, moon, 25.6, 19, 29.6, 24, 0.9); E(g, T, PAL.violet, 29.8, 24.6, 1.2, 1.2);
  for (const [lx, r] of [[20.6, moon], [12.2, sun]]) Cp(g, T, r, lx + 0.6, 22, lx - 0.8, 29, 2);
  E(g, T, sun, 9, 13.4, 4.4, 4);
  E(g, T, moon, 10.4, 13.4, 2.6, 4);
  Pg(g, T, PAL.stone, [[10.4, 10.4], [13.6, 4], [12, 10.6]]); Pg(g, T, PAL.halo, [[8, 10.4], [5.6, 4.6], [9.4, 10]]);                                            // crescent and sun horns
  if (!back) { glowEye(g, T, 6.6, 12.4, "#fff08a", 1); glowEye(g, T, 10.8, 12.4, "#c890ff", 1); D(g, T, 5, 15, EYE); }
}

// ---------------------------------------------------------------- 36-39 Scrapling line: Dominion infantry frames
function drawScrap(g, s, back) {
  const T = mkT([0.62, 0.8, 0.92, 1.0][s]), st = PAL.steel, gun = PAL.gun, acc = PAL.red;
  if (s === 0) {
    Cp(g, T, gun, 13, 24, 12, 29.4, 1.6); Cp(g, T, gun, 19, 24, 20, 29.4, 1.6);
    Pg(g, T, PAL.rust, [[10, 15], [22, 15], [22, 25], [10, 25]]);
    Pg(g, T, st, [[12, 16], [21, 16], [21, 23], [12, 23]]);
    E(g, T, gun, 15.6, 19.4, 3.4, 3.4); if (!back) { E(g, T, acc, 15.6, 19.4, 1.8, 1.8); D(g, T, 15, 18.6, PAL.white); }
    Cp(g, T, gun, 19, 15, 21, 9, 0.4); E(g, T, acc, 21, 8.6, 1, 1);
    D(g, T, 11, 17, PAL.rust[3]); D(g, T, 20, 24, PAL.rust[3]);
    return;
  }
  const wide = [0, 6, 8, 10][s], top = [0, 9, 8, 4][s];
  for (const lx of [-1, 1]) { Cp(g, T, gun, 16 + lx * (wide - 3), 22, 16 + lx * (wide - 2), 29.4, s === 3 ? 2.8 : 2); Pg(g, T, st, [[16 + lx * (wide - 2) - 2.6, 28], [16 + lx * (wide - 2) + 2.6, 28], [16 + lx * (wide - 2) + 2.6, 30], [16 + lx * (wide - 2) - 2.6, 30]]); }
  if (s === 3) {                                                                                                                                                   // the fortress body
    Pg(g, T, PAL.stone, [[5, 10], [27, 10], [27, 23], [5, 23]]);
    for (let i = 0; i < 6; i++) Pg(g, T, PAL.stone, [[5 + i * 4, 6.6], [7.4 + i * 4, 6.6], [7.4 + i * 4, 10.4], [5 + i * 4, 10.4]]);
    for (const wx of [9, 16, 23]) Pg(g, T, ["#fff4c8", "#fcd888", "#e8903a", "#a8441c"], [[wx - 1, 14], [wx + 1, 14], [wx + 1, 18], [wx - 1, 18]]);
    Pg(g, T, acc, [[14, 2], [19, 3], [14, 5]]); Cp(g, T, gun, 14, 2, 14, 7, 0.3);
    Pg(g, T, st, [[3, 21], [29, 21], [29, 24], [3, 24]]);
    return;
  }
  Pg(g, T, st, [[16 - wide, 11], [16 + wide, 11], [16 + wide - 1, 23], [16 - wide + 1, 23]]);                                                                     // torso
  Pg(g, T, gun, [[16 - wide + 2, 14], [16 + wide - 2, 14], [16 + wide - 3, 20], [16 - wide + 3, 20]]);
  E(g, T, acc, 16, 17, 1.4, 1.4);
  for (const lx of [-1, 1]) E(g, T, st, 16 + lx * (wide + 1), 12.4, 3, 2.4);                                                                                     // pauldrons
  Cp(g, T, gun, 16 + wide + 1, 14, 16 + wide + 2, 21, 1.4); Cp(g, T, gun, 16 - wide - 1, 14, 16 - wide - 4, 19, 1.4);
  Pg(g, T, dk(gun), [[16 - wide - 4, 17], [16 - wide - 12 + s, 16], [16 - wide - 12 + s, 18.6], [16 - wide - 4, 20]]);                                           // rifle / cannon
  if (s === 2) { Pg(g, T, st, [[12, 2], [21, 2], [21, 10], [12, 10]]); Pg(g, T, gun, [[16, 4], [27, 1.4], [27, 4.6], [16, 7]]); }                                 // siege turret
  E(g, T, st, 16, top, 3.4, 3);                                                                                                                                    // helmet
  if (!back) { Pg(g, T, ["#1a1430", "#1a1430", "#1a1430", "#1a1430"], [[13, top - 0.4], [19, top - 0.4], [19, top + 1], [13, top + 1]]); glowEye(g, T, 14.6, top, "#ff5040", 2); }
}

// ---------------------------------------------------------------- 40-43 Noxdrone line: night raiders
function drawNox(g, s, back) {
  const T = mkT([0.7, 0.84, 0.94, 1.0][s], 16, s === 0 ? 26 : 30), so = PAL.soot, v = s === 3 ? PAL.violet : PAL.red;
  if (s === 0) {
    for (const side of [-1, 1]) { Pg(g, T, PAL.gun, [[16 + side * 3, 14], [16 + side * 13, 12], [16 + side * 13, 13.4], [16 + side * 3, 15.6]]); E(g, T, so, 16 + side * 13, 12.6, 1.6, 1); }
    E(g, T, so, 16, 17, 6, 5.4); E(g, T, dk(so), 16, 21, 4, 1.6);
    if (!back) { E(g, T, ["#1a1430", "#1a1430", "#1a1430", "#1a1430"], 15, 16.6, 2.6, 2); glowEye(g, T, 14, 16.4, "#ff4040", 3); }
    for (let i = 0; i < 4; i++) D(g, T, 15 + (i % 2), 24 + i, i < 2 ? "#ffa060" : "#e04020");
    return;
  }
  const lean = [0, 2, 0, 0][s];
  if (s >= 2) Pg(g, T, ["#3a2e5a", "#241c3e", "#160f28", "#0a0614"], [[13, 9], [21, 9], [25 + s, 26], [18, 24], [11 - s, 26]]);                                  // cape
  if (s === 3) for (let i = 0; i < 26; i++) D(g, T, 6 + msh(i, 3, 9) * 20, 4 + msh(3, i, 9) * 24, i % 3 ? PAL.violet[2] : PAL.violet[1]);                          // void motes
  Cp(g, T, dk(so), 14.4, 20, 12.6, 29.4, 1.3); Cp(g, T, dk(so), 18, 20, 20.4, 29.4, 1.3);
  Pg(g, T, so, [[11 - lean, 10], [21, 10], [20, 21], [12 - lean, 21]]);
  Pg(g, T, dk(so), [[13 - lean, 13], [19, 13], [18.4, 18], [13.6 - lean, 18]]);
  E(g, T, v, 16 - lean / 2, 15.4, 1.2, 1.2);
  // arms: claws, then blades
  const bl = s >= 2 ? PAL.wmetal : PAL.gun;
  Cp(g, T, so, 11 - lean, 12, 7 - lean, 18, 1.1); Pg(g, T, bl, [[7 - lean, 17], [2 - lean - s, 24 + s], [6 - lean, 19.4]]);
  Cp(g, T, so, 21, 12, 24, 18, 1.1); Pg(g, T, dk(bl), [[24, 17], [28 + s * 0.6, 24 + s], [25, 19.4]]);
  // head
  Pg(g, T, so, [[13 - lean, 4], [19 - lean, 4], [20 - lean, 9], [12 - lean, 9]]);
  if (s >= 2) { Pg(g, T, so, [[13 - lean, 4.6], [11.6 - lean, 0.6], [14.6 - lean, 4]]); Pg(g, T, so, [[19 - lean, 4.6], [20.4 - lean, 0.6], [17.4 - lean, 4]]); }
  if (!back) { glowEye(g, T, 13.6 - lean, 6.2, s === 3 ? "#d890ff" : "#ff4040", 2); glowEye(g, T, 17 - lean, 6.2, s === 3 ? "#d890ff" : "#ff4040", 1); }
}

// ---------------------------------------------------------------- 44-47 signature Warmons
function drawWestwarden(g, s, back) {
  const T = mkT(1.0), m = PAL.wmetal, gd = PAL.goldM;
  Cp(g, T, PAL.gun, 13.6, 21, 12.6, 29.4, 1.8); Cp(g, T, PAL.gun, 18.6, 21, 20.4, 29.4, 1.8);
  Pg(g, T, m, [[10, 10], [22, 10], [21, 22], [11, 22]]); Pg(g, T, gd, [[14, 12], [18, 12], [17.4, 20], [14.6, 20]]);
  for (const lx of [-1, 1]) E(g, T, gd, 16 + lx * 7, 11, 3, 2.4);
  Cp(g, T, m, 23, 12, 25, 19, 1.3); Pg(g, T, ["#4a6aa8", "#2c4480", "#1a2a58", "#0e1634"], [[24, 14], [29, 15], [29, 24], [24, 26], [22, 20]]);                     // shield
  Cp(g, T, PAL.wood ? m : m, 9, 12, 6, 18, 1.2);
  Cp(g, T, gd, 6, 30, 5, 1, 0.6); Pg(g, T, m, [[5, 0.4], [6.6, 4], [3.6, 4]]);                                                                                    // lance
  E(g, T, m, 16, 6.4, 3.6, 3.4);                                                                                                                                  // searchlight head
  if (!back) { E(g, T, PAL.halo, 15, 6.4, 2.2, 2.2); D(g, T, 14.4, 5.8, PAL.white); for (let i = 1; i < 6; i++) { D(g, T, 13 - i * 1.6, 6.4 - i * 0.4, PAL.halo[1]); D(g, T, 13 - i * 1.6, 7 + i * 0.5, PAL.halo[2]); } }
}
function drawMonolith(g, s, back) {
  const T = mkT(1.0), r = PAL.rune, glow = "#60fff0";
  Cp(g, T, dk(r), 11, 23, 10, 29.4, 2.8); Cp(g, T, dk(r), 21, 23, 22, 29.4, 2.8);
  Pg(g, T, r, [[6, 6], [26, 6], [27, 24], [5, 24]]);
  for (const [x, y] of [[9, 10], [23, 10], [16, 20]]) Pg(g, T, PAL.gun, [[x - 2, y - 1.6], [x + 2, y - 1.6], [x + 2, y + 1.6], [x - 2, y + 1.6]]);
  for (const lx of [-1, 1]) { Cp(g, T, r, 16 + lx * 10, 10, 16 + lx * 12, 21, 2.6); E(g, T, dk(r), 16 + lx * 12, 23, 3, 2.4); }
  E(g, T, r, 16, 4.4, 3, 2.4);
  for (const [x, y] of [[11, 14], [12, 15], [13, 16], [19, 13], [20, 14], [21, 13], [16, 9], [16, 10], [16, 11]]) D(g, T, x, y, glow);
  if (!back) { glowEye(g, T, 15, 4.4, glow, 2); }
}
function drawDreadnought(g, s, back) {
  const T = mkT(1.0), so = PAL.soot;
  Pg(g, T, PAL.gun, [[2, 24], [30, 24], [28, 30], [4, 30]]); for (let x = 4; x < 29; x += 3) D(g, T, x, 27, PAL.gun[3]);                                         // treads
  Pg(g, T, so, [[4, 9], [28, 9], [29, 24], [3, 24]]);
  for (let i = 0; i < 4; i++) Pg(g, T, dk(so), [[5 + i * 6, 9], [8 + i * 6, 9], [8 + i * 6, 5], [5 + i * 6, 5]]);                                              // armor fins
  E(g, T, ["#fff4c8", "#ffb040", "#e04020", "#7a1010"], 16, 17, 5, 4.4);                                                                                         // furnace
  for (let x = 11; x < 22; x += 2) D(g, T, x, 17, "#2a0a08");
  Pg(g, T, PAL.gun, [[3, 12], [-2, 11], [-2, 14], [3, 15]]); Pg(g, T, PAL.gun, [[29, 12], [34, 11], [34, 14], [29, 15]]);
  Pg(g, T, so, [[12, 3], [20, 3], [21, 9], [11, 9]]);
  if (!back) { glowEye(g, T, 13, 5.6, "#ff4020", 2); glowEye(g, T, 17, 5.6, "#ff4020", 2); }
  for (const cx of [8, 24]) { Cp(g, T, PAL.gun, cx, 5, cx, 0, 0.9); D(g, T, cx, -0.4, "#7a7a8a"); }
}
function drawSovereign(g, s, back) {
  const T = mkT(1.0), gd = PAL.goldM;
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; Pg(g, T, PAL.sun, [[16 + Math.cos(a - 0.15) * 9, 12 + Math.sin(a - 0.15) * 9], [16 + Math.cos(a) * 14, 12 + Math.sin(a) * 14], [16 + Math.cos(a + 0.15) * 9, 12 + Math.sin(a + 0.15) * 9]]); }
  E(g, T, PAL.sun, 16, 12, 10, 10);                                                                                                                               // the false sun
  Pg(g, T, PAL.red, [[10, 12], [22, 12], [27, 30], [5, 30]]);                                                                                                     // royal cape
  Cp(g, T, PAL.gun, 13.6, 22, 12.6, 30, 1.8); Cp(g, T, PAL.gun, 18.6, 22, 19.6, 30, 1.8);
  Pg(g, T, gd, [[11, 10], [21, 10], [20, 23], [12, 23]]); Pg(g, T, PAL.wmetal, [[14, 13], [18, 13], [17.4, 20], [14.6, 20]]);
  E(g, T, PAL.red, 16, 16, 1.4, 1.4);
  for (const lx of [-1, 1]) { E(g, T, gd, 16 + lx * 6.4, 11, 3, 2.6); Cp(g, T, gd, 16 + lx * 7, 13, 16 + lx * 9, 21, 1.3); }
  E(g, T, gd, 16, 6.6, 3.2, 3);
  Pg(g, T, PAL.halo, [[12.4, 4.4], [13.4, 0], [14.6, 3], [16, -0.4], [17.4, 3], [18.6, 0], [19.6, 4.4]]);                                                         // crown
  if (!back) { glowEye(g, T, 14.6, 6.4, "#ffffff", 3); }
}


// ======================================================================== v2: 64x64, modern sprite style
// Colored outlines (each part outlined in a dark tone of its own color), clean 3-band cel shading,
// cylinder shading on limbs, smooth organic shapes, expressive eyes. Front sprites face the camera in 3/4.
const MS2 = 64;
const hexToRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
class MonRig {
  constructor() { this.S = MS2; this.pid = new Int16Array(MS2 * MS2).fill(-1); this.parts = []; this.post = []; this.flatc = []; }
  part(ramp, o = {}) { this.parts.push({ ramp, ...o }); return this.parts.length - 1; }
  set(p, x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= MS2 || y >= MS2) return; this.pid[y * MS2 + x] = p; if (c) this.flatc[y * MS2 + x] = c; }
  fillPoly(p, P) {
    const xs = P.map(q => q[0]), ys = P.map(q => q[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const cx = x + 0.5, cy = y + 0.5; let ins = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > cy) !== (yj > cy) && cx < (xj - xi) * (cy - yi) / (yj - yi) + xi) ins = !ins; }
      if (ins) this.set(p, x, y);
    }
  }
  // ellipse with sphere shading
  e(ramp, cx, cy, rx, ry, o = {}) {
    const p = this.part(ramp, { sph: [cx, cy, rx, ry], ...o }), pts = [];
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    this.fillPoly(p, pts); return p;
  }
  // smooth closed blob through control points (Catmull-Rom), shaded as a sphere over its bounds
  blob(ramp, pts, o = {}) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let t = 0; t < 1; t += 0.125) {
        const t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    const xs = out.map(q => q[0]), ys = out.map(q => q[1]);
    const sph = o.flat ? null : [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2];
    const p = this.part(ramp, { sph, ...o }); this.fillPoly(p, out); return p;
  }
  poly(ramp, pts, o = {}) {
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const sph = o.flat ? null : [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2 + 0.5, (Math.max(...ys) - Math.min(...ys)) / 2 + 0.5];
    const p = this.part(ramp, { sph, ...o }); this.fillPoly(p, pts); return p;
  }
  // limb: capsule with cylinder shading
  limb(ramp, ax, ay, bx, by, r, o = {}) {
    const p = this.part(ramp, { cyl: [ax, ay, bx, by, r], ...o });
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(ay, by) - r); y <= Math.ceil(Math.max(ay, by) + r); y++) for (let x = Math.floor(Math.min(ax, bx) - r); x <= Math.ceil(Math.max(ax, bx) + r); x++) {
      const cx = x + 0.5, cy = y + 0.5, t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / L2)), ex = cx - (ax + t * dx), ey = cy - (ay + t * dy);
      if (ex * ex + ey * ey <= r * r) this.set(p, x, y);
    }
    return p;
  }
  // a curved tapering limb/tail along a quadratic bezier
  tail(ramp, a, c, b, r0, r1, o = {}) {
    const p = this.part(ramp, { ...o, sph: null, tube: [a, c, b, r0, r1] });
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, u = 1 - t, x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], r = r0 + (r1 - r0) * t;
      for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) if ((xx + 0.5 - x) ** 2 + (yy + 0.5 - y) ** 2 <= r * r) this.set(p, xx, yy);
    }
    return p;
  }
  dot(x, y, c) { this.post.push([Math.round(x), Math.round(y), c]); }
  line(pts, c) { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) this.dot(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, c); } }
  render() {
    const c = document.createElement("canvas"); c.width = c.height = MS2;
    const x2 = c.getContext("2d"), img = x2.createImageData(MS2, MS2), d = img.data, { pid, parts } = this, N = MS2;
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? -1 : pid[y * N + x];
    const put = (i, col) => { const [r, g, b] = typeof col === "string" ? hexToRgb(col) : col; d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; };
    const outlineOf = q => { const P = parts[q]; if (!P.ramp) return [40, 30, 50]; const [r, g, b] = hexToRgb(P.ramp[3]); return [r * 0.62, g * 0.58, b * 0.72]; };
    for (let i = 0; i < N * N; i++) {
      const p = pid[i], x = i % N, y = (i / N) | 0;
      if (p < 0) {
        const nb = [at(x, y + 1), at(x + 1, y), at(x - 1, y), at(x, y - 1)].find(q => q >= 0);
        if (nb !== undefined) put(i, outlineOf(nb));
        continue;
      }
      const P = parts[p];
      if (!P.ramp) { put(i, this.flatc[i]); continue; }
      const same = q => q === p || (q >= 0 && P.group != null && parts[q].group === P.group);
      const behind = q => q >= 0 && q < p && !same(q) && !parts[q].noLine;
      if (!P.noLine && (behind(at(x, y - 1)) || behind(at(x - 1, y)) || behind(at(x, y + 1)) || behind(at(x + 1, y)))) { put(i, P.ramp[3]); continue; }
      let l = 0;
      if (P.sph) { const [cx, cy, rx, ry] = P.sph, nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; l = -(nx * 0.5 + ny * 0.75); }
      else if (P.cyl) {
        const [ax, ay, bx, by, r] = P.cyl, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / (L * L)));
        const ex = (x + 0.5 - (ax + t * dx)) / r, ey = (y + 0.5 - (ay + t * dy)) / r; l = -(ex * 0.6 + ey * 0.8);
      } else if (P.tube) { l = -0.05; if (!same(at(x - 1, y)) || !same(at(x, y - 1))) l = 0.6; else if (!same(at(x + 1, y)) || !same(at(x, y + 1))) l = -0.6; }
      const k = P.flat ? 1 : l > (P.hi || 0.42) ? 0 : l < (P.lo || -0.3) ? 2 : 1;
      put(i, P.ramp[k]);
    }
    for (const [x, y, col] of this.post) if (x >= 0 && y >= 0 && x < N && y < N) put(y * N + x, col);
    x2.putImageData(img, 0, 0); return c;
  }
}
const P2 = {
  gold: ["#fff2b0", "#ffcc48", "#e48e28", "#8a4c16"], cream: ["#fffcec", "#fbe6b8", "#dcb27a", "#8a6a40"],
  ember: ["#ffd884", "#ff8a2e", "#d4481a", "#7a2410"], sun: ["#fffbd0", "#ffe060", "#ffa82c", "#b85a18"], fire: ["#fff6c0", "#ffb840", "#f06820", "#902a10"],
  nose: ["#a86a5a", "#6e3c34", "#4a2420", "#2a1210"], halo: ["#ffffff", "#fff6a0", "#f8c840", "#a07a18"], blush: "#ff9c8a",
};
// expressive eye: dark rim, colored iris, pupil, two shines. w/h are the eye's size.
function eye2(g, x, y, w, h, iris, o = {}) {
  if (o.closed) { g.line([[x - w, y + 0.5], [x - w * 0.4, y + 1.4], [x + w * 0.4, y + 1.4], [x + w, y + 0.5]], "#3a2018"); return; }
  g.e(["#3a2a3a", "#2a1c2c", "#1a1020", "#120a18"], x, y, w, h, { flat: true });
  g.e([iris[0], iris[1], iris[1], iris[3]], x + (o.look || 0) * 0.4, y + h * 0.25, w * 0.72, h * 0.62, { flat: true, noLine: true });
  g.e(["#1a1020", "#1a1020", "#1a1020", "#1a1020"], x + (o.look || 0) * 0.5, y + h * 0.18, w * 0.36, h * 0.38, { flat: true, noLine: true });
  g.dot(x - w * 0.35, y - h * 0.4, "#ffffff"); g.dot(x - w * 0.35 + 1, y - h * 0.4, "#ffffff"); g.dot(x - w * 0.35, y - h * 0.4 + 1, "#ffffff"); g.dot(x - w * 0.35 + 1, y - h * 0.4 + 1, "#ffffff");
  g.dot(x + w * 0.4, y + h * 0.45, "#ffffff");
  if (o.brow) g.line(o.brow, o.browCol || "#5a2a14");
}
const IRIS = { amber: ["#ffe08a", "#f0a030", "#b06018", "#5a2a08"], sky: ["#c8f0ff", "#58b8f0", "#2a78c0", "#143c70"], moss: ["#d8ff9a", "#7cd050", "#3c8a30", "#1c4a18"], rose: ["#ffd0f0", "#ff70c0", "#c03888", "#601848"] };

// ---------------------------------------------------------------- Lumkit -> Solmane -> Haloclaw -> Solarchon
function lion2(g, s, back) {
  const G = P2.gold, C = P2.cream, Em = P2.ember;
  const shadeR = r => [r[1], r[2], r[2], r[3]];
  if (s === 0) {                                                    // LUMKIT: chubby cub, big head, ember-tufted tail, sun mark
    g.tail(G, [42, 52], [52, 50], [50, 38], 2.4, 1.6); g.blob(Em, [[47, 38], [50, 31], [52, 36], [55, 33], [54, 40], [49, 42]]);
    g.limb(shadeR(G), 41, 52, 42, 59, 3.4); g.limb(shadeR(G), 31, 53, 32, 59, 3.2);
    g.e(G, 37, 50, 10, 7.6);
    g.e(C, 34, 54, 6, 3.4, { noLine: true });
    g.limb(G, 27, 51, 26, 58.6, 3.6); g.e(C, 25.4, 59, 3.8, 2);
    g.limb(G, 44, 52, 45.4, 58.6, 3.4); g.e(C, 45.6, 59, 3.4, 1.8);
    if (!back) {
      g.e(G, 18, 24, 5, 5.4); g.e(G, 38, 23, 5, 5.4); g.e(Em, 18.4, 24.6, 2.8, 3, { noLine: false }); g.e(Em, 37.6, 23.6, 2.8, 3);
      g.e(G, 28, 35, 13.6, 12);
      g.blob(G, [[14, 36], [11, 39], [15, 41]]); g.blob(G, [[41, 34], [45, 37], [41, 40]]);                          // cheek fluff
      g.e(C, 27, 42, 7, 4.8, { noLine: true });
      g.poly(Em, [[27, 25], [29, 28], [27, 31], [25, 28]]);                                                          // sun mark
      eye2(g, 20.5, 34, 3.4, 4.2, IRIS.amber); eye2(g, 33.5, 33.6, 3.4, 4.2, IRIS.amber);
      g.e(P2.nose, 26.5, 39.6, 2.2, 1.5);
      g.line([[23, 43], [24, 44], [25.5, 44], [26.5, 42.6]], "#6e3c34"); g.line([[26.5, 42.6], [27.5, 44], [29, 44], [30, 43]], "#6e3c34");
      g.dot(17, 39, P2.blush); g.dot(18, 39, P2.blush); g.dot(37, 39, P2.blush); g.dot(38, 39, P2.blush);
    } else {
      g.e(G, 18, 24, 5, 5.4); g.e(G, 38, 23, 5, 5.4); g.e(G, 28, 35, 13.6, 12);
      g.blob(shadeR(G), [[22, 26], [34, 26], [30, 30], [26, 30]]);
    }
    return;
  }
  if (s === 1) {                                                    // SOLMANE: proud young lion, scalloped sun-disc mane
    g.tail(G, [46, 44], [58, 44], [56, 30], 2.2, 1.4); g.blob(Em, [[53, 30], [56, 22], [58, 28], [61, 25], [60, 33], [55, 34]]);
    g.limb(shadeR(G), 46, 48, 49, 59, 3.4); g.limb(shadeR(G), 30, 48, 31, 59, 3.2);
    g.e(G, 39, 44, 14, 8.4);
    g.e(C, 35, 49, 8, 3.4, { noLine: true });
    g.limb(G, 26, 47, 24, 59, 3.8); g.e(C, 23.4, 59.4, 4, 2);
    g.limb(G, 43, 48, 44, 59, 3.8); g.e(C, 44.4, 59.4, 4, 2);
    const mane = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? 15 : 12.4; mane.push([22 + Math.cos(a) * r, 30 + Math.sin(a) * r]); }
    g.blob(Em, mane);
    g.e(G, 21, 31, 10, 9.6);
    if (!back) {
      g.e(C, 19, 37, 6.4, 4.2, { noLine: true });
      eye2(g, 15.4, 29.6, 2.8, 3.2, IRIS.amber, { brow: [[12, 26], [15, 25.4], [18, 26.2]] }); eye2(g, 25.4, 29.4, 2.8, 3.2, IRIS.amber, { brow: [[23, 26], [26, 25.4], [29, 26.4]] });
      g.e(P2.nose, 18.6, 34.4, 2, 1.4);
      g.line([[16, 38], [18.6, 39], [21.6, 37.6]], "#6e3c34"); g.dot(17, 38.4, "#ffffff");
    } else g.blob(Em, [[14, 26], [30, 24], [28, 36], [16, 36]]);
    return;
  }
  if (s === 2) {                                                    // HALOCLAW: lean stalker mid-stride, ray mane, glowing claws
    g.tail(G, [50, 40], [60, 40], [60, 26], 2.2, 1.2); g.blob(P2.fire, [[57, 26], [59, 17], [61, 23], [63, 21], [62, 30], [58, 30]]);
    g.limb(shadeR(G), 49, 44, 55, 58, 3.6); g.limb(shadeR(G), 31, 45, 36, 58, 3.2);
    g.e(G, 40, 41, 15, 8);
    for (const x of [36, 42, 48]) g.poly(shadeR(G), [[x, 35], [x + 3, 35], [x + 1, 42]], { noLine: true });                   // stripes
    g.e(C, 36, 46, 9, 3, { noLine: true });
    g.limb(G, 27, 44, 19, 52, 3.8); g.limb(G, 19, 52, 15, 58, 3.4);                                                          // front leg reaching forward
    g.limb(G, 45, 45, 44, 58, 3.8);
    for (const [cx, cy] of [[13, 59], [42, 59.6]]) { g.e(C, cx + 1, cy, 3.8, 1.8); for (let i = 0; i < 3; i++) g.poly(P2.halo, [[cx - 2 + i * 2, cy - 1], [cx - 3 + i * 2, cy + 2.4], [cx - 1 + i * 2, cy + 1]]); }
    const rays = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = i % 2 ? 17 : 12; rays.push([22 + Math.cos(a) * r, 27 + Math.sin(a) * r]); }
    g.poly(P2.fire, rays); g.e(Em, 22, 27, 12, 11.4);
    g.e(G, 21, 28, 9.6, 9);
    if (!back) {
      g.e(C, 18, 34, 6.4, 4, { noLine: true });
      eye2(g, 14.6, 26.6, 2.6, 2.4, IRIS.amber, { brow: [[11, 23.4], [15, 24.6], [18, 24]] }); eye2(g, 24.6, 26.4, 2.6, 2.4, IRIS.amber, { brow: [[22, 24], [25, 24.6], [29, 23]] });
      g.e(P2.nose, 17.6, 31.6, 2, 1.4);
      g.line([[14, 35.6], [17.6, 36.6], [22, 35]], "#6e3c34"); g.dot(15, 36, "#ffffff"); g.dot(21, 35.6, "#ffffff");
    } else g.e(Em, 22, 27, 9, 8);
    return;
  }
  // SOLARCHON: majestic, huge radiant mane, floating halo, calm closed eyes
  g.tail(G, [50, 44], [62, 46], [60, 28], 2.6, 1.6); g.blob(P2.fire, [[57, 28], [59, 18], [62, 24], [64, 20], [63, 32], [58, 33]]);
  g.limb(shadeR(G), 50, 46, 53, 60, 4.2); g.limb(shadeR(G), 33, 47, 34, 60, 4);
  g.e(G, 41, 43, 16, 10);
  g.e(C, 37, 49, 10, 4, { noLine: true });
  g.limb(G, 28, 46, 26, 60, 4.6); g.limb(G, 46, 47, 47, 60, 4.6);
  for (const cx of [25, 47.4]) { g.e(P2.halo, cx, 60.4, 5, 2.2); }
  const rays = []; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, r = i % 2 ? 21 : 15; rays.push([24 + Math.cos(a) * r, 27 + Math.sin(a) * r]); }
  g.poly(P2.sun, rays); g.e(P2.fire, 24, 27, 15.6, 15); g.e(Em, 24, 28, 11.6, 11.4);
  g.e(G, 23, 29, 10.6, 10);
  g.blob(C, [[16, 38], [30, 38], [28, 47], [23, 50], [18, 47]], { noLine: true });                                            // chest fluff
  if (!back) {
    g.e(C, 20, 35, 6.8, 4.2, { noLine: true });
    eye2(g, 16.6, 27.6, 2.8, 2, IRIS.amber, { closed: true }); eye2(g, 27, 27.4, 2.8, 2, IRIS.amber, { closed: true });
    g.poly(P2.halo, [[22, 19], [24, 22], [22, 25], [20, 22]]);
    g.e(P2.nose, 19.6, 32.6, 2.2, 1.5);
    g.line([[16.6, 37], [19.6, 38], [23, 36.6]], "#6e3c34");
  } else g.e(Em, 24, 28, 9, 9);
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, x = 24 + Math.cos(a) * 9, y = 3.6 + Math.sin(a) * 2.2; g.dot(x, y, Math.sin(a) < 0 ? "#fff6a0" : "#f8c840"); }
}
const MON_DRAW2 = { lumkit: [lion2, 0], solmane: [lion2, 1], haloclaw: [lion2, 2], solarchon: [lion2, 3] };

Object.assign(P2, {
  fawn: ["#f8d4a4", "#d89c64", "#a46a3c", "#5a361c"], moss: ["#dcff9c", "#88d85a", "#48a042", "#205a2c"], stone: ["#ffffff", "#d6daee", "#9ca2c6", "#525880"],
  bronze: ["#fff2b4", "#ffc850", "#c88a28", "#6a4410"], lamp: ["#fffbe0", "#ffe080", "#ff9a3c", "#a8441c"], hoof: ["#8a7a8a", "#5a4a5a", "#3a2c3a", "#1e141e"],
  bat: ["#ffd4f0", "#f490cc", "#c0589e", "#6a2458"], batIn: ["#fff0fa", "#ffc0e4", "#f080c0", "#a03c80"], wing: ["#e4c0fc", "#b884ec", "#8050c0", "#40246e"],
  night: ["#9aa4e4", "#5e66b4", "#383e7c", "#1a1e44"], nightWing: ["#c0a0f4", "#8460d0", "#52349a", "#28164e"], fang: ["#ffffff", "#f0f0f8", "#c8c8dc", "#7a7a94"],
});
const dkr = r => [r[1], r[2], r[2], r[3]];

// ---------------------------------------------------------------- Mossfawn -> Stillhorn -> Cairnhart -> Monastag
function deer2(g, s, back) {
  const F = P2.fawn, C = P2.cream, M = P2.moss, St = P2.stone;
  const L = [{ b: [37, 48, 10, 6.5], legT: 49, legL: 10, head: [26, 36, 10, 9], neck: [32, 46, 28, 40, 4] },
             { b: [38, 41, 12, 7], legT: 43, legL: 16, head: [19, 22, 8, 7.4], neck: [27, 37, 21, 26, 4.4] },
             { b: [39, 39, 14, 7.6], legT: 41, legL: 18, head: [17, 20, 7.6, 7], neck: [27, 34, 19, 24, 4.8] },
             { b: [40, 38, 15, 8.4], legT: 40, legL: 19, head: [16, 19, 8, 7.2], neck: [28, 33, 18, 23, 5.2] }][s];
  const [bx, by, brx, bry] = L.b, foot = L.legT + L.legL;
  g.poly(F, [[bx + brx - 2, by - 3], [bx + brx + 4, by - 6], [bx + brx + 3, by - 1]]);                                    // flag tail
  g.limb(dkr(F), bx + brx * 0.55, L.legT, bx + brx * 0.7, foot, 2.4); g.limb(dkr(F), bx - brx * 0.4, L.legT, bx - brx * 0.3, foot, 2.4);
  g.e(F, bx, by, brx, bry);
  g.e(C, bx - 2, by + bry * 0.55, brx * 0.6, bry * 0.4, { noLine: true });
  for (let i = 0; i < 5; i++) g.e(C, bx - brx * 0.5 + i * brx * 0.24, by - bry * 0.2 + (i % 2) * 2.4, 1.2, 1, { flat: true, noLine: true });   // fawn spots
  // moss mantle grows with each stage, with pebbles and (finally) little flowers
  g.blob(M, [[bx - brx * 0.6, by - bry * 0.5], [bx, by - bry - 2 - s], [bx + brx * 0.7, by - bry * 0.6], [bx + brx * 0.5, by - bry * 0.1], [bx - brx * 0.5, by - bry * 0.05]]);
  for (let i = 0; i <= s; i++) g.e(St, bx - brx * 0.3 + i * 4, by - bry - 0.5 - (i % 2), 1.8, 1.4);
  if (s === 3) for (const [fx, fy] of [[bx + 4, by - bry - 1], [bx - 6, by - bry + 1]]) { g.dot(fx, fy, "#ffffff"); g.dot(fx + 1, fy, "#ffd0f0"); g.dot(fx, fy + 1, "#ffd0f0"); }
  g.limb(F, bx - brx * 0.6, L.legT, bx - brx * 0.75, foot, 2.6); g.limb(F, bx + brx * 0.35, L.legT, bx + brx * 0.4, foot, 2.6);
  for (const fx of [bx - brx * 0.75, bx + brx * 0.4]) g.e(P2.hoof, fx, foot + 0.6, 2.6, 1.4);
  if (L.neck) g.limb(F, ...L.neck);
  const [hx, hy, hrx, hry] = L.head;
  // ears
  g.blob(F, [[hx + 2, hy - 2], [hx + hrx + 7, hy - 7], [hx + hrx + 5, hy - 2], [hx + hrx - 1, hy + 1]]);
  g.blob(C, [[hx + 4, hy - 2], [hx + hrx + 5, hy - 5.6], [hx + hrx + 3, hy - 2.4], [hx + hrx - 1, hy]], { noLine: true });
  if (!back) g.blob(F, [[hx - 2, hy - 2], [hx - hrx - 6, hy - 6], [hx - hrx - 4, hy - 1], [hx - hrx + 1, hy + 1]]);
  // antlers before the head so it overlaps their roots
  const ant = (ax, dir, n, big) => { for (let i = 0; i < n; i++) g.e(St, ax + dir * (i % 2) * 1.4, hy - hry - 1 - i * (big ? 3.6 : 3), (big ? 3 : 2.4) - i * 0.25, big ? 2.1 : 1.7); };
  if (s === 1) { g.e(St, hx - 2.4, hy - hry + 0.4, 2.2, 1.6); g.e(St, hx + 3, hy - hry, 2.2, 1.6); }
  if (s === 2) { ant(hx - 3, -1, 3, false); ant(hx + 3.4, 1, 4, false); }
  if (s === 3) {
    ant(hx - 3.4, -1, 4, true); ant(hx + 3.8, 1, 4, true);
    g.limb(St, hx - 4, hy - hry - 9, hx - 12, hy - hry - 14, 1.4); g.limb(St, hx + 5, hy - hry - 10, hx + 13, hy - hry - 15, 1.4);
    for (const [px, py] of [[hx - 12, hy - hry - 14], [hx + 13, hy - hry - 15]]) { g.line([[px, py + 1], [px, py + 4]], "#6a4410"); g.e(P2.bronze, px, py + 6.6, 2.4, 2.6); g.dot(px, py + 9.6, "#6a4410"); }   // bells
    g.line([[hx + 8, hy - hry - 12], [hx + 8, hy - hry - 7]], "#6a4410"); g.e(P2.lamp, hx + 8, hy - hry - 4.6, 2, 2.6);                                           // lantern
  }
  g.e(F, hx, hy, hrx, hry);
  if (s === 0) g.blob(M, [[hx - 4, hy - hry + 1], [hx - 1, hy - hry - 3], [hx + 2, hy - hry - 1], [hx + 5, hy - hry + 1], [hx, hy - hry + 3]]);      // moss tuft
  if (!back) {
    g.e(C, hx - hrx * 0.45, hy + hry * 0.5, hrx * 0.5, hry * 0.36, { noLine: true });
    const ir = s === 3 ? IRIS.amber : IRIS.moss, ew = s === 0 ? 3.2 : 2.2, eh = s === 0 ? 4 : 2.6;
    if (s === 3) { eye2(g, hx - hrx * 0.4, hy - 1, ew, eh, ir, { closed: true }); eye2(g, hx + hrx * 0.35, hy - 1, ew, eh, ir, { closed: true }); g.poly(P2.halo, [[hx, hy - 6], [hx + 1.4, hy - 4.2], [hx, hy - 2.6], [hx - 1.4, hy - 4.2]]); }
    else { eye2(g, hx - hrx * 0.4, hy - 1, ew, eh, ir); eye2(g, hx + hrx * 0.38, hy - 1.2, ew * 0.9, eh, ir); }
    g.e(P2.nose, hx - hrx * 0.62, hy + hry * 0.4, 1.6, 1.1);
    if (s === 0) { g.dot(hx - hrx * 0.9, hy + 2, P2.blush); g.dot(hx + hrx * 0.6, hy + 2, P2.blush); }
    g.line([[hx - hrx * 0.66, hy + hry * 0.62], [hx - hrx * 0.4, hy + hry * 0.7], [hx - hrx * 0.2, hy + hry * 0.6]], "#6e3c34");
  }
}

// ---------------------------------------------------------------- Echit -> Sonarix -> Howlwing -> Resonyx
function bat2(g, s, back) {
  const night = s === 3, B = night ? P2.night : P2.bat, In = P2.batIn, W = night ? P2.nightWing : P2.wing;
  if (s === 0) {                                                          // ECHIT: round pup sitting, ears bigger than its head
    g.blob(W, [[20, 42], [11, 50], [14, 54], [19, 56], [24, 50]]); g.blob(dkr(W), [[44, 42], [53, 50], [50, 54], [45, 56], [40, 50]]);
    g.limb(dkr(B), 27, 54, 26, 59.4, 2.2); g.limb(dkr(B), 37, 54, 38, 59.4, 2.2);
    g.blob(B, [[19, 36], [11, 12], [25, 22], [29, 32]]); g.blob(In, [[20.4, 33], [13.6, 15.4], [23.4, 23], [26.4, 31]], { noLine: true });
    g.blob(B, [[35, 32], [49, 11], [52, 24], [46, 36]]); g.blob(In, [[37.4, 31], [47.4, 15], [49.6, 24], [45, 33]], { noLine: true });
    g.e(B, 32, 42, 14, 13);
    g.e(P2.cream, 31, 48, 8, 6, { noLine: true });
    g.blob(B, [[26, 28], [31, 25], [36, 28], [31, 31]], { noLine: true });                                       // fluffy tuft
    if (!back) {
      eye2(g, 25, 39, 3.6, 4.4, IRIS.rose); eye2(g, 37.6, 38.6, 3.6, 4.4, IRIS.rose);
      g.e(P2.nose, 31.4, 43, 1.6, 1.1);
      g.line([[28.6, 45.4], [30, 46.4], [31.4, 45.6], [32.8, 46.4], [34.2, 45.4]], "#6a2458"); g.dot(30, 47.4, "#ffffff");
      g.dot(21, 44, P2.blush); g.dot(22, 44, P2.blush); g.dot(41, 44, P2.blush); g.dot(42, 44, P2.blush);
    }
    return;
  }
  // flying forms
  const cx = 32, cy = [0, 34, 33, 32][s], span = [0, 25, 28, 30][s], up = [0, 15, 18, 20][s];
  const wing = side => {
    const r = side < 0 ? W : dkr(W), tip = [cx + side * span, cy - up];
    const pts = [[cx + side * 4, cy - 4], tip, [cx + side * (span - 1), cy + 4], [cx + side * (span - 6), cy + 1], [cx + side * (span - 9), cy + 9], [cx + side * (span - 15), cy + 5], [cx + side * (span - 18), cy + 12], [cx + side * 5, cy + 6]];
    g.poly(r, pts);
    const bone = night ? P2.night : P2.bat;
    for (const f of [[span - 1, 4], [span - 9, 9], [span - 18, 12]]) g.limb(dkr(bone), cx + side * 5, cy - 2, cx + side * f[0], cy + f[1], 0.8, { noLine: true });
    g.limb(bone, cx + side * 4, cy - 4, tip[0], tip[1], 1.4);
    g.poly(P2.fang, [[tip[0], tip[1] - 1], [tip[0] - side * 2, tip[1] - 4], [tip[0] - side * 1.6, tip[1]]]);        // wing claw
  };
  wing(1);
  if (night) { g.tail(B, [cx + 4, cy + 10], [cx + 16, cy + 22], [cx + 22, cy + 26], 2.6, 1.2); g.poly(P2.bat, [[cx + 20, cy + 24], [cx + 27, cy + 22], [cx + 25, cy + 29]]); }
  wing(-1);
  g.e(B, cx, cy + 4, s >= 2 ? 9 : 8, s >= 2 ? 10 : 9);
  g.e(night ? ["#d8dcf6", "#a8aee0", "#7078b8", "#3a4080"] : P2.cream, cx - 1, cy + 7, 5, 6, { noLine: true });
  for (const lx of [-3, 3]) g.limb(dkr(B), cx + lx, cy + 12, cx + lx * 1.4, cy + 17, 1.4);
  const hy = cy - 8, eh = [0, 10, 12, 12][s];
  g.blob(B, [[cx - 7, hy + 1], [cx - 10 - s, hy - eh - 2], [cx - 2, hy - 3]]); g.blob(In, [[cx - 6.4, hy - 0.4], [cx - 9 - s, hy - eh + 1], [cx - 3.4, hy - 3]], { noLine: true });
  g.blob(B, [[cx + 7, hy + 1], [cx + 10 + s, hy - eh - 2], [cx + 2, hy - 3]]); g.blob(In, [[cx + 6.4, hy - 0.4], [cx + 9 + s, hy - eh + 1], [cx + 3.4, hy - 3]], { noLine: true });
  if (night) { g.poly(P2.stone, [[cx - 3, hy - 5], [cx - 5, hy - 12], [cx - 1, hy - 6]]); g.poly(P2.stone, [[cx + 3, hy - 5], [cx + 5, hy - 12], [cx + 1, hy - 6]]); }
  g.e(B, cx, hy, 7.6, 6.6);
  if (!back) {
    if (night) { for (const ex of [cx - 3.6, cx + 3.2]) { g.poly(["#ffffff", "#ff80d8", "#ff80d8", "#a02880"], [[ex - 2.4, hy - 1.4], [ex + 2.4, hy - 0.6], [ex + 1.6, hy + 1.4], [ex - 2, hy + 0.8]], { flat: true }); } }
    else { eye2(g, cx - 3.4, hy - 0.6, 2.2, 2.8, IRIS.rose); eye2(g, cx + 3.4, hy - 0.6, 2.2, 2.8, IRIS.rose); }
    if (s >= 2) { g.e(["#6a2458", "#4a1840", "#4a1840", "#2a0c24"], cx, hy + 4, 2.6, 1.8, { flat: true }); g.dot(cx - 1.6, hy + 3, "#ffffff"); g.dot(cx + 1.6, hy + 3, "#ffffff"); }
    else { g.line([[cx - 2, hy + 3.4], [cx, hy + 4.2], [cx + 2, hy + 3.4]], "#6a2458"); g.dot(cx - 1, hy + 4.6, "#ffffff"); g.dot(cx + 1, hy + 4.6, "#ffffff"); }
    for (let i = 0; i < s; i++) {                                                                                // sound rings
      const r = 5 + i * 3.4; for (let a = -0.7; a <= 0.7; a += 0.12) g.dot(cx - 9 - r * Math.cos(a) + 6, hy + 5 + r * Math.sin(a), i % 2 ? "#ffc0e4" : "#ffffff");
    }
  }
}
Object.assign(MON_DRAW2, { mossfawn: [deer2, 0], stillhorn: [deer2, 1], cairnhart: [deer2, 2], monastag: [deer2, 3], echit: [bat2, 0], sonarix: [bat2, 1], howlwing: [bat2, 2], resonyx: [bat2, 3] });

// ---------------------------------------------------------------- registry
const MON_DRAW = {
  lumkit: [drawLion, 0], solmane: [drawLion, 1], haloclaw: [drawLion, 2], solarchon: [drawLion, 3],
  mossfawn: [drawDeer, 0], stillhorn: [drawDeer, 1], cairnhart: [drawDeer, 2], monastag: [drawDeer, 3],
  echit: [drawBat, 0], sonarix: [drawBat, 1], howlwing: [drawBat, 2], resonyx: [drawBat, 3],
  glimmote: [drawMoth, 0], wickwing: [drawMoth, 1], beaconmoth: [drawMoth, 2],
  shadeling: [drawFox, 0], umbrafox: [drawFox, 1], nyxvulpa: [drawFox, 2],
  gloamcrow: [drawCrow, 0], shroudcrow: [drawCrow, 1], ravengrave: [drawCrow, 2],
  lotadpole: [drawFrog, 0], lilyhop: [drawFrog, 1], nirvanoad: [drawFrog, 2],
  antennelle: [drawBug, 0], hummite: [drawBug, 1], thrumantis: [drawBug, 2],
  howlpup: [drawWolf, 0], snarlwolf: [drawWolf, 1], ragefang: [drawWolf, 2], fenrath: [drawWolf, 3],
  tuskit: [drawBoar, 0], gorehog: [drawBoar, 1], ruinboar: [drawBoar, 2],
  eclipsar: [drawEclipsar, 0],
  scrapling: [drawScrap, 0], ironclad: [drawScrap, 1], siegeclad: [drawScrap, 2], bulwarch: [drawScrap, 3],
  noxdrone: [drawNox, 0], noxmech: [drawNox, 1], nightreaver: [drawNox, 2], voidreaver: [drawNox, 3],
  westwarden: [drawWestwarden, 0], monolith: [drawMonolith, 0], dreadnought: [drawDreadnought, 0], sovereign: [drawSovereign, 0],
};
function renderMon(id, back) {
  let c;
  if (MON_DRAW2[id]) { const g = new MonRig(), [fn, st] = MON_DRAW2[id]; fn(g, st, back); c = g.render(); }
  else {                                     // older 32px designs, scaled up until they are redrawn
    const g = new Rig(MS, false), [fn, st] = MON_DRAW[id]; fn(g, st, back);
    const small = g.render(false); c = document.createElement("canvas"); c.width = c.height = MS2;
    const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(small, 0, 0, MS2, MS2);
  }
  if (!back) return c;
  const m = document.createElement("canvas"); m.width = m.height = MS2;
  const x = m.getContext("2d"); x.translate(MS2, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return m;
}
function buildMonSprites(target) {
  for (const id of Object.keys(MON_DRAW)) target[id] = { front: renderMon(id, false), back: renderMon(id, true) };
  return target;
}
