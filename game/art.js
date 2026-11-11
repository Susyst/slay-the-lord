// All art is drawn in code at GBA resolution with hard pixel edges.
const W = 240, H = 160, TS = 16;
const mk = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); draw(x); return c; };
const R = (x, c, px, py, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(px, py, w, h); };

// ---------------------------------------------------------------- tiles
const G = { o: "#306830", d: "#50a048", m: "#78c860", l: "#a8e088" };
function grass(x, v) {
  R(x, G.m, 0, 0, 16, 16);
  const tufts = v ? [[2, 3], [10, 10]] : [[10, 2], [3, 11]];
  for (const [tx, ty] of tufts) { R(x, G.d, tx, ty + 1); R(x, G.d, tx + 1, ty); R(x, G.d, tx + 3, ty); R(x, G.d, tx + 4, ty + 1); R(x, G.l, tx + 1, ty - 1); R(x, G.l, tx + 3, ty - 1); }
}
function burnt(x, v) {
  R(x, "#9a9a58", 0, 0, 16, 16);
  for (const [px, py] of v ? [[3, 4], [11, 9], [6, 13]] : [[9, 3], [2, 10], [13, 13]]) { R(x, "#6a6a3a", px, py, 2, 1); R(x, "#b8b878", px, py - 1, 1, 1); }
  R(x, "#4a4a2a", v ? 12 : 4, v ? 2 : 6);
}
const TILE = {
  grass: [0, 1].map(v => mk(16, 16, x => grass(x, v))),
  burnt: [0, 1].map(v => mk(16, 16, x => burnt(x, v))),
  path: mk(16, 16, x => {
    R(x, "#e0c890", 0, 0, 16, 16);
    for (const [px, py] of [[3, 3], [11, 6], [6, 11], [13, 13]]) { R(x, "#c0a068", px, py, 2, 1); R(x, "#f0e0b0", px, py - 1, 2, 1); }
  }),
  plaza: mk(16, 16, x => {
    R(x, "#a0a0a8", 0, 0, 16, 16); R(x, "#78788a", 0, 7, 16, 1); R(x, "#78788a", 0, 15, 16, 1); R(x, "#78788a", 7, 0, 1, 7); R(x, "#78788a", 12, 8, 1, 7);
    R(x, "#c0c0c8", 0, 0, 7, 1); R(x, "#c0c0c8", 8, 8, 4, 1);
  }),
  tall: [0, 1].map(f => mk(16, 16, x => {
    R(x, G.d, 0, 0, 16, 16);
    for (const [bx, by] of [[0, 1], [8, 1], [4, 8], [12, 8]]) {
      R(x, G.o, bx, by + 7, 8, 1);
      for (let i = 0; i < 6; i++) { R(x, G.m, bx + 1 + f, by + i + 1, 2, 1); R(x, G.m, bx + 5 - f, by + i + 1, 2, 1); }
      R(x, G.l, bx + 1 + f, by + 1, 1, 2); R(x, G.l, bx + 5 - f, by + 1, 1, 2); R(x, G.o, bx + 3, by + 3, 2, 4);
    }
  })),
  flower: [0, 1].map(f => mk(16, 16, x => {
    grass(x, 0);
    for (const [fx, fy, col] of [[4, 5, "#f86868"], [11, 10, "#f8f8f8"], [12, 3, "#f8d048"]]) {
      const yy = fy - f; R(x, G.o, fx - 1, yy + 2, 3, 1);
      R(x, col, fx - 1, yy, 3, 1); R(x, col, fx, yy - 1, 1, 3); R(x, "#f8e080", fx, yy);
    }
  })),
  fence: mk(16, 16, x => {
    grass(x, 1);
    R(x, "#382418", 0, 5, 16, 4); R(x, "#c88848", 0, 6, 16, 2); R(x, "#e8b070", 0, 6, 16, 1);
    for (const px of [1, 9]) { R(x, "#382418", px, 1, 6, 14); R(x, "#b07038", px + 1, 2, 4, 12); R(x, "#e0a868", px + 1, 2, 1, 12); R(x, "#8a5228", px + 4, 3, 1, 11); }
  }),
  wire: mk(16, 16, x => {
    burnt(x, 0);
    for (const px of [2, 12]) { R(x, "#282030", px, 3, 3, 12); R(x, "#6a5040", px + 1, 4, 1, 10); }
    R(x, "#a0a0b0", 0, 6, 16, 1); R(x, "#a0a0b0", 0, 10, 16, 1);
    for (const px of [1, 6, 9, 14]) { R(x, "#e0e0e8", px, 5, 1, 3); R(x, "#e0e0e8", px - 1, 9, 3, 1); }
  }),
  sand: mk(16, 16, x => {
    grass(x, 0);
    for (const [bx, by] of [[0, 9], [8, 9], [4, 3]]) { R(x, "#4a3820", bx, by, 8, 6); R(x, "#c8b078", bx + 1, by + 1, 6, 4); R(x, "#e8d8a0", bx + 1, by + 1, 5, 1); R(x, "#a08858", bx + 1, by + 4, 6, 1); }
  }),
  crate: mk(16, 16, x => {
    grass(x, 1); R(x, G.o, 2, 14, 13, 2);
    R(x, "#3a2414", 1, 1, 14, 14); R(x, "#d89850", 2, 2, 12, 12); R(x, "#f0c078", 2, 2, 12, 1); R(x, "#f0c078", 2, 2, 1, 12);
    R(x, "#a86830", 13, 3, 1, 11); R(x, "#a86830", 3, 13, 11, 1); R(x, "#a86830", 2, 7, 12, 2); R(x, "#f0c078", 2, 7, 12, 1);
  }),
  water: [0, 1].map(f => mk(16, 16, x => {
    R(x, "#4880d0", 0, 0, 16, 16);
    for (const [wx, wy] of [[2, 4], [9, 9], [4, 13]]) { const xx = (wx + f * 2) % 12; R(x, "#88b8f0", xx, wy, 4, 1); R(x, "#d0e8ff", xx + 1, wy - 1, 2, 1); }
  })),
  bridge: mk(16, 16, x => {
    R(x, "#4880d0", 0, 0, 16, 16);
    R(x, "#3a2414", 0, 0, 16, 16); for (let px = 0; px < 16; px += 4) { R(x, "#c88848", px, 1, 3, 14); R(x, "#e8b070", px, 1, 1, 14); }
    R(x, "#5a3a20", 0, 0, 16, 1); R(x, "#5a3a20", 0, 15, 16, 1);
  }),
  stone: mk(16, 16, x => {
    R(x, "#383848", 0, 0, 16, 16);
    for (const [bx, by, bw] of [[1, 1, 6], [8, 1, 7], [1, 6, 3], [5, 6, 7], [13, 6, 2], [1, 11, 7], [9, 11, 6]]) {
      R(x, "#8088a0", bx, by, bw, 4); R(x, "#a8b0c8", bx, by, bw, 1); R(x, "#60687e", bx, by + 3, bw, 1);
    }
  }),
  fort: mk(16, 16, x => {
    R(x, "#281818", 0, 0, 16, 16);
    for (const [bx, by, bw] of [[1, 1, 6], [8, 1, 7], [1, 6, 3], [5, 6, 7], [13, 6, 2], [1, 11, 7], [9, 11, 6]]) {
      R(x, "#7a4a48", bx, by, bw, 4); R(x, "#9a6a60", bx, by, bw, 1); R(x, "#5a3434", bx, by + 3, bw, 1);
    }
  }),
  rubble: mk(16, 16, x => {
    burnt(x, 1);
    for (const [bx, by, s] of [[2, 8, 5], [7, 5, 6], [9, 10, 5], [4, 3, 3]]) { R(x, "#383848", bx, by, s, s - 1); R(x, "#8088a0", bx + 1, by + 1, s - 2, s - 3); R(x, "#b0b8d0", bx + 1, by + 1, s - 3, 1); }
  }),
  crater: mk(16, 16, x => {
    burnt(x, 0);
    R(x, "#5a4a30", 2, 4, 12, 9); R(x, "#5a4a30", 4, 3, 8, 11); R(x, "#3a2e1e", 4, 6, 8, 5); R(x, "#3a2e1e", 6, 5, 4, 7); R(x, "#b0a070", 4, 3, 6, 1);
  }),
  deadtree: mk(16, 16, x => {
    burnt(x, 1);
    R(x, "#282030", 6, 2, 4, 14); R(x, "#6a5a50", 7, 3, 2, 12);
    R(x, "#282030", 2, 4, 5, 2); R(x, "#6a5a50", 3, 4, 4, 1); R(x, "#282030", 9, 6, 5, 2); R(x, "#6a5a50", 9, 6, 4, 1);
    R(x, "#282030", 3, 1, 2, 4); R(x, "#282030", 12, 3, 2, 4);
  }),
};
const TREE = mk(32, 32, x => {
  const blobs = [[16, 11, 10], [9, 15, 7], [23, 15, 7], [12, 20, 7], [20, 20, 7]];
  const inside = (px, py) => blobs.some(([cx, cy, r]) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r);
  for (let gy = 0; gy < 32; gy++) for (let gx = 0; gx < 32; gx++) {
    const xx = gx + 0.5, yy = gy + 0.5;
    if (!inside(xx, yy)) continue;
    const edge = !inside(xx + 1, yy) || !inside(xx - 1, yy) || !inside(xx, yy + 1) || !inside(xx, yy - 1);
    const lit = (gx - 16) * 0.5 + (gy - 13) * 0.6;
    R(x, edge ? "#204828" : lit < -6 ? "#a8e080" : lit < -1 ? "#68b850" : lit < 5 ? "#40903c" : "#2c6c30", gx, gy);
  }
  R(x, "#204828", 13, 26, 6, 6); R(x, "#8a5a30", 14, 26, 4, 6); R(x, "#b07840", 14, 26, 1, 6);
  for (const [lx, ly] of [[9, 9], [15, 5], [20, 9], [11, 14]]) { R(x, "#d0f0a0", lx, ly, 2, 1); R(x, "#d0f0a0", lx, ly + 1); }
});

// ---------------------------------------------------------------- tents and props
function drawTent(ctx, t, cx, cy) {
  const px = t.x * TS - cx, py = t.y * TS - cy, pw = t.w * TS, ph = t.h * TS;
  const pal = { medic: ["#f0f0f4", "#c0c0d0", "#ffffff", "#9898b0"], hq: ["#7c9a4a", "#58743a", "#a0c060", "#3e5428"],
                barracks: ["#b88c54", "#8c643a", "#d8ac70", "#604020"], dominion: ["#8a2a30", "#601a20", "#b04048", "#3a0c10"],
                outpost: ["#6a8a4a", "#4a6a34", "#8aaa60", "#304828"] }[t.kind];
  const roofH = 26, mid = px + pw / 2;
  ctx.fillStyle = "rgba(20,40,20,.35)"; ctx.fillRect(px + 2, py + ph - 2, pw, 3);
  ctx.fillStyle = "#282030";
  for (let y = 0; y <= roofH; y++) { const hw = Math.round(6 + (y / roofH) * (pw / 2 - 4)); ctx.fillRect(mid - hw - 1, py + y + 2, hw * 2 + 2, 1); }
  ctx.fillRect(px + 1, py + roofH + 2, pw - 2, ph - roofH - 2);
  for (let y = 1; y < roofH; y++) {
    const hw = Math.round(6 + (y / roofH) * (pw / 2 - 4)) - 1;
    ctx.fillStyle = pal[2]; ctx.fillRect(mid - hw, py + y + 2, hw, 1);
    ctx.fillStyle = pal[0]; ctx.fillRect(mid, py + y + 2, hw, 1);
    if (y % 6 === 0) { ctx.fillStyle = pal[1]; ctx.fillRect(mid - hw, py + y + 2, hw * 2, 1); }
  }
  ctx.fillStyle = pal[3]; ctx.fillRect(mid - 1, py + 3, 2, roofH - 1);
  ctx.fillStyle = pal[0]; ctx.fillRect(px + 2, py + roofH + 2, pw - 4, ph - roofH - 4);
  ctx.fillStyle = pal[1]; ctx.fillRect(px + 2, py + roofH + 2, pw - 4, 2); ctx.fillRect(mid + 6, py + roofH + 4, pw / 2 - 8, ph - roofH - 6);
  ctx.fillStyle = "#282030"; ctx.fillRect(mid - 7, py + ph - 17, 14, 15);
  ctx.fillStyle = "#3c3044"; ctx.fillRect(mid - 6, py + ph - 16, 12, 14);
  ctx.fillStyle = pal[2]; ctx.fillRect(mid - 6, py + ph - 16, 3, 14); ctx.fillStyle = pal[0]; ctx.fillRect(mid + 3, py + ph - 16, 3, 14);
  if (t.kind === "hq" || t.kind === "outpost") {
    ctx.fillStyle = "#282030"; ctx.fillRect(mid, py - 12, 2, 16); ctx.fillRect(mid + 2, py - 13, 13, 9);
    ctx.fillStyle = "#3a68c8"; ctx.fillRect(mid + 2, py - 12, 12, 7);
    ctx.fillStyle = "#f0c848"; ctx.fillRect(mid + 6, py - 12, 3, 7); ctx.fillRect(mid + 2, py - 10, 12, 3);
  }
  if (t.kind === "dominion") {
    ctx.fillStyle = "#282030"; ctx.fillRect(mid, py - 12, 2, 16); ctx.fillRect(mid + 2, py - 13, 13, 9);
    ctx.fillStyle = "#c02830"; ctx.fillRect(mid + 2, py - 12, 12, 7);
    ctx.fillStyle = "#181018"; ctx.fillRect(mid + 6, py - 11, 4, 5); ctx.fillStyle = "#f0c040"; ctx.fillRect(mid + 7, py - 10, 2, 3);
  }
  if (t.kind === "medic") {
    ctx.fillStyle = "#2c7848"; ctx.fillRect(mid - 3, py + 12, 6, 14); ctx.fillRect(mid - 7, py + 16, 14, 6);
    ctx.fillStyle = "#48b070"; ctx.fillRect(mid - 2, py + 13, 4, 12); ctx.fillRect(mid - 6, py + 17, 12, 4);
  }
}
function drawGate(ctx, g, cx, cy, open) {
  const px = g.x * TS - cx, py = g.y * TS - cy;
  ctx.fillStyle = "#281818"; ctx.fillRect(px, py - 8, 32, 40);
  ctx.fillStyle = "#5a3434"; ctx.fillRect(px + 2, py - 6, 28, 36);
  if (open) { ctx.fillStyle = "#100808"; ctx.fillRect(px + 5, py, 22, 30); return; }
  ctx.fillStyle = "#6a4020"; ctx.fillRect(px + 5, py, 22, 30);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = "#3a2010"; ctx.fillRect(px + 5 + i * 5, py, 1, 30); }
  ctx.fillStyle = "#909098"; ctx.fillRect(px + 5, py + 8, 22, 2); ctx.fillRect(px + 5, py + 20, 22, 2);
  ctx.fillStyle = "#c02830"; ctx.fillRect(px + 12, py - 4, 8, 10); ctx.fillStyle = "#f0c040"; ctx.fillRect(px + 15, py - 2, 2, 5);
}
function drawBanner(ctx, b, cx, cy, t) {
  const px = b.x * TS - cx + 4, py = b.y * TS - cy - 6, sway = Math.floor(t / 400) % 2;
  ctx.fillStyle = "#282030"; ctx.fillRect(px - 1, py - 1, 10, 22);
  ctx.fillStyle = "#c02830"; ctx.fillRect(px, py, 8, 20 - sway);
  ctx.fillStyle = "#181018"; ctx.fillRect(px + 2, py + 5, 4, 6); ctx.fillStyle = "#f0c040"; ctx.fillRect(px + 3, py + 6, 2, 4);
}
function drawCampfire(ctx, px, py, t) {
  for (const [sx, sy] of [[1, 11], [12, 11], [4, 13], [9, 13]]) { ctx.fillStyle = "#282030"; ctx.fillRect(px + sx, py + sy, 4, 3); ctx.fillStyle = "#a8a0b0"; ctx.fillRect(px + sx + 1, py + sy, 2, 2); }
  ctx.fillStyle = "#5a3a20"; ctx.fillRect(px + 3, py + 11, 10, 2);
  const f = Math.floor(t / 140) % 2;
  ctx.fillStyle = "#e84828"; ctx.fillRect(px + 4, py + 3 + f, 8, 9 - f);
  ctx.fillStyle = "#f89838"; ctx.fillRect(px + 5, py + 5 + f, 6, 6 - f);
  ctx.fillStyle = "#f8e080"; ctx.fillRect(px + 6, py + 7, 4, 4);
}
function drawSign(ctx, px, py) {
  ctx.fillStyle = "#282030"; ctx.fillRect(px + 6, py + 9, 4, 7); ctx.fillRect(px + 1, py + 1, 14, 10);
  ctx.fillStyle = "#8a5228"; ctx.fillRect(px + 7, py + 10, 2, 6);
  ctx.fillStyle = "#d89850"; ctx.fillRect(px + 2, py + 2, 12, 8); ctx.fillStyle = "#f0c078"; ctx.fillRect(px + 2, py + 2, 12, 1);
  ctx.fillStyle = "#8a5228"; ctx.fillRect(px + 4, py + 4, 8, 1); ctx.fillRect(px + 4, py + 6, 6, 1);
}

// ---------------------------------------------------------------- creatures: recolored model variants
const MON_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFMklEQVR4Xr1Xa2xURRQ+a3bbSmu44CNSoa/ttgWkECE2hUgNdVsf0NRQAwlVwXdqkB8aCWpiSDREfhqFxFertklJjVFSqO1aQzGW1NCGR8Buty3dioX4gBWhabebXPOd2bl37t3bXRKFL7npdnbunDPf+eY7s0QJ0PTEsZsGTY+d2K8TJ3FzEnE77S12Yg8Pu1fsirMRcd0oDhwW1vSm1o+pvuRPI6Z7xS6iG5iEA0Qp8rw1elNr2ywlSVai/6V8YKJNr6hax09meqGiC033L9s4i04029z/BI2DZ+fey49VnJrur35NGRPCBWumgFUxO7OSQlwohRDkIztHxFYmzlHgdHdcE0jiOSrwumn0xxBdik5Sf/CYseUX1m+lczNuCnR+wsJ20tIt10tQx3te2rKtjKevLC4n7DIz/Q7qPfINla9dycH/inn4uxcbXuLgEgheuLHDMVSKBCIuZN3wVpAONk7wAgUP+Gh+2hzyL6s0FsSJuTD1K/1x/iwn0dl5lva9U0yr69fwHATHd05IWQLsElhdtFy8n50vEvFaLWRw+GdKuzCPvztzJUgf1D5O3438Q12/jPIYErg2jaNt9ZTrMBhNB63YtUTv0En68PM9Fq+ARpAUdi93W5LnY2bS3AU0NnLU0UtSlEAot+9ADXV8+RBFF1zm4HcuXGIJLjE6EqNHM01mEHz825eVscST4GjFApquCglYelGjnukBKnHPUNmmgzxWln4rxXJyqPdIO//fS0Rz786gifB5eru0jsfe/8JPoSddFJqcARO6WoZZSiCCu3IyuLYSoeDvvHCedy1FY6K2f1+cYn2AGQmz1pq+d0MdHZoWc8MjWfxXLUfSEuB4lRTeT1fD6fwgOLLHAvjMwR+s5Z1h13jsQkNwvLtj8Rqqrl5iJCnhkABstpIe9t5Gx4728zzUEo8d8mT4Cov4qwUZi4zyybnYNY7mlfJSHvLN8TCD0i0dGcjPXcQv6ONTdLz7JO9U7h4vfr1jO2XnLuR5UH5oeIiVDmC8oXRdPIBgC3hj525mFLjdPZOMAYHe5p+oPxTkz2pN4Wo127JZ3QCSBAPQBFgCCxCdsHCoXiSB8ZZ3W2nLm5stRNoYEGdeBrZSb/YFiZZAu2E0AJgaHAsZ36tJoEfArhs/289zZBlsCUR44vy8pbz4hsfWK9Rb8cpTgTgzxP0AwcHU08Wi1hI4BbLeWbnTdLxnnOqfrTNOgqMG/GkRXsg8guKW1DwobBnBJWSNRZmsqHy9LWEM87CusHhNt/mAOP+Frqt0YOi3eGuFd2s6OhxsFrWunVtE+079oFirqLWIZp599AYIFSWVbbqi6j6e1dM1wO8nMADzwdkVL4jg6Pk4DdLjD1+L2XZmBsfcwNhlKk4r5ZqjGam6sEOxYkEzAE8nQoYCl8bOWN4DCzhuE2Gy2CqQ74lRf3SSKOzkHRFXT9eA5aZtYQDG09LYxzcYe9uEmQAQG2D6goqI66P2Jh6AO8IbpDjN9cCW2ZLjCYgaY+fy1qNiVeVyqlpcwF1w9uAmNhXdw2YD10NLVp3PDoMBBMe1a+vm5y3iglqbP/3KeA9JyCtZwmpxDOtZxv1h++5nWDtS9bMmgOBOl8ZVFTl8+Wg//T3vCvU3BeqMYPQU+Vw6+fPmsfEAWAcs23/yJemGpigBX/Fd7IxSA8mABhTSXRSIakI3fa9S994nqNrjIfQRNQnFB6xnGZQha7RjaUji7AKpfiuaNx+sgwQAMIz/1Zad5E7o9EMiVWAnqOsIX1E38C8wFrub7kCGEAAAAABJRU5ErkJggg==";
const MON_IMG = new Image();
const MON_ART = {};
function recolor(src, hue, sat, light) {
  return mk(src.width, src.height, x => {
    x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, src.width, src.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      let r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let l = (mx + mn) / 2, h = 0, s = 0;
      if (mx !== mn) { const dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
        h = (mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4) / 6; }
      if (h > 0.55 && h < 0.98) { h = hue; s = Math.min(1, Math.max(sat, s * 1.4)); l = Math.max(0, Math.min(0.85, l * light)); }
      else l = Math.max(0, Math.min(1, l * (0.6 + light * 0.4)));
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, pp = 2 * l - q;
      const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
      p[i] = f(h + 1 / 3) * 255; p[i + 1] = f(h) * 255; p[i + 2] = f(h - 1 / 3) * 255;
    }
    x.putImageData(d, 0, 0);
  });
}
const mirror = src => mk(src.width, src.height, x => { x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); });
function buildMonArt(species) {
  for (const [id, sp] of Object.entries(species)) {
    const [hue, sat, light] = sp.tint;
    const front = hue != null ? recolor(MON_IMG, hue, sat, light) : mk(32, 32, x => x.drawImage(MON_IMG, 0, 0));
    MON_ART[id] = { front, back: mirror(front) };
  }
}

// ---------------------------------------------------------------- GBA-style UI boxes
function frameBox(ctx, x, y, w, h, lit) {        // dark iron panel with a bronze rim and corner rivets
  R(ctx, "#0e0a1c", x, y, w, h);
  R(ctx, lit ? "#e0c894" : "#ac7644", x + 1, y + 1, w - 2, h - 2);
  R(ctx, "#4a2c1c", x + 2, y + 2, w - 4, h - 4);
  R(ctx, "#1a1430", x + 3, y + 3, w - 6, h - 6);
  for (let yy = y + 4; yy < y + h - 4; yy += 2) R(ctx, "#1f1838", x + 3, yy, w - 6, 1);
  R(ctx, "#2c2450", x + 3, y + 3, w - 6, 1);
  for (const [cx, cy] of [[x + 1, y + 1], [x + w - 3, y + 1], [x + 1, y + h - 3], [x + w - 3, y + h - 3]]) { R(ctx, "#fcd888", cx, cy, 2, 2); R(ctx, "#6a4026", cx + 1, cy + 1, 1, 1); }
}
function battleTextBox(ctx, x, y, w, h) {         // battle message box: same iron, crimson inner line
  R(ctx, "#0e0a1c", x, y, w, h); R(ctx, "#ac7644", x + 1, y + 1, w - 2, h - 2); R(ctx, "#4a2c1c", x + 2, y + 2, w - 4, h - 4);
  R(ctx, "#1a1430", x + 3, y + 3, w - 6, h - 6);
  for (let yy = y + 4; yy < y + h - 4; yy += 2) R(ctx, "#1f1838", x + 3, yy, w - 6, 1);
}
function hpBar(ctx, x, y, w, frac) {
  frac = Math.max(0, Math.min(1, frac));
  R(ctx, "#0e0a1c", x - 1, y - 1, w + 2, 5); R(ctx, "#3a3e5a", x, y, w, 3);
  const col = frac > 0.5 ? ["#94d66c", "#52a64c"] : frac > 0.2 ? ["#ffd84a", "#e8903a"] : ["#f05a7a", "#c8401c"];
  const fw = Math.max(0, Math.round(w * frac));
  R(ctx, col[1], x, y, fw, 3); R(ctx, col[0], x, y, fw, 1);
}
function statusPlate(ctx, x, y, w, h, tailLeft) {   // Gen 3-like HP plate with an angled tail
  R(ctx, "#0e0a1c", x - 1, y - 1, w + 2, h + 2); R(ctx, "#ac7644", x, y, w, h);
  R(ctx, "#1a1430", x + 1, y + 1, w - 2, h - 2); R(ctx, "#120e24", x + 1, y + h - 3, w - 2, 2); R(ctx, "#2c2450", x + 1, y + 1, w - 2, 1);
  if (tailLeft) { for (let i = 0; i < 6; i++) R(ctx, "#ac7644", x - 6 + i, y + h - 1 - i, 6 - i, 1); }
  else { for (let i = 0; i < 6; i++) R(ctx, "#ac7644", x + w, y + h - 1 - i, 6 - i, 1); }
}
function cursor(ctx, x, y, color = "#e8c870") { R(ctx, color, x, y, 1, 7); R(ctx, color, x + 1, y + 1, 1, 5); R(ctx, color, x + 2, y + 2, 1, 3); R(ctx, color, x + 3, y + 3, 1, 1); }

// ---------------------------------------------------------------- battle backgrounds
const BATTLE_BG = {}, BATTLE_PLAT = {};
// Battle scenes are painted with the overworld's painter and snapped to the overworld palette, so both halves of the game share one look.
function buildBattleBgs() {
  const Wp = W, Hp = 112, mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const glow = (P, cx, cy, r, col, a) => { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const d = Math.hypot(x - cx, y - cy) / r; if (d < 1) P.add(x, y, col, Math.pow(1 - d, 1.8) * a); } };
  const vignette = P => { for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) { const d = Math.hypot((x - 120) / 150, (y - 50) / 90); if (d > 0.62) P.mul(x, y, 1 - Math.min(0.3, (d - 0.62) * 0.55)); } };
  const tree = (P, cx, base, h, ramp, hi, s) => {
    for (let k = 0; k < h; k++) { const y = base - h + k, tier = k % 5, hw = Math.min(8, 0.6 + tier * 0.95 + k * 0.2);
      for (let dx = -Math.ceil(hw); dx <= Math.ceil(hw); dx++) { if (Math.abs(dx) > hw) continue;
        const t = 0.5 - dx / (hw + 1) * 0.42 - (tier === 4 ? 0.3 : 0) + (h2(cx + dx, y, s) - 0.5) * 0.22;
        P.set(cx + dx, y, k < 2 ? hi : grad(ramp, t)); } }
  };
  const persp = y => { const v = Math.max(0, (y - 56) / 56); return [v, 0.42 + v * 0.58, 56 + v * v * 150]; };
  const scene = (key, paint) => { const P = new Paint(Wp, Hp); paint(P); vignette(P); BATTLE_BG[key] = P.toCanvas(22); };
  const plats = (key, shade) => {
    BATTLE_PLAT[key] = [[46, 9], [56, 11]].map(([rx, ry], n) => {
      const w = rx * 2 + 4, h = ry * 2 + 7, P = new Paint(w, h), mask = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (x - w / 2 + 0.5) / rx, d = dx * dx + ((y - ry - 1) / ry) ** 2, d2 = dx * dx + ((y - ry - 5) / ry) ** 2;
        if (d <= 1) { P.set(x, y, shade(x + n * 97, y, d, false)); mask[y * w + x] = 1; }
        else if (d2 <= 1) { P.set(x, y, shade(x + n * 97, y, d2, true)); mask[y * w + x] = 1; }
      }
      const cv = P.toCanvas(20, mask); cv.rx = rx; cv.ry = ry; return cv;
    });
  };

  // ---- meadow at the forest's edge (camp, grassland)
  scene("field", P => {
    const s = 11, SKY = S(["#2462ae", "#327ec8", "#52a0de", "#86c6f0", "#e0f4ff"]);
    for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
      if (y < 58) {
        let col = grad(SKY, Math.min(0.98, y / 54));
        const c = fbm(x / 42 + 3, y / 10, s, 3) - 0.56 - y / 400;
        if (c > 0) col = mix(col, fbm(x / 42 + 3, (y + 4) / 10, s, 3) - 0.56 - y / 400 > 0.02 ? hx("#e8e4f4") : hx("#ffffff"), Math.min(1, c * 14));
        const ridge = 44 - fbm(x / 36, 2, s + 1, 3) * 16;
        if (y > ridge) col = mix(hx("#5a78a8"), hx("#86c6f0"), Math.min(1, (y - ridge) / 16) * 0.7 + (fbm(x / 9, y / 5, s + 2, 2) - 0.5) * 0.25);
        P.set(x, y, col);
      } else {
        const [v, sc, gy] = persp(y), gx = (x - 120) / sc + 120;
        let col = shGrass(gx, gy, s + 2);
        col = mix(col, C.pine[2], (1 - v) * 0.3);
        P.set(x, y, col);
      }
    }
    for (let x = -4, i = 0; x < Wp + 6; x += 6 + Math.floor(h2(i, 1, s) * 4), i++) tree(P, x, 57, 11 + Math.floor(h2(i, 2, s) * 8), mix3(C.pine, hx("#5a78a8"), 0.35), hx("#5a78a8"), s + i);
    for (let x = -2, i = 0; x < Wp + 8; x += 8 + Math.floor(h2(i, 3, s) * 6), i++) { const purple = h2(i, 9, s) > 0.82;
      tree(P, x, 61 + Math.floor(h2(i, 5, s) * 3), 16 + Math.floor(h2(i, 4, s) * 12), purple ? C.bloom : C.pine, purple ? C.bloom[4] : C.pineHi, s + 40 + i); }
    for (let y = 58; y < 66; y++) for (let x = 0; x < Wp; x++) if (h2(x, y, s + 6) > 0.72 - (66 - y) * 0.02) P.set(x, y, grad(C.tall, 0.15 + h2(y, x, s) * 0.3));       // undergrowth at the treeline
    for (let i = 0; i < 26; i++) { const x = Math.floor(h2(i, 7, s) * Wp), y = 70 + Math.floor(h2(i, 8, s) * 40), c = C.flower[i % 4]; P.set(x, y, c); if (y > 88) { P.set(x + 1, y, c); P.set(x, y - 1, C.flower[1]); } }
    for (const [tx, ty, v] of [[206, 96, 0], [222, 98, 1], [190, 99, 2], [-4, 70, 3], [8, 66, 1], [228, 84, 2]]) {      // foreground tufts
      const d = TALL_FG_DATA[v]; for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const k = (j * 16 + i) * 4; if (d[k + 3]) P.set(tx + i, ty + j, [d[k], d[k + 1], d[k + 2]]); } }
    for (let y = 0; y < 80; y++) for (let x = 0; x < Wp; x++) { const band = Math.max(0, Math.sin((x + y * 0.8) / 24 + 1)) ** 8; if (band > 0.02) P.add(x, y, C.warm, band * 0.1 * (1 - y / 90)); }   // light shafts
    for (let i = 0; i < 14; i++) glow(P, h2(i, 11, s) * Wp, 30 + h2(i, 12, s) * 50, 2.6, hx("#e0f4ff"), 0.55);                  // drifting motes
  });
  plats("field", (x, y, d, lip) => lip ? grad(C.tall, 0.08 + h2(x, y, 3) * 0.2 + (1 - d) * 0.1)
    : d > 0.78 && h2(x, y, 4) > 0.45 ? grad(C.tall, 0.5 + h2(y, x, 5) * 0.4) : mix(shGrass(x * 1.3, y * 2.6, 9), C.grass[4], 0.38));

  // ---- the western front: smoke-lit sky, broken walls, scorched earth
  scene("front", P => {
    const s = 23, SKY = S(["#5a6082", "#8088aa", "#c8c0d8", "#fcd888", "#fff4c8"]);
    for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
      if (y < 56) {
        let col = grad(SKY, Math.min(0.98, y / 56 + (fbm(x / 60, y / 30, s, 2) - 0.5) * 0.2));
        const sm = fbm(x / 26 + y / 40, y / 16, s + 1, 3) - 0.55;
        if (sm > 0) col = mix(col, y < 30 ? C.wall[1] : C.ash[3], Math.min(0.85, sm * 7));
        P.set(x, y, col);
      } else {
        const [v, sc, gy] = persp(y), gx = (x - 120) / sc + 120;
        const n = fbm(gx / 16, gy / 12, s + 2, 3), crack = Math.abs(fbm(gx / 7, gy / 5, s + 3, 2) - 0.5) < 0.018;
        let col = n > 0.56 ? grad(C.path, (n - 0.56) * 3.2 + h2(x, y, s) * 0.1) : grad(C.ash, 0.15 + n * 1.2 + (h2(x, y, s) - 0.5) * 0.12);
        if (crack) col = C.ash[0];
        if (Math.abs(gy - 96) < 2.2 + fbm(gx / 20, 1, s) * 3 || Math.abs(gy - 150) < 3 + fbm(gx / 20, 2, s) * 4) col = mix(C.ash[0], C.ink, 0.4);           // trench lines
        col = mix(col, C.ash[3], (1 - v) * 0.3);
        P.set(x, y, col);
      }
    }
    const wall = (x0, w, hgt, seed) => { for (let x = x0; x < x0 + w; x++) { const top = 57 - hgt + Math.floor(h2(x >> 2, seed, s) * 5) + (h2(x, seed, s + 1) > 0.8 ? 2 : 0);
      for (let y = top; y < 58; y++) { const row = (y >> 2), bx = (x + (row % 2) * 4) >> 3, mort = y % 4 === 0 || (x + (row % 2) * 4) % 8 === 0;
        P.set(x, y, y === top ? C.wallHi : mort ? C.mortar : grad(C.wall, 0.2 + h2(bx, row, s + seed) * 0.5 - (x - x0) / w * 0.2)); } } };
    wall(4, 26, 20, 1); wall(40, 14, 11, 2); wall(92, 22, 28, 3); wall(96, 8, 36, 4); wall(196, 34, 16, 5); wall(214, 10, 30, 6);
    for (const px of [62, 70, 78, 132, 141, 150, 176, 184]) { const hgt = 9 + Math.floor(h2(px, 3, s) * 6); for (let y = 58 - hgt; y < 59; y++) { P.set(px, y, C.bark[2]); P.set(px + 1, y, C.bark[0]); } P.set(px, 57 - hgt, C.bark[3]); }
    for (let y = 20; y < 30; y++) for (let x = 105; x < 116 - (y > 26 ? (y - 26) * 2 : 0); x++) P.set(x + Math.round(Math.sin(y * 0.8) * 0.7), y, x === 105 ? C.ink : y === 24 ? hx("#c8c0d8") : C.ember[0]);   // a Dominion banner
    for (let i = 0; i < 46; i++) { const x = h2(i, 5, s) * Wp, y = 58 + h2(i, 6, s) * 54; P.set(x, y, C.ember[1 + (i % 2)]); if (i % 3 === 0) glow(P, x, y, 3, C.ember[1], 0.35); }
    glow(P, 168, 50, 60, hx("#fcd888"), 0.34); glow(P, 60, 60, 26, C.ember[1], 0.3);
    for (const [bx, bh] of [[8, 16], [20, 11], [228, 15], [216, 9]]) for (let y = Hp - bh; y < Hp; y++) { P.set(bx, y, C.bark[1]); P.set(bx + 1, y, C.bark[2]); P.set(bx + 2, y, C.bark[0]); }       // foreground stakes
  });
  plats("front", (x, y, d, lip) => lip ? grad(C.ash, 0.05 + h2(x, y, 3) * 0.25) : d > 0.8 && h2(x >> 1, y, 4) > 0.55 ? grad(C.stone, 0.2 + h2(y, x, 5) * 0.4)
    : grad(C.path, 0.3 + fbm(x / 9, y / 4, 7, 2) * 0.5 + (h2(x, y, 8) - 0.5) * 0.12));

  // ---- the fortress courtyard: violet dusk, battlements, torchlight on flagstones
  scene("fortress", P => {
    const s = 37, SKY = S(["#1a1430", "#5a2a8c", "#7a3cb2", "#9a5ad2", "#f05a7a"]);
    for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
      if (y < 58) {
        const merlon = (x + 6) % 18 < 10 ? 12 : 17;
        if (y < merlon) { let col = grad(SKY, Math.min(0.98, y / 20 + (fbm(x / 40, y / 8, s, 2) - 0.5) * 0.35)); if (h2(x, y, s) > 0.992) col = hx("#fff4c8"); P.set(x, y, col); continue; }
        const row = y >> 2, bx = (x + (row % 2) * 5) / 10 | 0, mort = y % 4 === 0 || (x + (row % 2) * 5) % 10 === 0;
        P.set(x, y, y === merlon ? C.wallHi : mort ? C.mortar : grad(C.wall, 0.12 + h2(bx, row, s) * 0.45 + (y < 30 ? 0.12 : 0)));
      } else {
        const [v, sc, gy] = persp(y), gx = (x - 120) / sc + 120, tx = Math.floor(gx / 18 + (Math.floor(gy / 14) % 2) * 0.5), ty = Math.floor(gy / 14);
        const edge = (gx + (ty % 2) * 9 + 900) % 18 < 1 / sc || gy % 14 < 1.2;
        let col = edge ? C.mortar : grad(C.stone, 0.12 + h2(tx, ty, s) * 0.4 + v * 0.18 + (fbm(gx / 5, gy / 5, s, 2) - 0.5) * 0.15);
        P.set(x, y, mix(col, C.wall[0], (1 - v) * 0.35));
      }
    }
    for (const gx0 of [34, 120, 206]) {                                                                   // arrow slits, banners and torches
      for (let y = 24; y < 34; y++) { P.set(gx0 - 22, y, C.ink); P.set(gx0 - 21, y, y < 27 ? C.ember[2] : C.ember[1]); P.set(gx0 - 20, y, C.ink); }
      for (let y = 20; y < 46; y++) for (let x = gx0 - 6; x < gx0 + 6; x++) { if (y > 40 && Math.abs(x - gx0 + 0.5) > 46 - y) continue; P.set(x, y, x === gx0 - 6 || x === gx0 + 5 || y === 20 ? C.ink : (y === 28 || y === 29) ? hx("#c8c0d8") : grad(S(["#3a1220", "#c8401c"]), 0.75 - (y - 20) / 50)); }
      for (const tx of [gx0 - 14, gx0 + 13]) { for (let y = 40; y < 48; y++) P.set(tx, y, C.iron[1]); P.set(tx, 38, C.ember[2]); P.set(tx, 39, C.ember[1]); P.set(tx - 1, 39, C.ember[0]); P.set(tx + 1, 39, C.ember[0]); glow(P, tx, 40, 20, C.warm, 0.42); glow(P, tx, 66, 26, C.warm, 0.14); }
    }
    for (let y = 56; y < 60; y++) for (let x = 0; x < Wp; x++) P.mul(x, y, 0.62 + (y - 56) * 0.1);          // wall's foot in shadow
  });
  // ---- the Hollow Wood: violet dusk through a wall of dark pines, rune stones burning among the ruins
  withPal("hollow", () => {
    scene("hollow", P => {
      const s = 44, SKY = S(["#1a1434", "#3a2060", "#6a3a8c", "#a05aa0", "#e08aa0"]);
      for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
        if (y < 58) {
          let col = grad(SKY, Math.min(0.98, y / 52 + (fbm(x / 50, y / 20, s, 2) - 0.5) * 0.18));
          if (h2(x, y, s) > 0.994 && y < 30) col = hx("#fff4c8");
          const ridge = 40 - fbm(x / 30, 3, s + 1, 3) * 14;
          if (y > ridge) col = mix(hx("#2a1a4a"), hx("#6a3a8c"), Math.min(1, (y - ridge) / 18) * 0.5 + (fbm(x / 8, y / 5, s + 2, 2) - 0.5) * 0.2);
          P.set(x, y, col);
        } else {
          const [v, sc, gy] = persp(y), gx = (x - 120) / sc + 120;
          let col = shGrass(gx, gy, s + 2); col = mix(col, hx("#2a1a4a"), (1 - v) * 0.4);
          P.set(x, y, col);
        }
      }
      for (let x = -4, i = 0; x < Wp + 6; x += 5 + Math.floor(h2(i, 1, s) * 4), i++) tree(P, x, 57, 14 + Math.floor(h2(i, 2, s) * 10), mix3(C.pine, hx("#3a2060"), 0.4), hx("#4a3a7a"), s + i);
      for (let x = -2, i = 0; x < Wp + 8; x += 7 + Math.floor(h2(i, 3, s) * 6), i++) { const purple = h2(i, 9, s) > 0.7;
        tree(P, x, 60 + Math.floor(h2(i, 5, s) * 4), 18 + Math.floor(h2(i, 4, s) * 14), purple ? C.bloom : C.pine, purple ? C.bloom[4] : C.pineHi, s + 40 + i); }
      // broken walls and two rune stones
      for (const [x0, w, hgt] of [[20, 26, 12], [150, 22, 16], [200, 14, 9]]) for (let x = x0; x < x0 + w; x++) { const top = 58 - hgt + Math.floor(h2(x >> 2, 7, s) * 5);
        for (let y = top; y < 62; y++) P.set(x, y, y === top ? C.ruin[4] : (y % 5 === 0 || (x + (y >> 2) * 3) % 9 === 0) ? C.ink : fbm(x / 6, y / 6, s + 8) > 0.6 ? grad(C.tall, 0.3) : grad(C.ruin, 0.3 + h2(x >> 2, y >> 2, s) * 0.4)); }
      for (const [rx, ry, hgt] of [[64, 70, 22], [186, 66, 18]]) {
        for (let y = ry - hgt; y < ry; y++) for (let x = rx - 4; x <= rx + 4; x++) { const q = (ry - y) / hgt, hw = 4 - q * 1.5; if (Math.abs(x - rx) > hw + 1) continue;
          P.set(x, y, Math.abs(x - rx) > hw ? C.ink : x < rx - hw + 1.2 ? C.rockHi : grad(C.rock, 0.3 + (rx - x) * 0.07)); }
        for (let i = 0; i < 5; i++) { P.set(rx + (i % 2 ? 1 : -1), ry - hgt + 4 + i * 3, C.rune[1]); P.set(rx, ry - hgt + 5 + i * 3, C.rune[0]); }
        glow(P, rx, ry - hgt / 2, 26, C.rune[0], 0.5);
      }
      for (let i = 0; i < 40; i++) { const x = h2(i, 5, s) * Wp, y = 60 + h2(i, 6, s) * 50; P.set(x, y, i % 3 ? C.shroom[0] : C.shroom[2]); if (i % 4 === 0) glow(P, x, y, 5, C.shroom[1], 0.4); }
      for (let i = 0; i < 18; i++) glow(P, h2(i, 11, s) * Wp, 20 + h2(i, 12, s) * 70, 2.4, hx("#c8fff8"), 0.7);        // fireflies
      for (const [tx, ty, v] of [[204, 96, 0], [222, 98, 1], [-4, 72, 2], [10, 68, 3], [230, 86, 1]]) {
        const d = tallFor({ pal: "hollow" }).data[v]; for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const k = (j * 16 + i) * 4; if (d[k + 3]) P.set(tx + i, ty + j, [d[k], d[k + 1], d[k + 2]]); } }
    });
    plats("hollow", (x, y, d, lip) => lip ? grad(C.tall, 0.06 + h2(x, y, 3) * 0.2) : d > 0.8 && h2(x, y, 4) > 0.5 ? grad(C.tall, 0.45 + h2(y, x, 5) * 0.4) : mix(shGrass(x * 1.3, y * 2.6, 9), C.grass[4], 0.3));
  });

  // ---- the High Shrines: a moonlit stair among lanterns, cliffs falling away into cloud
  withPal("shrine", () => {
    scene("shrine", P => {
      const s = 66, SKY = S(["#060a1e", "#0e1a3c", "#1c2c5c", "#34487c", "#6a7aa8"]);
      for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
        if (y < 58) {
          let col = grad(SKY, Math.min(0.98, y / 56 + (fbm(x / 60, y / 20, s, 2) - 0.5) * 0.15));
          if (h2(x, y, s) > 0.992 && y < 44) col = h2(y, x, s) > 0.5 ? hx("#ffffff") : hx("#b4cef0");
          const dm = Math.hypot(x - 176, (y - 18) * 1.1); if (dm < 13) col = dm > 12 ? hx("#b4cef0") : fbm(x / 5, y / 5, s + 3, 2) > 0.58 ? hx("#c8c0d8") : hx("#fff4c8");
          const far = 46 - fbm(x / 26, 1, s + 1, 3) * 20, near = 54 - fbm(x / 14 + 9, 2, s + 2, 3) * 12;
          if (y > near) col = grad(C.rock, 0.12 + (fbm(x / 7, y / 4, s + 4, 2) - 0.5) * 0.3 + (y - near) * 0.01);
          else if (y > far) col = mix(hx("#1c2c5c"), hx("#34487c"), Math.min(1, (y - far) / 10) * 0.6);
          const mist = fbm(x / 22, y / 6 + 30, s + 5, 2) - 0.58; if (y > far - 4 && mist > 0) col = mix(col, hx("#c8c0d8"), Math.min(0.6, mist * 5));
          P.set(x, y, col);
        } else {
          const [v, sc, gy] = persp(y), gx = (x - 120) / sc + 120;
          let col = shCobble(gx * 0.9, gy * 0.9, s + 2); col = mix(col, hx("#0e1a3c"), (1 - v) * 0.45);
          P.set(x, y, col);
        }
      }
      for (let x = -6, i = 0; x < Wp + 8; x += 9 + Math.floor(h2(i, 3, s) * 7), i++) if (x < 60 || x > 180) tree(P, x, 60 + Math.floor(h2(i, 5, s) * 4), 16 + Math.floor(h2(i, 4, s) * 12), C.pine, C.pineHi, s + 40 + i);
      for (const [lx, ly, big] of [[48, 66, 1], [196, 64, 1], [92, 60, 0], [152, 60, 0]]) {        // stone lanterns, lit
        const w = big ? 8 : 6, hgt = big ? 22 : 15, base = ly;
        for (let y = base - 6; y < base; y++) for (let x = lx - 2; x <= lx + 2; x++) P.set(x, y, Math.abs(x - lx) === 2 ? C.ink : grad(C.stone, 0.3));
        for (let y = base - hgt; y < base - 7; y++) for (let x = lx - w / 2; x <= lx + w / 2; x++) { const win = Math.abs(x - lx) < w / 2 - 1 && y > base - hgt + 3 && y < base - 9;
          P.set(x, y, Math.abs(x - lx) >= w / 2 || y === base - hgt ? C.ink : win ? (y > base - 11 ? hx("#e8903a") : hx("#fff4c8")) : grad(C.stone, 0.45)); }
        for (let x = lx - w / 2 - 2; x <= lx + w / 2 + 2; x++) { P.set(x, base - hgt - 1, C.ink); P.set(x, base - hgt - 2, grad(C.stone, 0.7)); }
        glow(P, lx, base - hgt / 2, big ? 34 : 24, C.warm, 0.55); glow(P, lx, base + 10, 30, C.warm, 0.18);
      }
      for (const [rx, ry] of [[122, 60]]) { for (let y = ry - 14; y < ry; y++) for (let x = rx - 3; x <= rx + 3; x++) P.set(x, y, Math.abs(x - rx) === 3 ? C.ink : grad(C.rock, 0.3 + (rx - x) * 0.06));
        for (let i = 0; i < 4; i++) P.set(rx + (i % 2 ? 1 : -1), ry - 12 + i * 3, C.rune[1]); glow(P, rx, ry - 7, 20, C.rune[0], 0.4); }
      for (let i = 0; i < 12; i++) glow(P, h2(i, 11, s) * Wp, 64 + h2(i, 12, s) * 44, 2, hx("#b4cef0"), 0.5);                  // frost motes
      for (let y = 100; y < Hp; y++) for (let x = 0; x < Wp; x++) { const m = fbm(x / 20, y / 5, s + 9, 2) - 0.5; if (m > 0) P.add(x, y, hx("#c8c0d8"), m * 0.5 * ((y - 100) / 12)); }   // cloud lapping the stair
    });
    plats("shrine", (x, y, d, lip) => lip ? grad(C.rock, 0.05 + h2(x >> 1, y, 3) * 0.25) : (x % 11 === 0 || y % 5 === 0) ? C.mortar : grad(C.stone, 0.4 + h2((x / 11) | 0, (y / 5) | 0, 6) * 0.35 - d * 0.1));
  });

  // ---- the throne room: a black hall, gilt sunburst, Dominion red
  scene("throne", P => {
    const s = 88;
    for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) {
      if (y < 58) {
        const row = y >> 2, bx = (x + (row % 2) * 6) / 12 | 0, mort = y % 4 === 0 || (x + (row % 2) * 6) % 12 === 0;
        P.set(x, y, mort ? mix(C.mortar, C.ink, 0.5) : grad(C.wall, 0.02 + h2(bx, row, s) * 0.2 + y * 0.002));
      } else {
        const [v, sc, gy] = persp(y), gx = (x - 120) / sc + 120, tx = Math.floor(gx / 20 + (Math.floor(gy / 12) % 2) * 0.5), ty = Math.floor(gy / 12);
        const edge = (gx + (ty % 2) * 10 + 900) % 20 < 1 / sc || gy % 12 < 1.1, red = (tx + ty) % 2 === 0;
        let col = edge ? C.ink : red ? grad(C.velvet, 0.3 + h2(tx, ty, s) * 0.4) : grad(C.stone, 0.05 + h2(tx, ty, s) * 0.25 + v * 0.1);
        P.set(x, y, mix(col, C.ink, (1 - v) * 0.5));
      }
    }
    // the sunburst behind the dais
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, len = i % 2 ? 26 : 38; for (let k = 10; k < len; k++) { const x = 120 + Math.cos(a) * k, y = 30 + Math.sin(a) * k * 0.9; if (y < 56) P.set(x, y, k > len - 3 ? C.throne[4] : grad(C.throne, 0.45 + k * 0.012)); } }
    for (let y = 18; y < 44; y++) for (let x = 106; x < 135; x++) { const d = Math.hypot(x - 120, (y - 30) * 1.1); if (d < 12) P.set(x, y, d > 11 ? C.ink : d < 4 ? hx("#fff4c8") : grad(C.throne, 0.95 - d * 0.05)); }
    glow(P, 120, 30, 40, hx("#fcd888"), 0.35);
    // pillars with braziers, banners between them
    for (const px of [22, 78, 162, 218]) { for (let y = 0; y < 62; y++) for (let x = px - 6; x <= px + 6; x++) P.set(x, y, Math.abs(x - px) === 6 ? C.ink : grad(C.stone, 0.18 + (px - x) * 0.03 + (y > 56 ? 0.12 : 0)));
      for (let x = px - 8; x <= px + 8; x++) { P.set(x, 56, C.ink); P.set(x, 57, grad(C.stone, 0.45)); } }
    for (const bx of [50, 190]) { for (let y = 6; y < 50; y++) for (let x = bx - 8; x < bx + 8; x++) { const tail = y - 42; if (tail > 0 && Math.abs(x - bx + 0.5) > 8 - tail * 1.1) continue;
      P.set(x, y, x === bx - 8 || x === bx + 7 || y === 6 ? C.ink : (y === 16 || y === 17) ? C.throne[3] : grad(S(["#3a0a14", "#7a1a22", "#c8401c"]), 0.8 - (y - 6) / 60)); }
      for (let y = 20; y < 36; y++) for (let x = bx - 5; x < bx + 5; x++) { const d = Math.hypot(x - bx + 0.5, (y - 28) * 1.1); if (d < 5 && (d > 4 || d < 1.5 || Math.abs((x - bx + 0.5) * (y - 28)) < 1.5)) P.set(x, y, C.throne[4]); } }
    for (const tx of [40, 100, 140, 200]) { for (let y = 46; y < 58; y++) P.set(tx, y, C.iron[1]); for (let x = tx - 3; x <= tx + 3; x++) P.set(x, 46, C.iron[2]);
      P.set(tx, 43, C.ember[2]); P.set(tx, 44, C.ember[1]); P.set(tx - 1, 44, C.ember[0]); P.set(tx + 1, 44, C.ember[0]); P.set(tx, 45, C.ember[1]); glow(P, tx, 44, 26, C.warm, 0.6); glow(P, tx, 70, 30, C.warm, 0.14); }
    for (let i = 0; i < 20; i++) glow(P, h2(i, 11, s) * Wp, 50 + h2(i, 12, s) * 60, 1.6, C.ember[1], 0.5);          // drifting sparks
  });
  plats("throne", (x, y, d, lip) => lip ? grad(C.stone, 0.02 + h2(x >> 2, y >> 1, 3) * 0.15) : (x % 12 === 0 || y % 6 === 0) ? C.ink : ((x / 12 | 0) + (y / 6 | 0)) % 2 ? grad(C.velvet, 0.35 + h2(x / 12 | 0, y / 6 | 0, 6) * 0.4) : grad(C.stone, 0.2 + h2(x / 12 | 0, y / 6 | 0, 7) * 0.3 - d * 0.1));

  plats("fortress", (x, y, d, lip) => lip ? grad(C.wall, 0.05 + h2(x >> 2, y >> 1, 3) * 0.3) : (x % 12 === 0 || y % 6 === 0) ? C.mortar : grad(C.stone, 0.45 + h2((x / 12) | 0, (y / 6) | 0, 6) * 0.4 - d * 0.12));
}
function mix3(ramp, c, t) { return ramp.map(q => [q[0] + (c[0] - q[0]) * t, q[1] + (c[1] - q[1]) * t, q[2] + (c[2] - q[2]) * t]); }
function lerpCol(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
function platform(ctx, cx, cy, rx, ry, col, dark) {
  for (let y = -ry; y <= ry; y++) { const hw = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2)); R(ctx, y > ry * 0.3 ? dark : col, cx - hw, cy + y, hw * 2, 1); }
  for (let y = -ry; y <= ry; y++) { const hw = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2)); R(ctx, "#40483a", cx - hw - 1, cy + y, 1, 1); R(ctx, "#40483a", cx + hw, cy + y, 1, 1); }
}

// ---------------------------------------------------------------- intro cinematic scenes (dark, slow, pixel)
const INTRO_SCENES = [
  { line: "In the age before war, Ellyendor was a land of wild creatures, and of the people who lived beside them.", draw: (x, t) => {
      for (let y = 0; y < H; y++) R(x, lerpCol("#203858", "#e8a868", y / H), 0, y, W, 1);
      R(x, "#f8e8a0", 150, 70 - t * 4, 18, 18);
      hills(x, 96, "#2c4a3a", 0.02, t, 22); hills(x, 116, "#1c3428", 0.035, t, 18); hills(x, 136, "#10201a", 0.05, t, 14);
      for (let i = 0; i < 5; i++) { const bx = (30 + i * 47 + t * 6) % (W + 20) - 10; R(x, "#10201a", bx, 30 + (i % 3) * 9, 3, 1); R(x, "#10201a", bx + 1, 29 + (i % 3) * 9, 1, 1); }
    } },
  { line: "Then came the Dominion. An empire of iron and ambition, born in the high citadel of the east.", draw: (x, t) => {
      for (let y = 0; y < H; y++) R(x, lerpCol("#08060c", "#401820", y / H), 0, y, W, 1);
      const cx = 120 - t * 2;
      R(x, "#100a10", cx - 30, 40, 60, 120); R(x, "#100a10", cx - 8, 10, 16, 40); R(x, "#100a10", cx - 46, 70, 16, 90); R(x, "#100a10", cx + 30, 64, 18, 96);
      for (let i = 0; i < 14; i++) R(x, Math.sin(t * 3 + i) > 0 ? "#f0a040" : "#803020", cx - 24 + (i % 5) * 11, 50 + Math.floor(i / 5) * 22, 3, 4);
      R(x, "#c02830", cx - 4, 14, 8, 22); R(x, "#f0c040", cx - 1, 20, 2, 6);
      hills(x, 140, "#06040a", 0.03, t, 10);
    } },
  { line: "In their laboratories they forged the Warmons. Creatures not born, but built. Weapons that obey.", draw: (x, t) => {
      R(x, "#06080c", 0, 0, W, H);
      for (let i = 0; i < 6; i++) { const gx = 20 + i * 38; R(x, "#0c2030", gx, 30, 26, 90); R(x, "#103850", gx + 2, 32, 22, 86);
        R(x, `rgba(80,220,255,${0.25 + 0.2 * Math.sin(t * 2 + i)})`, gx + 2, 32, 22, 86);
        if (MON_ART.ironclad) x.drawImage(MON_ART.ironclad.front, gx - 3, 58); }
      for (let i = 0; i < 6; i++) R(x, "#e03030", 30 + i * 38, 128, 6, 2);
    } },
  { line: "City after city fell beneath their march. The free kingdoms burned, and the creatures of the wild were hunted, caged, and remade.", draw: (x, t) => {
      for (let y = 0; y < H; y++) R(x, lerpCol("#180608", "#c04020", y / H), 0, y, W, 1);
      const sx = -t * 5;
      for (let i = 0; i < 14; i++) { const bx = ((i * 23 + sx) % 280 + 280) % 280 - 20, bh = 30 + (i * 37) % 50;
        R(x, "#140608", bx, H - bh, 18, bh); for (let w2 = 0; w2 < 3; w2++) R(x, (i + w2) % 3 ? "#f08030" : "#300c08", bx + 4 + w2 * 4, H - bh + 8, 2, 3); }
      for (let i = 0; i < 40; i++) { const ex = (i * 53 + t * 9) % W, ey = (H - ((i * 31 + t * 30) % H)); R(x, i % 2 ? "#f8c060" : "#f86030", ex, ey, 1, 1); }
    } },
  { line: "At the heart of it all sits Great Lord Hamon, who has never lost a battle, and has never shown mercy.", draw: (x, t) => {
      R(x, "#0a0406", 0, 0, W, H);
      for (let i = 0; i < 2; i++) { R(x, "#701018", 40 + i * 140, 10, 20, 100); R(x, "#a01820", 42 + i * 140, 10, 16, 98); R(x, "#f0c040", 48 + i * 140, 30, 4, 12); }
      const glow = 0.5 + 0.5 * Math.sin(t * 1.5);
      R(x, "#1a0c10", 92, 40, 56, 120); R(x, "#1a0c10", 84, 70, 72, 90);
      R(x, "#08040a", 104, 34, 32, 40); R(x, "#08040a", 98, 26, 6, 14); R(x, "#08040a", 136, 26, 6, 14); R(x, "#08040a", 112, 24, 16, 12);
      R(x, "#08040a", 96, 72, 48, 70);
      R(x, `rgba(255,${40 + glow * 40},40,1)`, 110, 50, 6, 2); R(x, `rgba(255,${40 + glow * 40},40,1)`, 124, 50, 6, 2);
    } },
  { line: "Now only the Allied Front remains. Scattered. Outnumbered. Out of time.", draw: (x, t) => {
      for (let y = 0; y < H; y++) R(x, lerpCol("#04060c", "#182030", y / H), 0, y, W, 1);
      for (let i = 0; i < 30; i++) R(x, "#c0c8e0", (i * 67) % W, (i * 29) % 70, 1, 1);
      R(x, "#0a0c10", 0, 120, W, 40);
      const f = Math.floor(t * 6) % 2;
      R(x, "#f86030", 114, 116 + f, 12, 8 - f); R(x, "#f8c060", 117, 118 + f, 6, 5 - f);
      for (const [sx, dir] of [[90, 1], [140, -1], [70, 1], [160, -1]]) { R(x, "#06070a", sx, 98, 10, 22); R(x, "#06070a", sx - 1, 92, 12, 8); R(x, "#e08040", sx + (dir > 0 ? 9 : 0), 104, 1, 10); }
    } },
  { line: "One last order has been given. A small squad, sent behind enemy lines, with a single objective.", draw: (x, t) => {
      R(x, "#0c0a08", 0, 0, W, H);
      R(x, "#c8b088", 40, 24, 160, 112); R(x, "#a89068", 40, 130, 160, 6);
      R(x, "#584830", 60, 40, 60, 2); R(x, "#584830", 60, 50, 90, 2); R(x, "#584830", 60, 60, 74, 2);
      R(x, "#c02830", 150 + Math.sin(t) * 2, 82, 30, 30); R(x, "#c8b088", 154, 86, 22, 22);
      R(x, "#c02830", 163, 76, 4, 42); R(x, "#c02830", 144, 95, 42, 4);
      R(x, "#584830", 60, 90, 70, 2); R(x, "#584830", 60, 100, 50, 2);
    } },
  { line: "Kill the Lord.", draw: (x, t) => { R(x, "#000000", 0, 0, W, H); } },
];
function hills(x, base, col, freq, t, amp) {
  for (let px = 0; px < W; px++) { const h = Math.round(Math.sin((px + t * 8) * freq) * amp * 0.5 + Math.sin((px + t * 5) * freq * 2.3) * amp * 0.3); R(x, col, px, base - h, 1, H - base + h); }
}

// ---------------------------------------------------------------- houses, lamps, lighting
function drawHouse(ctx, h, cx, cy, t) {
  const px = h.x * TS - cx, py = h.y * TS - cy, pw = h.w * TS, ph = h.h * TS;
  const roofH = Math.round(ph * 0.55), wallY = py + roofH;
  const roof = h.roof || ["#5070b8", "#3a5498", "#7898d8", "#28386a"];
  R(ctx, "rgba(10,20,10,.35)", px + 3, py + ph - 1, pw - 2, 4);
  // walls: horizontal logs
  R(ctx, "#201820", px + 1, wallY - 2, pw - 2, ph - roofH + 2);
  for (let y = wallY; y < py + ph - 1; y += 4) { R(ctx, "#a07850", px + 2, y, pw - 4, 3); R(ctx, "#c09868", px + 2, y, pw - 4, 1); R(ctx, "#6a4a30", px + 2, y + 3, pw - 4, 1); }
  // windows (lit)
  const wins = h.windows || [];
  for (const wx of wins) {
    const x = px + wx, y = wallY + 5;
    R(ctx, "#201820", x - 1, y - 1, 10, 9); R(ctx, "#f8d860", x, y, 8, 7); R(ctx, "#fff0a0", x, y, 8, 2); R(ctx, "#c09030", x, y + 6, 8, 1);
    R(ctx, "#5a3a20", x + 3, y, 2, 7); R(ctx, "#5a3a20", x, y + 3, 8, 1);
  }
  // door
  const dx = px + (h.door[0] - h.x) * TS + 3;
  R(ctx, "#201820", dx - 1, py + ph - 15, 12, 15); R(ctx, "#f8d060", dx, py + ph - 14, 10, 14); R(ctx, "#6a4024", dx, py + ph - 14, 10, 3);
  R(ctx, "#c09030", dx + 4, py + ph - 11, 2, 11);
  // roof with shingles and a ridge
  R(ctx, "#181420", px - 2, py + 4, pw + 4, roofH - 2);
  for (let y = py + 5; y < wallY; y++) {
    const row = y - py - 5, inset = Math.max(0, 6 - row);
    R(ctx, row % 4 === 3 ? roof[1] : roof[0], px - 1 + inset, y, pw + 2 - inset * 2, 1);
    if (row % 4 === 0) for (let sx = px + inset + ((row / 4) % 2) * 4; sx < px + pw - inset; sx += 8) R(ctx, roof[1], sx, y, 1, 4);
  }
  R(ctx, roof[2], px + 6, py + 5, pw - 12, 1); R(ctx, roof[3], px - 1, wallY - 3, pw + 2, 2);
  R(ctx, roof[2], px + 2, py + 9, 2, roofH - 14);
  if (h.chimney) { const ch = px + pw - 16; R(ctx, "#201820", ch - 1, py - 4, 8, 12); R(ctx, "#8a6a60", ch, py - 3, 6, 10); R(ctx, "#a88a80", ch, py - 3, 6, 1);
    const f = Math.floor(t / 300) % 3; R(ctx, "rgba(200,200,210,.5)", ch + 1 + f, py - 8 - f * 2, 3, 3); }
}
function lightsForHouse(h, cx, cy) {
  const px = h.x * TS - cx, py = h.y * TS - cy, wallY = py + Math.round(h.h * TS * 0.55);
  return (h.windows || []).map(wx => ({ x: px + wx + 4, y: wallY + 8, r: 22, a: 0.45 }))
    .concat([{ x: px + (h.door[0] - h.x) * TS + 8, y: py + h.h * TS - 6, r: 20, a: 0.4 }]);
}
function drawLamp(ctx, X, Y, t) {             // iron lantern on a post, palette-matched
  R(ctx, "#0b0a14", X + 6, Y - 10, 4, 25); R(ctx, "#2e3150", X + 7, Y - 10, 2, 24); R(ctx, "#5a5f8a", X + 7, Y - 10, 1, 24);
  R(ctx, "#0b0a14", X + 4, Y + 12, 8, 3); R(ctx, "#22243a", X + 5, Y + 12, 6, 2);
  R(ctx, "#0b0a14", X + 3, Y - 21, 10, 12); R(ctx, "#e8903a", X + 4, Y - 18, 8, 7); R(ctx, "#fcd888", X + 5, Y - 17, 6, 4); R(ctx, "#fff4c8", X + 6, Y - 16, 3, 2);
  R(ctx, "#0b0a14", X + 7, Y - 18, 2, 7);
  R(ctx, "#22243a", X + 2, Y - 22, 12, 2); R(ctx, "#3c4066", X + 4, Y - 24, 8, 2); R(ctx, "#5a5f8a", X + 4, Y - 24, 8, 1); R(ctx, "#0b0a14", X + 7, Y - 26, 2, 2);
  R(ctx, "#22243a", X + 3, Y - 11, 10, 2);
}
function drawBrazier(ctx, X, Y, t) {
  R(ctx, "#201820", X + 3, Y + 4, 10, 11); R(ctx, "#606068", X + 4, Y + 5, 8, 4); R(ctx, "#3a3a44", X + 6, Y + 9, 4, 6);
  const f = Math.floor(t / 120) % 2;
  R(ctx, "#e84828", X + 4, Y - 3 + f, 8, 8 - f); R(ctx, "#f89838", X + 5, Y - 1 + f, 6, 6 - f); R(ctx, "#f8e080", X + 6, Y + 1, 4, 3);
}
const PINE = mk(32, 32, x => {
  const rows = [[16, 2, 2], [16, 4, 4], [16, 6, 6], [16, 8, 5], [16, 10, 8], [16, 12, 10], [16, 14, 8], [16, 16, 11], [16, 18, 13], [16, 20, 11], [16, 22, 14], [16, 24, 13]];
  for (const [cx, y, hw] of rows) { R(x, "#183830", cx - hw - 1, y, hw * 2 + 2, 2); R(x, "#2a6050", cx - hw, y, hw * 2, 2); R(x, "#3a8068", cx - hw, y, hw, 1); R(x, "#50a080", cx - hw + 1, y, Math.max(1, hw - 3), 1); }
  R(x, "#183830", 13, 26, 6, 6); R(x, "#6a4028", 14, 26, 4, 6); R(x, "#8a5a38", 14, 26, 1, 6);
});
TILE.grass.push(mk(16, 16, x => { grass(x, 0); R(x, G.l, 6, 6, 2, 1); R(x, G.l, 12, 12, 1, 1); R(x, G.d, 5, 7, 4, 1); }),
                mk(16, 16, x => { grass(x, 1); R(x, G.d, 7, 4, 1, 3); R(x, G.d, 6, 5, 3, 1); R(x, G.l, 2, 13, 2, 1); }));

const MOODS = {
  night: { mul: "#34428a", glow: [255, 196, 120], warm: 0.22 },
  dusk: { mul: "#7c5468", glow: [255, 170, 90], warm: 0.16 },
};
const LIGHT_MASK = document.createElement("canvas"); LIGHT_MASK.width = 240; LIGHT_MASK.height = 160;
function applyLighting(ctx, mood, lights, t) {
  const M = MOODS[mood]; if (!M) return;
  // 1) build a light mask: ambient colour, with lamps punching warm holes in it
  const m = LIGHT_MASK.getContext("2d");
  m.globalCompositeOperation = "source-over"; m.fillStyle = M.mul; m.fillRect(0, 0, W, H);
  m.globalCompositeOperation = "lighter";
  const glow = (c, L, fl, alpha) => {
    const [r, gg, b] = L.col || M.glow, rad = L.r * fl;
    const g = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, rad);
    g.addColorStop(0, `rgba(${r},${gg},${b},${alpha})`); g.addColorStop(0.5, `rgba(${r},${gg},${b},${alpha * 0.5})`); g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    c.fillStyle = g; c.fillRect(L.x - rad, L.y - rad, rad * 2, rad * 2);
  };
  const fls = lights.map(L => L.flicker ? 0.9 + 0.1 * Math.sin(t / 90 + L.x * 1.7) : 1);
  lights.forEach((L, i) => glow(m, L, fls[i], Math.min(1, L.a * 1.5) * fls[i]));
  // 2) multiply the scene by the mask, then a soft warm bloom on top
  ctx.save();
  ctx.globalCompositeOperation = "multiply"; ctx.drawImage(LIGHT_MASK, 0, 0);
  ctx.globalCompositeOperation = "lighter";
  lights.forEach((L, i) => glow(ctx, { ...L, r: L.r * 0.6 }, fls[i], M.warm * fls[i] * (L.a + 0.3)));
  ctx.restore();
}
