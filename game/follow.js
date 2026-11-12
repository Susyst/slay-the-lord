// The first mon in the squad walks the ground you just walked, a step behind you.

const Follow = {
  trail: [], obj: { x: 0, y: 0, t: 0, dir: "down", moving: false, follower: true, step: 0 }, moved: 0,

  reset() { this.trail.length = 0; this.moved = 0; },

  // remember where the player has been, in pixels, newest first
  tick() {
    const p = World.player, [dx, dy] = p.moving ? DIRS[p.dir] : [0, 0];
    const x = p.x * TS + dx * p.t, y = p.y * TS + dy * p.t, head = this.trail[0];
    if (head && head.x === x && head.y === y) { if (this.moved > 0) this.moved--; return; }
    this.trail.unshift({ x, y, dir: p.dir });
    if (this.trail.length > 72) this.trail.pop();
    this.moved = 8;                                                    // still walking, for a few frames yet
  },

  // the point one tile back along that path, so it rounds corners instead of cutting them
  spot() {
    const GAP = 23;
    let d = 0;
    for (let i = 1; i < this.trail.length; i++) {
      d += Math.abs(this.trail[i - 1].x - this.trail[i].x) + Math.abs(this.trail[i - 1].y - this.trail[i].y);
      if (d >= GAP) return this.trail[i];
    }
    return null;                                                       // not enough path yet: stay hidden
  },

  mon() { return Game.party.find(m => m && m.hp > 0) || Game.party[0]; },

  actor() {
    if (Game.opts.follower === false || !Game.party.length || Game.riding) return null;
    const s = this.spot(), m = this.mon();
    if (!s || !m || !MON_ART[m.id]) return null;
    const o = this.obj;
    o.x = s.x / TS; o.y = s.y / TS; o.dir = s.dir; o.moving = false; o.id = m.id; o.walking = this.moved > 0;
    return [o, "follower"];
  },
};

// ---------------------------------------------------------------- drawn from its own battle art
const FOLLOW_SPR = {};
function followSprite(o, t) {
  const art = MON_ART[o.id] && MON_ART[o.id].front;
  const flip = o.dir === "left";
  const hop = o.walking ? [0, -1, 0, 1][Math.floor(t / 130) % 4] : Math.round(Math.sin(t / 620)) * -1;
  const key = o.id + (flip ? "L" : "R") + hop;
  let c = FOLLOW_SPR[key];
  if (!c) {
    c = FOLLOW_SPR[key] = document.createElement("canvas"); c.width = c.height = 48;
    if (art && art.width) {
      const x = c.getContext("2d"), H = 22, y0 = 43 - H + hop;
      x.imageSmoothingEnabled = false;
      if (flip) { x.translate(48, 0); x.scale(-1, 1); }
      x.drawImage(art, 0, 0, art.width, art.height, 13, y0, H, H);
    } else { FOLLOW_SPR[key] = null; return document.createElement("canvas"); }
  }
  return c;
}

const _followFrame = World.frameFor;
World.frameFor = function (o, look, t) { return o && o.follower ? followSprite(o, t) : _followFrame.call(this, o, look, t); };

// ---------------------------------------------------------------- hooks
const _followLoad = World.load;
World.load = function (id, x, y, dir) { _followLoad.call(this, id, x, y, dir); Follow.reset(); };

const _followUpdate = World.update;
World.update = function () { const r = _followUpdate.call(this); Follow.tick(); return r; };
