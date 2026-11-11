// Chapters 2-4: the Hollow Wood, the High Shrines and Hamon's citadel. New trainers, the hoverboard quest, boss scripts.

// ---------------------------------------------------------------- cast
Object.assign(NPC_LOOKS, {
  general2: { head: "hood", skin: 1, hair: 2, cloakRamp: CHAR_OPTS.accent[4], armor: 2, noAccent: true, eyesHex: "#c890ff", pants: RAMP.gloves },
  general3: { head: "bare", skin: 2, hair: 3, beard: true, cloak: 1, armorRamp: RAMP.white, accent: 2, pauldron: true, weapon: null },
  hamon: { head: "bare", skin: 0, hair: 1, cloakRamp: ["#e8b640", "#b07c1c", "#6a4410", "#2a1a08"], armor: 1, accent: 0, eyesHex: "#ffc24a", pants: RAMP.gloves },
  elite: { head: "helm", armor: 1, cloak: 3, accent: 1, eyesHex: "#ff3a3a", crest: CHAR_OPTS.accent[1] },
  rigger: { head: "bare", skin: 1, hair: 0, noCloak: true, armorRamp: RAMP.leather, tunic: RAMP.tunic, accent: 2, pauldron: false, weapon: null },
  keeper: { head: "hood", skin: 3, cloak: 4, armorRamp: RAMP.white, accent: 3, drape: false, weapon: null },
});

Object.assign(TRAINERS, {
  hesk:  { name: "GRUNT HESK", look: "grunt", team: [["gloamcrow", 15], ["scrapling", 15]],
           intro: "Nobody walks the Hollow after dusk. Nobody who comes back, anyway.", lose: "The trees are watching you. Good luck with that." },
  mara:  { name: "GRUNT MARA", look: "grunt", team: [["shadeling", 16], ["noxdrone", 17]],
           intro: "The Queen's wood. Her rules. Rule one: no Allied scum.", lose: "She'll know you're coming now. She always knows." },
  pell:  { name: "COURIER PELL", look: "grunt", team: [["noxdrone", 17], ["scrapling", 16], ["tuskit", 17]],
           intro: "This drive core is Dominion property now. Finders keepers.", lose: "Ugh, fine. Take the stupid core. It never fit in my pack anyway." },
  orse:  { name: "CAPT. ORSE", look: "officer", team: [["umbrafox", 18], ["ironclad", 18], ["gloamcrow", 19]],
           intro: "Varrow was a brute. Mirene is something else. You will wish for the brute.", lose: "She is waiting at the west arch. She has been waiting a long time." },
  general2: { name: "GENERAL MIRENE", look: "general2", team: [["shroudcrow", 22], ["umbrafox", 22], ["nyxvulpa", 24], ["eclipsar", 26]], boss: true, intro: "", lose: "" },
  tove:  { name: "GRUNT TOVE", look: "grunt", team: [["ironclad", 26], ["hummite", 26]],
           intro: "The air is thin up here. So is your luck.", lose: "Cold... so cold up here..." },
  ilsk:  { name: "GRUNT ILSK", look: "grunt", team: [["sonarix", 27], ["gorehog", 27]],
           intro: "The Keeper hears every step on these stairs. He has heard yours.", lose: "Go on up, then. He will be delighted." },
  venn:  { name: "CAPT. VENN", look: "officer", team: [["siegeclad", 29], ["howlwing", 29], ["stillhorn", 30]],
           intro: "Two generals. I counted. Thal will not be the third.", lose: "The summit gate. He is there. He is always there." },
  general3: { name: "GENERAL THAL", look: "general3", team: [["monolith", 33], ["cairnhart", 33], ["nirvanoad", 34], ["resonyx", 36]], boss: true, intro: "", lose: "" },
  kairn: { name: "ELITE GUARD KAIRN", look: "elite", team: [["bulwarch", 38], ["nightreaver", 38], ["ragefang", 39]],
           intro: "You stand in the house of the Great Lord. Kneel, or be knelt.", lose: "Impossible. The Lord's own guard..." },
  seth:  { name: "ELITE GUARD SETH", look: "elite", team: [["voidreaver", 40], ["ruinboar", 40], ["ravengrave", 41]],
           intro: "Three generals could not stop you. I am not a general. I am worse.", lose: "Go, then. See what waits on the throne. See, and despair." },
  hamon: { name: "GREAT LORD HAMON", look: "hamon", team: [["dreadnought", 44], ["voidreaver", 43], ["fenrath", 44], ["sovereign", 47]], boss: true, intro: "", lose: "" },
});

// ---------------------------------------------------------------- the Hollow Wood (chapter 2)
function buildHollow() {
  const m = blankMap(56, 24, ".");
  rect(m, 0, 0, 55, 1, "T"); rect(m, 0, 22, 55, 23, "T"); rect(m, 0, 0, 1, 23, "T"); rect(m, 54, 0, 55, 23, "T");
  rect(m, 2, 2, 8, 6, "T"); rect(m, 2, 17, 10, 21, "T"); rect(m, 46, 15, 53, 21, "T"); rect(m, 47, 2, 53, 7, "T");
  // the road: east entrance, a bend north round the pond, the waystation, the west arch
  rect(m, 46, 12, 55, 13, ","); rect(m, 38, 12, 46, 13, ","); rect(m, 38, 9, 39, 13, ","); rect(m, 32, 9, 39, 10, ",");
  rect(m, 24, 9, 31, 10, ","); rect(m, 22, 9, 24, 14, ","); rect(m, 10, 12, 22, 13, ","); rect(m, 2, 11, 10, 12, ",");
  // pond with a plank bridge
  rect(m, 29, 4, 31, 19, "W"); rect(m, 27, 15, 33, 19, "W"); m[9][29] = "H"; m[9][30] = "H"; m[9][31] = "H"; m[10][29] = "H"; m[10][30] = "H"; m[10][31] = "H";
  // the ruins, north of the road
  rect(m, 34, 3, 44, 3, "M"); rect(m, 34, 3, 34, 7, "M"); rect(m, 44, 3, 44, 7, "M"); rect(m, 34, 7, 37, 7, "M"); rect(m, 41, 7, 44, 7, "M");
  rect(m, 24, 3, 27, 3, "M"); rect(m, 24, 3, 24, 6, "M"); m[5][26] = "M"; m[6][27] = "R"; m[4][37] = "R"; m[6][43] = "R";
  rect(m, 38, 7, 40, 7, ","); rect(m, 38, 8, 40, 8, ",");
  for (const [x, y] of [[36, 5], [42, 5], [25, 7], [33, 13], [15, 15], [44, 16], [12, 9]]) m[y][x] = "r";
  for (const [x, y] of [[35, 6], [41, 4], [26, 4], [40, 6], [14, 10], [16, 16], [43, 15], [25, 16], [20, 15], [36, 14]]) m[y][x] = "g";
  // tall grass and bloom trees
  rect(m, 40, 15, 45, 19, ";"); rect(m, 12, 15, 20, 19, ";"); rect(m, 40, 4, 43, 6, ";"); rect(m, 25, 5, 28, 7, ";");
  for (const [x, y] of [[11, 3], [15, 4], [20, 3], [36, 17], [23, 18], [10, 19], [46, 9], [50, 15], [21, 6]]) { m[y][x] = "Q"; m[y][x + 1] = "Q"; m[y + 1][x] = "Q"; m[y + 1][x + 1] = "Q"; }
  for (const [x, y] of [[13, 7], [45, 11], [33, 20], [9, 15]]) m[y][x] = "d";
  const tents = [{ x: 17, y: 8, w: 3, h: 3, kind: "tent", side: "allied", door: [18, 11], clutter: [["crate", 3], ["barrel", 38]], text: "Hollow Waystation. Lanterns, a kettle, and a map of the ruins with every rune stone circled." }];
  return {
    id: "hollow", name: "THE HOLLOW WOOD", music: "route", m, tents, bg: "hollow", mood: "dusk", pal: "hollow", tree: "pine", seed: 44,
    props: [{ kind: "lamp", x: 15, y: 11 }, { kind: "lamp", x: 21, y: 14 }, { kind: "fire", x: 19, y: 14 },
            { kind: "sign", x: 47, y: 11, text: "THE HOLLOW WOOD. Allied waystation ahead, past the pond. Keep to the road after dark." },
            { kind: "sign", x: 37, y: 8, text: "The old walls. Rune stones still burn here. Dominion patrols will not enter after dusk." },
            { kind: "banner", x: 9, y: 10 }, { kind: "banner", x: 9, y: 14 }],
    npcs: [
      { id: "hesk", x: 39, y: 8, dir: "down", look: "grunt", trainer: "hesk", sight: 4 },
      { id: "mara", x: 16, y: 14, dir: "up", look: "grunt", trainer: "mara", sight: 3 },
      { id: "pell", x: 39, y: 5, dir: "down", look: "grunt", trainer: "pell", sight: 3 },
      { id: "orse", x: 12, y: 13, dir: "up", look: "officer", trainer: "orse", sight: 4 },
      { id: "medic3", x: 20, y: 12, dir: "down", look: "medic", talk: "heal" },
      { id: "rigger", x: 23, y: 12, dir: "left", look: "rigger", talk: "rigger" },
      { id: "supply3", x: 16, y: 11, dir: "down", look: "quarter", talk: "supply3" },
      { id: "general2", x: 5, y: 11, dir: "right", look: "general2", talk: "general", bossFlag: "beat_general2" },
    ],
    warps: [{ x: 55, y: 12, to: "front", tx: 9, ty: 13, dir: "right" }, { x: 55, y: 13, to: "front", tx: 9, ty: 14, dir: "right" },
            { x: 1, y: 11, to: "shrines", tx: 54, ty: 12, dir: "left" }, { x: 1, y: 12, to: "shrines", tx: 54, ty: 13, dir: "left" }],
    grass: [{ x0: 40, y0: 15, x1: 45, y1: 19, lv: [13, 17], mons: ["shadeling", "gloamcrow", "echit", "antennelle", "lotadpole", "noxdrone", "glimmote"] },
            { x0: 12, y0: 15, x1: 20, y1: 19, lv: [15, 19], mons: ["shadeling", "gloamcrow", "howlpup", "scrapling", "antennelle", "umbrafox", "mossfawn"] },
            { x0: 40, y0: 4, x1: 43, y1: 6, lv: [16, 20], mons: ["gloamcrow", "echit", "noxdrone", "shadeling", "beaconmoth"] },
            { x0: 25, y0: 5, x1: 28, y1: 7, lv: [15, 18], mons: ["lotadpole", "antennelle", "glimmote", "echit", "lilyhop"] }],
    heal: { x: 20, y: 13 },
    boss: { npc: "general2", flag: "beat_general2", trainer: "general2", bg: "hollow", zone: p => p.x <= 8 && p.y >= 10 && p.y <= 13,
            intro: ["MIRENE: Varrow fought with iron. How quaint. The Hollow fights with silence.",
                    "MIRENE: Every soul the Dominion took in this wood is still here, soldier. Listen. They are so very hungry.",
                    "MIRENE: Come closer. Let me introduce you."],
            after: ["MIRENE: The silence... breaks...", "The Hollow Queen sinks into the leaf litter. Behind her, the west arch is open.", "Far above, on the mountain, a line of pale lanterns is being lit."],
            chapter: [2, "THE HOLLOW QUEEN HAS FALLEN", "Beyond the arch, the road climbs to the High Shrines."] },
  };
}

// ---------------------------------------------------------------- the High Shrines (chapter 3)
function buildShrines() {
  const m = blankMap(56, 24, ".");
  rect(m, 0, 0, 55, 1, "T"); rect(m, 0, 22, 55, 23, "T"); rect(m, 0, 0, 1, 23, "T"); rect(m, 54, 0, 55, 23, "T");
  // cliff terraces: the stair climbs west in switchbacks
  rect(m, 2, 2, 52, 4, "k"); rect(m, 2, 15, 20, 17, "k"); rect(m, 26, 15, 52, 17, "k"); rect(m, 2, 8, 10, 10, "k"); rect(m, 16, 8, 44, 10, "k"); rect(m, 50, 8, 52, 10, "k");
  rect(m, 2, 19, 10, 21, "k"); rect(m, 44, 19, 52, 21, "k");
  // the stair
  rect(m, 46, 12, 55, 13, "p"); rect(m, 45, 11, 49, 14, "p"); rect(m, 45, 5, 49, 7, "p"); rect(m, 45, 6, 46, 11, "p"); rect(m, 12, 5, 49, 6, "p");
  rect(m, 11, 5, 14, 7, "p"); rect(m, 12, 7, 13, 11, "p"); rect(m, 12, 11, 44, 12, "p"); rect(m, 21, 13, 25, 20, "p"); rect(m, 11, 18, 44, 19, "p");
  rect(m, 2, 11, 12, 12, "p");
  // pools, lanterns, rune stones, spirit trees
  rect(m, 29, 7, 33, 7, "W"); rect(m, 30, 13, 34, 14, "W"); rect(m, 36, 20, 42, 21, "W");
  for (const [x, y] of [[44, 10], [40, 10], [36, 10], [32, 10], [28, 10], [24, 10], [20, 10], [16, 7], [16, 4], [26, 4], [36, 4], [10, 13], [6, 13], [23, 17], [43, 17], [48, 10]]) m[y][x] = "s";
  for (const [x, y] of [[18, 14], [38, 14], [8, 7], [40, 7], [26, 20], [14, 20], [50, 18]]) m[y][x] = "r";
  for (const [x, y] of [[19, 13], [39, 13], [7, 6], [27, 13], [15, 21], [49, 17], [34, 20]]) m[y][x] = "g";
  rect(m, 14, 13, 20, 14, ";"); rect(m, 35, 13, 43, 14, ";"); rect(m, 27, 20, 33, 21, ";"); rect(m, 17, 7, 28, 7, ";"); rect(m, 34, 7, 44, 7, ";");
  for (const [x, y] of [[3, 6], [50, 6], [12, 20], [46, 20], [3, 13], [20, 20]]) { m[y][x] = "Q"; m[y][x + 1] = "Q"; m[y + 1][x] = "Q"; m[y + 1][x + 1] = "Q"; }
  const tents = [{ x: 27, y: 1, w: 3, h: 3, kind: "tent", side: "allied", door: [28, 4], clutter: [["crate", 5], ["barrel", 41]], text: "Shrine refuge. Allied scouts sleep in shifts here, under the eyes of the old stone keepers." }];
  for (let x = 27; x <= 29; x++) for (let y = 2; y <= 4; y++) m[y][x] = ".";
  return {
    id: "shrines", name: "THE HIGH SHRINES", music: "route", m, tents, bg: "shrine", mood: "night", pal: "shrine", tree: "pine", seed: 61,
    props: [{ kind: "fire", x: 31, y: 5 }, { kind: "sign", x: 50, y: 11, text: "THE HIGH SHRINES. The stair climbs west to the summit gate. Lanterns mark the safe path." },
            { kind: "sign", x: 25, y: 5, text: "Shrine refuge. Medic and supplies. Do not touch the rune stones after midnight." },
            { kind: "banner", x: 11, y: 10 }, { kind: "banner", x: 11, y: 13 }],
    npcs: [
      { id: "tove", x: 47, y: 8, dir: "left", look: "grunt", trainer: "tove", sight: 3 },
      { id: "ilsk", x: 23, y: 15, dir: "up", look: "grunt", trainer: "ilsk", sight: 3 },
      { id: "venn", x: 14, y: 9, dir: "left", look: "officer", trainer: "venn", sight: 4 },
      { id: "medic4", x: 30, y: 5, dir: "down", look: "medic", talk: "heal" },
      { id: "supply4", x: 26, y: 6, dir: "right", look: "quarter", talk: "supply4" },
      { id: "keeper", x: 44, y: 12, dir: "left", look: "keeper", lines: ["KEEPER: The shrines were raised to the old creatures, long before the Dominion. The stones still remember them.", "KEEPER: Thal calls himself their Keeper. He has kept nothing but a cage."] },
      { id: "general3", x: 5, y: 11, dir: "right", look: "general3", talk: "general", bossFlag: "beat_general3" },
    ],
    warps: [{ x: 55, y: 12, to: "hollow", tx: 2, ty: 11, dir: "right" }, { x: 55, y: 13, to: "hollow", tx: 2, ty: 12, dir: "right" },
            { x: 1, y: 11, to: "citadel", tx: 20, ty: 27, dir: "up" }, { x: 1, y: 12, to: "citadel", tx: 20, ty: 27, dir: "up" }],
    grass: [{ x0: 14, y0: 13, x1: 20, y1: 14, lv: [24, 28], mons: ["sonarix", "hummite", "wickwing", "tuskit", "ironclad", "lilyhop", "antennelle"] },
            { x0: 35, y0: 13, x1: 43, y1: 14, lv: [23, 27], mons: ["howlwing", "hummite", "stillhorn", "gorehog", "sonarix", "glimmote"] },
            { x0: 27, y0: 20, x1: 33, y1: 21, lv: [26, 30], mons: ["monolith", "wickwing", "siegeclad", "nirvanoad", "howlwing"] },
            { x0: 17, y0: 7, x1: 28, y1: 7, lv: [25, 29], mons: ["stillhorn", "sonarix", "beaconmoth", "ironclad", "wickwing"] },
            { x0: 34, y0: 7, x1: 44, y1: 7, lv: [25, 29], mons: ["hummite", "gorehog", "howlwing", "lilyhop", "noxmech"] }],
    heal: { x: 30, y: 6 },
    boss: { npc: "general3", flag: "beat_general3", trainer: "general3", bg: "shrine", zone: p => p.x <= 8 && p.y >= 10 && p.y <= 13,
            intro: ["THAL: Do you hear them? The old creatures, under the stones. I have kept them quiet for the Lord these twenty years.",
                    "THAL: Two of my peers are dead. I confess I did not like either of them.",
                    "THAL: But I like my shrines. And you are standing on them."],
            after: ["THAL: The stones... are singing again...", "The Keeper of Shrines falls to his knees among his lanterns, and does not rise.", "Below the summit gate, the citadel's towers burn like a false dawn."],
            chapter: [3, "THE KEEPER OF SHRINES HAS FALLEN", "Through the summit gate: Hamon's citadel. There is no one left between you and the Lord."] },
  };
}

// ---------------------------------------------------------------- Hamon's citadel (chapter 4)
function buildCitadel() {
  const m = blankMap(40, 30, "P");
  rect(m, 0, 0, 39, 1, "K"); rect(m, 0, 28, 39, 29, "K"); rect(m, 0, 0, 1, 29, "K"); rect(m, 38, 0, 39, 29, "K");
  rect(m, 2, 17, 37, 18, "K"); rect(m, 19, 17, 20, 18, "P");                       // the inner gate wall
  rect(m, 2, 2, 9, 16, "K"); rect(m, 30, 2, 37, 16, "K"); rect(m, 10, 2, 29, 2, "K");  // the great hall between its walls
  for (const x of [13, 16, 23, 26]) m[2][x] = "G";                                  // stained glass behind the throne
  for (const x of [5, 8, 11, 14, 25, 28, 31, 34]) m[18][x] = "G";                   // and along the gate wall
  for (const y of [6, 10, 14]) { m[y][12] = "I"; m[y][27] = "I"; }                   // columns
  rect(m, 19, 5, 20, 27, "v"); rect(m, 19, 28, 20, 29, "P");                       // the runner, gate to throne
  m[4][20] = "Y"; m[3][19] = "K"; m[3][21] = "K"; m[3][20] = "K";
  for (const [x, y] of [[16, 22], [23, 22], [16, 26], [23, 26], [15, 8], [24, 8]]) m[y][x] = "A";   // stone sentinels
  for (const [x, y] of [[11, 4], [28, 4], [5, 21], [34, 21]]) m[y][x] = "r";
  rect(m, 10, 3, 11, 3, "R"); m[22][8] = "d"; m[26][31] = "d";
  return {
    id: "citadel", name: "HAMON'S CITADEL", music: "intro", m, tents: [], bg: "throne", mood: "night", pal: "citadel", tree: "pine", seed: 77,
    props: [{ kind: "brazier", x: 16, y: 20 }, { kind: "brazier", x: 23, y: 20 }, { kind: "brazier", x: 16, y: 24 }, { kind: "brazier", x: 23, y: 24 },
            { kind: "brazier", x: 17, y: 6 }, { kind: "brazier", x: 22, y: 6 }, { kind: "brazier", x: 17, y: 12 }, { kind: "brazier", x: 22, y: 12 },
            { kind: "brazier", x: 14, y: 15 }, { kind: "brazier", x: 25, y: 15 },
            { kind: "banner", x: 10, y: 5 }, { kind: "banner", x: 10, y: 9 }, { kind: "banner", x: 10, y: 13 }, { kind: "banner", x: 29, y: 5 }, { kind: "banner", x: 29, y: 9 }, { kind: "banner", x: 29, y: 13 },
            { kind: "banner", x: 17, y: 19 }, { kind: "banner", x: 22, y: 19 },
            { kind: "sign", x: 12, y: 24, text: "By order of the Great Lord: no creature enters this house unbound." }],
    npcs: [
      { id: "kairn", x: 17, y: 21, dir: "right", look: "elite", trainer: "kairn", sight: 5 },
      { id: "seth", x: 22, y: 21, dir: "left", look: "elite", trainer: "seth", sight: 5 },
      { id: "hamon", x: 20, y: 6, dir: "down", look: "hamon", talk: "general", bossFlag: "beat_hamon" },
    ],
    warps: [{ x: 20, y: 29, to: "shrines", tx: 2, ty: 11, dir: "right" }, { x: 19, y: 29, to: "shrines", tx: 2, ty: 12, dir: "right" }],
    grass: [], heal: null,
    boss: { npc: "hamon", flag: "beat_hamon", trainer: "hamon", bg: "throne", zone: p => p.y <= 10 && p.x >= 15 && p.x <= 25, final: true,
            intro: ["HAMON: Three generals. Eleven years of war. And it ends with one soldier and a handful of beasts in my hall.",
                    "HAMON: I built the Warmons so that no one would ever have to bleed for me again. Do you understand? I ended suffering.",
                    "HAMON: Your creatures feel. Mine obey. Let us see which is the stronger faith."],
            after: ["HAMON: The sun... was supposed to... be mine...", "The Great Lord slumps against the gilt sunburst of his throne. The crowned engine beside him goes dark."] },
  };
}
// the braziers in the citadel stand on tiles the guards use; keep them off the walkway
MAPS.citadel = buildCitadel();
MAPS.hollow = buildHollow(); MAPS.shrines = buildShrines();

// ---------------------------------------------------------------- the hoverboard
const HOVERBOARD = {
  side: mk(24, 8, x => {
    R(x, "#0e0a1c", 1, 2, 22, 4); R(x, "#3a3e5a", 2, 3, 20, 2); R(x, "#5a6082", 3, 3, 18, 1); R(x, "#8088aa", 5, 3, 4, 1); R(x, "#8088aa", 14, 3, 3, 1);
    R(x, "#1ec8ba", 3, 5, 18, 1); R(x, "#6af0e4", 5, 6, 4, 1); R(x, "#6af0e4", 15, 6, 4, 1); R(x, "#c8fff8", 6, 6, 2, 1); R(x, "#c8fff8", 16, 6, 2, 1);
  }),
  front: mk(24, 8, x => {
    R(x, "#0e0a1c", 5, 2, 14, 4); R(x, "#3a3e5a", 6, 3, 12, 2); R(x, "#5a6082", 7, 3, 10, 1); R(x, "#8088aa", 9, 3, 6, 1);
    R(x, "#1ec8ba", 7, 5, 10, 1); R(x, "#6af0e4", 8, 6, 8, 1); R(x, "#c8fff8", 10, 6, 4, 1);
  }),
};

// ---------------------------------------------------------------- new conversations
const _talk = World.talk;
World.talk = async function (n) {
  const F = Game.flags;
  if (n.talk === "rigger") {
    if (F.board) return say("RIGGER: How is she riding? Keep her out of the buildings. The ceilings are murder.");
    if (!F.rig) {
      await say("RIGGER: See that heap by the fire? That was my hover-rig. Fastest thing on the front, until a Dominion courier lifted the drive core.");
      await say("RIGGER: He bolted north, into the old walls. Get the core back and the rig is yours. I am too old to ride the thing anyway.");
      F.rig = 1; Sound.fx("select"); return say("Quest taken: beat the Dominion courier in the Hollow ruins.");
    }
    if (!F.beat_pell) return say("RIGGER: The courier went north, into the ruins. Mind the rune stones. They bite.");
    F.board = true; F.rig = 2; Sound.fx("level");
    await say("RIGGER: That is my core! Give me a minute... there. Hear that hum?");
    await say("RIGGER: She is yours. Open the menu and pick BOARD to ride. Pick DISMOUNT to step off. She will not fit through a door.");
    return say(`${Game.player.name} received the HOVERBOARD!`);
  }
  if (n.talk === "supply3") {
    if (F.supply3) return say("QUARTERMASTER: That is the last of it. The mountain road is long. Ration your kits.");
    F.supply3 = true; Game.bag.kit += 3; Game.bag.rig += 3; Sound.fx("capture");
    return say("QUARTERMASTER: Waystation stores. Three FIELD KITS and three SOUL LINKS. The wood takes more than it gives.");
  }
  if (n.talk === "supply4") {
    if (F.supply4) return say("QUARTERMASTER: Nothing left but prayer flags. Go end this.");
    F.supply4 = true; Game.bag.kit += 4; Game.bag.rig += 2; Sound.fx("capture");
    return say("QUARTERMASTER: Four FIELD KITS and two SOUL LINKS. Everything the refuge can spare.");
  }
  return _talk.call(this, n);
};
