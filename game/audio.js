// Chiptune engine (2 pulse + triangle + noise), original songs, sound effects and narration.
const Sound = (() => {
  let ac = null, master, music, sfx, waves = {}, noiseBuf;
  let song = null, songName = "", timer = null, nextTime = 0, step = 0;
  let muted = false;

  const midi = n => {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return null;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return 12 * (+m[3] + 1) + base;
  };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function pulse(d) {
    const N = 32, re = new Float32Array(N), im = new Float32Array(N);
    for (let n = 1; n < N; n++) { re[n] = Math.sin(2 * Math.PI * n * d) / (n * Math.PI); im[n] = (1 - Math.cos(2 * Math.PI * n * d)) / (n * Math.PI); }
    return ac.createPeriodicWave(re, im);
  }

  function init() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = 0.5; music.connect(master);
    sfx = ac.createGain(); sfx.gain.value = 0.6; sfx.connect(master);
    waves = { p12: pulse(0.125), p25: pulse(0.25), p50: pulse(0.5) };
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(dest, wave, freq, t, dur, vol, slide) {
    const o = ac.createOscillator(), g = ac.createGain();
    if (wave === "tri") o.type = "triangle"; else o.setPeriodicWave(waves[wave]);
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setValueAtTime(vol * 0.75, t + Math.min(0.06, dur * 0.4));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dest, t, dur, vol, freq = 6000, type = "highpass") {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function drum(kind, t) {
    if (kind === "k") tone(music, "tri", 140, t, 0.12, 0.9, 40);
    else if (kind === "s") { noise(music, t, 0.12, 0.35, 1800, "bandpass"); tone(music, "tri", 220, t, 0.05, 0.25, 120); }
    else if (kind === "h") noise(music, t, 0.03, 0.12, 8000);
    else if (kind === "o") noise(music, t, 0.18, 0.12, 7000);
  }

  // ---- song building helpers ----
  const seq = pairs => { const out = []; for (const [n, d] of pairs) { out.push(n); for (let i = 1; i < d; i++) out.push(n === "." ? "." : "-"); } return out; };
  const rep = (arr, n) => Array.from({ length: n }, () => arr).flat();
  const up = (n, o) => n === "." || n === "-" ? n : n.replace(/\d$/, d => +d + o);
  function bass(roots, perChord, style) {
    const out = [];
    for (const r of roots) for (let i = 0; i < perChord; i++) {
      const pos = i % 4;
      if (style === "drive") out.push(pos === 2 ? up(r, 1) : r);
      else if (style === "march") out.push(pos === 0 ? r : pos === 2 ? up(r, 1) : ".");
      else out.push(i === 0 ? r : "-");
    }
    return out;
  }
  function arp(chords, perChord, octave) {
    const out = [];
    for (const c of chords) for (let i = 0; i < perChord; i++) out.push(i % 2 ? "." : c[(i / 2) % c.length].replace(/\d$/, octave));
    return out;
  }
  const drums = (pattern, bars) => rep(pattern.split(""), bars);

  const SONGS = {
    title: () => ({
      bpm: 84,
      lead: seq([["E5", 6], ["D5", 2], ["C5", 4], ["B4", 4], ["A4", 8], [".", 4], ["E4", 2], ["A4", 2],
                 ["F5", 6], ["E5", 2], ["D5", 4], ["C5", 4], ["E5", 12], [".", 4],
                 ["G5", 6], ["F5", 2], ["E5", 4], ["D5", 4], ["C5", 6], ["D5", 2], ["E5", 8],
                 ["A4", 4], ["B4", 4], ["C5", 4], ["B4", 4], ["A4", 16]]),
      harm: arp([["A", "C", "E"], ["F", "A", "C"], ["C", "E", "G"], ["G", "B", "D"]].map(c => c.map(n => n + "4")), 16, 4)
              .concat(arp([["F", "A", "C"], ["C", "E", "G"], ["G", "B", "D"], ["A", "C", "E"]].map(c => c.map(n => n + "4")), 16, 4)),
      bass: bass(["A2", "F2", "C3", "G2", "F2", "C3", "G2", "A2"], 16, "hold"),
      drum: drums("k.......s.......", 8), leadWave: "p25", vol: 0.8,
    }),
    intro: () => ({
      bpm: 60,
      lead: seq([[".", 8], ["D5", 8], ["C5", 4], ["A4", 4], ["Bb4", 12], [".", 4], ["A4", 8], ["F4", 4], ["G4", 4], ["A4", 16],
                 [".", 8], ["F5", 8], ["E5", 4], ["D5", 4], ["C5", 12], [".", 4], ["Bb4", 4], ["A4", 4], ["G4", 8], ["A4", 16]]),
      harm: [], bass: bass(["D2", "Bb1", "F2", "A1", "D2", "Bb1", "C2", "A1"], 16, "hold"),
      drum: drums("k...............", 8), leadWave: "p12", vol: 0.7,
    }),
    camp: () => ({
      bpm: 104,
      lead: seq([["G4", 2], ["C5", 2], ["E5", 4], ["D5", 2], ["C5", 2], ["D5", 4], ["E5", 2], ["G5", 2], ["F5", 2], ["E5", 2], ["D5", 8],
                 ["C5", 2], ["D5", 2], ["E5", 4], ["F5", 2], ["E5", 2], ["D5", 4], ["C5", 2], ["A4", 2], ["B4", 4], ["C5", 8]]),
      harm: arp([["C", "E", "G"], ["F", "A", "C"], ["G", "B", "D"], ["C", "E", "G"]].map(c => c.map(n => n + "4")), 16, 3),
      bass: bass(["C2", "F2", "G2", "C2"], 16, "march"),
      drum: drums("k.h.s.h.k.h.s.hh", 4), leadWave: "p50", vol: 0.75,
    }),
    route: () => ({
      bpm: 132,
      lead: seq([["E5", 3], ["B4", 1], ["E5", 2], ["F#5", 2], ["G5", 4], ["F#5", 2], ["E5", 2], ["D5", 3], ["A4", 1], ["D5", 2], ["E5", 2], ["F#5", 8],
                 ["G5", 3], ["E5", 1], ["C5", 4], ["D5", 2], ["E5", 2], ["D5", 4], ["B4", 4], ["E5", 4], ["D#5", 4], ["E5", 8]]),
      harm: arp([["E", "G", "B"], ["C", "E", "G"], ["D", "F#", "A"], ["B", "D#", "F#"]].map(c => c.map(n => n + "4")), 16, 4),
      bass: bass(["E2", "C2", "D2", "B1"], 16, "drive"),
      drum: drums("k.h.s.h.k.k.s.h.", 4), leadWave: "p25", vol: 0.7,
    }),
    battle: () => ({
      bpm: 158,
      lead: seq([["A4", 2], ["C5", 2], ["E5", 2], ["A5", 2], ["G5", 4], ["E5", 4], ["F5", 2], ["E5", 2], ["D5", 2], ["C5", 2], ["D5", 8],
                 ["E5", 2], ["D5", 2], ["C5", 2], ["B4", 2], ["C5", 4], ["A4", 4], ["G#4", 2], ["B4", 2], ["E5", 4], ["E4", 8]]),
      harm: arp([["A", "C", "E"], ["G", "B", "D"], ["F", "A", "C"], ["E", "G#", "B"]].map(c => c.map(n => n + "4")), 16, 4),
      bass: bass(["A1", "G1", "F1", "E1"], 16, "drive"),
      drum: drums("k.hhs.hhk.hks.hh", 4), leadWave: "p25", vol: 0.7,
    }),
    boss: () => ({
      bpm: 170,
      lead: seq([["D5", 2], ["D5", 2], ["F5", 2], ["D5", 2], ["G#5", 4], ["A5", 4], ["F5", 2], ["E5", 2], ["D5", 2], ["C#5", 2], ["D5", 8],
                 ["Bb4", 2], ["D5", 2], ["F5", 2], ["Bb5", 2], ["A5", 4], ["G5", 4], ["F5", 2], ["G5", 2], ["E5", 4], ["C#5", 8]]),
      harm: arp([["D", "F", "A"], ["D", "F", "G#"], ["Bb", "D", "F"], ["A", "C#", "E"]].map(c => c.map(n => n + "4")), 16, 4),
      bass: bass(["D2", "D2", "Bb1", "A1"], 16, "drive"),
      drum: drums("kkhhs.hhkkhks.ss", 4), leadWave: "p12", vol: 0.75,
    }),
    victory: () => ({
      bpm: 132, once: true,
      lead: seq([["C5", 2], ["C5", 2], ["C5", 2], ["C5", 4], ["G#4", 4], ["A#4", 4], ["C5", 3], ["A#4", 1], ["C5", 12]]),
      harm: seq([["E4", 2], ["E4", 2], ["E4", 2], ["E4", 4], ["C4", 4], ["D4", 4], ["E4", 3], ["D4", 1], ["E4", 12]]),
      bass: seq([["C2", 6], ["G#1", 4], ["A#1", 4], ["C2", 16]]), drum: drums("k.k.k.s.k.s.k.s.", 2), leadWave: "p50", vol: 0.8,
    }),
  };

  function compile(raw) {
    const len = Math.max(raw.lead.length, raw.harm.length, raw.bass.length, raw.drum.length);
    const events = { lead: [], harm: [], bass: [] };
    for (const ch of ["lead", "harm", "bass"]) {
      const a = raw[ch];
      for (let i = 0; i < a.length; i++) {
        const m = midi(a[i]); if (m == null) continue;
        let l = 1; while (a[i + l] === "-") l++;
        events[ch][i] = { m, l };
      }
    }
    return { ...raw, len, events };
  }

  function schedule() {
    if (!song) return;
    const spb = 60 / song.bpm / 4;
    while (nextTime < ac.currentTime + 0.15) {
      if (song.once && step >= song.len) { stopMusic(); return; }
      const i = step % song.len, v = song.vol;
      const L = song.events.lead[i], Hm = song.events.harm[i], B = song.events.bass[i], D = song.drum[i];
      if (L) tone(music, song.leadWave, hz(L.m), nextTime, L.l * spb * 0.95, 0.16 * v);
      if (Hm) tone(music, "p12", hz(Hm.m), nextTime, Hm.l * spb * 0.9, 0.07 * v);
      if (B) tone(music, "tri", hz(B.m), nextTime, B.l * spb * 0.95, 0.38 * v);
      if (D && D !== ".") drum(D, nextTime);
      nextTime += spb; step++;
    }
  }

  function play(name) {
    if (!ac || songName === name) return;
    stopMusic(); songName = name;
    song = compile(SONGS[name]()); step = 0; nextTime = ac.currentTime + 0.05;
    music.gain.cancelScheduledValues(ac.currentTime); music.gain.setValueAtTime(muted ? 0 : 0.5, ac.currentTime);
    timer = setInterval(schedule, 25); schedule();
  }
  function stopMusic() { if (timer) clearInterval(timer); timer = null; song = null; songName = ""; }

  const SFX = {
    swing: () => { const t = ac.currentTime; noise(sfx, t, 0.14, 0.35, 2600, "bandpass"); tone(sfx, "p12", 900, t, 0.08, 0.06, 300); },
    blip: () => tone(sfx, "p50", 1320, ac.currentTime, 0.04, 0.12),
    select: () => { const t = ac.currentTime; tone(sfx, "p25", 880, t, 0.05, 0.14); tone(sfx, "p25", 1320, t + 0.05, 0.07, 0.14); },
    bump: () => tone(sfx, "p50", 110, ac.currentTime, 0.08, 0.15),
    hit: () => { const t = ac.currentTime; noise(sfx, t, 0.16, 0.5, 900, "lowpass"); tone(sfx, "p50", 180, t, 0.12, 0.2, 60); },
    crit: () => { const t = ac.currentTime; noise(sfx, t, 0.3, 0.6, 1200, "lowpass"); tone(sfx, "p25", 300, t, 0.25, 0.25, 50); },
    weak: () => noise(sfx, ac.currentTime, 0.08, 0.3, 1500, "lowpass"),
    stat: () => { const t = ac.currentTime; for (let i = 0; i < 4; i++) tone(sfx, "p25", 600 + i * 200, t + i * 0.05, 0.06, 0.12); },
    faint: () => tone(sfx, "p50", 600, ac.currentTime, 0.6, 0.18, 80),
    heal: () => { const t = ac.currentTime; [523, 659, 784, 1046].forEach((f, i) => tone(sfx, "p25", f, t + i * 0.09, 0.12, 0.12)); },
    level: () => { const t = ac.currentTime; [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(sfx, "p50", f, t + i * 0.08, 0.1, 0.13)); },
    spot: () => { const t = ac.currentTime; tone(sfx, "p25", 1046, t, 0.08, 0.15); tone(sfx, "p25", 1568, t + 0.08, 0.15, 0.15); },
    shake: () => tone(sfx, "p50", 220, ac.currentTime, 0.07, 0.15),
    capture: () => { const t = ac.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(sfx, "p25", f, t + i * 0.07, 0.1, 0.14)); },
    door: () => { const t = ac.currentTime; noise(sfx, t, 0.2, 0.2, 600, "lowpass"); },
    encounter: () => { const t = ac.currentTime; for (let i = 0; i < 6; i++) tone(sfx, "p25", i % 2 ? 1500 : 1000, t + i * 0.06, 0.05, 0.12); },
  };
  function fx(name) { if (ac && !muted && SFX[name]) SFX[name](); }

  // ---- narration: pre-recorded voice lines in voice/<key>.mp3 ----
  // Clips are fetched and decoded when the page is served over http(s). A page opened straight from disk (file://) is not allowed to
  // fetch, so there the same clip plays through a plain <audio> element instead.
  const VOICE = false;          // voice acting removed: every line is text only; the narration timer still paces the intro and ending
  const voiceCache = {};
  let speaking = null;
  function loadVoice(key) {
    if (!voiceCache[key]) {
      const url = "voice/" + key + ".mp3";
      const viaElement = () => new Promise((res, rej) => {
        const el = new Audio(); el.preload = "auto";
        el.addEventListener("canplaythrough", () => res({ el }), { once: true });
        el.addEventListener("error", () => rej(new Error("missing")), { once: true });
        el.src = url; el.load();
      });
      voiceCache[key] = (location.protocol === "file:" ? viaElement()
        : fetch(url).then(r => { if (!r.ok) throw new Error("missing"); return r.arrayBuffer(); }).then(b => ac.decodeAudioData(b)).catch(viaElement));
      voiceCache[key].catch(() => { delete voiceCache[key]; });
    }
    return voiceCache[key];
  }
  function preload(keys) { if (ac && VOICE) keys.forEach(k => loadVoice(k).catch(() => {})); }
  // start a loaded clip; returns a handle with stop()
  function startClip(clip, vol, onEnd) {
    if (clip.el) {
      const el = clip.el; try { el.currentTime = 0; } catch (e) {}
      el.volume = Math.min(1, vol * 0.62); el.onended = onEnd; el.play().catch(() => onEnd && onEnd());
      return { stop() { el.onended = null; el.pause(); } };
    }
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = clip; g.gain.value = vol; src.connect(g); g.connect(master); src.onended = onEnd; src.start();
    return { stop() { src.onended = null; try { src.stop(); } catch (e) {} } };
  }
  function narrate(key, text = "") {
    return new Promise(res => {
      let settled = false;
      const done = () => { if (!settled) { settled = true; res(); } };
      const fallback = setTimeout(done, 1800 + text.length * 65);
      if (!VOICE || !ac || muted) return;
      loadVoice(key).then(clip => {
        if (settled) return;
        clearTimeout(fallback);
        hush();
        music.gain.setTargetAtTime(0.18, ac.currentTime, 0.25);
        const h = startClip(clip, 1.15, () => { if (speaking === h) speaking = null; music.gain.setTargetAtTime(muted ? 0 : 0.5, ac.currentTime, 0.5); setTimeout(done, 450); });
        speaking = h;
      }).catch(() => {});
    });
  }
  // dialogue: start a clip without waiting on it; the next line (or hush) cuts it off
  function speak(key) {
    if (!VOICE || !ac || muted) return;
    const mine = speak.want = key;
    loadVoice(key).then(clip => {
      if (speak.want !== mine) return;
      hush(); speak.want = mine;
      music.gain.setTargetAtTime(0.22, ac.currentTime, 0.2);
      const h = startClip(clip, 1.2, () => { if (speaking === h) { speaking = null; music.gain.setTargetAtTime(muted ? 0 : 0.5, ac.currentTime, 0.5); } });
      speaking = h;
    }).catch(() => {});
  }
  function hush() { speak.want = null; if (speaking) { speaking.stop(); speaking = null; if (ac) music.gain.setTargetAtTime(muted ? 0 : 0.5, ac.currentTime, 0.3); } }

  return { init, play, stop: stopMusic, fx, narrate, speak, hush, preload, get ready() { return !!ac; }, get speaking() { return !!speaking; } };
})();
