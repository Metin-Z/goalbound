/* ===================== GOALBOUND — career, seasons, cups, UI ===================== */
const FBC = {
  POS: { FW: 'Forvet', W: 'Kanat', AM: 'Ofansif OS', CM: 'Merkez OS', DF: 'Defans' },
  ROLE_OF: { FW: 'ST', W: 'RW', AM: 'RCM', CM: 'CM', DF: 'RCB' },
  ATTR: [['sut', 'Şut'], ['pas', 'Pas'], ['hiz', 'Hız'], ['teknik', 'Teknik'], ['fizik', 'Fizik']],
  // What each attribute changes in a match (formulas: FBX in core.js)
  ATTR_FX: { sut: 'Şut isabeti ve bitiricilik', pas: 'Pas isabeti, uzun paslarda hata payı, asist kalitesi', hiz: 'Koşu ve top sürme hızı, kayma hızı', teknik: 'Top kontrolü, dönüş, falso, zor açı', fizik: 'Vuruş gücü, ikili mücadele, kayarak müdahale' },
  W: { DF: { fizik: .3, pas: .25, hiz: .2, teknik: .15, sut: .1 }, FW: { sut: .35, hiz: .2, teknik: .2, fizik: .15, pas: .1 }, W: { hiz: .3, teknik: .25, sut: .2, pas: .15, fizik: .1 }, AM: { pas: .3, teknik: .3, sut: .2, hiz: .1, fizik: .1 }, CM: { pas: .35, fizik: .2, teknik: .2, sut: .15, hiz: .1 } },
  STAGES: ['Son 16', 'Çeyrek final', 'Yarı final', 'Final'],
  ovr(p) { const w = FBC.W[p.pos]; return Math.round(Object.keys(w).reduce((s, k) => s + p.attr[k] * w[k], 0)); },
  // Development rights needed for +1 on an attribute
  cost: v => v < 75 ? 1 : 2,
  // Performance band from match rating → skill point change
  band(r) {
    if (r < 4.6) return { l: 'Çok kötü', d: -15, c: 'l' };
    if (r < 5.3) return { l: 'Çok kötü', d: -10, c: 'l' };
    if (r < 6.0) return { l: 'Kötü', d: -5, c: 'l' };
    if (r < 6.9) return { l: 'Ortalama', d: 5, c: 'd' };
    if (r < 7.8) return { l: 'İyi', d: 10, c: 'w' };
    return { l: 'Çok iyi', d: 15, c: 'w' };
  },
  // Add skill points; every full 100 turns into 3 development rights, the remainder carries over
  // Skill points needed for the next level (every level gives 3 development rights): BASE + STEP * level
  SK_BASE: 100, SK_STEP: 5, SK_RIGHTS: 3,
  need(lvl) { return FBC.SK_BASE + FBC.SK_STEP * (lvl || 0); },
  // Add (or remove) skill points; each threshold passed gives rights, the remainder carries over to the next, larger threshold
  addSkill(p, delta) { p.skill = Math.max(0, (p.skill || 0) + delta); p.lvl = p.lvl || 0; let g = 0; while (p.skill >= FBC.need(p.lvl)) { p.skill -= FBC.need(p.lvl); p.lvl++; p.up += FBC.SK_RIGHTS; g += FBC.SK_RIGHTS; } return g; },
  // Resolve one user moment without playing it (used for simulated matches)
  simMoment(type, A) {
    const r = Math.random, us = { sh: 0, sot: 0, pk: 0, pf: 0, dr: 0, lost: 0, miss: 0, wide: 0, blk: 0, post: 0 }, out = { us, goal: false, assist: false };
    if (type === 'def') {   // duel first (hız/fizik/teknik), then the pass forward (pas)
      if (r() > .38 + A.fizik / 400 + A.hiz / 800 + A.teknik / 800) { if (r() < .25) { us.fl = (us.fl || 0) + 1; if (r() < .14) out.conceded = true; } else { us.dl = (us.dl || 0) + 1; if (r() < .3) { us.err = (us.err || 0) + 1; out.conceded = true; } } return out; }
      us.tk = (us.tk || 0) + 1;
      if (r() < .5 + A.pas / 250) { us.pk++; } else { us.pf++; if (r() < .35) { us.err = (us.err || 0) + 1; out.conceded = true; } } return out;
    }
    if (r() < .35) us.dr++;
    if (type !== 'pen' && type !== 'fk' && r() < .2 * (1.3 - A.teknik / 100)) { us.lost++; return out; }
    if (type === 'drive') { us.dr++; if (r() < .45 * (1.25 - (A.hiz + A.teknik) / 200)) { us.lost++; return out; } us.dr += 1; type = r() < .55 ? 'edge' : 'wing'; }
    const shoot = type === 'pen' || type === 'fk' || type === 'box' || type === 'counter' || type === 'thru' || (type === 'edge' && r() < .6) || (type === 'wing' && r() < .3);
    if (!shoot) {
      if (r() < .42 + A.pas / 250) { us.pk++; if (r() < .25) out.assist = true; } else us.pf++;
      return out;
    }
    us.sh++;
    const pg = { pen: .5 + A.sut / 500, thru: .06 + A.sut / 750 + A.hiz / 1500, box: .05 + A.sut / 700, counter: .04 + (A.sut + A.hiz) / 1600, edge: .03 + A.sut / 1100, fk: .02 + A.sut / 1300, wing: .03 + A.sut / 1100 }[type];
    if (r() < pg) { out.goal = true; us.sot++; return out; }
    const x = r(); if (x < .45) us.sot++; else if (x < .8) us.wide++; else if (x < .93) us.blk++; else us.post++;
    if (type === 'pen' || type === 'box' || type === 'counter' || type === 'thru') us.miss++;
    return out;
  },
  // Best rating among the other 21 players (used to decide the man of the match)
  bestOther(res, myId, oppId) {
    const won = res.sc[0] > res.sc[1] ? 0 : res.sc[1] > res.sc[0] ? 1 : -1, adj = side => won === -1 ? 0 : won === side ? .2 : -.1;
    const sq = side => FBT.squad(side ? oppId : myId).filter(p => p.role !== 'GK');
    const pool = won === 1 ? 1 : 0, cand = FBU.pick(sq(pool));
    let best = { name: cand.name, r: 7.0 + Math.random() * .7 + (won === pool ? .25 : 0) };
    const goals = {}; (res.log || []).forEach(e => { if (!e.user) { const k = e.side + '|' + e.name; goals[k] = (goals[k] || 0) + 1; } });
    for (const k in goals) { const [side, name] = k.split('|'), r = 6.6 + goals[k] * .95 + Math.random() * .35 + adj(+side); if (r > best.r) { const full = sq(+side).find(p => p.short === name); best = { name: full ? full.name : name, r }; } }
    best.r = Math.round(Math.min(10, best.r) * 10) / 10; return best;
  },
  // Double round robin (circle method), deterministic per seed
  rr(n, seed) {
    const r = FBU.rng(seed), arr = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; }
    const R = []; let a = arr.slice();
    for (let k = 0; k < n - 1; k++) { const m = []; for (let i = 0; i < n / 2; i++) { let x = a[i], y = a[n - 1 - i]; if ((k + i) % 2) [x, y] = [y, x]; m.push([x, y]); } R.push(m); a = [a[0], a[n - 1], ...a.slice(1, n - 1)]; }
    return R.concat(R.map(m => m.map(([x, y]) => [y, x])));
  },
  simScore(rh, ra, neutral) {
    const d = (rh - ra) / 2, hb = neutral ? 1 : 1.1, ab = neutral ? 1 : .9;
    return [FBU.poisson(1.3 * Math.pow(1.075, d) * hb), FBU.poisson(1.3 * Math.pow(1.075, -d) * ab)];
  },
  newTab: n => [...Array(n)].map(() => [0, 0, 0, 0, 0, 0]),
  addRes(tab, h, a, gh, ga) { const H = tab[h], A = tab[a]; H[0]++; A[0]++; H[4] += gh; H[5] += ga; A[4] += ga; A[5] += gh; if (gh > ga) { H[1]++; A[3]++; } else if (gh < ga) { A[1]++; H[3]++; } else { H[2]++; A[2]++; } },
  order(tab) { return tab.map((r, i) => i).sort((x, y) => { const a = tab[x], b = tab[y], pa = a[1] * 3 + a[2], pb = b[1] * 3 + b[2]; return pb - pa || (b[4] - b[5]) - (a[4] - a[5]) || b[4] - a[4] || x - y; }); }
};

function Futbol(host) {
  const { esc, clamp } = FBU;
  host.innerHTML = `<div class="fb"><div class="fb-top"><button data-t="back" aria-label="Geri">‹</button><div class="fb-title">⚽ GOALBOUND</div><button data-t="set" aria-label="Ayarlar" hidden>⚙️</button><button data-t="snd" aria-label="Ses">🔊</button><button data-t="fs" aria-label="Tam ekran">⛶</button></div><div class="fb-main"></div><nav class="fb-bnav" hidden></nav><div class="fb-toast"></div></div>`;
  const root = host.firstChild, main = root.querySelector('.fb-main'), top = root.querySelector('.fb-top'), toastEl = root.querySelector('.fb-toast'), nav = root.querySelector('.fb-bnav'), setBtn = root.querySelector('[data-t="set"]');
  let C = null, slot = 0, view = 'title', tab = 'ana', match = null, dead = false, sub = {};
  const toast = (t, ms = 2200) => { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('on'), ms); };
  root.addEventListener('pointerdown', () => FBA.init(), { capture: true });
  const sndBtn = top.querySelector('[data-t="snd"]'), sndUI = () => sndBtn.textContent = FBA.vol.master > 0 ? '🔊' : '🔇';
  top.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const t = b.dataset.t;
    if (t === 'fs') window.fsToggle && fsToggle();
    else if (t === 'set') { FBA.play('ui'); goTab('ayr'); }
    else if (t === 'snd') { FBA.init(); if (FBA.vol.master > 0) { sub.lastVol = FBA.vol.master; FBA.setVol('master', 0); } else FBA.setVol('master', sub.lastVol || .9); sndUI(); FBA.play('ui'); }
    else if (t === 'back') { FBA.play('back'); if (view === 'hub' || view === 'title') { if (view === 'hub') { save(); show('title'); } else if (window.goMenu) goMenu(); } else if (view === 'create') { if (sub.step > 0) { sub.step--; renderCreate(); } else show('title'); } else show('hub'); }
  };
  sndUI();

  /* ---------- Save helpers ---------- */
  /* ---------- Save file export / import (JSON): the stored save format is kept exactly as it is ---------- */
  // Download the current slot's stored save (the hash-wrapped object kept in the browser) as a JSON file
  function exportSave() {
    save(true); const raw = localStorage.getItem(FBS.key(slot)); if (!raw || !FBS.parse(raw)) { FBA.play('back'); toast('Dışa aktarılacak kayıt bulunamadı'); return; }
    const p = C.p, day = new Date().toISOString().slice(0, 10), file = { app: 'GOALBOUND', kind: 'career-save', fmt: 1, slot: slot + 1, exported: new Date().toISOString(), player: p.first + ' ' + p.last, club: club().name, season: C.s.year, save: JSON.parse(raw) };
    const name = `goalbound-${(p.first + '-' + p.last).toLocaleLowerCase('tr-TR').replace(/[^a-z0-9çğıöşü-]+/g, '')}-${C.s.year}-${String(C.s.year + 1).slice(2)}-${day}.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    FBA.play('confirm'); toast('⬇️ Kayıt dosyası indirildi');
  }
  // Parse a save file: the export file, a raw stored wrapper ({v,h,d}) or a bare career object; null when invalid
  function readSaveFile(file, done) {
    const r = new FileReader();
    r.onload = () => { let d = null; try { const j = JSON.parse(r.result), w = j && j.save ? j.save : j; d = w && w.v === 1 && typeof w.d === 'string' ? FBS.parse(JSON.stringify(w)) : w; } catch (e) {} done(d && d.p && d.club && d.s && FBT.team(d.club) ? d : null); };
    r.onerror = () => done(null); r.readAsText(file);
  }
  // Let the player pick a save file and load it into slot n
  function importSave(n) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) readSaveFile(f, d => {
      if (!d) { FBA.play('back'); toast('⚠️ Bu dosya geçerli bir GOALBOUND kaydı değil'); return; }
      delete d._recovered;
      if (!FBS.write(n, d)) { toast('⚠️ Kayıt yazılamadı — depolama dolu olabilir'); return; }
      C = migrate(FBS.read(n)); slot = n; if (C._needStats) { delete C._needStats; ensureStats(); save(true); }
      FBA.play('confirm'); toast('⬆️ Kayıt içe aktarıldı'); tab = 'ana'; show('hub');
    }); };
    inp.click();
  }
  function save(silent) { if (!C) return true; const ok = FBS.write(slot, C); if (!ok && !silent) toast('⚠️ Kayıt yazılamadı — depolama dolu olabilir'); return ok; }
  const onVis = () => { if (document.hidden) { save(true); if (match) match.pause(); FBA.suspend(); } else FBA.resume(); };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onVis);
  const me = () => C.p, club = () => FBT.team(C.club), lgOf = id => id.split(':')[0];

  /* ---------- Season setup ---------- */
  function rankFor(lg) {   // previous final order (or by strength in the first season)
    if (C.prev && C.prev[lg]) return C.prev[lg];
    return FBT.league(lg).teams.map((t, i) => i).sort((a, b) => FBT.league(lg).teams[b][4] - FBT.league(lg).teams[a][4]);
  }
  function setupCups(year) {
    const pools = { ucl: [], uel: [], uecl: [] };
    FB_LEAGUES.forEach(L => { const rk = rankFor(L.id), [a, b, c] = L.euro; rk.forEach((ti, pos) => { const id = L.id + ':' + ti; if (pos < a) pools.ucl.push(id); else if (pos < a + b) pools.uel.push(id); else if (pos < a + b + c) pools.uecl.push(id); }); });
    const r = FBU.rng('cup' + year + C.created), cups = {}; let ucup = null;
    for (const k of ['ucl', 'uel', 'uecl']) {
      let p = pools[k].map(id => [id, FBT.team(id).r + r() * 4]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const mine = p.indexOf(C.club), t = p.slice(0, 16);
      if (mine >= 16) t[15] = C.club;
      if (t.includes(C.club)) ucup = k;
      // Fill with best of the next pool down if a cup is short
      for (let i = t.length; i < 16; i++) t.push(p[i] || FBT.all().filter(x => !t.includes(x))[(r() * 50) | 0]);
      for (let i = 15; i > 0; i--) { const j = (r() * (i + 1)) | 0; [t[i], t[j]] = [t[j], t[i]]; }
      cups[k] = { t, w: [], res: [] };
    }
    return { cups, ucup };
  }
  function newSeason(year) {
    const lg = lgOf(C.club), L = FBT.league(lg), n = L.teams.length, R = (n - 1) * 2;
    const { cups, ucup } = setupCups(year);
    const ePos = [.22, .48, .72, .92].map(f => Math.floor(R * f)), cal = [];
    for (let r = 0; r < R; r++) { cal.push({ k: 'L', r }); const e = ePos.indexOf(r); if (e >= 0) cal.push({ k: 'E', st: e }); }
    const o = {}; FB_LEAGUES.forEach(X => { if (X.id !== lg) o[X.id] = { tab: FBC.newTab(X.teams.length), rd: 0 }; });
    C.s = { year, lg, seed: 'fx' + year + lg + C.created, tab: FBC.newTab(n), res: [], cal, wk: 0, o, cups, ucup, mine: [], ps: {}, ops: {}, mon: {}, monP: {}, monR: { s: 0, n: 0 }, inj: {}, form: {}, potm: [], flags: {}, my: { apps: 0, g: 0, a: 0, rs: 0, motm: 0 } };
    if (ucup) news(`🌍 ${club().name} bu sezon ${FB_CUPS[ucup][0]}'nde!`);
  }
  const fixtures = () => FBC.rr(C.s.tab.length, C.s.seed);
  const myIdx = () => +C.club.split(':')[1];
  function news(t) { C.news = [{ t, y: C.s ? C.s.year : 0 }].concat(C.news || []).slice(0, 14); }

  /* ---------- Calendar progression ---------- */
  function alive(cup) { const c = C.s.cups[cup], st = c.w.length; return st === 0 ? c.t : c.w[st - 1]; }
  function userInCup() { const k = C.s.ucup; return k && C.s.cups[k].w.length < 4 && alive(k).includes(C.club) ? k : null; }
  function simCupStage(st, userTie) {
    for (const k of ['ucl', 'uel', 'uecl']) {
      const c = C.s.cups[k]; if (c.w.length !== st) continue;
      const al = alive(k), win = [], res = [];
      for (let i = 0; i < al.length; i += 2) {
        const a = al[i], b = al[i + 1];
        if (userTie && (a === C.club || b === C.club) && k === userTie.cup) { const mineA = a === C.club, s = userTie.sc; const sa = mineA ? s[0] : s[1], sb = mineA ? s[1] : s[0]; const w = userTie.win ? C.club : (mineA ? b : a); res.push([a, b, sa, sb, sa === sb ? (w === a ? 'a' : 'b') : '']); win.push(w); continue; }
        const [sa, sb] = FBC.simScore(FBT.team(a).r, FBT.team(b).r, st === 3);
        let w = sa > sb ? a : sb > sa ? b : (Math.random() < .5 + (FBT.team(a).r - FBT.team(b).r) / 60 ? a : b);
        res.push([a, b, sa, sb, sa === sb ? (w === a ? 'a' : 'b') : '']); win.push(w);
      }
      c.res.push(res); c.w.push(win); MEDIA.cup(k, st, res, win);
      if (st === 3 && k !== userTie?.cup && C.s.ucup === k) news(`🏆 ${FB_CUPS[k][0]} şampiyonu: ${FBT.team(win[0]).name}`);
    }
  }
  function advanceOthers(frac) {
    for (const lg in C.s.o) {
      const X = C.s.o[lg], L = FBT.league(lg), n = L.teams.length, F = FBC.rr(n, 'fx' + C.s.year + lg + C.created), target = Math.min(F.length, Math.round(frac * F.length));
      for (; X.rd < target; X.rd++) F[X.rd].forEach(([h, a]) => {
        const [gh, ga] = FBC.simScore(L.teams[h][4], L.teams[a][4]), H = lg + ':' + h, Aw = lg + ':' + a; FBC.addRes(X.tab, h, a, gh, ga);
        creditTeam(H, gh, null); creditTeam(Aw, ga, null); monPts(lg, H, gh, ga); monPts(lg, Aw, ga, gh); form(H, gh, ga); form(Aw, ga, gh);
        if (MEDIA.big.includes(lg)) MEDIA.note(lg, H, Aw, gh, ga);
      });
    }
  }
  // Next thing the user plays (auto-simulating European weeks without the user's club)
  function nextFix() {
    const s = C.s;
    while (s.wk < s.cal.length) {
      const e = s.cal[s.wk];
      if (e.k === 'L') { const m = fixtures()[e.r].find(x => x.includes(myIdx())), home = m[0] === myIdx(); return { e, opp: s.lg + ':' + (home ? m[1] : m[0]), home, comp: `${FBT.league(s.lg).name} · ${e.r + 1}. hafta` }; }
      const cup = userInCup();
      if (cup && C.s.cups[cup].w.length === e.st) {
        const al = alive(cup), i = al.indexOf(C.club), opp = al[i ^ 1], home = e.st === 3 ? true : FBU.rng(s.seed + e.st)() < .5;
        return { e, opp, home, comp: `${FB_CUPS[cup][0]} · ${FBC.STAGES[e.st]}`, cup, neutral: e.st === 3 };
      }
      simCupStage(e.st, null); s.wk++;
    }
    return null;
  }
  const MIX = FB_MIX;
  // Whole (or remaining part of a) match without playing: the same moment outcomes and rating formula as a played match
  function simUser(f, frac = 1, base) {
    const t = club(), o = FBT.team(f.opp), p = me(), sq = FBT.squad(C.club).filter(x => ['ST', 'LW', 'RW', 'CM', 'LCM', 'RCM'].includes(x.role) && x.role !== FBC.ROLE_OF[p.pos]), osq = FBT.squad(f.opp).filter(x => x.role !== 'GK');
    const raw = f.home ? FBC.simScore(t.r, o.r, f.neutral) : FBC.simScore(o.r, t.r, f.neutral).reverse();
    const us = Object.assign({ g: 0, a: 0, sh: 0, sot: 0, pk: 0, pf: 0, dr: 0, lost: 0, miss: 0, wide: 0, blk: 0, post: 0, err: 0 }, base ? base.us : {});
    const sc = base ? base.sc.slice() : [0, 0], log = base ? base.log.slice() : [], m0 = base ? base.min : 0, mt = () => Math.floor(m0 + Math.random() * (90 - m0)) + 1;
    const keep = n => { let k = 0; for (let i = 0; i < n; i++) if (Math.random() < .7 * frac) k++; return k; };
    const ast = (pool, sc2) => Math.random() < .72 ? FBU.pick(pool.filter(x => x !== sc2)) : null;
    for (let i = keep(raw[0]); i > 0; i--) { sc[0]++; const s2 = FBU.pick(sq), a2 = ast(sq, s2); log.push({ m: mt(), side: 0, name: s2.short, r: s2.role, a: a2 && a2.short, ar: a2 && a2.role }); }
    for (let i = 0; i < raw[1]; i++) if (Math.random() < frac) { sc[1]++; const s2 = FBU.pick(osq), a2 = ast(osq, s2); log.push({ m: mt(), side: 1, name: s2.short, r: s2.role, a: a2 && a2.short, ar: a2 && a2.role }); }
    const n = Math.round((4 + Math.random() * 1.5) * frac);
    for (let i = 0; i < n; i++) {
      const r = FBC.simMoment(Math.random() < .06 ? 'pen' : FBU.pick(MIX[p.pos]), p.attr); Object.keys(r.us).forEach(k => us[k] += r.us[k]);
      if (r.goal) { us.g++; sc[0]++; log.push({ m: mt(), side: 0, name: p.short, user: true }); }
      if (r.assist) { us.a++; sc[0]++; const s2 = FBU.pick(sq); log.push({ m: mt(), side: 0, name: s2.short, r: s2.role, a: p.short, ar: 'ME' }); }
    }
    const nd = Math.round((FB_DEFN[p.pos] * .6 + Math.random() * .6) * frac);
    for (let i = 0; i < nd; i++) { const r = FBC.simMoment('def', p.attr); Object.keys(r.us).forEach(k => us[k] = (us[k] || 0) + r.us[k]); if (r.conceded) { sc[1]++; const s2 = FBU.pick(osq); log.push({ m: mt(), side: 1, name: s2.short, r: s2.role }); } }
    log.sort((a, b) => a.m - b.m);
    us.r = FBU.rate(us, sc[0], sc[1]);
    return { sc, us, log, sim: true };
  }
  /* ---------- League player stats: key 'club|role' (or 'ME') -> [apps, goals, assists] ---------- */
  const GW = { ST: 30, LW: 15, RW: 15, LCM: 7, CM: 6, RCM: 7, LB: 3, RB: 3, LCB: 4, RCB: 4 }, AW = { LW: 17, RW: 17, RCM: 13, LCM: 13, CM: 12, ST: 9, LB: 8, RB: 8, LCB: 2, RCB: 2 };
  const myRole = () => FBC.ROLE_OF[me().pos];
  // Season table of the player's league (s.ps), of every other league (s.ops[lg]) and this month's table (s.mon[lg])
  function psAdd(key, i, n = 1) {
    const s = C.s, lg = key === 'ME' ? s.lg : key.slice(0, key.indexOf(':')), T = lg === s.lg ? (s.ps || (s.ps = {})) : ((s.ops || (s.ops = {}))[lg] || (s.ops[lg] = {}));
    (T[key] || (T[key] = [0, 0, 0]))[i] += n;
    const M = (s.mon || (s.mon = {}))[lg] || (s.mon[lg] = {}); (M[key] || (M[key] = [0, 0, 0]))[i] += n;
  }
  const injured = club => Object.keys(C.s.inj || {}).filter(k => k.startsWith(club + '|')).map(k => k.split('|')[1]);
  function wpick(w, excl) { const e = Object.entries(w).filter(([k]) => !excl.includes(k)); let x = Math.random() * e.reduce((a, b) => a + b[1], 0); for (const [k, v] of e) if ((x -= v) < 0) return k; return e[0][0]; }
  function roleOf(club, short, excl) { const q = FBT.squad(club).find(p => p.short === short && !excl.includes(p.role)); return q ? q.role : null; }
  // One league match for one team: appearances (some rotation), then scorers and assisters
  function creditTeam(club, goals, entries) {
    const mine = club === C.club, excl = (mine ? [myRole()] : []).concat(injured(club)), scorers = [];
    FBT.ROLES.forEach(r => { if (excl.includes(r) || (r !== 'GK' && Math.random() < .07)) return; psAdd(club + '|' + r, 0); });
    if (entries) entries.forEach(e => {
      const rr2 = r => r && !excl.includes(r) && r !== 'ME' ? r : null;
      const sk = e.user ? 'ME' : club + '|' + (rr2(e.r) || roleOf(club, e.name, excl) || wpick(GW, excl)); psAdd(sk, 1); scorers.push(sk);
      if (e.a) { const ak = mine && (e.ar === 'ME' || (!e.ar && e.a === me().short)) ? 'ME' : club + '|' + (rr2(e.ar) || roleOf(club, e.a, excl) || wpick(AW, excl)); if (ak !== sk) psAdd(ak, 2); }
    });
    else for (let i = 0; i < goals; i++) { const g = wpick(GW, excl); psAdd(club + '|' + g, 1); scorers.push(club + '|' + g); if (Math.random() < .8) psAdd(club + '|' + wpick(AW, excl.concat(g)), 2); }
    return scorers;
  }
  // Month points per club (for the player-of-the-month team contribution) and recent form
  function monPts(lg, club, gf, ga) { const s = C.s, P = (s.monP || (s.monP = {}))[lg] || (s.monP[lg] = {}); P[club] = (P[club] || 0) + (gf > ga ? 3 : gf === ga ? 1 : 0); }
  function form(club, gf, ga) { const F = C.s.form || (C.s.form = {}); F[club] = ((F[club] || '') + (gf > ga ? 'G' : gf === ga ? 'B' : 'M')).slice(-6); }
  function leaders(idx, lg) {
    const T = !lg || lg === C.s.lg ? C.s.ps : (C.s.ops || {})[lg];
    return Object.entries(T || {}).map(([k, v]) => ({ k, apps: v[0], g: v[1], a: v[2], v: idx === 3 ? v[1] + v[2] : v[idx] }))
      .filter(x => x.v > 0).sort((a, b) => b.v - a.v || (idx === 1 ? b.a - a.a : idx === 2 ? b.g - a.g : 0) || a.apps - b.apps);
  }
  function who(k) { if (k === 'ME') return { name: me().first + ' ' + me().last, club: C.club, me: true }; const [cl, r] = k.split('|'), q = FBT.squad(cl).find(p => p.role === r); return { name: q ? q.name : r, club: cl }; }
  const myRank = idx => { const L = leaders(idx), i = L.findIndex(x => x.k === 'ME'); return i < 0 ? null : { r: i + 1, v: L[i].v }; };
  // Older saves: rebuild this season's league stats from the results already played
  function ensureStats() {
    const s = C.s; if (s.ps) return; s.ps = {};
    const F = fixtures(), lg = s.lg;
    s.res.forEach((round, r) => { if (!round) return; F[r].forEach(([h, a], i) => {
      const [gh, ga] = round[i], mineH = h === myIdx(), mineA = a === myIdx();
      if (mineH || mineA) { const m = s.mine.find(x => x.comp && s.cal[x.wk] && s.cal[x.wk].k === 'L' && s.cal[x.wk].r === r) || { g: 0, a: 0 }; psAdd('ME', 0); psAdd('ME', 1, m.g); psAdd('ME', 2, m.a); creditTeam(C.club, Math.max(0, (mineH ? gh : ga) - m.g), null); creditTeam(lg + ':' + (mineH ? a : h), mineH ? ga : gh, null); }
      else { creditTeam(lg + ':' + h, gh, null); creditTeam(lg + ':' + a, ga, null); }
    }); });
  }
  /* ---------- Media centre: news built from the season's real data ---------- */
  const MONTHS = ['Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs'];
  const tn = id => FBT.team(id).name, pickR = a => a[(Math.random() * a.length) | 0];
  function coach(club) { const t = FBT.team(club), N = FB_NAMES[t.lg.nat] || FB_NAMES.world, r = FBU.rng('coach' + club), f = N[0].split(','), l = N[1].split(','); return f[(r() * f.length) | 0] + ' ' + l[(r() * l.length) | 0]; }
  function derbyOf(a, b) { const x = tn(a), y = tn(b), d = FB_DERBY.find(([p, q]) => (p === x && q === y) || (p === y && q === x)); return d ? d[2] : null; }
  const MEDIA = {
    big: ['en', 'es', 'it', 'de', 'fr'], notes: [],
    // Add a news item unless the same headline (or the same template, via extra.tid) ran recently
    add(cat, pri, h, b, extra) {
      const seen = C.feedSeen || (C.feedSeen = []), hh = FBU.hash(h), tid = extra && extra.tid;
      if (!(extra && extra.force) && (seen.includes(hh) || (tid && seen.includes(tid)))) return false;
      seen.push(hh); if (tid) seen.push(tid); if (seen.length > 110) seen.splice(0, seen.length - 110);
      const s = C.s; C.feed = [Object.assign({ cat, pri, h, b, y: s.year, w: s.res.filter(Boolean).length, t: Date.now() }, extra || {})].concat(C.feed || []).slice(0, 160); return true; },
    // remember notable results in the big foreign leagues while they are simulated
    note(lg, H, A, gh, ga) { const rh = FBT.team(H).r, ra = FBT.team(A).r, d = derbyOf(H, A), up = (gh > ga && ra - rh >= 8) || (ga > gh && rh - ra >= 8); if (d || up || Math.abs(gh - ga) >= 4) this.notes.push({ lg, H, A, gh, ga, d, up }); },
    // Pick a template variant, preferring ones not used recently; returns [text, template id]
    pickT(pre, arr) { const seen = C.feedSeen || [], ids = arr.map((_, i) => pre + i), free = ids.filter(i => !seen.includes(i)), id = free.length ? pickR(free) : ids[(Math.random() * ids.length) | 0]; if (!free.length) { const k = seen.indexOf(id); if (k >= 0) seen.splice(k, 1); } return [arr[ids.indexOf(id)], id]; },
    scorersText(keys) { const c = {}; keys.forEach(k => c[k] = (c[k] || 0) + 1); return Object.entries(c).map(([k, n]) => who(k).name.split(' ').slice(-1)[0] + (n > 1 ? ` (${n})` : '')).join(', '); },
    round(rr, f, res, ourSc = []) {
      const s = C.s, L = FBT.league(s.lg), ord = FBC.order(s.tab), pos = i => ord.indexOf(i) + 1, NR = fixtures().length, r = f.e.r, late = (r + 1) / NR >= .65, out = [];
      // the player's own match
      const p = me(), us = res.us, opp = f.opp, sc = `${f.home ? res.sc[0] : res.sc[1]}-${f.home ? res.sc[1] : res.sc[0]}`, H = f.home ? C.club : opp, A = f.home ? opp : C.club;
      const ourG = res.sc[0], theirG = res.sc[1], mg = ourG - theirG, kind = mg >= 3 ? 'wb' : mg > 0 ? 'w' : mg === 0 ? 'd' : mg <= -3 ? 'lb' : 'l', us0 = tn(C.club), op0 = tn(opp), cc = coach(C.club), yer = f.home ? 'evinde' : 'deplasmanda';
      // our result, every round, with rotating wording
      const RT = {
        wb: [`${us0} ${op0} karşısında gövde gösterisi: ${sc}`, `Farklı galibiyet! ${us0}, ${FBU.ek(op0, 'acc')} ${mg} farkla geçti`, `${us0} ${yer} gol oldu yağdı`],
        w: [`${us0} ${yer} kazandı: ${tn(H)} ${sc} ${tn(A)}`, `${us0} üç puanı ${FBU.ek(op0, 'abl')} aldı`, `${op0} engeli aşıldı, ${us0} yoluna devam ediyor`, `${FBU.ek(cc, 'gen')} öğrencilerinden kritik galibiyet`],
        d: [`${us0} ile ${op0} yenişemedi: ${tn(H)} ${sc} ${tn(A)}`, `${us0} ${yer} bir puanla yetindi`, `Puanlar paylaşıldı: ${tn(H)} ${sc} ${tn(A)}`],
        l: [`${us0} ${yer} kayıp: ${tn(H)} ${sc} ${tn(A)}`, `${op0} karşısında ${FBU.ek(us0, 'dat')} soğuk duş`, `${us0} puansız döndü, taraftar tepkili`],
        lb: [`${FBU.ek(us0, 'dat')} ağır darbe: ${tn(H)} ${sc} ${tn(A)}`, `Kabus gibi gece: ${us0} ${FBU.ek(op0, 'dat')} ${-mg} farkla boyun eğdi`, `${us0} dağıldı, ${cc} için sorular başladı`]
      };
      const [rh, rid] = this.pickT('r' + kind, RT[kind]);
      const ownItem = ['mac', kind === 'wb' || kind === 'lb' ? 2 : 1, rh, `${FBU.ek(L.name, 'loc')} ${r + 1}. hafta. ${us0} ligde ${pos(myIdx())}. sırada.`, { tid: rid, force: 1 }];   // always published (added after the cap)
      // the player's own performance → praise or criticism
      if (us.g >= 3) out.push(['oyuncu', 3, `HAT-TRICK! ${p.first} ${p.last}, ${FBU.ek(op0, 'gen')} ağlarını ${us.g} kez sarstı`, `${tn(H)} ${sc} ${tn(A)}. Maç topu artık ${FBU.ek(p.short, 'gen')} vitrininde.`]);
      else if (us.g === 2) out.push(['oyuncu', 2, pickR([`${p.first} ${p.last} şov yaptı: 2 gol!`, `Çifte vuruş: ${p.short} ${FBU.ek(op0, 'dat')} iki gol attı`, `${p.short} gecesi: ${op0} karşısında 2 gol`]), `${tn(H)} ${sc} ${tn(A)} maçında ${p.short} ağları ${us.g} kez havalandırdı.`]);
      else if (us.a >= 2) out.push(['oyuncu', 2, `Asist makinesi ${p.short}: ${us.a} gol pası`, `${tn(H)} ${sc} ${tn(A)} maçında oyunun beyniydi.`]);
      else if (us.r >= 8.3) { const [gh2, gid] = this.pickT('pg', [`${p.short} sahada parladı: reyting ${us.r.toFixed(1)}`, `Yorumcular ${FBU.ek(p.short, 'dat')} tam not verdi`, `${p.short} gecenin yıldızıydı`]); out.push(['oyuncu', 1, gh2, `${tn(H)} ${sc} ${tn(A)} maçında ${us.r.toFixed(1)} reytingle sahanın en iyilerindendi.`, { tid: gid }]); }
      else if (us.r <= 5.4) { const [ch, cid] = this.pickT('pb', [`Rıza Mikrofon: "${p.short} bugün sahada yoktu"`, `${FBU.ek(p.short, 'dat')} sert eleştiri: "Bu formayı terletmedi"`, `Hoca Taktikçi: "${p.short} pozisyon bilgisini evde unutmuş"`, `${p.short} için kara gece: reyting ${us.r.toFixed(1)}`]); out.push(['magazin', 1, ch, `${tn(H)} ${sc} ${tn(A)} maçındaki performansı yorumcuların hedefinde. Bir sonraki maçta yanıt bekleniyor.`, { tid: cid }]); }
      // our coach after the match
      if (Math.random() < .5) { const [qh, qid] = this.pickT('c' + (mg > 0 ? 'w' : mg < 0 ? 'l' : 'd') + (us.r >= 7.8 ? 'p' : us.r <= 5.6 ? 'n' : ''), mg > 0 ? (us.r >= 7.8 ? [`"${p.short} bugün ayrı bir seviyedeydi"`, `"${p.short} gibi bir oyuncuyu çalıştırmak keyif"`] : [`"Takım ruhu buydu, çocuklarımı kutluyorum"`, `"Üç puan önemli ama daha iyi oynayabiliriz"`, `"Plan tuttu, oyuncular uyguladı"`]) : mg < 0 ? (us.r <= 5.6 ? [`"${p.short} daha fazlasını yapabilir, ona güveniyorum"`, `"Bazı oyuncularım bugün bekleneni veremedi"`] : [`"Sonuç acı ama başımız dik"`, `"Hatalarımızdan ders çıkaracağız"`, `"Hakem kararlarını yorumlamayacağım"`]) : [`"Bir puan da puandır"`, `"Kazanmak istedik, olmadı"`, `"Rakibi tebrik ediyorum"`]); out.push(['takim', 0, `${cc}: ${qh}`, `${FBU.ek(us0, 'gen')} teknik direktörü maç sonu basın toplantısında konuştu.`, { tid: qid }]); }
      // teammates
      const mates = {}; ourSc.filter(k => k !== 'ME').forEach(k => mates[k] = (mates[k] || 0) + 1);
      const top = Object.entries(mates).sort((a, b) => b[1] - a[1])[0];
      if (top && (top[1] >= 2 || Math.random() < .3)) { const w = who(top[0]); out.push(['takim', top[1] >= 2 ? 1 : 0, top[1] >= 3 ? `Takım arkadaşın ${w.name} hat-trick yaptı!` : top[1] >= 2 ? `Takım arkadaşın ${w.name} iki golle yıldızlaştı` : `${w.name} ${FBU.ek(us0, 'dat')} golüyle katkı verdi`, `${tn(H)} ${sc} ${tn(A)} maçının konuşulan isimlerinden biri oldu.`]); }
      // rise and fall in the table
      const nowP = pos(myIdx()), pr = s.myPos;
      if (pr && r >= 3) { const dp = pr - nowP; if (dp >= 3) out.push(['takim', 2, `${us0} yükselişte: ${dp} basamak birden, artık ${nowP}. sırada`, `Son haftaların formu tabloya yansıdı.`]); else if (dp <= -3) out.push(['takim', 1, `${us0} geriledi: ${-dp} basamak kayıp, ${nowP}. sıraya düştü`, `Taraftar çıkış bekliyor.`]); if (nowP === 1 && pr !== 1) out.push(['takim', 3, `${us0} ZİRVEDE!`, `${FBU.ek(L.name, 'loc')} liderlik koltuğu artık bizim.`]); }
      s.myPos = nowP;
      if (us.err && us.g < 2 && us.r > 5.4) { const [eh, eid] = this.pickT('er', [`${FBU.ek(p.short, 'gen')} hatası pahalıya patladı`, `Pas hatası gole döndü: ${p.short} üzgün`, `${p.short} hatasından ders çıkarmalı`]); out.push(['oyuncu', 1, eh, `${tn(C.club)} savunmasında yapılan pas hatası gole dönüştü; teknik heyet uyardı.`, { tid: eid }]); }
      // round results: derbies, upsets, big wins
      rr.forEach(([h, a, gh, ga]) => {
        const Hc = s.lg + ':' + h, Ac = s.lg + ':' + a, d = derbyOf(Hc, Ac), rh = FBT.team(Hc).r, ra = FBT.team(Ac).r;
        if (d) { const wn = tn(gh > ga ? Hc : Ac), ln = tn(gh > ga ? Ac : Hc); out.push(['mac', 2, gh === ga ? pickR([`${d}: kazanan çıkmadı (${gh}-${ga})`, `${d} nefes kesti ama gol(ler) eşit: ${gh}-${ga}`]) : pickR([`${d}: gülen taraf ${wn}! (${tn(Hc)} ${gh}-${ga} ${tn(Ac)})`, `${wn}, ${d} sonunda ${FBU.ek(ln, 'acc')} yıktı`, `Şehrin hakimi ${wn}: ${tn(Hc)} ${gh}-${ga} ${tn(Ac)}`]), `${tn(Hc)} ${gh}-${ga} ${tn(Ac)}. Tribünler 90 dakika boyunca susmadı.`, { d: 1 }]); }
        else if ((gh > ga && (ra - rh >= 7 || pos(h) - pos(a) >= 8)) || (ga > gh && (rh - ra >= 7 || pos(a) - pos(h) >= 8))) { const w = gh > ga ? Hc : Ac, l = gh > ga ? Ac : Hc; out.push(['mac', 1, pickR([`Sürpriz! ${tn(w)}, ${FBU.ek(tn(l), 'acc')} devirdi`, `${FBU.ek(tn(l), 'dat')} büyük şok: ${tn(Hc)} ${gh}-${ga} ${tn(Ac)}`, `Haftanın sürprizi ${FBU.ek(tn(w), 'abl')}`]), `${tn(Hc)} ${gh}-${ga} ${tn(Ac)}. Kimse bu sonucu beklemiyordu; ${coach(l)} için zor bir hafta.`]); }
        else if (Math.abs(gh - ga) >= 4) out.push(['mac', 1, `Gol yağmuru: ${tn(Hc)} ${gh}-${ga} ${tn(Ac)}`, `Skorbord bu hafta fazla mesai yaptı.`]);
      });
      // table: leader change, title race, bottom
      const lead = s.lg + ':' + ord[0];
      if (s.lead && s.lead !== lead) out.push(['takim', 2, pickR([`Zirvede değişim: ${tn(lead)} lider!`, `Koltuk el değiştirdi: zirvede ${tn(lead)}`, `${tn(lead)} liderliğe yükseldi`]), `${tn(lead)} ${s.tab[ord[0]][1] * 3 + s.tab[ord[0]][2]} puanla ${FBU.ek(L.name, 'gen')} yeni lideri.`]);
      s.lead = lead;
      const p1 = s.tab[ord[0]][1] * 3 + s.tab[ord[0]][2], p2 = s.tab[ord[1]][1] * 3 + s.tab[ord[1]][2];
      if (late && p1 - p2 <= 3 && r % 3 === 0) out.push(['takim', 2, 'Şampiyonluk yarışında nefesler tutuldu', `${tn(lead)} ile ${tn(s.lg + ':' + ord[1])} arasında yalnızca ${p1 - p2} puan var. Kalan ${NR - r - 1} haftada her maç final.`]);
      if (late && r % 4 === 1) { const b = s.lg + ':' + ord[ord.length - 1]; out.push(['takim', 1, `Ligin dibinde ${tn(b)} çıkış arıyor`, `${tn(b)} son sırada. ${coach(b)}: "Daha bitmedi, inanıyoruz."`]); }
      // form streaks and the coach's seat
      s.flags = s.flags || {};
      Object.entries(s.form || {}).forEach(([c, fm]) => {
        if (!c.startsWith(s.lg + ':')) return;
        if (fm.endsWith('GGGG') && s.flags['w' + c] !== r) { s.flags['w' + c] = r; out.push(['takim', 1, `${tn(c)} durdurulamıyor`, `Üst üste ${fm.length - fm.replace(/G+$/, '').length} galibiyet. ${FBU.ek(coach(c), 'gen')} ekibi uçuşta.`]); }
        if (/[BM]{5}$/.test(fm) && !fm.slice(-5).includes('G') && !s.flags['c' + c]) { s.flags['c' + c] = 1; out.push(['takim', 1, pickR([`${FBU.ek(tn(c), 'loc')} ${FBU.ek(coach(c), 'gen')} koltuğu sallanıyor`, `${tn(c)} yönetimi ${FBU.ek(coach(c), 'acc')} masaya çağırdı`, `${tn(c)} taraftarı ${FBU.ek(coach(c), 'acc')} istifaya davet etti`]), `Son 5 maçta galibiyet yok. Yönetimin sabrı tükenmek üzere.`]); }
        if (fm.endsWith('G')) delete s.flags['c' + c];
      });
      // scoring race
      const gl = leaders(1)[0];
      if (gl && s.gLead !== gl.k) { if (s.gLead) { const w = who(gl.k); out.push(['oyuncu', w.me ? 2 : 1, w.me ? `Gol krallığında zirve senin: ${gl.v} gol!` : `Gol krallığında yeni lider: ${w.name}`, `${w.name} (${tn(w.club)}) ${gl.v} golle listenin başına geçti.`]); } s.gLead = gl.k; }
      const mr = myRank(1); if (mr && mr.r <= 3 && !s.flags.top3) { s.flags.top3 = 1; out.push(['oyuncu', 2, `${p.first} ${p.last} gol krallığında ilk 3'te!`, `${mr.v} golle ${mr.r}. sırada. Yorumcular "yılın keşfi" demeye başladı.`]); }
      // injuries: heal, and sometimes a new one in the league
      Object.keys(s.inj || {}).forEach(k => { if (--s.inj[k] <= 0) delete s.inj[k]; });
      if (Math.random() < .3) {
        const cands = leaders(3).slice(0, 25).filter(x => x.k !== 'ME'), x = cands.length ? pickR(cands) : null;
        if (x) { const w = who(x.k), wk = 1 + ((Math.random() * 4) | 0); (s.inj || (s.inj = {}))[x.k] = wk; out.push(['oyuncu', 0, `${FBU.ek(tn(w.club), 'dat')} kötü haber: ${w.name} sakatlandı`, `Yapılan kontrollerin ardından ${wk} hafta sahalardan uzak kalacağı açıklandı.`]); }
      }
      // gossip, pundits, funny stories
      if (Math.random() < .22) { const lg = pickR(this.big), top = leaders(1, lg)[0], bigs = FBT.all().filter(id => FBT.team(id).r >= 84 && (!top || !id.startsWith(lg))); if (top && bigs.length) { const w = who(top.k); out.push(['takim', 0, `Transfer kulisi: ${w.name} için ${tn(pickR(bigs))} devrede`, `${tn(w.club)} formasıyla ${top.v} gol atan yıldız için ilk temasların kurulduğu konuşuluyor.`]); } }
      const avg = s.my.apps ? s.my.rs / s.my.apps : 0;
      if (s.my.apps >= 5 && avg >= 7 && Math.random() < .15) { const c = FBT.all().filter(id => id !== C.club && FBT.team(id).r >= club().r); if (c.length) out.push(['oyuncu', 1, `Kulis: ${tn(pickR(c))}, ${FBU.ek(p.short, 'acc')} izlemeye aldı`, `Ortalama ${avg.toFixed(2)} reytingle oynayan genç yeteneğin menajeriyle görüşüldüğü iddia edildi.`]); }
      if (r % 3 === 2) { const g = leaders(1)[0], worst = s.lg + ':' + ord[ord.length - 1]; if (g && Math.random() < .5) { const w = who(g.k); out.push(['magazin', 0, `Hoca Taktikçi: "${w.name.split(' ').slice(-1)[0]} topa bakınca top utanıyor"`, `Ünlü yorumcu, ${g.v} gollü ${w.name} için övgüler yağdırdı.`]); } else out.push(['magazin', 0, `Hoca Taktikçi'den ${FBU.ek(tn(worst), 'dat')} sert eleştiri`, `"Bu savunmayla değil şampiyonluk, mahalle turnuvası bile zor" dedi. Kulüp cephesinden yanıt gecikmedi.`]); }
      if (Math.random() < .3) { const c = s.lg + ':' + ((Math.random() * s.tab.length) | 0), sq = FBT.squad(c).filter(x => x.role !== 'GK'), pl = pickR(sq).name, gk = FBT.squad(c)[0].name;
        out.push(['magazin', 0, pickR([`${pl} antrenmana ters formayla çıktı, 20 dakika kimse fark etmedi`, `${tn(c)} kalecisi ${gk}: "Eldivenlerimi buzdolabında saklıyorum, serin eller topu tutar"`, `${tn(c)} otobüsü stadı bulamadı, maça 3 dakika kala yetişti`, `${pl} gol sevinci için tribünden dans hocası tuttuğunu itiraf etti`, `${tn(c)} maskotu kale arkasında uyuyakaldı, kameralar yakaladı`, `${pl}: "Penaltıdan önce annemi aradım, sağ köşe dedi"`]), `${tn(c)} cephesi olayı gülerek karşıladı.`]); }
      // Europe: title races, star milestones and injuries in the big leagues
      const fr = (r + 1) / NR;
      if (fr >= .55 && r % 4 === 0) { const lg = pickR(this.big.filter(x => s.o[x])), X = lg && s.o[lg]; if (X) { const o2 = FBC.order(X.tab), pt = i => X.tab[i][1] * 3 + X.tab[i][2], gap = pt(o2[0]) - pt(o2[1]); if (gap <= 4) out.push(['dunya', 1, `${FBT.league(lg).flag} ${FBU.ek(FBT.league(lg).name, 'loc')} yarış kızıştı: fark ${gap} puan`, `${tn(lg + ':' + o2[0])} ile ${tn(lg + ':' + o2[1])} şampiyonluk için kafa kafaya.`]); } }
      this.big.filter(x => s.o[x]).forEach(lg => { const t1 = leaders(1, lg)[0]; if (!t1) return; const ms = [30, 25, 20, 15, 10].find(m => t1.v >= m), fk = 'ms' + lg + ms; if (ms && !s.flags[fk]) { s.flags[fk] = 1; const w = who(t1.k); out.push(['dunya', ms >= 20 ? 1 : 0, `${FBT.league(lg).flag} ${w.name} ${ms} gole ulaştı`, `${tn(w.club)} forması giyen golcü ${FBU.ek(FBT.league(lg).name, 'loc')} gol krallığı yarışında başı çekiyor.`]); } });
      if (Math.random() < .12) { const lg = pickR(this.big.filter(x => s.o[x])), cand = lg ? leaders(3, lg).slice(0, 8) : []; if (cand.length) { const x = pickR(cand), w = who(x.k), wk = 2 + ((Math.random() * 5) | 0); (s.inj || (s.inj = {}))[x.k] = wk; out.push(['dunya', 0, `${FBT.league(lg).flag} ${FBU.ek(tn(w.club), 'dat')} şok: ${w.name} ${wk} hafta yok`, `Yıldız oyuncunun sakatlığı ${FBU.ek(FBT.league(lg).name, 'gen')} dengelerini değiştirebilir.`]); } }
      if (Math.random() < .1) { const lg = pickR(this.big), tA = leaders(2, lg)[0], dest = FBT.all().filter(id => FBT.team(id).r >= 86); if (tA && dest.length) { const w = who(tA.k), d2 = pickR(dest.filter(id => id !== w.club)); out.push(['dunya', 0, `${FBT.league(lg).flag} Transfer bombası: ${w.name}, ${FBU.ek(tn(d2), 'gen')} radarında`, `${tA.v} asistlik oyun kurucu için dev bir teklifin hazırlandığı konuşuluyor.`]); } }
      if (Math.random() < .14) { const dd = FB_DERBY.filter(([a]) => FBT.all().some(id => tn(id) === a && id.startsWith(s.lg + ':'))); const d = dd.length ? pickR(dd) : pickR(FB_DERBY); const [fh, fid] = this.pickT('fx', [`Rıza Mikrofon ile Hoca Taktikçi canlı yayında ${d[2]} yüzünden birbirine girdi`, `${d[0]} taraftarı ${d[1]} maçı öncesi şehre dev pankart astı`, `${d[1]} başkanı: "${d[0]} bizden korkuyor"`, `Yorumcu masasında kahve döküldü: tartışma ${d[2]} üzerineydi`]); out.push(['magazin', 0, fh, `Spor gündemi yine sıcak.`, { tid: fid }]); }
      if (Math.random() < .08 && s.my.apps >= 3) { const [mh, mid] = this.pickT('me', [`${FBU.ek(p.short, 'gen')} yeni saç modeli sosyal medyada gündem oldu`, `${p.short} antrenmandan sonra 200 frikik çalıştı, malzemeci topları toplayamadı`, `Taraftarlar ${p.short} için yeni bir tezahürat besteledi`, `${p.short} çocuk taraftara forma hediye etti, o anlar viral oldu`]); out.push(['magazin', 0, mh, `${us0} kampından renkli kareler.`, { tid: mid }]); }
      // the big foreign leagues
      const nt = Math.random() < .6 ? this.notes.slice(0, 1) : []; this.notes = [];
      nt.forEach(n => out.push(['dunya', n.d ? 1 : 0, n.d ? `${FBT.league(n.lg).flag} ${n.d}: ${tn(n.H)} ${n.gh}-${n.ga} ${tn(n.A)}` : n.up ? `${FBT.league(n.lg).flag} Sürpriz: ${tn(n.gh > n.ga ? n.H : n.A)} devi devirdi` : `${FBT.league(n.lg).flag} Gol şov: ${tn(n.H)} ${n.gh}-${n.ga} ${tn(n.A)}`, `${FBU.ek(FBT.league(n.lg).name, 'loc')} haftanın konuşulan maçı.`]));
      out.sort((a, b) => a[1] - b[1]).slice(-8).concat([ownItem]).forEach(x => this.add(...x));
    },
    // Player of the month for every league, from the month's real stats
    month(mi) {
      const s = C.s, mr = s.monR || { s: 0, n: 0 }, myAvg = mr.n ? mr.s / mr.n : 0, all = [];
      [s.lg].concat(Object.keys(s.o)).forEach(lg => {
        const M = (s.mon || {})[lg] || {}, P = (s.monP || {})[lg] || {};
        const list = Object.entries(M).filter(([k, v]) => v[0] >= 2 && !k.endsWith('|GK')).map(([k, v]) => {
          const club = k === 'ME' ? C.club : k.split('|')[0];
          return { k, g: v[1], a: v[2], apps: v[0], sc: v[1] * 3 + v[2] * 2 + (P[club] || 0) * .35 + v[0] * .25 + (k === 'ME' ? (myAvg - 6.6) * 4 : 0) };
        }).sort((a, b) => b.sc - a.sc).slice(0, 3).map(x => Object.assign(x, who(x.k), { sc: Math.round(x.sc * 10) / 10 }));
        if (!list.length) return;
        (s.potm || (s.potm = [])).push({ mi, lg, top: list }); all.push({ lg, list });
      });
      const mine = all.find(x => x.lg === s.lg), mn = MONTHS[mi] || 'Ay';
      if (mine) {
        const w = mine.list[0];
        this.add('oyuncu', 3, w.me ? `🌟 ${mn} ayının oyuncusu SENSİN!` : `🌟 ${FBU.ek(FBT.league(s.lg).name, 'loc')} ${mn} ayının oyuncusu: ${w.name}`, `${w.g} gol, ${w.a} asist ile ayın en etkili ismi oldu.`, { potm: { mn, lg: s.lg, top: mine.list } });
        const myI = mine.list.findIndex(x => x.me);
        if (myI === 0) { C.tro.push({ y: s.year, n: `Ayın Oyuncusu · ${mn}`, ic: '🌟' }); news(`🌟 ${mn} ayının oyuncusu seçildin!`); }
        else if (myI > 0) news(`🌟 ${mn} ayının oyuncusu yarışında ${myI + 1}. oldun`);
      }
      all.filter(x => x.lg !== s.lg && this.big.includes(x.lg)).sort(() => Math.random() - .5).slice(0, 1).forEach(x => this.add('dunya', 0, `${FBT.league(x.lg).flag} ${FBT.league(x.lg).name}: ${mn} ayının oyuncusu ${x.list[0].name}`, `${tn(x.list[0].club)} formasıyla ${x.list[0].g} gol, ${x.list[0].a} asist.`));
      s.mon = {}; s.monP = {}; s.monR = { s: 0, n: 0 };
    },
    // European nights
    cup(k, stg, res, win) {
      const s = C.s, nm = FB_CUPS[k][0], stn = FBC.STAGES[stg], ours = s.lg;
      if (stg === 3) { this.add('avrupa', 2, `🏆 ${nm} şampiyonu ${tn(win[0])}!`, `Final: ${tn(res[0][0])} ${res[0][2]}-${res[0][3]} ${tn(res[0][1])}${res[0][4] ? ' (penaltılarla)' : ''}. Kupa ${FBU.ek(FBT.team(win[0]).lg.country, 'dat')} gidiyor.`); return; }
      let up = null; res.forEach(([a, b, sa, sb, pk]) => { const w = (sa > sb || pk === 'a') ? a : b, l = w === a ? b : a; if (FBT.team(l).r - FBT.team(w).r >= 7 && !up) up = [w, l, a, b, sa, sb]; });
      if (up) this.add('avrupa', 1, `${nm}'nde dev devrildi: ${tn(up[0])} turladı`, `${stn}: ${tn(up[2])} ${up[4]}-${up[5]} ${tn(up[3])}. ${tn(up[1])} için hayal kırıklığı.`);
      res.forEach(([a, b, sa, sb, pk]) => { [a, b].forEach(t => { if (t.startsWith(ours + ':') && t !== C.club) { const w = (sa > sb || pk === 'a') ? a : b; this.add('avrupa', 1, w === t ? `Temsilcimiz ${tn(t)} ${nm}'nde turladı` : `${tn(t)} ${nm}'ne ${stn} turunda veda etti`, `${tn(a)} ${sa}-${sb} ${tn(b)}${pk ? ' (penaltılar)' : ''}.`); } }); });
    },
    season(pos, kings) {
      const s = C.s, L = FBT.league(s.lg), ord = FBC.order(s.tab), ch = s.lg + ':' + ord[0], last = s.lg + ':' + ord[ord.length - 1];
      this.add('takim', 3, `🥇 ${L.name} şampiyonu ${tn(ch)}!`, `${s.year}-${String(s.year + 1).slice(2)} sezonunu zirvede bitiren ${tn(ch)}, ${coach(ch)} yönetiminde kupayı kaldırdı.`);
      if (kings && kings.g) this.add('oyuncu', 2, `👟 Gol kralı: ${kings.g.n}`, `${tn(kings.g.c)} formasıyla ${kings.g.v} gol.`);
      if (kings && kings.a) this.add('oyuncu', 1, `🎯 Asist kralı: ${kings.a.n}`, `${FBU.ek(tn(kings.a.c), 'loc')} ${kings.a.v} asistle yaratıcılığın adı oldu.`);
      this.add('takim', 0, `${tn(last)} sezonu son sırada kapattı`, `${coach(last)}: "Yaz kampında her şeyi yeniden kuracağız."`);
      Object.keys(s.o).filter(lg => this.big.includes(lg)).forEach(lg => { const o2 = FBC.order(s.o[lg].tab); this.add('dunya', 0, `${FBT.league(lg).flag} ${FBT.league(lg).name} şampiyonu ${tn(lg + ':' + o2[0])}`, `Sezon sona erdi.`); });
    }
  };
  function applyResult(f, res) {
    ensureStats();
    const s = C.s, p = me(), us = res.us, my = s.my;
    let pen = '', win = res.sc[0] > res.sc[1];
    if (f.e.k === 'L') {
      const R = fixtures()[f.e.r], L = FBT.league(s.lg);
      const rr = R.map(([h, a]) => { if (h === myIdx() || a === myIdx()) { const gh = f.home ? res.sc[0] : res.sc[1], ga = f.home ? res.sc[1] : res.sc[0]; return [h, a, gh, ga]; } const [gh, ga] = FBC.simScore(L.teams[h][4], L.teams[a][4]); return [h, a, gh, ga]; });
      rr.forEach(([h, a, gh, ga]) => FBC.addRes(s.tab, h, a, gh, ga)); s.res[f.e.r] = rr.map(x => [x[2], x[3]]);
      rr.forEach(([h, a, gh, ga]) => { if (h === myIdx() || a === myIdx()) return; creditTeam(s.lg + ':' + h, gh, null); creditTeam(s.lg + ':' + a, ga, null); });
      const lg0 = (res.log || []).filter(e => e.side === 0), lg1 = (res.log || []).filter(e => e.side === 1);
      psAdd('ME', 0); const ourSc = creditTeam(C.club, 0, lg0) || []; creditTeam(f.opp, 0, lg1);
      // goals without a log line (rare: older sims) still count for someone
      for (let i = lg0.length; i < res.sc[0]; i++) psAdd(C.club + '|' + wpick(GW, [myRole()]), 1);
      for (let i = lg1.length; i < res.sc[1]; i++) psAdd(f.opp + '|' + wpick(GW, []), 1);
      rr.forEach(([h, a, gh, ga]) => { const H = s.lg + ':' + h, Aw = s.lg + ':' + a; monPts(s.lg, H, gh, ga); monPts(s.lg, Aw, ga, gh); form(H, gh, ga); form(Aw, ga, gh); });
      const mr = s.monR || (s.monR = { s: 0, n: 0 }); mr.s += us.r; mr.n++;
      MEDIA.notes = []; advanceOthers((f.e.r + 1) / fixtures().length);
      MEDIA.round(rr, f, res, ourSc);
      const NR = fixtures().length, mo = r => Math.floor(r * 10 / NR);
      if (f.e.r === NR - 1 || mo(f.e.r + 1) !== mo(f.e.r)) MEDIA.month(mo(f.e.r));
      sub.round = rr;
    } else {
      if (res.sc[0] === res.sc[1]) { win = Math.random() < clamp(.5 + (club().r - FBT.team(f.opp).r) / 80 + (p.attr.sut - 60) / 300, .2, .8); pen = win ? 'Penaltılarla kazandın' : 'Penaltılarla elendin'; }
      simCupStage(f.e.st, { cup: f.cup, sc: res.sc, win });
      sub.round = null;
      if (!win) news(`💔 ${FB_CUPS[f.cup][0]}'ne ${FBC.STAGES[f.e.st]} turunda veda`);
      else if (f.e.st === 3) { C.tro.push({ y: s.year, n: FB_CUPS[f.cup][0], ic: '🏆' }); news(`🏆 ${FB_CUPS[f.cup][0]} ŞAMPİYONU!`); }
      else news(`✅ ${FB_CUPS[f.cup][0]}: ${FBC.STAGES[f.e.st + 1]}'e yükseldik`);
    }
    // Player stats + progression
    // Performance-based skill points (can go down); MVP adds a big bonus
    const band = FBC.band(us.r), best = FBC.bestOther(res, C.club, f.opp), mvp = us.r >= best.r;
    const delta = band.d + (mvp ? 25 : 0), before = p.skill, gained = FBC.addSkill(p, delta);
    my.apps++; my.g += us.g; my.a += us.a; my.rs += us.r; if (mvp) my.motm++;
    C.tot.apps++; C.tot.g += us.g; C.tot.a += us.a; C.tot.rs += us.r;
    const gd = (us.gd || []).slice(), far = gd.length ? Math.max(...gd) : 0;
    s.mine.push({ wk: s.wk, opp: f.opp, home: f.home, sc: res.sc.slice(), r: us.r, g: us.g, a: us.a, comp: f.comp, pen, sim: !!res.sim, mvp, d: delta, gd });
    if (far) { if (far > (my.far || 0)) my.far = far; if (far > (C.tot.far || 0)) { C.tot.far = far; if (far >= 20) news(`🚀 Kariyerinin en uzak golü: ${far} metre!`); } }
    if (gained) news(`💪 ${gained} gelişim hakkı kazandın! Gelişim sekmesinden özelliklerini yükselt.`);
    if (us.g >= 3) news(`🎩 HAT-TRICK! ${p.first} ${p.last} ${FBU.ek(FBT.team(f.opp).name, 'dat')} ${us.g} gol attı`);
    else if (mvp) news(`🏅 Maçın oyuncusu: ${p.short} (${us.r.toFixed(1)})`);
    s.wk++;
    const lr = s.cal.filter(x => x.k === 'L').length;
    if (f.e.k === 'L' && f.e.r === Math.floor(lr / 2) - 1) midSeason();
    C.live = null;
    sub.last = { f, res, pen, win, band, mvp, best, delta, before, gained };
    if (!nextFix()) seasonEnd();
    save();
  }
  function midSeason() {
    const avg = C.s.my.apps ? C.s.my.rs / C.s.my.apps : 6, sc = FBC.ovr(me()) + (avg - 6.6) * 8;
    const c = FBT.all().filter(id => id !== C.club && Math.abs(FBT.team(id).r - sc - 3) < 6);
    if (c.length && avg > 6.6) { const t = FBT.team(FBU.pick(c)); news(`👀 ${t.name} (${t.lg.name}) gözlemcileri seni izliyor. Sezon sonu transfer dönemi!`); }
    else news('📋 Sezonun yarısı geride kaldı. Reytingini yükseltirsen kulüpler kapını çalar.');
  }
  function seasonEnd() {
    const s = C.s, ord = FBC.order(s.tab), pos = ord.indexOf(myIdx()) + 1, L = FBT.league(s.lg), my = s.my, avg = my.apps ? my.rs / my.apps : 0;
    C.prev = { [s.lg]: ord }; for (const lg in s.o) { advanceOthers(1); C.prev[lg] = FBC.order(s.o[lg].tab); }
    if (pos === 1) { C.tro.push({ y: s.year, n: L.name, ic: '🥇' }); news(`🥇 ${L.name} ŞAMPİYONU!`); }
    // Golden boot / assist king from the league's real stats table
    ensureStats();
    const gL = leaders(1), aL = leaders(2), gR = myRank(1), aR = myRank(2), kings = {};
    if (gL[0]) { const w = who(gL[0].k); kings.g = { n: w.name, c: w.club, v: gL[0].v }; if (gL[0].k === 'ME') { C.tro.push({ y: s.year, n: 'Gol Kralı · ' + L.name, ic: '👟' }); news(`👟 GOL KRALI SENSİN! ${gL[0].v} gol`); } else news(`👟 ${L.name} gol kralı: ${w.name} (${FBT.team(w.club).name}) · ${gL[0].v} gol`); }
    if (aL[0]) { const w = who(aL[0].k); kings.a = { n: w.name, c: w.club, v: aL[0].v }; if (aL[0].k === 'ME') { C.tro.push({ y: s.year, n: 'Asist Kralı · ' + L.name, ic: '🎯' }); news(`🎯 ASİST KRALI SENSİN! ${aL[0].v} asist`); } }
    MEDIA.season(pos, kings);
    C.hist.push({ y: s.year, club: C.club, apps: my.apps, g: my.g, a: my.a, avg: Math.round(avg * 100) / 100, pos, lg: s.lg, gr: gR && gR.r, ar: aR && aR.r, lgG: (s.ps.ME || [0, 0, 0])[1], lgA: (s.ps.ME || [0, 0, 0])[2], kings });
    const p = me(); p.age++;
    if (p.age > 30) { ['hiz', 'fizik'].forEach(k => p.attr[k] = Math.max(30, p.attr[k] - (1 + ((Math.random() * 2) | 0)))); }
    // Transfer offers
    const val = FBC.ovr(p) + (avg - 6.6) * 9 + my.g * .25 + my.a * .15;
    const cand = FBT.all().filter(id => id !== C.club && FBT.team(id).r <= val + 6 && FBT.team(id).r >= Math.min(val - 6, club().r - 2));
    const offers = [];
    for (let i = 0; i < 12 && offers.length < 3 && cand.length; i++) { const id = FBU.pick(cand); if (!offers.includes(id)) offers.push(id); }
    C.offers = offers.sort((a, b) => FBT.team(b).r - FBT.team(a).r);
    C.phase = p.age >= 37 ? 'retire' : 'offers';
    sub.seasonEnd = { pos, year: s.year };
    tab = 'ana';   // open the season review whatever page was showing
  }
  function startNext(toClub) {
    if (toClub && toClub !== C.club) { const t = FBT.team(toClub); news(`✍️ Transfer! ${t.name} ile sözleşme imzaladın`); C.club = toClub; FBA.play('sign'); }
    C.phase = null; C.offers = []; delete sub.lgView; newSeason(C.s.year + 1); save(); show('hub');
  }

  /* ---------- Screens ---------- */
  // Paint the UI in the current club's colours (neutral green on the title / creation screens)
  function applyTheme(t) {
    const key = t ? t.c1 + t.c2 : ''; if (root.dataset.th === key) return; root.dataset.th = key;
    const v = t ? FBU.theme(t.c1, t.c2) : null;
    ['--acc', '--accd', '--accs', '--onacc', '--onaccd', '--acc2', '--bg1', '--bg2', '--bg3', '--panel', '--panel2', '--line', '--tx', '--mut', '--mut2', '--sub'].forEach(k => v ? root.style.setProperty(k, v[k]) : root.style.removeProperty(k));
  }
  function show(v) { applyTheme(C && v !== 'title' && v !== 'create' ? club() : null); view = v; if (match) { match.destroy(); match = null; } top.hidden = v === 'match'; top.querySelector('[data-t="back"]').style.visibility = v === 'title' && !window.goMenu ? 'hidden' : ''; nav.hidden = setBtn.hidden = v !== 'hub'; root.classList.toggle('navon', v === 'hub'); if (v !== 'match' && !FBU.calm) { main.classList.remove('scr'); void main.offsetWidth; main.classList.add('scr'); } main.scrollTop = 0; ({ title: renderTitle, create: renderCreate, hub: renderHub, pre: renderPre, post: renderPost })[v](); }
  const avatar = (p, kit, back, w = 110) => { const cv = document.createElement('canvas'); cv.width = 200; cv.height = 300; cv.style.width = w + 'px'; cv.style.height = w * 1.5 + 'px'; fbAvatar(cv, p.look, kit, p.num, p.short, back); return cv; };

  function renderTitle() {
    let html = `<div class="fb-hero gb-hero"><svg class="gb-pitch" viewBox="0 0 200 120" aria-hidden="true"><path d="M0 119h200M60 119v-38h80v38M82 119v-16h36v16M70 81a30 30 0 0 0 60 0"/><circle cx="100" cy="0" r="26"/><path d="M0 0h200"/></svg><h1 class="gb-word"><span>GOAL</span><em>BOUND</em></h1><p>Oyuncunu yarat, İstediğin ligden başla, Avrupa'yı fethet.</p></div><div class="fb-slots">`;
    for (let n = 0; n < 3; n++) {
      const raw = localStorage.getItem(FBS.key(n)) || localStorage.getItem(FBS.key(n) + '_b'), d = FBS.read(n);
      if (d) {
        const t = FBT.team(d.club), dt = new Date(d.updated || 0);
        html += `<div class="fb-slot" data-no="KAYIT 0${n + 1}">${FBT.badge(t, 40)}<div class="fb-si"><b>${esc(d.p.first + ' ' + d.p.last)}</b><span>${esc(t.name)} · ${d.s.year}-${String(d.s.year + 1).slice(2)} · ${d.p.age} yaş · GNL ${FBC.ovr(d.p)}</span><small>${d.live ? '⏯ Yarım kalan maç var · ' : ''}${d._recovered ? '🛟 Yedekten kurtarıldı · ' : ''}Kayıt: ${dt.toLocaleDateString('tr-TR')} ${dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small></div>
          <div class="fb-sb"><button class="fb-btn pri" data-a="cont" data-n="${n}">Devam</button><button class="fb-btn ghost sm" data-a="del" data-n="${n}">Sil</button></div></div>`;
      } else if (raw) html += `<div class="fb-slot bad" data-no="KAYIT 0${n + 1}"><div class="fb-si"><b>Kayıt ${n + 1} okunamadı</b><span>Dosya bozulmuş görünüyor.</span></div><div class="fb-sb"><button class="fb-btn ghost sm" data-a="del" data-n="${n}">Temizle</button></div></div>`;
      else html += `<div class="fb-slot empty" data-no="KAYIT 0${n + 1}"><div class="fb-si"><b>Boş kayıt ${n + 1}</b><span>Yeni bir kariyere başla</span></div><div class="fb-sb"><button class="fb-btn pri" data-a="new" data-n="${n}">Yeni kariyer</button><button class="fb-btn ghost sm" data-a="imp" data-n="${n}">İçe aktar</button></div></div>`;
    }
    html += `</div><p class="fb-note">Kariyer her maçtan, gelişimden ve transferden sonra otomatik kaydedilir; maç sırasında da anlık durum saklanır. Her kayıt ayrıca yedek kopya tutar.</p>`;
    main.innerHTML = html;
    main.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const n = +b.dataset.n, a = b.dataset.a;
      if (a === 'cont') { const d = FBS.read(n); if (!d) { toast('Kayıt okunamadı'); return renderTitle(); } FBA.play('confirm'); C = migrate(d); slot = n; if (C._needStats) { delete C._needStats; ensureStats(); save(true); } if (C._recovered) { delete C._recovered; save(true); toast('🛟 Ana kayıt bozuktu, yedekten kurtarıldı'); } show('hub'); }
      else if (a === 'imp') { FBA.play('ui'); importSave(n); }
      else if (a === 'new') { FBA.play('confirm'); slot = n; sub = { step: 0, d: { first: '', last: '', short: '', num: 9, pos: 'FW', look: { skin: 1, hair: 0, hairC: 0, boots: 0 }, attr: { sut: 50, pas: 50, hiz: 50, teknik: 50, fizik: 50 }, pts: 20, club: null } }; show('create'); }
      else if (a === 'del') { if (b.dataset.sure) { FBS.del(n); FBA.play('back'); toast('Kayıt silindi'); renderTitle(); } else { b.dataset.sure = 1; b.textContent = 'Emin misin?'; b.classList.add('warn'); setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Sil'; b.classList.remove('warn'); } }, 2500); } }
    };
  }

  /* ---------- Player creation (4 steps) ---------- */
  function renderCreate() {
    const d = sub.d, st = sub.step, kit = d.club ? FBT.team(d.club) : { c1: '#e11d48', c2: '#ffffff' };
    const steps = ['Kimlik', 'Görünüm', 'Yetenek', 'Takım'];
    let h = `<div class="fb-steps">${steps.map((s, i) => `<span class="${i === st ? 'on' : i < st ? 'ok' : ''}">${i + 1}. ${s}</span>`).join('')}</div>`;
    h += `<div class="fb-cr"><div class="fb-av"></div><div class="fb-crf">`;
    if (st === 0) {
      h += `<label>Ad<input class="fb-in" data-f="first" maxlength="14" value="${esc(d.first)}" placeholder="ör. Metin" autocomplete="off"></label>
        <label>Soyad<input class="fb-in" data-f="last" maxlength="16" value="${esc(d.last)}" placeholder="ör. Yıldız" autocomplete="off"></label>
        <label>Forma ismi<input class="fb-in" data-f="short" maxlength="12" value="${esc(d.short)}" placeholder="Soyadın kullanılır" autocomplete="off"></label>
        <label>Forma numarası<div class="fb-num"><button class="fb-btn sm" data-a="num-">−</button><b>${d.num}</b><button class="fb-btn sm" data-a="num+">+</button></div></label>
        <label>Mevki<div class="fb-chips">${Object.entries(FBC.POS).map(([k, v]) => `<button class="fb-chip ${d.pos === k ? 'on' : ''}" data-a="pos" data-v="${k}">${v}</button>`).join('')}</div></label>`;
    } else if (st === 1) {
      const row = (lab, key, n, sw) => `<label>${lab}<div class="fb-chips">${[...Array(n)].map((_, i) => `<button class="fb-chip ${d.look[key] === i ? 'on' : ''}" data-a="look" data-k="${key}" data-v="${i}">${sw ? `<i style="background:${sw[i]}"></i>` : FB_HAIRS[i]}</button>`).join('')}</div></label>`;
      h += row('Ten rengi', 'skin', FB_SKIN.length, FB_SKIN) + row('Saç modeli', 'hair', FB_HAIRS.length) + row('Saç rengi', 'hairC', FB_HAIRC.length, FB_HAIRC) + row('Krampon', 'boots', FB_BOOTS.length, FB_BOOTS) + `<button class="fb-btn ghost sm" data-a="flip">↻ Arkadan / önden bak</button>`;
    } else if (st === 2) {
      h += `<p class="fb-mut">Dağıtılacak puan: <b class="fb-pts">${d.pts}</b> · En fazla 70</p>` + FBC.ATTR.map(([k, l]) => `<div class="fb-att"><span>${l}</span><button class="fb-btn sm" data-a="at-" data-k="${k}">−</button><div class="fb-meter"><i style="width:${d.attr[k]}%"></i></div><b>${d.attr[k]}</b><button class="fb-btn sm" data-a="at+" data-k="${k}">+</button></div>`).join('') +
        `<p class="fb-mut">Genel: <b>${FBC.ovr(d)}</b> · ${FBC.POS[d.pos]} için en önemli: ${Object.entries(FBC.W[d.pos]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => FBC.ATTR.find(x => x[0] === k)[1]).join(', ')}</p>`;
    } else {
      // Any league, any club: pick the league first, then a club from it
      const lg = d.lg || (d.club ? lgOf(d.club) : 'tr'), L = FBT.league(lg);
      h += `<p class="fb-mut">Önce ligini, sonra kulübünü seç:</p><div class="fb-lgs">${FB_LEAGUES.map(X => `<button class="fb-lg ${X.id === lg ? 'on' : ''}" data-a="lg" data-v="${X.id}"><i>${X.flag}</i><span>${esc(X.country)}</span></button>`).join('')}</div>
        <h4 class="fb-lgh">${L.flag} ${esc(L.name)} · ${esc(L.country)} <small>${L.teams.length} kulüp${L.euro[0] + L.euro[1] + L.euro[2] ? ` · Avrupa: ilk ${L.euro[0] + L.euro[1] + L.euro[2]}` : ' · Avrupa kupası yok'}</small></h4><div class="fb-teams">` + FBT.ids(lg).map(id => { const t = FBT.team(id); return `<button class="fb-team ${d.club === id ? 'on' : ''}" data-a="club" data-v="${id}">${FBT.badge(t, 30)}<span>${esc(t.name)}</span><small>${'★'.repeat(clamp(Math.round((t.r - 58) / 6), 1, 5))}</small></button>`; }).join('') + `</div>`;
    }
    h += `</div></div><div class="fb-nav">${st > 0 ? '<button class="fb-btn ghost" data-a="prev">‹ Geri</button>' : '<span></span>'}<button class="fb-btn pri" data-a="next">${st < 3 ? 'İleri ›' : '✔ Kariyere başla'}</button></div>`;
    main.innerHTML = h;
    const av = main.querySelector('.fb-av'); av.appendChild(avatar({ ...d, short: d.short || d.last || 'OYUNCU' }, kit, !!sub.flip, 120));
    av.insertAdjacentHTML('beforeend', `<div class="fb-avn">${esc(FBU.trU(d.short || d.last || 'Oyuncu'))} · ${d.num}</div>`);
    main.querySelectorAll('.fb-in').forEach(inp => inp.oninput = () => { d[inp.dataset.f] = inp.value.replace(/[<>]/g, ''); if (inp.dataset.f !== 'first') { const c = av.querySelector('canvas'); fbAvatar(c, d.look, kit, d.num, d.short || d.last || 'OYUNCU', !!sub.flip); av.querySelector('.fb-avn').textContent = FBU.trU(d.short || d.last || 'Oyuncu') + ' · ' + d.num; } });
    main.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'num-' || a === 'num+') { d.num = (d.num + (a === 'num+' ? 1 : -1) + 98) % 99 + 1; FBA.play('ui'); }
      else if (a === 'pos') { d.pos = b.dataset.v; FBA.play('ui'); }
      else if (a === 'look') { d.look[b.dataset.k] = +b.dataset.v; FBA.play('ui'); }
      else if (a === 'flip') { sub.flip = !sub.flip; FBA.play('ui'); }
      else if (a === 'at+' || a === 'at-') { const k = b.dataset.k; if (a === 'at+' && d.pts > 0 && d.attr[k] < 70) { d.attr[k]++; d.pts--; FBA.play('ui'); } else if (a === 'at-' && d.attr[k] > 40) { d.attr[k]--; d.pts++; FBA.play('ui'); } else { FBA.play('back'); return; } }
      else if (a === 'lg') { if (d.lg !== b.dataset.v) { d.lg = b.dataset.v; if (d.club && lgOf(d.club) !== d.lg) d.club = null; } FBA.play('ui'); }
      else if (a === 'club') { d.club = b.dataset.v; d.lg = lgOf(d.club); FBA.play('confirm'); sub.flip = true; }
      else if (a === 'prev') { sub.step--; FBA.play('back'); }
      else if (a === 'next') {
        if (st === 0) { d.first = d.first.trim(); d.last = d.last.trim(); if (!d.first || !d.last) { toast('Ad ve soyad gir'); FBA.play('back'); return; } d.short = (d.short.trim() || d.last).slice(0, 12); }
        if (st === 2 && d.pts > 0) { toast(`Önce ${d.pts} puanı dağıt`); FBA.play('back'); return; }
        if (st === 3) { if (!d.club) { toast('Bir kulüp seç'); FBA.play('back'); return; } return createCareer(); }
        sub.step++; FBA.play('confirm');
      } else return;
      renderCreate();
    };
  }
  // Older saves: upgrade points become development rights (capped), skill points start at 0
  function migrate(d) {
    FBT.seed = d.created || '';
    // growing thresholds: estimate levels already passed from the rights earned so far (spent + unspent)
    if (d.p.up != null && d.p.lvl == null) { const spent = Object.values(d.p.attr).reduce((a, b) => a + b, 0) - 270; d.p.lvl = Math.max(0, Math.floor((Math.max(0, spent) + d.p.up) / 3)); }
    if (d.set && d.set.zoom == null) d.set.zoom = 1;
    if (d.s && !d.s.ps) d._needStats = true;
    // leagues added in later versions join a running season with an empty table (they catch up on the next round)
    if (d.s && d.s.o) FB_LEAGUES.forEach(X => { if (X.id !== d.s.lg && !d.s.o[X.id]) d.s.o[X.id] = { tab: FBC.newTab(X.teams.length), rd: 0 }; });
    if (d.p.up == null) { d.p.up = Math.min(d.p.sp || 0, 9); d.p.skill = 0; delete d.p.sp; delete d.p.xpLast; d.v = 2; toast('Gelişim sistemi güncellendi: yeni Skill Puanı sistemine geçildi'); }
    return d;
  }
  function createCareer() {
    const d = sub.d;
    C = { v: 2, created: Date.now().toString(36), club: d.club, p: { first: d.first, last: d.last, short: d.short, num: d.num, pos: d.pos, look: d.look, attr: d.attr, age: 18, up: 0, skill: 0, lvl: 0 }, tot: { apps: 0, g: 0, a: 0, rs: 0 }, tro: [], hist: [], news: [], prev: null, set: { len: 270, zoom: 1 }, live: null };
    FBT.seed = C.created;
    newSeason(2026);
    news(`✍️ ${d.first} ${d.last}, ${club().name} ile ilk profesyonel sözleşmesini imzaladı! Forma: ${d.num} · ${FBU.trU(d.short)}`);
    if (!save()) toast('⚠️ Kayıt oluşturulamadı'); FBA.play('sign'); tab = 'ana';
    if (tutDone()) show('hub'); else startTutorial();
  }
  // Tutorial: shown once (flag kept per device and in the career save); can be replayed from Ayarlar
  const tutDone = () => { try { return localStorage.getItem('od_fb_tut') === '1'; } catch (e) { return false; } };
  function startTutorial() {
    view = 'match'; top.hidden = true; nav.hidden = true; main.innerHTML = ''; main.onclick = null;
    const wrap = document.createElement('div'); wrap.className = 'fb-mw'; root.appendChild(wrap);
    const p = me(), ids = FBT.ids(C.s.lg).filter(id => id !== C.club);
    match = FBMatch(wrap, {
      tut: true, my: club(), opp: FBT.team(ids[ids.length - 1]), home: true, comp: 'Antrenman', len: C.set.len, zoom: C.set.zoom || 1, onZoom(z) { C.set.zoom = Math.round(z * 100) / 100; },
      user: { name: p.first + ' ' + p.last, short: p.short, num: p.num, pos: p.pos, attr: p.attr, look: p.look },
      onEnd(r) {
        wrap.remove(); match = null;
        if (!r.skipped) { try { localStorage.setItem('od_fb_tut', '1'); } catch (e) {} C.tut = 1; }
        save(true); if (!r.skipped) toast('🎓 Eğitim tamamlandı'); show('hub');
      }
    });
    const d0 = match.destroy; match.destroy = () => { d0(); wrap.remove(); };
  }

  /* ---------- Hub ---------- */
  // Bottom navigation: five sections; Lig and Kariyer hold sub-pages shown as a segmented control
  // Inline SVG icon set (consistent on every platform, coloured by the current text colour)
  const ICONS = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    news: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    up: '<path d="M4 18l6-6 4 4 6-8"/><path d="M15 8h5v5"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.8 2.8-1.4 4.4H9.6l-1.4-4.4z"/><path d="M12 3v4.5M15.8 10.3l4.5-1.6M14.4 14.7l2.7 3.9M9.6 14.7l-2.7 3.9M8.2 10.3L3.7 8.7"/>',
    shirt: '<path d="M8 3l4 2 4-2 5 4-3 3-2-1v12H8V9L6 10 3 7z"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
    cup: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'
  };
  const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const NAV = [['ana', 'home', 'Ana Sayfa'], ['hab', 'news', 'Haberler'], ['gel', 'up', 'Gelişim'], ['lig', 'table', 'Lig'], ['kar', 'user', 'Kariyer']];
  const NAV_SEG = { lig: [['lig', 'Puan'], ['ist', 'İstatistik'], ['fik', 'Fikstür'], ['avr', 'Avrupa']], kar: [['kar', 'Profil'], ['kadro', 'Kadro'], ['ayr', 'Ayarlar']] };
  const groupOf = k => Object.keys(NAV_SEG).find(g => NAV_SEG[g].some(x => x[0] === k)) || k;
  // Switch to a page (remembering the last sub-page of each section) and redraw
  function goTab(k) { const moved = k !== tab; tab = k; (sub.navMem || (sub.navMem = {}))[groupOf(k)] = k; if (moved) { sub.navAnim = true; main.scrollTop = 0; } renderHub(); }
  // Draw the bottom bar with the active section and the development-point badge
  function renderNav() {
    const g = groupOf(tab), up = me().up;
    nav.innerHTML = NAV.map(([k, ic, l]) => `<button class="${g === k ? 'on' : ''}" data-nav="${k}" aria-label="${l}"><i>${ico(ic)}${k === 'gel' && up ? `<em>${up > 99 ? '99+' : up}</em>` : ''}${k === 'ana' && C.phase ? '<em>!</em>' : ''}</i><span>${l}</span></button>`).join('');
  }
  nav.onclick = e => { const b = e.target.closest('[data-nav]'); if (!b) return; const k = b.dataset.nav, g = groupOf(tab); FBA.play('ui'); if (k === g && NAV_SEG[k] && tab !== NAV_SEG[k][0][0]) return goTab(NAV_SEG[k][0][0]); if (k === g) { main.scrollTo({ top: 0, behavior: 'smooth' }); return; } goTab((sub.navMem && sub.navMem[k]) || k); };
  function renderHub() {
    const p = me(), t = club(), f = nextFix(), ov = FBC.ovr(p);
    renderNav();
    if (C.phase && tab === 'ana') return renderSeasonEnd();
    const grp = groupOf(tab), segs = NAV_SEG[grp] || [];
    main.innerHTML = `<div class="fb-pc"><div class="fb-pav"></div><div class="fb-pi"><b>${esc(p.first + ' ' + p.last)}</b><span>${FBT.badge(t, 18)} ${esc(t.name)} · #${p.num} · ${FBC.POS[p.pos]}</span><span>${p.age} yaş · Sezon ${C.s.year}-${String(C.s.year + 1).slice(2)}</span></div><div class="fb-ovr"><b>${ov}</b><small>GNL</small></div></div>
      ${segs.length > 1 ? `<div class="fb-seg">${segs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>` : ''}<div class="fb-tab ${sub.navAnim ? 'in' : ''}"></div>`;
    sub.navAnim = false;
    main.querySelector('.fb-pav').appendChild(avatar(p, t, false, 46));
    const tb = main.querySelector('.fb-tab');
    ({ ana: tabAna, hab: tabHab, ist: tabIst, kadro: tabKadro, lig: tabLig, fik: tabFik, avr: tabAvr, gel: tabGel, kar: tabKar, ayr: tabAyr })[tab](tb, f);
    main.onclick = e => {
      const tbn = e.target.closest('[data-tab]'); if (tbn) { FBA.play('ui'); goTab(tbn.dataset.tab); return; }
      const b = e.target.closest('button'); if (!b || !b.dataset.a) return; hubAct(b, f);
    };
    main.onchange = e => { if (e.target.dataset.a === 'lgsel') { sub.lgView = e.target.value; FBA.play('ui'); renderHub(); } if (e.target.dataset.a === 'cupsel') { sub.cupView = e.target.value; renderHub(); } };
    main.oninput = e => { const k = e.target.dataset.v; if (k) { FBA.setVol(k, e.target.type === 'checkbox' ? +e.target.checked : e.target.value / 100); sndUI(); if (k === 'hap' && e.target.checked) FBA.buzz(30); } if (e.target.dataset.zoom) { C.set.zoom = e.target.value / 100; save(true); } };
  }
  function hubAct(b, f) {
    const a = b.dataset.a;
    if (a === 'play') { FBA.play('confirm'); sub.fix = f; show('pre'); }
    else if (a === 'resume') { FBA.play('confirm'); sub.fix = f; startMatch(f, C.live); }
    else if (a === 'sim') { FBA.play('ui'); const res = C.live ? simFromLive(f) : simUser(f); applyResult(f, res); show('post'); }
    else if (a === 'up') { const k = b.dataset.k, p = me(), c = FBC.cost(p.attr[k]); if (p.up >= c && p.attr[k] < 99) { p.up -= c; p.attr[k]++; FBA.play('confirm'); save(true); renderHub(); } else { FBA.play('back'); toast(p.attr[k] >= 99 ? 'Zirvedesin!' : `${c} gelişim hakkı gerekli`); } }
    else if (a === 'len') { C.set.len = +b.dataset.v; FBA.play('ui'); save(true); renderHub(); }
    else if (a === 'save') { if (save()) { FBA.play('confirm'); toast('✅ Kaydedildi'); } }
    else if (a === 'exp') exportSave();
    else if (a === 'tut') { FBA.play('confirm'); startTutorial(); }
    else if (a === 'imp') { if (b.dataset.sure) importSave(slot); else { FBA.play('ui'); b.dataset.sure = 1; b.textContent = 'Üzerine yazılsın mı? Tekrar dokun'; b.classList.add('warn'); setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = '⬆️ İçe aktar'; b.classList.remove('warn'); } }, 4000); } }
    else if (a === 'slots') { save(); FBA.play('back'); show('title'); }
    else if (a === 'menu') { save(); goMenu(); }
  }
  // Finish a half-played match from its saved state
  function simFromLive(f) { const L = C.live; return simUser(f, (90 - L.min) / 90, { us: L.us || {}, sc: L.sc, log: L.log || [], min: L.min }); }
  function nextCard(f) {
    if (!f) return '';
    const o = FBT.team(f.opp), t = club(), H = f.home ? t : o, A = f.home ? o : t, L = C.live;
    return `<div class="fb-next ${f.cup ? 'cup ' + f.cup : ''}"><div class="fb-nc">${esc(f.comp)}${f.neutral ? ' · tarafsız saha' : ''}</div>
      <div class="fb-vs"><div>${FBT.badge(H, 48)}<span>${esc(H.name)}</span></div><b>${L ? `${f.home ? L.sc[0] : L.sc[1]} - ${f.home ? L.sc[1] : L.sc[0]}` : 'VS'}</b><div>${FBT.badge(A, 48)}<span>${esc(A.name)}</span></div></div>
      ${L ? `<div class="fb-live">⏯ Yarım kalan maç · ${Math.floor(L.min)}. dakika</div><div class="fb-row"><button class="fb-btn pri big" data-a="resume">▶ Kaldığın yerden devam</button><button class="fb-btn ghost" data-a="sim">⏩ Sonucu simüle et</button></div>`
        : `<div class="fb-row"><button class="fb-btn pri big" data-a="play">▶ Maça çık</button><button class="fb-btn ghost" data-a="sim">⏩ Simüle et</button></div>`}</div>`;
  }
  function tabAna(el, f) {
    const s = C.s, my = s.my, ord = FBC.order(s.tab), pos = ord.indexOf(myIdx()) + 1, last = s.mine.slice(-5).reverse();
    el.innerHTML = nextCard(f) + `<div class="fb-stats"><div><b>${my.apps || s.wk ? pos + '.' : '-'}</b><small>Lig sırası</small></div><div><b>${my.apps}</b><small>Maç</small></div><div><b>${my.g}</b><small>Gol</small></div><div><b>${my.a}</b><small>Asist</small></div><div><b>${my.apps ? (my.rs / my.apps).toFixed(2) : '-'}</b><small>Ort. reyting</small></div></div>
      ${(C.feed || []).length ? `<h4>📰 Son dakika</h4><button class="fb-hl" data-tab="hab">${(C.feed || []).slice(0, 3).map(n => newsCard(n, true)).join('')}</button>` : ''}
      ${kingCard()}
      ${last.length ? `<h4>Son maçlar</h4><div class="fb-list">${last.map(rowMine).join('')}</div>` : ''}
      <h4>Kariyer notları</h4><div class="fb-news">${(C.news || []).map(n => `<div>${esc(n.t)}</div>`).join('') || '<div>Henüz haber yok.</div>'}</div>`;
  }
  function rowMine(m) {
    const o = FBT.team(m.opp), w = m.sc[0] > m.sc[1] || (m.pen && m.pen.includes('kazandın')), d = m.sc[0] === m.sc[1] && !m.pen;
    return `<div class="fb-li"><span class="fb-wdl ${w ? 'w' : d ? 'd' : 'l'}">${w ? 'G' : d ? 'B' : 'M'}</span>${FBT.badge(o, 20)}<span class="grow">${m.home ? '' : '@ '}${esc(o.name)}<small>${esc(m.comp)}${m.pen ? ' · ' + m.pen : ''}${m.sim ? ' · sim' : ''}</small></span><b class="fb-scb">${m.sc[0]}<i>-</i>${m.sc[1]}</b><span class="fb-r ${m.r >= 7.5 ? 'hi' : m.r < 6 ? 'fbr-lo' : ''}">${m.r.toFixed(1)}</span></div>`;
  }
  function tabKadro(el) {
    const t = club(), p = me(), sq = FBT.squad(C.club), role = FBC.ROLE_OF[p.pos];
    const ROLE_TR = { GK: 'KL', LB: 'SLB', LCB: 'STP', RCB: 'STP', RB: 'SĞB', LCM: 'MO', CM: 'MO', RCM: 'OOS', LW: 'SLK', ST: 'SF', RW: 'SĞK' };
    el.innerHTML = `<div class="fb-kits"><div class="fb-kit"></div><div class="fb-kit"></div></div><h4>${esc(t.name)} · İlk 11 (4-3-3)</h4><div class="fb-list">${sq.map(x => {
      const mine = x.role === role, num = mine ? p.num : (x.num === p.num ? 13 : x.num), name = mine ? p.first + ' ' + p.last : x.name;
      return `<div class="fb-li ${mine ? 'me' : ''}"><span class="fb-no" style="background:${t.c1};color:${FBU.ink(t.c1)}">${num}</span><span class="grow">${mine ? '' : (FB_NAT[x.nat] || '') + ' '}${esc(name)}${mine ? ' ⭐' : ''}</span><small>${ROLE_TR[x.role]}</small><span class="fb-r">${mine ? FBC.ovr(p) : Math.round(x.sk * 100) - 5}</span></div>`;
    }).join('')}</div>`;
    const k = el.querySelectorAll('.fb-kit'); k[0].appendChild(avatar(p, t, false, 62)); k[1].appendChild(avatar(p, t, true, 62));
  }
  function table(lg, tabArr, hi) {
    const L = FBT.league(lg), ord = FBC.order(tabArr), [a, b, c] = L.euro;
    return `<table class="fb-tbl"><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th><th class="fm">Form</th></tr>${ord.map((i, k) => {
      const r = tabArr[i], t = FBT.team(lg + ':' + i), fm = ((C.s.form || {})[lg + ':' + i] || '').slice(-5), z = k < a ? 'ucl' : k < a + b ? 'uel' : k < a + b + c ? 'uecl' : '';
      return `<tr class="${hi === i ? 'me' : ''}"><td class="z ${z}">${k + 1}</td><td class="l">${FBT.badge(t, 16)} ${esc(t.name)}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4] - r[5]}</td><td><b>${r[1] * 3 + r[2]}</b></td><td class="fm"><span class="fb-fm">${[...fm].map(c => `<i class="${c}"></i>`).join('')}</span></td></tr>`;
    }).join('')}</table><div class="fb-leg"><span class="z ucl"></span>Şampiyonlar Ligi <span class="z uel"></span>Avrupa Ligi <span class="z uecl"></span>Konferans Ligi <small>(gelecek sezon)</small></div>`;
  }
  // Shared league filter: one state (sub.lgView) used by the standings and every statistics category
  const viewLg = () => (sub.lgView && FBT.league(sub.lgView)) ? sub.lgView : C.s.lg;
  const tabOf = lg => lg === C.s.lg ? C.s.tab : C.s.o[lg].tab;
  const lgSelect = v => `<select class="fb-sel" data-a="lgsel">${FB_LEAGUES.map(L => `<option value="${L.id}" ${L.id === v ? 'selected' : ''}>${L.flag} ${esc(L.name)}${L.id === C.s.lg ? ' (senin ligin)' : ''}</option>`).join('')}</select>`;
  function tabLig(el) {
    const v = viewLg(), mine = v === C.s.lg, tabArr = tabOf(v);
    el.innerHTML = lgSelect(v) + table(v, tabArr, mine ? myIdx() : -1) + (FBT.league(v).euro[0] === 0 ? '<p class="fb-note">Rusya kulüpleri UEFA turnuvalarından men edildiği için Avrupa kotası yok.</p>' : '');
  }
  function tabFik(el) {
    const s = C.s, F = fixtures(); let h = '<div class="fb-list">';
    s.cal.forEach((e, wk) => {
      const done = s.mine.find(m => m.wk === wk);
      if (done) { h += rowMine(done); return; }
      if (e.k === 'L') { const m = F[e.r].find(x => x.includes(myIdx())), home = m[0] === myIdx(), o = FBT.team(s.lg + ':' + (home ? m[1] : m[0])); h += `<div class="fb-li ${wk === s.wk ? 'nx' : ''}"><span class="fb-wdl">${e.r + 1}</span>${FBT.badge(o, 20)}<span class="grow">${home ? '' : '@ '}${esc(o.name)}<small>${wk === s.wk ? 'Sıradaki maç' : 'Lig'}</small></span></div>`; }
      else { const k = s.ucup, ok = k && (wk >= s.wk ? userInCup() === k : false); h += `<div class="fb-li cupr ${wk === s.wk ? 'nx' : ''}"><span class="fb-wdl">🌍</span><span class="grow">${k ? FB_CUPS[k][0] : 'Avrupa haftası'}<small>${FBC.STAGES[e.st]}${k ? (ok ? '' : ' · elendik') : ' · katılım yok'}</small></span></div>`; }
    });
    el.innerHTML = h + '</div>';
  }
  function tabAvr(el) {
    const s = C.s, v = sub.cupView || s.ucup || 'ucl', c = s.cups[v];
    let h = `<div class="fb-chips">${['ucl', 'uel', 'uecl'].map(k => `<button class="fb-chip ${k === v ? 'on' : ''}" data-tab="avr" data-cv="${k}">${FB_CUPS[k][1]}${s.ucup === k ? ' ⭐' : ''}</button>`).join('')}</div>`;
    h += `<h4 style="color:${FB_CUPS[v][2] === '#0b1f5c' ? '#93c5fd' : FB_CUPS[v][2]}">${FB_CUPS[v][0]}</h4>`;
    if (!s.ucup) h += `<p class="fb-note">Bu sezon Avrupa'da değiliz. Ligi ilk ${FBT.league(s.lg).euro.reduce((a, b) => a + b, 0)} içinde bitirirsen gelecek sezon Avrupa'dasın!</p>`;
    for (let st = 0; st < 4; st++) {
      const res = c.res[st];
      h += `<div class="fb-stage"><b>${FBC.STAGES[st]}</b>`;
      if (res) h += res.map(([a, b, sa, sb, pk]) => `<div class="fb-tie ${a === C.club || b === C.club ? 'me' : ''}"><span class="${(sa > sb || pk === 'a') ? 'w' : ''}">${FBT.badge(FBT.team(a), 16)} ${esc(FBT.team(a).name)}</span><b>${sa}-${sb}${pk ? ' (p)' : ''}</b><span class="${(sb > sa || pk === 'b') ? 'w' : ''}">${esc(FBT.team(b).name)} ${FBT.badge(FBT.team(b), 16)}</span></div>`).join('');
      else if (st === c.res.length) { const al = st ? c.w[st - 1] : c.t; for (let i = 0; i < al.length; i += 2) h += `<div class="fb-tie ${al[i] === C.club || al[i + 1] === C.club ? 'me' : ''}"><span>${FBT.badge(FBT.team(al[i]), 16)} ${esc(FBT.team(al[i]).name)}</span><b>vs</b><span>${esc(FBT.team(al[i + 1]).name)} ${FBT.badge(FBT.team(al[i + 1]), 16)}</span></div>`; }
      else h += '<div class="fb-mut">—</div>';
      h += '</div>';
    }
    if (c.w[3]) h += `<div class="fb-champ">🏆 Şampiyon: ${FBT.badge(FBT.team(c.w[3][0]), 24)} ${esc(FBT.team(c.w[3][0]).name)}</div>`;
    el.innerHTML = h;
    el.querySelectorAll('[data-cv]').forEach(b => b.addEventListener('click', () => { sub.cupView = b.dataset.cv; }, { capture: true }));
  }
  function tabGel(el) {
    const p = me(), last = C.s.mine.slice(-6).reverse();
    el.innerHTML = `<div class="fb-sk"><div class="fb-skh"><span>Skill Puanı · seviye ${(p.lvl || 0) + 1}</span><b>${p.skill} / ${FBC.need(p.lvl)}</b></div><div class="fb-skb"><i style="width:${p.skill / FBC.need(p.lvl) * 100}%"></i></div>
        <div class="fb-skh"><span>Gelişim hakkı</span><b class="fb-pts">${p.up}</b></div></div>` +
      FBC.ATTR.map(([k, l]) => { const c = FBC.cost(p.attr[k]); return `<div class="fb-att"><span>${l}</span><div class="fb-meter"><i style="width:${p.attr[k]}%"></i></div><b>${p.attr[k]}</b><button class="fb-btn sm ${p.up >= c && p.attr[k] < 99 ? 'pri' : ''}" data-a="up" data-k="${k}">+1 <small>${c} hak</small></button></div><p class="fb-attfx">${FBC.ATTR_FX[k]}</p>`; }).join('') +
      `<p class="fb-mut">Genel: <b>${FBC.ovr(p)}</b> · 75 üstü her artış 2 hak ister.${p.age > 30 ? ' 30 yaşından sonra hız ve fizik her sezon biraz düşer.' : ''}</p>
      <details class="fb-help"><summary>Skill Puanı nasıl kazanılır?</summary><div class="fb-tip">Maç sonundaki reytingine göre: Çok kötü (5.3 altı) −10/−15 · Kötü (6.0 altı) −5 · Ortalama +5 · İyi (6.9+) +10 · Çok iyi (7.8+) +15 · <b>Maçın oyuncusu (MVP) +25 bonus</b>.<br>Her eşik = <b>3 gelişim hakkı</b>; ilk eşik 100 puan, sonraki her eşik <b>+5</b> puan daha fazla ister (100, 105, 110…). Artan puan sonraki eşiğe aktarılır. Reytingi goller, asistler, isabetli pas ve şutlar yükseltir; top kaybı, hatalı pas ve kaçan fırsatlar düşürür.</div></details>
      ${last.length ? `<h4>Son maçlarda kazanılan puan</h4><div class="fb-list">${last.map(m => `<div class="fb-li"><span class="grow">${esc(FBT.team(m.opp).name)}<small>${esc(m.comp)}</small></span>${m.mvp ? '<span title="MVP">🏅</span>' : ''}<span class="fb-r">${m.r.toFixed(1)}</span><b class="${m.d >= 0 ? 'fb-up' : 'fb-dn'}">${m.d >= 0 ? '+' : ''}${m.d ?? ''}</b></div>`).join('')}</div>` : ''}`;
  }
  const NCAT = { mac: ['Maç', '#22c55e', 'ball'], oyuncu: ['Futbolcu', '#eab308', 'shirt'], takim: ['Takım', '#3b82f6', 'shield'], avrupa: ['Avrupa', '#a855f7', 'cup'], dunya: ['Dünya', '#06b6d4', 'globe'], magazin: ['Magazin', '#f472b6', 'mic'] };
  function newsCard(n, small, lead) {
    const [lab0, col, icn] = NCAT[n.cat] || ['Haber', '#888', 'news'], lab = ico(icn) + ' ' + lab0, when = `${n.y}-${String(n.y + 1).slice(2)} · ${n.w ? n.w + '. hafta' : 'sezon başı'}`;
    if (n.potm && !small) return `<div class="fb-nw potm"><div class="fb-nwt"><span style="background:${col}">🌟 Ayın Oyuncusu · ${esc(n.potm.mn)}</span><small>${when}</small></div><b class="fb-nwh">${esc(n.h)}</b>
      <div class="fb-pod">${n.potm.top.map((x, i) => `<div class="pd${i} ${x.me ? 'me' : ''}"><em>${['🥇', '🥈', '🥉'][i]}</em>${FBT.badge(FBT.team(x.club), 26)}<b>${esc(x.name)}</b><small>${esc(FBT.team(x.club).abbr)} · ${x.g} gol · ${x.a} asist</small></div>`).join('')}</div></div>`;
    return `<div class="fb-nw p${n.pri} ${small ? 'sm' : ''} ${lead ? 'lead' : ''}" style="--nc:${col}"><div class="fb-nwt"><span style="background:${col}">${lab}</span><small>${when}</small></div><b class="fb-nwh">${esc(n.h)}</b>${small ? '' : `<p>${esc(n.b || '')}</p>`}</div>`;
  }
  function tabHab(el) {
    const v = sub.habView || 'all', F = (C.feed || []).filter(n => v === 'all' || n.cat === v);
    el.innerHTML = `<div class="fb-chips scroll">${[['all', 'Tümü', 'grid']].concat(Object.entries(NCAT).map(([k, [l, , i]]) => [k, l, i])).map(([k, l, i]) => `<button class="fb-chip ${k === v ? 'on' : ''}" data-hab="${k}">${ico(i)} ${l}</button>`).join('')}</div>
      <div class="fb-news2">${F.map((n, i) => newsCard(n, false, i === 0 && !n.potm)).join('') || '<p class="fb-mut">Henüz haber yok. Maçlar oynandıkça futbol dünyası hareketlenecek.</p>'}</div>`;
    el.querySelectorAll('[data-hab]').forEach(b => b.onclick = () => { sub.habView = b.dataset.hab; FBA.play('ui'); renderHub(); });
  }
  function kingCard() {
    ensureStats(); const g = leaders(1)[0], a = leaders(2)[0], gr = myRank(1), ar = myRank(2);
    if (!g && !gr) return '';
    const nm = x => { const w = who(x.k); return `${w.me ? '<b>Sen</b>' : esc(w.name)} <small>${esc(FBT.team(w.club).abbr)}</small>`; };
    return `<button class="fb-king" data-tab="ist"><div><span>👟 Gol krallığı</span><b>${gr ? gr.r + '.' : '—'}</b><small>${gr ? gr.v + ' gol' : 'henüz gol yok'}${g ? ` · lider ${nm(g)} ${g.v}` : ''}</small></div><div><span>🎯 Asist krallığı</span><b>${ar ? ar.r + '.' : '—'}</b><small>${ar ? ar.v + ' asist' : 'henüz asist yok'}${a ? ` · lider ${nm(a)} ${a.v}` : ''}</small></div></button>`;
  }
  // League statistics: scorers, assists, contributions, appearances, team records
  function tabIst(el) {
    ensureStats();
    const lgv = viewLg(), mineLg = lgv === C.s.lg, v = sub.istView || 'g', L = FBT.league(lgv);
    const chips = [['g', '👟 Gol Krallığı'], ['a', '🎯 Asist Krallığı'], ['ga', '⚡ Gol + Asist'], ['m', '🏃 Maç'], ['t', '🛡️ Takımlar']];
    let h = `${lgSelect(lgv)}<p class="fb-mut">${C.s.year}-${String(C.s.year + 1).slice(2)} · ${C.s.res.filter(Boolean).length}. hafta sonrası</p><div class="fb-chips">${chips.map(([k, l]) => `<button class="fb-chip ${k === v ? 'on' : ''}" data-ist="${k}">${l}</button>`).join('')}</div>`;
    if (v === 't') {
      const tab = tabOf(lgv), ord = FBC.order(tab), mi2 = mineLg ? myIdx() : -1;
      h += `<table class="fb-tbl"><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AG</th><th>YG</th><th>P</th></tr>${ord.map((i, k) => { const r = tab[i], t = FBT.team(lgv + ':' + i); return `<tr class="${i === mi2 ? 'me' : ''}"><td>${k + 1}</td><td class="l">${FBT.badge(t, 16)} ${esc(t.name)}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td><b>${r[1] * 3 + r[2]}</b></td></tr>`; }).join('')}</table>`;
      const most = ord.slice().sort((a, b) => tab[b][4] - tab[a][4])[0], best = ord.slice().sort((a, b) => tab[a][5] - tab[b][5])[0];
      if (tab.some(r => r[0])) h += `<div class="fb-tip">⚽ En golcü takım: <b>${esc(FBT.team(lgv + ':' + most).name)}</b> (${tab[most][4]}) · 🧱 En az gol yiyen: <b>${esc(FBT.team(lgv + ':' + best).name)}</b> (${tab[best][5]})</div>`;
      el.innerHTML = h; bindIst(el); return;
    }
    const idx = { g: 1, a: 2, ga: 3, m: 0 }[v], unit = { g: 'gol', a: 'asist', ga: 'G+A', m: 'maç' }[v], list = leaders(idx, lgv), top = list.slice(0, 20), mi = list.findIndex(x => x.k === 'ME');
    const row = (x, i) => { const w = who(x.k), t = FBT.team(w.club); return `<div class="fb-li ${w.me ? 'me' : ''}"><span class="fb-rk ${i < 3 ? 'm' + i : ''}">${i + 1}</span>${FBT.badge(t, 20)}<span class="grow">${esc(w.name)}${w.me ? ' ⭐' : ''}<small>${esc(t.name)} · ${x.apps} maç${v !== 'g' ? ` · ${x.g} gol` : ''}${v !== 'a' ? ` · ${x.a} asist` : ''}</small></span><b class="fb-kv">${x.v}</b></div>`; };
    h += top.length ? `<div class="fb-list">${top.map(row).join('')}${mi >= 20 ? `<div class="fb-sep">…</div>${row(list[mi], mi)}` : ''}</div>` : '<p class="fb-mut">Sezon başlayınca istatistikler burada görünecek.</p>';
    h += `<p class="fb-mut">${mi >= 0 ? `Senin sıran: <b>${mi + 1}.</b> (${list[mi].v} ${unit})` : `Henüz bu listede değilsin.`}</p>`;
    el.innerHTML = h; bindIst(el);
  }
  function bindIst(el) { el.querySelectorAll('[data-ist]').forEach(b => b.onclick = () => { sub.istView = b.dataset.ist; FBA.play('ui'); renderHub(); }); }
  function tabKar(el) {
    const t = C.tot, H = C.hist.slice().reverse();
    const s = C.s, cur = !C.phase && s.my.apps ? (() => { const tt = club(), pos = FBC.order(s.tab).indexOf(myIdx()) + 1; return `<div class="fb-li now">${FBT.badge(tt, 20)}<span class="grow">${s.year}-${String(s.year + 1).slice(2)} · ${esc(tt.name)}<small>Devam ediyor · ${s.res.filter(Boolean).length}. hafta · lig ${pos}.</small></span><b>${s.my.g}G ${s.my.a}A</b><span class="fb-r">${(s.my.rs / s.my.apps).toFixed(2)}</span></div>`; })() : '';
    el.innerHTML = `<div class="fb-stats k3"><div><b>${t.apps}</b><small>Maç</small></div><div><b>${t.g}</b><small>Gol</small></div><div><b>${t.a}</b><small>Asist</small></div><div><b>${t.apps ? (t.rs / t.apps).toFixed(2) : '-'}</b><small>Ort.</small></div><div><b>${C.tro.length}</b><small>Kupa</small></div><div><b>${C.tot.far ? C.tot.far + ' m' : '-'}</b><small>En uzak gol</small></div></div>
      <h4>Kupalar</h4><div class="fb-tro">${C.tro.map(x => `<div><span>${x.ic}</span><b>${esc(x.n)}</b><small>${x.y}-${String(x.y + 1).slice(2)}</small></div>`).join('') || '<p class="fb-mut">Henüz kupa yok — ilkini kazan!</p>'}</div>
      <h4>Sezonlar</h4><div class="fb-list">${cur}${H.map(h => { const tt = FBT.team(h.club); return `<div class="fb-li">${FBT.badge(tt, 20)}<span class="grow">${h.y}-${String(h.y + 1).slice(2)} · ${esc(tt.name)}<small>Lig ${h.pos}. · ${h.apps} maç${h.gr ? ` · gol krallığı ${h.gr}.` : ''}${h.ar ? ` · asist ${h.ar}.` : ''}</small></span><b>${h.g}G ${h.a}A</b><span class="fb-r">${h.avg.toFixed(2)}</span></div>`; }).join('') || (cur ? '' : '<p class="fb-mut">İlk sezonun devam ediyor.</p>')}</div>`;
  }
  function tabAyr(el) {
    el.innerHTML = `<h4>Ses</h4><div class="fb-vol">${[['master', 'Genel ses'], ['sfx', 'Efektler (vuruş, düdük)'], ['crowd', 'Tribün ve tezahürat']].map(([k, l]) => `<label>${l}<input type="range" data-v="${k}" min="0" max="100" value="${Math.round(FBA.vol[k] * 100)}"></label>`).join('')}${navigator.vibrate ? `<label class="fb-hap">Titreşim<input type="checkbox" data-v="hap" ${FBA.vol.hap ? 'checked' : ''}></label>` : ''}</div>
      <h4>Maç kamerası</h4><p class="fb-mut">Maçta iki parmakla (pinch) da yakınlaştırıp uzaklaştırabilirsin. Şut hazırlığındaki topun arkası kamerası değişmez.</p><div class="fb-vol"><label>Uzak ↔ Yakın<input type="range" data-zoom="1" min="60" max="170" value="${Math.round((C.set.zoom || 1) * 100)}"></label></div>
      <h4>Maç akış hızı</h4><p class="fb-mut">Senin pozisyonların arasında saatin ne kadar hızlı aktığını belirler.</p><div class="fb-chips">${[[180, 'Hızlı akış'], [270, 'Normal akış'], [420, 'Yavaş akış']].map(([v, l]) => `<button class="fb-chip ${C.set.len === v ? 'on' : ''}" data-a="len" data-v="${v}">${l}</button>`).join('')}</div>
      <h4>Kayıt</h4><p class="fb-mut">Kayıt ${slot + 1} · son kayıt ${new Date(C.updated || Date.now()).toLocaleTimeString('tr-TR')}. Otomatik kayıt: her maç, gelişim, transfer ve uygulamadan çıkışta.</p>
      <div class="fb-row"><button class="fb-btn pri" data-a="save">💾 Şimdi kaydet</button><button class="fb-btn ghost" data-a="slots">Kariyer seçimi</button>${window.goMenu ? '<button class="fb-btn ghost" data-a="menu">Ana menü</button>' : ''}</div>
      <h4>Kayıt yedeği (JSON)</h4><p class="fb-mut">Kariyerini dosya olarak indir; başka bir cihaza, tarayıcıya veya oyunun yüklü (PWA) sürümüne taşı. İçe aktarma bu kayıt yuvasındaki kariyerin üzerine yazar.</p>
      <div class="fb-row"><button class="fb-btn ghost" data-a="exp">⬇️ Dışa aktar</button><button class="fb-btn ghost" data-a="imp">⬆️ İçe aktar</button></div>
      <h4>Eğitim</h4><p class="fb-mut">Şut, pas, top sürme ve savunma derslerini istediğin zaman tekrar oynayabilirsin.</p><div class="fb-row"><button class="fb-btn ghost" data-a="tut">🎓 Eğitimi tekrar oyna</button></div>
      <p class="fb-note">Kulüp ve lig isimleri gerçektir; oyuncu isimleri ülkelere göre üretilir. Veriler fb_data bölümünden kolayca güncellenebilir.</p>`;
  }
  // Collapse repeated awards (e.g. several player-of-the-month titles) into one card with a count
  function groupTro(list) { const g = []; list.forEach(t => { const n = t.n.startsWith('Ayın Oyuncusu') ? 'Ayın Oyuncusu' : t.n, o = g.find(x => x.n === n); if (o) o.k++; else g.push({ ic: t.ic, n, k: 1 }); }); return g; }
  // Season review: hero with the final position, balanced stat grid, award cards and clearly separated transfer offers
  function renderSeasonEnd() {
    const s = C.s, h = C.hist[C.hist.length - 1], p = me(), retire = C.phase === 'retire', t = club(), L = FBT.league(s.lg);
    const ord = FBC.order(s.tab), champ = FBT.team(s.lg + ':' + ord[0]), mine = C.tro.filter(x => x.y === s.year), yr = `${s.year}-${String(s.year + 1).slice(2)}`;
    if (!sub.fanfared) { sub.fanfared = true; FBA.play(mine.length ? 'fanfare' : 'confirm'); if (mine.length && window.JUICE) JUICE.confetti(); }
    const potm = (s.potm || []).filter(x => x.lg === s.lg).sort((a, b) => a.mi - b.mi), kg = h.kings || {};
    const king = (ic, ttl, k, unit, rank, myv) => k ? `<div class="se-aw ${rank === 1 ? 'me' : ''}"><span class="se-awi">${ic}</span><div class="se-awb"><small>${ttl}</small><b>${rank === 1 ? 'SEN!' : esc(k.n)}</b><span>${FBT.badge(FBT.team(k.c), 16)} ${esc(FBT.team(k.c).abbr)} · ${k.v} ${unit}</span>${rank && rank > 1 ? `<em>Sen ${rank}. · ${myv} ${unit}</em>` : ''}</div></div>` : '';
    const st = (v, l, cls = '') => `<div class="${cls}"><b>${v}</b><small>${l}</small></div>`;
    let x = `<div class="fb-se2">
      <div class="se-hero">${FBT.badge(t, 54)}<div><small>${L.flag} ${esc(L.name)} · ${yr}</small><h2>Sezon tamamlandı</h2><span>${esc(t.name)} ligi <b>${h.pos}.</b> sırada bitirdi</span></div><div class="se-pos ${h.pos === 1 ? 'gold' : h.pos <= 4 ? 'top' : ''}"><b>${h.pos}</b><small>SIRA</small></div></div>
      <div class="se-grid">${st(h.apps, 'Maç')}${st(h.g, 'Gol', h.g ? 'hi' : '')}${st(h.a, 'Asist', h.a ? 'hi' : '')}${st(h.avg ? h.avg.toFixed(2) : '-', 'Ort. reyting', h.avg >= 7.5 ? 'hi' : '')}${st(s.my.motm || 0, 'Maçın adamı')}${st(mine.length, 'Kupa / ödül')}</div>
      <h4 class="se-h">🏅 Ödüller</h4>
      <div class="se-aws"><div class="se-aw ${ord[0] === myIdx() ? 'me' : ''}"><span class="se-awi">🏆</span><div class="se-awb"><small>Şampiyon</small><b>${esc(champ.name)}</b><span>${FBT.badge(champ, 16)} ${esc(L.name)}</span></div></div>
        ${king('👟', 'Gol kralı', kg.g, 'gol', h.gr, h.lgG)}${king('🎯', 'Asist kralı', kg.a, 'asist', h.ar, h.lgA)}</div>
      ${potm.length ? `<h4 class="se-h">🌟 Ayın oyuncuları</h4><div class="se-potm">${potm.map(m => { const w = m.top[0], me1 = w && w.me; return `<div class="${me1 ? 'me' : ''}"><small>${MONTHS[m.mi] || ''}</small>${w ? `${FBT.badge(FBT.team(w.club), 18)}<b>${me1 ? 'SEN' : esc(w.name)}</b><span>${w.g}G ${w.a}A</span>` : '—'}</div>`; }).join('')}</div>` : ''}
      ${mine.length ? `<h4 class="se-h">🏆 Bu sezon kazandıkların</h4><div class="fb-tro">${groupTro(mine).map(m => `<div><span>${m.ic}</span><b>${esc(m.n)}</b>${m.k > 1 ? `<small>×${m.k}</small>` : ''}</div>`).join('')}</div>` : ''}`;
    if (retire) x += `<div class="se-card"><h3>Futbolu bırakma zamanı</h3><p>${p.age} yaşında kariyerini noktalıyorsun: ${C.tot.apps} maç, ${C.tot.g} gol, ${C.tot.a} asist, ${C.tro.length} kupa.</p><div class="fb-row"><button class="fb-btn pri" data-a="slots">Kariyerlere dön</button><button class="fb-btn ghost" data-a="one">Bir sezon daha oyna</button></div></div>`;
    else x += `<h4 class="se-h">✍️ Transfer dönemi</h4>${C.offers.length ? `<p class="fb-mut se-sub">Performansını beğenen ${C.offers.length} kulüp teklif gönderdi:</p><div class="se-offs">${C.offers.map(id => { const o = FBT.team(id); return `<button class="se-off" data-a="sign" data-v="${id}" style="--c1:${o.c1};--c2:${o.c2}">${FBT.badge(o, 40)}<span class="se-ofi"><b>${esc(o.name)}</b><small>${o.lg.flag} ${esc(o.lg.name)}</small><i><u style="width:${Math.round(FBU.clamp((o.r - 55) / 35, .08, 1) * 100)}%"></u></i><small>Takım gücü ${o.r}${o.r > t.r ? ` · <em class="fb-up">+${o.r - t.r}</em>` : o.r < t.r ? ` · <em class="fb-dn">${o.r - t.r}</em>` : ''}</small></span><strong>İmzala ›</strong></button>`; }).join('')}</div>` : '<p class="fb-mut se-sub">Bu yaz teklif gelmedi. Reytingini yükselt, gol ve asist üret!</p>'}
        <button class="fb-btn ${C.offers.length ? 'ghost' : 'pri'} big" data-a="stay">${esc(FBU.ek(t.name, 'loc'))} kal ›</button>`;
    main.innerHTML = x + '</div>';
    main.onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'sign') { sub.fanfared = false; startNext(b.dataset.v); } else if (a === 'stay' || a === 'one') { sub.fanfared = false; FBA.play('confirm'); startNext(null); } else if (a === 'slots') { save(); show('title'); }
    };
  }

  /* ---------- Pre-match, match, post-match ---------- */
  function renderPre() {
    const f = sub.fix, p = me(), role = FBC.ROLE_OF[p.pos];
    // One ordered pair (home first) drives the header and both line-ups, so a side never shows the other club's XI
    const sides = (f.home ? [C.club, f.opp] : [f.opp, C.club]).map(id => ({ id, t: FBT.team(id), mine: id === C.club }));
    const xi = sd => FBT.squad(sd.id).map(x => { const m = sd.mine && x.role === role, num = m ? p.num : (sd.mine && x.num === p.num ? 13 : x.num); return `<div class="${m ? 'me' : ''}"><i>${num}</i>${esc(m ? p.short : x.short)}</div>`; }).join('');
    main.innerHTML = `<div class="fb-pre"><div class="fb-nc">${esc(f.comp)}</div><div class="fb-vs">${sides.map((sd, i) => `${i ? '<b>VS</b>' : ''}<div>${FBT.badge(sd.t, 54)}<span>${esc(sd.t.name)}</span><small class="fb-ha">${i ? 'Deplasman' : 'Ev sahibi'}${sd.mine ? ' · senin takımın' : ''}</small></div>`).join('')}</div>
      <div class="fb-xis">${sides.map(sd => `<div class="fb-xi ${sd.mine ? 'mine' : ''}" style="--c:${sd.t.c1}"><h5>${FBT.badge(sd.t, 16)} ${esc(sd.t.abbr)}</h5>${xi(sd)}</div>`).join('')}</div>
      <div class="fb-tip"><b>Nasıl oynanır?</b><br>Maç hızlı akar, diğer pozisyonlar yorumla özetlenir. Top sana gelmeden hemen önce saha açılır ve sıra sende. Topu göndermek istediğin yönün <b>tersine çek</b>, bırak; sonra topun neresine vuracağını seç. <b>Dokun</b> = kısa top sürme. <b>Savunmada</b> basılı tutup rakibin önüne geç, halka yeşilken topa doğru <b>hızlıca kaydır</b>. Ayarlar'dan eğitimi tekrar oynayabilirsin.</div>
      <button class="fb-btn pri big" data-a="go">⚽ Başlama düdüğü</button></div>`;
    main.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.a === 'go') { FBA.play('confirm'); C.live = { min: 0, sc: [0, 0], us: {}, rating: 6, log: [], wk: C.s.wk }; save(true); startMatch(f, null); } };
  }
  function startMatch(f, resume) {
    view = 'match'; top.hidden = true; main.innerHTML = ''; main.onclick = null;
    const wrap = document.createElement('div'); wrap.className = 'fb-mw'; root.appendChild(wrap);
    const p = me();
    if (!C.live) C.live = { min: 0, sc: [0, 0], us: {}, rating: 6, log: [], wk: C.s.wk };
    let lastSave = 0;
    match = FBMatch(wrap, {
      my: club(), opp: FBT.team(f.opp), home: f.home, comp: f.comp, len: C.set.len, zoom: C.set.zoom || 1, onZoom(z) { C.set.zoom = Math.round(z * 100) / 100; }, resume: resume && resume.min > 0 ? resume : null,
      user: { name: p.first + ' ' + p.last, short: p.short, num: p.num, pos: p.pos, attr: p.attr, look: p.look },
      onLive(s) { Object.assign(C.live, s); const n = Date.now(); if (n - lastSave > 1500) { lastSave = n; save(true); } },
      onEnd(res) { wrap.remove(); match = null; applyResult(f, res); show('post'); }
    });
    // Periodic snapshot (every ~10 match minutes) for crash recovery
    const iv = setInterval(() => { if (!match || dead) return clearInterval(iv); const s = match._st; if (!s.ended && s.mode === 'play') { Object.assign(C.live, { min: s.min, sc: s.sc.slice(), us: { ...s.us }, rating: s.rating, log: s.log.slice() }); save(true); } }, 6000);
    const d0 = match.destroy; match.destroy = () => { clearInterval(iv); d0(); wrap.remove(); };
  }
  // Post-match booth: invented pundits; lines picked from pools by what really happened
  const CM_POOL = {
    hat: ['HAT-TRICK! {nm} bu akşam fileleri bir eve çevirdi, {opp} kapıyı kilitlemeyi unuttu!', 'Üç gol! {nm} maç topunu eve götürüyor, belki bir de çerçeveletir.', '{nm} bugün golü ekmek gibi dağıttı: üç tane!'],
    far: ['{far} metre! Ben bu mesafeden ancak uzaktan kumandayla gol atarım!', '{far} metreden o gol... Kaleci hâlâ topun nereden geldiğini arıyor.', 'Bu golü ölçmek için cetvel değil, GPS lazım: {far} metre!', '{far} metreden füze! Ağlar sigortalı mıydı acaba?'],
    mvp: ['Maçın adamı tartışmasız {nm}. Sahada bir tek o var gibiydi!', '{nm} bugün sahayı kendi bahçesi sandı, MVP sonuna kadar hak edilmiş.', 'Kamera {nm_abl} ayrılmadı, haklıydı da. Maçın yıldızı o.', '{nm} öyle oynadı ki rakip hocası bile alkışladı.'],
    miss: ['{n} net fırsat... Direkler bugün {nm_dat} küsmüş olmalı!', '{nm} o pozisyonları kaçırınca tribündeki teyzeler bile "ah" dedi.', '{n} fırsat, sıfır gol. {nm} bu akşam kaleyi biraz daha küçük görmüş.', 'Bu kadar fırsatı kaçırmak da yetenek ister, {nm} bugün o yeteneği gösterdi.'],
    err: ['{nm_gen} o pası hâlâ rüyamda... Rakibe altın tepside gol.', 'Savunmada top kaybı affetmez; {nm} bunu bugün acı şekilde öğrendi.'],
    vgood: ['Çok olgun bir maç. {nm} böyle oynarsa büyük kulüpler kapıda sıraya girer.', 'Topla da topsuz da harikaydı. {nm} bu sezonun yükselen yıldızı.', '{nm} bugün sahada orkestra şefiydi.'],
    good: ['{nm} işini yaptı, sakin ve etkiliydi.', 'Göze batmadı ama hep doğru yerdeydi; hoca bunu sever.', 'Temiz, hatasız bir maç. {nm} takımın güvencesi.'],
    avg: ['Vasat bir gece. Ne kötü dersin ne iyi; {nm} daha fazlasını gösterebilir.', '{nm} bugün "ortalama" kelimesinin sözlükteki karşılığıydı.', 'Ne sıcak ne soğuk... {nm} ılık bir performans sergiledi.'],
    bad: ['Açık konuşayım: {nm} bu maçta kayıptı. Antrenmanda biraz daha ter dökmeli.', 'Top kayıpları, hatalı paslar... {nm} için unutulması gereken bir akşam.', '{nm} sahadaydı ama sanki maçı tribünden izledi.', 'Bu performansla {nm} yedek kulübesinin yolunu öğrenebilir.'],
    win: ['Üç puan cebe, gözler bir sonraki maçta.', 'Kazanmak alışkanlıktır, bu takım o alışkanlığı ediniyor.', 'Skor tabelası her şeyi söylüyor: hak edilmiş galibiyet.'],
    draw: ['Bir puan da puandır ama bu maçtan daha fazlası çıkabilirdi.', 'Beraberlik kimseyi tam mutlu etmedi; iki takım da yarım kaldı.'],
    loss: ['Bugün olmadı. Soyunma odasında uzun bir video analizi bekliyor.', 'Mağlubiyetten ders çıkarılırsa bu maç da bir şey öğretir.'],
    big: ['{a}-{b}... Soyunma odasında bu akşam çay değil fırça içilir.', 'Bu skor bir maç değil, bir uyarı. Savunma hattı baştan düşünülmeli.'],
    upset: ['Kâğıt üstünde favoriydik ama futbol kâğıtta oynanmıyor. Hücum ile savunma arasındaki mesafe çok açıktı.', 'Rakip kompakt kaldı, biz top tuttuk ama tehlike üretemedik. Kanat bindirmeleri yoktu, ceza sahası boştu.', 'Bu mağlubiyetin adı taktiksel: önde baskı yapamadık, arkada boşluk verdik.'],
    derbyW: ['Derbi kazanılır, tartışılmaz! Şehrin bu hafta tek bir rengi var.', 'Derbilerde form tutmaz derler; bugün tutan tek şey bu takımın yüreğiydi.'],
    derbyL: ['Derbi kaybetmek bir haftalık değil, bir aylık acıdır.', 'Derbide ezik görüntü... Taraftar bunu kolay unutmaz.'],
    derbyD: ['Derbide kazanan yok ama gerginlik bol. Tribünler 90 dakika susmadı.'],
    euroW: ['Avrupa gecesinde dik duran bir takım! Ülke puanına da katkı.', 'Avrupa\'da böyle maçlar oynanır: cesur, akıllı, kararlı.'],
    euroL: ['Avrupa\'nın havası başka; bu seviyede tek hata ceza demek.', 'Avrupa sahnesi affetmiyor. Tecrübe kazanıldı ama bilet kaçtı.'],
    open: ['Ve son düdük! {opp} karşısında heyecanlı bir 90 dakika geride kaldı.', 'Tribünler doldu, nefesler tutuldu, maç bitti!', 'İşte böyle sevgili seyirciler, perde iniyor!']
  };
  function commentary(L) {
    const { res, mvp, band, f, win, pen } = L, us = res.us, n = k => us[k] || 0, p = me(), far = (us.gd || []).length ? Math.max(...us.gd) : 0;
    const draw = res.sc[0] === res.sc[1] && !pen, big = res.sc[1] - res.sc[0] >= 3, derby = derbyOf(C.club, f.opp), euro = f.e.k === 'E', upset = !win && !draw && club().r - FBT.team(f.opp).r >= 7;
    const fill = t => t.replace(/\{nm_dat\}/g, FBU.ek(p.short, 'dat')).replace(/\{nm_gen\}/g, FBU.ek(p.short, 'gen')).replace(/\{nm_abl\}/g, FBU.ek(p.short, 'abl')).replace(/\{nm\}/g, p.short).replace(/\{opp\}/g, FBT.team(f.opp).name).replace(/\{far\}/g, far).replace(/\{n\}/g, n('miss')).replace(/\{a\}/g, res.sc[1]).replace(/\{b\}/g, res.sc[0]);
    const A1 = [], B1 = [];
    if (n('g') >= 3) A1.push('hat'); else if (far >= 20) A1.push('far');
    if (mvp) A1.push('mvp');
    if (n('err')) A1.push('err'); else if (n('miss') >= 2) A1.push('miss');
    if (derby) B1.push(win ? 'derbyW' : draw ? 'derbyD' : 'derbyL');
    else if (euro) B1.push(win ? 'euroW' : 'euroL');
    else if (upset) B1.push('upset');
    B1.push(band.d >= 15 && !mvp ? 'vgood' : band.d === 10 ? 'good' : band.d === 5 ? 'avg' : band.d < 0 ? 'bad' : 'good');
    if (big) B1.unshift('big'); else if (!derby && !euro && !upset) B1.push(win ? 'win' : draw ? 'draw' : 'loss');
    if (!A1.length) A1.push('open');
    const used = new Set(), line = k => { let t, i = 0; do t = pickR(CM_POOL[k]); while (used.has(t) && i++ < 5); used.add(t); return esc(fill(t)); };
    const rows = [['Rıza Mikrofon', A1[0]], ['Hoca Taktikçi', B1[0]]];
    if (A1[1]) rows.push(['Rıza Mikrofon', A1[1]]); else if (B1[1]) rows.push(['Hoca Taktikçi', B1[1]]);
    return `<div class="fb-cm"><div class="fb-cmh">🎙️ Maç sonu yorumu${derby ? ` · ${esc(derby)}` : euro ? ' · Avrupa gecesi' : ''}</div>${rows.map(([w, k]) => `<div><b>${w}:</b> ${line(k)}</div>`).join('')}</div>`;
  }
  function renderPost() {
    const L = sub.last; if (!L) return show('hub');
    const { f, res, pen, band, mvp, best, delta, before, gained } = L, t = club(), o = FBT.team(f.opp), H = f.home ? t : o, A = f.home ? o : t, sh = f.home ? res.sc[0] : res.sc[1], sa = f.home ? res.sc[1] : res.sc[0];
    const win = L.win, draw = res.sc[0] === res.sc[1] && !pen, us = res.us, n = k => us[k] || 0, p = me();
    const rows = [['Gol', n('g')], ['Asist', n('a')], ['İsabetli pas', n('pk')], ['Şut / isabetli', `${n('sh')} / ${n('sot')}`], ['Çalım', n('dr')], ['Top kaybı', n('lost'), 1], ['Hatalı pas', n('pf'), 1], ['Kaçan büyük fırsat', n('miss'), 1]];
    let h = `<div class="fb-post ${win ? 'w' : draw ? 'd' : 'l'}"><div class="fb-nc">${esc(f.comp)}</div><div class="fb-vs"><div>${FBT.badge(H, 50)}<span>${esc(H.name)}</span></div><b class="fb-led"><span>${sh}<i>-</i>${sa}</span></b><div>${FBT.badge(A, 50)}<span>${esc(A.name)}</span></div></div>
      ${pen ? `<div class="fb-live">${pen}</div>` : ''}<h3>${win ? 'Galibiyet!' : draw ? 'Beraberlik' : 'Mağlubiyet'}</h3>
      ${res.log && res.log.length ? `<div class="fb-ev">${res.log.map(e => `<span>⚽ ${e.m}' ${esc(e.name)}${e.a ? ` <small>(${esc(e.a)})</small>` : ''} <small class="fb-gt">${esc((e.side === 0 ? t : o).abbr)}</small></span>`).join('')}</div>` : ''}
      ${(us.gd || []).length ? `<div class="fb-dist">🎯 Gollerin: ${us.gd.map(d => `<b>${d} m</b>`).join(' · ')}${us.gd.length > 1 ? ` · en uzak <b>${Math.max(...us.gd)} m</b>` : ''}</div>` : ''}
      <div class="fb-perf ${band.c}"><div><small>Maç reytingi</small><b>${us.r.toFixed(1)}</b></div><div><small>Performans</small><b>${band.l}</b></div></div>
      <div class="fb-mvp ${mvp ? 'on' : ''}">${mvp ? '🏅 <b>MAÇIN OYUNCUSU SENSİN!</b>' : `Maçın oyuncusu: <b>${esc(best.name)}</b> (${best.r.toFixed(1)})`}</div>
      <div class="fb-prow">${rows.map(([l, v, bad]) => `<div class="${bad && v ? 'bad' : ''}"><span>${l}</span><b>${v}</b></div>`).join('')}</div>
      <div class="fb-skc"><div class="fb-skl"><span>Maç performansı</span><b class="${band.d >= 0 ? 'fb-up' : 'fb-dn'}">${band.d > 0 ? '+' : ''}${band.d}</b></div>
        ${mvp ? '<div class="fb-skl"><span>🏅 MVP bonusu</span><b class="fb-up">+25</b></div>' : ''}
        <div class="fb-skl tot"><span>Skill Puanı</span><b>${before} → ${Math.max(0, before + delta)}${gained ? '' : ` / ${FBC.need(p.lvl)}`}</b></div>
        <div class="fb-skb"><i class="anim" style="--from:${before / FBC.need(p.lvl - (gained ? 1 : 0)) * 100}%;width:${gained ? 100 : p.skill / FBC.need(p.lvl) * 100}%"></i></div>
        ${gained ? `<div class="fb-gain">💪 +${gained} GELİŞİM HAKKI! <small>Kalan ${p.skill} puan aktarıldı · sonraki eşik ${FBC.need(p.lvl)} puan</small></div>` : delta < 0 ? `<div class="fb-lose">Kötü performans puan kaybettirdi.</div>` : ''}</div>`;
    if (sub.round) { const gr = myRank(1), ar = myRank(2); if (gr || ar) h += `<div class="fb-tip">👟 Gol krallığı: <b>${gr ? gr.r + '.' : '—'}</b>${gr ? ` (${gr.v})` : ''} · 🎯 Asist krallığı: <b>${ar ? ar.r + '.' : '—'}</b>${ar ? ` (${ar.v})` : ''}</div>`; }
    if (sub.round) { const L2 = FBT.league(C.s.lg); h += `<h4 class="fb-h4">Haftanın sonuçları</h4><div class="fb-res">${sub.round.map(([a, b, ga, gb]) => `<div class="${a === myIdx() || b === myIdx() ? 'me' : ''}"><span>${esc(L2.teams[a][0])}</span><b>${ga}-${gb}</b><span>${esc(L2.teams[b][0])}</span></div>`).join('')}</div>`; }
    h += commentary(L);
    h += `<button class="fb-btn pri big" data-a="ok">Devam ›</button></div>`;
    main.innerHTML = h; FBA.play(mvp || gained ? 'fanfare' : win ? 'confirm' : 'back');
    if ((mvp || gained) && window.JUICE) setTimeout(() => JUICE.confetti(), 300);
    main.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.a === 'ok') { FBA.play('ui'); sub.last = null; tab = gained ? 'gel' : 'ana'; show('hub'); } };
  }

  show('title');
  const API = {
    pause() { if (match) match.pause(); save(true); },
    destroy() { dead = true; save(true); if (match) { match.destroy(); match = null; } document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', onVis); FBA.stopCrowd(); },
    // test hooks
    get _C() { return C; }, get _match() { return match; }, _show: show, _fns: { nextFix, simUser, applyResult, seasonEnd, startNext }
  };
  if (window.__dbg) window.__fb = API;
  return API;
}
