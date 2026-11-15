/* ===================== GOALBOUND — core helpers, audio, avatar, save ===================== */
const FBU = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  rng(seed) { let s = typeof seed === 'string' ? [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0 : seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
  pick: (a, r = Math.random) => a[(r() * a.length) | 0],
  poisson(l, r = Math.random) { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= r(); } while (p > L && k < 12); return k - 1; },
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  trU: s => String(s).toLocaleUpperCase('tr-TR'),
  // Readable text colour on a kit colour
  ink(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff'; },
  // Match rating from the player's real match stats (no randomness)
  rate(u, gf, ga) {
    const n = k => u[k] || 0;
    const r = 6.2 + n('g') * 1 + n('a') * .7 + n('pk') * .12 + n('sot') * .12 + n('dr') * .06 + n('post') * .05
      - n('pf') * .22 - n('lost') * .25 - n('err') * .35 - n('miss') * .15 - n('wide') * .08 - n('blk') * .08 + FBU.clamp((gf - ga) * .12, -.4, .4);
    return Math.round(FBU.clamp(r, 3, 10) * 10) / 10;
  },
  // Club colours → UI theme: a bright, readable accent for buttons/selection and dark panels/backgrounds.
  // Every pair is contrast-checked (WCAG ratio), so text stays readable whatever the kit colours are.
  theme(c1, c2) {
    const rgb = h => { h = String(h || '#22c55e').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16) || 0; return [n >> 16, n >> 8 & 255, n & 255]; };
    const hex = c => '#' + c.map(v => Math.round(FBU.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
    const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
    const con = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const sat = c => { const mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
    const W = [255, 255, 255], K = [0, 0, 0], A = rgb(c1), B = rgb(c2);
    // accent: the more colourful kit colour (falls back to the lighter one for black/white clubs)
    let acc = sat(A) < .25 && sat(B) < .25 ? (lum(A) > lum(B) ? A : B) : (sat(A) * (.4 + Math.min(lum(A), .5)) >= sat(B) * (.4 + Math.min(lum(B), .5)) ? A : B);
    const base0 = acc === A ? B : A, base = sat(base0) > .25 ? base0 : sat(acc) > .25 ? acc : [40, 48, 56];   // tint for the dark surfaces
    const bg3 = mix(base, K, .93), bg2 = mix(base, K, .88), bg1 = mix(base, K, .76);
    for (let i = 0; i < 12 && con(acc, bg2) < 4.2; i++) acc = mix(acc, W, .12);   // lift dark accents until they read on the background
    for (let i = 0; i < 12 && lum(acc) > .75 && sat(acc) < .25 && con(acc, bg2) > 14; i++) acc = mix(acc, [210, 214, 220], .5);   // soften pure white
    const ink = c => con(c, W) >= con(c, [8, 12, 10]) ? '#fff' : '#0b0f0c';
    const accd = mix(acc, K, .32), accs = mix(acc, K, .62), tone = (g, t) => hex(mix(g, acc, t));
    const v = { '--acc': hex(acc), '--accd': hex(accd), '--accs': hex(accs), '--onacc': ink(acc), '--onaccd': ink(accd), '--acc2': hex(mix(acc, W, lum(acc) > .5 ? .15 : .4)),
      '--bg1': hex(bg1), '--bg2': hex(bg2), '--bg3': hex(bg3), '--panel': hex(mix(base, K, .8)), '--panel2': hex(mix(base, K, .62)), '--line': 'rgba(255,255,255,.1)',
      '--tx': '#f1f4f2', '--mut': tone([196, 204, 206], .14), '--mut2': tone([150, 160, 164], .12), '--sub': tone([226, 232, 234], .12) };
    v._con = { acc: +con(acc, bg2).toFixed(2), onacc: +con(acc, rgb(v['--onacc'])).toFixed(2), onaccd: +con(accd, rgb(v['--onaccd'])).toFixed(2), mut: +con(rgb(v['--mut']), bg1).toFixed(2), mut2: +con(rgb(v['--mut2']), bg1).toFixed(2), tx: +con(rgb('#f1f4f2'), mix(base, K, .62)).toFixed(2) };
    return v;
  },
  // True when the device asks for reduced motion (no shake / confetti)
  calm: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
  hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return (h >>> 0).toString(36); }
};

/* ---------- Club & squad access ---------- */
const FBT = {
  team(id) {
    const [lg, i] = id.split(':'), L = FB_LEAGUES.find(l => l.id === lg), t = L.teams[+i];
    return { id, lg: L, name: t[0], abbr: t[1], c1: t[2], c2: t[3], r: t[4] };
  },
  league: id => FB_LEAGUES.find(l => l.id === id),
  ids: lg => FBT.league(lg).teams.map((_, i) => lg + ':' + i),
  all: () => FB_LEAGUES.flatMap(l => FBT.ids(l.id)),
  badge(t, size = 34) {
    const c1 = t.c1, c2 = t.c2 === t.c1 ? '#ffffff' : t.c2;
    return `<span class="fb-badge" style="width:${size}px;height:${size * 1.15}px;--b1:${c1};--b2:${c2};font-size:${Math.max(7, size * .26)}px">${size >= 18 ? `<i>${FBU.esc(t.abbr)}</i>` : ''}</span>`;
  },
  ROLES: ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LCM', 'CM', 'RCM', 'LW', 'ST', 'RW'],
  NUMS: { GK: 1, LB: 3, LCB: 4, RCB: 5, RB: 2, LCM: 8, CM: 6, RCM: 10, LW: 11, ST: 9, RW: 7 },
  // Career name seed (set from the save's creation id); every career gets its own player names
  seed: '',
  _sq: null,
  // Deterministic 11 for a club, from the career-wide name table (real roster from FB_ROSTERS if provided)
  squad(id) {
    if (!FBT._sq || FBT._sq.seed !== FBT.seed) FBT._sq = { seed: FBT.seed, map: FBT._build(FBT.seed) };
    return FBT._sq.map[id].map(p => ({ ...p }));
  },
  // Build every club's 11 in fixed order so no name repeats anywhere in the career and nobody plays for two clubs
  _build(seed) {
    const used = new Set(), map = {};
    FBT.all().forEach(id => {
      const t = FBT.team(id), r = FBU.rng('sq' + seed + id), L = t.lg, real = FB_ROSTERS[id], shorts = new Set();
      const dom = FBU.clamp(L.dom - (t.r - 72) * .012, .2, .9), foreign = FB_FOREIGN.filter(n => n !== L.nat && FB_NAMES[n]);
      map[id] = FBT.ROLES.map((role, k) => {
        let name, nat = L.nat;
        if (real && real[k]) name = real[k];
        else {
          for (let tries = 0; ; tries++) {
            nat = r() < dom ? L.nat : FBU.pick(foreign, r);
            const [f, s] = FB_NAMES[nat] || FB_NAMES.world;
            name = FBU.pick(f.split(','), r) + ' ' + FBU.pick(s.split(','), r);
            if (!used.has(name) && !FB_BLOCK.has(name) && (!shorts.has(name.split(' ').slice(-1)[0]) || tries > 30)) break;
          }
          used.add(name);
        }
        shorts.add(name.split(' ').slice(-1)[0]);
        let num = FBT.NUMS[role]; if (r() < .35 && role !== 'GK') num = [14, 17, 19, 20, 21, 22, 23, 27, 33, 77, 88, 99][(r() * 12) | 0];
        return { role, name, nat, short: name.split(' ').slice(-1)[0], num, sk: FBU.clamp(t.r / 100 + (r() - .5) * .12, .45, .97) };
      });
    });
    return map;
  }
};

/* ---------- Central audio (all synthesized; per-sound cooldowns; 3 volume buses) ---------- */
const FBA = (() => {
  let ctx = null, out = null, master, sfx, crowd, verb, nb, crowdG, crowdF, crowdG2, tension = 0, unlocked = false;
  const vol = Object.assign({ master: .9, sfx: .9, crowd: .7, hap: 1 }, (() => { try { return JSON.parse(localStorage.getItem('od_fb_vol') || '{}'); } catch (e) { return {}; } })());
  const last = {}, R = Math.random;
  // Create the audio graph once: compressor → master; sfx and crowd buses; a synthetic stadium reverb; the crowd bed
  function init() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume().catch(() => {}); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.connect(ctx.destination); out = comp;
    master = ctx.createGain(); master.connect(comp); sfx = ctx.createGain(); sfx.connect(master); crowd = ctx.createGain(); crowd.connect(master); apply();
    nb = ctx.createBuffer(2, ctx.sampleRate * 3, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = nb.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; }
    // Open-air stadium reverb: stereo noise impulse with a fast early part and a long thin tail
    const len = ctx.sampleRate * 1.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) { const t = i / ctx.sampleRate; d[i] = (R() * 2 - 1) * (Math.exp(-t * 3.2) * .55 + (t < .08 ? .35 * Math.exp(-t * 30) : 0)); } }
    verb = ctx.createConvolver(); verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = .3; verb.connect(vg); vg.connect(master);
    const sv = ctx.createGain(); sv.gain.value = .35; sfx.connect(sv); sv.connect(verb);   // every effect gets a little stadium space
    const cv = ctx.createGain(); cv.gain.value = .25; crowd.connect(cv); cv.connect(verb);
    // Crowd bed: speech-band noise in three formant bands, each "chattering" at a syllable rate, then darkened
    crowdF = ctx.createBiquadFilter(); crowdF.type = 'lowpass'; crowdF.frequency.value = 1500; crowdG = ctx.createGain(); crowdG.gain.value = 0; crowdF.connect(crowdG); crowdG.connect(crowd);
    [[420, 1.1, 3.7, .14], [950, 1.4, 5.1, .21], [2100, 1.8, 4.4, .31]].forEach(([f, q, syl, slow], k) => {
      const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      const g = ctx.createGain(); g.gain.value = [.9, .7, .35][k]; s.connect(bp); bp.connect(g); g.connect(crowdF); s.start(0, R() * 2);
      [[syl, .28], [slow, .3]].forEach(([fr, dep]) => { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = fr; lg.gain.value = g.gain.value * dep; l.connect(lg); lg.connect(g.gain); l.start(); });
    });
    // "Excited" layer: brighter voices that only come up when play gets dangerous
    const s2 = ctx.createBufferSource(); s2.buffer = nb; s2.loop = true; const b2 = ctx.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = 1300; b2.Q.value = .9;
    crowdG2 = ctx.createGain(); crowdG2.gain.value = 0; s2.connect(b2); b2.connect(crowdG2); crowdG2.connect(crowd); s2.start(0, R() * 2);
    const l2 = ctx.createOscillator(), lg2 = ctx.createGain(); l2.frequency.value = 6.2; lg2.gain.value = .02; l2.connect(lg2); lg2.connect(crowdG2.gain); l2.start();
    setTimeout(bake, 400);   // pre-render the heavy crowd sounds in the background
  }
  // Android/iOS only allow audio after a real gesture (touchend / click / key): retry there and prime with a silent buffer
  function unlock() {
    init(); if (!ctx) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (!unlocked) { unlocked = true; try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) {} }
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  function apply() { if (!ctx) return; master.gain.value = vol.master; sfx.gain.value = vol.sfx; crowd.gain.value = vol.crowd; }
  const ok = (k, cd) => { if (!ctx || ctx.state !== 'running') return false; const t = ctx.currentTime; if (last[k] && t - last[k] < cd) return false; last[k] = t; return true; };
  // One-shot oscillator with a short attack and exponential decay
  function tone(f, d, type = 'sine', g = .2, t0 = 0, f2 = 0, bus = sfx, att = .004) { const o = ctx.createOscillator(), gg = ctx.createGain(), t = ctx.currentTime + t0; o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + att); gg.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(gg); gg.connect(bus); o.start(t); o.stop(t + d + .03); return o; }
  // Filtered noise burst (optionally sweeping) with attack/decay
  function noise(d, type, f, g, t0 = 0, f2 = 0, q = 1, bus = sfx, att = .005) { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), gg = ctx.createGain(), t = ctx.currentTime + t0; s.buffer = nb; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d); gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + att); gg.gain.exponentialRampToValueAtTime(.0008, t + d); s.connect(fl); fl.connect(gg); gg.connect(bus); s.start(t, R() * 2); s.stop(t + d + .05); }
  // Crowd voices: many men's and women's voices (detuned, staggered, with vibrato) shaped into a vowel by two formants.
  // glide = [peak, end] pitch ratios; a breathy noise layer makes it sound like people rather than synths.
  const VOW = { oo: [390, 920], oh: [480, 880], ah: [720, 1180], eh: [530, 1800] };
  function voices(n, f0, d, g, vow = 'ah', glide = [1, 1], t0 = 0) {
    const t = ctx.currentTime + t0, [F1, F2] = VOW[vow], out = ctx.createGain(), lp = ctx.createBiquadFilter(), a = ctx.createBiquadFilter(), b = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2400; a.type = b.type = 'bandpass'; a.frequency.value = F1; a.Q.value = 2.5; b.frequency.value = F2; b.Q.value = 3;
    const ag = ctx.createGain(), bg = ctx.createGain(); ag.gain.value = 1; bg.gain.value = .55; a.connect(ag); b.connect(bg); const hp = ctx.createBiquadFilter(), hp2 = ctx.createBiquadFilter(); hp.type = hp2.type = 'highpass'; hp.frequency.value = hp2.frequency.value = 270; hp.Q.value = hp2.Q.value = .7;   // phone speakers cannot play the low end: keep it clean
    ag.connect(lp); bg.connect(lp); lp.connect(hp); hp.connect(hp2); hp2.connect(out); out.connect(crowd);
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(g, t + Math.min(.35, d * .28)); out.gain.setValueAtTime(g, t + d * .5); out.gain.exponentialRampToValueAtTime(.001, t + d);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(), og = ctx.createGain(), v = ctx.createOscillator(), vg = ctx.createGain(), base = f0 * (i % 3 === 2 ? 1.75 : 1) * (.86 + R() * .3), st = t + R() * .12 * d;
      o.type = 'sawtooth'; o.frequency.setValueAtTime(base, st); o.frequency.linearRampToValueAtTime(base * glide[0], st + d * .35); o.frequency.linearRampToValueAtTime(base * glide[1], t + d);
      v.frequency.value = 4.5 + R() * 2.5; vg.gain.value = base * .025; v.connect(vg); vg.connect(o.frequency);
      og.gain.value = 4.5 / n; o.connect(og); og.connect(a); og.connect(b); o.start(st); v.start(st); o.stop(t + d + .05); v.stop(t + d + .05);
    }
    noise(d, 'bandpass', F1 * 1.5, 1.4, t0, 0, .7, hp, Math.min(.35, d * .28));
  }
  // Crowd applause: dozens of individual hand claps scattered over time
  function claps(n, dur, g, t0 = 0) { for (let i = 0; i < n; i++) noise(.035 + R() * .03, 'bandpass', 1100 + R() * 1600, g * (.5 + R() * .5), t0 + R() * dur, 0, 1.3, crowd, .002); }
  // Crowd recipes: heavy many-voice syntheses. Rendered once into buffers (see bake) so a goal costs 3 nodes instead of ~1000.
  const CROWD = {
    goal: [7.6, () => { voices(24, 160, 4.6, 1.5, 'ah', [1.18, 1.05]); noise(4.8, 'bandpass', 1000, 1.3, 0, 700, .5, crowd, .2); claps(90, 3.5, .5, .6); chantSynth(2.8); }, 3],
    ooh: [2, () => voices(16, 170, 1.8, .55, 'oo', [1.12, .82]), 3],
    groan: [1.7, () => voices(14, 160, 1.5, .42, 'oh', [1, .8]), 2],
    boo: [2.3, () => { voices(18, 135, 2.1, .55, 'oo', [.97, .92]); noise(1.8, 'bandpass', 520, .3, 0, 0, 1.2, crowd, .3); }, 2],
    clap: [1.7, () => claps(70, 1.4, .55), 2],
    chant: [4.5, () => chantSynth(0), 2],
    applause: [2.5, () => claps(60, 2, .45, .2), 1]
  };
  // Rhythmic terrace chant: three claps + a sung "oh"
  function chantSynth(delay) { for (let b = 0; b < 3; b++) [0, .3, .6].forEach(o => claps(18, .05, .5, delay + b * 1.2 + o)); voices(16, 200, 3.2, .4, 'oh', [1, 1], delay); }
  const baked = {};
  // Render one recipe offline: temporarily point the synth helpers at an OfflineAudioContext
  function bakeOne(dur, fn) {
    const live = [ctx, crowd, sfx], off = new OfflineAudioContext(2, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), bus = off.createGain();
    bus.connect(off.destination); ctx = off; crowd = sfx = bus;
    try { fn(); } finally { [ctx, crowd, sfx] = live; }
    return off.startRendering();
  }
  // Pre-render every crowd recipe (a few variations each), one at a time in the background
  async function bake() {
    if (!window.OfflineAudioContext) return;
    for (const [name, [dur, fn, n]] of Object.entries(CROWD)) for (let i = 0; i < n; i++) {
      try { (baked[name] || (baked[name] = [])).push(await bakeOne(dur, fn)); } catch (e) { return; }
      await new Promise(r => setTimeout(r, 30));   // leave room for the game between renders
    }
  }
  // Play a crowd sound: a pre-rendered variation (slightly re-pitched) or, until baking is done, the live synthesis
  function crowdFx(name, delay = 0) {
    const list = baked[name];
    if (!list || !list.length) { if (delay) setTimeout(CROWD[name][1], delay * 1000); else CROWD[name][1](); return; }
    const s = ctx.createBufferSource(); s.buffer = list[(R() * list.length) | 0]; s.playbackRate.value = .97 + R() * .06; s.connect(crowd); s.start(ctx.currentTime + delay);
  }
  const S = {
    // Foot on ball: leather slap (mid band, carries on phone speakers) + short pitch-dropping body + air tick
    kick(p = .5) { if (!ok('kick', .05)) return; noise(.04 + p * .03, 'bandpass', 1300 + p * 700, .5 + p * .4, 0, 700, 1.2, sfx, .0015); tone(180 + p * 70, .08 + p * .04, 'triangle', .4 + p * .3, 0, 60, sfx, .002); noise(.012, 'highpass', 5000, .15 + p * .15, 0, 0, .7, sfx, .001); },
    pass() { if (!ok('pass', .05)) return; noise(.035, 'bandpass', 1100, .38, 0, 650, 1.2, sfx, .0015); tone(200, .07, 'triangle', .28, 0, 80, sfx, .002); },
    touch() { if (!ok('touch', .08)) return; noise(.025, 'bandpass', 900, .16, 0, 0, 1.3, sfx, .002); tone(230, .04, 'triangle', .1, 0, 120); },
    bounce(p = .5) { if (!ok('bounce', .08)) return; noise(.03, 'bandpass', 700, .2 * p, 0, 0, 1, sfx, .002); tone(140, .06, 'triangle', .14 * p, 0, 70); },
    // Referee pea whistle: shrill tone with the pea's fast pitch + loudness trill and breath noise
    whistle(type = 'short') {
      if (!ok('wh', .3)) return;
      const blow = (t0, d) => {
        const t = ctx.currentTime + t0, o = ctx.createOscillator(), o2 = ctx.createOscillator(), am = ctx.createGain(), env = ctx.createGain(), fm = ctx.createOscillator(), fg = ctx.createGain(), amo = ctx.createOscillator(), amg = ctx.createGain();
        o.frequency.setValueAtTime(3100, t); o.frequency.linearRampToValueAtTime(2980, t + d); o2.frequency.setValueAtTime(6150, t);
        fm.frequency.value = 31; fg.gain.value = 110; fm.connect(fg); fg.connect(o.frequency);
        am.gain.value = .6; amo.frequency.value = 31; amg.gain.value = .4; amo.connect(amg); amg.connect(am.gain);
        const g2 = ctx.createGain(); g2.gain.value = .12; o.connect(am); o2.connect(g2); g2.connect(am); am.connect(env); env.connect(sfx);
        env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(.17, t + .012); env.gain.setValueAtTime(.17, t + d - .05); env.gain.linearRampToValueAtTime(0, t + d);
        [o, o2, fm, amo].forEach(x => { x.start(t); x.stop(t + d + .02); });
        noise(d, 'bandpass', 3300, .05, t0, 0, 2, sfx, .01);
      };
      if (type === 'short') blow(0, .3); else if (type === 'long') blow(0, 1); else { blow(0, .38); blow(.55, .38); blow(1.1, 1.15); }
    },
    // Goal: the stadium erupts — big "aah" roar, roar noise swell, applause, then the chant
    goal() { if (ok('goal', 2)) { last.chant = ctx.currentTime + 2.8; crowdFx('goal'); } },
    ooh() { if (ok('ooh', 1.2)) crowdFx('ooh'); },
    groan() { if (ok('groan', 1.2)) crowdFx('groan'); },
    // Home crowd booing an opponent's foul: low, steady "oo" with a rumble underneath
    boo() { if (ok('boo', 2)) crowdFx('boo'); },
    clap() { if (ok('clap', 1.5)) crowdFx('clap'); },
    net() { if (!ok('net', .5)) return; noise(.45, 'highpass', 2600, .22, 0, 0, .7, sfx, .006); noise(.3, 'bandpass', 650, .25, .02, 0, .8, sfx, .01); },
    // Ball on the post: short metallic "tonk" with inharmonic partials, then the crowd's "ooh"
    post() { if (!ok('post', .4)) return; [[620, .55, .2], [1490, .35, .1], [2630, .22, .06], [3900, .15, .03]].forEach(([f, d, g]) => tone(f, d, 'sine', g, 0, 0, sfx, .001)); noise(.04, 'bandpass', 2400, .35, 0, 0, 1.5, sfx, .001); setTimeout(() => S.ooh(), 140); },
    // Keeper's gloves: padded slap and a thud; the crowd reacts
    save(catchIt) { if (!ok('save', .3)) return; noise(.08, 'bandpass', catchIt ? 800 : 1500, .5, 0, 0, 1.1, sfx, .001); tone(120, .12, 'triangle', .3, 0, 60, sfx, .002); setTimeout(() => S.ooh(), 110); },
    tackle() { if (!ok('tackle', .25)) return; noise(.2, 'lowpass', 700, .32, 0, 200, 1, sfx, .003); tone(95, .12, 'triangle', .28, 0, 50); noise(.16, 'bandpass', 1400, .1, .03, 500, .8); },
    chant(delay = 0) { if (ok('chant', 6)) crowdFx('chant', delay); },
    ui() { if (ok('ui', .04)) tone(1050, .04, 'sine', .09); },
    confirm() { if (ok('cf', .1)) { tone(660, .08, 'triangle', .12); tone(990, .12, 'triangle', .1, .06); } },
    back() { if (ok('bk', .1)) tone(520, .07, 'triangle', .08, 0, 380); },
    // Brass-like sting (filtered saws) over applause
    fanfare() {
      if (!ok('ff', 1)) return;
      [[523, 0], [659, .14], [784, .28], [1047, .46]].forEach(([f, t0]) => { const t = ctx.currentTime + t0, o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.004; lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2600, t + .08); lp.frequency.exponentialRampToValueAtTime(900, t + .6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .03); g.gain.exponentialRampToValueAtTime(.001, t + (t0 > .4 ? 1.1 : .5)); o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(sfx); [o, o2].forEach(x => { x.start(t); x.stop(t + 1.2); }); });
      crowdFx('applause');
    },
    sign() { if (ok('sg', 1)) [392, 523, 659, 784].forEach((f, i) => tone(f, .25, 'triangle', .12, i * .1)); },
    // Your moment: a broadcast-style whoosh while the crowd leans forward
    beat(k) { if (ok('beat', .2)) noise(.35, 'bandpass', 500, .13 * k, 0, 2400, 1.2, sfx, .15); }
  };
  return {
    // Vibrate on supported devices when haptics are enabled (Android Chrome; iOS ignores it)
    buzz(p) { try { if (vol.hap && vol.master > 0 && navigator.vibrate) navigator.vibrate(p); } catch (e) {} },
    // Crowd tension from how close the ball is to either goal (0 = midfield, 1 = inside the box)
    danger(x, y, pl) { const d = Math.min(Math.hypot(x - 34, y), Math.hypot(x - 34, pl - y)); this.crowdLevel(.3 + FBU.clamp(1 - (d - 8) / 28, 0, 1) * .65); },
    // Debug/test: a stream of the final mix (used to record and measure the sounds)
    _stream() { if (!ctx) return null; const d = ctx.createMediaStreamDestination(); out.connect(d); return d.stream; },
    get baked() { return Object.fromEntries(Object.entries(baked).map(([k, v]) => [k, v.length])); },
    init, vol, unlock, get state() { return ctx ? ctx.state : 'none'; }, play(n, a) { if (!ctx) return; try { S[n] && S[n](a); } catch (e) {} },
    // Crowd intensity 0..1: louder and brighter as play gets dangerous
    crowdLevel(x) { if (!ctx) return; tension = x; const t = ctx.currentTime; crowdG.gain.setTargetAtTime(.1 + x * .32, t, .45); crowdF.frequency.setTargetAtTime(1300 + x * 1500, t, .45); crowdG2.gain.setTargetAtTime(Math.max(0, x - .45) * .22, t, .4); },
    setVol(k, v) { vol[k] = v; apply(); try { localStorage.setItem('od_fb_vol', JSON.stringify(vol)); } catch (e) {} },
    stopCrowd() { if (ctx && crowdG) { crowdG.gain.setTargetAtTime(0, ctx.currentTime, .3); crowdG2.gain.setTargetAtTime(0, ctx.currentTime, .3); } },
    suspend() { if (ctx) ctx.suspend(); }, resume() { if (ctx) ctx.resume().catch(() => {}); }
  };
})();

/* ---------- Player avatar (front/back) drawn on canvas ---------- */
const FB_SKIN = ['#f1d3b6', '#e0b08b', '#c68a5e', '#9a6440', '#6b4128'];
const FB_HAIRC = ['#1b1b1b', '#4a2f1b', '#8a5a2b', '#d9b26a', '#b23a1f', '#c9c9c9'];
const FB_HAIRS = ['Kısa', 'Kazıtma', 'Kıvırcık', 'Uzun', 'Mohikan', 'Kel'];
const FB_BOOTS = ['#111111', '#ffffff', '#f5c400', '#22d3ee', '#ef4444', '#a3e635'];
function fbAvatar(cv, look, kit, num, name, back) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, s = W / 200;
  c.clearRect(0, 0, W, H); c.save(); c.scale(s, s);
  const skin = FB_SKIN[look.skin || 0], hc = FB_HAIRC[look.hairC || 0], hs = look.hair || 0, boots = FB_BOOTS[look.boots || 0];
  const c1 = kit.c1, c2 = kit.c2 === kit.c1 ? '#ffffff' : kit.c2, ink = FBU.ink(c1);
  // shadow, legs, socks, boots
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(100, 288, 52, 9, 0, 0, 7); c.fill();
  c.fillStyle = skin; c.fillRect(72, 200, 22, 50); c.fillRect(106, 200, 22, 50);
  c.fillStyle = c1; c.fillRect(70, 236, 26, 38); c.fillRect(104, 236, 26, 38);
  c.fillStyle = c2; c.fillRect(70, 240, 26, 5); c.fillRect(104, 240, 26, 5);
  c.fillStyle = boots; c.beginPath(); c.roundRect ? c.roundRect(64, 272, 34, 14, 6) : c.rect(64, 272, 34, 14); c.fill(); c.beginPath(); c.roundRect ? c.roundRect(102, 272, 34, 14, 6) : c.rect(102, 272, 34, 14); c.fill();
  // shorts
  c.fillStyle = c2 === '#ffffff' && c1 !== '#f2f2f2' ? '#ffffff' : '#1b1b1b'; c.beginPath(); c.moveTo(66, 168); c.lineTo(134, 168); c.lineTo(138, 214); c.lineTo(102, 214); c.lineTo(100, 200); c.lineTo(98, 214); c.lineTo(62, 214); c.closePath(); c.fill();
  // arms
  c.fillStyle = skin; c.beginPath(); c.roundRect ? c.roundRect(34, 102, 18, 70, 9) : c.rect(34, 102, 18, 70); c.fill(); c.beginPath(); c.roundRect ? c.roundRect(148, 102, 18, 70, 9) : c.rect(148, 102, 18, 70); c.fill();
  // shirt with sleeves and trim
  c.fillStyle = c1; c.beginPath(); c.moveTo(62, 80); c.lineTo(138, 80); c.lineTo(170, 100); c.lineTo(160, 126); c.lineTo(142, 116); c.lineTo(140, 172); c.lineTo(60, 172); c.lineTo(58, 116); c.lineTo(40, 126); c.lineTo(30, 100); c.closePath(); c.fill();
  c.fillStyle = c2; c.fillRect(30, 98, 12, 6); c.fillRect(158, 98, 12, 6); if (!back) { c.beginPath(); c.moveTo(86, 80); c.lineTo(100, 96); c.lineTo(114, 80); c.closePath(); c.fill(); }
  c.fillStyle = c2; c.fillRect(60, 160, 80, 6);
  c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (back) { c.font = 'bold 15px system-ui,sans-serif'; c.fillText(FBU.trU(name).slice(0, 12), 100, 98); c.font = 'bold 48px system-ui,sans-serif'; c.fillText(num, 100, 136); }
  else { c.font = 'bold 22px system-ui,sans-serif'; c.fillText(num, 118, 112); c.fillStyle = c2; c.beginPath(); c.arc(80, 106, 6, 0, 7); c.fill(); }
  // neck + head
  c.fillStyle = skin; c.fillRect(90, 66, 20, 18); c.beginPath(); c.ellipse(100, 48, 24, 28, 0, 0, 7); c.fill();
  if (!back) { c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(91, 48, 2.6, 0, 7); c.arc(109, 48, 2.6, 0, 7); c.fill(); c.strokeStyle = '#7a3b2e'; c.lineWidth = 2; c.beginPath(); c.arc(100, 58, 7, .2, Math.PI - .2); c.stroke(); }
  // hair styles
  c.fillStyle = hc;
  if (hs === 0) { c.beginPath(); c.ellipse(100, 32, 25, 16, 0, Math.PI, 0); c.fill(); if (back) c.fillRect(76, 30, 48, 22); }
  else if (hs === 1) { c.globalAlpha = .55; c.beginPath(); c.ellipse(100, 34, 24, 13, 0, Math.PI, 0); c.fill(); c.globalAlpha = 1; }
  else if (hs === 2) { for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(78 + i * 5.5, 27 + Math.sin(i * 1.7) * 3, 7.5, 0, 7); c.fill(); } if (back) c.fillRect(76, 28, 48, 26); }
  else if (hs === 3) { c.beginPath(); c.ellipse(100, 32, 27, 17, 0, Math.PI, 0); c.fill(); c.fillRect(73, 30, 9, back ? 44 : 36); c.fillRect(118, 30, 9, back ? 44 : 36); if (back) c.fillRect(76, 30, 48, 40); }
  else if (hs === 4) { c.fillRect(94, 14, 12, 26); }
  c.restore();
}

/* ---------- Robust save: 3 slots, primary + backup copy with checksum ---------- */
const FBS = {
  key: n => 'od_fb_slot' + n,
  write(n, data) {
    data.updated = Date.now();
    const body = JSON.stringify(data), wrap = JSON.stringify({ v: 1, h: FBU.hash(body), d: body });
    try {
      // Keep the previous good copy as backup before overwriting the primary
      const cur = localStorage.getItem(FBS.key(n)); if (cur && FBS.parse(cur)) localStorage.setItem(FBS.key(n) + '_b', cur);
      localStorage.setItem(FBS.key(n), wrap);
      if (!FBS.parse(localStorage.getItem(FBS.key(n)))) throw new Error('verify');
      return true;
    } catch (e) { try { localStorage.setItem(FBS.key(n) + '_b', wrap); } catch (_) {} return false; }
  },
  parse(raw) { try { const w = JSON.parse(raw); if (!w || w.v !== 1 || FBU.hash(w.d) !== w.h) return null; return JSON.parse(w.d); } catch (e) { return null; } },
  read(n) {
    let d = FBS.parse(localStorage.getItem(FBS.key(n)));
    if (!d) { d = FBS.parse(localStorage.getItem(FBS.key(n) + '_b')); if (d) { d._recovered = true; } }
    return d;
  },
  del(n) { localStorage.removeItem(FBS.key(n)); localStorage.removeItem(FBS.key(n) + '_b'); }
};

/* Moment types each position is involved in (shared by played and simulated matches) */
const FB_MIX = {
  FW: ['box', 'box', 'box', 'thru', 'thru', 'edge', 'counter', 'drive', 'fk'],
  W: ['wing', 'wing', 'wing', 'drive', 'drive', 'box', 'edge', 'counter', 'fk'],
  AM: ['edge', 'edge', 'pass', 'pass', 'box', 'drive', 'thru', 'fk'],
  CM: ['pass', 'pass', 'pass', 'edge', 'drive', 'fk', 'box'],
  DF: ['pass', 'pass', 'drive', 'edge', 'fk', 'box']
};
// Expected defensive moments per match by position
const FB_DEFN = { FW: .9, W: 1.2, AM: 1.4, CM: 1.8, DF: 2.8 };

// Turkish case suffix for a proper name, following vowel harmony: acc (-(y)I), dat (-(y)A), gen (-(n)In), loc (-DA), abl (-DAn)
FBU.ek = function (name, kind) {
  const w = String(name), tok = w.split(' ').pop(), abbr = /^[A-ZÇĞİÖŞÜ]{2,4}$/.test(tok);
  const LN = { A: 'a', B: 'be', C: 'ce', Ç: 'çe', D: 'de', E: 'e', F: 'fe', G: 'ge', H: 'he', I: 'ı', İ: 'i', J: 'je', K: 'ka', L: 'le', M: 'me', N: 'ne', O: 'o', Ö: 'ö', P: 'pe', R: 're', S: 'se', Ş: 'şe', T: 'te', U: 'u', Ü: 'ü', V: 've', Y: 'ye', Z: 'ze' };
  const low = abbr ? (LN[tok[tok.length - 1]] || 'e') : w.toLocaleLowerCase('tr-TR'), V = 'aıoueiöü', vs = [...low].filter(c => V.includes(c)), lv = vs.length ? vs[vs.length - 1] : 'e';
  const lastCh = [...low].filter(c => /[a-zçğıöşü0-9]/.test(c)).pop() || 'e', endsV = V.includes(lastCh), hard = 'fsthşçkp'.includes(lastCh);
  const back = 'aıou'.includes(lv), round = 'ouöü'.includes(lv), I = back ? (round ? 'u' : 'ı') : (round ? 'ü' : 'i'), A = back ? 'a' : 'e';
  const sfx = { acc: (endsV ? 'y' : '') + I, dat: (endsV ? 'y' : '') + A, gen: (endsV ? 'n' : '') + I + 'n', loc: (hard ? 't' : 'd') + A, abl: (hard ? 't' : 'd') + A + 'n' }[kind];
  return w + "'" + sfx;
};
