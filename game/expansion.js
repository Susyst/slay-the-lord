// Side regions off the main road: the Cinder Pits, the Drowned Marsh and the Windward Ridge.
// Each hangs off one of the campaign maps, carries its own trainers and wild mons, hides supply caches,
// and keeps one ancient creature that can be bound only once.

// ---------------------------------------------------------------- shaping helpers
// Rects read as rectangles. These two break the edges up so cliff rims and reed beds look cut by weather, not by a ruler.
const hsh = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
const NEAR_ROAD = ",pHUsrWdc";
function roughen(m, c, over, seed, grow = 0.38, eat = 0.22, guard = NEAR_ROAD) {
  const Hh = m.length, Ww = m[0].length, add = [], cut = [];
  const near = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m[y + dy] && guard.includes(m[y + dy][x + dx]));
  for (let y = 1; y < Hh - 1; y++) for (let x = 1; x < Ww - 1; x++) {
    if (m[y][x] !== c) continue;
    let edge = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = m[y + dy][x + dx];
      if (n !== c) edge = true;
      if (over.includes(n) && !near(x + dx, y + dy) && hsh(x + dx, y + dy, seed) < grow) add.push([x + dx, y + dy]);
    }
    if (edge && !near(x, y) && hsh(x, y, seed + 7) < eat) cut.push([x, y, over[0]]);
  }
  for (const [x, y] of add) m[y][x] = c;
  for (const [x, y, t] of cut) m[y][x] = t;
}

// ---------------------------------------------------------------- trainers
Object.assign(TRAINERS, {
  dune:  { name: "GRUNT DUNE", look: "grunt", team: [["howlpup", 11], ["scrapling", 11]],
           intro: "The pits are closed. Foreman's orders. Nobody digs but us.", lose: "Fine, dig. There's nothing down there but bones and old iron." },
  pike:  { name: "GRUNT PIKE", look: "grunt", team: [["noxdrone", 12], ["gloamcrow", 12]],
           intro: "Smell that? Coal and souls. Best work in the Dominion.", lose: "The foreman's going to dock me for this." },
  brunt: { name: "FOREMAN BRUNT", look: "officer", team: [["tuskit", 13], ["ironclad", 14], ["snarlwolf", 15]],
           intro: "Every Warmon on the front was forged from what we dig here. You're standing in Hamon's cradle, soldier.", lose: "Dig all you like. The cradle is empty. The Lord took everything that mattered east." },
  fenn:  { name: "GRUNT FENN", look: "grunt", team: [["lotadpole", 19], ["shadeling", 20]],
           intro: "Wet boots, wet rations, wet everything. And now you.", lose: "Go on, then. The deep marsh will finish what I started." },
  rook:  { name: "GRUNT ROOK", look: "grunt", team: [["antennelle", 20], ["noxmech", 21]],
           intro: "The Warden says there's something holy out on the far island. Says it like that's a bad thing.", lose: "Don't go out there. Please. It looks at you." },
  salt:  { name: "WARDEN SALT", look: "officer", team: [["lilyhop", 22], ["umbrafox", 22], ["hummite", 23]],
           intro: "Mirene sent me to drown whatever lives on that island. Three months. Not one of my Warmons will cross the last bridge.", lose: "Cross it yourself, then. Tell the Queen I tried." },
  vesk:  { name: "GRUNT VESK", look: "grunt", team: [["siegeclad", 30], ["wickwing", 30]],
           intro: "Thal says the wind up here talks. I say it's just wind. Either way, you're not going up.", lose: "Hear that? ...No? Lucky you." },
  ora:   { name: "GRUNT ORA", look: "grunt", team: [["gorehog", 31], ["sonarix", 31]],
           intro: "I lost two Warmons to the ridge. Not to soldiers. To the SOUND.", lose: "Cover your ears at the top. Promise me." },
  hale:  { name: "CAPT. HALE", look: "officer", team: [["howlwing", 33], ["cairnhart", 33], ["ragefang", 34]],
           intro: "The Keeper chained the old voice of this mountain. I am the lock. You will not be the key.", lose: "The lock... is broken. Go and hear it, then. Hear what we buried." },
});

// ---------------------------------------------------------------- the Cinder Pits (off the Western Front)
function buildCinder() {
  const m = blankMap(56, 24, "b");
  rect(m, 0, 0, 55, 1, "k"); rect(m, 0, 22, 55, 23, "k"); rect(m, 0, 0, 1, 23, "k"); rect(m, 54, 0, 55, 23, "k");
  rect(m, 46, 22, 49, 23, "b");                                           // the way down to the front
  // the haul road: up from the south gate, then west along the pits
  rect(m, 46, 14, 49, 21, ","); rect(m, 8, 14, 49, 15, ","); rect(m, 8, 8, 9, 15, ",");
  // the east pit: a ring of cut cliff with a ramp on its south side
  rect(m, 30, 3, 44, 10, "k"); rect(m, 32, 5, 42, 8, "b"); rect(m, 36, 9, 38, 10, "b");
  // the west pit, deeper, where the Dominion keeps its camp
  rect(m, 4, 3, 22, 11, "k"); rect(m, 6, 5, 20, 9, "b"); rect(m, 12, 10, 14, 11, "b");
  // the south quarry, half flooded with ash water
  rect(m, 14, 17, 36, 21, "k"); rect(m, 16, 18, 34, 20, "b"); rect(m, 22, 16, 24, 17, "b");
  // sandbags, wire and wreckage along the road
  rect(m, 26, 13, 40, 13, "w"); m[13][32] = "b"; m[13][33] = "b";
  rect(m, 44, 17, 45, 19, "S"); rect(m, 2, 13, 3, 13, "S");
  for (const [x, y] of [[41, 12], [20, 13], [50, 10], [12, 13], [28, 16]]) m[y][x] = "c";
  for (const [x, y] of [[50, 4], [51, 6], [48, 11], [40, 16], [10, 18], [6, 20]]) m[y][x] = "R";
  for (const [x, y] of [[52, 18], [3, 16], [38, 2], [27, 11], [45, 3]]) m[y][x] = "d";
  for (const [x, y] of [[34, 8], [18, 8], [42, 18], [8, 9]]) m[y][x] = "C";       // crates: two of them still hold something
  // ore carts, spoil heaps and shell holes so the haul road is not an empty corridor
  for (const [x, y] of [[26, 12], [31, 16], [52, 8], [24, 2], [47, 6], [11, 17], [38, 21], [3, 7], [20, 16], [43, 2], [50, 20], [6, 17]]) m[y][x] = "R";
  for (const [x, y] of [[29, 12], [16, 16], [45, 8], [36, 16], [9, 12], [53, 15]]) m[y][x] = "c";
  for (const [x, y] of [[22, 12], [39, 16], [49, 8], [13, 16], [5, 17], [33, 2]]) m[y][x] = "d";
  for (const [x, y] of [[26, 16], [44, 12], [10, 16]]) m[y][x] = "C";
  rect(m, 20, 12, 21, 12, "S"); rect(m, 50, 12, 51, 12, "S"); rect(m, 7, 16, 8, 16, "S");
  roughen(m, "k", ["b"], 131);                                                     // cut faces weather back into the ash
  rect(m, 6, 7, 20, 7, "b"); rect(m, 32, 7, 42, 7, "b"); rect(m, 16, 19, 34, 19, "b");   // but each pit floor stays one piece: a cart lane across the middle
  rect(m, 33, 5, 41, 7, ";"); rect(m, 7, 5, 13, 8, ";"); rect(m, 25, 18, 33, 20, ";");   // the scrub grows back after the rims are cut
  roughen(m, ";", ["b"], 137, 0.28, 0.16);
  const tents = [{ x: 14, y: 6, w: 3, h: 3, kind: "tent", side: "dominion", door: [15, 9], clutter: [["crate", 1], ["barrel", 40]], text: "The foreman's tent. Ore samples, a ledger of names, and a cage with the door torn off." },
                 { x: 50, y: 14, w: 3, h: 3, kind: "tent", side: "dominion", door: [51, 17], clutter: [["barrel", 4]], text: "A guard tent. Someone has scratched a tally into the pole. It stops at forty." }];
  return {
    id: "cinder", name: "THE CINDER PITS", music: "route", m, tents, bg: "front", mood: "dusk", tree: "pine", seed: 131,
    props: [{ kind: "fire", x: 41, y: 12 }, { kind: "fire", x: 12, y: 13 }, { kind: "brazier", x: 31, y: 11 }, { kind: "brazier", x: 43, y: 11 }, { kind: "brazier", x: 5, y: 12 },
            { kind: "brazier", x: 23, y: 12 }, { kind: "brazier", x: 47, y: 13 }, { kind: "lamp", x: 36, y: 11 }, { kind: "lamp", x: 13, y: 12 },
            { kind: "sign", x: 45, y: 16, text: "DOMINION QUARRY 3. Trespassers will be put to work." },
            { kind: "sign", x: 29, y: 12, text: "The east pit. Cut cliff, ash, and tall grass growing back where the ore gave out." },
            { kind: "sign", x: 10, y: 12, text: "The west pit. Deeper. The foreman keeps his camp at the bottom." },
            { kind: "banner", x: 45, y: 14 }, { kind: "banner", x: 45, y: 15 }],
    npcs: [
      { id: "dune", x: 37, y: 12, dir: "down", look: "grunt", trainer: "dune", sight: 3 },
      { id: "pike", x: 24, y: 14, dir: "right", look: "grunt", trainer: "pike", sight: 4 },
      { id: "brunt", x: 12, y: 7, dir: "down", look: "officer", trainer: "brunt", sight: 3 },
      { id: "sapper", x: 7, y: 6, dir: "right", look: "rookie", talk: "sapper" },
      { id: "warmon0", x: 29, y: 19, dir: "down", wild: ["ironclad", 16], name: "a dormant Warmon", lines: ["A Warmon prototype, half sunk in the ash. Its chest-plate opens on a soul that was never fully bound. It wakes."] },
    ],
    warps: [{ x: 47, y: 24, to: "front", tx: 47, ty: 2, dir: "down" }, { x: 48, y: 24, to: "front", tx: 48, ty: 2, dir: "down" }],
    caches: [{ x: 34, y: 8, item: "kit", n: 2 }, { x: 8, y: 9, item: "rig", n: 2 }],
    grass: [{ x0: 33, y0: 5, x1: 41, y1: 7, lv: [9, 12], mons: ["howlpup", "scrapling", "tuskit", "gloamcrow", "noxdrone", "glimmote"] },
            { x0: 7, y0: 5, x1: 13, y1: 8, lv: [11, 14], mons: ["scrapling", "tuskit", "howlpup", "shadeling", "snarlwolf", "noxdrone"] },
            { x0: 25, y0: 18, x1: 33, y1: 20, lv: [10, 13], mons: ["lotadpole", "antennelle", "scrapling", "gloamcrow", "echit"] }],
    heal: null,
  };
}

// ---------------------------------------------------------------- the Drowned Marsh (south of the Hollow Wood)
function buildMarsh() {
  const m = blankMap(56, 24, ".");
  rect(m, 0, 0, 55, 1, "T"); rect(m, 0, 22, 55, 23, "T"); rect(m, 0, 0, 1, 23, "T"); rect(m, 54, 0, 55, 23, "T");
  rect(m, 33, 0, 36, 1, ".");                                                     // the way up to the wood
  // two channels of black water cut the marsh into three bands; plank bridges cross them
  rect(m, 2, 6, 53, 7, "W"); rect(m, 2, 13, 53, 14, "W");
  rect(m, 14, 6, 15, 7, "H"); rect(m, 34, 6, 35, 7, "H"); rect(m, 48, 6, 49, 7, "H");
  rect(m, 8, 13, 9, 14, "H"); rect(m, 20, 13, 21, 14, "H"); rect(m, 40, 13, 41, 14, "H");
  rect(m, 24, 2, 25, 5, "W"); rect(m, 44, 9, 45, 11, "W"); rect(m, 18, 16, 19, 18, "W");   // inlets, open at one end
  // the saint's pool in the south-west: an island in black water, reached by one long plank walk
  rect(m, 2, 17, 13, 21, "W"); rect(m, 3, 19, 5, 20, "."); rect(m, 6, 19, 13, 19, "H");
  for (const [x, y] of [[2, 18], [6, 18], [2, 21], [6, 21], [3, 17], [5, 17]]) m[y][x] = "r";   // the old prayer stones, ringing the pool
  // the path, such as it is
  rect(m, 33, 2, 36, 5, ","); rect(m, 26, 9, 44, 10, ","); rect(m, 14, 8, 15, 12, ","); rect(m, 34, 8, 35, 9, ",");
  rect(m, 20, 15, 21, 20, ","); rect(m, 14, 19, 21, 20, ","); rect(m, 21, 17, 34, 17, ","); rect(m, 48, 8, 49, 12, ",");
  // reed beds, lilies, glow fungus, bloom trees
  rect(m, 38, 2, 52, 5, ";"); rect(m, 3, 2, 12, 5, ";"); rect(m, 30, 2, 32, 5, ";"); rect(m, 27, 5, 29, 5, ";");
  rect(m, 27, 11, 43, 12, ";"); rect(m, 3, 9, 12, 12, ";"); rect(m, 17, 9, 24, 12, ";"); rect(m, 46, 2, 52, 5, ";");
  rect(m, 23, 19, 34, 21, ";"); rect(m, 36, 15, 52, 18, ";"); rect(m, 37, 20, 52, 21, ";"); rect(m, 3, 15, 16, 16, ";");
  for (const [x, y] of [[17, 3], [30, 4], [8, 16], [47, 16], [52, 20], [20, 10], [48, 11], [29, 20]]) m[y][x] = "f";
  for (const [x, y] of [[31, 3], [5, 8], [36, 15], [45, 20], [3, 15], [20, 2], [12, 9], [26, 18], [50, 15]]) m[y][x] = "g";
  for (const [x, y] of [[29, 2], [51, 9], [4, 12], [27, 21], [16, 15], [43, 15]]) m[y][x] = "r";
  for (const [x, y] of [[18, 2], [41, 3], [45, 17], [16, 10], [52, 12], [22, 20], [10, 2], [34, 20]]) { m[y][x] = "Q"; m[y][x + 1] = "Q"; m[y + 1][x] = "Q"; m[y + 1][x + 1] = "Q"; }
  for (const [x, y] of [[22, 4], [49, 12], [7, 15], [38, 21], [14, 11], [31, 15]]) m[y][x] = "d";
  for (const [x, y] of [[37, 16], [7, 3], [24, 15]]) m[y][x] = "C";
  const tents = [{ x: 27, y: 2, w: 3, h: 3, kind: "tent", side: "allied", door: [28, 5], clutter: [["bucket", 2], ["barrel", 40]], text: "A fen-wife's hut, patched with tarp. Dried lilies hang from every pole, and the kettle is always on." }];
  return {
    id: "marsh", name: "THE DROWNED MARSH", music: "route", m, tents, bg: "hollow", mood: "dusk", pal: "hollow", tree: "pine", seed: 149,
    props: [{ kind: "lamp", x: 30, y: 8 }, { kind: "lamp", x: 26, y: 8 }, { kind: "fire", x: 22, y: 16 }, { kind: "lamp", x: 14, y: 20 },
            { kind: "sign", x: 37, y: 5, text: "THE DROWNED MARSH. Keep to the planks. What the water takes, it keeps." },
            { kind: "sign", x: 15, y: 18, text: "The last bridge. The reeds do not grow out there, and the frogs do not sing." }],
    npcs: [
      { id: "fenn", x: 42, y: 4, dir: "left", look: "grunt", trainer: "fenn", sight: 3 },
      { id: "rook", x: 18, y: 10, dir: "right", look: "grunt", trainer: "rook", sight: 4 },
      { id: "salt", x: 14, y: 18, dir: "down", look: "officer", trainer: "salt", sight: 3 },
      { id: "fenwife", x: 29, y: 6, dir: "left", look: "keeper", talk: "fenwife" },
      { id: "saint", x: 4, y: 19, dir: "right", wild: ["nirvanoad", 26], name: "the Marsh Saint", lines: ["The great frog sits in its ring of stones, eyes closed, a lily open on its back. The water around it is perfectly still.", "It opens one eye."] },
    ],
    warps: [{ x: 34, y: -1, to: "hollow", tx: 34, ty: 21, dir: "up" }, { x: 35, y: -1, to: "hollow", tx: 35, ty: 21, dir: "up" }],
    caches: [{ x: 37, y: 16, item: "rig", n: 2 }, { x: 7, y: 3, item: "kit", n: 3 }, { x: 24, y: 15, item: "kit", n: 2 }],
    grass: [{ x0: 38, y0: 2, x1: 52, y1: 5, lv: [17, 20], mons: ["lotadpole", "lilyhop", "antennelle", "echit", "shadeling", "glimmote"] },
            { x0: 3, y0: 2, x1: 12, y1: 5, lv: [18, 21], mons: ["lotadpole", "mossfawn", "echit", "hummite", "noxdrone"] },
            { x0: 27, y0: 2, x1: 32, y1: 5,  lv: [17, 20], mons: ["lotadpole", "antennelle", "glimmote", "echit", "shadeling"] },
            { x0: 27, y0: 11, x1: 43, y1: 12, lv: [18, 22], mons: ["lilyhop", "antennelle", "shadeling", "gloamcrow", "lotadpole", "stillhorn"] },
            { x0: 3, y0: 9, x1: 12, y1: 12, lv: [19, 22], mons: ["lilyhop", "umbrafox", "hummite", "mossfawn", "echit"] },
            { x0: 17, y0: 9, x1: 24, y1: 12, lv: [19, 22], mons: ["lilyhop", "lotadpole", "noxmech", "sonarix", "mossfawn"] },
            { x0: 3, y0: 15, x1: 16, y1: 16, lv: [20, 23], mons: ["lilyhop", "umbrafox", "hummite", "stillhorn", "noxmech"] },
            { x0: 23, y0: 19, x1: 34, y1: 21, lv: [20, 23], mons: ["lilyhop", "noxmech", "sonarix", "lotadpole", "shadeling", "wickwing"] },
            { x0: 36, y0: 15, x1: 52, y1: 18, lv: [19, 22], mons: ["lotadpole", "lilyhop", "antennelle", "echit", "gloamcrow", "mossfawn"] },
            { x0: 37, y0: 20, x1: 52, y1: 21, lv: [21, 24], mons: ["lilyhop", "umbrafox", "hummite", "stillhorn", "thrumantis"] }],
    heal: null,
  };
}

// ---------------------------------------------------------------- the Windward Ridge (above the High Shrines)
function buildRidge() {
  const m = blankMap(56, 24, ".");
  rect(m, 0, 0, 55, 1, "k"); rect(m, 0, 22, 55, 23, "k"); rect(m, 0, 0, 1, 23, "k"); rect(m, 54, 0, 55, 23, "k");
  rect(m, 15, 22, 18, 23, ".");                                           // the stair down to the shrines
  // four terraces climb from the south-east gate to the wind shrine in the north-west
  rect(m, 2, 17, 53, 18, "k"); rect(m, 2, 11, 53, 12, "k"); rect(m, 2, 5, 53, 6, "k");
  rect(m, 44, 17, 47, 18, "p"); rect(m, 8, 11, 11, 12, "p"); rect(m, 40, 5, 43, 6, "p");                 // the gaps in each wall
  rect(m, 15, 19, 18, 21, "p"); rect(m, 19, 20, 45, 20, "p"); rect(m, 44, 19, 47, 19, "p");           // bottom terrace road
  rect(m, 44, 13, 47, 16, "p"); rect(m, 10, 14, 47, 14, "p"); rect(m, 8, 13, 11, 14, "p");             // third terrace
  rect(m, 8, 7, 11, 10, "p"); rect(m, 11, 8, 42, 8, "p"); rect(m, 40, 7, 43, 7, "p");                  // second terrace
  rect(m, 40, 2, 43, 4, "p"); rect(m, 10, 3, 40, 3, "p"); rect(m, 4, 2, 12, 4, "p");                   // the summit shelf and the shrine
  // the wind shrine: a ring of rune stones around the old voice, and a soul station for those who come this far
  for (const [x, y] of [[3, 2], [3, 4], [8, 2], [8, 4], [5, 1], [6, 1]]) m[y][x] = "r";
  m[2][5] = "U"; m[2][7] = "s";
  // lanterns along the safe path, tall grass on the ledges, pines clinging to the rock
  for (const [x, y] of [[19, 19], [31, 19], [43, 21], [14, 13], [26, 13], [38, 15], [13, 9], [25, 7], [37, 9], [15, 2], [27, 4], [36, 2], [46, 12], [46, 18]]) m[y][x] = "s";
  rect(m, 21, 21, 30, 21, ";"); rect(m, 34, 21, 42, 21, ";"); rect(m, 3, 19, 13, 21, ";");
  rect(m, 16, 15, 24, 16, ";"); rect(m, 30, 15, 42, 16, ";"); rect(m, 3, 13, 7, 16, ";");
  rect(m, 14, 9, 22, 10, ";"); rect(m, 28, 9, 36, 10, ";"); rect(m, 46, 8, 52, 10, ";");
  rect(m, 18, 2, 25, 2, ";"); rect(m, 29, 4, 38, 4, ";"); rect(m, 46, 2, 52, 4, ";");
  for (const [x, y] of [[48, 20], [3, 9], [50, 14], [26, 18], [44, 9], [12, 19], [49, 2], [6, 15]]) { m[y][x] = "Q"; m[y][x + 1] = "Q"; m[y + 1][x] = "Q"; m[y + 1][x + 1] = "Q"; }
  for (const [x, y] of [[20, 16], [40, 10], [12, 2], [30, 21]]) m[y][x] = "g";
  for (const [x, y] of [[35, 13], [10, 19], [50, 7]]) m[y][x] = "d";
  for (const [x, y] of [[47, 10], [23, 4], [5, 21]]) m[y][x] = "C";
  for (const [x, y] of [[33, 2], [21, 8], [44, 16], [8, 21], [50, 5], [28, 19]]) m[y][x] = "R";   // rockfall along the terraces
  roughen(m, "k", ["."], 167);                                                     // the terrace walls are broken rock, not masonry
  roughen(m, ";", ["."], 173, 0.3, 0.18);
  return {
    id: "ridge", name: "THE WINDWARD RIDGE", music: "route", m, tents: [], bg: "shrine", mood: "night", pal: "shrine", tree: "pine", seed: 167,
    props: [{ kind: "fire", x: 46, y: 15 }, { kind: "fire", x: 10, y: 9 }, { kind: "banner", x: 13, y: 19 }, { kind: "banner", x: 20, y: 19 }, { kind: "banner", x: 13, y: 7 }, { kind: "banner", x: 10, y: 1 },
            { kind: "sign", x: 19, y: 21, text: "THE WINDWARD RIDGE. Four terraces to the old shrine. Follow the lanterns. Do not follow the singing." },
            { kind: "sign", x: 12, y: 13, text: "Third terrace. The wind here has words in it, if you stand still long enough." },
            { kind: "sign", x: 9, y: 5, text: "The wind shrine. Built for the voice under the mountain, long before Thal chained it." }],
    npcs: [
      { id: "vesk", x: 45, y: 21, dir: "left", look: "grunt", trainer: "vesk", sight: 3 },
      { id: "ora", x: 28, y: 14, dir: "left", look: "grunt", trainer: "ora", sight: 4 },
      { id: "hale", x: 9, y: 8, dir: "down", look: "officer", trainer: "hale", sight: 4 },
      { id: "pilgrim", x: 33, y: 20, dir: "left", look: "keeper", talk: "pilgrim" },
      { id: "voice", x: 5, y: 3, dir: "down", wild: ["resonyx", 38], name: "the Voice of the Ridge", lines: ["Something vast sits inside the ring of stones, ears like sails, perfectly still. The wind stops.", "Then it SINGS."] },
    ],
    warps: [{ x: 16, y: 24, to: "shrines", tx: 16, ty: 2, dir: "down" }, { x: 17, y: 24, to: "shrines", tx: 17, ty: 2, dir: "down" }],
    caches: [{ x: 47, y: 10, item: "kit", n: 3 }, { x: 23, y: 4, item: "rig", n: 3 }, { x: 5, y: 21, item: "rig", n: 1 }],
    grass: [{ x0: 21, y0: 21, x1: 42, y1: 21, lv: [28, 31], mons: ["wickwing", "sonarix", "stillhorn", "hummite", "ironclad", "tuskit"] },
            { x0: 3, y0: 19, x1: 13, y1: 21, lv: [29, 32], mons: ["howlwing", "siegeclad", "umbrafox", "gorehog", "sonarix"] },
            { x0: 16, y0: 15, x1: 42, y1: 16, lv: [29, 32], mons: ["wickwing", "howlwing", "stillhorn", "hummite", "snarlwolf", "beaconmoth"] },
            { x0: 3, y0: 13, x1: 7, y1: 16, lv: [30, 33], mons: ["cairnhart", "howlwing", "siegeclad", "sonarix"] },
            { x0: 14, y0: 9, x1: 52, y1: 10, lv: [30, 33], mons: ["howlwing", "wickwing", "gorehog", "umbrafox", "noxmech", "stillhorn"] },
            { x0: 18, y0: 2, x1: 25, y1: 2, lv: [31, 34], mons: ["beaconmoth", "cairnhart", "siegeclad", "howlwing", "thrumantis", "shroudcrow"] },
            { x0: 29, y0: 4, x1: 38, y1: 4, lv: [31, 34], mons: ["beaconmoth", "thrumantis", "howlwing", "siegeclad", "shroudcrow", "nyxvulpa"] },
            { x0: 46, y0: 2, x1: 52, y1: 4, lv: [31, 34], mons: ["cairnhart", "beaconmoth", "ragefang", "thrumantis", "monolith"] }],
    heal: null,
  };
}

MAPS.cinder = buildCinder(); MAPS.marsh = buildMarsh(); MAPS.ridge = buildRidge();

// ---------------------------------------------------------------- doors cut into the campaign maps
{
  const F = MAPS.front; rect(F.m, 46, 0, 49, 1, "b"); rect(F.m, 46, 2, 49, 2, "b");
  F.warps.push({ x: 47, y: -1, to: "cinder", tx: 47, ty: 21, dir: "up" }, { x: 48, y: -1, to: "cinder", tx: 48, ty: 21, dir: "up" });
  F.props.push({ kind: "sign", x: 45, y: 2, text: "North: Dominion Quarry 3, the Cinder Pits. Allied personnel keep out. (Someone has scratched out the last line.)" });
  const Hm = MAPS.hollow; rect(Hm.m, 33, 22, 36, 23, "."); for (let y = 14; y <= 21; y++) for (let x = 34; x <= 35; x++) if (Hm.m[y][x] === "." || Hm.m[y][x] === "g") Hm.m[y][x] = ",";
  Hm.warps.push({ x: 34, y: 24, to: "marsh", tx: 34, ty: 2, dir: "down" }, { x: 35, y: 24, to: "marsh", tx: 35, ty: 2, dir: "down" });
  Hm.props.push({ kind: "sign", x: 33, y: 14, text: "South: the Drowned Marsh. The waystation does not send patrols there any more." });
  const S = MAPS.shrines; rect(S.m, 15, 0, 18, 4, "p"); rect(S.m, 15, 0, 18, 1, "p");
  S.warps.push({ x: 16, y: -1, to: "ridge", tx: 16, ty: 21, dir: "up" }, { x: 17, y: -1, to: "ridge", tx: 17, ty: 21, dir: "up" });
  S.props.push({ kind: "sign", x: 14, y: 5, text: "North stair: the Windward Ridge. The Keeper's men hold it. The lanterns were lit by someone else." });
  for (const id of ["front", "hollow", "shrines"]) MAPS[id].paint = null;
}

// ---------------------------------------------------------------- hooks: ancient creatures, crates, new conversations
const _load = World.load;
World.load = function (id, x, y, dir) {
  _load.call(this, id, x, y, dir);
  for (const n of this.map.npcs) if (n.wild) n.gone = !!Game.flags["gone_" + n.id];
};

// the ancient creatures are mons, not soldiers: their overworld sprite is the battle art, shrunk and bobbing
const WILD_SPR = {};
function wildSprite(n, t) {
  const id = n.wild[0], art = MON_ART[id] && MON_ART[id].front;
  let c = WILD_SPR[id];
  if (!c) { c = WILD_SPR[id] = document.createElement("canvas"); c.width = c.height = 48; c.drew = false; }
  const bob = Math.round(Math.sin(t / 620 + n.x) * 1.5);                      // it breathes where it sits
  if (art && art.width && (!c.drew || c.bob !== bob)) {
    const x = c.getContext("2d"); x.clearRect(0, 0, 48, 48); x.imageSmoothingEnabled = false;
    x.drawImage(art, 0, 0, art.width, art.height, 5, 8 + bob, 38, 38);
    c.drew = true; c.bob = bob;
  }
  return c;
}
const _frameFor = World.frameFor;
World.frameFor = function (o, look, t) { return o.wild ? wildSprite(o, t) : _frameFor.call(this, o, look, t); };

const _interact = World.interact;
World.interact = function () {
  const p = this.player, [dx, dy] = DIRS[p.dir], tx = p.x + dx, ty = p.y + dy;
  if (this.tile(tx, ty) === "C" && !this.npcAt(tx, ty)) {
    const cache = (this.map.caches || []).find(c => c.x === tx && c.y === ty), key = `cache_${this.map.id}_${tx}_${ty}`;
    return this.run(async () => {
      if (!cache) return say("A supply crate, nailed shut. Whatever was inside left with the Dominion.");
      if (Game.flags[key]) return say("The crate you opened. Empty now.");
      Game.flags[key] = true; Game.bag[cache.item] += cache.n; Sound.fx("capture");
      await say(`The lid comes away. ${cache.n} ${ITEMS[cache.item].name}${cache.n > 1 ? "S" : ""} inside, still in their wrapping!`);
      Game.autosave();
    });
  }
  return _interact.call(this);
};

const _talk2 = World.talk;
World.talk = async function (n) {
  const F = Game.flags;
  if (n.wild) {
    for (const l of n.lines) await say(l);
    const [id, lv] = n.wild;
    const res = await startBattle({ foes: [makeMon(id, lv)], bg: this.map.bg, music: "boss" });
    if (res === "caught") { n.gone = true; F["gone_" + n.id] = true; await say(`${n.name[0].toUpperCase() + n.name.slice(1)} is bound to your soul. The stones around it go quiet.`); }
    else if (res === "win") { n.gone = true; F["gone_" + n.id] = true; await say(`${n.name[0].toUpperCase() + n.name.slice(1)} sinks back into the ground, and does not rise again.`); }
    else await say("It settles back among the stones, watching you.");
    Game.autosave(); return;
  }
  if (n.talk === "sapper") {
    if (!F.beat_brunt) return say("SAPPER: Allied engineer, third sappers. They took my squad for the forges. Foreman keeps the key on him. Get it and I can walk.");
    if (F.sapper) return say("SAPPER: I'm heading back to Outpost 7 the long way. If the pits ever open again, burn them.");
    F.sapper = true; Game.bag.rig += 3; Game.bag.kit += 2; Sound.fx("capture");
    await say("SAPPER: The key! Thank you. I hid my kit under the ore cart before they took me. Three SOUL LINKS and two FIELD KITS. Yours.");
    return say("SAPPER: One more thing. There's a Warmon in the south quarry they never finished. If it wakes, it's not theirs. It could be yours.");
  }
  if (n.talk === "fenwife") {
    if (F.gone_saint) return say("FEN-WIFE: The frogs are singing again. Whatever you did on the island, the marsh thanks you.");
    if (F.fenwife) return say("FEN-WIFE: The Saint sits on the far island, past the last bridge. Weaken it if you must. But ask first.");
    F.fenwife = true; Game.bag.rig += 2; Sound.fx("capture");
    await say("FEN-WIFE: Dominion boots on my planks all season, and now Allied ones. Sit. Tea is on.");
    await say("FEN-WIFE: Before the war, folk crossed this marsh to pray to a great frog on the far island. We called it the Saint. The Dominion calls it a target.");
    await say("FEN-WIFE: Their Warden cannot get his iron beasts across the last bridge. They will not go. Something in the water tells them no.");
    return say("FEN-WIFE: Take these two SOUL LINKS. If the Saint chooses you, the Queen in the wood will have one less thing to drown.");
  }
  if (n.talk === "pilgrim") {
    if (F.gone_voice) return say("PILGRIM: The mountain is singing again. I can go home now. I think I can go home.");
    if (F.pilgrim) return say("PILGRIM: Four terraces. The lanterns are mine. The soldiers are Thal's. The voice at the top belongs to no one.");
    F.pilgrim = true; Game.bag.kit += 2; Sound.fx("capture");
    await say("PILGRIM: You climb at night too? Good. The wind is kinder in the dark.");
    await say("PILGRIM: Before the Keeper, pilgrims climbed to the wind shrine to hear the Voice of the Ridge. It sang the weather, the dead, the way home.");
    await say("PILGRIM: Thal chained it under the stones. His captain holds the summit shelf. Below that, the usual Dominion welcome.");
    return say("PILGRIM: Two FIELD KITS. I keep the lanterns lit. You keep walking.");
  }
  return _talk2.call(this, n);
};
