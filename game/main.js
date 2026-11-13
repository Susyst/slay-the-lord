// Main loop, input, text boxes, transitions, title, intro cinematic, ending, saving.
const cv = document.getElementById("screen");
const ctx = cv.getContext("2d");
ctx.imageSmoothingEnabled = false;

const Game = {
  scene: "title", keys: new Set(), held: new Set(), ticks: 0, fade: 0, muted: false,
  party: [], vault: [], bag: { kit: 3, rig: 0 }, flags: {}, mapId: "camp", checkpoint: { map: "camp", x: 6, y: 12 },
  banner: null, drawOverride: null, wipe: 0,
  player: { name: "KAI", look: { skin: 0, hair: 0, cloak: 0, armor: 0 } },
  flash(name) { this.banner = { name, t: 150 }; },
  toggleSound() { this.muted = !this.muted; if (this.muted) { Sound.stop(); Sound.hush(); } else { Sound.init(); Sound.play(World.map ? World.map.music : "title"); } },
  slot: 0, playtime: 0, savedAt: 0,
  opts: (() => { const d = { text: 1, autorun: false, follower: true };
    try { return { ...d, ...JSON.parse(localStorage.getItem("ellyendor-opts") || "{}") }; } catch (e) { return d; } })(),
  saveOpts() { try { localStorage.setItem("ellyendor-opts", JSON.stringify(this.opts)); } catch (e) {} },
  slotKey: i => "ellyendor-slot-" + i,
  // Writes the current run into the active slot. Autosaves call this silently; the menu calls it with feedback.
  save(auto) {
    try {
      const p = World.player; if (!p || !World.map) return false;
      const data = { v: 2, player: this.player, party: this.party, vault: this.vault || [], bag: this.bag, flags: this.flags, map: this.mapId, x: p.x, y: p.y, dir: p.dir,
                     cp: this.checkpoint, playtime: Math.floor(this.playtime), place: World.map.name, savedAt: Date.now() };
      localStorage.setItem(this.slotKey(this.slot), JSON.stringify(data));
      this.savedAt = Game.ticks; this.saveIcon = auto ? 90 : 0;
      return true;
    } catch (e) { return false; }
  },
  loadSlot(i) {
    try { const s = JSON.parse(localStorage.getItem(this.slotKey(i)) || "null"); return s && s.party ? s : null; } catch (e) { return null; }
  },
  slots() {
    try {   // carry an old single save over into slot 1
      const old = localStorage.getItem("ellyendor-save");
      if (old && !localStorage.getItem(this.slotKey(0))) { localStorage.setItem(this.slotKey(0), old); localStorage.removeItem("ellyendor-save"); }
    } catch (e) {}
    return [0, 1, 2].map(i => this.loadSlot(i));
  },
  deleteSlot(i) { try { localStorage.removeItem(this.slotKey(i)); } catch (e) {} },
  autosave() { if (this.party.length) this.save(true); },
  // squad harness: 3 slots to start, +1 for each of the two field quests
  cap() { return 3 + (this.flags.harness1 ? 1 : 0) + (this.flags.harness2 ? 1 : 0); },
};

// ---------------------------------------------------------------- scaling
// The canvas fills the whole window, edge to edge, with no bars: on a 16:9 screen the picture is stretched a little wider than the
// game's 3:2 frame, which is what a GBA upscaler does too. Pixels stay crisp through image-rendering: pixelated.
function fit() {
  // Fill the window edge to edge, but only stretch the picture so far: past a fifth out of shape
  // (a phone held upright, say) bars are kinder than a squashed world. 16:9 and 16:10 still fill.
  const w = window.innerWidth, h = window.innerHeight, want = W / H, MAX = 1.2, have = w / h;
  let cw = w, ch = h;
  if (have > want * MAX) cw = Math.round(h * want * MAX);
  else if (have < want / MAX) ch = Math.round(w * MAX / want);
  cv.style.width = cw + "px"; cv.style.height = ch + "px";
}
addEventListener("resize", fit); fit();
// F11 / F toggles fullscreen: through the app window when running as a desktop app, otherwise through the browser
async function toggleFullscreen() {
  try {
    const T = window.__TAURI__ && window.__TAURI__.window;
    if (T) { const w = T.getCurrentWindow(); await w.setFullscreen(!(await w.isFullscreen())); return; }
    if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen();
  } catch (e) {}
}
addEventListener("keydown", e => { if (e.key === "F11" || (e.key === "f" && !e.repeat && Game.scene !== "name")) { e.preventDefault(); toggleFullscreen(); } });
if (matchMedia("(pointer: coarse)").matches) document.getElementById("touch").hidden = false;

// ---------------------------------------------------------------- input
let pressed = new Set();
const KEYMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right",
                 W: "up", S: "down", A: "left", D: "right", z: "a", Z: "a", " ": "a", x: "b", X: "b", Backspace: "b", Escape: "b", Shift: "b", Enter: "start" };
function press(k) { pressed.add(k); Game.held.add(k); Sound.init(); }
addEventListener("keydown", e => { const k = KEYMAP[e.key]; if (!k) return; e.preventDefault(); if (!e.repeat) press(k); else Game.held.add(k); });
addEventListener("keyup", e => { const k = KEYMAP[e.key]; if (k) Game.held.delete(k); });
addEventListener("blur", () => Game.held.clear());
document.querySelectorAll("[data-key]").forEach(b => {
  b.addEventListener("pointerdown", e => { e.preventDefault(); press(b.dataset.key); b.setPointerCapture?.(e.pointerId); });
  const up = () => Game.held.delete(b.dataset.key);
  b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
});
let tapNext = null;
cv.addEventListener("pointerdown", e => { const r = cv.getBoundingClientRect(); tapNext = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; press("a"); });
for (const ev of ["pointerup", "pointercancel", "pointerleave"]) cv.addEventListener(ev, () => Game.held.delete("a"));

// ---------------------------------------------------------------- script runtime
const waiters = [];
const nextFrame = () => new Promise(r => waiters.push(r));
async function wait(n) { for (let i = 0; i < n; i++) await nextFrame(); }
async function waitKey() { await nextFrame(); while (!Game.keys.has("a") && !Game.keys.has("b") && !Game.keys.has("start")) await nextFrame(); }

const TB = {
  pages: [], page: 0, chars: 0, open: false, waiting: false, options: null, ocur: 0, preview: null,
  set(text) { const lines = wrapText(text, 214); this.pages = []; for (let i = 0; i < lines.length; i += 2) this.pages.push(lines.slice(i, i + 2)); this.page = 0; this.chars = 0; this.open = true; this.waiting = true; },
  close() { this.open = false; this.pages = []; this.options = null; this.preview = null; },
  drawLines(ctx, x, y, ink, shadow, t) {
    const pg = this.pages[this.page]; if (!pg) return;
    let left = Math.floor(this.chars);
    pg.forEach((ln, i) => { drawText(ctx, ln.slice(0, Math.max(0, left)), x, y + i * 16, ink, shadow); left -= ln.length; });
    if (this.waiting && this.chars >= pg.join("").length && Math.floor(t / 280) % 2) {
      R(ctx, "#e05050", 224, 147, 7, 1); R(ctx, "#e05050", 225, 148, 5, 1); R(ctx, "#e05050", 226, 149, 3, 1); R(ctx, "#e05050", 227, 150, 1, 1);
    }
  },
};
// Voice: every story line has a recorded clip, keyed by a hash of its text (the player's name is spoken as "soldier").
function voiceKey(text) {
  const n = Game.player && Game.player.name, t = n && n.length > 1 ? text.replace(new RegExp("\\b" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), "{N}") : text;
  let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
async function say(text) {
  const vk = typeof VOICED !== "undefined" && voiceKey(text);
  if (vk && VOICED.has(vk)) Sound.speak("d_" + vk); else Sound.hush();
  TB.set(text);
  for (TB.page = 0; TB.page < TB.pages.length; TB.page++) {
    TB.chars = 0; TB.waiting = true;
    const total = TB.pages[TB.page].join("").length;
    await nextFrame();
    while (true) {
      if (TB.chars < total) { TB.chars = Math.min(total, TB.chars + (Game.held.has("a") || Game.held.has("b") ? 3.4 : [0.9, 1.4, 2.6][Game.opts.text])); if (Game.ticks % 3 === 0 && !Sound.speaking) Sound.fx("blip"); }
      if ((Game.keys.has("a") || Game.keys.has("b")) && TB.chars >= total) break;
      await nextFrame();
    }
    TB.waiting = false;
  }
  TB.page = TB.pages.length - 1;
}
async function choose(opts, extra = {}) {
  TB.options = opts; TB.ocur = 0; TB.preview = extra.preview || null;
  await nextFrame();
  while (true) {
    TB.ocur = listMove(TB.ocur, Game.keys, opts.length);
    if (Game.keys.has("a")) { Sound.fx("select"); break; }
    await nextFrame();
  }
  const i = TB.ocur; TB.options = null; TB.preview = null; return i;
}
async function fadeOut(n = 16) { for (let i = 1; i <= n; i++) { Game.fade = i / n; await nextFrame(); } }
async function fadeIn(n = 16) { for (let i = n - 1; i >= 0; i--) { Game.fade = i / n; await nextFrame(); } }

function drawWorldTextBox(ctx, t) {
  if (TB.preview && TB.options) {
    const id = TB.preview[TB.ocur];
    frameBox(ctx, 66, 8, 108, 96);
    R(ctx, "#201c28", 69, 11, 102, 90);
    ctx.drawImage(MON_ART[id].front, 88, 14, 64, 64);
    R(ctx, TYPE_COLOR[SPECIES[id].type], 90, 84, 60, 12); drawText(ctx, SPECIES[id].type, 120 - textWidth(SPECIES[id].type) / 2, 86, "#f8f8f8", null);
  }
  if (TB.options) {
    const w = Math.max(...TB.options.map(o => textWidth(o))) + 26, h = 10 + TB.options.length * 14, x = 240 - w - 2, y = 110 - h;
    frameBox(ctx, x, y, w, h);
    TB.options.forEach((o, i) => { drawText(ctx, o, x + 16, y + 7 + i * 14); if (i === TB.ocur) cursor(ctx, x + 8, y + 7 + i * 14); });
  }
  if (TB.open && TB.pages.length) { frameBox(ctx, 0, 112, 240, 48); TB.drawLines(ctx, 12, 121, INK, INK_SH, t); }
}

// ---------------------------------------------------------------- battles from the world
async function startBattle(cfg) {
  Sound.fx("encounter"); Sound.play(cfg.music || "battle");
  for (let i = 0; i < 3; i++) { Game.wipe = -1; await wait(5); Game.wipe = 0; await wait(5); }
  for (let i = 1; i <= 24; i++) { Game.wipe = i / 24; await nextFrame(); }
  TB.close(); Game.scene = "battle"; Game.wipe = 0;
  const res = await Battle.start(cfg);
  if (!cfg.trainer && (res === "win" || res === "caught") && Game.flags.hunt === 1) Game.flags.huntN = (Game.flags.huntN || 0) + 1;
  await fadeOut(20);
  Game.scene = "world"; TB.close();
  for (const m of Game.party) { m.shown = m.hp; }
  if (res === "lose") {
    for (const m of Game.party) { m.hp = m.maxhp; m.status = null; for (const mv of m.moves) mv.pp = MOVES[mv.name].pp; }
    World.load(Game.checkpoint.map, Game.checkpoint.x, Game.checkpoint.y, "down");
  } else Sound.play(World.map.music);
  Game.autosave();
  await fadeIn(20);
  if (res === "lose") await say("Your squad was carried back and patched up. Regroup and try again.");
  return res;
}

// ---------------------------------------------------------------- title screen
function bigText(ctx, s, cx, y, scale, ink, shadow) {
  const w = textWidth(s) + 2, tmp = mk(w, 12, x => drawText(x, s, 0, 0, ink, shadow));
  ctx.drawImage(tmp, Math.round(cx - (w * scale) / 2), y, w * scale, 12 * scale);
}
const EMBERS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 61) % W, y: (i * 37) % H, s: 0.2 + (i % 5) * 0.1 }));
function drawTitle(ctx, t, menu, cur, bare) {
  for (let y = 0; y < H; y++) R(ctx, lerpCol("#08040a", "#3a0c10", y / H), 0, y, W, 1);
  hills(ctx, 128, "#1a0608", 0.03, t / 1000, 12); hills(ctx, 142, "#0c0304", 0.05, t / 1000, 8);
  R(ctx, "#140508", 108, 70, 24, 70); R(ctx, "#140508", 116, 52, 8, 20); R(ctx, "#140508", 98, 92, 10, 48); R(ctx, "#140508", 132, 88, 12, 52);
  R(ctx, "#e03030", 119, 82, 2, 2);
  for (const e of EMBERS) { e.y -= e.s; if (e.y < 0) { e.y = H; } R(ctx, e.s > 0.4 ? "#f8a050" : "#c04020", Math.round(e.x + Math.sin(t / 700 + e.x) * 3), Math.round(e.y), 1, 1); }
  if (bare) return;
  bigText(ctx, "POKEMON?", 120, 18, 3, "#f0d080", "#802010");
  bigText(ctx, "SLAY THE LORD", 120, 58, 1, "#e8e0d0", "#401010");
  if (!menu) { if (Math.floor(t / 500) % 2) bigText(ctx, Sound.ready ? "PRESS A" : "PRESS A / TAP TO START", 120, 132, 1, "#f8f8f8", "#401010"); return; }
  menu.forEach((o, i) => { const y = 112 + i * 14; drawText(ctx, o, 102, y, "#f8f8f8", "#401010"); if (i === cur) cursor(ctx, 92, y, "#f0d080"); });
}
async function titleScene() {
  Game.scene = "title"; World.map = null;
  Game.drawOverride = (ctx, t) => drawTitle(ctx, t, null);
  await fadeIn(30);
  while (!Game.keys.has("a") && !Game.keys.has("start")) await nextFrame();
  Sound.init(); Sound.play("title"); Sound.fx("select");
  Sound.preload(["intro1", "intro2", "intro3", "intro4", "intro5", "intro6", "intro7", "intro8"]);
  const slots = Game.slots();
  const menu = slots.some(Boolean) ? ["CONTINUE", "NEW GAME"] : ["NEW GAME"];
  let cur = 0;
  Game.drawOverride = (ctx, t) => drawTitle(ctx, t, menu, cur);
  await nextFrame();
  while (true) {
    cur = listMove(cur, Game.keys, menu.length);
    if (Game.tap) { const i = Math.floor((Game.tap.y - 109) / 14); if (i >= 0 && i < menu.length) cur = i; }
    if (Game.keys.has("a") || Game.keys.has("start")) { Sound.fx("select"); break; }
    await nextFrame();
  }
  const fresh = menu[cur] === "NEW GAME";
  const pick = await slotScreen(slots, fresh ? "new" : "load");
  if (pick < 0) return titleScene();
  await fadeOut(30);
  Game.drawOverride = null;
  Game.slot = pick;
  if (!fresh) {
    const save = slots[pick];
    Object.assign(Game, { party: save.party, vault: migrateParty(save.vault || []), bag: { kit: 3, rig: 0, ...(save.bag || {}) }, flags: save.flags || {}, playtime: save.playtime || 0,
                          checkpoint: save.cp && MAPS[save.cp.map] ? save.cp : { map: "camp", x: 6, y: 12 } });
    Game.player = { name: "KAI", ...(save.player || {}) }; Game.player.look = { ...DEFAULT_LOOK, ...(Game.player.look || {}) };
    if (!MAPS[save.map] || !MAPS[save.map].m[save.y] || SOLID.has(MAPS[save.map].m[save.y][save.x])) Object.assign(save, { map: Game.checkpoint.map, x: Game.checkpoint.x, y: Game.checkpoint.y, dir: "down" });
    buildAllChars(Game.player.look);
    Game.party = migrateParty(Game.party);
    for (const m of Game.party) m.shown = m.hp;
    Game.riding = false;
  for (const id of Object.keys(MAPS)) for (const n of MAPS[id].npcs) n.gone = !!(n.bossFlag && Game.flags[n.bossFlag]);
    startWorld(save.map, save.x, save.y, save.dir);
    await fadeIn(30);
    Game.flash(World.map.name);
  } else {
    Game.deleteSlot(pick);
    Object.assign(Game, { party: [], vault: [], bag: { kit: 3, rig: 0 }, flags: {}, checkpoint: { map: "camp", x: 6, y: 12 }, playtime: 0,
                          player: { name: "KAI", look: { ...DEFAULT_LOOK } } });
    for (const id of Object.keys(MAPS)) for (const n of MAPS[id].npcs) n.gone = false;
    await introScene();
    await customizeScene();
    startWorld("camp", 11, 10, "up");
    Game.autosave();
    await fadeIn(40);
    Game.flash(World.map.name);
    await World.run(async () => {
      await say("Allied Front base camp. Night, three days before the push west.");
      await say(`${Game.player.name}, report to Commander Voss at the command post, north-west of here.`);
    });
  }
}

// Saves from before the new roster carry old species and moves: map them onto the new mons.
function migrateParty(party) {
  const map = { lumarch: "lumkit", calmforge: "mossfawn", echoframe: "echit" };
  return (party || []).map(m => {
    const id = SPECIES[m.id] ? m.id : map[m.id] || "scrapling";
    if (id === m.id && Array.isArray(m.moves) && m.moves.length && m.moves.every(x => MOVES[x.name])) return m;
    const fresh = makeMon(id, Math.min(MAX_LEVEL, m.level || 5));
    fresh.exp = m.exp || 0; fresh.hp = Math.max(1, Math.round(fresh.maxhp * (m.hp / (m.maxhp || 1))));
    return fresh;
  });
}
// Save-slot picker. mode "load" picks a filled slot, "new" picks any slot (asks before overwriting).
const fmtTime = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ":" + String(m).padStart(2, "0"); };
async function slotScreen(slots, mode) {
  const minis = slots.map(sv => sv && sv.player ? buildChar({ ...DEFAULT_LOOK, ...sv.player.look }).down.idle[0] : null);
  const icons = slots.map(sv => sv ? migrateParty(sv.party).slice(0, 4).map(m => MON_ART[m.id]).filter(Boolean) : []);
  let cur = mode === "load" ? Math.max(0, slots.findIndex(Boolean)) : Math.max(0, slots.findIndex(x => !x)), confirm = false;
  const draw = (c, t) => {
    drawTitle(c, t, null, 0, true);
    c.fillStyle = "rgba(6,4,8,.72)"; c.fillRect(0, 0, W, H);
    bigText(c, mode === "load" ? "CONTINUE YOUR CAMPAIGN" : "BEGIN A NEW CAMPAIGN", 120, 5, 1, "#e8c870", "#401010");
    slots.forEach((sv, i) => {
      const y = 20 + i * 44, on = i === cur;
      frameBox(c, 14, y, 212, 40, on);
      if (!sv) { drawText(c, `SLOT ${i + 1}  -  EMPTY`, 34, y + 16, mode === "load" ? "#6a6070" : INK); }
      else {
        if (minis[i]) c.drawImage(minis[i], 8, 12, 32, 34, 18, y + 3, 32, 34);
        drawText(c, `${i + 1}. ${sv.player ? sv.player.name : "SOLDIER"}`, 54, y + 6, "#e8c870");
        drawText(c, sv.place || "", 54, y + 21, INK);
        drawText(c, fmtTime(sv.playtime || 0), 222 - textWidth(fmtTime(sv.playtime || 0)), y + 6, INK);
        icons[i].forEach((art, k) => c.drawImage(art.front, 150 + k * 18, y + 19, 16, 16));
      }
      if (on) cursor(c, 6, y + 16, "#e8c870");
    });
    drawText(c, "A: SELECT   B: BACK   START: DELETE", 30, 152, "#8a8090", null);
    slots.forEach((sv, i) => { if (sv) { const y = 20 + i * 44; R(c, "#0e0a1c", 199, y + 25, 23, 11); R(c, "#7a1a22", 200, y + 26, 21, 9); drawText(c, "DEL", 202, y + 27, "#f8f8f8", null); } });
  };
  Game.drawOverride = (c, t) => { draw(c, t); drawWorldTextBox(c, t); };
  await nextFrame();
  while (true) {
    cur = listMove(cur, Game.keys, 3);
    let del = Game.keys.has("start");
    if (Game.tap && !TB.open) { const i = Math.floor((Game.tap.y - 20) / 44); if (i >= 0 && i < 3 && Game.tap.y < 20 + i * 44 + 40) { cur = i; if (slots[i] && Game.tap.x >= 197 && Game.tap.y >= 20 + i * 44 + 23) { del = true; Game.keys.delete("a"); } } else if (Game.tap.y >= 148) Game.keys.add("b"); }
    if (del && slots[cur]) {                         // delete a save, after confirming
      Sound.fx("select");
      await say(`Delete ${slots[cur].player ? slots[cur].player.name : "this soldier"}'s campaign in slot ${cur + 1}? This cannot be undone.`);
      const yes = await choose(["KEEP", "DELETE"]); TB.close();
      if (yes === 1) { Game.deleteSlot(cur); slots[cur] = null; minis[cur] = null; icons[cur] = []; Sound.fx("faint");
        if (mode === "load" && !slots.some(Boolean)) { Game.drawOverride = null; return -1; } }
      await nextFrame(); continue;
    }
    if (Game.keys.has("b")) { Sound.fx("blip"); Game.drawOverride = null; return -1; }
    if (Game.keys.has("a")) {
      if (mode === "load" && !slots[cur]) { Sound.fx("bump"); }
      else if (mode === "new" && slots[cur]) {
        Sound.fx("select");
        await say(`Slot ${cur + 1} holds ${slots[cur].player ? slots[cur].player.name : "a soldier"}'s campaign. Overwrite it?`);
        const yes = await choose(["NO", "OVERWRITE"]); TB.close();
        if (yes === 1) return cur;
      } else { Sound.fx("select"); return cur; }
    }
    await nextFrame();
  }
}
function startWorld(id, x, y, dir) { Game.scene = "world"; MAPS.camp = MAPS.camp; World.load(id, x, y, dir); }

// ---------------------------------------------------------------- intro cinematic
async function introScene() {
  Game.scene = "intro"; Sound.play("intro"); Game.fade = 0;
  let skip = false, line = "", alpha = 0, sceneT = 0, scene = INTRO_SCENES[0], textA = 0;
  Game.drawOverride = (ctx, t) => {
    scene.draw(ctx, sceneT);
    ctx.fillStyle = `rgba(0,0,0,${1 - alpha})`; ctx.fillRect(0, 0, W, H);
    if (line && textA > 0) {
      const lines = wrapText(line, 220);
      const y0 = H - 8 - lines.length * 12;
      ctx.globalAlpha = textA;
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, y0 - 6, W, lines.length * 12 + 12);
      lines.forEach((l, i) => drawText(ctx, l, 120 - textWidth(l) / 2, y0 + i * 12, "#e8e0d0", "#201010"));
      ctx.globalAlpha = 1;
    }
    if (!skip) drawText(ctx, "B: SKIP", 196, 3, "#806860", null);
  };
  const tick = () => { sceneT += 1 / 60; if (Game.keys.has("b") || Game.keys.has("start")) skip = true; };
  for (let s = 0; s < INTRO_SCENES.length && !skip; s++) {
    scene = INTRO_SCENES[s]; sceneT = 0; line = scene.line; textA = 0;
    const last = s === INTRO_SCENES.length - 1;
    for (let i = 0; i < 50 && !skip; i++) { alpha = last ? 0 : i / 50; textA = i / 50; tick(); await nextFrame(); }
    if (skip) break;
    let done = false; Sound.narrate("intro" + (s + 1), scene.line).then(() => { done = true; });
    while (!done && !skip) { tick(); await nextFrame(); }
    for (let i = 0; i < 40 && !skip; i++) { tick(); await nextFrame(); }
    for (let i = 50; i >= 0 && !skip && !last; i--) { alpha = i / 50; textA = i / 50; tick(); await nextFrame(); }
  }
  Sound.hush();
  // title card
  line = ""; scene = { draw: (c) => { R(c, "#000000", 0, 0, W, H); } };
  Game.drawOverride = (c, t) => {
    R(c, "#000000", 0, 0, W, H);
    c.globalAlpha = alpha;
    bigText(c, "POKEMON?", 120, 46, 3, "#f0d080", "#802010");
    bigText(c, "SLAY THE LORD", 120, 90, 1, "#e8e0d0", "#401010");
    c.globalAlpha = 1;
  };
  Sound.fx("crit");
  for (let i = 0; i <= 40; i++) { alpha = i / 40; await nextFrame(); }
  await wait(skip ? 30 : 120);
  for (let i = 40; i >= 0; i--) { alpha = i / 40; await nextFrame(); }
  Game.drawOverride = null; Game.fade = 1;
}

// ---------------------------------------------------------------- character creation
function drawDossierBg(c, t, title = "ENLISTMENT RECORD") {
  for (let y = 0; y < H; y++) R(c, lerpCol("#141826", "#2a2030", y / H), 0, y, W, 1);
  // lamp-lit floor and a pool of light under the recruit
  R(c, "#1c1a24", 0, 128, W, 32);
  for (let x = 0; x < W; x += 16) R(c, "#242030", x, 128, 1, 32);
  const g = c.createRadialGradient(64, 112, 4, 64, 112, 70);
  const f = 0.92 + Math.sin(t / 180) * 0.04;
  g.addColorStop(0, `rgba(255,200,120,${0.38 * f})`); g.addColorStop(1, "rgba(255,200,120,0)");
  c.fillStyle = g; c.fillRect(0, 30, 140, 130);
  if (title) bigText(c, title, 120, 4, 1, "#f0d080", "#401010");
}
async function nameEntry(start) {
  const rows = ["ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ-"], extras = ["DEL", "OK"];
  let name = start, cx = 0, cy = 0;
  const draw = (c, t) => {
    drawDossierBg(c, t);
    frameBox(c, 40, 22, 160, 26);
    drawText(c, "NAME:", 50, 31);
    drawText(c, name, 88, 31, "#c03040");
    if (name.length < 8 && Math.floor(t / 300) % 2) R(c, "#c03040", 88 + textWidth(name) + 1, 39, 5, 1);
    frameBox(c, 30, 56, 180, 84);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { drawText(c, ch, 50 + x * 17, 66 + y * 16); if (cx === x && cy === y) cursor(c, 43 + x * 17, 66 + y * 16); }));
    extras.forEach((e, x) => { drawText(c, e, 70 + x * 70, 118); if (cy === 3 && cx === x) cursor(c, 62 + x * 70, 118); });
    drawText(c, "A: TYPE   B: DELETE   START: DONE", 34, 148, "#a8a0b8", null);
  };
  Game.drawOverride = draw; await nextFrame();
  while (true) {
    const k = Game.keys, maxX = cy === 3 ? 1 : 8;
    if (k.has("left")) { cx = (cx + maxX) % (maxX + 1); Sound.fx("blip"); }
    if (k.has("right")) { cx = (cx + 1) % (maxX + 1); Sound.fx("blip"); }
    if (k.has("up")) { cy = (cy + 3) % 4; if (cy === 3) cx = Math.min(cx, 1); Sound.fx("blip"); }
    if (k.has("down")) { cy = (cy + 1) % 4; if (cy === 3) cx = Math.min(cx >> 2, 1); Sound.fx("blip"); }
    if (k.has("b") && name.length) { name = name.slice(0, -1); Sound.fx("bump"); }
    if (k.has("start") && name.length) { Sound.fx("select"); break; }
    if (k.has("a")) {
      if (cy === 3 && cx === 1) { if (name.length) { Sound.fx("select"); break; } Sound.fx("bump"); }
      else if (cy === 3) { name = name.slice(0, -1); Sound.fx("bump"); }
      else if (name.length < 8) { name += rows[cy][cx]; Sound.fx("select"); if (name.length === 8) { cy = 3; cx = 1; } }
    }
    await nextFrame();
  }
  return name;
}
async function customizeScene(intro = "VOSS: Before you ship out, the clerk needs your record. Make it count. Hamon's people will learn that face.") {
  Game.scene = "custom"; Sound.play("camp");
  const look = { ...DEFAULT_LOOK, ...Game.player.look }; let name = Game.player.name;
  const keys = CHAR_KEYS, opts = ["NAME", ...keys.map(k => k.toUpperCase()), "CONFIRM"], last = opts.length - 1;
  let cur = 0, spr = buildChar(look), spin = 0;
  const DIRS4 = ["down", "right", "up", "left"];
  const draw = (c, t) => {
    drawDossierBg(c, t);
    // preview: turns every few seconds, cycling idle -> walk -> strike
    const phase = Math.floor(spin / 60) % 6, dir = DIRS4[Math.floor(spin / 360) % 4];
    const anim = phase < 2 ? "idle" : phase < 5 ? "walk" : "attack";
    const list = spr[dir][anim], fr = anim === "attack" ? list[Math.min(2, Math.floor((spin % 60) / 8))] : list[Math.floor(t / (anim === "walk" ? 140 : 520)) % list.length];
    c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(36, 138, 48, 5); c.fillRect(42, 137, 36, 7);
    c.drawImage(fr, 0, 0, 48, 48, -12, -2, 144, 144);
    drawText(c, "< TURN >", 40, 148, "#8a8090", null);
    frameBox(c, 112, 18, 124, 128);
    opts.forEach((o, i) => {
      const y = 24 + i * 14;
      drawText(c, o, 126, y, i === last ? "#e05050" : INK);
      if (i > 0 && i < last) {
        const key = keys[i - 1], val = lookName(key, look);
        R(c, "#0d0a10", 164, y + 1, 7, 7); R(c, charSwatch(key, lookIndex(key, look)), 165, y + 2, 5, 5);
        drawText(c, val, 228 - textWidth(val), y, "#a8b8e0");
      } else if (i === 0) drawText(c, name, 228 - textWidth(name), y, "#e8c870");
      if (i === cur) cursor(c, 117, y, "#e8c870");
    });
  };
  Game.drawOverride = (c, t) => { draw(c, t); drawWorldTextBox(c, t); }; Game.fade = 0;
  for (let i = 30; i >= 0; i--) { Game.fade = i / 30; spin++; await nextFrame(); }
  if (intro) { await say(intro); }
  TB.close();
  while (true) {
    spin++;
    const k = Game.keys;
    if (k.has("up")) { cur = (cur + last) % (last + 1); Sound.fx("blip"); }
    if (k.has("down")) { cur = (cur + 1) % (last + 1); Sound.fx("blip"); }
    if (cur > 0 && cur < last && (k.has("left") || k.has("right"))) {
      const key = keys[cur - 1];
      cycleLook(look, key, k.has("right") ? 1 : -1);
      spr = buildChar(look); Sound.fx("select");
    } else if (cur === 0 && (k.has("left") || k.has("right"))) spin = (Math.floor(spin / 360) + 1) * 360;
    if (k.has("a") || (k.has("start") && cur === last)) {
      if (cur === 0) { Sound.fx("select"); name = await nameEntry(name); Game.drawOverride = (c, t) => { draw(c, t); drawWorldTextBox(c, t); }; }
      else if (cur === last) {
        Sound.fx("select");
        await say(`${name}. Glaive, Allied Front irregulars. Is this record correct?`);
        const yes = await choose(["YES", "NO"]); TB.close();
        if (yes === 0) break;
      } else { cur = last; Sound.fx("blip"); }
    }
    await nextFrame();
  }
  Game.player = { name, look };
  buildAllChars(look);
  await fadeOut(30);
  Game.drawOverride = null; Game.fade = 1;
}

// ---------------------------------------------------------------- chapter cards and the ending
async function chapterCard(num, title, sub) {
  await fadeOut(30);
  Sound.play("victory");
  Game.drawOverride = (c, t) => {
    R(c, "#000000", 0, 0, W, H);
    bigText(c, `CHAPTER ${num} COMPLETE`, 120, 22, 2, "#f0d080", "#802010");
    bigText(c, title, 120, 52, 1, "#e8e0d0", "#401010");
    wrapText(sub, 200).forEach((l, i) => drawText(c, l, 120 - textWidth(l) / 2, 70 + i * 11, "#b8b0c0", null));
    drawText(c, "Squad:", 70, 98, "#c0b8b0", null);
    Game.party.forEach((m, i) => { c.drawImage(MON_ART[m.id].front, 62 + i * 30, 104, 32, 32); drawText(c, "Lv" + m.level, 68 + i * 30, 134, "#c0b8b0", null); });
    if (Math.floor(t / 500) % 2) drawText(c, "Press A", 100, 148, "#f8f8f8", null);
  };
  Game.fade = 0;
  await wait(50); await waitKey();
  await fadeOut(30);
  Game.drawOverride = null;
  Sound.play(World.map.music);
  await fadeIn();
}
async function endingScene() {
  await fadeOut(40);
  Sound.play("intro");
  const lines = ["The false sun gutters, and goes out.", "Great Lord Hamon, who never lost a battle, lies still upon his throne.",
                 "Across Ellyendor, the Warmons fall silent, one by one.", "The war is not over. But for the first time in a generation, it can be.", "The Lord is slain."];
  let shown = 0;
  Game.drawOverride = (c) => {
    R(c, "#000000", 0, 0, W, H);
    let yy = 18;
    lines.slice(0, shown).forEach(l => { for (const w of wrapText(l, 220)) { drawText(c, w, 120 - textWidth(w) / 2, yy, "#e8e0d0", "#201010"); yy += 13; } yy += 6; });
  };
  Game.scene = "ending"; Game.fade = 0;
  Sound.preload(["end1", "end2", "end3", "end4", "end5"]);
  for (shown = 1; shown <= lines.length; shown++) { await Sound.narrate("end" + shown, lines[shown - 1]); await wait(20); }
  await wait(60);
  Game.drawOverride = (c, t) => {
    R(c, "#000000", 0, 0, W, H);
    bigText(c, "THE LORD IS SLAIN", 120, 30, 2, "#f0d080", "#802010");
    bigText(c, "OPERATION COMPLETE", 120, 62, 1, "#e8e0d0", "#401010");
    drawText(c, `${Game.player.name}'s squad   ${fmtTime(Game.playtime)} in the field`, 120 - textWidth(`${Game.player.name}'s squad   ${fmtTime(Game.playtime)} in the field`) / 2, 84, "#c0b8b0", null);
    Game.party.forEach((m, i) => { c.drawImage(MON_ART[m.id].front, 62 + i * 30, 96, 32, 32); drawText(c, "Lv" + m.level, 68 + i * 30, 126, "#c0b8b0", null); });
    if (Math.floor(t / 500) % 2) drawText(c, "Thank you for playing.  Press A", 62, 146, "#f8f8f8", null);
  };
  Sound.play("victory");
  await wait(60); await waitKey();
  await fadeOut(40);
  Game.drawOverride = null;
  titleScene();
}

// The game always advances 60 steps per second, whatever the screen's refresh rate, and draws once per step:
// identical speed on 60 Hz, 120 Hz and on slow hardware that drops frames.
const STEP = 1000 / 60;
let lastT = 0, acc = 0;
function tick() {
  const ws = waiters.splice(0);                      // scripts that waited on the previous step wake after this one, so a key press is never seen twice
  Game.keys = pressed; pressed = new Set(); Game.tap = tapNext; tapNext = null; Game.ticks++;
  if (Game.scene === "world" || Game.scene === "battle") Game.playtime += 1 / 60;
  if (Game.scene === "world" && World.map) World.update();
  else if (Game.scene === "battle" && Battle.active && Battle.mode !== "script") Battle.update();
  ws.forEach(r => r());
}
function render(t) {
  ctx.imageSmoothingEnabled = false;
  try {
  if (Game.drawOverride) Game.drawOverride(ctx, t);
  else if (Game.scene === "battle") Battle.draw(ctx, t);
  else if (Game.scene === "world" && World.map) { World.draw(ctx, t); drawWorldTextBox(ctx, t); }
  else R(ctx, "#000000", 0, 0, W, H);
  if (Game.banner && Game.scene === "world" && !Game.drawOverride) {
    const b = Game.banner, y = b.t > 130 ? -24 + (150 - b.t) * 1.4 : b.t < 20 ? 4 - (20 - b.t) * 1.4 : 4;
    frameBox(ctx, 4, Math.round(y), textWidth(b.name) + 24, 22); drawText(ctx, b.name, 16, Math.round(y) + 7, "#e8c870");
    if (--b.t <= 0) Game.banner = null;
  }
  if (Game.saveIcon > 0 && Game.scene === "world") {   // small spinning sigil while autosaving
    Game.saveIcon--; const a = Game.ticks / 6;
    for (let i = 0; i < 4; i++) R(ctx, i === Math.floor(a) % 4 ? "#e8c870" : "#6a5030", 226 + [0, 4, 4, 0][i], 146 + [0, 0, 4, 4][i], 3, 3);
    drawText(ctx, "SAVING", 190, 145, "#c8b8a0", "#0a080c");
  }
  if (Game.wipe === -1) { R(ctx, "#f8f8f8", 0, 0, W, H); }
  else if (Game.wipe > 0) { for (let y = 0; y < H; y += 16) { const w = Math.round(W * Game.wipe); R(ctx, "#000", (y / 16) % 2 ? W - w : 0, y, w, 16); } }
  if (Game.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Game.fade})`; ctx.fillRect(0, 0, W, H); }
  } catch (err) { if (!render.warned) { render.warned = true; console.error(err); } }
}
function frame(t) {
  requestAnimationFrame(frame);
  let dt = Math.min(100, t - (lastT || t)); lastT = t;
  if (Math.abs(dt - STEP) < 2.5) dt = STEP;            // an ordinary 60 Hz display gets exactly one step per frame, with no drift
  acc += dt; let n = 0;
  while (acc >= STEP - 0.01 && n < 4) { tick(); acc -= STEP; n++; }
  if (n === 4) acc = 0;
  if (n) render(t);
}

// ---------------------------------------------------------------- boot
// hand-finished sprite art overrides the procedural sprites for these species (64x64, feet on the bottom edge)
const SPRITE_FILES = ["antennelle", "beaconmoth", "bulwarch", "cairnhart", "dreadnought", "echit", "eclipsar", "fenrath", "glimmote", "gloamcrow", "gorehog", "haloclaw", "howlpup", "howlwing", "hummite", "ironclad", "lilyhop", "lotadpole", "lumkit", "monastag", "monolith", "mossfawn", "nightreaver", "nirvanoad", "noxdrone", "noxmech", "nyxvulpa", "ragefang", "ravengrave", "resonyx", "ruinboar", "scrapling", "shadeling", "shroudcrow", "siegeclad", "snarlwolf", "solarchon", "solmane", "sonarix", "sovereign", "stillhorn", "thrumantis", "tuskit", "umbrafox", "voidreaver", "westwarden", "wickwing"];
function loadSpriteFiles(done) {
  let left = SPRITE_FILES.length * 2; const out = {};
  const fin = () => { if (--left === 0) done(out); };
  for (const id of SPRITE_FILES) for (const side of ["front", "back"]) {
    const im = new Image(); im.onload = () => { (out[id] = out[id] || {})[side] = im; fin(); }; im.onerror = fin; im.src = `sprites/${id}_${side}.png`;
  }
}
MON_IMG.onload = () => loadSpriteFiles(files => {
  buildMonSprites(MON_ART);
  for (const id in files) if (files[id].front && files[id].back) MON_ART[id] = { front: files[id].front, back: files[id].back };
  buildBattleBgs(); buildAllChars(Game.player.look);
  Game.fade = 1;
  requestAnimationFrame(frame);
  titleScene();
});
MON_IMG.src = MON_SRC;
