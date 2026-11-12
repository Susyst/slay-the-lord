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
    ["PARTY FOLLOWER", Game.opts.follower === false ? "OFF" : "ON"],
    ["SOUND", Game.muted ? "OFF" : "ON"],
    ["FULLSCREEN", "PRESS A  (or F)"],
    ["BACK", ""],
  ];
  const draw = (c) => {
    frameBox(c, 10, 20, 220, 108);
    rows().forEach(([label, val], i) => {
      const y = 28 + i * 16;
      drawText(c, label, 26, y, i === rows().length - 1 ? "#e05050" : INK);
      if (val) drawText(c, val, 222 - textWidth(val), y, "#a8b8e0");
      if (i === cur) cursor(c, 17, y);
    });
    drawText(c, "These stay with you, not with the save.", 10, 126, "#8a8090", null);
  };
  await panelScreen("OPTIONS", draw, async k => {
    cur = listMove(cur, k, 6);
    const left = k.has("left"), right = k.has("right"), a = k.has("a");
    if (!left && !right && !a) return;
    if (cur === 0) { Game.opts.text = (Game.opts.text + (left ? 2 : 1)) % 3; Sound.fx("blip"); Game.saveOpts(); }
    else if (cur === 1) { Game.opts.autorun = !Game.opts.autorun; Sound.fx("blip"); Game.saveOpts(); }
    else if (cur === 2) { Game.opts.follower = Game.opts.follower === false; Sound.fx("blip"); Game.saveOpts(); }
    else if (cur === 3) { Game.toggleSound(); Sound.fx("blip"); }
    else if (cur === 4 && a) { toggleFullscreen(); }
    else if (cur === 5 && a) return "close";
  });
}

// ---------------------------------------------------------------- wire the new entries into the pause menu
const _menuPick = World.updateMenu;
World.updateMenu = function () {
  const before = this.menu, opts = this.menuOpts(), pick = opts[this.mcur], a = Game.keys.has("a");
  if (before === "main" && a && (pick === "KIT" || pick === "ORDERS" || pick === "OPTIONS")) {
    Sound.fx("select"); this.menu = null;
    return this.run(async () => { await (pick === "KIT" ? kitScreen() : pick === "ORDERS" ? ordersScreen() : optionsScreen()); });
  }
  return _menuPick.call(this);
};
