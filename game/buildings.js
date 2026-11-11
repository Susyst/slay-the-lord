// Detailed architecture, painted straight into a map's Paint buffer before it is snapped to the palette.
// Halls: stone footing, timber-framed plaster walls, lattice windows, arched doors, shingled hip roofs with
// gold-trimmed eaves, a gable, ridge horns, lanterns and clutter. Tents: patched canvas with ropes and stakes.

const HALL_STYLES = {
  hq:        { roof: S(["#1a3a6c", "#24508e", "#3068ac", "#4a88cc", "#70aae4"]), trim: hx("#f0c060"), plaster: S(["#b4a484", "#cabc98", "#ded2b2", "#f0e8d2"]),
               banner: [hx("#2462ae"), hx("#f0c060")], gable: "crest", chimney: true },
  barracks:  { roof: S(["#6a1c1c", "#8a2a24", "#aa3c2e", "#c8543c", "#e07454"]), trim: hx("#f0c060"), plaster: S(["#a89c86", "#c0b49c", "#d6ccb4", "#eae2d0"]),
               banner: null, gable: null, chimney: true },
  infirmary: { roof: S(["#3a2472", "#4e3492", "#6648b2", "#8264ce", "#a486e6"]), trim: hx("#f0c060"), plaster: S(["#bcb4a8", "#d2cabe", "#e4ded2", "#f6f2ea"]),
               banner: [hx("#c83a4a"), hx("#ffffff")], gable: "chalice", chimney: false },
};

function paintHall(P, b, s) {
  const st = HALL_STYLES[b.style], X0 = b.x * 16, Wd = b.w * 16, Yb = (b.y + b.h) * 16, X1 = X0 + Wd - 1;
  const put = (x, y, c) => P.set(x, y, c), ink = C.ink;
  const fT = Yb - 26;                         // top of the facade
  const yTop = b.y * 16 - 12;                 // roof ridge
  // ---- foundation: dressed stone, one course, with a step at the door
  for (let y = Yb - 5; y < Yb; y++) for (let x = X0 - 1; x <= X1 + 1; x++) {
    const row = y - (Yb - 5), off = row > 2 ? 3 : 0, bx = Math.floor((x - X0 + off) / 7);
    if (y === Yb - 5 || (x - X0 + off) % 7 === 0 || row === 3) { put(x, y, row === 3 ? C.mortar : C.stone[0]); continue; }
    put(x, y, grad(C.stone, 0.35 + h2(bx, row > 2 ? 1 : 0, s) * 0.3 + (row === 1 ? 0.15 : 0) - (row === 4 ? 0.15 : 0)));
  }
  // ---- plaster walls, grimy toward the ground
  for (let y = fT; y < Yb - 5; y++) for (let x = X0; x <= X1; x++) {
    let t = 0.7 - (y - fT) / 26 * 0.4 + (fbm(x / 5, y / 5, s + 1, 2) - 0.5) * 0.35 + (h2(x, y, s + 2) - 0.5) * 0.12;
    if (vn(x * 0.35, y * 0.9, s + 3) > 0.86) t -= 0.3;            // cracks and stains
    put(x, y, grad(st.plaster, t));
  }
  // ---- timber frame: posts, top plate, mid rail, braces
  const posts = [X0, X1 - 1]; for (let x = X0 + 18; x < X1 - 10; x += 18) posts.push(x);
  const wood = (x, y, k) => put(x, y, grad(C.wood, k + (vn(x * 0.3, y * 0.7, s + 4) - 0.5) * 0.25));
  for (const px of posts) for (let y = fT; y < Yb - 5; y++) { wood(px, y, 0.75); wood(px + 1, y, 0.35); }
  for (let x = X0; x <= X1; x++) { wood(x, fT, 0.85); wood(x, fT + 1, 0.4); put(x, fT + 2, ink); wood(x, fT + 13, 0.7); wood(x, fT + 14, 0.3); }
  for (let i = 0; i < posts.length - 1; i++) {                       // diagonal braces in plain bays
    const a = posts[i] + 2, bb = posts[i + 1] - 1;
    if ((b.windows || []).some(w => X0 + w >= a - 4 && X0 + w <= bb) || (b.doorX >= a - X0 - 8 && b.doorX <= bb - X0)) continue;
    for (let k = 0; k < 10; k++) { const x = a + Math.round(k * (bb - a) / 10), y = fT + 15 + k; if (y < Yb - 5) { wood(x, y, 0.6); wood(x + 1, y, 0.3); } }
  }
  // ---- windows: deep frame, cross lattice, warm glass, sill, shutters
  for (const wx of b.windows || []) {
    const x0 = X0 + wx, y0 = fT + 4;
    for (let y = y0 - 1; y <= y0 + 8; y++) for (let x = x0 - 3; x <= x0 + 11; x++) {
      const inFrame = x >= x0 - 1 && x <= x0 + 9 && y >= y0 - 1 && y <= y0 + 8;
      if (x < x0 - 1 || x > x0 + 9) { if (y <= y0 + 7) wood(x, y, x < x0 ? 0.5 - (x0 - 1 - x) * 0.1 : 0.25); continue; }   // shutters
      if (!inFrame) continue;
      if (x === x0 - 1 || x === x0 + 9 || y === y0 - 1 || y === y0 + 8) { put(x, y, ink); continue; }
      if (x === x0 + 4 || y === y0 + 3) { wood(x, y, 0.3); continue; }
      const gy = (y - y0) / 7;
      put(x, y, gy < 0.3 ? hx("#fff4c8") : gy < 0.7 ? hx("#fcd888") : hx("#e8903a"));
    }
    for (let x = x0 - 2; x <= x0 + 10; x++) { wood(x, y0 + 9, 0.8); put(x, y0 + 10, ink); }
    if (b.style === "infirmary") for (let x = x0; x <= x0 + 8; x += 2) { put(x, y0 + 8, C.flower[(x >> 1) % 3]); put(x + 1, y0 + 8, C.tall[3]); }   // herb box
  }
  // ---- door: arched, planked, iron-banded, lit from within
  const dx0 = X0 + b.doorX, dTop = Yb - 22;
  for (let y = dTop - 2; y < Yb - 4; y++) for (let x = dx0 - 2; x <= dx0 + 12; x++) {
    const ay = y - dTop, arch = ay < 3 ? Math.round(Math.sqrt(Math.max(0, 9 - (3 - ay) * (3 - ay))) * 2.4) : 99;
    const cxr = Math.abs(x - (dx0 + 5)) ;
    if (ay < 3 && cxr > arch / 1 + 1) continue;
    if (x === dx0 - 2 || x === dx0 + 12 || (ay < 3 && cxr >= arch)) { put(x, y, C.stone[3]); continue; }
    if (x === dx0 - 1 || x === dx0 + 11) { put(x, y, ink); continue; }
    if (b.open) { const gy = (y - dTop) / 18; put(x, y, gy < 0.4 ? hx("#fcd888") : gy < 0.8 ? hx("#e8903a") : hx("#a8441c")); continue; }
    const plank = (x - dx0) % 3 === 2;
    put(x, y, plank ? C.wood[0] : grad(C.wood, 0.55 + (vn(x, y * 0.3, s) - 0.5) * 0.3));
    if (y === dTop + 4 || y === Yb - 9) put(x, y, C.iron[2]);
  }
  if (b.open) for (let y = Yb - 18; y < Yb - 5; y++) { put(dx0 + 1, y, C.wood[2]); put(dx0 + 2, y, C.wood[1]); }   // the door swung inward
  for (let x = dx0 - 3; x <= dx0 + 13; x++) { put(x, Yb - 4, C.stone[3]); put(x, Yb - 3, C.stone[2]); }         // threshold step
  // lanterns either side of the door
  for (const lx of [dx0 - 6, dx0 + 15]) {
    put(lx, dTop + 1, ink); put(lx + 1, dTop + 1, ink); put(lx, dTop + 2, C.iron[1]);
    for (let y = dTop + 3; y <= dTop + 7; y++) for (let x = lx - 1; x <= lx + 2; x++)
      put(x, y, x === lx - 1 || x === lx + 2 || y === dTop + 3 || y === dTop + 7 ? ink : y < dTop + 5 ? hx("#fff4c8") : hx("#e8903a"));
  }
  // ---- roof: hipped, scalloped shingles, light from the left
  const yE = fT - 1;
  for (let y = yTop; y <= yE; y++) {
    const inset = Math.round((y - yTop < 6 ? (6 - (y - yTop)) * 1.6 : 0) + (yE - y) * 0.18), L = X0 - 4 + inset, Rr = X1 + 4 - inset;
    for (let x = L; x <= Rr; x++) {
      if (x === L || x === Rr || y === yTop) { put(x, y, ink); continue; }
      const row = Math.floor((yE - y) / 3), ly = (yE - y) % 3, off = (row % 2) * 3, col = Math.floor((x - X0 + off) / 6), lx = (x - X0 + off) % 6;
      let t = 0.5 + (h2(col, row, s + 7) - 0.5) * 0.35 - (x - L) / (Rr - L) * 0.3 + (y - yTop) / (yE - yTop) * 0.1;
      if (ly === 0) t -= 0.35; else if (ly === 2) t += 0.2;
      if (lx === 0 && ly !== 2) t -= 0.25;
      if (lx === 5 && ly === 1) t += 0.1;
      if (fbm(x / 7, y / 4, s + 8) > 0.82) { put(x, y, grad(C.moss, t * 0.9)); continue; }     // moss in the old tiles
      put(x, y, grad(st.roof, t));
    }
  }
  // ridge cap and horned ends
  for (let x = X0 + 6; x <= X1 - 6; x++) { put(x, yTop, ink); put(x, yTop + 1, st.roof[4]); put(x, yTop + 2, st.roof[2]); }
  for (const [ex, dir] of [[X0 + 5, -1], [X1 - 5, 1]]) { put(ex, yTop - 1, st.trim); put(ex + dir, yTop - 2, st.trim); put(ex + dir * 2, yTop - 3, st.trim); put(ex + dir * 2, yTop - 4, ink); put(ex, yTop, ink); }
  // eave beam with a gold trim line, and a fringe of hanging tassels
  for (let x = X0 - 4; x <= X1 + 4; x++) { put(x, yE + 1, ink); put(x, yE + 2, st.trim); put(x, yE + 3, C.wood[1]); put(x, yE + 4, ink); }
  for (let x = X0 - 2; x <= X1 + 2; x += 5) { put(x, yE + 5, st.trim); put(x, yE + 6, C.wood[2]); }
  // gable over the door
  if (st.gable) {
    const gx = dx0 + 5, gw = 13, gTop = yE - 15;
    for (let y = gTop; y <= yE; y++) {
      const half = Math.round((y - gTop) / (yE - gTop) * gw);
      for (let x = gx - half - 2; x <= gx + half + 2; x++) {
        const edge = Math.abs(x - gx) >= half - 0;
        if (Math.abs(x - gx) > half + 2) continue;
        if (Math.abs(x - gx) > half) { put(x, y, Math.abs(x - gx) === half + 1 ? st.trim : ink); continue; }
        put(x, y, edge ? ink : grad(st.plaster, 0.6 - (y - gTop) / 20 * 0.3 + (h2(x, y, s) - 0.5) * 0.15));
      }
    }
    const ey = gTop + 9;
    if (st.gable === "chalice") {      // pale chalice on crimson roundel
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = Math.hypot(x, y); if (d <= 4.4) put(gx + x, ey + y, d > 3.6 ? ink : st.banner[0]); }
      for (const [x, y] of [[-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [-2, -1], [2, -1], [-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [0, 1], [0, 2], [-1, 2], [1, 2]]) put(gx + x, ey + y, st.banner[1]);
    } else {                           // round lit window with a star crest
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) { const d = Math.hypot(x, y); if (d <= 3.5) put(gx + x, ey + y, d > 2.6 ? ink : (x + y) & 1 ? hx("#fcd888") : hx("#e8903a")); }
      put(gx, ey, C.wood[1]); put(gx - 1, ey, C.wood[1]); put(gx + 1, ey, C.wood[1]); put(gx, ey - 1, C.wood[1]); put(gx, ey + 1, C.wood[1]);
    }
  }
  // chimney with a curl of smoke
  if (st.chimney) {
    const cx0 = X1 - 14, cTop = yTop - 6;
    for (let y = cTop; y < yTop + 8; y++) for (let x = cx0; x < cx0 + 7; x++) {
      if (x === cx0 || x === cx0 + 6 || y === cTop) { put(x, y, ink); continue; }
      put(x, y, (y - cTop) % 3 === 0 ? C.mortar : grad(C.stone, 0.45 + h2(x >> 1, y, s) * 0.3 - (x - cx0) * 0.06));
    }
    for (let i = 0; i < 10; i++) { const x = cx0 + 3 + Math.round(Math.sin(i * 0.8) * 2 + i * 0.4), y = cTop - 2 - i * 2; if ((i + x) & 1) put(x, y, hx("#5a5f8a")); put(x + 1, y, hx("#3c4066")); }
  }
  // hanging banner on the left post
  if (st.banner && b.style === "hq") {
    for (let y = fT + 3; y < fT + 20; y++) for (let x = X0 + 3; x <= X0 + 9; x++) {
      if (y > fT + 16 && (x - X0) % 2 === y % 2) continue;
      put(x, y, x === X0 + 3 || x === X0 + 9 ? ink : (y === fT + 6 || y === fT + 13) ? st.banner[1] : st.banner[0]);
    }
    put(X0 + 6, fT + 9, st.banner[1]); put(X0 + 5, fT + 10, st.banner[1]); put(X0 + 7, fT + 10, st.banner[1]); put(X0 + 6, fT + 11, st.banner[1]);
  }
  // clutter against the walls
  for (const [kind, cx] of b.clutter || []) paintClutter(P, kind, X0 + cx, Yb - 1, s + cx);
  return [...(b.windows || []).map(wx => ({ x: X0 + wx + 4, y: fT + 10, r: 22, a: 0.55 })), { x: dx0 + 5, y: Yb - 2, r: 24, a: b.open ? 0.9 : 0.5 },
          { x: dx0 - 5, y: dTop + 5, r: 14, a: 0.6 }, { x: dx0 + 16, y: dTop + 5, r: 14, a: 0.6 }];
}

// small props stood on the ground line (x = left edge, yb = ground)
function paintClutter(P, kind, x0, yb, s) {
  const put = (x, y, c) => P.set(x, y, c), ink = C.ink;
  if (kind === "barrel") {
    for (let y = yb - 11; y <= yb; y++) for (let x = x0; x < x0 + 9; x++) {
      const rel = (x - x0) / 8, bulge = Math.abs(y - (yb - 5.5)) < 4 ? 0 : 1;
      if ((x === x0 || x === x0 + 8) && bulge) { continue; }
      if (x === x0 || x === x0 + 8 || y === yb - 11 || y === yb) { put(x, y, ink); continue; }
      if (y === yb - 9 || y === yb - 2) { put(x, y, C.iron[2 - (rel > 0.6 ? 1 : 0)]); continue; }
      put(x, y, y === yb - 10 ? C.wood[1] : grad(C.wood, 0.75 - rel * 0.6 + ((x - x0) % 3 === 0 ? -0.15 : 0)));
    }
  } else if (kind === "crate") {
    for (let y = yb - 9; y <= yb; y++) for (let x = x0; x < x0 + 11; x++) {
      if (x === x0 || x === x0 + 10 || y === yb - 9 || y === yb) { put(x, y, ink); continue; }
      const diag = Math.abs((x - x0) - (y - (yb - 9))) < 1;
      put(x, y, diag ? C.wood[1] : grad(C.wood, (y < yb - 6 ? 0.8 : 0.5) - (x - x0) * 0.03));
    }
  } else if (kind === "herbs") {      // drying rack hung with bundles
    for (let y = yb - 16; y <= yb; y++) { put(x0, y, C.wood[3]); put(x0 + 14, y, C.wood[1]); }
    for (let x = x0; x <= x0 + 14; x++) { put(x, yb - 16, C.wood[3]); put(x, yb - 15, ink); }
    for (let i = 0; i < 5; i++) { const bx = x0 + 2 + i * 3, col = i % 2 ? C.tall[3] : C.bloom[2];
      for (let y = yb - 14; y < yb - 8 + (i % 2); y++) { put(bx, y, col); put(bx + 1, y, y % 2 ? C.tall[2] : col); } put(bx, yb - 7, ink); }
  } else if (kind === "stretcher") {
    for (let x = x0; x < x0 + 18; x++) { put(x, yb - 4, C.wood[3]); put(x, yb, C.wood[1]); }
    for (let y = yb - 3; y < yb; y++) for (let x = x0 + 2; x < x0 + 16; x++) put(x, y, grad(C.burlap, 0.7 - (y - yb + 3) * 0.2));
    put(x0 + 1, yb + 1, ink); put(x0 + 16, yb + 1, ink);
  } else if (kind === "bucket") {
    for (let y = yb - 5; y <= yb; y++) for (let x = x0; x < x0 + 6; x++) put(x, y, x === x0 || x === x0 + 5 || y === yb ? ink : y === yb - 5 ? C.water[3] : grad(C.wood, 0.6 - (x - x0) * 0.08));
  }
}

function polyFill(pts, cb) {
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const cx = x + 0.5, cy = y + 0.5; let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > cy) !== (yj > cy) && cx < (xj - xi) * (cy - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) cb(x, y);
    }
}
// Ridge tent seen from the front and above: two roof planes running back from the gable, the gable face,
// an open lit doorway, seams, patches, guy ropes, stakes and a flag.
function paintTent(P, b, s) {
  const X0 = b.x * 16, Yb = (b.y + b.h) * 16, Wd = b.w * 16, cx = X0 + Wd / 2, put = (x, y, c) => P.set(x, y, c), ink = C.ink;
  const dom = b.side === "dominion";
  const pal = dom ? S(["#5a0e1a", "#7a1a26", "#9a2a32", "#ba3c3c", "#d85c50"]) : S(["#3a5a2a", "#4e7436", "#668e44", "#82aa56", "#a2c672"]);
  const baseY = Yb - 3, apexY = baseY - 27, depth = 15, L = X0 + 3, Rr = X0 + Wd - 4;
  const mask = new Set(), mark = (x, y) => mask.add(x + "," + y);
  // roof planes
  polyFill([[cx, apexY - depth], [cx, apexY], [L, baseY], [L, baseY - depth]], (x, y) => {
    mark(x, y); const u = (cx - x) / (cx - L);
    let t = 0.72 - u * 0.25 + (fbm(x / 4, y / 7, s, 2) - 0.5) * 0.3 + (h2(x, y, s) - 0.5) * 0.1;
    if (Math.round(y - (apexY - depth) - (cx - x) * (depth + 27) / (cx - L) * 0) % 6 === 0) t -= 0.12;
    if ((cx - x) % 7 === 0) t -= 0.2;
    put(x, y, grad(pal, t));
  });
  polyFill([[cx, apexY - depth], [cx, apexY], [Rr, baseY], [Rr, baseY - depth]], (x, y) => {
    mark(x, y); const u = (x - cx) / (Rr - cx);
    let t = 0.32 - u * 0.15 + (fbm(x / 4, y / 7, s + 1, 2) - 0.5) * 0.3;
    if ((x - cx) % 7 === 0) t -= 0.15;
    put(x, y, grad(pal, t));
  });
  for (let y = apexY - depth; y <= apexY; y++) { put(cx, y, pal[4]); put(cx - 1, y, pal[3]); }        // ridge
  // gable face
  polyFill([[cx, apexY], [L, baseY], [Rr, baseY]], (x, y) => {
    mark(x, y);
    let t = 0.5 + (fbm(x / 5, y / 5, s + 2, 2) - 0.5) * 0.35 - (y - apexY) / 27 * 0.15;
    if ((x - L) % 8 === 0) t -= 0.2;
    put(x, y, grad(pal, t));
  });
  // outline everything the tent covers
  for (const k of mask) { const [x, y] = k.split(",").map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!mask.has((x + dx) + "," + (y + dy))) put(x + dx, y + dy, ink); }
  for (let k = 0; k <= 27; k++) { put(Math.round(cx - (cx - L) * k / 27), apexY + k, pal[1]); put(Math.round(cx + (Rr - cx) * k / 27), apexY + k, ink); }  // gable edges
  // patches and stitching
  for (const [px, py] of [[cx - 13, baseY - 21], [cx + 9, baseY - 9]]) for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++)
    put(px + x, py + y, x === 0 || y === 0 || x === 5 || y === 4 ? ((x + y) & 1 ? pal[0] : pal[4]) : grad(pal, dom ? 0.2 : 0.85));
  // doorway: lit interior with a cot and a lantern, flaps tied back
  polyFill([[cx, apexY + 7], [cx - 9, baseY], [cx + 9, baseY]], (x, y) => {
    const gy = (y - apexY - 7) / 20;
    put(x, y, gy < 0.3 ? hx("#fcd888") : gy < 0.65 ? hx("#e8903a") : hx("#7a2a14"));
  });
  for (let x = cx - 6; x <= cx + 2; x++) { put(x, baseY - 4, C.burlap[3]); put(x, baseY - 3, C.burlap[1]); put(x, baseY - 2, C.wood[1]); }
  put(cx + 4, baseY - 12, ink); put(cx + 4, baseY - 11, hx("#fff4c8")); put(cx + 4, baseY - 10, hx("#e8903a"));
  polyFill([[cx - 9, baseY], [cx - 4, apexY + 14], [cx - 13, baseY]], (x, y) => put(x, y, grad(pal, 0.95)));
  polyFill([[cx + 9, baseY], [cx + 4, apexY + 14], [cx + 13, baseY]], (x, y) => put(x, y, grad(pal, 0.22)));
  for (let y = apexY + 14; y < baseY; y += 5) { put(cx - 9, y, C.burlap[3]); put(cx + 9, y, C.burlap[2]); }   // ties
  for (let x = L; x <= Rr; x++) put(x, baseY + 1, ink);
  // guy ropes and stakes, front and back corners
  for (const [ax, ay, sx, sy] of [[L + 2, baseY - 8, X0 - 4, baseY + 2], [Rr - 2, baseY - 8, X0 + Wd + 3, baseY + 2],
                                  [L + 1, baseY - depth - 2, X0 - 5, baseY - depth - 6], [Rr - 1, baseY - depth - 2, X0 + Wd + 4, baseY - depth - 6]]) {
    const n = Math.max(Math.abs(sx - ax), Math.abs(sy - ay));
    for (let k = 0; k <= n; k++) put(Math.round(ax + (sx - ax) * k / n), Math.round(ay + (sy - ay) * k / n + Math.sin(k / n * Math.PI) * 1.2), C.burlap[3]);
    put(sx, sy, C.wood[4]); put(sx, sy + 1, C.wood[2]); put(sx, sy + 2, ink);
  }
  // pole and flag
  const flag = dom ? [hx("#7a1a22"), hx("#c8c0d8")] : [hx("#1c304e"), hx("#e0b078")], py0 = apexY - depth - 13;
  for (let y = py0; y < apexY - depth; y++) { put(cx, y, C.wood[3]); put(cx + 1, y, ink); }
  put(cx, py0 - 1, flag[1]);
  for (let y = 0; y < 7; y++) for (let x = 2; x <= 12 - (y > 4 ? (y - 4) * 2 : 0); x++) put(cx + x, py0 + y + Math.round(Math.sin(x * 0.6) * 0.6), x === 2 || y === 0 || y === 6 ? ink : (y === 3 && x > 3) || x === 6 ? flag[1] : flag[0]);
  if (dom) for (let a = 0; a < 18; a++) {            // the Dominion's sigil: a pale spiked ring on the gable
    const ang = a / 18 * Math.PI * 2, r = a % 2 ? 3.6 : 5.2; put(Math.round(cx + Math.cos(ang) * r), Math.round(apexY + 4 + Math.sin(ang) * r), hx("#c8c0d8"));
  }
  for (const [kind, ox] of b.clutter || []) paintClutter(P, kind, X0 + ox, Yb - 1, s + ox);
  return [{ x: cx, y: baseY + 6, r: 24, a: 0.55, col: dom ? [230, 70, 50] : null }];
}

// ---------------------------------------------------------------- infirmary interior (15 x 10 tiles, one screen)
function buildInfirmary() {
  const m = blankMap(15, 10, "o");
  rect(m, 0, 0, 14, 2, "X"); rect(m, 0, 0, 0, 9, "X"); rect(m, 14, 0, 14, 9, "X"); rect(m, 0, 9, 14, 9, "X");
  m[9][7] = "o";
  for (const y of [3, 5, 7]) { m[y][1] = "B"; m[y][2] = "B"; }
  rect(m, 10, 4, 13, 4, "D");                        // apothecary counter
  m[8][12] = "X"; m[8][13] = "X";                    // barrels
  m[3][13] = "X";                                    // cabinet corner
  return {
    id: "infirmary", name: "HOUSE OF MENDING", music: "camp", m, tents: [], props: [{ kind: "hearth", x: 7, y: 1 }], interior: true, bg: "field", mood: "inside", seed: 41,
    npcs: [{ id: "medic", x: 11, y: 3, dir: "down", look: "medic", talk: "heal" },
           { id: "orderly", x: 5, y: 7, dir: "left", look: "rookie", lines: ["ORDERLY: Three came back from the ridge last night. Only one of them has spoken since.",
                                                                              "ORDERLY: The healer says Warmon burns don't scar. They just never stop aching."] }],
    warps: [{ x: 7, y: 9, to: "camp", tx: 5, ty: 12, dir: "down" }],
    heal: { x: 11, y: 5 },
    lights: [],
  };
}
function buildHQ() {
  const m = blankMap(15, 10, "o");
  rect(m, 0, 0, 14, 2, "X"); rect(m, 0, 0, 0, 9, "X"); rect(m, 14, 0, 14, 9, "X"); rect(m, 0, 9, 14, 9, "X");
  m[9][7] = "o";
  rect(m, 5, 4, 9, 5, "D");                          // war table
  m[8][1] = "X"; m[8][2] = "X"; m[8][12] = "X"; m[8][13] = "X"; m[3][1] = "X"; m[3][13] = "X";
  return {
    id: "hq", name: "COMMAND HALL", music: "camp", m, tents: [], props: [], interior: true, room: "hq", bg: "field", mood: "inside", seed: 57,
    counterText: "Maps of all three Dominion fronts, weighted down with daggers. A red line runs from the camp to Hamon's citadel.",
    npcs: [{ id: "adjutant", x: 7, y: 3, dir: "down", look: "scout", lines: ["ADJUTANT: Three generals stand between us and the citadel. The Commander wants them gone, one front at a time.",
                                                                              "ADJUTANT: Every pin on that map is a squad that has not reported back."] },
           { id: "runner", x: 11, y: 6, dir: "left", look: "rookie", lines: ["RUNNER: I carry orders to the western trenches twice a day. The grass out there bites."] }],
    warps: [{ x: 7, y: 9, to: "camp", tx: 5, ty: 7, dir: "down" }],
    heal: { x: 7, y: 7 }, lights: [],
  };
}
function buildBarracks() {
  const m = blankMap(15, 10, "o");
  rect(m, 0, 0, 14, 2, "X"); rect(m, 0, 0, 0, 9, "X"); rect(m, 14, 0, 14, 9, "X"); rect(m, 0, 9, 14, 9, "X");
  m[9][7] = "o";
  for (const y of [3, 5, 7]) { m[y][1] = "B"; m[y][2] = "B"; m[y][12] = "B"; m[y][13] = "B"; }
  m[5][7] = "D";                                     // card table
  m[8][3] = "X"; m[8][10] = "X"; m[8][11] = "X";
  return {
    id: "barracks", name: "BARRACKS", music: "camp", m, tents: [], props: [], interior: true, room: "barracks", bg: "field", mood: "inside", seed: 73,
    counterText: "A card game abandoned mid-hand, a harmonica, and a tin of cold rations.",
    bedText: ["A neatly made bunk. A letter sits half-written on the pillow.", "Someone is snoring under a patched blanket.", "An empty bunk. Nobody has moved the boots at its foot."],
    npcs: [{ id: "vet", x: 9, y: 6, dir: "left", look: "quarter", lines: ["VETERAN: Forty bunks, thirty-one soldiers. We don't talk about the empty ones.",
                                                                           "VETERAN: Warmon don't tire and don't flinch. Hit them where the plating joins."] },
           { id: "recruit", x: 4, y: 4, dir: "left", look: "rookie", lines: ["RECRUIT: I only got here last week. Is the food always like this?"] }],
    warps: [{ x: 7, y: 9, to: "camp", tx: 19, ty: 7, dir: "down" }],
    heal: { x: 7, y: 7 }, lights: [],
  };
}
function paintInfirmary(map) {
  const room = map.room || "infirmary", INF = room === "infirmary", HQ = room === "hq", BAR = room === "barracks";
  const Wp = 240, Hp = 160, P = new Paint(Wp, Hp), s = map.seed, ink = C.ink, put = (x, y, c) => P.set(x, y, c);
  const lights = [];
  // floor: staggered planks, worn pale down the middle aisle
  for (let y = 32; y < Hp; y++) for (let x = 0; x < Wp; x++) {
    const row = Math.floor(y / 5), off = Math.floor(h2(row, 1, s) * 30), seam = (x + off) % 30 === 0, ly = y % 5;
    if (ly === 0 || seam) { put(x, y, C.wood[0]); continue; }
    let t = 0.4 + h2(Math.floor((x + off) / 30), row, s) * 0.25 + (vn(x * 0.25, y * 1.2, s + 1) - 0.5) * 0.3 - (ly === 4 ? 0.15 : 0);
    t += Math.max(0, 0.18 - Math.abs(x - 120) / 300);
    put(x, y, grad(C.wood, t));
    if (h2(x, y, s + 3) > 0.996) put(x, y, C.iron[2]);                    // nail heads
  }
  // rug in the middle
  for (let y = 70; y < 122; y++) for (let x = 66; x < 158; x++) {
    const ex = Math.min(x - 66, 157 - x), ey = Math.min(y - 70, 121 - y), e = Math.min(ex, ey);
    let col;
    const RUG = HQ ? ["#1c304e", "#e0b078", "#122036", "#2a4468", "#22385a"] : BAR ? ["#3a4a2a", "#c8b078", "#22301c", "#4a5c34", "#3e4e2c"] : ["#6a1a28", "#c8946a", "#2a1640", "#4a1622", "#3a1220"];
    if (e === 0) col = ink; else if (e < 3) col = hx(RUG[0]); else if (e === 3) col = hx(RUG[1]);
    else if (e < 6) col = hx(RUG[2]);
    else { const p = ((x >> 2) + (y >> 2)) & 1, d = (Math.abs(x - 112) + Math.abs(y - 96)) % 12; col = d < 2 ? hx(RUG[1]) : p ? hx(RUG[3]) : hx(RUG[4]); }
    if ((y < 70 + 1 || y > 120) && x % 3 === 0) col = hx("#c8c0d8");
    put(x, y, col);
  }
  // back wall: stone lower course, plaster, timber posts and beam, shelves, windows, hanging herbs
  for (let y = 0; y < 34; y++) for (let x = 0; x < Wp; x++) {
    let col;
    if (y < 3) col = C.wood[y === 2 ? 0 : 2];
    else if (y < 22) col = grad(S(["#b4a484", "#cabc98", "#ded2b2"]), 0.75 - y / 60 + (fbm(x / 6, y / 6, s + 5, 2) - 0.5) * 0.35);
    else if (y < 31) { const bx = Math.floor((x + (y > 26 ? 4 : 0)) / 9); col = (x + (y > 26 ? 4 : 0)) % 9 === 0 || y === 26 ? C.mortar : grad(C.stone, 0.2 + h2(bx, y > 26 ? 1 : 0, s) * 0.3); }
    else col = y === 31 ? C.wood[3] : ink;
    put(x, y, col);
  }
  for (const px of [0, 46, 94, 144, 192, 238]) for (let y = 0; y < 31; y++) { put(px, y, C.wood[3]); put(px + 1, y, C.wood[1]); }
  for (let x = 0; x < Wp; x++) { put(x, 3, C.wood[3]); put(x, 4, C.wood[1]); put(x, 5, ink); }
  // windows (night sky, moon glints)
  for (const wx of [16, 200]) for (let y = 7; y < 21; y++) for (let x = wx; x < wx + 16; x++) {
    if (x === wx || x === wx + 15 || y === 7 || y === 20) { put(x, y, ink); continue; }
    if (x === wx + 7 || x === wx + 8 || y === 13) { put(x, y, C.wood[2]); continue; }
    put(x, y, h2(x, y, s) > 0.95 ? hx("#ffffff") : grad(S(["#86c6f0", "#b4dcf6", "#e0f4ff"]), (y - 7) / 14));
  }
  // shelves of remedies
  const vial = HQ ? [hx("#7a2a22"), hx("#2a4468"), hx("#6a5a2a"), hx("#c8b078"), hx("#34503c")] : [hx("#33685e"), hx("#9460c4"), hx("#a8441c"), hx("#c8c0d8"), hx("#6878b0")];
  if (!BAR) for (const [sx, sw] of HQ ? [[70, 26], [144, 26]] : [[52, 36], [100, 40], [150, 38]]) for (const sy of [12, 20]) {
    for (let x = sx; x < sx + sw; x++) { put(x, sy, C.wood[3]); put(x, sy + 1, C.wood[1]); put(x, sy + 2, ink); }
    for (let x = sx + 2; x < sx + sw - 3; x += 4 + Math.floor(h2(x, sy, s) * 3)) {
      const c = vial[Math.floor(h2(x, sy, s + 1) * 5)], hgt = 3 + Math.floor(h2(sy, x, s) * 3);
      for (let y = sy - hgt; y < sy; y++) { put(x, y, y === sy - hgt ? ink : c); put(x + 1, y, y === sy - hgt ? C.wood[2] : y === sy - hgt + 1 ? C.flower[3] : c); }
      if (INF && h2(x, sy, s + 7) > 0.6) lights.push({ x: x, y: sy - 2, r: 8, a: 0.3, col: [c[0], c[1], c[2]] });
    }
  }
  // hanging herb bundles from the beam
  if (HQ) for (const bx of [52, 174]) for (let y = 6; y < 30; y++) for (let x = bx; x < bx + 14; x++) {     // allied banners
    const ex = x - bx, tail = y - 24; if (tail > 0 && Math.abs(ex - 6.5) > 7 - tail * 1.2) continue;
    put(x, y, ex === 0 || ex === 13 || y === 6 ? ink : ex === 1 || ex === 12 ? hx("#e0b078") : (y === 14 || y === 15 || ex === 6 || ex === 7) ? hx("#e0b078") : grad(S(["#122036", "#1c304e", "#2a4468"]), 0.7 - (y - 6) / 40));
  }
  if (BAR) {                                                                                                // spear racks
    for (const rx of [52, 146]) { for (let x = rx; x < rx + 44; x++) for (const ry of [14, 26]) { put(x, ry, C.wood[3]); put(x, ry + 1, ink); }
      for (let x = rx + 4; x < rx + 42; x += 6) { for (let y = 8; y < 31; y++) put(x, y, C.wood[2]); put(x, 7, C.iron[3]); put(x, 6, C.iron[3]); put(x, 5, C.iron[2]); put(x - 1, 7, C.iron[1]); put(x + 1, 7, C.iron[1]); } }
  }
  if (INF) for (let x = 8; x < Wp; x += 11) if (x < 104 || x > 136) { const col = (x >> 3) % 2 ? C.tall[3] : C.bloom[2];
    for (let y = 6; y < 11 + (x % 3); y++) { put(x, y, col); put(x + 1, y, y % 2 ? C.tall[2] : col); } put(x, 5, C.burlap[2]); }
  // hearth: stone arch, fire, soot
  for (let y = 4; y < 33; y++) for (let x = 104; x < 136; x++) {
    const ax = Math.abs(x - 119.5), inner = y > 14 && ax < 9 - Math.max(0, 18 - y) * 0.6;
    if (inner) { put(x, y, y > 28 ? C.ash[1] : C.floor); continue; }
    const bx = Math.floor((x + (y % 8 > 3 ? 3 : 0)) / 6);
    put(x, y, (y % 4 === 0 || (x + (y % 8 > 3 ? 3 : 0)) % 6 === 0) ? C.mortar : grad(C.stone, 0.3 + h2(bx, y >> 2, s) * 0.3 - (y < 10 ? 0.1 : 0)));
  }
  for (let x = 100; x < 140; x++) { put(x, 14, C.wood[3]); put(x, 15, C.wood[1]); put(x, 16, ink); }      // mantel
  for (const [x, c] of [[104, vial[1]], [110, C.flower[3]], [130, vial[0]], [135, C.flower[3]]]) { put(x, 12, c); put(x, 13, c); put(x + 1, 13, c); }
  lights.push({ x: 120, y: 30, r: 90, a: 0.85 });
  // cots with wounded soldiers (left): wooden frame, linen, pillow, a coloured blanket with bandage stripes
  const blankets = [S(["#3a1220", "#6a2230", "#8a3240", "#b04a58"]), S(["#1c304e", "#2a4468", "#3c5a84", "#5a78a8"]), S(["#22362a", "#34503c", "#486a50", "#62866a"])];
  const linen = S(["#5a5878", "#7a789a", "#9a98bc", "#c8c0d8"]);
  const COTS = HQ ? [] : BAR ? [[3, 17, 0, false], [5, 17, 1, true], [7, 17, 2, false], [3, 192, 2, true], [5, 192, 0, false], [7, 192, 1, false]] : [[3, 17, 0, true], [5, 17, 1, false], [7, 17, 2, true]];
  COTS.forEach(([ty, x0, i, occ]) => {
    const y0 = ty * 16 - 1, w = 31, hgt = 16;
    for (let y = y0; y < y0 + hgt; y++) for (let x = x0; x < x0 + w; x++) {
      const ex = x - x0, ey = y - y0;
      if (ex === 0 || ex === w - 1 || ey === 0 || ey === hgt - 1) { put(x, y, ink); continue; }
      if (ex === 1 || ex === w - 2 || ey === 1 || ey >= hgt - 3) { put(x, y, grad(C.wood, ey >= hgt - 3 ? 0.35 : 0.8 - ex / 60)); continue; }
      if (ex < 9) { put(x, y, grad(linen, 0.85 - ey / 20 - (ex === 8 ? 0.3 : 0))); continue; }                         // pillow
      if (ex < 12 && !occ) { put(x, y, grad(linen, 0.6)); continue; }
      let t = 0.55 - ey / 18 + ((ex + ey) % 6 === 0 ? -0.15 : 0) + (ex === 12 ? 0.3 : 0);
      if (INF && ex % 6 === 3 && ey > 3 && ey < 10) { put(x, y, grad(linen, 0.9)); continue; }                                 // bandage strips
      put(x, y, grad(blankets[i], t));
    }
    if (occ) {                                                                                                         // a sleeping head on the pillow
      const hx0 = x0 + 3, hy0 = y0 + 4, sk = CHAR_OPTS.skin[(i * 2 + 1) % 4], hr = CHAR_OPTS.hair[i === 0 ? 1 : 4];
      for (let y = 0; y < 7; y++) for (let x = 0; x < 6; x++) {
        const edge = x === 0 || x === 5 || y === 0 || y === 6;
        put(hx0 + x, hy0 + y, edge ? ink : x < 2 ? hr[1] : y === 3 && x === 3 ? ink : sk[y > 4 ? 2 : 1]);
      }
      if (INF) { put(hx0 + 4, hy0 + 2, linen[3]); put(hx0 + 3, hy0 + 2, linen[3]); }                                                    // head bandage
    }
  });
  if (INF) {
  // apothecary counter (right)
  for (let y = 60; y < 80; y++) for (let x = 160; x < 224; x++) {
    if (x === 160 || x === 223 || y === 79) { put(x, y, ink); continue; }
    if (y < 64) { put(x, y, y === 60 ? ink : grad(C.wood, 0.85 - (y - 60) * 0.1)); continue; }
    put(x, y, (x - 160) % 16 === 0 ? C.wood[0] : grad(C.wood, 0.4 + (vn(x * 0.3, y, s) - 0.5) * 0.3 - (y - 64) / 40));
  }
  // things on the counter: mortar, open book, vials, a candle
  for (let y = 55; y < 61; y++) for (let x = 166; x < 174; x++) put(x, y, y === 55 || x === 166 || x === 173 ? ink : grad(C.stone, 0.7 - (x - 166) * 0.07));
  put(172, 52, C.wood[3]); put(173, 53, C.wood[3]); put(171, 54, C.wood[2]);
  for (let y = 56; y < 61; y++) for (let x = 182; x < 198; x++) put(x, y, x === 190 ? C.wood[1] : y === 56 ? ink : hx("#c8c0d8"));
  for (let x = 184; x < 197; x += 2) if (x !== 190) put(x, 58, C.wood[2]);
  for (const [x, c] of [[204, vial[0]], [208, vial[1]], [212, vial[2]]]) for (let y = 54; y < 61; y++) { put(x, y, y === 54 ? ink : c); put(x + 1, y, y < 57 ? C.flower[3] : c); }
  for (let y = 52; y < 60; y++) put(218, y, C.flower[3]); put(218, 50, hx("#fff4c8")); put(218, 51, hx("#e8903a"));
  lights.push({ x: 218, y: 52, r: 40, a: 0.7 }, { x: 186, y: 58, r: 22, a: 0.3 }, { x: 34, y: 84, r: 60, a: 0.55 });
  // an oil lantern hung from the rafters over the cots
  for (let y = 34; y < 60; y++) put(52, y, C.iron[1]);
  for (let y = 60; y < 67; y++) for (let x = 49; x < 56; x++) put(x, y, x === 49 || x === 55 || y === 60 || y === 66 ? ink : y < 63 ? hx("#fff4c8") : hx("#e8903a"));
  // cabinet in the corner
  for (let y = 34; y < 62; y++) for (let x = 208; x < 224; x++) put(x, y, x === 208 || x === 223 || y === 34 || y === 61 ? ink : x === 216 ? C.wood[0] : grad(C.wood, 0.55 - (y - 34) / 80));
  put(214, 48, C.trim || hx("#e0b078")); put(218, 48, hx("#e0b078"));
  // barrels and a water bucket
  paintClutter(P, "barrel", 194, 142, s); paintClutter(P, "barrel", 206, 141, s + 1); paintClutter(P, "bucket", 182, 142, s);
  paintClutter(P, "crate", 30, 142, s);
  }
  if (HQ) {                                                                                               // war table with the campaign map
    for (let y = 58; y < 96; y++) for (let x = 80; x < 160; x++) {
      if (x === 80 || x === 159 || y === 58 || y === 95) { put(x, y, ink); continue; }
      if (y >= 88) { put(x, y, (x - 80) % 20 === 0 ? C.wood[0] : grad(C.wood, 0.35 - (y - 88) / 30)); continue; }
      put(x, y, grad(C.wood, 0.75 - (y - 58) / 90 + (vn(x * 0.2, y, s) - 0.5) * 0.15));
    }
    for (let y = 61; y < 86; y++) for (let x = 86; x < 154; x++) {                                           // parchment map
      const e = x === 86 || x === 153 || y === 61 || y === 85, land = fbm(x / 9, y / 7, s + 4, 3), road = Math.abs((y - 73) - Math.sin(x / 9) * 5) < 0.8;
      put(x, y, e ? hx("#8a6a3e") : road ? hx("#a83228") : land > 0.56 ? hx("#9ab070") : land > 0.5 ? hx("#c8b888") : land < 0.36 ? hx("#8ab0c8") : hx("#e4d4a8"));
    }
    for (const [x, y, c] of [[96, 70, "#1c304e"], [112, 76, "#1c304e"], [128, 68, "#7a1a22"], [140, 74, "#7a1a22"], [148, 66, "#7a1a22"]]) { put(x, y - 3, hx(c)); put(x + 1, y - 3, hx(c)); put(x, y - 2, hx(c)); put(x, y - 1, ink); put(x, y, ink); }
    for (const x of [88, 151]) { put(x, 63, C.iron[3]); put(x, 64, C.iron[2]); put(x, 65, C.wood[1]); }      // daggers pinning the corners
    for (let y = 54; y < 60; y++) put(83, y, C.flower[3]); put(83, 52, hx("#fff4c8")); put(83, 53, hx("#e8903a"));
    lights.push({ x: 83, y: 54, r: 44, a: 0.7 }, { x: 120, y: 74, r: 46, a: 0.3 });
    for (const cx of [16, 192]) { paintClutter(P, "crate", cx, 142, s); paintClutter(P, "barrel", cx + 14, 141, s + 1); }
    for (const cx of [16, 208]) for (let y = 40; y < 62; y++) for (let x = cx; x < cx + 16; x++) put(x, y, x === cx || x === cx + 15 || y === 40 || y === 61 ? ink : x === cx + 8 ? C.wood[0] : grad(C.wood, 0.55 - (y - 40) / 70));
  }
  if (BAR) {                                                                                              // card table, lantern, kit
    for (let y = 76; y < 96; y++) for (let x = 112; x < 128; x++) put(x, y, x === 112 || x === 127 || y === 76 || y === 95 ? ink : y >= 90 ? grad(C.wood, 0.3) : grad(C.wood, 0.75 - (y - 76) / 60));
    for (const [x, y] of [[115, 80], [118, 82], [121, 79], [123, 84]]) { put(x, y, hx("#e4d4a8")); put(x + 1, y, hx("#e4d4a8")); put(x, y + 1, hx("#c8b888")); put(x + 1, y + 1, hx("#a83228")); }
    for (let x = 116; x < 122; x++) put(x, 87, C.iron[3]);
    for (let y = 34; y < 54; y++) put(120, y, C.iron[1]);
    for (let y = 54; y < 61; y++) for (let x = 117; x < 124; x++) put(x, y, x === 117 || x === 123 || y === 54 || y === 60 ? ink : y < 57 ? hx("#fff4c8") : hx("#e8903a"));
    lights.push({ x: 120, y: 60, r: 60, a: 0.6 }, { x: 34, y: 84, r: 50, a: 0.35 }, { x: 206, y: 84, r: 50, a: 0.35 });
    paintClutter(P, "crate", 52, 142, s); paintClutter(P, "barrel", 176, 141, s + 1); paintClutter(P, "bucket", 164, 142, s);
  }
  // side and front walls: dark timber tops
  for (let y = 0; y < Hp; y++) for (let x = 0; x < 15; x++) put(x, y, x === 14 ? ink : grad(C.wood, 0.2 + (x % 5 === 0 ? -0.1 : 0.1)));
  for (let y = 0; y < Hp; y++) for (let x = 224; x < 240; x++) put(x, y, x === 224 ? ink : grad(C.wood, 0.2 + (x % 5 === 0 ? -0.1 : 0.1)));
  for (let y = 144; y < Hp; y++) for (let x = 0; x < Wp; x++) {
    if (x >= 112 && x < 128) { put(x, y, y === 144 ? C.wood[3] : grad(C.path, 0.3 - (y - 144) / 30)); continue; }   // doorway
    put(x, y, y === 144 ? ink : grad(C.wood, 0.25 + ((x + y) % 6 === 0 ? -0.1 : 0)));
  }
  for (let y = 144; y < Hp; y++) { put(111, y, C.wood[4]); put(128, y, C.wood[1]); }
  // warm candlelit air; light pools on the floor
  
  for (const L of lights) {
    const col = L.col || C.warm;
    for (let y = Math.floor(L.y - L.r); y <= L.y + L.r; y++) for (let x = Math.floor(L.x - L.r); x <= L.x + L.r; x++) {
      if (x < 0 || y < 0 || x >= Wp || y >= Hp) continue;
      const d = Math.hypot(x - L.x, (y - L.y) * 1.2) / L.r; if (d >= 1) continue;
      P.add(x, y, col, Math.pow(1 - d, 1.6) * L.a * 0.45);
    }
  }
  map.lights = [{ x: 120, y: 40, r: 120, a: 0.6 }, { x: 218, y: 52, r: 50, a: 0.6 }];
  const ground = P.toCanvas(26);
  return { ground, water: [ground, ground, ground] };
}
