// Turn-based battle engine with a Gen 3-style interface.
const Battle = {
  active: false,

  async start(cfg) {
    Object.assign(this, {
      active: true, cfg, foes: cfg.foes, fi: 0, trainer: cfg.trainer || null, result: null,
      pi: Game.party.findIndex(m => m.hp > 0), mode: "script", cur: 0, mcur: 0, lcur: 0,
      vol: new Map(), part: new Set(), enter: 0, trainerX: 0,
      show: { mine: false, foe: !cfg.trainer, trainer: !!cfg.trainer }, drop: { mine: 0, foe: 0 },
      lunge: null, blink: null, flash: 0, shake: 0, pop: { mine: 0, foe: 0 }, rig: null, forced: false, msgOnly: false,
    });
    for (const m of [...Game.party, ...this.foes]) this.vol.set(m, { atk: 0, dfn: 0, spd: 0, acc: 0, eva: 0, recharge: false, flinch: false });
    this.part.add(this.pi);
    Sound.play(cfg.music || "battle");
    for (let i = 0; i <= 40; i++) { this.enter = i / 40; await nextFrame(); }
    if (this.trainer) {
      await say(`${this.trainer.name} wants to battle!`);
      for (let i = 0; i < 20; i++) { this.trainerX = i * 5; await nextFrame(); }
      this.show.trainer = false; this.show.foe = true; this.pop.foe = 12; Sound.fx("select");
      await say(`${this.trainer.name} sent out ${monName(this.foe)}!`);
    } else {
      await say(`A rogue ${monName(this.foe)} attacks!`);
    }
    this.show.mine = true; this.pop.mine = 12; Sound.fx("select");
    await say(`Go! ${monName(this.mine)}!`);
    while (!this.result) {
      const act = await this.choose();
      await this.turn(act);
    }
    for (const m of Game.party) m.status = m.status; // persistent status kept
    this.active = false;
    return this.result;
  },

  get mine() { return Game.party[this.pi]; },
  get foe() { return this.foes[this.fi]; },
  label(m) { return m === this.foe ? (this.trainer ? "Foe " : "Rogue ") + monName(m) : monName(m); },
  st(m, k) { const s = this.vol.get(m)[k]; return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); },
  speed(m) { return m.spd * this.st(m, "spd") * (m.status === "STN" ? 0.5 : 1); },

  choose() {
    return new Promise(res => { this.resolve = res; this.mode = this.forced ? "squad" : "act"; this.lcur = this.forced ? this.firstAlive() : this.pi; });
  },
  firstAlive() { return Game.party.findIndex(m => m.hp > 0); },

  // ---------------------------------------------------------------- input
  update() {
    const k = Game.keys;
    const pick = act => { Sound.fx("select"); this.mode = "script"; const r = this.resolve; this.resolve = null; r(act); };
    if (this.mode === "act") {
      this.cur = gridMove(this.cur, k, 2, 4);
      if (k.has("a")) {
        Sound.fx("select");
        if (this.cur === 0) { this.mode = "fight"; this.mcur = Math.min(this.mcur, this.mine.moves.length - 1); }
        else if (this.cur === 1) { this.mode = "bag"; this.lcur = 0; }
        else if (this.cur === 2) { this.mode = "squad"; this.lcur = this.pi; }
        else pick({ kind: "run" });
      }
    } else if (this.mode === "fight") {
      this.mcur = listMove(this.mcur, k, this.mine.moves.length);
      if (k.has("b")) { Sound.fx("blip"); this.mode = "act"; }
      else if (k.has("a")) {
        if (this.mine.moves[this.mcur].pp <= 0) { Sound.fx("bump"); return; }
        pick({ kind: "move", i: this.mcur });
      }
    } else if (this.mode === "bag") {
      const items = ["kit", "rig"];
      this.lcur = listMove(this.lcur, k, items.length);
      if (k.has("b")) { Sound.fx("blip"); this.mode = "act"; }
      else if (k.has("a")) {
        const it = items[this.lcur];
        if (!Game.bag[it]) { Sound.fx("bump"); return; }
        if (it === "rig") pick({ kind: "rig" });
        else { this.mode = "kitTarget"; this.lcur = this.pi; Sound.fx("select"); }
      }
    } else if (this.mode === "kitTarget") {
      this.lcur = listMove(this.lcur, k, Game.party.length);
      if (k.has("b")) { Sound.fx("blip"); this.mode = "bag"; this.lcur = 0; }
      else if (k.has("a")) {
        const m = Game.party[this.lcur];
        if (m.hp <= 0 || m.hp >= m.maxhp) { Sound.fx("bump"); return; }
        pick({ kind: "kit", t: this.lcur });
      }
    } else if (this.mode === "squad") {
      this.lcur = listMove(this.lcur, k, Game.party.length);
      if (k.has("b") && !this.forced) { Sound.fx("blip"); this.mode = "act"; }
      else if (k.has("a")) {
        const m = Game.party[this.lcur];
        if (m.hp <= 0 || (this.lcur === this.pi && !this.forced)) { Sound.fx("bump"); return; }
        pick({ kind: "switch", i: this.lcur });
      }
    }
  },

  // ---------------------------------------------------------------- turn
  async turn(act) {
    const me = this.mine, foe = this.foe;
    if (this.forced) { this.forced = false; await this.sendOut(act.i); return; }
    if (act.kind === "run") {
      if (this.trainer) { await say("There's no running from a Dominion soldier!"); return; }
      if (this.speed(me) >= this.speed(foe) || Math.random() < 0.5) { Sound.fx("door"); await say("Got away safely!"); this.result = "run"; return; }
      await say("Couldn't get away!");
    } else if (act.kind === "switch") {
      await say(`${monName(me)}, fall back!`); this.show.mine = false; await wait(8);
      await this.sendOut(act.i);
    } else if (act.kind === "kit") {
      Game.bag.kit--; const t = Game.party[act.t];
      t.hp = Math.min(t.maxhp, t.hp + 40); Sound.fx("heal");
      await say(`Used a FIELD KIT. ${monName(t)} recovered HP!`);
    } else if (act.kind === "rig") {
      if (this.trainer) { await say("You can't link a soul that is already bound to another soldier!"); return; }
      Game.bag.rig--;
      if (await this.throwRig()) return;
    }
    const foeMove = this.aiMove();
    const order = [];
    if (act.kind === "move") {
      const mf = this.speed(me), ff = this.speed(foe);
      const pm = MOVES[me.moves[act.i].name].pri || 0, pf = (MOVES[(foe.moves[foeMove] || {}).name] || {}).pri || 0;
      const meFirst = pm !== pf ? pm > pf : mf > ff || (mf === ff && Math.random() < 0.5);
      order.push(...(meFirst ? [[me, foe, act.i], [foe, me, foeMove]] : [[foe, me, foeMove], [me, foe, act.i]]));
    } else order.push([foe, this.mine, foeMove]);
    for (let n = 0; n < order.length; n++) {
      const [u, t, i] = order[n];
      if (u.hp <= 0 || t.hp <= 0) continue;
      await this.useMove(u, t, i, n === 0);
      if (await this.checkFaint()) return;
    }
    for (const m of [this.mine, this.foe]) this.vol.get(m).flinch = false;
  },

  aiMove() {
    const foe = this.foe, me = this.mine;
    const usable = foe.moves.map((m, i) => i).filter(i => foe.moves[i].pp > 0);
    if (!usable.length) return 0;
    const smart = this.trainer ? (this.trainer.boss ? 0.8 : 0.55) : 0.25;
    if (Math.random() < smart) {
      const score = i => {
        const mv = MOVES[foe.moves[i].name];
        if (!mv.pow) return this.vol.get(foe).atk < 1 && foe.hp > foe.maxhp * 0.6 ? 55 : 10;
        if (mv.recharge && me.hp < me.maxhp * 0.35) return 20;
        return mv.pow * (mv.hits ? (mv.hits[0] + mv.hits[1]) / 2 : 1) * effOn(this.moveType(mv, foe, me), me) * (SPECIES[foe.id].types.includes(mv.type) ? 1.5 : 1) * Math.min(1, mv.acc / 100);
      };
      return usable.reduce((a, b) => score(b) > score(a) ? b : a);
    }
    return usable[Math.floor(Math.random() * usable.length)];
  },

  async useMove(u, t, i, first) {
    const v = this.vol.get(u), slot = u.moves[i], mv = MOVES[slot.name];
    if (v.recharge) { v.recharge = false; await say(`${this.label(u)} must recharge!`); return; }
    if (v.flinch) { v.flinch = false; await say(`${this.label(u)} flinched!`); return; }
    if (u.status === "STN" && Math.random() < 0.25) { await say(`${this.label(u)} is stunned and can't move!`); return; }
    slot.pp = Math.max(0, slot.pp - 1);
    await say(`${this.label(u)} used ${slot.name.toUpperCase()}!`);
    const side = u === this.foe ? "foe" : "mine", other = side === "foe" ? "mine" : "foe";
    this.lunge = { side, t: 14 }; await wait(14);
    const hitChance = mv.acc >= 999 ? 2 : (mv.acc / 100) * this.st(u, "acc") / this.st(t, "eva");
    if (mv.pow && Math.random() > hitChance) { await say("But it missed!"); return; }
    if (!mv.pow && mv.fx && (mv.fx.foe || mv.fx.foes) && Math.random() > hitChance) { await say("But it missed!"); return; }
    if (!mv.pow) { await this.applyStatus(u, t, mv); return; }
    const type = this.moveType(mv, u, t), e = effOn(type, t);
    const hits = mv.hits ? mv.hits[0] + Math.floor(Math.random() * (mv.hits[1] - mv.hits[0] + 1)) : 1;
    let total = 0, landed = 0, critAny = false;
    for (let h = 0; h < hits && t.hp > 0; h++) {
      const crit = v.focus || Math.random() < (mv.crit ? 0.25 : 1 / 16); v.focus = false; critAny ||= crit;
      const pow = mv.pow * (mv.finisher && t.hp < t.maxhp / 2 ? 2 : 1);
      let dmg = ((2 * u.level / 5 + 2) * pow * (u.atk * this.st(u, "atk")) / (t.dfn * this.st(t, "dfn"))) / 50 + 2;
      dmg *= 1.15 * (SPECIES[u.id].types.includes(type) ? 1.5 : 1) * e * (crit ? 1.5 : 1) * (0.85 + Math.random() * 0.15);
      dmg = Math.max(1, Math.floor(dmg));
      Sound.fx(crit ? "crit" : e < 1 ? "weak" : "hit");
      this.blink = { side: other, t: hits > 1 ? 12 : 24 }; this.flash = 6; if (crit || mv.pow >= 90 || e > 1) this.shake = 14;
      await wait(hits > 1 ? 12 : 24);
      t.hp = Math.max(0, t.hp - dmg); total += dmg; landed++;
      await this.drain(t);
      if (crit) await say("A critical hit!");
    }
    if (hits > 1) await say(`Hit ${landed} times!`);
    if (e > 1) await say(e >= 4 ? "It's devastating!" : "It's super effective!"); else if (e < 1) await say("It's not very effective...");
    if (mv.drain && u.hp > 0 && u.hp < u.maxhp) { u.hp = Math.min(u.maxhp, u.hp + Math.max(1, Math.floor(total * mv.drain))); Sound.fx("heal"); await this.drain(u); await say(`${this.label(u)} drained some energy!`); }
    if (mv.recoil) { u.hp = Math.max(0, u.hp - Math.max(1, Math.floor(total * mv.recoil))); await this.drain(u); await say(`${this.label(u)} is hurt by the recoil!`); }
    if (mv.recharge) v.recharge = true;
    if (mv.fx && mv.fx.after && u.hp > 0) for (const [k, d] of mv.fx.after) await this.stage(u, k, d);
    if (t.hp > 0 && mv.fx) {
      if (mv.fx.flinch && first && Math.random() < mv.fx.flinch) this.vol.get(t).flinch = true;
      if (mv.fx.para && !t.status && Math.random() < mv.fx.para) { t.status = "STN"; Sound.fx("stat"); await say(`${this.label(t)} is stunned! It may be unable to move.`); }
      if (mv.fx.foeChance && Math.random() < mv.fx.foeChance[2]) await this.stage(t, mv.fx.foeChance[0], mv.fx.foeChance[1]);
    }
  },

  moveType(mv, u, t) {           // Equinox picks whichever of the user's light or dark sides hits harder
    if (!mv.equinox) return mv.type;
    return effOn("DARK", t) > effOn("LIGHT", t) ? "DARK" : "LIGHT";
  },
  async applyStatus(u, t, mv) {
    const f = mv.fx || {};
    if (mv.focus) { this.vol.get(u).focus = true; Sound.fx("stat"); await say(`${this.label(u)} is focusing on a weak point!`); return; }
    if (f.self) await this.stage(u, f.self[0], f.self[1]);
    for (const [k, d] of f.selfs || []) await this.stage(u, k, d);
    if (f.foe) await this.stage(t, f.foe[0], f.foe[1]);
    for (const [k, d] of f.foes || []) await this.stage(t, k, d);
    if (f.cure && u.status) { u.status = null; Sound.fx("heal"); await say(`${this.label(u)} shook off the stun!`); }
    if (f.heal) {
      if (u.hp >= u.maxhp) { if (!f.selfs && !f.cure) await say("But its HP is already full!"); return; }
      u.hp = Math.min(u.maxhp, u.hp + Math.floor(u.maxhp * f.heal)); Sound.fx("heal"); await this.drain(u);
      await say(`${this.label(u)} restored its HP!`);
    }
  },
  async stage(m, k, d) {
    const v = this.vol.get(m), names = { atk: "attack", dfn: "defense", spd: "speed", acc: "accuracy", eva: "evasion" };
    if ((d > 0 && v[k] >= 6) || (d < 0 && v[k] <= -6)) { await say(`${this.label(m)}'s ${names[k]} won't go any ${d > 0 ? "higher" : "lower"}!`); return; }
    v[k] = Math.max(-6, Math.min(6, v[k] + d)); Sound.fx("stat");
    await say(`${this.label(m)}'s ${names[k]} ${d > 0 ? "rose" : "fell"}!`);
  },
  async drain(m) {
    m.shown ??= m.hp;
    const sp = Math.max(0.4, m.maxhp / 45);
    while (Math.abs(m.shown - m.hp) > 0.01) { m.shown += Math.max(-sp, Math.min(sp, m.hp - m.shown)); await nextFrame(); }
    m.shown = m.hp;
  },

  async checkFaint() {
    if (this.foe.hp <= 0) {
      Sound.fx("faint"); await this.faintAnim("foe");
      await say(`${this.label(this.foe)} was destroyed!`);
      await this.giveExp(this.foe);
      const next = this.foes.findIndex(m => m.hp > 0);
      if (next >= 0) {
        this.fi = next; this.part = new Set([this.pi]);
        this.show.foe = true; this.pop.foe = 12; Sound.fx("select");
        await say(`${this.trainer.name} sent out ${monName(this.foe)}!`);
        return false;
      }
      if (this.trainer) { Sound.play("victory"); await say(`You defeated ${this.trainer.name}!`); }
      this.result = "win"; return true;
    }
    if (this.mine.hp <= 0) {
      Sound.fx("faint"); await this.faintAnim("mine");
      await say(`${monName(this.mine)} is down!`);
      if (Game.party.some(m => m.hp > 0)) { this.forced = true; return true; }
      await say("Your whole squad is down...");
      await say("You fall back to the last safe position.");
      this.result = "lose"; return true;
    }
    return false;
  },
  async faintAnim(side) {
    for (let d = 0; d <= 64; d += 4) { this.drop[side] = d; await nextFrame(); }
    this.show[side] = false; this.drop[side] = 0;
  },
  async sendOut(i) {
    this.pi = i; this.part.add(i); this.vol.get(this.mine).recharge = false;
    this.show.mine = true; this.pop.mine = 12; this.mine.shown = this.mine.hp; Sound.fx("select");
    await say(`Go! ${monName(this.mine)}!`);
    if (this.forced) this.forced = false;
  },

  async giveExp(foe) {
    const base = SPECIES[foe.id].exp * foe.level / 5 * (this.trainer ? 1.5 : 1);
    for (const i of this.part) {
      const m = Game.party[i]; if (!m || m.hp <= 0) continue;
      const gain = Math.floor(base / this.part.size);
      await say(`${monName(m)} gained ${gain} EXP.`);
      m.exp += gain;
      while (m.exp >= expNext(m.level) && m.level < MAX_LEVEL) {
        m.exp -= expNext(m.level);
        const old = m.maxhp, was = { atk: m.atk, dfn: m.dfn, spd: m.spd }; m.level++; calcStats(m); m.hp += m.maxhp - old; m.shown = m.hp;
        this.statPanel = { name: `${monName(m)} Lv${m.level}`, rows: [["HP", old, m.maxhp], ["ATK", was.atk, m.atk], ["DEF", was.dfn, m.dfn], ["SPD", was.spd, m.spd]] };
        Sound.fx("level"); await say(`${monName(m)} grew to Lv. ${m.level}!`);
        this.statPanel = null;
        for (const n of SPECIES[m.id].learn[m.level] || []) {
          if (m.moves.some(x => x.name === n)) continue;
          if (m.moves.length < 4) { m.moves.push({ name: n, pp: MOVES[n].pp }); Sound.fx("select"); await say(`${monName(m)} learned ${n.toUpperCase()}!`); }
          else {
            const weakest = m.moves.reduce((a, b) => (MOVES[b.name].pow || 30) < (MOVES[a.name].pow || 30) ? b : a);
            const old2 = weakest.name; weakest.name = n; weakest.pp = MOVES[n].pp;
            await say(`${monName(m)} forgot ${old2.toUpperCase()} and learned ${n.toUpperCase()}!`);
          }
        }
      }
      const evo = SPECIES[m.id].evo;
      if (evo && m.level >= evo.lv && m.hp > 0) await this.evolve(m, evo.to);
    }
  },

  async evolve(m, to) {
    const from = monName(m);
    await say(`What? ${from} is evolving!`);
    Sound.fx("level");
    for (let i = 0; i < 6; i++) { this.flash = 10; await wait(10); }
    const before = { hp: m.maxhp, atk: m.atk, dfn: m.dfn, spd: m.spd }, oldTypes = SPECIES[m.id].types.join("/");
    const ratio = m.hp / m.maxhp; m.id = to; calcStats(m); m.hp = Math.max(1, Math.round(m.maxhp * ratio)); m.shown = m.hp;
    Sound.fx("capture");
    const types = SPECIES[m.id].types.join("/");
    this.statPanel = { name: monName(m), types: types !== oldTypes ? types : null,
                       rows: [["HP", before.hp, m.maxhp], ["ATK", before.atk, m.atk], ["DEF", before.dfn, m.dfn], ["SPD", before.spd, m.spd]] };
    await say(`${from} evolved into ${monName(m)}!`);
    if (types !== oldTypes) await say(`${monName(m)} is now ${types} type!`);
    this.statPanel = null;
  },
  async throwRig() {
    const foe = this.foe;
    await say("You cast a SOUL LINK!");
    for (let i = 0; i <= 28; i++) { this.rig = { k: "fly", v: i / 28 }; await nextFrame(); }
    this.show.foe = false; this.rig = { k: "sit" }; await wait(16);
    const chance = 0.18 + 0.72 * (1 - foe.hp / foe.maxhp) + (foe.status ? 0.12 : 0);
    const ok = Math.random() < chance;
    const shakes = ok ? 3 : Math.floor(Math.random() * 3);
    for (let s = 0; s < shakes; s++) { for (let i = 0; i < 20; i++) { this.rig = { k: "shake", v: i }; await nextFrame(); } this.rig = { k: "sit" }; Sound.fx("shake"); await wait(14); }
    if (ok) {
      this.rig = { k: "done" }; Sound.fx("capture");
      await say(`The link holds! ${monName(foe)}'s soul is bound to yours.`);
      if (Game.party.length >= Game.cap()) { await say(`Your soul already bears ${Game.cap()} links. ${monName(foe)} waits for you in the SOUL VAULT at any medic.`); Game.vault.push(foe); this.result = "caught"; this.rig = null; return true; }
      foe.status = null; Game.party.push(foe); this.vol.set(foe, { atk: 0, dfn: 0, spd: 0, acc: 0, eva: 0, recharge: false, flinch: false });
      this.result = "caught"; this.rig = null; return true;
    }
    this.rig = null; this.show.foe = true; this.pop.foe = 8;
    await say("It tore free of the link!");
    return false;
  },

  // ---------------------------------------------------------------- drawing
  draw(ctx, t) {
    if (this.mode === "squad" || this.mode === "kitTarget") { drawSquad(ctx, this.lcur, this.mode === "squad" ? (this.forced ? "Choose who goes in next." : "Send in which mon?") : "Use the kit on which mon?"); return; }
    ctx.save();
    if (this.shake) { ctx.translate(this.shake % 2 ? 2 : -2, 0); }
    ctx.drawImage(BATTLE_BG[this.cfg.bg || "front"], 0, 0);
    const slide = Math.round((1 - this.enter) * 170);
    const bgk = this.cfg.bg || "front";
    const [pf, pm] = BATTLE_PLAT[bgk];
    ctx.drawImage(pf, 178 + slide - pf.width / 2, 64 - pf.ry - 1);
    ctx.drawImage(pm, 62 - slide - pm.width / 2, 110 - pm.ry - 1);
    if (this.show.trainer && this.trainer) {          // same pixel scale as everything else, standing on the far platform
      const spr = CHAR[this.trainer.look].down.idle[0], tx = 178 - 24 + slide + this.trainerX;
      monShadow(ctx, tx + 24, 65, 9);
      ctx.drawImage(spr, tx, 65 - 44);
    }
    this.drawMon(ctx, "foe", this.foe, sceneLit(MON_ART[this.foe.id].front, bgk), 146 + slide, 2);
    this.drawMon(ctx, "mine", this.mine, sceneLit(MON_ART[this.mine.id].back, bgk), 30 - slide, 48);
    if (this.rig) this.drawRig(ctx);
    ctx.restore();
    if (this.flash) { this.flash--; ctx.fillStyle = `rgba(255,248,232,${this.flash / 10})`; ctx.fillRect(0, 0, W, 112); }
    for (const k of ["lunge", "blink"]) if (this[k] && --this[k].t <= 0) this[k] = null;
    if (this.shake) this.shake--;
    for (const s of ["mine", "foe"]) if (this.pop[s]) this.pop[s]--;
    if (this.enter >= 1) {
      if (this.show.foe || this.drop.foe) this.drawFoePlate(ctx);
      if (this.show.mine || this.drop.mine) this.drawMyPlate(ctx);
      if (this.statPanel) drawStatPanel(ctx, this.statPanel);
    }
    this.drawBottom(ctx, t);
  },
  drawMon(ctx, side, m, img, x, y) {
    if (!this.show[side] && !this.drop[side]) return;
    if (this.show[side] && !this.drop[side] && !this.pop[side]) { const f = footprint(img); monShadow(ctx, Math.round(x) + f.cx, Math.round(y) + 62, f.hw); }
    if (this.lunge && this.lunge.side === side) { const k = Math.sin((14 - this.lunge.t) / 14 * Math.PI) * 10; x += side === "mine" ? k : -k; y += side === "mine" ? -k / 2 : k / 2; }
    if (this.blink && this.blink.side === side && Math.floor(this.blink.t / 3) % 2 === 0) return;
    const p = this.pop[side];
    if (p) { const s = Math.max(4, Math.round(64 * (1 - p / 12))); ctx.drawImage(img, Math.round(x + (64 - s) / 2), Math.round(y + 64 - s), s, s); return; }
    const d = this.drop[side];
    if (d) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, 64, 64); ctx.clip(); ctx.drawImage(img, Math.round(x), Math.round(y + d), 64, 64); ctx.restore(); return; }
    ctx.drawImage(img, Math.round(x), Math.round(y), 64, 64);
  },
  drawRig(ctx) {
    const tx = 178, ty = 50;
    let x = tx, y = ty, rot = 0;
    if (this.rig.k === "fly") { const v = this.rig.v; x = 50 + (tx - 50) * v; y = 96 + (ty - 96) * v - Math.sin(v * Math.PI) * 50; }
    if (this.rig.k === "shake") rot = Math.sin(this.rig.v / 20 * Math.PI * 2) * 3;
    x = Math.round(x + rot); y = Math.round(y);
    const done = this.rig.k === "done", core = done ? "#c8f088" : "#6af0e4", rim = done ? "#52a64c" : "#1ec8ba", pulse = Math.floor(performance.now() / 120) % 2;
    for (let i = -6; i <= 6; i++) { const w = 6 - Math.abs(i); R(ctx, "#0e0a1c", x - w - 1, y + i, w * 2 + 3, 1); }                 // dark diamond behind
    for (let i = -5; i <= 5; i++) { const w = 5 - Math.abs(i); R(ctx, rim, x - w, y + i, w * 2 + 1, 1); }
    for (let i = -3; i <= 3; i++) { const w = 3 - Math.abs(i); R(ctx, core, x - w, y + i, w * 2 + 1, 1); }
    R(ctx, "#fffdf0", x - 1, y - 1, 3, 3); R(ctx, "#fffdf0", x, y - 2, 1, 5); R(ctx, "#fffdf0", x - 2, y, 5, 1);                 // the rune
    if (pulse || done) for (const [dx, dy] of [[-8, 0], [8, 0], [0, -8], [0, 8]]) R(ctx, core, x + dx, y + dy, 1, 1);        // sparks
  },
  drawFoePlate(ctx) {
    const m = this.foe;
    statusPlate(ctx, 8, 10, 104, 38, false);
    drawText(ctx, monName(m), 14, 14, INK, INK_SH);
    drawText(ctx, "Lv" + m.level, 86, 14, INK, INK_SH);
    if (m.status) { R(ctx, "#c8a020", 14, 26, 18, 8); drawText(ctx, "STN", 15, 26, "#f8f8f8", null); }
    R(ctx, "#f8a838", 36, 27, 13, 6); drawText(ctx, "HP", 37, 26, "#f8f8f8", null);
    hpBar(ctx, 50, 28, 56, (m.shown ?? m.hp) / m.maxhp);
    const hp = `${Math.max(0, Math.ceil(m.shown ?? m.hp))}/${m.maxhp}`;
    drawText(ctx, hp, 106 - textWidth(hp), 35, INK, INK_SH);
  },
  drawMyPlate(ctx) {
    const m = this.mine;
    statusPlate(ctx, 126, 68, 108, 42, true);
    drawText(ctx, monName(m), 134, 72, INK, INK_SH);
    drawText(ctx, "Lv" + m.level, 206, 72, INK, INK_SH);
    if (m.status) { R(ctx, "#c8a020", 134, 84, 18, 8); drawText(ctx, "STN", 135, 84, "#f8f8f8", null); }
    R(ctx, "#f8a838", 156, 85, 13, 6); drawText(ctx, "HP", 157, 84, "#f8f8f8", null);
    hpBar(ctx, 170, 86, 58, (m.shown ?? m.hp) / m.maxhp);
    const hp = `${Math.ceil(m.shown ?? m.hp)}/${m.maxhp}`;
    drawText(ctx, hp, 228 - textWidth(hp), 93, INK, INK_SH);
    R(ctx, "#384050", 150, 104, 80, 3); R(ctx, "#48a0f8", 151, 105, Math.round(78 * Math.min(1, m.exp / expNext(m.level))), 1);
    drawText(ctx, "EXP", 132, 101, "#a89880", null);
  },
  drawBottom(ctx, t) {
    if (this.mode === "act") {
      battleTextBox(ctx, 0, 112, 240, 48);
      drawText(ctx, "What will", 10, 120, INK, INK_SH);
      drawText(ctx, monName(this.mine) + " do?", 10, 136, INK, INK_SH);
      frameBox(ctx, 120, 112, 120, 48);
      ["FIGHT", "BAG", "SQUAD", "RUN"].forEach((l, i) => {
        const x = 136 + (i % 2) * 52, y = 122 + Math.floor(i / 2) * 16;
        drawText(ctx, l, x, y); if (i === this.cur) cursor(ctx, x - 8, y);
      });
    } else if (this.mode === "fight") {
      frameBox(ctx, 0, 112, 156, 48); frameBox(ctx, 156, 112, 84, 48);
      this.mine.moves.forEach((mv, i) => {
        const x = 16, y = 116 + i * 11;
        drawText(ctx, mv.name.toUpperCase(), x, y, mv.pp ? INK : "#5a5460", null); if (i === this.mcur) cursor(ctx, x - 9, y);
        const md = MOVES[mv.name];
        if (md.pow && this.foe) {   // damage multiplier against the current foe
          const e = effOn(this.moveType(md, this.mine, this.foe), this.foe);
          const [lbl, col] = e >= 4 ? ["4x", "#30c060"] : e >= 2 ? ["2x", "#58a838"] : e <= 0.25 ? [".25x", "#d03030"] : e < 1 ? [".5x", "#d07028"] : ["1x", "#7a7480"];
          drawText(ctx, lbl, 151 - textWidth(lbl), y, col, null);
        }
      });
      const slot = this.mine.moves[this.mcur], mv = MOVES[slot.name];
      drawText(ctx, `PP ${slot.pp}/${mv.pp}`, 164, 120, slot.pp ? INK : "#e04040");
      R(ctx, TYPE_COLOR[mv.type], 163, 131, 70, 11); drawText(ctx, mv.type, 166, 133, "#f8f8f8", null);
      const info = mv.pow ? (mv.desc ? `${mv.pow} ${mv.desc}` : `POW ${mv.pow}`) : mv.desc;
      drawText(ctx, info, 164, 146, mv.desc ? "#8ab0e8" : INK);
    } else if (this.mode === "bag") {
      battleTextBox(ctx, 0, 112, 240, 48);
      frameBox(ctx, 0, 112, 132, 48);
      ["kit", "rig"].forEach((it, i) => {
        const y = 122 + i * 16; drawText(ctx, ITEMS[it].name, 16, y); drawText(ctx, "x" + Game.bag[it], 104, y);
        if (i === this.lcur) cursor(ctx, 8, y);
      });
      const lines = wrapText(ITEMS[["kit", "rig"][this.lcur]].desc, 96);
      lines.slice(0, 2).forEach((l, i) => drawText(ctx, l, 138, 120 + i * 16, INK, INK_SH));
    } else {
      battleTextBox(ctx, 0, 112, 240, 48);
      TB.drawLines(ctx, 10, 120, INK, INK_SH, t);
    }
  },
};

// Squad screen (used in battle and from the start menu)
function drawSquad(ctx, sel, prompt) {
  R(ctx, "#121016", 0, 0, W, H);
  for (let y = 0; y < H; y += 8) R(ctx, "#16131b", 0, y, W, 4);
  const pitch = squadPitch(), rh = pitch - 2, ic = pitch > 24 ? 32 : 24, y2 = pitch > 24 ? 16 : 12;
  for (let i = 0; i < Math.max(Game.cap(), Game.party.length); i++) {
    const m = Game.party[i], x = 4, y = 4 + i * pitch, on = i === sel;
    if (!m) { R(ctx, "#2a2230", x, y, 232, rh); R(ctx, "#16131b", x + 1, y + 1, 230, rh - 2); drawText(ctx, "- EMPTY SLOT -", x + 76, y + (rh >> 1) - 4, "#4a4458", null); continue; }
    R(ctx, on ? "#c8a050" : "#4a3a24", x, y, 232, rh);
    R(ctx, on ? "#3a2c20" : m.hp > 0 ? "#201c28" : "#2a1416", x + 1, y + 1, 230, rh - 2);
    ctx.drawImage(MON_ART[m.id].front, x + (32 - ic) / 2, y + (rh - ic) / 2 - 1, ic, ic);
    drawText(ctx, monName(m), x + 34, y + 3, INK, INK_SH);
    drawText(ctx, "Lv" + m.level, x + 112, y + 3, INK, INK_SH);
    R(ctx, TYPE_COLOR[monType(m)], x + 146, y + 3, 50, 10); drawText(ctx, monType(m).slice(0, 8), x + 148, y + 4, "#f8f8f8", null);
    hpBar(ctx, x + 50, y + y2 + 3, 80, m.hp / m.maxhp);
    const hpT = `${m.hp}/${m.maxhp}`;
    if (pitch > 24) { drawText(ctx, hpT, x + 140, y + y2, INK, INK_SH); if (m.status) drawText(ctx, "STN", x + 200, y + y2, "#f8e038", INK_SH); }
    else { drawText(ctx, hpT, x + 228 - textWidth(hpT), y + 3, INK, INK_SH); if (m.status) drawText(ctx, "STN", x + 140, y + y2, "#f8e038", INK_SH); }
  }
  frameBox(ctx, 0, 124, 240, 36);
  drawText(ctx, prompt, 10, 136);
}
function gridMove(c, k, cols, n) {
  const o = c;
  if (k.has("left") && c % cols > 0) c--;
  if (k.has("right") && c % cols < cols - 1 && c + 1 < n) c++;
  if (k.has("up") && c >= cols) c -= cols;
  if (k.has("down") && c + cols < n) c += cols;
  if (c !== o) Sound.fx("blip");
  return c;
}
function listMove(c, k, n) {
  const o = c;
  if (k.has("up")) c = (c + n - 1) % n;
  if (k.has("down")) c = (c + 1) % n;
  if (c !== o) Sound.fx("blip");
  return c;
}

// ---------------------------------------------------------------- grounding: a soft contact shadow sized to each sprite
const FOOT = new Map();
function footprint(img) {
  let f = FOOT.get(img); if (f) return f;
  f = { cx: 32, hw: 20 };
  try {
    const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.drawImage(img, 0, 0, 64, 64);
    const d = g.getImageData(0, 0, 64, 64).data; let x0 = 64, x1 = 0;
    for (let y = 40; y < 64; y++) for (let x = 0; x < 64; x++) if (d[(y * 64 + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    if (x1 > x0) f = { cx: Math.round((x0 + x1) / 2), hw: Math.max(8, Math.round((x1 - x0) * 0.42)) };
  } catch (e) {}
  FOOT.set(img, f); return f;
}
function monShadow(ctx, cx, cy, hw) {
  ctx.fillStyle = "rgba(14,10,28,0.34)";
  for (let r = -2; r <= 2; r++) { const w = Math.round(hw * Math.sqrt(1 - (r / 3) ** 2)); ctx.fillRect(cx - w, cy + r, w * 2, 1); }
}

// ---------------------------------------------------------------- scene light: each sprite takes a little of the backdrop's ambient colour,
// and darkens slightly toward the ground, so it sits in the scene instead of on top of it
const AMBIENT = { field: [0.97, 1.0, 0.96], front: [1.0, 0.95, 0.88], fortress: [0.9, 0.87, 1.0], hollow: [0.88, 0.9, 1.0], shrine: [0.84, 0.9, 1.0], throne: [1.0, 0.92, 0.86] }, LIT = new Map();
function sceneLit(img, bg) {
  let per = LIT.get(img); if (!per) LIT.set(img, per = {});
  if (per[bg]) return per[bg];
  try {
    const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.drawImage(img, 0, 0, 64, 64);
    const im = g.getImageData(0, 0, 64, 64), d = im.data, a = AMBIENT[bg] || [1, 1, 1];
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = (y * 64 + x) * 4; if (!d[i + 3]) continue;
      const k = y > 52 ? 1 - (y - 52) * 0.012 : 1;
      d[i] = Math.min(255, d[i] * a[0] * k); d[i + 1] = Math.min(255, d[i + 1] * a[1] * k); d[i + 2] = Math.min(255, d[i + 2] * a[2] * k); }
    g.putImageData(im, 0, 0); per[bg] = c;
  } catch (e) { per[bg] = img; }
  return per[bg];
}

// ---------------------------------------------------------------- evolution: before > after for every stat
function drawStatPanel(ctx, p) {
  const x = 4, y = 4, w = 118, h = 20 + p.rows.length * 11 + (p.types ? 11 : 0);
  frameBox(ctx, x, y, w, h, true);
  drawText(ctx, p.name.toUpperCase(), x + 8, y + 6, "#fcd888", INK_SH);
  p.rows.forEach(([label, a, b], i) => {
    const yy = y + 18 + i * 11, d = b - a, sa = String(a), sb = String(b), sd = (d >= 0 ? "+" : "") + d;
    drawText(ctx, label, x + 8, yy, INK, INK_SH);
    drawText(ctx, sa, x + 50 - textWidth(sa), yy, "#8a8090", null);
    drawText(ctx, ">", x + 54, yy, "#8a8090", null);
    drawText(ctx, sb, x + 82 - textWidth(sb), yy, INK, INK_SH);
    drawText(ctx, sd, x + 110 - textWidth(sd), yy, d > 0 ? "#94d66c" : d < 0 ? "#f05a7a" : "#8a8090", null);
  });
  if (p.types) drawText(ctx, p.types, x + 8, y + 18 + p.rows.length * 11, "#86c6f0", null);
}

const squadPitch = () => Math.max(Game.cap(), Game.party.length) > 4 ? 24 : 30;

// ---------------------------------------------------------------- summary: one mon's status, and its whole evolution line
function monLine(id) {
  let root = id;
  for (let again = true; again;) { again = false; for (const k in SPECIES) if (SPECIES[k].evo && SPECIES[k].evo.to === root) { root = k; again = true; } }
  const line = [{ id: root, lv: 0 }];
  for (let e = SPECIES[root].evo; e; e = SPECIES[e.to].evo) line.push({ id: e.to, lv: e.lv });
  return line;
}
function drawSummary(ctx, m, page) {
  R(ctx, "#121016", 0, 0, W, H);
  for (let y = 0; y < H; y += 8) R(ctx, "#16131b", 0, y, W, 4);
  const sp = SPECIES[m.id], types = sp.types;
  frameBox(ctx, 0, 0, W, 18);
  drawText(ctx, monName(m).toUpperCase(), 8, 5, "#fcd888", INK_SH); drawText(ctx, "Lv" + m.level, 100, 5, INK, INK_SH);
  types.forEach((ty, i) => { R(ctx, TYPE_COLOR[ty], 132 + i * 52, 4, 50, 10); drawText(ctx, ty.slice(0, 8), 134 + i * 52, 5, "#f8f8f8", null); });
  if (page === 0) {
    ctx.drawImage(MON_ART[m.id].front, 6, 22);
    const rows = [["HP", `${m.hp}/${m.maxhp}`], ["ATK", m.atk], ["DEF", m.dfn], ["SPD", m.spd], ["EXP", m.level >= MAX_LEVEL ? "MAX" : `${m.exp}/${expNext(m.level)}`]];
    rows.forEach(([a, b], i) => { drawText(ctx, a, 78, 24 + i * 12, "#8a8090", null); drawText(ctx, String(b), 108, 24 + i * 12, INK, INK_SH); });
    hpBar(ctx, 78, 86, 70, m.hp / m.maxhp);
    wrapText(sp.dex || "", 78).slice(0, 5).forEach((l, i) => drawText(ctx, l, 158, 24 + i * 11, "#b8b0c0", null));
    frameBox(ctx, 0, 94, W, 52);
    m.moves.forEach((mv, i) => { const d = MOVES[mv.name], y = 100 + i * 11;
      R(ctx, TYPE_COLOR[d.type], 8, y, 6, 8); drawText(ctx, mv.name.toUpperCase(), 18, y, INK, INK_SH);
      drawText(ctx, d.pow ? "POW " + d.pow : "STATUS", 138, y, "#8a8090", null); drawText(ctx, `PP ${mv.pp}/${d.pp}`, 188, y, "#8a8090", null); });
  } else {
    const line = monLine(m.id), pitch = line.length > 3 ? 29 : 38, at = line.findIndex(q => q.id === m.id);
    drawText(ctx, `H/A/D/S:  NOW LV ${m.level}`, 8, 21, "#8a8090", null); drawText(ctx, `MAX LV ${MAX_LEVEL}`, 236 - textWidth(`MAX LV ${MAX_LEVEL}`), 21, "#fcd888", null);
    line.forEach((st, i) => {
      const y = 31 + i * pitch, cur = st.id === m.id, s2 = SPECIES[st.id];
      const now = { id: st.id, level: m.level }, max = { id: st.id, level: MAX_LEVEL }; calcStats(now); calcStats(max);
      frameBox(ctx, 2, y, W - 4, pitch - 2, cur);
      ctx.drawImage(MON_ART[st.id].front, 7, y + 1, 25, 25);
      drawText(ctx, s2.name.toUpperCase(), 36, y + 4, cur ? "#fcd888" : INK, INK_SH);
      drawText(ctx, cur ? "CURRENT" : i < at ? (st.lv ? "FROM LV " + st.lv : "FIRST FORM") : "AT LV " + st.lv, 36, y + 15, cur ? "#94d66c" : i > at ? "#86c6f0" : "#8a8090", null);
      s2.types.forEach((ty, k) => { R(ctx, TYPE_COLOR[ty], 112 + k * 8, y + 4, 6, 8); });
      [["H", now.maxhp, max.maxhp], ["A", now.atk, max.atk], ["D", now.dfn, max.dfn], ["S", now.spd, max.spd]].forEach(([l, a, b2], k) => {
        const X = 128 + (k % 2) * 56, Y = y + 4 + Math.floor(k / 2) * 11;
        drawText(ctx, l, X, Y, "#8a8090", null); drawText(ctx, String(a), X + 28 - textWidth(String(a)), Y, INK, null); drawText(ctx, String(b2), X + 50 - textWidth(String(b2)), Y, "#fcd888", null);
      });
    });
  }
  const hint = page === 0 ? "RIGHT: EVO LINE  UP/DOWN: MON  B: BACK" : "LEFT: STATUS  UP/DOWN: MON  B: BACK";
  drawText(ctx, hint, 120 - textWidth(hint) / 2, 150, "#8a8090", null);
}
