// Maps, NPCs, soldiers, events and the overworld.
const ACTOR_LAYER = document.createElement("canvas"); ACTOR_LAYER.width = 240; ACTOR_LAYER.height = 160;
const OCC = (() => { const c = document.createElement("canvas"); c.width = c.height = 48; return { c, ctx: c.getContext("2d", { willReadFrequently: true }) }; })();
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: "down", down: "up", left: "right", right: "left" };
const SOLID = new Set(["T", "Q", "B", "D", "F", "S", "C", "W", "X", "K", "R", "d", "w", "M", "k", "r", "s", "Y", "I", "A", "G", "U"]);

function blankMap(w, h, fill) { return Array.from({ length: h }, () => Array(w).fill(fill)); }
function rect(m, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y] && x >= 0 && x < m[0].length) m[y][x] = c; }

// ---------------------------------------------------------------- base camp
function buildCamp() {
  const m = blankMap(24, 18, ".");
  for (let y = 0; y < 18; y++) for (let x = 0; x < 24; x++) if (y < 2 || y > 15 || x < 2 || x > 21) m[y][x] = "T";
  rect(m, 11, 3, 12, 13, ","); rect(m, 0, 12, 20, 13, ",");
  rect(m, 2, 2, 21, 2, "F"); rect(m, 9, 2, 14, 2, "S");
  rect(m, 15, 14, 20, 15, "W"); m[14][15] = "."; m[15][20] = ".";
  for (const [x, y] of [[17, 9], [18, 9], [19, 9], [17, 10], [18, 10]]) m[y][x] = "C";
  rect(m, 2, 14, 3, 15, "Q");
  for (const [x, y] of [[14, 9], [15, 9], [14, 10], [15, 10], [15, 11], [9, 15], [10, 15], [11, 15], [12, 15]]) m[y][x] = ";";
  for (const [x, y] of [[3, 11], [8, 4], [9, 5], [20, 11], [6, 14], [13, 14], [21, 8]]) m[y][x] = "f";
  const tents = [
    { x: 3, y: 3, w: 4, h: 4, kind: "hall", style: "hq", doorX: 35, door: null, open: true, windows: [10, 53], clutter: [["crate", 1], ["barrel", 54]] },
    { x: 17, y: 3, w: 4, h: 4, kind: "hall", style: "barracks", doorX: 35, door: null, open: true, windows: [10, 53], clutter: [["barrel", 1], ["crate", 52]] },
    { x: 3, y: 9, w: 4, h: 3, kind: "hall", style: "infirmary", doorX: 35, door: null, open: true, windows: [10, 53], clutter: [["bucket", 2], ["stretcher", 44]] }];
  return {
    id: "camp", name: "ALLIED BASE CAMP", music: "camp", m, tents, bg: "field", mood: "day", tree: "round",
    grass: [{ x0: 14, y0: 9, x1: 15, y1: 11, lv: [2, 4], mons: ["glimmote", "howlpup", "antennelle"] }, { x0: 9, y0: 15, x1: 12, y1: 15, lv: [2, 4], mons: ["lotadpole", "glimmote", "antennelle", "lilyhop"] }],
    props: [{ kind: "fire", x: 8, y: 14 }, { kind: "lamp", x: 10, y: 8 }, { kind: "lamp", x: 13, y: 8 }, { kind: "lamp", x: 19, y: 11 }, { kind: "lamp", x: 2, y: 11 },
            { kind: "lamp", x: 13, y: 11 }, { kind: "sign", x: 9, y: 11, text: "ALLIED FRONT BASE CAMP. West road: the Western Front." }],
    npcs: [
      { id: "voss", x: 7, y: 6, dir: "down", look: "commander", talk: "voss" },
      { id: "quarter", x: 16, y: 8, dir: "left", look: "quarter", talk: "quarter" },
      { id: "scout", x: 12, y: 3, dir: "down", look: "scout", lines: ["SCOUT: The north road is mined end to end.", "SCOUT: Our way in is west, through the front lines."] },
      { id: "oda", x: 4, y: 12, dir: "right", look: "rookie", talk: "oda" },
    ],
    warps: [{ x: -1, y: 12, to: "front", tx: 55, ty: 10, dir: "left" }, { x: -1, y: 13, to: "front", tx: 55, ty: 11, dir: "left" },
            { x: 5, y: 11, to: "infirmary", tx: 7, ty: 8, dir: "up" },
            { x: 5, y: 6, to: "hq", tx: 7, ty: 8, dir: "up" }, { x: 19, y: 6, to: "barracks", tx: 7, ty: 8, dir: "up" }],
    heal: { x: 6, y: 12 },
  };
}

// ---------------------------------------------------------------- the western front
function buildFront() {
  const m = blankMap(56, 22, ".");
  rect(m, 38, 2, 55, 19, "b");
  m[10][30] = "U";                                   // soul station beside the outpost medic
  rect(m, 0, 0, 55, 1, "T"); rect(m, 0, 20, 55, 21, "T"); rect(m, 54, 0, 55, 21, "T");
  rect(m, 46, 3, 52, 8, ";"); rect(m, 25, 14, 33, 18, ";"); rect(m, 39, 13, 42, 17, ";");
  rect(m, 36, 2, 37, 19, "W");
  rect(m, 44, 10, 55, 11, ","); rect(m, 44, 5, 45, 11, ","); rect(m, 22, 5, 45, 6, ","); rect(m, 36, 5, 37, 6, "H");
  rect(m, 22, 5, 23, 14, ","); rect(m, 9, 10, 20, 17, "p"); rect(m, 9, 13, 23, 14, ",");
  rect(m, 9, 10, 20, 17, "p");
  rect(m, 0, 2, 8, 19, "K");
  for (const [x, y] of [[49, 14], [52, 16], [41, 9]]) m[y][x] = "c";
  for (const [x, y] of [[47, 13], [48, 13], [53, 13], [40, 2], [41, 2], [12, 3], [18, 19]]) m[y][x] = "R";
  for (const [x, y] of [[50, 17], [42, 18], [39, 8], [30, 3], [17, 4]]) m[y][x] = "d";
  rect(m, 46, 15, 53, 15, "w"); rect(m, 9, 9, 20, 9, "w"); m[9][14] = "p"; m[9][15] = "p";
  for (const [x, y] of [[27, 12], [31, 11], [24, 3], [33, 4]]) m[y][x] = "f";
  const tents = [{ x: 26, y: 8, w: 3, h: 3, kind: "tent", side: "allied", door: [27, 11], clutter: [["crate", 0], ["barrel", 39]], text: "Outpost 7. Radio static, cold coffee and a map with too many red pins." },
                 { x: 12, y: 5, w: 3, h: 3, kind: "tent", side: "dominion", door: [13, 8], clutter: [["crate", 37]], text: "A Dominion supply tent. Crates stamped with Hamon's seal. Something inside is still ticking." }];
  return {
    id: "front", name: "THE WESTERN FRONT", music: "route", m, tents, bg: "front", mood: "day", tree: "pine", seed: 23,
    props: [{ kind: "fire", x: 49, y: 14 }, { kind: "fire", x: 52, y: 16 }, { kind: "fire", x: 41, y: 9 }, { kind: "lamp", x: 30, y: 7 }, { kind: "lamp", x: 21, y: 7 },
            { kind: "brazier", x: 9, y: 11 }, { kind: "brazier", x: 9, y: 16 }, { kind: "brazier", x: 16, y: 9 }, { kind: "sign", x: 24, y: 4, text: "ALLIED OUTPOST 7. Medic on duty. Supplies by the tent." },
            { kind: "sign", x: 50, y: 9, text: "DANGER: Wild mons and rogue Warmons in the scorched fields." },
            { kind: "gate", x: 7, y: 13 }, { kind: "banner", x: 8, y: 11 }, { kind: "banner", x: 8, y: 16 }],
    npcs: [
      { id: "rask", x: 47, y: 9, dir: "down", look: "grunt", trainer: "rask", sight: 3 },
      { id: "vel", x: 39, y: 4, dir: "down", look: "grunt", trainer: "vel", sight: 3 },
      { id: "kord", x: 21, y: 9, dir: "right", look: "officer", trainer: "kord", sight: 4 },
      { id: "medic2", x: 29, y: 11, dir: "down", look: "medic", talk: "heal" },
      { id: "quarter2", x: 25, y: 11, dir: "down", look: "quarter", talk: "quarter2" },
      { id: "tracker", x: 53, y: 12, dir: "up", look: "scout", talk: "hunt" },          // quest 1: the scorched fields
      { id: "engineer", x: 32, y: 12, dir: "left", look: "rookie", talk: "rewire" },     // quest 2: the runesmith at Outpost 7
      { id: "general", x: 10, y: 13, dir: "right", look: "general", talk: "general", bossFlag: "beat_general" },
    ],
    warps: [{ x: 56, y: 10, to: "camp", tx: 0, ty: 12, dir: "right" }, { x: 56, y: 11, to: "camp", tx: 0, ty: 13, dir: "right" },
            { x: 8, y: 13, to: "hollow", tx: 54, ty: 12, dir: "left", when: () => Game.flags.beat_general }, { x: 8, y: 14, to: "hollow", tx: 54, ty: 13, dir: "left", when: () => Game.flags.beat_general }],
    boss: { npc: "general", flag: "beat_general", trainer: "general", bg: "fortress", zone: p => p.x <= 18 && p.y >= 10 && p.y <= 17,
            intro: ["VARROW: So. The Allied Front sends children with borrowed souls.", "VARROW: I have held the West for eleven years. Lord Hamon gave me this land, and I gave him its ashes.", "VARROW: Come, then. Let me show you what a real Warmon is."],
            after: ["VARROW: Impossible... the West... has never... fallen...", "Varrow collapses. A sealed order slips from his coat.", "\"...the Great Lord awaits in the eastern citadel. Hold the West at any cost.\""],
            chapter: [1, "THE GENERAL OF THE WEST HAS FALLEN", "The fortress gate stands open. Beyond it: the Hollow Wood."] },
    grass: [{ x0: 46, y0: 3, x1: 52, y1: 8, lv: [3, 6], mons: ["howlpup", "glimmote", "scrapling", "antennelle", "shadeling"] },
            { x0: 39, y0: 13, x1: 42, y1: 17, lv: [5, 8], mons: ["gloamcrow", "noxdrone", "tuskit", "shadeling"] },
            { x0: 25, y0: 14, x1: 33, y1: 18, lv: [7, 10], mons: ["lotadpole", "tuskit", "howlpup", "antennelle", "glimmote"] }],
    heal: { x: 29, y: 12 },
  };
}

const MAPS = { camp: buildCamp(), front: buildFront(), infirmary: buildInfirmary(), hq: buildHQ(), barracks: buildBarracks() };

// ---------------------------------------------------------------- world state
const World = {
  map: null, player: { x: 11, y: 10, dir: "up", moving: false, t: 0, step: 0, speed: 1 }, busy: false, menu: null, mcur: 0, lcur: 0,
  bubble: null, swapFrom: -1, sqOpt: -1, page: 0,

  load(id, x, y, dir) {
    this.map = MAPS[id]; this.fx = []; if (this.map.interior) Game.riding = false;
    for (const n of this.map.npcs) Object.assign(n, { moving: n.moving || false, t: 0, step: 0, home: n.home || [n.x, n.y] });
    Object.assign(this.player, { x, y, dir: dir || this.player.dir, moving: false, t: 0 });
    Game.mapId = id;
    const key = Game.flags.beat_general ? "open" : "shut";
    if (!this.map.paint || this.map.paintKey !== key) { this.map.paint = paintMap(this.map); this.map.paintKey = key; }
    Sound.play(this.map.music);
  },
  tile(x, y) { const m = this.map.m; return y >= 0 && y < m.length && x >= 0 && x < m[0].length ? m[y][x] : "T"; },
  npcAt(x, y) { return this.map.npcs.find(n => !n.gone && n.x === x && n.y === y); },
  blocked(x, y) {
    if (this.map.warps.some(w => w.x === x && w.y === y && (!w.when || w.when()))) return false;
    if (SOLID.has(this.tile(x, y))) return true;
    if (this.map.tents.some(t => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h)) return true;
    if (this.map.props.some(p => ["sign", "fire", "lamp", "brazier"].includes(p.kind) && p.x === x && p.y === y)) return true;
    if (this.map.props.some(p => p.kind === "gate" && x >= p.x && x <= p.x + 1 && y >= p.y && y <= p.y + 1)) return true;
    return !!this.npcAt(x, y);
  },

  // ---------------------------------------------------------------- update
  update() {
    const p = this.player, k = Game.keys;
    for (const n of this.map.npcs) this.stepWalker(n);
    if (this.busy) return;
    if (this.menu) return this.updateMenu();
    if (p.moving) {
      if (!this.stepWalker(p)) return;
      if (this.onStep()) return;
    }
    if (k.has("start")) { Sound.fx("select"); this.menu = "main"; this.mcur = 0; return; }
    if (p.act && Game.ticks - p.act.t0 < 20) return;
    if (k.has("a")) { if (this.interact() === "none") { this.act(p, "attack"); Sound.fx("swing"); return; } if (this.busy) return; }
    for (const d of ["up", "down", "left", "right"]) {
      if (!Game.held.has(d)) continue;
      const turned = p.dir !== d; p.dir = d;
      const [dx, dy] = DIRS[d];
      if (!this.blocked(p.x + dx, p.y + dy)) { p.moving = true; p.t = 0; p.speed = Game.riding ? TS / 6 : (Game.held.has("b") !== !!Game.opts.autorun) ? 2 : 1; }
      else if (!turned && Game.ticks % 20 === 0) Sound.fx("bump");
      break;
    }
  },
  stepWalker(o) {
    if (!o.moving) return false;
    o.t += o.speed || 1; o.phase = (o.phase || 0) + (o.speed || 1); o.lastMove = Game.ticks;
    if (o === this.player && Game.riding && Game.ticks % 3 === 0) {
      const [mx, my] = DIRS[o.dir], wx = o.x * TS + mx * o.t + 8, wy = o.y * TS + my * o.t + 15;
      this.fx.push({ x: wx - mx * 6 + (Math.random() - 0.5) * 6, y: wy + (Math.random() - 0.5) * 2, vx: -mx * 0.5 + (Math.random() - 0.5) * 0.3, vy: -0.15 - Math.random() * 0.25, g: 0, life: 14, max: 14, col: Math.random() < 0.5 ? "#6af0e4" : "#c8fff8" });
    } else if (o === this.player && Math.round(o.t) % 8 === 0) {
      const [mx, my] = DIRS[o.dir], wx = o.x * TS + mx * o.t + 8, wy = o.y * TS + my * o.t + 14, tall = this.tile(Math.floor(wx / TS), Math.floor((wy - 2) / TS)) === ";";
      if (tall) for (let i = 0; i < 3; i++) this.fx.push({ x: wx + (Math.random() - 0.5) * 10, y: wy - 3, vx: (Math.random() - 0.5) * 0.7 - mx * 0.2, vy: -0.7 - Math.random() * 0.5, g: 0.07, life: 18, max: 18, col: ["#94d66c", "#52a64c", "#c8f088"][i], front: true });
      else if ((o.speed || 1) > 1 && !this.map.interior) for (let i = 0; i < 2; i++) this.fx.push({ x: wx - mx * 5 + (Math.random() - 0.5) * 5, y: wy + 1, vx: -mx * 0.35 + (Math.random() - 0.5) * 0.3, vy: -0.22 - Math.random() * 0.2, g: 0, life: 16, max: 16, col: "#e8d8b0", puff: true });
    }
    if (o.t < TS - 1e-6) return false;
    const [dx, dy] = DIRS[o.dir]; o.x += dx; o.y += dy; o.moving = false; o.t = 0; o.step ^= 1;
    return true;
  },
  async walkNpc(n, dir) { n.dir = dir; n.moving = true; n.t = 0; n.speed = 1; while (n.moving) await nextFrame(); },

  onStep() {
    const p = this.player;
    const w = this.map.warps.find(w => w.x === p.x && w.y === p.y && (!w.when || w.when()));
    if (w) { this.run(async () => { Sound.fx("door"); await fadeOut(); this.load(w.to, w.tx, w.ty, w.dir); Game.flash(this.map.name); Game.autosave(); await fadeIn(); }); return true; }
    if (this.map.id === "camp" && p.x <= 1 && !Game.flags.starter) {
      this.run(async () => { await say("ODA: Hold up! Commander Voss wants to see you before you head out."); await this.stepBack(); });
      return true;
    }
    for (const n of this.map.npcs) if (n.trainer && !Game.flags["beat_" + n.trainer] && this.sees(n)) { this.run(() => this.trainerEvent(n)); return true; }
    const B = this.map.boss;
    if (B && !Game.flags[B.flag] && B.zone(p)) { this.run(() => this.bossEvent(B)); return true; }
    if (this.tile(p.x, p.y) === ";") {
      const zones = this.map.grass || [];
      const zone = zones.find(z => p.x >= z.x0 && p.x <= z.x1 && p.y >= z.y0 && p.y <= z.y1)
        || zones.slice().sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - p.x, (a.y0 + a.y1) / 2 - p.y) - Math.hypot((b.x0 + b.x1) / 2 - p.x, (b.y0 + b.y1) / 2 - p.y))[0];
      if (zone && Game.party.length && Math.random() < 0.11) {
        const id = zone.mons[Math.floor(Math.random() * zone.mons.length)];
        const lv = zone.lv[0] + Math.floor(Math.random() * (zone.lv[1] - zone.lv[0] + 1));
        this.run(() => startBattle({ foes: [makeMon(id, lv)], bg: this.map.bg }));
        return true;
      }
    }
    return false;
  },
  async stepBack() { const p = this.player; p.dir = OPP[p.dir]; p.moving = true; p.t = 0; p.speed = 1; while (p.moving) { this.stepWalker(p); await nextFrame(); } },
  sees(n) {
    const p = this.player, [dx, dy] = DIRS[n.dir];
    for (let i = 1; i <= n.sight; i++) {
      const x = n.x + dx * i, y = n.y + dy * i;
      if (x === p.x && y === p.y) return true;
      if (SOLID.has(this.tile(x, y)) || this.npcAt(x, y)) return false;
    }
    return false;
  },

  async run(fn) { this.busy = true; try { await fn(); } finally { this.busy = false; TB.close(); } },

  interact() {
    const p = this.player, [dx, dy] = DIRS[p.dir], tx = p.x + dx, ty = p.y + dy;
    const n = this.npcAt(tx, ty);
    if (n) { n.dir = OPP[p.dir]; return this.run(() => this.talk(n)); }
    const prop = this.map.props.find(q => q.x === tx && q.y === ty);
    if (prop && prop.kind === "sign") return this.run(async () => { await say(prop.text); });
    if (prop && prop.kind === "fire") return this.run(async () => { await say(this.map.id === "camp" ? "The campfire crackles. Someone left a pot of coffee on." : "Wreckage from yesterday's shelling, still burning."); });
    if (prop && prop.kind === "lamp") return this.run(async () => { await say("An oil lamp. It hums faintly in the cold."); });
    if (prop && prop.kind === "brazier") return this.run(async () => { await say("A Dominion brazier. It reeks of machine oil."); });
    if (this.map.props.some(q => q.kind === "gate" && tx >= q.x && tx <= q.x + 1 && ty >= q.y && ty <= q.y + 1))
      return this.run(async () => { await say(Game.flags.beat_general ? "The fortress gate hangs open. Beyond it, the Hollow Wood. The road to Hamon begins here." : "A massive iron gate. It won't budge."); });
    const ahead = this.tile(tx, ty);
    if (ahead === "U") return this.run(async () => { Sound.fx("capture"); await this.vaultScreen(); });
    if (ahead === "D") {           // talk across a counter
      const behind = this.npcAt(tx + dx, ty + dy) || this.map.npcs.find(n => n.talk === "heal" && Math.abs(n.x - tx) <= 4 && Math.abs(n.y - ty) <= 2);
      if (behind) { behind.dir = behind.y < p.y ? "down" : OPP[p.dir]; return this.run(() => this.talk(behind)); }
      return this.run(async () => { await say(this.map.counterText || "Tinctures, poultices, a bone saw, and a ledger of names with too many lines struck through."); });
    }
    if (ahead === "B") return this.run(async () => { await say((this.map.bedText || ["A soldier from the ridge, wrapped to the chin. His breathing is the only sound he makes.", "An empty cot. The blanket is folded with care.", "She clutches a broken spearhead in her sleep."])[ty % 3]); });
    const tent = this.map.tents.find(t => t.door && t.door[0] === tx && t.door[1] === ty);
    if (tent) return this.run(async () => {
      const txt = tent.text || { house: tent.name === "hq" ? "Command post. Maps of all three Dominion fronts are pinned to the table." : "Barracks. Bedrolls, ration tins and someone's harmonica.", medic: "Field hospital. The medic out front can patch your squad up.",
                    barracks: "Barracks. Bedrolls, ration tins and someone's harmonica.", outpost: "Outpost 7. Radio static and cold coffee.",
                    dominion: "A Dominion supply tent. Crates stamped with Hamon's seal." }[tent.kind];
      await say(txt);
    });
    return "none";
  },

  async talk(n) {
    if (n.trainer) {
      const tr = TRAINERS[n.trainer];
      await say(Game.flags["beat_" + n.trainer] ? `${tr.name}: ${tr.lose}` : `${tr.name}: ${tr.intro}`);
      if (!Game.flags["beat_" + n.trainer]) await this.fight(n);
      return;
    }
    if (n.talk === "heal") {
      await say("MEDIC: Let me take a look at your squad.");
      for (const m of Game.party) { m.hp = m.maxhp; m.status = null; for (const mv of m.moves) mv.pp = MOVES[mv.name].pp; }
      Sound.fx("heal"); Game.checkpoint = { map: this.map.id, ...this.map.heal }; Game.autosave();
      await wait(40);
      await say("Your squad is patched up and ready to fight!");
      if (!Game.flags.sawStation && (Game.vault.length || Game.party.length > 1)) { Game.flags.sawStation = true; await say("MEDIC: The crystal on the pedestal there is a SOUL STATION. Links you set aside wait inside it, safe, until you call them back."); }
      return;
    }
    if (n.talk === "voss") return this.vossTalk();
    if (n.talk === "oda") return say(Game.flags.starter ? "ODA: The front is due west. Hold B to move at double time. Wild mons hide in the tall grass, even here in camp, so keep a Link handy." : "ODA: Report to Commander Voss at the command tent first.");
    if (n.talk === "quarter") {
      if (!Game.flags.starter) return say("QUARTERMASTER: Get your orders from the Commander, then come see me.");
      if (Game.flags.supply1) return say("QUARTERMASTER: That's all I can spare. Make every kit count.");
      Game.flags.supply1 = true; Game.bag.kit += 3; Game.bag.rig += 5; Sound.fx("capture");
      await say("QUARTERMASTER: Here. Three FIELD KITS and five SOUL LINKS.");
      await say("QUARTERMASTER: Weaken a wild mon, then cast a Link. If it holds, that mon's soul is bound to yours, same as your partner's.");
      await say("QUARTERMASTER: Works on Warmons too. Hamon builds them around a stolen soul, and a Link reaches it. Takes that soul back from him.");
      return say("QUARTERMASTER: Mind the limit. Three links, then your soul is full. The Tracker by the gate knows ways to stretch it. Talk to her before the fields.");
    }
    if (n.talk === "quarter2") {
      if (Game.flags.supply2) return say("SUPPLY SERGEANT: The General's fortress is past the lieutenant. Good luck.");
      Game.flags.supply2 = true; Game.bag.kit += 3; Game.bag.rig += 2; Sound.fx("capture");
      return say("SUPPLY SERGEANT: You made it! Take 3 FIELD KITS and 2 SOUL LINKS.");
    }
    if (n.talk === "hunt") {            // quest 1: thin out the fields -> harness slot 4
      const F = Game.flags;
      if (F.harness1) return say("TRACKER: Four links holding? Good. Four mons at your side is a real fighting line.");
      if (!F.hunt) {
        await say("TRACKER: New blood. You know how the Links work? One mon's soul per link, three links per soul. Feels like a wall when you hit it.");
        await say("TRACKER: I carry a charm from the old shrines. Hold it and your soul bears a FOURTH link. I would trade it for some peace and quiet.");
        await say("TRACKER: Wild mons and rogue Warmons are all over the scorched fields west of here. My patrols can't get through.");
        await say("TRACKER: Drive off four of them, in the tall grass, and the charm is yours.");
        F.hunt = 1; F.huntN = 0; Sound.fx("select"); return say("Quest taken: win 4 wild battles on the Western Front. Reward: a fourth SOUL LINK.");
      }
      if ((F.huntN || 0) < 4) return say(`TRACKER: ${F.huntN || 0} down, ${4 - (F.huntN || 0)} to go. The tall grass is where they hide.`);
      F.harness1 = true; F.hunt = 2; Sound.fx("level");
      await say("TRACKER: The road is clear. A deal is a deal. Hold still... there. Feel the room?");
      return say("Your soul can now bear 4 SOUL LINKS!");
    }
    if (n.talk === "rewire") {          // quest 2: bring a rewired Warmon -> harness slot 5
      const F = Game.flags;
      if (F.harness2) return say("RUNESMITH: Five links on one soul. Nobody on the front carries more. Wear them well.");
      if (!F.rewire) {
        await say("RUNESMITH: I etch Links for the Front. I can etch a FIFTH one into a soul, but the rune I need is inside Hamon's machines.");
        await say("RUNESMITH: Bind a Warmon with a Link, any Artificial type, and bring it to me alive. I need to see how a soul sits in a core.");
        F.rewire = 1; Sound.fx("select"); return say("Quest taken: bind an Artificial type mon and show it to the runesmith. Reward: a fifth SOUL LINK.");
      }
      const w = Game.party.find(m => SPECIES[m.id].types.includes("ARTIFICIAL"));
      if (!w) return say("RUNESMITH: No Warmon yet? Scraplings and Noxdrones turn up in the grass east of the bridge. Weaken one, then cast a Link.");
      F.harness2 = true; F.rewire = 2; Sound.fx("level");
      await say(`RUNESMITH: A ${monName(w)}, and it answers to you. Hold still, both of you. This stings... there.`);
      return say(`Your soul can now bear ${Game.cap()} SOUL LINKS!`);
    }
    if (n.talk === "general") return;
    for (const l of n.lines || []) await say(l);
  },

  async vossTalk() {
    if (Game.flags.starter) { const F = Game.flags;
      return say(F.beat_hamon ? "VOSS: You did it. Ellyendor is free because of you, soldier. Rest. You have earned it." :
                 F.beat_general3 ? "VOSS: The Shrines are quiet. Hamon's citadel is all that is left. Finish it, soldier." :
                 F.beat_general2 ? "VOSS: Two generals down. The third, Thal, holds the High Shrines beyond the Hollow. Climb." :
                 F.beat_general ? "VOSS: The West is ours. Through Varrow's gate lies the Hollow Wood, and the second general. Keep going." :
                 "VOSS: Head west. Break through to the fortress and take down General Varrow."); }
    await say(`VOSS: ${Game.player.name}. You made it. Good. Listen closely.`);
    await say("VOSS: The Dominion's General of the West, Varrow, holds the only road to Hamon's citadel.");
    await say("VOSS: Kill the General, and the road east opens. That's your first objective.");
    await say("VOSS: You'll need a partner. Three young ones wandered into camp last week, and they won't leave the medic alone. Pick one.");
    let pick = -1;
    while (pick < 0) {
      const i = await choose(STARTERS.map(s => SPECIES[s].name), { preview: STARTERS });
      const sp = SPECIES[STARTERS[i]];
      await say(`${sp.name}, ${sp.type} type. ${sp.dex}`);
      if ((await choose(["Take it", "Look again"])) === 0) pick = i;
    }
    const mon = makeMon(STARTERS[pick], 5);
    Game.party.push(mon); Game.flags.starter = true; Sound.fx("level");
    await say(`${Game.player.name} received ${monName(mon)}!`);
    await say(`VOSS: Feel that? ${monName(mon)}'s soul just bound itself to yours. That is a SOUL LINK. It fights for you now, and it will not die alone.`);
    await say("VOSS: A fresh soul can bear three links at once. Three mons at your side, no more. The quartermaster will show you how to make more.");
    await say("VOSS: The medic can patch you up anytime. Go.");
    await say(`VOSS: Move out, ${Game.player.name}. For Ellyendor.`);
  },

  async trainerEvent(n) {
    Sound.fx("spot"); this.bubble = { n, t: 40 };
    await wait(40); this.bubble = null;
    const p = this.player;
    while (Math.abs(n.x - p.x) + Math.abs(n.y - p.y) > 1) await this.walkNpc(n, n.dir);
    p.dir = OPP[n.dir];
    const tr = TRAINERS[n.trainer];
    await say(`${tr.name}: ${tr.intro}`);
    await this.fight(n);
  },
  async fight(n) {
    const tr = TRAINERS[n.trainer];
    const res = await startBattle({ foes: tr.team.map(([id, lv]) => makeMon(id, lv)), trainer: tr, bg: this.map.bg, music: tr.boss ? "boss" : "battle" });
    if (res === "win") { Game.flags["beat_" + n.trainer] = true; if (tr.lose) await say(`${tr.name}: ${tr.lose}`); }
  },

  async bossEvent(B) {
    const g = this.map.npcs.find(n => n.id === B.npc), p = this.player;
    Sound.stop(); Sound.fx("spot"); this.bubble = { n: g, t: 50 }; await wait(50); this.bubble = null;
    // the boss walks over until adjacent
    for (let guard = 0; guard < 40 && Math.abs(g.x - p.x) + Math.abs(g.y - p.y) > 1; guard++) {
      const dir = Math.abs(g.x - p.x) > 1 || (Math.abs(g.x - p.x) === 1 && g.y !== p.y) ? (g.x < p.x ? "right" : "left") : (g.y < p.y ? "down" : "up");
      const [dx, dy] = DIRS[dir]; if (this.blocked(g.x + dx, g.y + dy) && !(g.x + dx === p.x && g.y + dy === p.y)) break;
      if (g.x + dx === p.x && g.y + dy === p.y) { g.dir = dir; break; }
      await this.walkNpc(g, dir);
    }
    g.dir = g.y < p.y ? "down" : g.y > p.y ? "up" : g.x < p.x ? "right" : "left"; p.dir = OPP[g.dir];
    for (const l of B.intro) await say(l);
    this.act(g, "attack"); Sound.fx("swing"); await wait(8);
    this.act(p, "hurt"); Sound.fx("hit"); await wait(30);
    await say(`${Game.player.name} staggers, but keeps their footing. The glaive comes up.`);
    this.act(p, "attack"); Sound.fx("swing"); await wait(22);
    const tr = TRAINERS[B.trainer];
    const res = await startBattle({ foes: tr.team.map(([id, lv]) => makeMon(id, lv)), trainer: tr, bg: B.bg, music: "boss" });
    if (res !== "win") return;
    Game.flags[B.flag] = true;
    for (const l of B.after) await say(l);
    g.gone = true;
    Game.save();
    if (B.final) await endingScene(); else { await chapterCard(...B.chapter); if (B.then) for (const l of B.then) await say(l); }
  },

  // ---------------------------------------------------------------- start menu
  updateMenu() {
    const k = Game.keys;
    if (this.menu === "main") {
      const opts = this.menuOpts();
      this.mcur = listMove(this.mcur, k, opts.length);
      if (k.has("b") || k.has("start")) { Sound.fx("blip"); this.menu = null; return; }
      if (!k.has("a")) return;
      Sound.fx("select");
      const o = opts[this.mcur];
      if (o === "SQUAD") { if (!Game.party.length) return; this.menu = "squad"; this.lcur = 0; this.swapFrom = -1; this.sqOpt = -1; }
      else if (o === "BAG") { this.menu = "bag"; this.lcur = 0; }
      else if (o === "SAVE") { const ok = Game.save(); this.menu = null; this.run(async () => { Sound.fx(ok ? "heal" : "bump"); await say(ok ? `Campaign saved to slot ${Game.slot + 1}.  ${fmtTime(Game.playtime)} in the field.` : "The save could not be written."); }); }
      else if (o === "SOUND") { Game.toggleSound(); }
      else if (o === "SCREEN") { this.menu = null; toggleFullscreen(); }
      else if (o === "BOARD" || o === "DISMOUNT") { Game.riding = !Game.riding; Sound.fx(Game.riding ? "capture" : "blip"); this.menu = null; }
      else if (o === "EXIT") {       // back to the title, with or without saving
        this.menu = null;
        this.run(async () => {
          const app = !!(window.__TAURI__ && window.__TAURI__.window), opts = app ? ["SAVE & QUIT", "QUIT", "CANCEL"] : ["SAVE & EXIT", "EXIT", "CANCEL"];
          const c = await choose(opts);
          if (c === 2) { TB.close(); return; }
          if (c === 0) Game.save();
          if (app) { try { await window.__TAURI__.window.getCurrentWindow().close(); } catch (e) {} }   // the desktop app: close the window
          TB.close(); Sound.hush(); Sound.stop(); await fadeOut(); Game.riding = false; this.busy = false; titleScene();
        });
      }
      else this.menu = null;
    } else if (this.menu === "squad") {
      if (this.sqOpt >= 0) {                                    // INFO / MOVE picker for the highlighted mon
        this.sqOpt = listMove(this.sqOpt, k, 2);
        if (k.has("b")) { Sound.fx("blip"); this.sqOpt = -1; return; }
        if (k.has("a")) { Sound.fx("select"); if (this.sqOpt === 0) { this.menu = "info"; this.page = 0; } else this.swapFrom = this.lcur; this.sqOpt = -1; }
        return;
      }
      this.lcur = listMove(this.lcur, k, Game.party.length);
      if (k.has("b")) { Sound.fx("blip"); this.menu = this.swapFrom >= 0 ? (this.swapFrom = -1, "squad") : "main"; return; }
      if (k.has("a")) {
        Sound.fx("select");
        if (this.swapFrom < 0) this.sqOpt = 0;
        else { const P = Game.party; [P[this.swapFrom], P[this.lcur]] = [P[this.lcur], P[this.swapFrom]]; this.swapFrom = -1; }
      }
    } else if (this.menu === "info") {
      this.lcur = listMove(this.lcur, k, Game.party.length);
      if (k.has("left") || k.has("right")) { this.page ^= 1; Sound.fx("blip"); }
      if (k.has("b")) { Sound.fx("blip"); this.menu = "squad"; }
    } else if (this.menu === "bag") {
      this.lcur = listMove(this.lcur, k, 2);
      if (k.has("b")) { Sound.fx("blip"); this.menu = "main"; return; }
      if (k.has("a") && this.lcur === 0 && Game.bag.kit > 0 && Game.party.length) { Sound.fx("select"); this.menu = "kit"; this.lcur = 0; }
    } else if (this.menu === "kit") {
      this.lcur = listMove(this.lcur, k, Game.party.length);
      if (k.has("b")) { Sound.fx("blip"); this.menu = "bag"; this.lcur = 0; return; }
      if (k.has("a")) {
        const m = Game.party[this.lcur];
        if (m.hp <= 0 || m.hp >= m.maxhp || !Game.bag.kit) { Sound.fx("bump"); return; }
        Game.bag.kit--; m.hp = Math.min(m.maxhp, m.hp + 40); Sound.fx("heal");
      }
    }
  },
  // ---- the Soul Vault: one list, party on top, stored links below; A moves a mon across
  async vaultScreen() {
    let cur = 0, scroll = 0;
    const rows = () => [...Game.party.map(m => ({ m, side: "party" })), ...Game.vault.map(m => ({ m, side: "vault" }))];
    const draw = (c) => {
      R(c, "#121016", 0, 0, W, H); for (let y = 0; y < H; y += 8) R(c, "#16131b", 0, y, W, 4);
      const list = rows(), vis = 8; if (cur < scroll) scroll = cur; if (cur >= scroll + vis) scroll = cur - vis + 1;
      frameBox(c, 0, 0, W, 16); drawText(c, "SOUL VAULT", 8, 4, "#fcd888", INK_SH);
      const hdr = `LINKS ${Game.party.length}/${Game.cap()}   STORED ${Game.vault.length}`; drawText(c, hdr, 232 - textWidth(hdr), 4, INK, INK_SH);
      let y = 18, lastSide = null;
      list.slice(scroll, scroll + vis).forEach((r, k) => {
        const i = k + scroll, on = i === cur;
        if (r.side !== lastSide && r.side === "vault" && k > 0) { R(c, "#4a3a24", 4, y, 232, 1); y += 2; }
        lastSide = r.side;
        R(c, on ? "#c8a050" : r.side === "party" ? "#4a3a24" : "#2a3a44", 4, y, 232, 13); R(c, on ? "#3a2c20" : "#1c1a24", 5, y + 1, 230, 11);
        c.drawImage(MON_ART[r.m.id].front, 8, y - 1, 14, 14);
        drawText(c, monName(r.m), 26, y + 2, INK, INK_SH); drawText(c, "Lv" + r.m.level, 110, y + 2, INK, INK_SH);
        R(c, TYPE_COLOR[monType(r.m)], 140, y + 2, 8, 8);
        drawText(c, r.side === "party" ? "WITH YOU" : "STORED", 232 - textWidth(r.side === "party" ? "WITH YOU" : "STORED"), y + 2, r.side === "party" ? "#94d66c" : "#86c6f0", null);
        y += 13;
      });
      if (!list.length) drawText(c, "Nothing here yet.", 80, 70, "#8a8090", null);
      frameBox(c, 0, 130, W, 30);
      const r = list[cur], hint = !r ? "B: LEAVE" : r.side === "party" ? (Game.party.length > 1 ? "A: STORE THIS LINK   B: LEAVE" : "Your last link stays with you.   B: LEAVE") : (Game.party.length < Game.cap() ? "A: TAKE THIS LINK BACK   B: LEAVE" : "Soul full. Store one first.   B: LEAVE");
      drawText(c, hint, 8, 140, INK, INK_SH);
    };
    Game.drawOverride = draw; await nextFrame();
    while (true) {
      const list = rows(); cur = Math.min(cur, Math.max(0, list.length - 1)); cur = listMove(cur, Game.keys, Math.max(1, list.length));
      if (Game.keys.has("b")) { Sound.fx("blip"); break; }
      if (Game.keys.has("a") && list[cur]) {
        const r = list[cur];
        if (r.side === "party" && Game.party.length > 1) { Game.party.splice(Game.party.indexOf(r.m), 1); Game.vault.push(r.m); Sound.fx("select"); }
        else if (r.side === "vault" && Game.party.length < Game.cap()) { Game.vault.splice(Game.vault.indexOf(r.m), 1); Game.party.push(r.m); Sound.fx("capture"); }
        else Sound.fx("bump");
      }
      await nextFrame();
    }
    Game.drawOverride = null; Game.autosave();
  },
  menuOpts() {
    const ride = Game.flags.board && !this.map.interior ? [Game.riding ? "DISMOUNT" : "BOARD"] : [];
    return ["SQUAD", "BAG", "KIT", "ORDERS", ...ride, "SAVE", "OPTIONS", "EXIT"];
  },

  // ---------------------------------------------------------------- drawing
  camera() {
    const p = this.player, [dx, dy] = p.moving ? DIRS[p.dir] : [0, 0];
    const x = p.x * TS + dx * p.t, y = p.y * TS + dy * p.t, m = this.map.m;
    return [Math.round(Math.max(0, Math.min(m[0].length * TS - W, x + 8 - W / 2))), Math.round(Math.max(0, Math.min(m.length * TS - H, y + 8 - H / 2)))];
  },
  draw(ctx, t) {
    if (this.menu === "info") { drawSummary(ctx, Game.party[this.lcur], this.page || 0); return; }
    if (this.menu === "squad" || this.menu === "kit") {
      drawSquad(ctx, this.lcur, this.menu === "kit" ? `Use a FIELD KIT (x${Game.bag.kit}) on which mon?` : this.swapFrom >= 0 ? "Swap with which mon?" : `A: info / move   B: back   SOUL LINKS ${Game.party.length}/${Game.cap()}`);
      if (this.swapFrom >= 0) R(ctx, "#f04040", 2, 4 + this.swapFrom * squadPitch(), 2, squadPitch() - 2);
      if (this.menu === "squad" && this.sqOpt >= 0) { frameBox(ctx, 170, 84, 66, 38, true); ["INFO", "MOVE"].forEach((o, i) => { drawText(ctx, o, 188, 92 + i * 13); if (i === this.sqOpt) cursor(ctx, 178, 92 + i * 13); }); }
      return;
    }
    const [cx, cy] = this.camera(), f = Math.floor(t / 500) % 2, m = this.map.m, P = this.map.paint;
    ctx.drawImage(P.ground, -cx, -cy);
    const wf = Math.floor(t / 420) % 4; if (wf === 1 || wf === 3) ctx.drawImage(P.water[wf === 1 ? 1 : 2], -cx, -cy);
    // a breeze moves across the tall grass in waves
    if (!this.map.interior) for (let ty = Math.floor(cy / TS); ty <= Math.floor((cy + H) / TS); ty++) for (let tx = Math.floor(cx / TS); tx <= Math.floor((cx + W) / TS); tx++)
      if (this.tile(tx, ty) === ";" && Math.sin(t / 650 - tx * 0.8 - ty * 0.45) > 0.8) ctx.drawImage(tallFor(this.map)[(tx * 7 + ty * 3) % 4][1], tx * TS - cx, ty * TS - cy);
    for (const pr of this.map.props) if (pr.kind === "fire") drawCampfire(ctx, pr.x * TS - cx, pr.y * TS - cy, t);
      else if (pr.kind === "hearth") drawCampfire(ctx, pr.x * TS - cx + 4, pr.y * TS - cy + 2, t);
    this.drawFx(ctx, cx, cy, false);
    const actors = this.map.npcs.filter(n => !n.gone).map(n => [n, n.look]).concat([[this.player, "player"]]);
    actors.sort((a, b) => this.py(a[0]) - this.py(b[0]));
    // characters go on their own layer so they can take the night tint and warm lamp light
    const A = ACTOR_LAYER.getContext("2d"); A.clearRect(0, 0, W, H);
    const drawn = [], after = [];
    // everything upright that moves or animates is sorted by where its feet are
    const items = actors.map(([o, look]) => ({ o, look, y: this.py(o) + 15 }));
    for (const pr of this.map.props) if (pr.kind === "lamp" || pr.kind === "brazier") items.push({ pr, y: pr.y * TS + 15 });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.pr) { const X = it.pr.x * TS - cx, Y = it.pr.y * TS - cy; if (it.pr.kind === "lamp") drawLamp(A, X, Y, t); else drawBrazier(A, X, Y, t); continue; }
      const { o, look } = it;
      const [dx, dy] = o.moving ? DIRS[o.dir] : [0, 0];
      const X = Math.round(o.x * TS + dx * o.t - cx), Y = Math.round(o.y * TS + dy * o.t - cy);
      ctx.fillStyle = "rgba(20,30,40,.35)"; ctx.fillRect(X + 2, Y + 13, 12, 3); ctx.fillRect(X + 4, Y + 12, 8, 5);
      const riding = o === this.player && Game.riding, hov = riding ? -4 + Math.round(Math.sin(t / 150) * 1.5) : 0;
      if (riding) { A.drawImage(HOVERBOARD[o.dir === "left" || o.dir === "right" ? "side" : "front"], X - 4, Y + 8 + hov); if (o.dir === "left") { } }
      const spr = this.frameFor(o, look, t);
      A.drawImage(spr, X - 16, Y - 28 + hov); drawn.push([spr, X - 16, Y - 28 + hov, Y + cy + 15]);
      {   // tall grass buries the feet wherever they are, even mid-step: the bottom rows are the ground's own grass redrawn solid,
          // and above that only the blade tips are redrawn so the top edge stays ragged
        const wx = Math.round(o.x * TS + dx * o.t), wy = Math.round(o.y * TS + dy * o.t), seen = new Set();
        for (const ty of [Math.floor((wy + 5) / TS), Math.floor((wy + 15) / TS)]) for (const tx of [Math.floor(wx / TS), Math.floor((wx + 15) / TS)]) {
          if (seen.has(tx + "," + ty) || this.tile(tx, ty) !== ";") continue; seen.add(tx + "," + ty);
          const x0 = Math.max(wx, tx * TS), x1 = Math.min(wx + 16, tx * TS + TS); if (x1 <= x0) continue;
          const clip = (ya, yb) => [Math.max(wy + ya, ty * TS), Math.min(wy + yb, ty * TS + TS)];
          const [s0, s1] = clip(11, 16), [t0, t1] = clip(5, 11);
          if (s1 > s0) after.push(() => ctx.drawImage(P.ground, x0, s0, x1 - x0, s1 - s0, Math.round(x0 - cx), Math.round(s0 - cy), x1 - x0, s1 - s0));
          if (t1 > t0) after.push(() => ctx.drawImage(tallFor(this.map)[(tx * 7 + ty * 3) % 4][0], x0 - tx * TS, t0 - ty * TS, x1 - x0, t1 - t0, Math.round(x0 - cx), Math.round(t0 - cy), x1 - x0, t1 - t0));
        }
      }
      if (this.bubble && this.bubble.n === o) after.push(() => {
        R(ctx, "#0d0a10", X + 3, Y - 30, 11, 13); R(ctx, "#e6dcc8", X + 4, Y - 29, 9, 11);
        R(ctx, "#b02020", X + 7, Y - 27, 3, 5); R(ctx, "#b02020", X + 7, Y - 21, 3, 2);
      });
    }
    A.globalCompositeOperation = "source-atop";
    const tint = { night: "rgba(14,16,44,0.4)", dusk: "rgba(44,18,62,0.3)" }[this.map.mood];
    if (tint) { A.fillStyle = tint; A.fillRect(0, 0, W, H); }
    for (const L of tint ? this.map.lights || [] : []) {
      const lx = L.x - cx, ly = L.y - cy; if (lx < -60 || ly < -60 || lx > W + 60 || ly > H + 60) continue;
      const fl = L.r > 40 ? 0.9 + 0.1 * Math.sin(t / 110 + lx) : 1, [r, g, b] = L.col || [255, 160, 70];
      const gr = A.createRadialGradient(lx, ly - 8, 0, lx, ly - 8, L.r * 1.1 * fl);
      gr.addColorStop(0, `rgba(${r},${g},${b},${0.5 * L.a})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      A.fillStyle = gr; A.fillRect(lx - L.r * 1.2, ly - L.r * 1.2 - 8, L.r * 2.4, L.r * 2.4);
    }
    A.globalCompositeOperation = "source-over";
    ctx.drawImage(ACTOR_LAYER, 0, 0);
    // roofs, trees, tents and fences that stand south of a character are drawn back over them
    if (P.base) for (const [spr, sx, sy, feet] of drawn) this.occlude(ctx, spr, sx, sy, feet, cx, cy);
    after.forEach(fn => fn());
    for (const [spr, x, y, feet] of drawn) if (spr.glow && !spr.hidden) {
      ctx.drawImage(spr.glow, x, y);
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35;
      ctx.drawImage(spr.glow, x - 1, y); ctx.drawImage(spr.glow, x + 1, y); ctx.drawImage(spr.glow, x, y - 1);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    this.drawFx(ctx, cx, cy, true);
    this.drawAmbient(ctx, cx, cy, t);
    if (this.menu === "main" || this.menu === "bag") this.drawMenu(ctx);
  },
  fx: [],
  drawFx(ctx, cx, cy, front) {
    for (const q of this.fx) {
      if (!!q.front !== front) continue;
      const k = q.life / q.max, X = Math.round(q.x - cx), Y = Math.round(q.y - cy);
      ctx.globalAlpha = q.puff ? k * 0.6 : Math.min(1, k * 2);
      if (q.puff) { const r = k > 0.6 ? 1 : 2; R(ctx, q.col, X - r + 1, Y - r + 1, r * 2 - 1, r * 2 - 1); } else R(ctx, q.col, X, Y, 1, 1);
    }
    ctx.globalAlpha = 1;
    if (front && this.fxTick !== Game.ticks) {             // advance once per game step
      this.fxTick = Game.ticks;
      for (const q of this.fx) { q.x += q.vx; q.y += q.vy; q.vy += q.g; q.life--; }
      this.fx = this.fx.filter(q => q.life > 0);
    }
  },
  // slow cloud shadows and drifting pollen outdoors; dust motes in the lamplight indoors
  drawAmbient(ctx, cx, cy, t) {
    if (!this.map.interior) {
      const c = cloudTex(), ox = -Math.floor((cx + t * 0.011) % c.width + c.width) % c.width, oy = -Math.floor((cy + t * 0.004) % c.height + c.height) % c.height;
      for (let x = ox; x < W; x += c.width) for (let y = oy; y < H; y += c.height) ctx.drawImage(c, x, y);
    }
    const n = this.map.interior ? 9 : 12;
    for (let i = 0; i < n; i++) {
      const sp = 0.004 + (i % 4) * 0.0025, wx = i * 97.3 + t * sp * (this.map.interior ? 0.5 : 1.6), wy = i * 53.7 - t * sp * 0.6 + Math.sin(t / 900 + i * 2.1) * 6;
      const X = Math.floor(((wx - cx * 0.9) % (W + 16) + W + 16) % (W + 16)) - 8, Y = Math.floor(((wy - cy * 0.9) % (H + 16) + H + 16) % (H + 16)) - 8;
      const tw = 0.35 + 0.35 * Math.sin(t / 400 + i * 1.7);
      ctx.globalAlpha = Math.max(0, tw); R(ctx, this.map.interior ? "#fcd888" : i % 3 ? "#e0f4ff" : "#c8f088", X, Y, 1, 1);
    }
    ctx.globalAlpha = 1;
  },
  // which sprite frame an actor shows: action (attack / hurt) > walking > idle breathing
  frameFor(o, look, t) {
    const set = CHAR[look][o.dir];
    if (o === this.player && Game.riding && !o.act) return set.idle[0];
    if (o.act) {
      const age = Game.ticks - o.act.t0;
      if (o.act.kind === "attack" && age < 20) return set.attack[age < 6 ? 0 : age < 13 ? 1 : 2];
      if (o.act.kind === "hurt" && age < 30) return set.hurt[Math.floor(age / 4) % 2];
      o.act = null;
    }
    if (o.moving || Game.ticks - (o.lastMove || -9) <= 1) {     // animation follows distance travelled, so it never restarts mid-stride
      if ((o.speed || 1) > 1 && set.run) return set.run[Math.floor((o.phase || 0) / (32 / 6)) % 6];
      return set.walk[Math.floor((o.phase || 0) / 8) % 4];
    }
    o.phase = 0;
    return set.idle[Math.floor((t + (o.x * 311 + o.y * 173) % 900) / 520) % 2];
  },
  occlude(ctx, spr, sx, sy, feet, cx, cy) {
    const P = this.map.paint, img = OCC.ctx.createImageData(CW, CW), d = img.data;
    const sd = spr._sd || (spr._sd = spr.getContext("2d").getImageData(0, 0, CW, CW).data);
    let any = false, cover = 0, opaque = 0;
    for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) {
      const k = j * CW + i; if (!sd[k * 4 + 3]) continue; opaque++;
      const wx = sx + cx + i, wy = sy + cy + j; if (wx < 0 || wy < 0 || wx >= P.w || wy * P.w >= P.base.length) continue;
      const q = wy * P.w + wx; if (P.base[q] <= feet) continue;
      d[k * 4] = P.gdata[q * 4]; d[k * 4 + 1] = P.gdata[q * 4 + 1]; d[k * 4 + 2] = P.gdata[q * 4 + 2]; d[k * 4 + 3] = 255; any = true; cover++;
    }
    spr.hidden = opaque && cover / opaque > 0.6;
    if (!any) return;
    OCC.ctx.putImageData(img, 0, 0); ctx.drawImage(OCC.c, sx, sy);
  },
  act(o, kind) { o.act = { kind, t0: Game.ticks }; },
  py(o) { return o.y * TS + (o.moving ? DIRS[o.dir][1] * o.t : 0); },
  pathEdges(ctx, tx, ty, X, Y) {
    const isP = (x, y) => [",", "H", "p"].includes(this.tile(x, y));
    ctx.fillStyle = "#c0a068";
    if (!isP(tx, ty - 1)) ctx.fillRect(X, Y, TS, 1);
    if (!isP(tx - 1, ty)) ctx.fillRect(X, Y, 1, TS);
    if (!isP(tx + 1, ty)) ctx.fillRect(X + TS - 1, Y, 1, TS);
    if (!isP(tx, ty + 1)) ctx.fillRect(X, Y + TS - 1, TS, 1);
    const gc = "#78c860", corner = (ox, oy, sx, sy) => { ctx.fillStyle = gc; ctx.fillRect(X + ox, Y + oy, 2, 1); ctx.fillRect(X + ox + (sx > 0 ? 0 : 1), Y + oy + sy, 1, 1);
      ctx.fillStyle = "#c0a068"; ctx.fillRect(X + ox + (sx > 0 ? 2 : -1), Y + oy, 1, 1); ctx.fillRect(X + ox + (sx > 0 ? 1 : 0), Y + oy + sy, 1, 1); };
    if (!isP(tx, ty - 1) && !isP(tx - 1, ty)) corner(0, 0, 1, 1);
    if (!isP(tx, ty - 1) && !isP(tx + 1, ty)) corner(14, 0, -1, 1);
    if (!isP(tx, ty + 1) && !isP(tx - 1, ty)) corner(0, 15, 1, -1);
    if (!isP(tx, ty + 1) && !isP(tx + 1, ty)) corner(14, 15, -1, -1);
  },
  drawMenu(ctx) {
    const opts = this.menuOpts();
    frameBox(ctx, 168, 2, 70, 14 + opts.length * 14);
    opts.forEach((o, i) => { const lab = o === "SOUND" ? (Game.muted ? "SOUND: OFF" : "SOUND: ON") : o; drawText(ctx, lab, 182, 10 + i * 14); if (this.menu === "main" && i === this.mcur) cursor(ctx, 174, 10 + i * 14); });
    if (this.menu === "bag") {
      frameBox(ctx, 4, 2, 160, 60);
      drawText(ctx, "BAG", 12, 9, "#2860b0");
      ["kit", "rig"].forEach((it, i) => { drawText(ctx, ITEMS[it].name, 22, 24 + i * 14); drawText(ctx, "x" + Game.bag[it], 136, 24 + i * 14); if (i === this.lcur) cursor(ctx, 13, 24 + i * 14); });
      frameBox(ctx, 0, 112, 240, 48);
      wrapText(ITEMS[["kit", "rig"][this.lcur]].desc + (this.lcur === 0 ? " Press A to use." : " Use in battle."), 216).slice(0, 2).forEach((l, i) => drawText(ctx, l, 12, 122 + i * 16));
    }
  },
};

// one tiling texture of soft-edged cloud shadow, built on first use
let CLOUD_TEX = null;
function cloudTex() {
  if (CLOUD_TEX) return CLOUD_TEX;
  const w = 320, h = 224; CLOUD_TEX = mk(w, h, x => {
    const img = x.createImageData(w, h), d = img.data, wrap = (fx, fy) => {      // blend four samples so the texture tiles seamlessly
      const u = fx / w, v = fy / h, a = fbm(fx / 46, fy / 34, 91, 3), b = fbm((fx - w) / 46, fy / 34, 91, 3), c = fbm(fx / 46, (fy - h) / 34, 91, 3), e = fbm((fx - w) / 46, (fy - h) / 34, 91, 3);
      return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
    };
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const n = wrap(xx, y), k = (y * w + xx) * 4, lvl = n > 0.6 ? 2 : n > 0.555 ? 1 : 0;
      const on = lvl === 2 || (lvl === 1 && ((xx + y) & 1));                     // dithered edge, like everything else in the world
      d[k] = 20; d[k + 1] = 26; d[k + 2] = 60; d[k + 3] = on ? 34 : 0;
    }
    x.putImageData(img, 0, 0);
  });
  return CLOUD_TEX;
}
