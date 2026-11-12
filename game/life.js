// Everything that moves when the player is standing still: wandering soldiers, drilling recruits,
// birds, butterflies, fireflies, bats, embers, smoke, water rings and gusts of wind.

// ---------------------------------------------------------------- what lives where
// read off the map's own mood and palette so a new map gets the right wildlife for free
function biome(map) {
  if (map.interior) return { air: ["mote"], ground: [], gust: null };
  if (map.id === "cinder") return { air: ["ash", "ember"], ground: ["beetle"], gust: "#b8a48c", gusty: 0.5 };
  if (map.pal === "citadel") return { air: ["ember"], ground: [], gust: "#e8b640", gusty: 0.15 };   // no wildlife in the Lord's house: only the braziers
  if (map.pal === "shrine") return { air: ["bat", "firefly"], ground: [], gust: "#dce8f4", gusty: 0.7 };
  if (map.pal === "hollow") return { air: ["firefly", "moth"], ground: ["frog"], gust: "#c898e8", gusty: 0.25 };
  if (map.mood === "night") return { air: ["bat", "firefly"], ground: [], gust: "#c8d8e8", gusty: 0.2 };
  if (map.mood === "dusk") return { air: ["firefly", "bird"], ground: ["beetle"], gust: "#e8c88c", gusty: 0.3 };
  return { air: ["bird", "butterfly"], ground: ["beetle"], gust: "#c8f088", gusty: 0.3 };
}

const Life = {
  map: null, things: [], tick: -1, grass: [], water: [], heat: [], gust: 0, chat: null,

  // a new map: find the tall grass, the open water and the fires once, not every frame
  survey(map) {
    this.map = map; this.things = []; this.grass = []; this.water = []; this.heat = []; this.gust = 0; this.chat = null;
    this.bio = biome(map);
    for (let y = 0; y < map.m.length; y++) for (let x = 0; x < map.m[0].length; x++) {
      const c = map.m[y][x];
      if (c === ";") this.grass.push([x, y]);
      else if (c === "W" && map.m[y - 1] && map.m[y - 1][x] === "W") this.water.push([x, y]);   // not the shoreline row, so rings stay in the water
    }
    for (const p of map.props || []) if (p.kind === "fire" || p.kind === "brazier") this.heat.push([p.x, p.y]);
    for (const t of map.tents || []) if (t.kind === "tent" || t.style) this.heat.push([t.x + ((t.w / 2) | 0), t.y, true]);   // a cook fire inside the tent: smoke only
  },

  add(o) { if (this.things.length < 46) this.things.push(o); },
  pick(a) { return a[(Math.random() * a.length) | 0]; },

  // ---------------------------------------------------------------- one step of the world's own life
  step(cx, cy) {
    const map = World.map, W2 = 240, H2 = 160;
    const onScreen = (x, y, pad = 40) => x > cx - pad && x < cx + W2 + pad && y > cy - pad && y < cy + H2 + pad;
    const bio = this.bio;

    for (const o of this.things) {
      o.t++;
      o.x += o.vx; o.y += o.vy;
      if (o.kind === "bird") { o.vy = Math.sin(o.t / 40) * 0.08; }
      else if (o.kind === "bat") { o.vx += (Math.random() - 0.5) * 0.3; o.vy += (Math.random() - 0.5) * 0.3; o.vx = Math.max(-1.3, Math.min(1.3, o.vx)); o.vy = Math.max(-0.8, Math.min(0.8, o.vy)); }
      else if (o.kind === "butterfly" || o.kind === "moth") { o.vx += (Math.random() - 0.5) * 0.14; o.vy = Math.sin(o.t / 11) * 0.3; o.vx = Math.max(-0.5, Math.min(0.5, o.vx)); }
      else if (o.kind === "firefly") { o.vx += (Math.random() - 0.5) * 0.06; o.vy += (Math.random() - 0.5) * 0.06; o.vx *= 0.95; o.vy *= 0.95; }
      else if (o.kind === "ember" || o.kind === "ash") { o.vx += (Math.random() - 0.5) * 0.05; o.vy *= 0.99; }
      else if (o.kind === "smoke") { o.vx += 0.004; o.r += 0.035; }
      else if (o.kind === "leaf") { o.vy = Math.sin(o.t / 9) * 0.25 + 0.05; }
      else if (o.kind === "beetle" || o.kind === "frog") {                      // ground critters freeze, hop, and bolt when stepped near
        const p = World.player, dist = Math.hypot(p.x * 16 + 8 - o.x, p.y * 16 + 8 - o.y);
        if (dist < 26 && !o.fled) { o.fled = true; o.life = Math.min(o.life, 46); const a = Math.atan2(o.y - (p.y * 16 + 8), o.x - (p.x * 16 + 8)); o.vx = Math.cos(a) * 0.9; o.vy = Math.sin(a) * 0.9; if (o.kind === "frog") this.add({ kind: "ring", x: o.x, y: o.y, vx: 0, vy: 0, t: 0, life: 26, r: 1 }); }
        else if (!o.fled) { if (o.t % o.beat === 0) { const d = this.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); o.vx = d[0] * 0.22; o.vy = d[1] * 0.22; } if (o.t % o.beat === 9) { o.vx = 0; o.vy = 0; } }
      }
      else if (o.kind === "ring") o.r += 0.22;
      o.life--;
    }
    this.things = this.things.filter(o => o.life > 0 && onScreen(o.x, o.y, 80));

    // ---- spawning, all of it rate-limited and only just off the edge of the view
    const near = (list) => { const got = []; for (const g of list) { const X = g[0] * 16 + 8, Y = g[1] * 16 + 8; if (onScreen(X, Y, 8)) got.push([X, Y, g[2]]); } return got; };

    for (const kind of bio.air) {
      if (kind === "bird" && Math.random() < 0.004) {                            // a flight of birds crosses the sky
        const dir = Math.random() < 0.5 ? 1 : -1, y = cy - 10 + Math.random() * 60;
        for (let i = 0, n = 2 + ((Math.random() * 3) | 0); i < n; i++)
          this.add({ kind: "bird", x: cx + (dir > 0 ? -30 - i * 11 : 270 + i * 11), y: y + i * 5 - Math.random() * 4, vx: dir * (1.1 + Math.random() * 0.4), vy: 0, t: i * 7, life: 400, col: "#2a2436" });
      }
      if (kind === "bat" && Math.random() < 0.012 && this.things.filter(o => o.kind === "bat").length < 4)
        this.add({ kind: "bat", x: cx + Math.random() * 240, y: cy - 20, vx: (Math.random() - 0.5), vy: 0.4, t: 0, life: 260, col: "#1a1626" });
      if ((kind === "butterfly" || kind === "moth") && Math.random() < 0.03) {
        const g = near(this.grass); if (g.length && this.things.filter(o => o.kind === kind).length < 5) {
          const [X, Y] = this.pick(g);
          this.add({ kind, x: X, y: Y - 6, vx: (Math.random() - 0.5) * 0.4, vy: 0, t: 0, life: 300, col: kind === "moth" ? "#e8dcf8" : this.pick(["#f8d860", "#f89ac8", "#f8f0d0"]) });
        }
      }
      if (kind === "firefly" && Math.random() < 0.05 && this.things.filter(o => o.kind === "firefly").length < 9)
        this.add({ kind: "firefly", x: cx + Math.random() * 240, y: cy + 20 + Math.random() * 130, vx: 0, vy: 0, t: (Math.random() * 60) | 0, life: 260, col: World.map.pal === "shrine" ? "#9ae8ff" : "#d8f880" });
      if (kind === "ash" && Math.random() < 0.22)
        this.add({ kind: "ash", x: cx + Math.random() * 260 - 10, y: cy - 8, vx: 0.18 + Math.random() * 0.2, vy: 0.14 + Math.random() * 0.14, t: 0, life: 420, col: Math.random() < 0.3 ? "#6a5f58" : "#9a8e84" });
    }

    // fires: embers up, smoke above them; tents: just a thread of cook smoke
    for (const h of near(this.heat)) {
      if (!h[2] && bio.air.includes("ember") || !h[2] && Math.random() < 0.3)
        if (Math.random() < 0.3) this.add({ kind: "ember", x: h[0] + (Math.random() - 0.5) * 6, y: h[1] + 4, vx: (Math.random() - 0.5) * 0.2, vy: -0.5 - Math.random() * 0.3, t: 0, life: 40 + Math.random() * 30, col: Math.random() < 0.4 ? "#ffd27a" : "#ff8a3a" });
      if (Math.random() < (h[2] ? 0.018 : 0.05) && this.things.filter(o => o.kind === "smoke").length < 9)
        this.add({ kind: "smoke", x: h[0] + (Math.random() - 0.5) * 4, y: h[1] - (h[2] ? 10 : 2), vx: 0.05, vy: -0.22 - Math.random() * 0.1, t: 0, life: 90 + Math.random() * 40, r: 1 + Math.random(), col: h[2] ? "#9a9088" : "#7a7068" });
    }

    // the water is never quite still
    if (Math.random() < 0.12) { const w = near(this.water); if (w.length) { const [X, Y] = this.pick(w); this.add({ kind: "ring", x: X + (Math.random() - 0.5) * 10, y: Y + (Math.random() - 0.5) * 10, vx: 0, vy: 0, t: 0, life: 30, r: 0.5 }); } }

    // things living in the tall grass
    for (const kind of bio.ground) {
      const cap = kind === "frog" ? 2 : 3;
      if (Math.random() < 0.02 && this.things.filter(o => o.kind === kind).length < cap) {
        const g = near(kind === "frog" ? this.water.concat(this.grass) : this.grass);
        if (g.length) { const [X, Y] = this.pick(g); this.add({ kind, x: X + (Math.random() - 0.5) * 8, y: Y + 4, vx: 0, vy: 0, t: 0, life: 300, beat: 40 + ((Math.random() * 50) | 0), col: kind === "frog" ? "#6aa84c" : "#3a3a2c" }); }
      }
    }

    // a gust every so often, carrying whatever this place has to carry
    if (bio.gust) {
      if (this.gust > 0) { this.gust--; if (Math.random() < 0.14 && this.things.filter(o => o.kind === "leaf").length < 7) this.add({ kind: "leaf", x: cx - 8, y: cy + Math.random() * 160, vx: 1.1 + Math.random() * 0.9, vy: 0, t: 0, life: 230, col: bio.gust }); }
      else if (Math.random() < 0.0016 * (bio.gusty || 0.3) * 10) this.gust = 40 + ((Math.random() * 40) | 0);
    }
  },

  // two soldiers within earshot of each other will natter: a bubble of dots over whoever is talking
  chatTick() {
    const map = World.map;
    if (this.chat) { if (--this.chat.t > 0) return; this.chat = null; }
    if (World.busy || Math.random() > 0.006) return;
    const talkers = map.npcs.filter(n => !n.gone && !n.wild && !n.bossFlag &&
      map.npcs.some(o => o !== n && !o.gone && !o.wild && Math.abs(o.x - n.x) + Math.abs(o.y - n.y) <= 4));
    if (!talkers.length) return;
    const n = this.pick(talkers);
    const other = map.npcs.find(o => o !== n && !o.gone && Math.abs(o.x - n.x) + Math.abs(o.y - n.y) <= 4);
    if (other && !other.trainer && !other.bossFlag) other.dir = Math.abs(other.x - n.x) > Math.abs(other.y - n.y) ? (n.x > other.x ? "right" : "left") : (n.y > other.y ? "down" : "up");
    if (!n.trainer) n.dir = Math.abs(other.x - n.x) > Math.abs(other.y - n.y) ? (other.x > n.x ? "right" : "left") : (other.y > n.y ? "down" : "up");
    this.chat = { n, t: 90 + ((Math.random() * 60) | 0), max: 150 };
  },

  drawChat(ctx, cx, cy) {
    if (!this.chat) return;
    const n = this.chat.n, X = Math.round(n.x * 16 - cx), Y = Math.round(n.y * 16 - cy) - 18;
    if (X < -16 || X > 250 || Y < -12 || Y > 170) return;
    R(ctx, "#0d0a10", X + 2, Y, 13, 10); R(ctx, "#e6dcc8", X + 3, Y + 1, 11, 8); R(ctx, "#0d0a10", X + 6, Y + 9, 3, 2); R(ctx, "#e6dcc8", X + 6, Y + 9, 2, 1);
    const lit = Math.floor((this.chat.t / 11) % 4);                        // three dots, typing
    for (let i = 0; i < 3; i++) R(ctx, i < 3 - lit ? "#6a6058" : "#b8aca0", X + 5 + i * 3, Y + 4, 2, 2);
  },

  // ---------------------------------------------------------------- drawing
  draw(ctx, cx, cy, t) {
    this.drawChat(ctx, cx, cy);
    for (const o of this.things) {
      const X = Math.round(o.x - cx), Y = Math.round(o.y - cy), k = o.life;
      if (X < -8 || Y < -8 || X > 248 || Y > 168) continue;
      switch (o.kind) {
        case "bird": {                                                   // two strokes of a wing, flapping
          const f = Math.floor(o.t / 7) % 4, up = f === 0 || f === 2 ? 0 : f === 1 ? -1 : 1;
          ctx.globalAlpha = 0.85;
          R(ctx, o.col, X - 2, Y + up, 2, 1); R(ctx, o.col, X + 1, Y + up, 2, 1); R(ctx, o.col, X, Y + 1, 1, 1);
          ctx.globalAlpha = 1; break;
        }
        case "bat": {
          const f = Math.floor(o.t / 4) % 2;
          R(ctx, o.col, X - 2, Y + (f ? 0 : 1), 2, 1); R(ctx, o.col, X + 1, Y + (f ? 0 : 1), 2, 1); R(ctx, o.col, X, Y, 1, 2); break;
        }
        case "butterfly": case "moth": {
          const f = Math.floor(o.t / 5) % 2;
          ctx.globalAlpha = Math.min(1, k / 30);
          if (f) { R(ctx, o.col, X - 1, Y, 1, 2); R(ctx, o.col, X + 1, Y, 1, 2); } else { R(ctx, o.col, X - 2, Y, 2, 1); R(ctx, o.col, X + 1, Y, 2, 1); }
          R(ctx, "#2a2436", X, Y, 1, 1); ctx.globalAlpha = 1; break;
        }
        case "firefly": {
          const pulse = 0.25 + 0.75 * Math.max(0, Math.sin(o.t / 26));
          ctx.globalAlpha = pulse * Math.min(1, k / 40);
          R(ctx, o.col, X, Y, 1, 1);
          ctx.globalAlpha *= 0.35; R(ctx, o.col, X - 1, Y, 3, 1); R(ctx, o.col, X, Y - 1, 1, 3);
          ctx.globalAlpha = 1; break;
        }
        case "ember": ctx.globalAlpha = Math.min(1, k / 25); R(ctx, o.col, X, Y, 1, 1); ctx.globalAlpha = 1; break;
        case "ash": ctx.globalAlpha = 0.5 + 0.3 * Math.sin(o.t / 14); R(ctx, o.col, X, Y, 1, 1); ctx.globalAlpha = 1; break;
        case "leaf": ctx.globalAlpha = Math.min(1, k / 40) * 0.8; R(ctx, o.col, X, Y, Math.sin(o.t / 9) > 0 ? 2 : 1, 1); ctx.globalAlpha = 1; break;
        case "smoke": {
          const r = Math.max(1, Math.round(o.r));
          ctx.globalAlpha = Math.min(0.42, k / 150) * 0.9;
          R(ctx, o.col, X - r, Y, r * 2 + 1, 1);                                  // a diamond reads as a puff where a square reads as a crate
          for (let i = 1; i <= r; i++) { const w = r - i; R(ctx, o.col, X - w, Y - i, w * 2 + 1, 1); R(ctx, o.col, X - w, Y + i, w * 2 + 1, 1); }
          ctx.globalAlpha = 1; break;
        }
        case "ring": {
          const r = Math.round(o.r);
          ctx.globalAlpha = Math.min(0.7, k / 36);
          R(ctx, "#dff4ff", X - r, Y, r * 2 + 1, 1); R(ctx, "#dff4ff", X - r + 1, Y - 1, r * 2 - 1, 1); R(ctx, "#dff4ff", X - r + 1, Y + 1, r * 2 - 1, 1);
          ctx.globalAlpha = 1; break;
        }
        case "beetle": R(ctx, o.col, X, Y, 2, 1); break;
        case "frog": { const hop = o.fled ? -Math.round(Math.abs(Math.sin(o.t / 5)) * 3) : 0; R(ctx, o.col, X, Y + hop, 3, 2); R(ctx, "#2a2436", X, Y - 1 + hop, 1, 1); R(ctx, "#2a2436", X + 2, Y - 1 + hop, 1, 1); break; }
      }
    }
  },
};

// ---------------------------------------------------------------- people who do not stand like statues
// Anyone whose facing matters (trainers watching their lane, bosses, anyone mid-conversation) is left alone.
const ROAMERS = { rookie: 3, scout: 3, soldier: 3, quarter: 0, medic: 0, keeper: 0, commander: 0, rigger: 0 };
function liveliness() {
  const map = World.map, p = World.player;
  if (!map || World.busy || Game.scene !== "world") return;
  for (const n of map.npcs) {
    if (n.gone || n.trainer || n.bossFlag || n.wild || n.moving) continue;
    const r = ROAMERS[n.look]; if (r === undefined) continue;
    if (n.wait === undefined) n.wait = 60 + ((Math.random() * 180) | 0);
    if (--n.wait > 0) continue;
    n.wait = 90 + ((Math.random() * 240) | 0);
    if (n.drill && Math.random() < 0.5) { n.act = { kind: "attack", t0: Game.ticks }; Sound.fx && Math.random() < 0.25 && Sound.fx("swing"); continue; }
    const dir = ["up", "down", "left", "right"][(Math.random() * 4) | 0];
    n.dir = dir;                                                   // a glance costs nothing, a step has to be safe
    if (!r || Math.random() < 0.35) continue;
    const [dx, dy] = DIRS[dir], tx = n.x + dx, ty = n.y + dy;
    if (Math.abs(tx - n.home[0]) > r || Math.abs(ty - n.home[1]) > r) return;
    if (World.blocked(tx, ty) || (tx === p.x && ty === p.y)) continue;
    if (map.warps.some(w => w.x === tx && w.y === ty)) continue;                     // never park in a doorway
    let open = 0; for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!World.blocked(tx + ax, ty + ay)) open++;
    if (open < 3) continue;                                                          // nor in a gap someone has to squeeze through
    n.moving = true; n.t = 0; n.speed = 1;
  }
}

// a few soldiers are drilling rather than loitering
for (const [id, nid] of [["camp", "scout"], ["camp", "oda"]]) {
  const n = MAPS[id] && MAPS[id].npcs.find(q => q.id === nid); if (n) n.drill = true;
}

// ---------------------------------------------------------------- hook it into the frame
const _drawAmbient = World.drawAmbient;
World.drawAmbient = function (ctx, cx, cy, t) {
  if (Life.map !== this.map) Life.survey(this.map);
  if (Life.tick !== Game.ticks) { Life.tick = Game.ticks; Life.step(cx, cy); Life.chatTick(); liveliness(); }
  _drawAmbient.call(this, ctx, cx, cy, t);
  Life.draw(ctx, cx, cy, t);
};
