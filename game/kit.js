// The kit bag: outfits earned in the field, the appearance editor, a standing-orders log and player options.

// ---------------------------------------------------------------- outfits
// Each one is a patch over the player's own face and colouring: a soldier changes clothes, not skin.
const OUTFITS = [
  { id: "fatigues", name: "ALLIED FATIGUES", desc: "Issue kit. Charcoal wool, crimson sash, gunmetal plate.", look: { cloak: 0, accent: 0, armor: 0, head: "hood" } },
  { id: "scout",    name: "SCOUT LEATHERS",  desc: "Moss and ochre, cut for crossing open ground quietly.", look: { cloak: 2, accent: 1, armor: 1, head: "bare" }, flag: "harness1", how: "Take the Tracker's charm on the Western Front." },
  { id: "runesmith", name: "RUNESMITH RIG",  desc: "Ash cloth and black iron, scorched at the cuffs.", look: { cloak: 4, accent: 2, armor: 2, head: "bare" }, flag: "harness2", how: "Help the runesmith at Outpost 7." },
  { id: "hover",    name: "HOVER JACKET",    desc: "Teal piping and a short collar. The rigger's own colours.", look: { cloak: 1, accent: 2, armor: 0, head: "bare" }, flag: "board", how: "Get the hover-rig running in the Hollow Wood." },
  { id: "salvage",  name: "DOMINION SALVAGE", desc: "Quarry plate with the Lord's seal filed off.", look: { cloak: 0, accent: 1, armor: 2, head: "helm" }, flag: "beat_brunt", how: "Break the foreman in the Cinder Pits." },
  { id: "breaker",  name: "WEST BREAKER",    desc: "Oxblood and bronze. The West was taken in this.", look: { cloak: 3, accent: 0, armor: 1, head: "helm" }, flag: "beat_general", how: "Bring down General Varrow." },
  { id: "oilskin",  name: "MARSH OILSKIN",   desc: "Bone-stitched waxed cloth. Still smells of lilies.", look: { cloak: 2, accent: 3, armor: 1, head: "hood" }, flag: "beat_salt", how: "Beat Warden Salt in the Drowned Marsh." },
  { id: "hollow",   name: "HOLLOW CLOAK",    desc: "Midnight and violet, cut from the Queen's own banner.", look: { cloak: 1, accent: 4, armor: 2, head: "hood" }, flag: "beat_general2", how: "Bring down General Mirene." },
  { id: "pilgrim",  name: "RIDGE PILGRIM",   desc: "Ash wool and a teal cord, for walking in thin air.", look: { cloak: 4, accent: 2, armor: 0, head: "bare" }, flag: "beat_hale", how: "Beat Captain Hale on the Windward Ridge." },
  { id: "shrine",   name: "SHRINE WHITES",   desc: "Bone cloth over ash. The Keeper's, and now yours.", look: { cloak: 4, accent: 3, armor: 0, head: "hood" }, flag: "beat_general3", how: "Bring down General Thal." },
  { id: "spoils",   name: "LORD'S SPOILS",   desc: "Gilt and oxblood, stripped from a throne room.", look: { cloak: 3, accent: 1, armor: 1, head: "helm" }, flag: "beat_hamon", how: "End Hamon." },
];
const outfitOpen = o => !o.flag || !!Game.flags[o.flag];

// a banner the moment a new one is earned, so nobody has to go looking
function checkOutfits() {
  if (!Game.flags.kitSeen) Game.flags.kitSeen = {};
  for (const o of OUTFITS) {
    if (!outfitOpen(o) || Game.flags.kitSeen[o.id]) continue;
    Game.flags.kitSeen[o.id] = true;
    if (o.flag) { Game.flash("NEW KIT: " + o.name); Sound.fx("level"); }
  }
}
const _onStep = World.onStep;
World.onStep = function () { const r = _onStep.call(this); checkOutfits(); return r; };

function wearOutfit(o) {
  Game.player.look = { ...DEFAULT_LOOK, ...Game.player.look, ...o.look };
  Game.flags.outfit = o.id;
  buildAllChars(Game.player.look);
  Game.autosave();
}

// ---------------------------------------------------------------- a screen that borrows the frame and gives it back
async function panelScreen(title, drawFn, keyFn) {
  const prev = Game.drawOverride;
  const mine = (c, t) => { drawDossierBg(c, t, title); drawFn(c, t); };
  Game.drawOverride = mine;
  await nextFrame();
  while (true) {
    if (Game.drawOverride !== mine) Game.drawOverride = mine;   // a screen opened on top of this one has handed the frame back
    const k = Game.keys;
    if (k.has("b") || k.has("start")) { Sound.fx("blip"); break; }
    if (await keyFn(k) === "close") break;
    await nextFrame();
  }
  Game.drawOverride = prev;
}

// ---------------------------------------------------------------- the kit bag
async function kitScreen() {
  let cur = 0, spin = 0, spr = buildChar({ ...DEFAULT_LOOK, ...Game.player.look });
  const rows = () => [...OUTFITS, { id: "_look", name: "APPEARANCE...", desc: "Change face, hair, headgear and colours.", look: null }];
  const draw = (c, t) => {
    const list = rows(), top = Math.max(0, Math.min(list.length - 7, cur - 3));
    // the soldier, turning slowly, wearing whatever the cursor is on
    const dir = ["down", "right", "up", "left"][Math.floor(spin / 300) % 4];
    const fr = spr[dir].idle[Math.floor(t / 520) % spr[dir].idle.length];
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(26, 112, 32, 3); c.fillRect(31, 111, 22, 5);
    c.drawImage(fr, 0, 0, 48, 48, 18, 44, 48, 48);
    drawText(c, Game.player.name, 42 - (textWidth(Game.player.name) >> 1), 120, "#e8c870", null);
    frameBox(c, 76, 14, 160, 102);
    list.slice(top, top + 7).forEach((o, i) => {
      const idx = top + i, y = 20 + i * 13, open = o.look === null || outfitOpen(o), worn = Game.flags.outfit === o.id;
      drawText(c, o.name, 90, y, o.look === null ? "#8ee6ff" : open ? (worn ? "#7ad66a" : INK) : "#6a6070");
      if (worn) drawText(c, "WORN", 206, y, "#7ad66a");
      else if (!open) R(c, "#6a6070", 214, y + 1, 5, 5), R(c, "#0d0a10", 215, y + 3, 3, 2);
      if (idx === cur) cursor(c, 81, y);
    });
    frameBox(c, 0, 120, 240, 40);
    const o = list[cur], text = o.look === null || outfitOpen(o) ? o.desc : "LOCKED. " + o.how;
    wrapText(text, 216).slice(0, 2).forEach((l, i) => drawText(c, l, 12, 128 + i * 14));
  };
  await panelScreen("KIT BAG", draw, async k => {
    spin++;
    const list = rows();
    const n = listMove(cur, k, list.length); if (n !== cur) { cur = n; const o = list[cur]; spr = buildChar({ ...DEFAULT_LOOK, ...Game.player.look, ...(o.look || {}) }); }
    if (!k.has("a")) return;
    const o = list[cur];
    if (o.look === null) {                                   // straight into the dossier editor, then back here
      Sound.fx("select"); await fadeOut(20);
      await customizeScene(null);
      spr = buildChar({ ...DEFAULT_LOOK, ...Game.player.look });
      Game.flags.outfit = null;                                  // the colours are the player's own now, not an issued set
      Game.autosave();
      Game.drawOverride = (c, t) => { drawDossierBg(c, t, "KIT BAG"); draw(c, t); };
      await fadeIn(20); return;
    }
    if (!outfitOpen(o)) { Sound.fx("bump"); return; }
    Sound.fx("capture"); wearOutfit(o);
    spr = buildChar({ ...DEFAULT_LOOK, ...Game.player.look });
  });
}

// ---------------------------------------------------------------- standing orders
// The main line is whatever is next on the road east; everything else is work you took on yourself.
function orders() {
  const F = Game.flags;
  const main = [
    [!F.starter, "Report to Commander Voss at the command post."],
    [!F.beat_general, "Push west. General Varrow holds the fortress at the end of the line."],
    [!F.beat_general2, "Through the Hollow Wood. General Mirene is waiting at the west arch."],
    [!F.beat_general3, "Climb to the High Shrines. General Thal keeps the summit gate."],
    [!F.beat_hamon, "Hamon's citadel. There is no one left between you and the Great Lord."],
    [true, "The war is over. The Dominion has fallen."],
  ].find(r => r[0])[1];
  const side = [];
  if (F.hunt && !F.harness1) side.push("Thin out the fields for the Tracker.");
  if (F.rig && !F.beat_pell) side.push("Take the drive core off the courier.");
  if (F.rig === 2 && !F.board) side.push("Collect the hover-rig from the rigger.");
  if (F.beat_general && !F.harness2) side.push("Help the runesmith at Outpost 7.");
  if (F.beat_general && !F.beat_brunt) side.push("The Cinder Pits are still working.");
  if (F.beat_brunt && !F.sapper) side.push("Free the sapper in the Cinder Pits.");
  if (F.beat_general && !F.gone_warmon0) side.push("Something sleeps in the south quarry.");
  if (F.beat_general2 && !F.gone_saint) side.push("The Marsh Saint, past the last bridge.");
  if (F.beat_general3 && !F.gone_voice) side.push("The Voice, chained at the wind shrine.");
  return { main, side };
}

async function ordersScreen() {
  const { main, side } = orders();
  const caught = OUTFITS.filter(outfitOpen).length, chapters = ["beat_general", "beat_general2", "beat_general3", "beat_hamon"].filter(f => Game.flags[f]).length;
  const draw = (c) => {
    frameBox(c, 6, 16, 228, 46);
    drawText(c, "CURRENT", 14, 21, "#8ee6ff");
    wrapText(main, 210).slice(0, 2).forEach((l, i) => drawText(c, l, 14, 36 + i * 14));
    frameBox(c, 6, 66, 228, 70);
    drawText(c, "IN THE FIELD", 14, 71, "#8ee6ff");
    if (!side.length) drawText(c, "Nothing outstanding.", 14, 86, "#8a8090");
    else side.slice(0, 4).forEach((s, i) => { R(c, "#e8c870", 15, 89 + i * 12, 2, 2); drawText(c, s, 22, 86 + i * 12); });
    drawText(c, `GENERALS DOWN ${chapters}/4`, 8, 142, "#a8b8e0", null);
    drawText(c, `KIT ${caught}/${OUTFITS.length}`, 132, 142, "#a8b8e0", null);
    drawText(c, fmtTime(Game.playtime), 232 - textWidth(fmtTime(Game.playtime)), 142, "#a8b8e0", null);
  };
  await panelScreen("STANDING ORDERS", draw, async () => {});
}

// ---------------------------------------------------------------- options
async function optionsScreen() {
  let cur = 0;
  const rows = () => [
    ["TEXT SPEED", ["SLOW", "NORMAL", "FAST"][Game.opts.text]],
    ["AUTO-RUN", Game.opts.autorun ? "ON  (hold B to walk)" : "OFF (hold B to run)"],
    ["SOUND", Game.muted ? "OFF" : "ON"],
    ["FULLSCREEN", "PRESS A  (or F)"],
    ["BACK", ""],
  ];
  const draw = (c) => {
    frameBox(c, 10, 20, 220, 92);
    rows().forEach(([label, val], i) => {
      const y = 28 + i * 16;
      drawText(c, label, 26, y, i === rows().length - 1 ? "#e05050" : INK);
      if (val) drawText(c, val, 222 - textWidth(val), y, "#a8b8e0");
      if (i === cur) cursor(c, 17, y);
    });
    drawText(c, "These stay with you, not with the save.", 10, 126, "#8a8090", null);
  };
  await panelScreen("OPTIONS", draw, async k => {
    cur = listMove(cur, k, 5);
    const left = k.has("left"), right = k.has("right"), a = k.has("a");
    if (!left && !right && !a) return;
    if (cur === 0) { Game.opts.text = (Game.opts.text + (left ? 2 : 1)) % 3; Sound.fx("blip"); Game.saveOpts(); }
    else if (cur === 1) { Game.opts.autorun = !Game.opts.autorun; Sound.fx("blip"); Game.saveOpts(); }
    else if (cur === 2) { Game.toggleSound(); Sound.fx("blip"); }
    else if (cur === 3 && a) { toggleFullscreen(); }
    else if (cur === 4 && a) return "close";
  });
}

// ---------------------------------------------------------------- wire the new entries into the pause menu
const _menuPick = World.updateMenu;
World.updateMenu = function () {
  const before = this.menu, opts = this.menuOpts(), pick = opts[this.mcur], a = Game.keys.has("a");
  if (before === "main" && a && (pick === "KIT" || pick === "MAP" || pick === "ORDERS" || pick === "OPTIONS")) {
    Sound.fx("select"); this.menu = null;
    return this.run(async () => {
      await (pick === "KIT" ? kitScreen() : pick === "MAP" ? mapScreen() : pick === "ORDERS" ? ordersScreen() : optionsScreen());
    });
  }
  return _menuPick.call(this);
};


// ---------------------------------------------------------------- the theatre map
// A painted chart of the western theatre: the cold sea and the citadel cape in the west,
// the army road running east to the camp, and the side country above and below it.
// Terrain, roads and emblems are painted once into one canvas; weather, cloud cover and
// the marker ride on top of it every frame.

const MAPX = 0, MAPY = 17, MAPW = 240, MAPH = 93;

const REGION_MAP = [
  { id: "citadel", x: 34,  y: 46, ly: 11, label: "CITADEL", full: "HAMON'S CITADEL",  lv: "LV 42-50", ground: "BLACK STONE",
    desc: "The Great Lord's seat on the western cape. The end of the road, and of the war.",
    boss: "HAMON", flag: "beat_hamon" },
  { id: "shrines", x: 78,  y: 46, ly: 21, label: "SHRINES", full: "THE HIGH SHRINES", lv: "LV 34-40", ground: "TERRACES",
    desc: "Stepped courts cut into the summit, flooded at the lower end. Thal keeps the gate.",
    boss: "GEN. THAL", flag: "beat_general3" },
  { id: "hollow",  x: 122, y: 46, ly: 11, label: "HOLLOW",  full: "THE HOLLOW WOOD",  lv: "LV 26-32", ground: "OLD FOREST",
    desc: "Close canopy and no sky at all. Mirene holds the west arch on the far side.",
    boss: "GEN. MIRENE", flag: "beat_general2" },
  { id: "front",   x: 168, y: 46, ly: 21, label: "FRONT",   full: "THE WESTERN FRONT", lv: "LV 14-22", ground: "TRENCH LINE",
    desc: "Wire, sandbags and shell holes. Outpost 7 at the midpoint, Varrow's fort at the end.",
    boss: "GEN. VARROW", flag: "beat_general" },
  { id: "camp",    x: 212, y: 46, ly: 11, label: "CAMP",    full: "ALLIED BASE CAMP",  lv: "LV 2-8",   ground: "GRASSLAND",
    desc: "Tents, a drill yard and the muster field. Where you signed your name.", boss: null },
  { id: "ridge",   x: 78,  y: 15, ly: 11, label: "RIDGE",   full: "THE WINDWARD RIDGE", lv: "LV 36-42", ground: "HIGH CRAG",
    desc: "Four terraces of thin air and lantern cord. The Voice is chained at the wind shrine.",
    boss: "CAPT. HALE", flag: "beat_hale" },
  { id: "cinder",  x: 180, y: 15, ly: 11, label: "PITS",    full: "THE CINDER PITS",   lv: "LV 18-24", ground: "ASH WASTE",
    desc: "A Dominion quarry, still burning and still working. The foreman answers to nobody.",
    boss: "FOREMAN BRUNT", flag: "beat_brunt" },
  { id: "marsh",   x: 126, y: 72, ly: 11, label: "MARSH",   full: "THE DROWNED MARSH", lv: "LV 28-34", ground: "FEN",
    desc: "Three channels and nine plank bridges, with a saint's pool past the last of them.",
    boss: "WARDEN SALT", flag: "beat_salt" },
];
const MAP_HOME = { hq: "camp", barracks: "camp", infirmary: "camp" };
const seenMap = id => !!(Game.flags.seen && Game.flags.seen[MAP_HOME[id] || id]);

const _mapLoad = World.load;
World.load = function (id, x, y, dir) {
  _mapLoad.call(this, id, x, y, dir);
  if (!Game.flags.seen) Game.flags.seen = {};
  Game.flags.seen[MAP_HOME[id] || id] = true;
};

// the army road, and the three spurs off it
const MAP_ROADS = [
  [[34, 46], [56, 44], [78, 46]], [[78, 46], [100, 48], [122, 46]],
  [[122, 46], [145, 44], [168, 46]], [[168, 46], [190, 48], [212, 46]],
  [[78, 46], [104, 38], [102, 24], [82, 16]],      // the climb to the ridge, swung wide of its name
  [[168, 46], [160, 34], [166, 22], [180, 16]],    // the haul road up to the pits
  [[122, 46], [142, 56], [134, 68], [126, 72]],    // the causeway south into the fen
];
// the water that comes off the ridge, crosses under the road and drowns the south
const MAP_RIVER = [[84, 22], [92, 34], [96, 46], [104, 58], [114, 68], [126, 76], [140, 80], [152, 86]];

// ---------------------------------------------------------------- painting the chart
const mrnd = s => () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

// each region paints its own ground, in three tones: body, shadow and catchlight
const MAP_PAL = {
  citadel: ["#28243a", "#1b1828", "#3a3454"], shrines: ["#5c5660", "#494452", "#7e7684"],
  hollow:  ["#1e3a26", "#16301d", "#2a5231"], front:   ["#4a4034", "#3a3228", "#5c5042"],
  camp:    ["#3a5a32", "#2c4a26", "#4e7040"], ridge:   ["#4c5468", "#3b4254", "#6e7c94"],
  cinder:  ["#3e2e2a", "#30221e", "#543a2e"], marsh:   ["#26403a", "#1b342c", "#36564c"],
};
const MAP_PULL = { citadel: 1.0, shrines: 1.0, hollow: 1.1, front: 1.0, camp: 1.0, ridge: 0.9, cinder: 0.9, marsh: 0.95 };

let THEATRE = null;

function paintTheatre() {
  const rnd = mrnd(0x51a7), N = MAPW * MAPH;
  const noise = new Float32Array(N), grain = new Float32Array(N);
  for (let i = 0; i < N; i++) { noise[i] = rnd(); grain[i] = rnd(); }

  // --- where the land is: a west coast, a bitten-out southern bay, and a ragged shore
  const coastX = y => 19 + Math.sin(y / 11) * 2.5 + Math.sin(y / 4.3) * 1.3;
  const topY = x => 2 + Math.sin(x / 19) * 2 + Math.sin(x / 7) * 1;
  const botY = x => MAPH - 3 - Math.sin(x / 23 + 2) * 2.5 - Math.sin(x / 9) * 1.2;
  const inBay = (x, y) => Math.hypot((x - 40) / 20, (y - 96) / 13) < 1;
  const land = (x, y) => x > coastX(y) && y > topY(x) && y < botY(x) && !inBay(x, y);

  // --- who owns each land pixel: nearest region, pulled about by the noise so the borders wander
  const own = new Int8Array(N).fill(-1);
  for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) {
    const i = y * MAPW + x;
    if (!land(x, y)) continue;
    let best = 0, bd = 1e9;
    for (let r = 0; r < REGION_MAP.length; r++) {
      const q = REGION_MAP[r];
      const d = Math.hypot(x - q.x, (y - q.y) * 1.25) / MAP_PULL[q.id] + (noise[i] - 0.5) * 11;
      if (d < bd) { bd = d; best = r; }
    }
    own[i] = best;
  }

  const waves = [], vents = [];
  const base = mk(MAPW, MAPH, x => {
    // ---- the cold sea, banded light to dark as it deepens
    for (let y = 0; y < MAPH; y++) R(x, lerpCol("#15304c", "#071326", y / MAPH), 0, y, MAPW, 1);
    for (let y = 0; y < MAPH; y++) for (let px = 0; px < MAPW; px++) {
      if (own[y * MAPW + px] >= 0) continue;
      const n = grain[y * MAPW + px];
      if (n > 0.93) { R(x, "#2a5478", px, y, 2, 1); if (waves.length < 90) waves.push([px, y]); }
      else if (n < 0.06) R(x, "#0a1a30", px, y, 1, 1);
    }

    // ---- the ground, three tones a pixel at a time
    for (let y = 0; y < MAPH; y++) for (let px = 0; px < MAPW; px++) {
      const i = y * MAPW + px, o = own[i];
      if (o < 0) continue;
      const p = MAP_PAL[REGION_MAP[o].id], g = grain[i];
      R(x, g > 0.80 ? p[2] : g < 0.30 ? p[1] : p[0], px, y, 1, 1);
    }

    // ---- the surf line, and a pale shelf just off the shore
    for (let y = 0; y < MAPH; y++) for (let px = 1; px < MAPW; px++) {
      const i = y * MAPW + px;
      if (own[i] < 0 || own[i - 1] >= 0) continue;
      R(x, "#0b0912", px - 1, y, 1, 1);
      R(x, (y & 1) ? "#6ea8c0" : "#4a86a4", px - 2, y, 1, 1);
      R(x, "#23506e", px - 4, y, 2, 1);
    }
    for (let px = 0; px < MAPW; px++) for (let y = 1; y < MAPH; y++) {   // and along the top and bottom shores
      const i = y * MAPW + px;
      if (own[i] >= 0 && own[i - MAPW] < 0) { R(x, "#0b0912", px, y - 1, 1, 1); R(x, "#4a86a4", px, y - 2, 1, 1); }
      if (own[i] < 0 && own[i - MAPW] >= 0) { R(x, "#0b0912", px, y, 1, 1); R(x, "#4a86a4", px, y + 1, 1, 1); }
    }

    // ---- what grows, burns or stands on each kind of ground
    const at = (px, py) => (px < 1 || py < 1 || px >= MAPW - 1 || py >= MAPH - 1) ? -1 : own[py * MAPW + px];
    const tree = (px, py, a, b) => { R(x, b, px - 2, py - 1, 5, 3); R(x, b, px - 1, py - 3, 3, 2); R(x, a, px - 1, py - 2, 3, 2); R(x, a, px, py - 3, 1, 1); R(x, "#241a14", px, py + 2, 1, 2); };
    const peak = (px, py, w, h, a, b, cap) => {
      for (let k = 0; k < h; k++) { const ww = Math.round(w * (k / h)); R(x, b, px - ww, py - h + k, ww * 2 + 1, 1); R(x, a, px - ww, py - h + k, ww + 1, 1); }
      if (cap) { R(x, "#e8eef6", px - 1, py - h, 3, 2); R(x, "#c2d2e2", px - 2, py - h + 2, 5, 1); }
      R(x, "#1a1724", px - w - 1, py, w * 2 + 3, 1);
    };
    const crater = (px, py, r) => { R(x, "#6a5c48", px - r, py - 1, r * 2 + 1, 1); R(x, "#241e18", px - r + 1, py - 1, r * 2 - 1, 2); R(x, "#6a5c48", px - r + 1, py + 1, r * 2 - 1, 1); };
    const pool = (px, py, w) => { R(x, "#132a2e", px - 1, py - 1, w + 2, 4); R(x, "#2e6e74", px, py, w, 2); R(x, "#78c4c0", px, py, w - 1, 1); };

    for (let n = 0; n < 5200; n++) {
      const px = 1 + Math.floor(rnd() * (MAPW - 2)), py = 1 + Math.floor(rnd() * (MAPH - 2)), o = at(px, py);
      if (o < 0) continue;
      const id = REGION_MAP[o].id, v = rnd();
      if (id === "hollow") { if (v < 0.34) tree(px, py, v < 0.08 ? "#6ab468" : "#4e9450", "#16331c"); }
      else if (id === "camp") {
        if (v < 0.06) tree(px, py, "#5a9a4c", "#2e5c2c");
        else if (v < 0.20) { R(x, "#7ea048", px, py, 5, 1); R(x, "#4e6a34", px, py + 1, 5, 1); }   // ploughed strips
      } else if (id === "ridge") { if (v < 0.09) peak(px, py, 3 + Math.floor(rnd() * 3), 4 + Math.floor(rnd() * 4), "#8a8498", "#4a4458", rnd() < 0.5); }
      else if (id === "shrines") {
        if (v < 0.05) peak(px, py, 3, 4, "#7c7488", "#443e50", false);
        else if (v < 0.10) { R(x, "#6a6478", px - 3, py, 7, 1); R(x, "#2e2a38", px - 3, py + 1, 7, 1); }   // cut terraces
      } else if (id === "citadel") {
        if (v < 0.06) { const h = 4 + Math.floor(rnd() * 4); R(x, "#15121e", px - 1, py - h, 3, h); R(x, "#4a4260", px - 1, py - h, 1, h); R(x, "#1a1626", px - 2, py, 5, 1); }
        else if (v < 0.09) R(x, "#1d1a28", px - 2, py, 5, 2);
      } else if (id === "front") {
        if (v < 0.05) crater(px, py, 2 + Math.floor(rnd() * 2));
        else if (v < 0.12) { const w = 5 + Math.floor(rnd() * 7); R(x, "#2a2218", px, py, w, 1); R(x, "#6a5c44", px, py + 1, w, 1); }   // trench and spoil
        else if (v < 0.15) { R(x, "#2e2820", px, py - 2, 1, 3); R(x, "#4a4034", px - 1, py - 2, 3, 1); }   // picket
      } else if (id === "cinder") {
        if (v < 0.05) { R(x, "#120e10", px - 3, py - 1, 7, 3); R(x, "#c4461c", px - 2, py, 5, 1); R(x, "#f0a040", px - 1, py, 3, 1); if (vents.length < 8) vents.push([px, py - 2]); }
        else if (v < 0.11) { R(x, "#e06a22", px, py, 2, 1); R(x, "#8a2c10", px + 2, py + 1, 2, 1); }   // cracks in the crust
        else if (v < 0.15) R(x, "#54403a", px - 1, py, 3, 1);
      } else if (id === "marsh") {
        if (v < 0.10) pool(px, py, 3 + Math.floor(rnd() * 5));
        else if (v < 0.22) { R(x, "#4e7a58", px, py - 2, 1, 3); R(x, "#4e7a58", px + 2, py - 1, 1, 2); R(x, "#2a4238", px, py + 1, 3, 1); }   // reeds
      }
    }

    // ---- the river off the ridge, and the ford where the road crosses it
    const river = [];
    for (let s = 0; s < MAP_RIVER.length - 1; s++) {
      const [ax, ay] = MAP_RIVER[s], [bx, by] = MAP_RIVER[s + 1], steps = Math.round(Math.hypot(bx - ax, by - ay) * 2);
      for (let k = 0; k <= steps; k++) river.push([Math.round(ax + (bx - ax) * k / steps + Math.sin(k / 5 + s) * 1.2), Math.round(ay + (by - ay) * k / steps)]);
    }
    for (const [px, py] of river) R(x, "#0e2430", px - 2, py - 1, 6, 3);            // the cut bank, laid down first
    for (const [px, py] of river) { R(x, "#2e6a84", px, py, 2, 1); R(x, "#74b6c8", px, py, 1, 1); }

    // ---- the army road: packed ochre with a dark verge, dashed where it climbs
    const road = [];
    for (const line of MAP_ROADS) for (let s = 0; s < line.length - 1; s++) {
      const [ax, ay] = line[s], [bx, by] = line[s + 1], steps = Math.round(Math.hypot(bx - ax, by - ay) * 2);
      for (let k = 0; k <= steps; k++) road.push([Math.round(ax + (bx - ax) * k / steps), Math.round(ay + (by - ay) * k / steps)]);
    }
    for (const [px, py] of road) R(x, "#241c14", px - 1, py - 1, 4, 4);             // verge first, or it buries the metalling
    for (const [px, py] of road) { R(x, "#8a6c38", px, py, 2, 2); R(x, "#d8bc7c", px, py, 2, 1); }
    for (let i = 0; i < road.length; i += 3) R(x, "#f2e0ae", road[i][0], road[i][1], 1, 1);   // cart ruts catching the light

    // ---- surveyor's graticule, laid faintly over everything
    x.fillStyle = "rgba(220,200,150,.055)";
    for (let gx = 24; gx < MAPW; gx += 24) x.fillRect(gx, 0, 1, MAPH);
    for (let gy = 16; gy < MAPH; gy += 16) x.fillRect(0, gy, MAPW, 1);

    // ---- an emblem for every region, so the chart reads without its labels
    const emblem = {
      citadel: (px, py) => {
        R(x, "#0b0912", px - 7, py - 2, 15, 9); R(x, "#2c2740", px - 6, py - 1, 13, 7);
        for (const [ox, h] of [[-5, 9], [-1, 13], [4, 8]]) { R(x, "#0b0912", px + ox - 1, py - h + 4, 5, h); R(x, "#3e3658", px + ox, py - h + 5, 3, h - 2); R(x, "#15121e", px + ox, py - h + 5, 1, h - 2); }
        R(x, "#e03030", px, py - 7, 2, 2); R(x, "#ff8060", px, py - 7, 1, 1);
      },
      shrines: (px, py) => {
        for (let k = 0; k < 4; k++) R(x, k & 1 ? "#8a8296" : "#6e6680", px - 7 + k * 2, py + 2 - k * 2, 15 - k * 4, 2);
        R(x, "#0b0912", px - 8, py + 4, 17, 1);
        for (const ox of [-4, 0, 4]) { R(x, "#cfc8d8", px + ox - 1, py - 7, 2, 5); R(x, "#5e5668", px + ox, py - 7, 1, 5); }
        R(x, "#8ee6ff", px - 1, py - 9, 3, 2);
      },
      hollow: (px, py) => {
        R(x, "#0e2416", px - 8, py - 4, 17, 8); R(x, "#1d4426", px - 7, py - 7, 15, 9); R(x, "#2e6434", px - 5, py - 8, 11, 8);
        R(x, "#4e9450", px - 3, py - 8, 6, 4); R(x, "#2a1c12", px - 1, py + 2, 3, 5); R(x, "#4a3222", px - 1, py + 2, 1, 5);
        R(x, "#0b0912", px - 4, py + 7, 9, 1);
      },
      front: (px, py) => {
        R(x, "#0b0912", px - 8, py + 1, 17, 5); R(x, "#6a5c44", px - 7, py + 2, 15, 3);
        for (let k = -6; k <= 6; k += 3) R(x, "#4a4034", px + k, py + 2, 2, 3);
        R(x, "#2e2820", px - 1, py - 8, 1, 9); R(x, "#c03040", px, py - 8, 7, 4); R(x, "#f06070", px, py - 8, 7, 1);
        R(x, "#8a8296", px + 4, py - 2, 1, 4); R(x, "#8a8296", px - 5, py - 2, 1, 4);
      },
      camp: (px, py) => {
        R(x, "#0b0912", px - 9, py + 3, 19, 1);
        for (const [ox, w] of [[-6, 6], [1, 7]]) {
          for (let k = 0; k < w; k++) R(x, "#cfc4a8", px + ox + (w >> 1) - k, py + 3 - (w - k), 1, w - k > 0 ? w - k : 1);
          for (let k = 0; k < w; k++) R(x, "#8e8468", px + ox + (w >> 1) + k, py + 3 - (w - k), 1, w - k > 0 ? w - k : 1);
        }
        R(x, "#2e2820", px - 2, py - 9, 1, 6); R(x, "#e8c870", px - 1, py - 9, 5, 3);
        R(x, "#f0a040", px + 7, py + 1, 2, 2);
      },
      ridge: (px, py) => {
        for (const [ox, h, w] of [[-6, 7, 4], [0, 11, 6], [6, 8, 5]]) {
          for (let k = 0; k < h; k++) { const ww = Math.round(w * k / h); R(x, "#4a4458", px + ox - ww, py + 3 - h + k, ww * 2 + 1, 1); R(x, "#8a8498", px + ox - ww, py + 3 - h + k, ww + 1, 1); }
        }
        R(x, "#e8eef6", px - 1, py - 8, 3, 2); R(x, "#0b0912", px - 9, py + 3, 19, 1);
        R(x, "#8ee6ff", px + 5, py - 4, 2, 2);
      },
      cinder: (px, py) => {
        R(x, "#0b0912", px - 8, py + 2, 17, 3);
        for (let k = 0; k < 4; k++) R(x, k & 1 ? "#3e2e2a" : "#54403a", px - 7 + k, py + 2 - k * 2, 15 - k * 2, 2);
        R(x, "#120e10", px - 3, py - 6, 7, 4); R(x, "#c4461c", px - 2, py - 5, 5, 2); R(x, "#ffb050", px - 1, py - 5, 3, 1);
        R(x, "#2a2220", px + 5, py - 8, 3, 8); R(x, "#4a3a34", px + 5, py - 8, 1, 8);
      },
      marsh: (px, py) => {
        R(x, "#132a2e", px - 9, py - 1, 19, 7); R(x, "#2e6e74", px - 8, py, 17, 5); R(x, "#78c4c0", px - 8, py, 15, 1);
        for (const ox of [-6, -2, 3, 7]) { R(x, "#4e7a58", px + ox, py - 5, 1, 5); R(x, "#2a4238", px + ox - 1, py - 1, 3, 1); }
        R(x, "#cfc4a8", px - 3, py - 9, 7, 5); R(x, "#8e8468", px - 3, py - 9, 7, 1); R(x, "#2a4238", px - 1, py - 6, 3, 2);
        R(x, "#e8c870", px - 1, py - 11, 2, 2);
      },
    };
    for (const r of REGION_MAP) emblem[r.id](r.x, r.y);

    // ---- compass rose out in the western water
    const cx0 = 9, cy0 = 72;
    R(x, "#0a1828", cx0 - 7, cy0 - 7, 15, 15);
    for (let k = 0; k < 7; k++) { R(x, "#e8c870", cx0, cy0 - 7 + k, 1, 1); R(x, "#8a7a40", cx0, cy0 + 1 + k, 1, 1); R(x, "#8a7a40", cx0 - 7 + k, cy0, 1, 1); R(x, "#8a7a40", cx0 + 1 + k, cy0, 1, 1); }
    R(x, "#e8c870", cx0 - 1, cy0 - 5, 3, 3); R(x, "#0a1828", cx0, cy0 - 4, 1, 1);
    R(x, "#cfc4a8", cx0 - 1, cy0 - 1, 3, 3); R(x, "#2a2018", cx0, cy0, 1, 1);

    // ---- scale bar, bottom right
    R(x, "#0a1828", 26, 84, 32, 7);
    for (let k = 0; k < 4; k++) R(x, k & 1 ? "#cfc4a8" : "#4a3c2c", 28 + k * 7, 86, 7, 3);
    R(x, "#cfc4a8", 28, 85, 1, 5); R(x, "#cfc4a8", 55, 85, 1, 5);
  });

  // ---- cloud cover for country nobody has walked yet, one sheet per region
  const fog = REGION_MAP.map((r, idx) => mk(MAPW, MAPH, x => {
    for (let y = 0; y < MAPH; y++) for (let px = 0; px < MAPW; px++) {
      const i = y * MAPW + px;
      if (own[i] !== idx) continue;
      const g = grain[i];
      R(x, g > 0.86 ? "#2a2636" : g > 0.60 ? "#1d1a28" : "#14121c", px, y, 1, 1);
    }
  }));

  return { base, fog, waves, vents };
}

// ---------------------------------------------------------------- the screen
async function mapScreen() {
  if (!THEATRE) THEATRE = paintTheatre();
  const here = MAP_HOME[Game.mapId] || Game.mapId;
  let cur = Math.max(0, REGION_MAP.findIndex(r => r.id === here));
  const labels = { key: null, img: null };

  const draw = (c, t) => {
    const seen = REGION_MAP.map(r => seenMap(r.id));
    c.drawImage(THEATRE.base, MAPX, MAPY);

    // swell on the open water
    for (let i = 0; i < THEATRE.waves.length; i++) {
      const [wx, wy] = THEATRE.waves[i];
      if (Math.sin(t / 540 + wx * 0.4 + wy * 0.7) > 0.72) R(c, "#8ec8e0", MAPX + wx, MAPY + wy, 2, 1);
    }
    // smoke off the pits, as long as anyone has seen them
    if (seen[REGION_MAP.findIndex(r => r.id === "cinder")]) {
      c.save(); c.globalAlpha = 0.5;
      for (let i = 0; i < THEATRE.vents.length; i++) {
        const [vx, vy] = THEATRE.vents[i];
        for (let k = 0; k < 4; k++) {
          const ph = (t / 26 + i * 37 + k * 9) % 36;
          R(c, k ? "#4a4248" : "#6a6068", MAPX + vx + Math.round(Math.sin((ph + i) / 7) * 2), MAPY + vy - Math.round(ph), 1, 1);
        }
      }
      c.restore();
    }

    REGION_MAP.forEach((r, i) => {
      if (!seen[i]) c.drawImage(THEATRE.fog[i], MAPX, MAPY);
    });

    // labels: a plate under each name so it stays legible over any ground. They only
    // change when new country is charted, so the whole sheet is kept until then.
    const key = seen.map(v => v ? 1 : 0).join("") + here;
    if (labels.key !== key) {
      labels.key = key;
      labels.img = mk(W, H, x => REGION_MAP.forEach((r, i) => {
        const lab = seen[i] ? r.label : "?????", lw = textWidth(lab);
        const lx = MAPX + r.x - (lw >> 1), ly = MAPY + r.y + r.ly;
        R(x, "rgba(8,6,12,.72)", lx - 2, ly - 1, lw + 4, FONT_H + 1);
        drawText(x, lab, lx, ly, seen[i] ? (r.id === here ? "#7ad66a" : "#e6dcc8") : "#7a7488", "#0a080c");
        if (!seen[i]) drawText(x, "?", MAPX + r.x - 2, MAPY + r.y - 4, "#6a6478", "#0a080c");
      }));
    }
    c.drawImage(labels.img, 0, 0);

    // where you are: a staked flag that catches the light
    const h = REGION_MAP[REGION_MAP.findIndex(r => r.id === here)];
    if (h) {
      const px = MAPX + h.x + 9, py = MAPY + h.y - 12, f = Math.floor(t / 260) % 2;
      R(c, "#2e2820", px, py, 1, 13);
      R(c, "#7ad66a", px + 1, py, 7 - f, 4); R(c, "#bdf2a8", px + 1, py, 7 - f, 1);
      if (Math.floor(t / 300) % 2) { R(c, "#bdf2a8", px - 1, py + 13, 3, 1); R(c, "#bdf2a8", px, py + 12, 1, 3); }
    }

    // the reticle on whatever the cursor is over
    const r = REGION_MAP[cur], sel = Math.floor(t / 150) % 2 ? "#f0dc98" : "#a08c48";
    const bx = MAPX + r.x - 13, by = MAPY + r.y - 12, bw = 26, bh = 24;
    for (const [ox, oy, sx, sy] of [[0, 0, 1, 1], [bw, 0, -1, 1], [0, bh, 1, -1], [bw, bh, -1, -1]]) {
      R(c, sel, bx + ox - (sx < 0 ? 5 : 0), by + oy - (sy < 0 ? 0 : 0), 6, 1);
      R(c, sel, bx + ox - (sx < 0 ? 0 : 0), by + oy - (sy < 0 ? 5 : 0), 1, 6);
    }

    // ---- the brief on the selected country
    frameBox(c, 0, 110, 240, 50);
    const open = seen[cur];
    const name = open ? r.full : "UNCHARTED";
    drawText(c, name, 8, 116, open ? "#e8c870" : "#8a8090");
    if (open) drawText(c, r.lv, 232 - textWidth(r.lv), 116, "#8ee6ff");
    wrapText(open ? r.desc : "No one has brought a map back from here.", 222).slice(0, 2)
      .forEach((l, i) => drawText(c, l, 8, 127 + i * 10, open ? INK : "#8a8090"));
    if (open) {
      drawText(c, r.ground, 8, 148, "#a8b8e0");
      const down = r.flag && Game.flags[r.flag];
      const tag = r.boss ? (down ? r.boss + " DOWN" : r.boss + " HOLDS") : "FRIENDLY GROUND";
      drawText(c, tag, 232 - textWidth(tag), 148, r.boss ? (down ? "#7ad66a" : "#f06070") : "#7ad66a");
    } else {
      const n = seen.filter(Boolean).length, tally = `CHARTED ${n}/${REGION_MAP.length}`;
      drawText(c, tally, 232 - textWidth(tally), 148, "#a8b8e0");
    }
  };

  await panelScreen("THEATRE MAP", draw, async k => {
    // step to whichever country actually lies that way on the chart
    let dx = 0, dy = 0;
    if (k.has("left")) dx = -1; else if (k.has("right")) dx = 1;
    else if (k.has("up")) dy = -1; else if (k.has("down")) dy = 1;
    if (!dx && !dy) return;
    const a = REGION_MAP[cur];
    let best = -1, bestD = 1e9;
    REGION_MAP.forEach((q, i) => {
      if (i === cur) return;
      const ddx = q.x - a.x, ddy = q.y - a.y;
      if (dx && (Math.sign(ddx) !== dx || Math.abs(ddy) > 24)) return;
      if (dy && (Math.sign(ddy) !== dy || Math.abs(ddx) > 54)) return;
      const d = Math.abs(ddx) + Math.abs(ddy) * 1.4;
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) { cur = best; Sound.fx("blip"); }
  });
}
