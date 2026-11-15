/* ===================== GOALBOUND — match engine (NSS-style flow) =====================
   Flow: the clock races in "ticker" mode with a commentary feed; the pitch is only played out
   for the build-up right before the ball reaches the user and for the user's own moment.
   Ball model: exactly one of { own (at a player's feet) | fl (scripted pass flight) | phys (free physics) }. */
// o = { my, opp, home, comp, user {name, short, num, pos, attr, look}, len, resume, onEnd(res), onLive(state) }
function FBMatch(host, o) {
  const { clamp, lerp } = FBU, U = o.user, A = U.attr, R = Math.random;
  const PW = 68, PL = 105, GX0 = 30.34, GX1 = 37.66, GH = 2.44, FOOT = .45;
  host.innerHTML = `<div class="fbm"><canvas class="fbm-cv"></canvas>
    <div class="fbm-sb"><div class="fbm-t"></div><div class="fbm-sc">0 - 0</div><div class="fbm-t"></div><div class="fbm-min">0'</div></div>
    <div class="fbm-sub"><span class="fbm-comp"></span><span class="fbm-rt">⭐ 6.0</span></div>
    <button class="fbm-pause" aria-label="Mola">⏸</button>
    <div class="fbm-tick on"><div class="fbm-clock">0'</div><div class="fbm-tl">⏩ Maç akıyor</div><div class="fbm-feed"></div><button class="fbm-ff">⏭ Sıradaki pozisyona geç</button></div>
    <div class="fbm-ban" hidden></div><div class="fbm-pop"></div>
    <div class="fbm-mom" hidden><div class="fbm-mt"></div><div class="fbm-bar"><i></i></div><div class="fbm-hint"></div>
      </div>
    <div class="fbm-shot" hidden><div class="fbm-sh-l"><div class="fbm-sh-t">Topun neresine vuracaksın?</div><div class="fbm-sh-fx"></div><div class="fbm-sh-pw"></div><button class="fbm-sh-back">↩ Nişana dön</button></div>
      <div class="fbm-sball"><div class="fbm-sb-ball"><i></i></div><span class="sb-t">Alçak · sert</span><span class="sb-b">Aşırt · yüksek</span><span class="sb-l">Sağa<br>falso</span><span class="sb-r">Sola<br>falso</span></div>
      <button class="fbm-sh-go">⚽ VUR</button></div>
    <div class="fbm-ov" hidden><div class="fbm-card"></div></div></div>`;
  const $ = s => host.querySelector(s), cv = $('.fbm-cv'), cx = cv.getContext('2d');
  const sbT = host.querySelectorAll('.fbm-t'), sbSc = $('.fbm-sc'), sbMin = $('.fbm-min'), rtEl = $('.fbm-rt'), banEl = $('.fbm-ban'), popEl = $('.fbm-pop'), momEl = $('.fbm-mom'), ovEl = $('.fbm-ov'), card = $('.fbm-card');
  const tickEl = $('.fbm-tick'), clockEl = $('.fbm-clock'), feedEl = $('.fbm-feed'), tlEl = $('.fbm-tl'), ffBtn = $('.fbm-ff');
  const homeT = o.home ? o.my : o.opp, awayT = o.home ? o.opp : o.my;
  sbT[0].innerHTML = FBT.badge(homeT, 22) + `<b>${FBU.esc(homeT.abbr)}</b>`; sbT[1].innerHTML = `<b>${FBU.esc(awayT.abbr)}</b>` + FBT.badge(awayT, 22);
  $('.fbm-comp').textContent = o.comp;
  // Kit clash: away side switches to its secondary colour
  const dist = (a, b) => { const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], x = p(a), y = p(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
  const kitMy = { c1: o.my.c1, c2: o.my.c2 }, kitOp = { c1: o.opp.c1, c2: o.opp.c2 };
  if (dist(kitMy.c1, kitOp.c1) < 110) { if (o.home) Object.assign(kitOp, { c1: o.opp.c2 === o.opp.c1 ? '#ffffff' : o.opp.c2, c2: o.opp.c1 }); else Object.assign(kitMy, { c1: o.my.c2 === o.my.c1 ? '#ffffff' : o.my.c2, c2: o.my.c1 }); }
  if (dist(kitMy.c1, kitOp.c1) < 90) kitOp.c1 = '#f2f2f2';

  /* ---------- Players (team 0 = us, attacking towards y = 0) ---------- */
  const ANCH = { GK: [34, 101], LB: [9, 82], LCB: [25, 88], RCB: [43, 88], RB: [59, 82], LCM: [20, 68], CM: [34, 72], RCM: [48, 68], LW: [11, 50], ST: [34, 46], RW: [57, 50] };
  const userRole = { FW: 'ST', W: 'RW', AM: 'RCM', CM: 'CM', DF: 'RCB' }[U.pos];
  const mkTeam = (t, side) => FBT.squad(t.id).map(sp => ({ ...sp, team: side, x: 0, y: 0, vx: 0, vy: 0, ph: Math.random() * 6, face: side ? Math.PI / 2 : -Math.PI / 2, st: 'run', stT: 0, user: false, lane: null }));
  const T0 = mkTeam(o.my, 0), T1 = mkTeam(o.opp, 1);
  const me = T0.find(p => p.role === userRole);
  Object.assign(me, { name: U.name, short: U.short, user: true });
  T0.forEach(p => { if (p !== me && p.num === U.num) p.num = [13, 16, 18, 24, 25, 26, 28, 30][(Math.random() * 8) | 0]; }); me.num = U.num;
  const ALL = [...T0, ...T1], GK0 = T0[0], GK1 = T1[0];
  const anchor = p => { const a = ANCH[p.role]; return p.team === 0 ? a : [PW - a[0], PL - a[1]]; };
  // Formation position given where the ball is (team 0 attacking)
  function formTarget(p, bx, by, att = 0) {
    const a = anchor(p), fwd = p.team ? 1 : -1, atk = p.team === att;
    if (p.role === 'GK') return p.team ? [34 + (bx - 34) * .12, clamp(1 + Math.hypot(bx - 34, by) / 9, 1, 4.5)] : [34 + (bx - 34) * .1, PL - 1.5];
    return [clamp(a[0] + (bx - 34) * .3, 2, 66), clamp(a[1] + (by - 52.5) * .5 + (atk ? 7 : -3) * fwd, 3, 102)];
  }

  /* ---------- Match state ---------- */
  const st = { min: 0, half: 1, sc: [0, 0], mode: 'tick', hold: .8, ev: [], evI: 0, feed: [], shake: 0, crowdJump: 0, rating: 6, us: { g: 0, a: 0, sh: 0, sot: 0, pk: 0, pf: 0, dr: 0, lost: 0, miss: 0, wide: 0, blk: 0, post: 0 }, log: [], ended: false, paused: false, shots: [0, 0], ff: false, filler: 6, jumps: 0 };
  const ball = { x: 34, y: 52.5, z: 0, vx: 0, vy: 0, vz: 0, fl: null, phys: false, own: null, side: 0, bs: 0, inNet: false, spin: 0 };
  const minPerSec = 1080 / (o.len || 270);
  function genEvents(from, to) {
    const span = (to - from) / 90, dr = (o.my.r - o.opp.r) / 2, hm = o.home ? 1.1 : .92, aw = o.home ? .92 : 1.1;
    const lamMy = Math.max(.25, 1.25 * Math.pow(1.075, dr) * hm - .35) * span, lamOp = Math.max(.2, 1.3 * Math.pow(1.075, -dr) * aw) * span;
    const ev = [], t = () => from + 1 + R() * (to - from - 2);
    for (let i = FBU.poisson(lamMy); i > 0; i--) ev.push({ m: t(), team: 0, out: 'goal' });
    for (let i = FBU.poisson(lamOp); i > 0; i--) ev.push({ m: t(), team: 1, out: 'goal' });
    for (let i = FBU.poisson(lamMy * 2.2 + .6 * span); i > 0; i--) ev.push({ m: t(), team: 0, out: FBU.pick(['save', 'save', 'wide', 'wide', 'post']) });
    for (let i = FBU.poisson(lamOp * 2.2 + .6 * span); i > 0; i--) ev.push({ m: t(), team: 1, out: FBU.pick(['save', 'save', 'wide', 'wide', 'post']) });
    const n = Math.round(({ FW: 6, W: 6, AM: 6, CM: 5, DF: 4 }[U.pos] + R() * 2) * span);
    // now and then the ball reaches you while your team defends (defenders much more often)
    const nd = (FB_DEFN[U.pos] * .6 + R() * .8) * span;
    for (let i = 0; i < Math.floor(nd) + (R() < nd % 1 ? 1 : 0); i++) ev.push({ m: t(), team: 0, out: 'moment', type: 'def' });
    const mix = FB_MIX[U.pos];
    for (let i = 0; i < n; i++) ev.push({ m: t(), team: 0, out: 'moment', type: R() < .06 ? 'pen' : FBU.pick(mix) });   // penalties are rare
    ev.sort((a, b) => a.m - b.m);
    for (let i = 1; i < ev.length; i++) if (ev[i].m - ev[i - 1].m < 1.5) ev[i].m = Math.min(to - .3, ev[i - 1].m + 1.5);
    return ev.filter(e => e.m < to);
  }
  const TUT = o.tut ? { i: 0 } : null;   // tutorial mode: scripted lessons only, no clock / events
  if (TUT) host.firstChild.classList.add('tut');
  if (o.resume) { st.min = o.resume.min; st.sc = o.resume.sc.slice(); Object.assign(st.us, o.resume.us || {}); st.half = st.min >= 45 ? 2 : 1; st.log = o.resume.log || []; }
  st.ev = TUT ? [] : genEvents(st.min, 90);

  /* ---------- UI helpers ---------- */
  const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mm = () => Math.min(90, Math.floor(st.min) + 1);
  function pop(t, col = '#fff') { popEl.textContent = t; popEl.style.color = col; popEl.classList.remove('on'); void popEl.offsetWidth; popEl.classList.add('on'); }
  function banner(html, ms = 2200) { banEl.innerHTML = html; banEl.hidden = false; banEl.classList.remove('on'); void banEl.offsetWidth; banEl.classList.add('on'); clearTimeout(banner.t); banner.t = setTimeout(() => banEl.hidden = true, ms); }
  // Rating always derives from the real stats + current score
  function refreshRating() { const r = FBU.rate(st.us, st.sc[0], st.sc[1]); if (r !== st.rating) { rtEl.classList.toggle('dn', r < st.rating); st.rating = r; rtEl.classList.remove('bump'); void rtEl.offsetWidth; rtEl.classList.add('bump'); } rtEl.textContent = '⭐ ' + st.rating.toFixed(1); }
  function scoreUI() { const h = o.home ? st.sc[0] : st.sc[1], a = o.home ? st.sc[1] : st.sc[0]; sbSc.textContent = `${h} - ${a}`; }
  function live() { o.onLive && o.onLive({ min: st.min, sc: st.sc.slice(), us: { ...st.us }, rating: st.rating, log: st.log.slice() }); }
  function feed(t, cls = '') { st.feed.unshift({ t, cls }); st.feed.length = Math.min(st.feed.length, 6); feedEl.innerHTML = st.feed.map((f, i) => `<div class="${f.cls}${i === 0 ? ' new' : ''}">${f.t}</div>`).join(''); }
  function showTicker(on) { tickEl.classList.toggle('on', on); }

  /* ---------- Unified ball control ---------- */
  function attach(p) { ball.own = p; ball.fl = null; ball.phys = false; ball.vx = ball.vy = ball.vz = 0; ball.z = 0; }
  function moveLane(p, x1, y1, T) { p.lane = { x0: p.x, y0: p.y, x1, y1, T: Math.max(.05, T), t: 0 }; }
  // Where a player on a straight run at speed v will be after time t
  function along(p, tx, ty, v, t) { const dx = tx - p.x, dy = ty - p.y, l = Math.hypot(dx, dy); if (l < .05) return { x: p.x, y: p.y, ux: 0, uy: -1 }; const s = Math.min(l, v * t); return { x: p.x + dx / l * s, y: p.y + dy / l * s, ux: dx / l, uy: dy / l }; }
  // Lead pass: aim where the receiver's feet will be at arrival; receiver runs on a fixed lane so both meet exactly
  function pass(from, to, tx, ty, speed = 17, h = 0) {
    const sx = ball.x, sy = ball.y, rv = 6.2;
    let T = .6, P = null;
    for (let i = 0; i < 6; i++) { P = along(to, tx, ty, rv, T); const fx = P.x + P.ux * FOOT, fy = P.y + P.uy * FOOT; T = Math.max(.35, Math.hypot(fx - sx, fy - sy) / speed); }
    const ex = P.x + P.ux * FOOT, ey = P.y + P.uy * FOOT;
    moveLane(to, P.x, P.y, T); to.face = Math.atan2(P.uy, P.ux);
    from.face = Math.atan2(ey - from.y, ex - from.x); from.kick = .28; from.lane = null;
    ball.own = null; ball.phys = false; ball.fl = { x0: sx, y0: sy, x1: ex, y1: ey, h, t: 0, dur: T, to };
    FBA.play('pass');
    return T;
  }

  /* ---------- Ticker (fast-forward) ---------- */
  const SHOOTERS = t => (t ? T1 : T0).filter(p => ['ST', 'LW', 'RW', 'RCM', 'CM', 'LCM'].includes(p.role) && !p.user);
  const assistFor = (side, shooter) => R() < .72 ? FBU.pick((side ? T1 : T0).filter(p => p !== shooter && p.role !== 'GK' && !p.user)) : null;
  function simEvent(e) {
    if (e.fromFoul) feed(`🟨 ${mm()}' Faul sonrası ${FBU.esc(o.opp.abbr)} serbest vuruş kullanıyor`, 'gc');
    if (e.fromErr) feed(`⚠️ ${mm()}' Top kaybından sonra ${FBU.esc(o.opp.abbr)} hızlı çıktı!`, 'gc');
    if (e.fromMe) feed(`🚀 ${mm()}' ${FBU.esc(me.short)}'in pasıyla atak başladı!`, 'me');
    if (e.fromErr && e.out === 'goal') { st.us.err = (st.us.err || 0) + 1; }
    const side = e.team, shooter = FBU.pick(SHOOTERS(side)), tm = side ? o.opp : o.my, gk = side ? GK0 : GK1, ours = side === 0;
    const nm = `<b>${FBU.esc(shooter.short)}</b> <small>(${FBU.esc(tm.abbr)})</small>`;
    st.shots[side]++;
    if (e.out === 'goal') {
      st.sc[side]++; scoreUI(); refreshRating();
      const as = assistFor(side, shooter); st.log.push({ m: mm(), side, name: shooter.short, r: shooter.role, a: as ? as.short : null, ar: as ? as.role : null });
      feed(`⚽ ${mm()}' GOL! ${nm}${as ? ` <small>· asist ${FBU.esc(as.short)}</small>` : ''}`, ours ? 'gl' : 'gc');
      banner(`<b class="${ours ? '' : 'op'}">GOL!</b><span>${FBU.esc(shooter.name)} · ${FBU.esc(tm.name)} ${mm()}'</span>`, 1800);
      if (ours) { FBA.play('goal'); FBA.play('net'); st.crowdJump = 2; } else { FBA.play('net'); FBA.play('groan'); }
      shake(.8); st.hold = st.ff ? .5 : 1.8; live();
    } else if (e.out === 'save') { feed(`🧤 ${mm()}' ${nm} şut çekti, ${FBU.esc(gk.short)} kurtardı`); if (ours) FBA.play('ooh'); else if (!st.ff) FBA.play('clap'); st.hold = st.ff ? .1 : .5; }
    else if (e.out === 'post') { feed(`🟨 ${mm()}' ${nm} direğe nişanladı!`); FBA.play('post'); st.hold = st.ff ? .1 : .7; }
    else { feed(`↗ ${mm()}' ${nm} şutu auta gitti`); st.hold = st.ff ? .05 : .35; }
  }
  const FILL = [t => `${t.abbr} topu ayağında tutuyor`, t => `${t.abbr} kanattan geliyor`, t => `Orta sahada sert mücadele`, t => `${t.abbr} oyunu geriden kuruyor`, t => `Tribünler takımını ateşliyor`];
  function tickStep(dt) {
    if (st.hold > 0) { st.hold -= dt; return; }
    const next = st.ev[st.evI];
    let sp = minPerSec * (st.ff ? 5 : 1);
    if (!st.ff && next && next.out === 'moment' && next.m - st.min < 2) sp *= .5;   // ease in before our moment
    let target = next ? next.m : 90;
    if (st.half === 1 && target > 45) target = 45;
    const prev = st.min; st.min = Math.min(target, st.min + dt * sp);
    if ((st.filler -= st.min - prev) <= 0) { st.filler = 7 + R() * 6; feed(`${mm()}' ${FBU.pick(FILL)(R() < .55 ? o.my : o.opp)}`, 'mut'); }
    if (st.min < target) return;
    if (st.half === 1 && st.min >= 45) return halftime();
    if (next) { st.evI++; if (next.out === 'moment') enterScene(next.type); else simEvent(next); }
    else if (st.min >= 90) fulltime();
  }

  /* ---------- Scenes: build-up right before the ball reaches the user ---------- */
  let mom = null;
  const MT0 = { def: '🛡️ Topu kazandın! Hücumu başlat', thru: '🏃 Savunma arkasına koştun — ara pas geliyor!', drive: '🏃 TOPU SÜR! Hedef bölgeye ulaş' };
  const MT = { ...MT0, box: '🎯 Ceza sahasında topla buluştun!', edge: '💥 Ceza yayı önündesin', counter: '⚡ Kontra atak! Topu sür, bitir', wing: '↗️ Kanattasın — orta ya da şut', pass: '🧠 Oyunu kur — ara pasını ver', fk: '🎯 Serbest vuruş!', pen: '⚽ PENALTI!' };
  const HINT = { drive0: 'Parmağını sahada tut: oyuncun parmağına doğru koşar, top ayağında. Sarı hedefe ulaş!', def: 'Boştaki arkadaşına ileri pas ver — kötü pas rakibe tehlikeli atak verir', thru: 'Kaleciyle karşı karşıyasın: köşe ya da aşırtma', drive: 'Parmağını basılı tutup sürükle: oyuncun o yöne koşar, top ayağında ilerler', box: 'Köşeye vur — kaleci tek kişi!', edge: 'Uzaktan şut veya koşucuya pas', counter: 'Kısa sürüklemelerle ilerle, sonra vur', wing: 'Aşırt açıkken koşuculara orta', pass: 'Boşta koşan arkadaşına ara pas', fk: 'Barajı aş: orta güç + Aşırt, Falso ile kıvır', pen: 'Köşe seç, güçlü vur — kaleci tahmin edecek' };
  // Where the ball reaches the user depends on his position
  function momentSpot(type) {
    const r = R(), side = r < .5 ? -1 : 1, P = U.pos;
    if (type === 'thru') return { x: 34 + side * R() * 7, y: 14 + R() * 3 };
    if (type === 'def') { const S = { FW: [34 + side * R() * 12, 58], W: [r < .5 ? 8 + R() * 4 : 56 + R() * 4, 64], AM: [34 + side * R() * 8, 64], CM: [34 + side * R() * 8, 72], DF: [34 + side * (3 + R() * 8), 84] }[P]; return { x: S[0], y: S[1] + R() * 4 }; }
    if (type === 'drive') { const S = { DF: [34 + side * R() * 8, 62], FW: [34 + side * R() * 8, 33], W: [r < .5 ? 7 + R() * 3 : 58 + R() * 3, 36], AM: [34 + side * R() * 6, 37], CM: [34 + side * R() * 8, 50] }[P]; return { x: S[0], y: S[1] }; }
    if (type === 'counter') return { x: 34 + side * R() * 6, y: { FW: 31, W: 32, AM: 36, CM: 42, DF: 50 }[P] + R() * 3 };
    if (type === 'pass') return { x: 34 + side * R() * 6, y: P === 'DF' ? 58 + R() * 6 : P === 'CM' ? 42 + R() * 6 : 32 + R() * 4 };
    return { box: { x: 34 + side * (4 + R() * 9), y: 13 + R() * 5 }, edge: { x: 34 + side * R() * 9, y: 24 + R() * 4 }, counter: { x: 34 + side * R() * 6, y: 42 }, wing: { x: r < .5 ? 7 + R() * 3 : 58 + R() * 3, y: 20 + R() * 6 }, pass: { x: 34 + side * R() * 6, y: 44 + R() * 4 }, fk: { x: 34 + side * (R() * 12), y: 20 + R() * 8 }, pen: { x: 34, y: 11 } }[type];
  }
  function resetActors() { ALL.forEach(p => { p.lane = null; p.run = null; p.wall = false; p.jump = false; p.stun = 0; p.dive = null; p.dived = false; p.st = 'run'; p.vx = p.vy = 0; p.cool = 0; p.react = null; p.err = null; p.side = 0; p.missed = false; p.slide = null; }); ball.inNet = false; ball.side = ball.bs = 0; }
  // Push opponents out of a passing lane so the build-up pass is never cut through a player
  function clearLane(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    T1.forEach(p => { if (p.role === 'GK') return; const t = clamp(((p.x - ax) * dx + (p.y - ay) * dy) / l2, 0, 1), qx = ax + dx * t, qy = ay + dy * t, d = Math.hypot(p.x - qx, p.y - qy); if (d < 2.6) { const l = Math.sqrt(l2), nx = -dy / l, ny = dx / l, s = ((p.x - qx) * nx + (p.y - qy) * ny) >= 0 ? 1 : -1; p.x = clamp(qx + nx * s * 3, 1, 67); p.y = clamp(qy + ny * s * 3, 1, 104); } });
  }
  function enterScene(type) {
    const spot = momentSpot(type), fk = type === 'fk' || type === 'pen';
    st.mode = 'scene'; st.ff = false; resetActors();
    if (type === 'def') return enterDefScene(spot);
    ALL.forEach(p => { const t = formTarget(p, spot.x, spot.y); p.x = t[0] + (R() - .5) * 2; p.y = t[1] + (R() - .5) * 2; p.face = p.team ? Math.PI / 2 : -Math.PI / 2; });
    GK1.x = 34 + (spot.x - 34) * .12; GK1.y = type === 'pen' ? .4 : clamp(1 + Math.hypot(spot.x - 34, spot.y) / 9, 1, 4.5);
    mom = { type, phase: 'build', t: 0, lim: type === 'counter' ? 7 : type === 'drive' ? 9 : type === 'thru' ? 4 : fk ? 99 : 5, lob: type === 'wing' || type === 'fk', curve: 0, drag: null, dribble: null, defs: [], mates: [], res: null, checked: false, spot, passer: null, recv: null };
    if (type === 'drive') { const P = U.pos, tgt = { DF: [34 + (spot.x > 34 ? 5 : -5), 46], FW: [34 + (spot.x > 34 ? 4 : -4), 18], W: [spot.x < 34 ? 10 : 58, 9], AM: [34 + (spot.x > 34 ? 3 : -3), 22], CM: [34 + (spot.x > 34 ? 5 : -5), 33] }[P]; mom.target = { x: tgt[0], y: tgt[1], r: 3.2 }; }
    const opps = T1.filter(p => p.role !== 'GK').sort((a, b) => Math.hypot(a.x - spot.x, a.y - spot.y) - Math.hypot(b.x - spot.x, b.y - spot.y));
    if (fk) {
      me.face = Math.atan2(-spot.y, 34 - spot.x); me.x = spot.x - Math.cos(me.face) * FOOT; me.y = spot.y - Math.sin(me.face) * FOOT; attach(me); ball.x = spot.x; ball.y = spot.y;
      if (type === 'fk') {
        const ang = Math.atan2(0 - spot.y, 34 - spot.x), wx = spot.x + Math.cos(ang) * 9.15, wy = spot.y + Math.sin(ang) * 9.15, px = -Math.sin(ang), py = Math.cos(ang), n = spot.y < 25 ? 4 : 3;
        for (let i = 0; i < n; i++) { const p = opps[i]; p.x = wx + px * (i - (n - 1) / 2) * .9; p.y = wy + py * (i - (n - 1) / 2) * .9; p.wall = true; mom.defs.push(p); }
      } else { let k = 0; T0.concat(T1).forEach(p => { if (p !== me && p.role !== 'GK') { p.x = 16 + (k % 10) * 4 + (R() - .5); p.y = 19.5 + (k >= 10 ? 3 : 0) + R() * 1.5; p.face = -Math.PI / 2; k++; } }); GK0.y = PL - 1.5; }
      feed(type === 'pen' ? `🟥 ${mm()}' ${FBU.esc(me.short)} ceza sahasında düşürüldü — PENALTI!` : `🟨 ${mm()}' Faul! ${FBU.esc(me.short)} serbest vuruşu kullanacak`, 'me');
      FBA.play('whistle', 'short'); setTimeout(() => FBA.play('boo'), 250);
      st.script = [{ k: 'wait', t: .7 }, { k: 'do', fn: beginMoment }];
    } else {
      // Defenders around the reception point, runners for passes
      const nd = type === 'counter' || type === 'box' || type === 'wing' || type === 'thru' ? 2 : 3;
      if (type === 'drive') {   // defenders stand on the way to the target zone: one to beat, one covering, one chasing
        const T = mom.target, along2 = (f, off) => { const dx = T.x - spot.x, dy = T.y - spot.y, l = Math.hypot(dx, dy); return [spot.x + dx * f - dy / l * off, spot.y + dy * f + dx / l * off]; };
        [[.42, (R() - .5) * 3], [.8, (R() < .5 ? -1 : 1) * (2 + R() * 2)], [.12, (R() < .5 ? -1 : 1) * 5]].forEach(([f, off], i) => { const p = opps[i], q = along2(f, off); p.x = clamp(q[0], 2, 66); p.y = clamp(q[1], 2, PL - 2); mom.defs.push(p); });
      } else       if (type === 'thru') for (let i = 0; i < nd; i++) { const p = opps[i]; p.x = clamp(spot.x + (i ? 3.5 : -3.5) + (R() - .5) * 2, 3, 65); p.y = spot.y + 7 + R() * 3; mom.defs.push(p); }
      else for (let i = 0; i < nd; i++) { const p = opps[i], a = -Math.PI / 2 + (i - (nd - 1) / 2 || (i % 2 ? .5 : -.5)) * 1.0 + (R() - .5) * .3, r = type === 'counter' ? 7 + i * 3 : 5.5 + i * 1.5; p.x = clamp(spot.x + Math.cos(a) * r, 2, 66); p.y = clamp(spot.y + Math.sin(a) * r + (type === 'counter' && i === 0 ? 9 : 0), 2, PL); mom.defs.push(p); }
      // Build-up: A → B → me, with me running onto the final pass
      const pick = roles => T0.find(p => roles.includes(p.role) && p !== me);
      const left = spot.x < 34;
      const B = type === 'wing' ? pick(left ? ['LCM', 'LB'] : ['RCM', 'RB']) : type === 'pass' && (U.pos === 'CM' || U.pos === 'DF') ? pick(left ? ['LCB'] : ['RCB']) : pick(['CM', 'LCM', 'RCM']);
      const Aa = T0.find(p => p !== me && p !== B && p.role !== 'GK' && ['LCB', 'RCB', 'LB', 'RB', 'LCM', 'RCM', 'CM'].includes(p.role) && (left ? p.x < 40 : p.x > 28));
      const bx = clamp(type === 'wing' ? spot.x + (34 - spot.x) * .45 : spot.x + (R() - .5) * 14, 6, 62), by = clamp(spot.y + (type === 'pass' ? 16 : type === 'counter' ? 17 : type === 'thru' ? 21 : 13), 8, 98);
      B.x = bx; B.y = by + 3; Aa.x = clamp(bx + (left ? 9 : -9), 3, 65); Aa.y = clamp(by + 11, 10, 100);
      me.x = clamp(spot.x + (34 - spot.x) * .25 + (R() - .5) * 4, 3, 65); me.y = spot.y + (type === 'counter' ? 9 : type === 'thru' ? 10 : 6.5);
      attach(Aa); Aa.face = Math.atan2(B.y - Aa.y, B.x - Aa.x); ball.x = Aa.x + Math.cos(Aa.face) * FOOT; ball.y = Aa.y + Math.sin(Aa.face) * FOOT;
      clearLane(ball.x, ball.y, bx, by); clearLane(bx, by, spot.x, spot.y); clearLane(me.x, me.y, spot.x, spot.y);
      // Runners for the user's own pass options
      const nr = { box: 1, edge: 2, counter: 1, wing: 2, pass: 3, thru: 1, drive: 2 }[type];
      T0.filter(p => p !== me && p !== B && p !== Aa && p.role !== 'GK').sort((a, b) => a.y - b.y).slice(0, nr).forEach((p, i) => {
        const tx = type === 'wing' ? 28 + i * 10 : clamp(spot.x + (i - (nr - 1) / 2) * 14 + (R() - .5) * 6, 8, 60), ty = type === 'pass' ? 30 - R() * 6 : type === 'wing' ? 10 + R() * 4 : clamp(spot.y - 8 - R() * 6, 9, 30);
        p.x = tx + (R() - .5) * 3; p.y = ty + 7; p.goal = { x: tx, y: Math.max(7, ty - 6) }; mom.mates.push(p);
      });
      mom.feeder = B; feed(`▶ ${mm()}' ${FBU.esc(Aa.short)} → ${FBU.esc(B.short)} → <b>${FBU.esc(me.short)}</b>${type === 'thru' ? ' · ara pas!' : ''}`, 'me');
      st.script = [{ k: 'wait', t: .55 }, { k: 'pass', from: Aa, to: B, tx: bx, ty: by, sp: 16 }, { k: 'wait', t: .3 }, { k: 'pass', from: B, to: me, tx: spot.x, ty: spot.y, sp: type === 'counter' || type === 'thru' ? 20 : 17 }, { k: 'do', fn: beginMoment }];
    }
    cam.x = ball.x; cam.y = ball.y - FRAME * H / cam.s; cam.vx = cam.vy = cam.vs = 0;   // jump the camera while the ticker panel still covers the pitch
    showTicker(false); FBA.crowdLevel(.55); FBA.play('beat', 1);
    banner(`<b class="sm">SENİN ANIN</b>`, 1100);
  }
  // Defensive duel: an opponent carries the ball at the user, who must get goal-side and time a slide tackle
  // for the moment the ball is pushed away from the attacker's feet; winning it starts our attack (pass forward)
  function enterDefScene(spot) {
    ALL.forEach(p => { const t = formTarget(p, spot.x, spot.y, 1); p.x = t[0] + (R() - .5) * 2; p.y = t[1] + (R() - .5) * 2; p.face = p.team ? Math.PI / 2 : -Math.PI / 2; });
    GK0.x = 34 + (spot.x - 34) * .1; GK0.y = PL - 1.5; GK1.x = 34; GK1.y = 6;
    mom = { type: 'def', phase: 'build', t: 0, lim: 5, lob: false, curve: 0, drag: null, dribble: null, defs: [], mates: [], res: null, checked: false, spot, passer: null, recv: null };
    const opps = T1.filter(p => p.role !== 'GK').sort((a, b) => Math.hypot(a.x - spot.x, a.y - spot.y) - Math.hypot(b.x - spot.x, b.y - spot.y));
    const left = spot.x < 34, car = opps[0];
    car.x = clamp(spot.x + (left ? 3 : -3) + (R() - .5) * 3, 4, 64); car.y = spot.y - 12; car.face = Math.PI / 2;
    me.x = spot.x; me.y = spot.y + 1; me.face = -Math.PI / 2;
    // keep the rest of the opponents out of the duel
    opps.slice(1).forEach(p => { if (Math.hypot(p.x - spot.x, p.y - spot.y) < 9) { const a = Math.atan2(p.y - spot.y, p.x - spot.x) || 0; p.x = clamp(spot.x + Math.cos(a) * 9, 2, 66); p.y = clamp(spot.y + Math.sin(a) * 9, 2, PL - 2); } });
    // teammates ahead to pass to once the ball is won
    T0.filter(p => p !== me && p.role !== 'GK' && !['LCB', 'RCB'].includes(p.role)).sort((a, b) => a.y - b.y).slice(0, 3).forEach((p, i) => {
      const tx = clamp(spot.x + (i - 1) * 16 + (R() - .5) * 5, 6, 62), ty = clamp(spot.y - 14 - R() * 10, 20, 90);
      p.x = tx; p.y = ty; p.goal = { x: tx + (R() - .5) * 4, y: ty - 6 }; mom.mates.push(p);
    });
    mom.car = car; mom.goalY = Math.min(spot.y + 11, PL - 12); mom.goalX = 34 + (spot.x - 34) * .5; mom.str = 0;
    attach(car); ball.x = car.x; ball.y = car.y + FOOT;
    feed(`🛡️ ${mm()}' ${FBU.esc(o.opp.abbr)} atakta… ${FBU.esc(car.short)} topla <b>${FBU.esc(me.short)}</b> üzerine geliyor`, 'me');
    st.script = [{ k: 'wait', t: .5 }, { k: 'do', fn: beginDuel }];
    cam.x = (ball.x + me.x) / 2; cam.y = (ball.y + me.y) / 2; cam.vx = cam.vy = cam.vs = 0;
    showTicker(false); FBA.crowdLevel(.5); FBA.play('beat', 1);
    banner(`<b class="sm">SAVUNMA</b><span>Önüne geç · top açılınca kay!</span>`, 1300);
  }
  function beginDuel() {
    const m = mom; m.phase = 'duel'; m.t = 0; st.mode = 'moment'; me.lane = null; m.car.lane = null; ball.own = null; ball.phys = false; m.car.cool = .4;
    $('.fbm-mt').textContent = '🛡️ Rakibi durdur!';
    $('.fbm-hint').innerHTML = `<b>Basılı tut: önüne geç</b> · top ayağından açılınca (yeşil halka) topa doğru <b>hızlıca kaydır</b> = kayarak müdahale`;
    $('.fbm-bar i').style.width = '100%'; momEl.hidden = false;
    FBA.crowdLevel(.65);
  }
  // Defender speed, slide reach and tackle strength come from the user's attributes (see FBX in core.js)
  function slideTackle(ang) {
    const m = mom; if (!m || m.phase !== 'duel' || me.slide || me.stun > 0) return;
    me.slide = { ang, t: 0, dur: FBX.slideT(A), v: FBX.slideV(A), clean: (m.looseT || 9) < (TUT ? .25 : .15) };   // committed while the ball was loose me.face = ang; me.st = 'tackle'; me.stT = me.slide.dur + .3; m.fing = null;
    FBA.play('kick', .25);
  }
  function duelStep(m, dt) {
    if (m.res) return;
    const c = m.car, vC = TUT ? 3.4 : 4.3 + (o.opp.r - 70) * .03;
    if (c.stun > 0) c.stun -= dt;
    // attacker: heads for the box, cuts sideways when the defender stands right in his way
    c.cool = (c.cool || 0) - dt;
    const dMe = d2(c, me);
    if (!m.cut && c.cool <= 0 && dMe < 2.8 && me.y > c.y && !(me.stun > 0) && !me.slide) {
      c.cool = 1.3;
      if (R() < (TUT ? .15 : clamp(.45 + (o.opp.r - 75) * .012, .3, .7))) { m.cut = { x: clamp(c.x + (me.x > c.x ? -1 : 1) * (5 + R() * 2), 3, 65), t: .75 }; }
    }
    if (m.cut && (m.cut.t -= dt) <= 0) m.cut = null;
    const tx = m.cut ? m.cut.x : m.goalX, ty = m.cut ? c.y + 2.5 : m.goalY;
    accelMove(c, tx, ty, m.cut ? vC * 1.1 : vC, dt, 7);
    // stride: the ball is pushed ahead and collected again; it is "loose" (winnable cleanly) when far from his feet
    m.str += dt * vC * 1.75;
    const pk = Math.max(0, Math.sin(m.str)), lead = FOOT + pk * pk * (m.cut ? .55 : TUT ? 1.35 : 1.05), k = 1 - Math.exp(-20 * dt);
    const bx = c.x + Math.cos(c.face) * lead, by = c.y + Math.sin(c.face) * lead;
    ball.vx = (bx - ball.x) / Math.max(dt, 1e-3) * k; ball.vy = (by - ball.y) / Math.max(dt, 1e-3) * k; ball.x += (bx - ball.x) * k; ball.y += (by - ball.y) * k; ball.z = 0;
    m.loose = lead > FOOT + .55; m.looseT = m.loose ? 0 : (m.looseT == null ? 9 : m.looseT + dt);   // short grace: the commit moment counts
    if (pk > .95 && !m.tch) { m.tch = 1; FBA.play('touch'); } else if (pk < .5) m.tch = 0;
    // defender: slide, recover, or run towards the finger
    if (me.slide) {
      const sl = me.slide; sl.t += dt;
      me.x = clamp(me.x + Math.cos(sl.ang) * sl.v * dt, 1, 67); me.y = clamp(me.y + Math.sin(sl.ang) * sl.v * dt, 1, 104); me.ph += dt * 3;
      const fx = me.x + Math.cos(sl.ang) * .55, fy = me.y + Math.sin(sl.ang) * .55;
      if (!sl.hit && Math.hypot(fx - ball.x, fy - ball.y) < FBX.footR(A) + (TUT ? .25 : 0)) {
        sl.hit = true;
        if (sl.clean || m.looseT < (TUT ? .3 : .05) || R() < FBX.duel(A, o.opp.r)) return duelWon(m);   // timing decides; strength only settles a 50-50
        pop('Rakip sıyrıldı!', '#fca5a5'); c.cool = .2; FBA.play('touch');   // 50-50 lost: he rides the challenge
      } else if (!sl.hit && d2(me, c) < .6 && Math.hypot(fx - ball.x, fy - ball.y) > FBX.footR(A) * 1.5) return duelFoul(m);   // took the man, clearly not the ball
      if (sl.t >= sl.dur) { me.slide = null; me.stun = FBX.recover(A); me.vx = me.vy = 0; }
    } else if (me.stun > 0) { me.stun -= dt; }
    else if (m.fing) {
      const wx = (m.fing.x - W / 2) / cam.s + cam.x, wy = (m.fing.y - H / 2) / cam.s + cam.y; m.fw = { x: wx, y: wy };
      accelMove(me, wx, wy, FBX.run(A), dt, 9);
    } else { m.fw = null; accelMove(me, me.x, me.y, 0, dt, 9); }
    if (c.y >= m.goalY - .3 || m.t > 9) {   // he got through
      pop('😣 Rakip geçti', '#fca5a5'); FBA.play('groan'); attach(c); endMoment('beaten');
    }
  }
  function duelWon(m) {
    const c = m.car; st.us.tk = (st.us.tk || 0) + 1; refreshRating();
    me.slide = null; me.stun = 0; me.st = 'run'; c.st = 'tackle'; c.stT = .5; c.stun = 1.4; c.vx *= .2; c.vy *= .2; m.cut = null;
    FBA.play('tackle'); FBA.buzz(25); pop('💪 Temiz müdahale!', '#86efac'); st.crowdJump = Math.max(st.crowdJump, .9); FBA.play('clap');
    feed(`💪 ${mm()}' ${FBU.esc(me.short)} kayarak topu kaptı!`, 'me');
    if (TUT) { m.res = 'tackle'; momEl.hidden = true; st.mode = 'after'; st.afterT = 1.3; return; }
    // the ball is ours: settle it and play forward (same flow as before for the pass)
    me.face = -Math.PI / 2; attach(me); ball.x = me.x + Math.cos(me.face) * FOOT; ball.y = me.y + Math.sin(me.face) * FOOT;
    const near = T1.filter(p => p !== c && p.role !== 'GK').sort((a, b) => d2(a, me) - d2(b, me))[0];
    m.defs = [c, near].filter(Boolean); m.defs.forEach(p => { p.react = null; p.lane = null; }); m.presser = null;
    m.phase = 'setup'; m.t = 0; m.lim = 5; m.idle = 0; m.mates.forEach(p => p.run = p.goal);
    $('.fbm-mt').textContent = MT0.def; $('.fbm-hint').innerHTML = `<b>Göndermek istediğin yönün tersine çek, bırak</b> · ${HINT.def}`;
  }
  function duelFoul(m) {
    me.slide = null; me.stun = .6; attach(m.car); m.car.st = 'dive'; m.car.stT = .5; FBA.play('whistle', 'short'); FBA.buzz([30, 40, 30]); pop('🟨 FAUL!', '#fde047');
    endMoment('foul');
  }
  // Consequence of a defensive moment: a bad pass gives the opponent a dangerous chance, a good one starts an attack
  function defAftermath(res) {
    const bad = res === 'lost' || res === 'passfail' || res === 'beaten' || res === 'foul', m0 = Math.min(89.5, st.min + .4);
    const pg = res === 'foul' ? .14 : res === 'beaten' ? .3 : .38;
    const e = bad ? { m: m0, team: 1, out: R() < pg ? 'goal' : FBU.pick(['save', 'save', 'wide', 'post']), fromErr: res !== 'foul', fromFoul: res === 'foul' }
      : { m: m0 + .3, team: 0, out: R() < .2 ? 'goal' : FBU.pick(['save', 'wide', 'wide', 'post']), fromMe: true };
    st.ev.splice(st.evI, 0, e);
  }
  function scriptStep(dt) {
    const s = st.script; if (!s || !s.length) return;
    const c = s[0];
    if (c.k === 'wait') { if (!c.go) { c.go = 1; const h = ball.own; if (h && !h.lane) { const a = h.face; moveLane(h, clamp(h.x + Math.cos(a) * c.t * 2.2, 1, 67), clamp(h.y + Math.sin(a) * c.t * 2.2, 1, 104), c.t); } } if ((c.t -= dt) <= 0) s.shift(); }
    else if (c.k === 'pass') { if (!c.go) { c.go = 1; pass(c.from, c.to, c.tx, c.ty, c.sp); } else if (!ball.fl) s.shift(); }
    else if (c.k === 'do') { s.shift(); c.fn(); }
  }
  function beginMoment() {
    const m = mom; m.phase = m.type === 'drive' ? 'drive' : 'setup'; m.t = 0; st.mode = 'moment'; me.lane = null;
    if (m.type === 'drive') { ball.own = null; ball.phys = false; ball.vx = ball.vy = 0; }
    m.mates.forEach(p => p.run = p.goal);
    $('.fbm-mt').textContent = MT[m.type]; $('.fbm-hint').innerHTML = m.type === 'drive' ? `<b>${HINT.drive0}</b> · rakiplerden uzak dur` : `<b>Göndermek istediğin yönün tersine çek, bırak</b> · ${HINT[m.type]}${m.type === 'fk' || m.type === 'pen' ? '' : ' · sahaya dokun = top sür'}`;
    momEl.hidden = false;
    FBA.crowdLevel(.7); if (m.type !== 'fk' && m.type !== 'pen') FBA.play('beat', 2);
    st.crowdJump = Math.max(st.crowdJump, .7);   // the stands rise for a big chance
  }
  // Launch vector from aim direction, power (0..1) and contact point on the ball (cx right+, cy up+, unit disc)
  function kickVec(ang, pw, cx2, cy2, noisy) {
    const pen = mom && mom.type === 'pen', r2 = cx2 * cx2 + cy2 * cy2, deg = Math.PI / 180;
    const vmax = FBX.vmax(A), vmin = pen ? 14 : 6, v0 = (vmin + pw * (vmax - vmin)) * (1 - .18 * r2);
    let a = ang + cx2 * .05;   // off-centre contact starts the ball slightly opposite to its curve
    let el = (5 + pw * 4) * deg + Math.max(0, -cy2) * (26 + (1 - pw) * 14) * deg - Math.max(0, cy2) * 6 * deg;
    if (noisy) {
      a += FBX.n() * kickSig(pw, r2, mom && mom.shootGuess) * deg;   // accuracy: Şut for shots, Pas for passes, Teknik for contact/angle
      el += FBX.n() * FBX.elevSig(A, pw) * deg;
    }
    el = clamp(el, .5 * deg, 50 * deg);
    return { vx: Math.cos(a) * Math.cos(el) * v0, vy: Math.sin(a) * Math.cos(el) * v0, vz: Math.sin(el) * v0, side: -cx2 * FBX.curl(A), bs: -cy2 * .7 };
  }
  // Direction scatter (degrees, 1 SD) of the user's kick from the current ball spot
  function kickSig(pw, r2, shot) {
    const tight = Math.abs(Math.atan2(ball.x - 34, Math.max(.5, ball.y)));
    return (shot ? FBX.shotSig(A, pw) + FBX.angleSig(A, tight) : FBX.passSig(A, pw)) + FBX.contactSig(A, r2 || 0);
  }
  // One physics step shared by the live ball, previews, receiver planning and shot detection
  function stepBall(b, h) {
    const vh = Math.hypot(b.vx, b.vy); let bounce = 0;
    if (b.z > 0 || b.vz > 0) {
      if (vh > .1) { const lx = -b.vy / vh, ly = b.vx / vh, a = b.side * vh * .36 * h; b.vx += lx * a; b.vy += ly * a; }   // Magnus: side spin bends the flight
      b.vz += b.bs * Math.hypot(vh, b.vz) * .12 * h;   // backspin lifts, topspin dips
      b.side *= 1 - .25 * h; b.bs *= 1 - .25 * h;
      const f = 1 - .07 * h; b.vx *= f; b.vy *= f;
    } else {
      if (vh > .1) { const lx = -b.vy / vh, ly = b.vx / vh, a = b.side * vh * .04 * h; b.vx += lx * a; b.vy += ly * a; }
      b.side *= 1 - 2.5 * h; b.bs = 0;
      const f = 1 - .6 * h; b.vx *= f; b.vy *= f;
    }
    b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h; b.vz -= 9.8 * h;
    if (b.z <= 0) { b.z = 0; if (b.vz < -1.6) { bounce = -b.vz; b.vz = -b.vz * .45; b.side *= .5; } else b.vz = 0; }
    return bounce;
  }
  function simPath(v, x0, y0, T = 2.6, h = 1 / 90) {
    const b = { x: x0, y: y0, z: 0, vx: v.vx, vy: v.vy, vz: v.vz, side: v.side, bs: v.bs }, out = [];
    for (let t = h; t < T; t += h) { stepBall(b, h); out.push({ t, x: b.x, y: b.y, z: b.z, s: Math.hypot(b.vx, b.vy) }); if (b.y < -1 || b.x < -2 || b.x > PW + 2 || b.y > PL) break; }
    return out;
  }
  // Is this kick going at the goal mouth (judged on the real curved path)?
  function isShot(path) { if (ball.y > 40) return false; const q = path.find(q => q.y <= 0); return !!q && q.x > GX0 - 3 && q.x < GX1 + 3 && q.z < 12; }
  function userKick(ang, pw, cx2, cy2) {
    if (!mom) return;
    const v0 = kickVec(ang, pw, cx2, cy2, false), shooting = isShot(simPath(v0, ball.x, ball.y));
    mom.kickM = Math.round(Math.hypot(ball.x - 34, ball.y)); mom.shootGuess = shooting; mom.kickDist = Math.hypot(ball.x - GK1.x, ball.y - GK1.y); GK1.readT = 0; GK1.dived = false; GK1.diveT = 0; mom.defs.forEach(p => p.missed = false);
    const v = kickVec(ang, pw, cx2, cy2, true);
    me.face = ang; me.x = ball.x - Math.cos(ang) * FOOT; me.y = ball.y - Math.sin(ang) * FOOT;
    ball.own = null; ball.phys = true; Object.assign(ball, v);
    mom.phase = 'flight'; mom.ft = 0; mom.shooting = shooting; me.kick = .3; me.lane = null; mom.dribble = null; st.kickT = 0;
    FBA.play('kick', pw); if (shooting) { st.us.sh++; st.shots[0]++; } else planReceive();
    if (mom.type === 'pen') { const g = R(); GK1.dive = { x: g < .43 ? 31.2 : g < .86 ? 36.8 : 34, early: true }; }
    momEl.hidden = true; shotEl.hidden = true;
  }
  // Simulate the ball's real path (same physics as physStep) and send the teammate who can reach it first
  // to the exact point where the ball will be playable, timed to its arrival
  function planReceive() {
    const path = simPath(ball, ball.x, ball.y).filter(q => q.x > 0 && q.x < PW && q.y > .3);
    let best = null;
    for (const p of mom.mates) for (const q of path) {
      if (q.z > 1.9 || q.s > 31 || q.t < .25) continue;
      const need = Math.hypot(q.x - p.x, q.y - p.y) / (TUT ? 9.5 : 7.5);   // tutorial mates are a little keener
      if (need <= q.t) { if (!best || q.t < best.q.t) best = { p, q, need }; break; }
    }
    if (!best) return;
    const { p, q, need } = best;
    p.run = null; moveLane(p, q.x, q.y, Math.max(.05, need)); mom.target = p;
  }
  function endMoment(res, info = {}) {
    if (!mom || mom.res) return;
    const m = mom, us = st.us, big = m.type === 'box' || m.type === 'pen' || m.type === 'counter';
    m.res = res;
    if (res === 'goal') { us.g++; us.sot++; }
    else if (res === 'assist') { us.a++; us.pk++; }
    else if (res === 'pass') { us.pk++; pop('✅ İsabetli pas', '#86efac'); feed(`✅ ${mm()}' ${FBU.esc(me.short)} isabetli pas`, 'me'); }
    else if (res === 'saved') { us.sot++; feed(`🧤 ${mm()}' ${FBU.esc(me.short)}'in şutunu kaleci çıkardı`, 'me'); }
    else if (res === 'post') { us.post++; feed(`🟨 ${mm()}' ${FBU.esc(me.short)} direğe nişanladı`, 'me'); }
    else if (res === 'wide') { us.wide++; feed(`❌ ${mm()}' ${FBU.esc(me.short)} fırsatı auta attı`, 'me'); }
    else if (res === 'blocked') { us.blk++; feed(`🛡️ ${mm()}' ${FBU.esc(me.short)}'in şutu bloklandı`, 'me'); }
    else if (res === 'lost') { us.lost++; feed(`😖 ${mm()}' ${FBU.esc(me.short)} topu kaptırdı`, 'me'); }
    else if (res === 'beaten') { us.dl = (us.dl || 0) + 1; feed(`😣 ${mm()}' ${FBU.esc(mom.car.short)}, ${FBU.esc(me.short)}'i geçti`, 'me'); }
    else if (res === 'foul') { us.fl = (us.fl || 0) + 1; feed(`🟨 ${mm()}' ${FBU.esc(me.short)} faul yaptı`, 'me'); }
    else if (res === 'passfail') { us.pf++; feed(`❌ ${mm()}' ${FBU.esc(me.short)}'in pası rakibe gitti`, 'me'); }
    if (big && m.shooting && ['saved', 'wide', 'post', 'blocked'].includes(res)) { us.miss++; }
    momEl.hidden = true; m.defs.forEach(p => p.wall = false);
    if (m.type === 'def' && !TUT) defAftermath(res);
    if (res === 'goal') { (us.gd || (us.gd = [])).push(m.kickM); goal(0, me, m.feeder, m.kickM); }
    else if (res === 'assist') goal(0, info.scorer, me, m.kickM);
    else { refreshRating(); st.mode = 'after'; st.afterT = res === 'pass' ? 1.1 : 1.5; FBA.crowdLevel(.3); }
    live();
  }
  function stepMoment(dt) {
    if (mom && (mom.phase === 'aim' || mom.phase === 'drive') && (st.tenT = (st.tenT || 0) - dt) <= 0) { st.tenT = .3; FBA.danger(ball.x, ball.y, PL); }   // crowd tension follows the ball
    const m = mom;
    if (m.phase === 'build') { m.defs.forEach(p => { if (!p.wall && !p.lane) moveTo(p, me.x, me.y - 1, 1.6, dt, 5); }); return; }
    if (m.phase === 'contact' || m.phase === 'runup') return;   // time stands still while setting up the strike
    if (m.phase === 'duel') { m.t += dt; duelStep(m, dt); return; }
    if (m.phase === 'drive') { m.t += dt; idleStep(m, dt); if (m.res || m.phase !== 'drive') return; driveStep(m, dt); return; }
    m.t += dt;
    if (m.phase === 'setup' && m.t > .35) m.phase = 'aim';
    if (m.phase === 'aim' && !m.res) { idleStep(m, dt); if (m.res || m.phase !== 'aim') return; }
    const over = m.t > m.lim + 1.35;
    m.mates.forEach(p => { if (p.run && !p.lane && m.phase !== 'flight' && m.recv !== p) moveTo(p, p.run.x, p.run.y, 4.2, dt); });
    if (m.phase === 'aim' && !m.res) {
      if (m.dribble) {
        const sp = FBX.pace(A), dx = m.dribble.x - me.x, dy = m.dribble.y - me.y, l = Math.hypot(dx, dy);
        if (l < .3) m.dribble = null; else { me.x += dx / l * sp * dt; me.y += dy / l * sp * dt; me.face = Math.atan2(dy, dx); me.ph += sp * dt * 2; if ((m.tt = (m.tt || 0) - dt) <= 0) { m.tt = .3; FBA.play('touch'); } }
      }
      defendStep(m, dt, over);
      if (m.type !== 'pen') { const dd = Math.hypot(ball.x - 34, ball.y), out = m.type === 'fk' ? 1 : dd < 20 ? clamp(.8 + dd * .16, .8, Math.min(4.5, ball.y - 3)) : clamp(.8 + dd / 10, .8, 4.5); GK1.x = lerp(GK1.x, 34 + (ball.x - 34) * .14, dt * 3); GK1.y = lerp(GK1.y, out, dt * 2.5); }
    }
    if (m.phase === 'flight') {
      m.ft += dt;
      m.defs.forEach(p => { if (p.wall) { p.jump = m.ft > .05 && m.ft < .6; return; } if (p.stun > 0) { p.stun -= dt; return; } if (ball.phys && m.ft > .12) { const t = .3, px = ball.x + ball.vx * t, py = ball.y + ball.vy * t; if (Math.hypot(px - p.x, py - p.y) < 4) accelMove(p, px, py, DEF_V(), dt); } });
      // Teammates move onto the ball's path (intercept the nearest reachable point)
      gkReact(dt);
      if (m.ft > 3.2 && !m.res) { pop(m.shooting ? '😩 Auta gitti' : 'Top dışarıda', '#ddd'); endMoment(m.shooting ? 'wide' : 'passfail'); }
    }
    if (m.recv) {   // teammate settling the ball before he plays on
      const p = m.recv;
      if (ball.own === p && !m.recvDone && Math.hypot(ball.x - p.x, ball.y - p.y) < FOOT + .1) { m.recvDone = true; afterReceive(p); }
    }
  }
  // Defending: one player presses, the others cover goal-side; each reacts late, accelerates realistically,
  // keeps a small positioning error and can mistime a tackle (then he is beaten for a moment)
  const DEF_V = () => TUT ? 3 : 4.5 + (o.opp.r - 70) * .025;
  function accelMove(p, tx, ty, vmax, dt, acc = 6.5) {
    const dx = tx - p.x, dy = ty - p.y, l = Math.hypot(dx, dy), want = Math.min(vmax, l * 1.6);
    const wx = l > .05 ? dx / l * want : 0, wy = l > .05 ? dy / l * want : 0, ax = wx - p.vx, ay = wy - p.vy, al = Math.hypot(ax, ay), mx = acc * dt;
    if (al > mx) { p.vx += ax / al * mx; p.vy += ay / al * mx; } else { p.vx = wx; p.vy = wy; }
    p.x += p.vx * dt; p.y += p.vy * dt; const v = Math.hypot(p.vx, p.vy); if (v > .25) { p.face = Math.atan2(p.vy, p.vx); p.ph += v * dt * 2.2; }
  }
  function defendStep(m, dt, over) {
    const live = m.defs.filter(p => !p.wall);
    if (!live.length) return;
    let pr = m.presser;
    if (!pr || pr.stun > 0) { pr = live.filter(p => !(p.stun > 0)).sort((a, b) => d2(a, me) - d2(b, me))[0]; m.presser = pr; }
    const gx = 34 - me.x, gy = -me.y, gl = Math.hypot(gx, gy) || 1, ux = gx / gl, uy = gy / gl, vmax = DEF_V() + (over ? .6 : 0);
    live.forEach((p, i) => {
      if (p.react == null) { p.react = m.phase === 'drive' ? .4 + R() * .45 + i * .2 : 1.35 + R() * .3 + i * .25; p.err = { x: (R() - .5) * 1.6, y: (R() - .5) * 1.2 }; }   // aim starts at t=.35 → first press ~1 s later
      if (p.stun > 0) { p.stun -= dt; accelMove(p, p.x + p.vx * .3, p.y + p.vy * .3, 1, dt, 10); return; }
      if (m.t < p.react) return;
      const ramp = clamp((m.t - p.react) / (m.phase === 'drive' ? .35 : 1.2), .3, 1), vm = vmax * ramp;   // pressure builds up gradually
      if (p === pr) {   // close down to a spot goal-side of the player, not straight onto the ball
        const k = clamp(d2(p, me) / 6, .2, 1);
        const sd = p.side || (p.side = R() < .5 ? -1 : 1);   // closes down slightly off the shooting line
        accelMove(p, me.x + (ux * 1.1 - uy * sd * .7) * k + p.err.x * k, me.y + (uy * 1.1 + ux * sd * .7) * k + p.err.y * k, vm, dt);
      } else {   // cover: stay between the player and goal, a few metres off, shading one side
        const sd = i % 2 ? 1 : -1;
        accelMove(p, me.x + ux * 5.5 - uy * sd * 3.2, me.y + uy * 5.5 + ux * sd * 3.2, vm * .85, dt);
      }
      const reach = p === pr ? 1.05 : .85;
      if ((m.phase === 'drive' || m.t > p.react + .4) && d2(p, me) < reach && (p.cool = (p.cool || 0) - dt) <= 0) {
        p.cool = 1.1;
        const defSk = .4 + o.opp.r / 100 * .4, mySk = FBX.holdUp(A);
        const pt = clamp(.28 + (defSk - mySk) * .9 - (m.dribble ? .07 : 0) + (over ? .12 : 0), .07, .55) * (TUT ? .4 : 1);
        if (R() < pt) { FBA.play('tackle'); FBA.buzz(25); pop('😖 Top kaptırıldı', '#fca5a5'); p.st = 'tackle'; p.stT = .4; attach(p); endMoment('lost'); }
        else {   // mistimed challenge: he slides past and needs time to recover
          p.st = 'tackle'; p.stT = .5; p.stun = 1 + R() * .6; p.vx *= .3; p.vy *= .3;
          if (m.dribble) { st.us.dr++; refreshRating(); pop('🌀 Çalım!', '#fde68a'); } else pop('Rakip boşa kaydı', '#fde68a');
          FBA.play('touch');
        }
      }
    });
  }
  // Carrying the ball: touches push it ahead (longer and less accurate with low technique), defenders press and can steal a loose ball
  function driveStep(m, dt) {
    const pace = FBX.pace(A), over = m.t > m.lim;
    m.hd = m.hd == null ? me.face : m.hd; m.sp = m.sp || 0;
    let want = 0, da = 0;
    if (m.fing) {   // finger position on screen → point on the pitch (follows the moving camera)
      const wx = (m.fing.x - W / 2) / cam.s + cam.x, wy = (m.fing.y - H / 2) / cam.s + cam.y, dx = wx - me.x, dy = wy - me.y, l = Math.hypot(dx, dy);
      m.fw = { x: wx, y: wy };
      if (l > .7) { want = pace * Math.min(1, .35 + l / 4); da = Math.atan2(dy, dx) - m.hd; da = ((da + Math.PI * 3) % (Math.PI * 2)) - Math.PI; }
    } else m.fw = null;
    const turn = FBX.turn(A) * dt; m.hd += clamp(da, -turn, turn);   // turning speed depends on technique
    m.sp = lerp(m.sp, want * (1 - Math.min(.45, Math.abs(da) / 3)), 1 - Math.exp(-6 * dt));
    me.vx = Math.cos(m.hd) * m.sp; me.vy = Math.sin(m.hd) * m.sp;
    me.x = clamp(me.x + me.vx * dt, 1, 67); me.y = clamp(me.y + me.vy * dt, 1, 104); me.face = m.hd; me.ph += m.sp * dt * 2.2;
    // the ball rides the stride: pushed a little ahead and collected again (looser with low technique)
    const prev = Math.sin(m.str || 0); m.str = (m.str || 0) + m.sp * dt * 2.2;
    const lead = m.sp > .6 ? .45 + FBX.looseLead(A) * (.5 + .5 * Math.sin(m.str)) : FOOT;
    const bx = me.x + Math.cos(m.hd) * lead, by = me.y + Math.sin(m.hd) * lead, k = 1 - Math.exp(-22 * dt);
    ball.vx = (bx - ball.x) / Math.max(dt, 1e-3) * k; ball.vy = (by - ball.y) / Math.max(dt, 1e-3) * k; ball.x += (bx - ball.x) * k; ball.y += (by - ball.y) * k; ball.z = 0;
    if (m.sp > 1 && prev < .9 && Math.sin(m.str) >= .9) { FBA.play('touch'); me.kick = .12; m.touches = (m.touches || 0) + 1; }
    m.mates.forEach(q => { if (q.run && !q.lane) moveTo(q, q.run.x, q.run.y, 3.6, dt); });
    // defenders press; a ball pushed too far ahead can be nicked
    defendStep(m, dt, over);
    if (m.res) return;
    const db = Math.hypot(ball.x - me.x, ball.y - me.y);
    for (const p of m.defs) if (!(p.stun > 0) && db > .6 && Math.hypot(ball.x - p.x, ball.y - p.y) < .7 && R() < dt * 5 * FBX.nick(A)) { FBA.play('tackle'); pop('😖 Rakip topu dürttü', '#fca5a5'); p.face = Math.atan2(ball.y - p.y, ball.x - p.x); attach(p); endMoment('lost'); return; }
    if (m.auto && Tz0()) { const c = cam, q = m.target; m.fing = { x: (q.x - c.x) * c.s + W / 2, y: (q.y - c.y) * c.s + H / 2 }; }   // auto-carry follows the camera
    const Tz = m.target;
    if (Math.hypot(ball.x - Tz.x, ball.y - Tz.y) < Tz.r) {   // reached the zone → pass or shoot
      attach(me); m.target = null; m.fing = null; m.fw = null;
      if (TUT) { m.res = 'drive'; momEl.hidden = true; st.us.dr += 2; pop('✅ Hedefe ulaştın!', '#86efac'); FBA.play('confirm'); st.mode = 'after'; st.afterT = 1.1; return; }
      m.phase = 'setup'; m.t = 0; m.lim = 4.5; m.auto = false; m.idle = 0; m.defs.forEach(p => p.react = null); st.us.dr += 2; refreshRating(); st.crowdJump = Math.max(st.crowdJump, .8);
      pop('✅ Hedefe ulaştın! Şimdi pas ya da şut', '#86efac'); FBA.play('confirm'); feed(`🏃 ${mm()}' ${FBU.esc(me.short)} topu sürerek ilerledi`, 'me');
      $('.fbm-mt').textContent = '🎯 Pas ya da şut!'; $('.fbm-hint').innerHTML = `<b>Göndermek istediğin yönün tersine çek, bırak</b> · koşan arkadaşına pas ya da kaleye şut`;
    }
  }
  function Tz0() { return mom && mom.target && mom.phase === 'drive'; }
  // No touch for IDLE seconds → the game plays on by itself (never while a finger is down or the strike is being set up)
  const IDLE = 5;
  function idleStep(m, dt) {
    if (TUT) return;   // the tutorial waits for the player
    const busy = touches.size > 0 || m.drag || m.dribble || (m.fing && !m.auto);
    m.idle = busy ? 0 : (m.idle || 0) + dt;
    $('.fbm-bar i').style.width = clamp(1 - m.idle / IDLE, 0, 1) * 100 + '%';
    if (m.idle < IDLE || m.auto) return;
    if (m.phase === 'drive') { m.auto = true; pop('⏱ Otomatik ilerleme', '#fde68a'); return; }
    autoAct(m);
  }
  // Automatic decision: shoot when close (or set piece), otherwise pass to the most forward, least-marked teammate
  function autoAct(m) {
    m.auto = true; m.dribble = null; m.drag = null;
    const near = ball.y < 24 && Math.abs(ball.x - 34) < 20, setp = m.type === 'fk' || m.type === 'pen';
    let best = null;
    if (!setp) for (const p of m.mates) {
      const g = p.run || p, mark = Math.min(...m.defs.map(d => Math.hypot(d.x - g.x, d.y - g.y)).concat(9));
      const sc = (ball.y - g.y) * .6 + Math.min(mark, 6) * 1.5 - Math.hypot(g.x - ball.x, g.y - ball.y) * .15;
      if (!best || sc > best.sc) best = { p, g, sc };
    }
    if (setp || near || !best || m.type === 'def' && !best) {
      const tx = GK1.x < 34 ? GX1 - 1.2 : GX0 + 1.2, d = Math.hypot(tx - ball.x, ball.y);
      pop('⏱ Otomatik şut', '#fde68a'); userKick(Math.atan2(-ball.y, tx - ball.x), clamp(.5 + d / 70, .5, .85), 0, m.type === 'fk' ? .2 : 0);
    } else {
      const g = best.g, d = Math.hypot(g.x - ball.x, g.y - ball.y);
      pop('⏱ Otomatik pas', '#fde68a'); userKick(Math.atan2(g.y - ball.y, g.x - ball.x), clamp(d / 45 + .2, .2, 1), 0, 0);
    }
  }
  function afterReceive(p) {
    const inBox = p.y < 22 && Math.abs(p.x - 34) < 17;
    if (!inBox) { endMoment('pass'); return; }
    mom.passer = p; mom.shooting = false; mom.checked = false; GK1.dived = false;
    mom.wait = .4;   // short touch, then the teammate shoots
    mom.finish = () => {
      if (!mom || mom.res) return;
      const pg = clamp(.33 + (22 - p.y) / 38 + (o.my.r - o.opp.r) / 90 + FBX.assistQ(A), .18, .78), goalIt = R() < pg;
      const tx = goalIt ? (R() < .5 ? GX0 + .5 + R() : GX1 - .5 - R()) : (R() < .5 ? GK1.x : (R() < .5 ? GX0 - 1.5 : GX1 + 1.5));
      const ang = Math.atan2(-.2 - p.y, tx - p.x); p.face = ang; p.kick = .3; mom.kickM = Math.round(Math.hypot(p.x - 34, p.y));
      ball.x = p.x + Math.cos(ang) * FOOT; ball.y = p.y + Math.sin(ang) * FOOT; ball.own = null; ball.phys = true;
      ball.vx = Math.cos(ang) * 24; ball.vy = Math.sin(ang) * 24; ball.vz = 2.5; ball.side = ball.bs = 0;
      FBA.play('kick', .8); mom.checked = goalIt; mom.ft = 0; mom.phase = 'flight'; GK1.readT = 0; GK1.dived = false; GK1.diveT = 0;
    };
  }
  // Finishing quality: a developed striker places and strikes shots that keepers handle worse
  const finishQ = () => FBX.finish(A, !!(mom && (mom.type === 'fk' || Math.abs(ball.side) > .25)));
  function gkReact(dt) {
    const g = GK1;
    if (g.dive && g.dive.early) { if (!g.dived) { g.dived = true; g.st = 'dive'; g.stT = .8; g.ddir = Math.sign(g.dive.x - g.x) || 0; } g.x = lerp(g.x, g.dive.x, dt * 5); return; }
    if (!ball.phys || ball.vy >= -1 || mom.res) return;
    if (mom.ft < .14 + (1 - g.sk) * .22) return;   // reaction time
    if (g.dived) { if (g.diveT > 0) { g.x += clamp(g.diveTo - g.x, -g.diveV * dt, g.diveV * dt); g.diveT -= dt; } return; }
    // he re-reads the flight only every ~0.28 s (straight-line guess), so late curve can fool him
    if ((g.readT = (g.readT || 0) - dt) <= 0) { g.readT = .28; const tc0 = (ball.y - g.y) / -ball.vy; g.readX = ball.x + ball.vx * tc0; }
    const tc = (ball.y - g.y) / -ball.vy;
    if (tc < 0 || tc > 2.5) return;
    const tx = clamp(g.readX, GX0 - .4, GX1 + .4), sp = 2.8 + g.sk * 2.2;
    if (tc < .42 && Math.abs(tx - g.x) > .6) { g.dived = true; g.st = 'dive'; g.stT = .9; g.ddir = Math.sign(tx - g.x); g.diveV = 5 + g.sk * 2.6; g.diveT = .42; g.diveTo = tx; return; }
    g.x += clamp(tx - g.x, -sp * dt, sp * dt);
  }

  /* ---------- Ball physics with posts, bar, net, keeper, blocks, receivers ---------- */
  function physStep(dt) {
    const b = ball, py = b.y;
    const bv = stepBall(b, dt); if (bv > 1.6) FBA.play('bounce', Math.min(1, bv / 8));
    if (b.inNet) { if (b.y < -1.6) { b.y = -1.6; b.vy = 0; b.vx *= .5; } return; }
    if (!mom || mom.res) return;
    const sp = Math.hypot(b.vx, b.vy);
    if (py > 0 && b.y <= 0) {
      const t = py / (py - b.y), xc = b.x - b.vx * dt * (1 - t);
      mom.missBy = xc < GX0 ? GX0 - xc : xc > GX1 ? xc - GX1 : Math.max(0, b.z - GH);   // distance outside the frame
      for (const px of [GX0, GX1]) if (Math.abs(xc - px) < .23 && b.z < GH) { b.y = .05; b.vy = -b.vy * .55; b.vx += (xc - px) * 18 + (R() - .5) * 3; FBA.play('post'); FBA.buzz(30); pop('🟨 DİREK!', '#ffd400'); shake(.7); st.crowdJump = 1.2; endMoment(mom.passer ? 'pass' : 'post'); return; }
      if (xc > GX0 && xc < GX1 && Math.abs(b.z - GH) < .18) { b.y = .05; b.vy = -b.vy * .4; b.vz = -Math.abs(b.vz) * .5; FBA.play('post'); FBA.buzz(30); pop('🟨 ÜST DİREK!', '#ffd400'); shake(.7); endMoment(mom.passer ? 'pass' : 'post'); return; }
      if (xc > GX0 + .11 && xc < GX1 - .11 && b.z < GH - .1) { b.inNet = true; b.vy *= .35; b.vx *= .4; endMoment(mom.passer ? 'assist' : 'goal', { scorer: mom.passer }); return; }
    }
    if (b.y < -.5 && !b.inNet) { FBA.play(mom.shooting && mom.missBy < 1.5 ? 'ooh' : 'groan'); pop(mom.shooting ? '😩 Auta gitti' : 'Top dışarıda', '#ddd'); endMoment(mom.passer ? 'pass' : mom.shooting ? 'wide' : 'passfail'); return; }
    if (b.x < -.5 || b.x > PW + .5 || b.y > PL) { pop('Taç / dışarı', '#ddd'); endMoment(mom.passer ? 'pass' : 'passfail'); return; }
    const g = GK1;
    if (!mom.checked && b.vy < 0 && b.y < g.y + .6 && b.y > g.y - .8) {
      mom.checked = true;
      const spread = clamp((13 - (mom.kickDist || 20)) / 13, 0, 1) * .3, reach = (g.dived ? .95 + .35 * g.sk : .72) + spread, dd = Math.abs(b.x - g.x), top = g.dived ? 1.75 : 2.25 + (g.y < 1.5 ? .15 : 0);
      if (dd < reach && b.z < top) {
        const low = b.z < .3 && sp > 17 ? .1 : 0, high = b.z > 1.6 ? .08 : 0;
        const pc = clamp(.86 - Math.max(0, sp - 19) / 50 - Math.pow(dd / reach, 2) * .45 + g.sk * .12 - low - high - (mom.type === 'pen' ? .18 : 0) - finishQ() - clamp((19 - (mom.kickDist || 20)) / 19, 0, 1) * .4, .08, .92) * (TUT ? .5 : 1);   // little time to react from close range
        if (R() < pc) {
          const caught = sp < 20 && !g.dived;
          FBA.play('save', caught); FBA.buzz(20); pop(caught ? '🧤 Kaleci kucakladı' : '🧤 Müthiş kurtarış!', '#9fe7ff');
          if (caught) { g.face = Math.atan2(b.y - g.y, b.x - g.x); attach(g); } else { b.vy = Math.abs(b.vy) * .3; b.vx = Math.sign(b.x - g.x || 1) * (5 + R() * 6); b.vz = 2; }
          endMoment(mom.passer ? 'pass' : 'saved', { caught }); return;
        }
      }
    }
    for (const p of mom.defs) {
      const h = p.wall ? (p.jump ? 2.12 : 1.85) : 1.8;
      if (b.z < h && !(p.stun > 0) && !p.missed && Math.hypot(b.x - p.x, b.y - p.y) < (p.wall ? .55 : .62)) {
        if (!p.wall && R() < .45) { p.missed = true; continue; }   // ball squeezes past / through his legs
        if (sp > 24 && R() < .5 && !p.wall) { b.vx = -b.vx * .3 + (R() - .5) * 8; b.vy = -b.vy * .3; FBA.play('tackle'); pop('🛡️ Araya girdi', '#fca5a5'); endMoment(mom.shooting ? 'blocked' : 'passfail'); return; }
        FBA.play('tackle'); pop(p.wall ? '🧱 Baraja çarptı' : '🛡️ Rakip kesti', '#fca5a5');
        if (p.wall) { b.vx *= -.25; b.vy *= -.25; b.vz = 0; } else { p.face = Math.atan2(b.y - p.y, b.x - p.x); attach(p); }
        endMoment(mom.shooting ? 'blocked' : 'passfail'); return;
      }
    }
    // A teammate reaching the ball gets it under control (no teleport: he steps onto it)
    if (!mom.passer && !mom.recv && !mom.shooting) for (const p of mom.mates) {
      if (b.z < 1.9 && sp < 31 && Math.hypot(b.x - p.x, b.y - p.y) < (mom.target === p ? .9 : 1.1) * (TUT ? 1.8 : 1)) { mom.recv = p; p.lane = null; p.face = Math.atan2(b.y - p.y, b.x - p.x); attach(p); p.ctrl = .25; FBA.play('touch'); return; }
    }
  }

  /* ---------- Movement & idle AI ---------- */
  function moveTo(p, tx, ty, sp, dt, stop = .25) {
    const dx = tx - p.x, dy = ty - p.y, l = Math.hypot(dx, dy);
    if (l < stop) { p.vx *= .8; p.vy *= .8; return; }
    const s = Math.min(sp, l * 3);
    p.vx = lerp(p.vx, dx / l * s, Math.min(1, dt * 6)); p.vy = lerp(p.vy, dy / l * s, Math.min(1, dt * 6));
    p.x += p.vx * dt; p.y += p.vy * dt; p.ph += Math.hypot(p.vx, p.vy) * dt * 2.2; p.face = Math.atan2(p.vy, p.vx);
  }
  function idleAI(dt) {
    if (mom && mom.type === 'pen') return;   // penalty: everyone waits outside the box
    for (const p of ALL) {
      if (p.lane || p === ball.own || p === me || p === GK1 || p.keep || (mom && (mom.defs.includes(p) || mom.mates.includes(p) || mom.recv === p || (mom.car === p && !mom.res)))) continue;
      const t = formTarget(p, ball.x, ball.y);
      // Only the scene's own defenders press the user; everyone else keeps a sensible distance
      if (mom && p.team === 1) { const dx = t[0] - me.x, dy = t[1] - me.y, l = Math.hypot(dx, dy); if (l < 5.5) { const k = 5.5 / (l || 1); t[0] = me.x + (l ? dx : 1) * k; t[1] = me.y + (l ? dy : 0) * k; } }
      moveTo(p, t[0], t[1], 3.2, dt, .9);
    }
  }
  function lanesStep(dt) {
    for (const p of ALL) {
      const L = p.lane; if (!L) continue;
      L.t += dt; const f = Math.min(1, L.t / L.T), nx = lerp(L.x0, L.x1, f), ny = lerp(L.y0, L.y1, f), mv = Math.hypot(nx - p.x, ny - p.y);
      if (mv > 1e-4) { p.face = Math.atan2(ny - p.y, nx - p.x); p.ph += mv * 2.2; }
      p.x = nx; p.y = ny; if (f >= 1) p.lane = null;
    }
  }
  function ballStep(dt) {
    const bx = ball.x, by = ball.y, f = ball.fl;
    if (f) {
      f.t += dt; const t = Math.min(1, f.t / f.dur);
      ball.x = lerp(f.x0, f.x1, t); ball.y = lerp(f.y0, f.y1, t); ball.z = 4 * f.h * t * (1 - t);
      if (t >= 1) { const p = f.to; p.lane = null; attach(p); p.ctrl = .25; FBA.play('touch'); }
    } else if (ball.phys) for (let k = 0; k < 3; k++) physStep(dt / 3);
    else if (ball.own) {
      // Ball sits on the owner's foot; owner turns smoothly so the ball never jumps
      const p = ball.own, tx = p.x + Math.cos(p.face) * FOOT, ty = p.y + Math.sin(p.face) * FOOT, k = Math.min(1, dt * 16);
      ball.x += (tx - ball.x) * k; ball.y += (ty - ball.y) * k; ball.z = 0;
    }
    // Debug guard: count frames where the ball moves further than physically possible
    const mv = Math.hypot(ball.x - bx, ball.y - by), lim = (f ? Math.hypot(f.x1 - f.x0, f.y1 - f.y0) / f.dur : Math.max(40, Math.hypot(ball.vx, ball.vy))) * dt * 1.6 + .25;
    if (mv > lim && st.mode !== 'tick' && st.mode !== 'tut') { st.jumps++; if (window.__dbg) console.warn('ball jump', mv.toFixed(2), st.mode); }
  }

  /* ---------- Goals & celebration ---------- */
  function goal(side, scorer, assister, dist) {
    st.sc[side]++; scoreUI(); refreshRating(); FBA.play('net'); FBA.play('goal'); FBA.buzz([40, 40, 80]); shake(1.2);
    st.log.push({ m: mm(), side, name: scorer.short, r: scorer.role, d: dist || null, user: !!scorer.user, a: assister ? assister.short : null, ar: assister ? (assister.user ? 'ME' : assister.role) : null });
    feed(`⚽ ${mm()}' GOL! <b>${FBU.esc(scorer.short)}</b>${dist ? ` <small>· ${dist} m</small>` : ''}${assister ? ` <small>(asist ${FBU.esc(assister.short)})</small>` : ''}`, 'gl');
    banner(`<b>${scorer.user ? 'GOOOL!' : 'GOL!'}</b>${dist ? `<em class="fbm-dist">${dist} METREDEN</em>` : ''}<span>${FBU.esc(scorer.name)} ${mm()}'${assister ? ` · asist ${FBU.esc(assister.short)}` : ''}</span>`, 2800);
    if (window.JUICE) JUICE.confetti();
    st.mode = 'celebrate'; st.modeT = 3.2; st.celeb = { p: scorer, corner: { x: scorer.x < 34 ? 3 : 65, y: 3 } };
    st.crowdJump = 3.5; FBA.crowdLevel(1); live();
  }
  /* ---------- Tutorial: four short lessons, each must be passed before the next ---------- */
  const TUT_STEPS = [
    { type: 'box', t: '1/4 · ŞUT', d: 'Topa dokun, <b>vurmak istediğin yönün tersine çek</b> ve bırak (sapan gibi). Sonra topun neresine vuracağını seç, <b>⚽ VUR</b>. Kaleci tek başına: köşeyi hedefle!', ok: r => r === 'goal', why: { saved: 'Kaleci kurtardı. Köşeye daha yakın nişan al.', wide: 'Dışarı gitti. Biraz daha içeriyi hedefle.', post: 'Direk! Çok az kaldı.', passfail: 'Bu sefer kaleye vurmalısın.', pass: 'Bu ders şut dersi: kaleye vur!', lost: 'Top kaptırıldı, daha hızlı vur.' } },
    { type: 'pass', t: '2/4 · PAS', d: 'Koşan bir takım arkadaşını seç. Ona göndermek için <b>ters yöne çek ve bırak</b>. Kısa çekiş yumuşak pas, uzun çekiş sert pas demek.', ok: r => r === 'pass' || r === 'assist', why: { passfail: 'Pas arkadaşına ulaşmadı. Koştuğu yerin biraz önüne at.', saved: 'Bu ders pas dersi: kaleye değil arkadaşına gönder.', wide: 'Bu ders pas dersi: kaleye değil arkadaşına gönder.', goal: 'Gol güzel ama bu ders pas dersi!' } },
    { type: 'drive', t: '3/4 · TOP SÜRME', d: 'Parmağını sahada <b>basılı tut</b>: oyuncun parmağına doğru koşar, top ayağında kalır. Rakiplerden uzak durarak sarı <b>HEDEF</b> bölgesine ulaş.', ok: r => r === 'drive', why: { lost: 'Top kaptırıldı. Rakiplerin etrafından dolaş, üstlerine sürme.' } },
    { type: 'def', t: '4/4 · SAVUNMA', d: 'Rakip topla üstüne geliyor. <b>Basılı tutarak</b> önüne geç. Top ayağından açılınca halka <b style="color:#4ade80">yeşil</b> olur: o an topa doğru <b>hızlıca kaydır</b> (ya da topa dokun) ve kayarak müdahale et. Erken kayarsan rakibe çarpar, faul yaparsın.', ok: r => r === 'tackle', why: { foul: 'Faul! Topa değil rakibe çarptın. Halkanın yeşil olmasını bekle.', beaten: 'Rakip geçti. Önce önüne geç, sonra kay.' } }
  ];
  function tutCard(head, step, btn) { st.mode = 'tut'; showCard(`<div class="fbm-h">${head}</div>${step ? `<div class="fbm-tut"><b>${step.t}</b><p>${step.d}</p></div>` : ''}${btn}`); }
  function tutStart() { const s = TUT_STEPS[TUT.i]; ovEl.hidden = true; st.us = { g: 0, a: 0, sh: 0, sot: 0, pk: 0, pf: 0, dr: 0, lost: 0, miss: 0, wide: 0, blk: 0, post: 0 }; enterScene(s.type); if (s.type !== 'def') mom.defs = s.type === 'drive' ? mom.defs.slice(0, 2) : []; if (s.type === 'box') GK1.sk = .15; }
  function tutAfter(res) {
    const s = TUT_STEPS[TUT.i];
    if (s.ok(res)) {
      TUT.i++; FBA.play('confirm');
      if (TUT.i >= TUT_STEPS.length) return tutCard('🏆 Eğitim tamam!', null, `<p>Şut, pas, top sürme ve savunmayı öğrendin. Artık kariyerine hazırsın.</p><button class="fbm-btn pri" data-a="tdone">Kariyere başla ▶</button>`);
      return tutCard('✅ Harika!', TUT_STEPS[TUT.i], `<button class="fbm-btn pri" data-a="tgo">Devam ▶</button>`);
    }
    FBA.play('back');
    tutCard('Tekrar dene', { t: s.t, d: `<i>${(s.why && s.why[res]) || 'Bir daha dene, olacak!'}</i><br><br>${s.d}` }, `<button class="fbm-btn pri" data-a="tgo">Tekrar dene ↻</button>`);
  }
  function toTicker() {
    if (TUT) { const r = mom && mom.res; mom = null; momEl.hidden = true; shotEl.hidden = true; c3.tk = c3.k = 0; me.keep = false; st.kickT = null; st.script = null; resetActors(); ball.phys = false; ball.fl = null; return tutAfter(r); }
    mom = null; momEl.hidden = true; shotEl.hidden = true; c3.tk = c3.k = 0; me.keep = false; st.kickT = null; st.script = null; st.mode = 'tick'; st.hold = .35; resetActors(); ball.phys = false; ball.fl = null;
    if (!ball.own) attach(GK1);
    showTicker(true); FBA.crowdLevel(.25);
  }

  /* ---------- Camera & rendering ---------- */
  const cam = { x: 34, y: 52.5, s: 10 }, zoom = { v: o.zoom || 1, t: o.zoom || 1 }, ZMIN = .6, ZMAX = 1.7, FRAME = .3; let W = 0, H = 0; const DPR = Math.min(2, devicePixelRatio || 1);
  function shake(k) { if (FBU.calm) return; st.shake = Math.max(st.shake, k); }
  function resize() { W = host.clientWidth; H = host.clientHeight; cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  // Stands: rows of seated fans in muted club colours; a second tile with arms and scarves up for big moments
  const CT_W = 240, CT_H = 96;
  function mix(hex, to, k) { const a = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)), b = [1, 3, 5].map(i => parseInt(to.slice(i, i + 2), 16)); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
  function crowdTile(cheer) {
    const S = 2, t = document.createElement('canvas'); t.width = CT_W * S; t.height = CT_H * S;
    const c = t.getContext('2d'), r = FBU.rng('crowd' + homeT.id); c.scale(S, S);
    const pal = [[mix(homeT.c1, '#1b1f29', .3), 46], [mix(homeT.c2, '#1b1f29', .35), 18], [mix(homeT.c1, '#ffffff', .15), 8], ['#3b4252', 12], ['#2a2f3a', 8], [mix(awayT.c1, '#1b1f29', .45), 8]];
    const tot = pal.reduce((a, b) => a + b[1], 0), pick = () => { let x = r() * tot; for (const [c2, w] of pal) if ((x -= w) < 0) return c2; return pal[0][0]; };
    const skins = ['#c99a79', '#a87b5c', '#e0b796', '#7d5a43'];
    for (let row = 0; row < 8; row++) {
      const y = row * 12;
      c.fillStyle = row % 2 ? '#191d26' : '#1d222c'; c.fillRect(0, y, CT_W, 12);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, y + 10.5, CT_W, 1.5);
      for (let x = (row % 2) * 4 + 2; x < CT_W; x += 7.4 + r() * 1.6) {
        if (r() < .07) continue;   // empty seat
        const shirt = pick(), hx = x + (r() - .5), up = cheer ? r() < .55 : r() < .04, hy = y + 4 - (cheer && up ? 1.2 : 0);
        c.fillStyle = shirt; c.beginPath(); c.roundRect ? c.roundRect(hx - 3, hy + 2.2, 6, 5.5, 2.4) : c.rect(hx - 3, hy + 2.2, 6, 5.5); c.fill();
        if (up) { c.strokeStyle = shirt; c.lineWidth = 1.3; c.beginPath(); c.moveTo(hx - 2.4, hy + 3); c.lineTo(hx - 3.6, hy - 1.8); c.moveTo(hx + 2.4, hy + 3); c.lineTo(hx + 3.6, hy - 1.8); c.stroke(); }
        if (cheer && r() < .12) { c.fillStyle = r() < .5 ? homeT.c1 : homeT.c2; c.fillRect(hx - 4.5, hy - 3.2, 9, 1.6); }
        c.fillStyle = skins[(r() * 4) | 0]; c.beginPath(); c.arc(hx, hy, 1.9, 0, 7); c.fill();
      }
    }
    c.fillStyle = 'rgba(12,16,24,.34)'; c.fillRect(0, 0, CT_W, CT_H);   // keep the stands calm behind the pitch
    const u = document.createElement('canvas'); u.width = t.width; u.height = t.height; const uc = u.getContext('2d'); uc.filter = 'blur(0.6px)'; uc.drawImage(t, 0, 0);   // soften once, no per-frame cost
    const pat = cx.createPattern(u, 'repeat'); if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().scale(1 / S)); return pat;
  }
  const crowdA = crowdTile(false), crowdB = crowdTile(true);
  // Fill the background with stands; they scroll with the camera and jump when the crowd celebrates
  function drawStands(ox, oy) {
    const cheer = st.crowdJump > 0, pat = cheer && Math.sin(perf * 18) > -.2 ? crowdB : crowdA, j = cheer ? Math.abs(Math.sin(perf * 11)) * -2.5 * Math.min(1, st.crowdJump) : 0;
    cx.save(); cx.translate(((ox % CT_W) + CT_W) % CT_W - CT_W, ((oy % CT_H) + CT_H) % CT_H - CT_H + j); cx.fillStyle = pat; cx.fillRect(0, 0, W + CT_W * 2, H + CT_H * 2); cx.restore();
  }
  const W2S = (x, y) => [(x - cam.x) * cam.s + W / 2, (y - cam.y) * cam.s + H / 2];
  let perf = 0;
  function drawPitch() {
    const s = cam.s, [x0, y0] = W2S(0, 0), [x1, y1] = W2S(PW, PL);
    drawStands(x0 * .6, y0 * .6);
    // running track + advertising boards separate the stands from the pitch
    const m = 4 * s; cx.fillStyle = '#1f3a2a'; cx.fillRect(x0 - 6 * s, y0 - 6 * s, x1 - x0 + 12 * s, y1 - y0 + 12 * s);
    cx.lineWidth = .9 * s; cx.strokeStyle = '#0f2a5c'; cx.strokeRect(x0 - 5 * s, y0 - 5 * s, x1 - x0 + 10 * s, y1 - y0 + 10 * s);
    cx.setLineDash([5 * s, 7 * s]); cx.strokeStyle = homeT.c1; cx.strokeRect(x0 - 5 * s, y0 - 5 * s, x1 - x0 + 10 * s, y1 - y0 + 10 * s); cx.setLineDash([]);
    cx.fillStyle = '#2f8a3e'; cx.fillRect(x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m);
    for (let k = 0; k < 18; k++) if (k % 2 === 0) { const [, ya] = W2S(0, k * PL / 18), [, yb] = W2S(0, (k + 1) * PL / 18); cx.fillStyle = '#34963f'; cx.fillRect(x0 - m, ya, x1 - x0 + 2 * m, yb - ya); }
    cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.lineWidth = Math.max(1.5, .12 * s);
    const L = (ax, ay, bx, by) => { const [a, b] = W2S(ax, ay), [c, d] = W2S(bx, by); cx.beginPath(); cx.moveTo(a, b); cx.lineTo(c, d); cx.stroke(); };
    const Rr = (ax, ay, w, h) => { const [a, b] = W2S(ax, ay); cx.strokeRect(a, b, w * s, h * s); };
    Rr(0, 0, PW, PL); L(0, PL / 2, PW, PL / 2);
    const [ccx, ccy] = W2S(34, 52.5); cx.beginPath(); cx.arc(ccx, ccy, 9.15 * s, 0, 7); cx.stroke();
    for (const top of [true, false]) {
      const y = top ? 0 : PL, d = top ? 1 : -1;
      Rr(13.84, top ? 0 : PL - 16.5, 40.32, 16.5); Rr(24.84, top ? 0 : PL - 5.5, 18.32, 5.5);
      const [sx, sy] = W2S(34, y + d * 11); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(sx, sy, Math.max(2, .2 * s), 0, 7); cx.fill();
      cx.beginPath(); cx.arc(sx, sy, 9.15 * s, top ? .93 : Math.PI + .93, top ? Math.PI - .93 : 2 * Math.PI - .93); cx.stroke();
    }
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(ccx, ccy, Math.max(2, .2 * s), 0, 7); cx.fill();
  }
  function drawGoal(top) {
    const s = cam.s, y = top ? 0 : PL, d = top ? -1 : 1, [ax, ay] = W2S(GX0, y), [bx] = W2S(GX1, y), depth = 2 * s * d;
    const rip = top && ball.inNet ? Math.sin(perf * 30) * .25 * s * Math.max(0, 1 - (st.netT || 0)) : 0;
    cx.fillStyle = 'rgba(255,255,255,.12)'; cx.fillRect(ax, Math.min(ay, ay + depth), bx - ax, Math.abs(depth));
    cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1;
    for (let k = 0; k <= 10; k++) { const xx = ax + (bx - ax) * k / 10; cx.beginPath(); cx.moveTo(xx, ay); cx.lineTo(xx + rip * Math.sin(k), ay + depth); cx.stroke(); }
    for (let k = 0; k <= 4; k++) { const yy = ay + depth * k / 4 + (k ? rip : 0); cx.beginPath(); cx.moveTo(ax, yy); cx.lineTo(bx, yy); cx.stroke(); }
    cx.strokeStyle = '#fff'; cx.lineWidth = Math.max(3, .22 * s); cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(ax, ay + depth); cx.moveTo(bx, ay); cx.lineTo(bx, ay + depth); cx.moveTo(ax, ay); cx.lineTo(bx, ay); cx.stroke();
  }
  const SKIN = FB_SKIN[(U.look && U.look.skin) || 0];
  function drawPlayer(p) {
    const s = cam.s, [x, y] = W2S(p.x, p.y), r = .62 * s, kit = p.team ? kitOp : kitMy;
    const gk = p.role === 'GK', c1 = gk ? (p.team ? '#c6f432' : '#ff8a00') : kit.c1, c2 = gk ? '#222' : kit.c2;
    cx.fillStyle = 'rgba(0,0,0,.28)'; cx.beginPath(); cx.ellipse(x + .2 * s, y + .3 * s, r * 1.05, r * .62, 0, 0, 7); cx.fill();
    cx.save(); cx.translate(x, y);
    if (p.st === 'dive') { cx.rotate((p.ddir || 1) * 1.3); cx.translate((p.ddir || 1) * .5 * s, 0); }
    else if (p.st === 'celebrate') cx.translate(0, -Math.abs(Math.sin(perf * 10)) * .5 * s);
    else if (p.st === 'tackle') cx.rotate(.6);
    if (p.jump) cx.scale(1.12, 1.12);
    const f = p.face || 0, sw = Math.sin(p.ph) * .42 * s, fx = Math.cos(f), fy = Math.sin(f), kk = p.kick > 0 ? .5 * s * Math.sin((1 - p.kick / .3) * Math.PI) : 0, cc = p.ctrl > 0 ? .25 * s : 0;
    cx.fillStyle = '#111';
    cx.beginPath(); cx.arc(-fy * .26 * s + fx * (sw + kk + cc), fx * .26 * s + fy * (sw + kk + cc), .17 * s, 0, 7); cx.fill();
    cx.beginPath(); cx.arc(fy * .26 * s - fx * sw, -fx * .26 * s - fy * sw, .17 * s, 0, 7); cx.fill();
    cx.fillStyle = c1; cx.beginPath(); cx.arc(0, 0, r, 0, 7); cx.fill();
    cx.strokeStyle = c2 === c1 ? '#fff' : c2; cx.lineWidth = Math.max(1.5, .14 * s); cx.stroke();
    cx.fillStyle = gk ? '#111' : FBU.ink(c1); cx.font = `bold ${Math.max(7, .62 * s)}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(p.num, 0, .38 * s);
    const hx = fx * .1 * s, hy = fy * .1 * s - .18 * s;
    cx.fillStyle = p.user ? SKIN : FB_SKIN[(p.num * 7) % 5]; cx.beginPath(); cx.arc(hx, hy, .3 * s, 0, 7); cx.fill();
    cx.fillStyle = p.user ? FB_HAIRC[U.look.hairC || 0] : FB_HAIRC[(p.num * 3) % 4]; cx.beginPath(); cx.arc(hx - fx * .06 * s, hy - fy * .06 * s, .24 * s, 0, 7); cx.fill();
    cx.restore();
    if (p.user) {
      const pulse = 1 + Math.sin(perf * 6) * .12;
      cx.strokeStyle = '#ffd400'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(x, y + .2 * s, r * 1.45 * pulse, r * .95 * pulse, 0, 0, 7); cx.stroke();
      cx.font = `bold ${Math.max(10, .7 * s)}px system-ui,sans-serif`; const nm = FBU.trU(U.short), tw = cx.measureText(nm).width + 10;
      cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(x - tw / 2, y - 1.95 * s - 9, tw, 16); cx.fillStyle = '#ffd400'; cx.fillText(nm, x, y - 1.95 * s);
    } else if (ball.own === p || (ball.fl && ball.fl.to === p)) {   // name of the player on/receiving the ball
      cx.font = `600 ${Math.max(9, .55 * s)}px system-ui,sans-serif`; cx.fillStyle = 'rgba(255,255,255,.92)'; cx.textAlign = 'center'; cx.fillText(p.short, x, y - 1.5 * s);
    }
  }
  function drawBall() {
    const s = cam.s, [x, y] = W2S(ball.x, ball.y), r = Math.max(3, .24 * s) * (1 + ball.z * .06);
    cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(x + ball.z * .25 * s, y + .1 * s, r * .9, r * .5, 0, 0, 7); cx.fill();
    const by = y - ball.z * s * .9;
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x, by, r, 0, 7); cx.fill(); cx.strokeStyle = '#222'; cx.lineWidth = 1; cx.stroke();
    const own = ball.own; ball.spin += (Math.hypot(ball.vx, ball.vy) + (ball.fl ? 15 : own ? Math.hypot(own.vx, own.vy) + (own.lane ? 6 : 0) : 0)) * .016;
    cx.fillStyle = '#222'; for (let k = 0; k < 3; k++) { const a = ball.spin + k * 2.1; cx.beginPath(); cx.arc(x + Math.cos(a) * r * .5, by + Math.sin(a) * r * .5, r * .28, 0, 7); cx.fill(); }
  }
  function label(t, x, y, col) { cx.font = 'bold 13px system-ui,sans-serif'; const w = cx.measureText(t).width + 12; cx.fillStyle = 'rgba(0,0,0,.65)'; cx.fillRect(x - w / 2, y - 10, w, 20); cx.fillStyle = col; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(t, x, y); }
  // Pull-back aim: the ball goes opposite to the finger; shows rubber band, direction arrow and centre-contact path
  function drawDrive() {
    const m = mom, T = m.target; if (!T) return;
    const [tx, ty] = W2S(T.x, T.y), r = T.r * cam.s, pulse = 1 + Math.sin(perf * 5) * .06;
    cx.fillStyle = 'rgba(253,224,71,.16)'; cx.beginPath(); cx.arc(tx, ty, r * pulse, 0, 7); cx.fill();
    cx.strokeStyle = '#fde047'; cx.lineWidth = 3; cx.setLineDash([8, 6]); cx.beginPath(); cx.arc(tx, ty, r * pulse, 0, 7); cx.stroke(); cx.setLineDash([]);
    label('HEDEF', tx, ty, '#fde047');
    const [mx, my] = W2S(me.x, me.y);
    cx.strokeStyle = 'rgba(253,224,71,.35)'; cx.lineWidth = 2; cx.setLineDash([3, 7]); cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(tx, ty); cx.stroke(); cx.setLineDash([]);
    if (m.fw) { const [fx2, fy2] = W2S(m.fw.x, m.fw.y); cx.strokeStyle = 'rgba(134,239,172,.9)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(fx2, fy2, 18, 0, 7); cx.stroke(); cx.setLineDash([4, 6]); cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(fx2, fy2); cx.stroke(); cx.setLineDash([]); }
    if (false) { const l = 1, ux = 0, uy = 0; cx.strokeStyle = '#86efac'; cx.lineWidth = 5; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(mx + ux * 16, my + uy * 16); cx.lineTo(mx + ux * 52, my + uy * 52); cx.stroke(); cx.lineCap = 'butt'; }
  }
  // Duel: a ring on the ball turns green while it is away from the attacker's feet; dashed circle = slide reach
  function drawDuel() {
    const m = mom, [bx, by] = W2S(ball.x, ball.y), [mx, my] = W2S(me.x, me.y), s = cam.s, ok = m.loose;
    if (!me.slide && !(me.stun > 0)) { cx.strokeStyle = 'rgba(255,255,255,.28)'; cx.lineWidth = 2; cx.setLineDash([4, 6]); cx.beginPath(); cx.arc(mx, my, FBX.slideV(A) * FBX.slideT(A) * s, 0, 7); cx.stroke(); cx.setLineDash([]); }
    cx.strokeStyle = ok ? '#4ade80' : 'rgba(255,255,255,.7)'; cx.lineWidth = ok ? 4 : 2; cx.beginPath(); cx.arc(bx, by, (ok ? .95 : .7) * s, 0, 7); cx.stroke();
    if (ok && !me.slide) label('KAY!', bx, by - 1.4 * s - 6, '#4ade80');
    if (m.fw) { const [fx2, fy2] = W2S(m.fw.x, m.fw.y); cx.strokeStyle = 'rgba(134,239,172,.8)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(fx2, fy2, 16, 0, 7); cx.stroke(); }
    const [gx, gy] = W2S(m.goalX, m.goalY); cx.strokeStyle = 'rgba(248,113,113,.55)'; cx.lineWidth = 3; cx.setLineDash([8, 6]); cx.beginPath(); cx.moveTo(gx - 9 * s, gy); cx.lineTo(gx + 9 * s, gy); cx.stroke(); cx.setLineDash([]);
  }
  function drawAim() {
    if (mom && mom.phase === 'duel') return drawDuel();
    if (mom && mom.phase === 'drive') return drawDrive();
    if (!mom || mom.phase !== 'aim') return;
    if (mom.dribble) { const [tx, ty] = W2S(mom.dribble.x, mom.dribble.y); cx.setLineDash([5, 6]); cx.strokeStyle = '#86efac'; cx.lineWidth = 2; const [mx, my] = W2S(me.x, me.y); cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(tx, ty); cx.stroke(); cx.setLineDash([]); }
    if (!mom.drag) return;
    const { dx, dy, pw } = mom.drag, [bx, by] = W2S(ball.x, ball.y), ang = Math.atan2(-dy, -dx), ok = pw >= .12;
    // rubber band from the ball to the finger
    cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 2; cx.setLineDash([4, 5]); cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(bx + dx, by + dy); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = 'rgba(255,255,255,.8)'; cx.beginPath(); cx.arc(bx + dx, by + dy, 7, 0, 7); cx.fill();
    if (!ok) { label('Daha fazla çek', bx, by - 34, '#fca5a5'); return; }
    const col = pw < .5 ? '#86efac' : pw < .8 ? '#fde047' : '#f87171', v = kickVec(ang, pw, 0, 0, false), path = simPath(v, ball.x, ball.y, 2.2, 1 / 30);
    // accuracy cone: ±1.5 SD of the direction scatter (narrows as Şut / Pas improve)
    const sig = kickSig(pw, 0, isShot(path)) * Math.PI / 180 * 1.5, cl = Math.min(260, 60 + pw * 200);
    cx.fillStyle = 'rgba(255,255,255,.10)'; cx.beginPath(); cx.moveTo(bx, by); cx.arc(bx, by, cl, ang - sig, ang + sig); cx.closePath(); cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(bx + Math.cos(ang - sig) * cl, by + Math.sin(ang - sig) * cl); cx.moveTo(bx, by); cx.lineTo(bx + Math.cos(ang + sig) * cl, by + Math.sin(ang + sig) * cl); cx.stroke();
    cx.fillStyle = col;
    path.forEach((q, i) => { if (i % 2) return; const [px, py] = W2S(q.x, q.y); cx.globalAlpha = Math.max(.15, 1 - i / path.length); cx.beginPath(); cx.arc(px, py - q.z * cam.s * .9, 3, 0, 7); cx.fill(); });
    cx.globalAlpha = 1;
    // direction arrow
    const L = 34 + pw * 70, ax = bx + Math.cos(ang) * L, ay = by + Math.sin(ang) * L;
    cx.strokeStyle = col; cx.lineWidth = 6; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(bx + Math.cos(ang) * 14, by + Math.sin(ang) * 14); cx.lineTo(ax, ay); cx.stroke();
    cx.fillStyle = col; cx.beginPath(); cx.moveTo(ax + Math.cos(ang) * 14, ay + Math.sin(ang) * 14); cx.lineTo(ax + Math.cos(ang + 2.4) * 12, ay + Math.sin(ang + 2.4) * 12); cx.lineTo(ax + Math.cos(ang - 2.4) * 12, ay + Math.sin(ang - 2.4) * 12); cx.fill();
    cx.lineWidth = 5; cx.beginPath(); cx.arc(bx, by, 22, -Math.PI / 2, -Math.PI / 2 + pw * Math.PI * 2); cx.stroke(); cx.lineCap = 'butt';
    label(`GÜÇ %${Math.round(pw * 100)}`, bx - Math.cos(ang) * 40, by - Math.sin(ang) * 40 + 2, col);
  }

  /* ---------- Behind-the-ball perspective camera (smoothly blended from the top-down view) ---------- */
  const c3 = { k: 0, tk: 0, yaw: -Math.PI / 2, bx: 34, by: 50 };
  const ease = t => t * t * (3 - 2 * t);
  function cam3() {
    const e = ease(c3.k), F = H * .92;
    const th = lerp(-Math.PI / 2, -.2, e);
    let dyw = c3.yaw + Math.PI / 2; dyw = ((dyw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; const yaw = -Math.PI / 2 + dyw * e;
    const h0 = F / cam.s, D = mom && mom.type === 'pen' ? 4.4 : 4, Hb = 1.9;
    const px = lerp(cam.x, c3.bx - Math.cos(c3.yaw) * D, e), py = lerp(cam.y, c3.by - Math.sin(c3.yaw) * D, e), pz = Math.exp(lerp(Math.log(h0), Math.log(Hb), e));
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(th), sth = Math.sin(th);
    const f = [ct * cyw, ct * syw, sth], r = [-syw, cyw, 0], u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    return { p: [px, py, pz], f, r, u, F };
  }
  const dep = (C, x, y, z) => (x - C.p[0]) * C.f[0] + (y - C.p[1]) * C.f[1] + (z - C.p[2]) * C.f[2];
  function P3(C, x, y, z) {
    const rx = x - C.p[0], ry = y - C.p[1], rz = z - C.p[2], d = rx * C.f[0] + ry * C.f[1] + rz * C.f[2];
    if (d < .15) return null;
    return [W / 2 + (rx * C.r[0] + ry * C.r[1] + rz * C.r[2]) / d * C.F, H / 2 - (rx * C.u[0] + ry * C.u[1] + rz * C.u[2]) / d * C.F, d];
  }
  const NEAR = .2;
  function seg3(C, a, b, wm = .12) {
    let da = dep(C, ...a), db = dep(C, ...b);
    if (da < NEAR && db < NEAR) return;
    if (da < NEAR) { const t = (NEAR - da) / (db - da); a = a.map((v, i) => v + (b[i] - v) * t); }
    else if (db < NEAR) { const t = (NEAR - db) / (da - db); b = b.map((v, i) => v + (a[i] - v) * t); }
    const A2 = P3(C, ...a), B2 = P3(C, ...b); if (!A2 || !B2) return;
    cx.lineWidth = Math.max(1, wm / ((A2[2] + B2[2]) / 2) * C.F); cx.beginPath(); cx.moveTo(A2[0], A2[1]); cx.lineTo(B2[0], B2[1]); cx.stroke();
  }
  function poly3(C, pts, fill) {   // ground polygon clipped against the near plane
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], da = dep(C, ...a), db = dep(C, ...b);
      if (da >= NEAR) out.push(a);
      if ((da >= NEAR) !== (db >= NEAR)) { const t = (NEAR - da) / (db - da); out.push(a.map((v, j) => v + (b[j] - v) * t)); }
    }
    if (out.length < 3) return;
    cx.fillStyle = fill; cx.beginPath(); out.forEach((q, i) => { const s2 = P3(C, ...q); if (s2) i ? cx.lineTo(s2[0], s2[1]) : cx.moveTo(s2[0], s2[1]); }); cx.fill();
  }
  function arc3(C, x0, y0, r, a0, a1, n = 28) { let prev = null; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, q = [x0 + Math.cos(a) * r, y0 + Math.sin(a) * r, 0]; if (prev) seg3(C, prev, q); prev = q; } }
  function drawPlayer3(C, p) {
    const fe = P3(C, p.x, p.y, 0), hp = P3(C, p.x, p.y, .95), sh = P3(C, p.x, p.y, 1.42), hd = P3(C, p.x, p.y, 1.7);
    if (!fe || !hd || !hp || !sh) return;
    const kit = p.team ? kitOp : kitMy, gk = p.role === 'GK', c1 = gk ? (p.team ? '#c6f432' : '#ff8a00') : kit.c1, c2 = gk ? '#222' : kit.c2;
    const w = .42 / fe[2] * C.F, ax = hd[0] - fe[0], ay = hd[1] - fe[1], len = Math.hypot(ax, ay), nx = len > 1 ? -ay / len : 1, ny = len > 1 ? ax / len : 0, sw = Math.sin(p.ph) * w * .35;
    cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(fe[0], fe[1], w * 1.2, w * 1.2 * (.25 + .75 * Math.abs(C.f[2])), 0, 0, 7); cx.fill();
    cx.strokeStyle = '#1b1b1b'; cx.lineCap = 'round'; cx.lineWidth = Math.max(2, w * .42);
    for (const sgn of [-1, 1]) { cx.beginPath(); cx.moveTo(fe[0] + nx * w * .35 * sgn + (sgn * sw) * ax / (len || 1), fe[1] + ny * w * .35 * sgn + (sgn * sw) * ay / (len || 1)); cx.lineTo(hp[0] + nx * w * .3 * sgn, hp[1] + ny * w * .3 * sgn); cx.stroke(); }
    cx.fillStyle = '#1b1b1b'; cx.beginPath(); cx.arc(hp[0], hp[1], w * .55, 0, 7); cx.fill();
    cx.strokeStyle = c1; cx.lineWidth = Math.max(3, w * 1.5); cx.beginPath(); cx.moveTo(hp[0], hp[1]); cx.lineTo(sh[0], sh[1]); cx.stroke();
    cx.fillStyle = c1; cx.beginPath(); cx.arc(sh[0], sh[1], w * .78, 0, 7); cx.fill(); cx.beginPath(); cx.arc(hp[0], hp[1], w * .74, 0, 7); cx.fill();
    cx.lineCap = 'butt';
    if (len > w * 1.5) { cx.fillStyle = gk ? '#111' : FBU.ink(c1); cx.font = `bold ${Math.max(7, w * .8)}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(p.num, (hp[0] + sh[0]) / 2, (hp[1] + sh[1]) / 2); }
    else { cx.strokeStyle = c2 === c1 ? '#fff' : c2; cx.lineWidth = Math.max(1.5, w * .14); cx.beginPath(); cx.arc(sh[0], sh[1], w * .78, 0, 7); cx.stroke(); }
    const hr = .14 / hd[2] * C.F;
    cx.fillStyle = p.user ? SKIN : FB_SKIN[(p.num * 7) % 5]; cx.beginPath(); cx.arc(hd[0], hd[1], hr, 0, 7); cx.fill();
    cx.fillStyle = p.user ? FB_HAIRC[U.look.hairC || 0] : FB_HAIRC[(p.num * 3) % 4]; cx.beginPath(); cx.arc(hd[0], hd[1] - hr * .3, hr * .85, Math.PI, 0); cx.fill();
    if (p.user) { const t = P3(C, p.x, p.y, 2.15); if (t) label(FBU.trU(U.short), t[0], t[1], '#ffd400'); }
  }
  function render3D() {
    const C = cam3();
    drawStands(-C.p[0] * 6, 0);
    poly3(C, [[-6, -6, 0], [PW + 6, -6, 0], [PW + 6, PL + 6, 0], [-6, PL + 6, 0]], '#2f8a3e');
    for (let k = 0; k < 18; k += 2) poly3(C, [[-6, k * PL / 18, 0], [PW + 6, k * PL / 18, 0], [PW + 6, (k + 1) * PL / 18, 0], [-6, (k + 1) * PL / 18, 0]], '#34963f');
    const boards = [[[-3, -4], [PW + 3, -4]], [[PW + 3, -4], [PW + 3, PL + 4]], [[PW + 3, PL + 4], [-3, PL + 4]], [[-3, PL + 4], [-3, -4]]];
    boards.forEach(([a, b], i) => poly3(C, [[a[0], a[1], 0], [b[0], b[1], 0], [b[0], b[1], 1], [a[0], a[1], 1]], i % 2 ? homeT.c1 : '#0f2a5c'));
    cx.strokeStyle = 'rgba(255,255,255,.85)';
    const L3 = (a, b, c, d) => seg3(C, [a, b, 0], [c, d, 0]);
    L3(0, 0, PW, 0); L3(PW, 0, PW, PL); L3(PW, PL, 0, PL); L3(0, PL, 0, 0); L3(0, PL / 2, PW, PL / 2);
    for (const [y0, d] of [[0, 1], [PL, -1]]) {
      L3(13.84, y0, 13.84, y0 + 16.5 * d); L3(54.16, y0, 54.16, y0 + 16.5 * d); L3(13.84, y0 + 16.5 * d, 54.16, y0 + 16.5 * d);
      L3(24.84, y0, 24.84, y0 + 5.5 * d); L3(43.16, y0, 43.16, y0 + 5.5 * d); L3(24.84, y0 + 5.5 * d, 43.16, y0 + 5.5 * d);
      arc3(C, 34, y0 + 11 * d, 9.15, d > 0 ? .93 : Math.PI + .93, d > 0 ? Math.PI - .93 : 2 * Math.PI - .93, 16);
    }
    arc3(C, 34, 52.5, 9.15, 0, Math.PI * 2, 40);
    // goals with nets
    for (const [y0, d] of [[0, -1], [PL, 1]]) {
      cx.strokeStyle = 'rgba(255,255,255,.35)';
      for (let i = 0; i <= 8; i++) { const x = GX0 + (GX1 - GX0) * i / 8; seg3(C, [x, y0 + 2 * d, 0], [x, y0 + 2 * d, GH], .02); seg3(C, [x, y0, GH], [x, y0 + 2 * d, GH], .02); }
      for (let j = 1; j <= 3; j++) { const z = GH * j / 4; seg3(C, [GX0, y0 + 2 * d, z], [GX1, y0 + 2 * d, z], .02); seg3(C, [GX0, y0, z], [GX0, y0 + 2 * d, z], .02); seg3(C, [GX1, y0, z], [GX1, y0 + 2 * d, z], .02); }
      cx.strokeStyle = '#fff'; seg3(C, [GX0, y0, 0], [GX0, y0, GH], .12); seg3(C, [GX1, y0, 0], [GX1, y0, GH], .12); seg3(C, [GX0, y0, GH], [GX1, y0, GH], .12);
    }
    // depth-sorted players + ball
    const items = ALL.map(p => ({ d: dep(C, p.x, p.y, .9), p })), bd = dep(C, ball.x, ball.y, ball.z); items.push({ d: bd, ball: true });
    const xray = c3.k > .5;
    items.sort((a, b) => b.d - a.d).forEach(it => {
      if (it.p) { if (it.p.user) { const g = P3(C, it.p.x, it.p.y, 0); if (g) { const w = .7 / g[2] * C.F; cx.strokeStyle = '#ffd400'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(g[0], g[1], w, w * (.25 + .75 * Math.abs(C.f[2])), 0, 0, 7); cx.stroke(); } } cx.globalAlpha = xray && it.d < bd + .3 ? .28 : 1; drawPlayer3(C, it.p); cx.globalAlpha = 1; return; }
      const sh = P3(C, ball.x, ball.y, 0), bp = P3(C, ball.x, ball.y, ball.z + .11);
      if (sh) { const w = .12 / sh[2] * C.F; cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(sh[0], sh[1], w, w * (.3 + .7 * Math.abs(C.f[2])), 0, 0, 7); cx.fill(); }
      if (bp) { const r = Math.max(2.5, .11 / bp[2] * C.F); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(bp[0], bp[1], r, 0, 7); cx.fill(); cx.strokeStyle = '#222'; cx.lineWidth = Math.max(1, r * .08); cx.stroke(); cx.fillStyle = '#222'; for (let k = 0; k < 3; k++) { const a = ball.spin + k * 2.1; cx.beginPath(); cx.arc(bp[0] + Math.cos(a) * r * .5, bp[1] + Math.sin(a) * r * .5, r * .28, 0, 7); cx.fill(); } }
    });
    // live trajectory preview while choosing the contact point
    if (mom && mom.phase === 'contact' && c3.k > .9) {
      const v = kickVec(mom.aim.ang, mom.aim.pw, mom.contact.x, mom.contact.y, false), path = simPath(v, ball.x, ball.y, 2.4, 1 / 30), col = '#fde047';
      cx.fillStyle = col; path.forEach((q, i) => { const s2 = P3(C, q.x, q.y, q.z + .11); if (!s2) return; cx.globalAlpha = Math.max(.2, 1 - i / path.length); cx.beginPath(); cx.arc(s2[0], s2[1], Math.max(2, .07 / s2[2] * C.F), 0, 7); cx.fill(); });
      cx.globalAlpha = 1;
    }
  }
  // Base pixels-per-metre for the top-down camera (default is a little closer than v13), scaled by the user's zoom
  function camBase() { return clamp(Math.min(W / 26, H / 19), 7.5, 24) * zoom.v; }
  // Critically damped follow (no overshoot, no jerks), frame-rate independent
  function damp(cur, target, vk, T, dt) {
    const om = 2 / T, x = om * dt, e = 1 / (1 + x + .48 * x * x + .235 * x * x * x), ch = cur - target, tmp = ((cam[vk] || 0) + om * ch) * dt;
    cam[vk] = ((cam[vk] || 0) - om * tmp) * e; return target + (ch + tmp) * e;
  }
  function render(dt) {
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    zoom.v = lerp(zoom.v, zoom.t, 1 - Math.pow(.002, dt));   // smooth zoom
    const base = camBase();
    // Framing: the focus (player or ball) sits at ~80% of the screen height, so most of the view shows the space ahead
    let fx = ball.x, fy = ball.y, ts = base * 1.15, T = .3, frame = FRAME;
    const ctl = st.mode === 'moment' && mom;
    if (ctl && mom.type === 'pen' && (mom.phase === 'setup' || mom.phase === 'aim')) { ts = base * 1.6; fx = 34; fy = 7; frame = 0; }
    else if (ctl && mom.phase === 'duel') { ts = base * 1.35; fx = (me.x + ball.x) / 2; fy = (me.y + ball.y) / 2; frame = 0; T = .4; }
    else if (ctl && mom.phase === 'drive') { ts = base * 1.45; T = .45; const pv = cam.pv || (cam.pv = { x: me.x, y: me.y }), k = dt > 0 ? 1 / dt : 0; cam.lv = { x: lerp((cam.lv || {}).x || 0, (me.x - pv.x) * k, .1), y: lerp((cam.lv || {}).y || 0, (me.y - pv.y) * k, .1) }; fx = me.x + cam.lv.x * T; fy = me.y + cam.lv.y * T; }
    else if (ctl && (mom.phase === 'setup' || mom.phase === 'aim')) { ts = base * 1.6; fx = me.x; fy = me.y; T = .35; }
    if (st.mode === 'celebrate' && st.celeb) { fx = st.celeb.p.x; fy = st.celeb.p.y; ts = base * 1.3; frame = 0; }
    if (!(ctl && mom.phase === 'drive')) cam.lv = null; cam.pv = { x: me.x, y: me.y };   // drive look-ahead state
    let tx = fx, ty = fy - frame * H / ts;
    const halfW = W / 2 / ts, halfH = H / 2 / ts;
    tx = clamp(tx, Math.min(34, halfW - 6), Math.max(34, PW - halfW + 6)); ty = clamp(ty, halfH - 12, PL - halfH + 8);
    if (c3.k === 0) { cam.x = damp(cam.x, tx, 'vx', T, dt); cam.y = damp(cam.y, ty, 'vy', T, dt); cam.s = damp(cam.s, ts, 'vs', T * 1.6, dt); }   // frozen during perspective view
    if (st.shake > 0) { cam.x += (R() - .5) * st.shake * .5; cam.y += (R() - .5) * st.shake * .5; }
    if (c3.k > 0) return render3D();
    drawPitch(); drawGoal(true); drawGoal(false);
    ALL.slice().sort((a, b) => a.y - b.y).forEach(drawPlayer);
    drawBall(); drawAim();
  }

  /* ---------- Main loop ---------- */
  let raf = 0, lastT = 0, dead = false;
  function tick(t) {
    if (dead) return; raf = requestAnimationFrame(tick);
    const dt = Math.min(.05, lastT ? (t - lastT) / 1000 : .016); lastT = t; perf += dt;
    if (!st.paused && !st.ended) update(dt);
    render(dt);
  }
  function update(dt) {
    st.shake = Math.max(0, st.shake - dt * 2.5); if (st.crowdJump > 0) st.crowdJump -= dt; st.netT = ball.inNet ? (st.netT || 0) + dt : 0;
    ALL.forEach(p => { if (p.kick > 0) p.kick -= dt; if (p.ctrl > 0) p.ctrl -= dt; if (p.stT > 0 && (p.stT -= dt) <= 0) p.st = 'run'; });
    lanesStep(dt); ballStep(dt);
    c3.k = c3.tk > c3.k ? Math.min(c3.tk, c3.k + dt / .6) : Math.max(c3.tk, c3.k - dt / .55);
    if (mom && mom.reattach && !me.lane) { mom.reattach = false; me.face = mom.aim.ang; attach(me); ball.x = me.x + Math.cos(me.face) * FOOT; ball.y = me.y + Math.sin(me.face) * FOOT; }
    if (mom && mom.phase === 'runup' && (mom.runT -= dt) <= 0) userKick(mom.aim.ang, mom.aim.pw, mom.contact.x, mom.contact.y);
    if (c3.tk === 1 && st.kickT != null) { st.kickT += dt; if ((st.kickT > 1.1 && mom && mom.res) || st.kickT > 2.3 || !mom || st.mode === 'tick') release3D(); }
    if (mom && mom.wait > 0 && (mom.wait -= dt) <= 0 && mom.finish) { const f = mom.finish; mom.finish = null; f(); }
    switch (st.mode) {
      case 'tick': tickStep(dt); idleAI(dt); break;
      case 'scene': scriptStep(dt); if (mom) stepMoment(dt); idleAI(dt); break;
      case 'moment': stepMoment(dt); idleAI(dt); break;
      case 'after': if (mom) stepMoment(dt); idleAI(dt); if ((st.afterT -= dt) <= 0 && c3.k === 0) toTicker(); break;
      case 'celebrate': {
        const c = st.celeb, cs = c.p;
        cs.lane = null; moveTo(cs, c.corner.x, c.corner.y, 6.5, dt, 1); cs.st = 'celebrate';
        T0.forEach(p => { if (p !== cs && p.role !== 'GK') moveTo(p, cs.x + Math.sin(p.num) * 2, cs.y + 1.5 + Math.cos(p.num) * 2, 6, dt, 1.2); });
        if ((st.modeT -= dt) <= 0) { cs.st = 'run'; toTicker(); }
        break;
      }
    }
    const m = Math.min(90, Math.floor(st.min)) + "'"; sbMin.textContent = m; clockEl.textContent = m;
    tlEl.textContent = st.ff ? '⏭ Sıradaki pozisyona gidiliyor…' : st.half === 2 ? '⏩ İkinci yarı' : '⏩ İlk yarı';
  }
  function halftime() {
    st.half = 2; st.mode = 'half'; FBA.play('whistle', 'long'); feed(`⏸ 45' İlk yarı sona erdi`, 'mut'); live();
    showCard(`<div class="fbm-h">Devre arası</div>${scoreLine()}<p>⭐ Reytingin ${st.rating.toFixed(1)} · ${st.us.g} gol · ${st.us.a} asist</p><button class="fbm-btn pri" data-a="h2">2. Yarı ▶</button>`);
    FBA.crowdLevel(.15);
  }
  function scoreLine() { const h = o.home ? st.sc[0] : st.sc[1], a = o.home ? st.sc[1] : st.sc[0]; return `<div class="fbm-fs">${FBT.badge(homeT, 30)}<b>${h} - ${a}</b>${FBT.badge(awayT, 30)}</div><div class="fbm-ev">${st.log.map(e => `<span>⚽ ${e.m}' ${FBU.esc(e.name)}${e.user ? ' ⭐' : ''}${e.d ? ` · ${e.d} m` : ''} <small>${FBU.esc((e.side ? o.opp : o.my).abbr)}</small></span>`).join('')}</div>`; }
  function fulltime() {
    st.ended = true; showTicker(true); FBA.play('whistle', 'end'); FBA.crowdLevel(.2); refreshRating();
    feed(`🏁 90' Maç sona erdi`, 'mut');
    showCard(`<div class="fbm-h">Maç sonu</div>${scoreLine()}<p>⭐ Reyting <b>${st.rating.toFixed(1)}</b> · ${st.us.g} gol · ${st.us.a} asist · ${st.us.sh} şut</p><button class="fbm-btn pri" data-a="end">Devam ▶</button>`);
    if (st.sc[0] > st.sc[1]) setTimeout(() => FBA.play('chant'), 600);
  }
  function result() { const r = FBU.rate(st.us, st.sc[0], st.sc[1]); return { sc: st.sc.slice(), us: { ...st.us, r }, log: st.log.slice(), shots: st.shots.slice() }; }
  // Finish the rest instantly (moments resolved from the player's attributes)
  function simRest() {
    mom = null; momEl.hidden = true;
    for (; st.evI < st.ev.length; st.evI++) {
      const e = st.ev[st.evI], m = Math.floor(e.m) + 1;
      if (e.out === 'goal') { st.sc[e.team]++; const sh = FBU.pick(SHOOTERS(e.team)), as = assistFor(e.team, sh); st.log.push({ m, side: e.team, name: sh.short, r: sh.role, a: as ? as.short : null, ar: as ? as.role : null }); }
      else if (e.out === 'moment') {
        const o2 = FBC.simMoment(e.type, A); Object.keys(o2.us).forEach(k => st.us[k] = (st.us[k] || 0) + o2.us[k]);
        if (o2.goal) { st.sc[0]++; st.log.push({ m, side: 0, name: me.short, user: true }); }
        if (o2.assist) { st.sc[0]++; const sh = FBU.pick(SHOOTERS(0)); st.log.push({ m, side: 0, name: sh.short, r: sh.role, a: me.short, ar: 'ME' }); }
      }
    }
    st.min = 90; st.log.sort((a, b) => a.m - b.m); scoreUI(); fulltime();
  }

  /* ---------- Overlays & input ---------- */
  function showCard(html) { card.innerHTML = html; ovEl.hidden = false; }
  card.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; FBA.play('ui');
    const a = b.dataset.a;
    if (a === 'h2') { ovEl.hidden = true; st.mode = 'tick'; st.hold = .5; FBA.play('whistle', 'short'); feed(`▶ 46' İkinci yarı başladı`, 'mut'); FBA.crowdLevel(.3); }
    else if (a === 'end') { ovEl.hidden = true; finish(); }
    else if (a === 'res') { ovEl.hidden = true; st.paused = false; FBA.resume(); }
    else if (a === 'sim') { ovEl.hidden = true; st.paused = false; simRest(); }
    else if (a === 'tgo') tutStart();
    else if (a === 'tdone' || a === 'tskip') { ovEl.hidden = true; if (!dead) { destroy(); o.onEnd({ tut: true, skipped: a === 'tskip' }); } }
  });
  card.addEventListener('input', e => { const k = e.target.dataset.v; if (k) FBA.setVol(k, e.target.type === 'checkbox' ? +e.target.checked : e.target.value / 100); if (e.target.dataset.z) { zoom.t = e.target.value / 100; o.onZoom && o.onZoom(zoom.t); } });
  $('.fbm-pause').onclick = () => {
    if (st.ended || st.mode === 'half' || (TUT && st.mode === 'tut')) return; st.paused = true; FBA.play('ui');
    showCard(`<div class="fbm-h">Mola</div>${scoreLine()}<div class="fbm-vol">${[['master', 'Genel ses'], ['sfx', 'Efektler'], ['crowd', 'Tribün']].map(([k, l]) => `<label>${l}<input type="range" data-v="${k}" min="0" max="100" value="${Math.round(FBA.vol[k] * 100)}"></label>`).join('')}${navigator.vibrate ? `<label class="fb-hap">Titreşim<input type="checkbox" data-v="hap" ${FBA.vol.hap ? 'checked' : ''}></label>` : ''}<label>Kamera (uzak ↔ yakın)<input type="range" data-z="1" min="${ZMIN * 100}" max="${ZMAX * 100}" value="${Math.round(zoom.t * 100)}"></label></div>
      <button class="fbm-btn pri" data-a="res">Devam ▶</button>${TUT ? '<button class="fbm-btn" data-a="tskip">Eğitimi atla</button>' : '<button class="fbm-btn" data-a="sim">⏩ Maçı hızlı bitir</button>'}`);
  };
  ffBtn.onclick = () => { if (st.mode !== 'tick') return; st.ff = true; st.hold = Math.min(st.hold, .1); FBA.play('ui'); };
  // Aim confirmed → move to the behind-the-ball view and pick the contact point
  const shotEl = $('.fbm-shot'), sbBall = $('.fbm-sb-ball'), sbDot = sbBall.querySelector('i'), fxEl = $('.fbm-sh-fx'), pwEl = $('.fbm-sh-pw');
  function describe(c) {
    const v = c.y < -.5 ? 'Aşırtma' : c.y < -.18 ? 'Yüksek vuruş' : c.y > .4 ? 'Alçak, sert vuruş' : c.y > .15 ? 'Alçak vuruş' : 'Düz vuruş';
    const h = c.x > .5 ? ' · sert sola falso' : c.x > .18 ? ' · sola falso' : c.x < -.5 ? ' · sert sağa falso' : c.x < -.18 ? ' · sağa falso' : '';
    return v + h;
  }
  function setContact(x, y) {
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    mom.contact = { x, y }; sbDot.style.left = (50 + x * 42) + '%'; sbDot.style.top = (50 - y * 42) + '%'; fxEl.textContent = describe(mom.contact);
  }
  function enterContact(ang, pw) {
    const m = mom; m.phase = 'contact'; m.aim = { ang, pw }; m.drag = null; m.dribble = null;
    ball.own = null; ball.phys = false; ball.vx = ball.vy = ball.vz = 0;   // the ball rests on its spot while the strike is set up
    // kicker steps to the side so the camera sits right behind the ball
    const lx = Math.sin(ang), ly = -Math.cos(ang);
    moveLane(me, ball.x - Math.cos(ang) * 1.1 + lx * .9, ball.y - Math.sin(ang) * 1.1 + ly * .9, .35); me.keep = true;
    c3.bx = ball.x; c3.by = ball.y; c3.yaw = ang; c3.tk = 1; st.kickT = null;
    momEl.hidden = true; shotEl.hidden = false; setContact(0, 0); pwEl.textContent = `Güç %${Math.round(pw * 100)}`;
    FBA.play('confirm');
  }
  function release3D() {
    c3.tk = 0; st.kickT = null; me.keep = false;
    const base = camBase();   // the top-down view we return to is centred on the ball
    cam.s = base * 1.15; cam.x = clamp(ball.x, 10, 58); cam.y = clamp(ball.y, 10, 95);
  }
  $('.fbm-sh-back').onclick = () => { if (!mom || mom.phase !== 'contact') return; FBA.play('back'); shotEl.hidden = true; momEl.hidden = false; c3.tk = 0; me.keep = false; mom.phase = 'aim'; me.face = mom.aim.ang; moveLane(me, ball.x - Math.cos(mom.aim.ang) * FOOT, ball.y - Math.sin(mom.aim.ang) * FOOT, .3); mom.reattach = true; };
  $('.fbm-sh-go').onclick = () => {
    if (!mom || mom.phase !== 'contact' || c3.k < .95) return;
    const a = mom.aim.ang; mom.phase = 'runup'; mom.runT = .3; shotEl.hidden = true; FBA.play('ui');
    moveLane(me, ball.x - Math.cos(a) * FOOT, ball.y - Math.sin(a) * FOOT, .3);
  };
  let sbDrag = null;
  const sbPos = e => { const r = sbBall.getBoundingClientRect(); return [((e.clientX - r.left) / r.width - .5) / .42, -((e.clientY - r.top) / r.height - .5) / .42]; };
  sbBall.addEventListener('pointerdown', e => { if (!mom || mom.phase !== 'contact') return; sbDrag = e.pointerId; try { sbBall.setPointerCapture(e.pointerId); } catch (_) {} setContact(...sbPos(e)); FBA.play('touch'); });
  sbBall.addEventListener('pointermove', e => { if (sbDrag === e.pointerId && mom && mom.phase === 'contact') setContact(...sbPos(e)); });
  sbBall.addEventListener('pointerup', () => sbDrag = null); sbBall.addEventListener('pointercancel', () => sbDrag = null);

  // Pinch to zoom: two fingers cancel any aim in progress; the zoom is remembered
  const touches = new Map(); let pinch = null, pinchUsed = false;
  cv.addEventListener('pointerdown', e => {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (mom) { mom.auto = false; mom.idle = 0; }   // any touch hands control back to the player
    if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: zoom.t }; pinchUsed = true; drag = null; if (mom) { mom.drag = null; mom.fing = null; } }
  });
  cv.addEventListener('pointermove', e => {
    if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touches.size >= 2) { const [a, b] = [...touches.values()]; zoom.t = clamp(pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0, ZMIN, ZMAX); }
  });
  cv.addEventListener('wheel', e => { e.preventDefault(); zoom.t = clamp(zoom.t * (e.deltaY < 0 ? 1.08 : .93), ZMIN, ZMAX); clearTimeout(zoom.sv); zoom.sv = setTimeout(() => o.onZoom && o.onZoom(zoom.t), 400); }, { passive: false });
  let drag = null;
  // Carry control: keep a finger on the pitch, the player runs towards it
  let steerP = null;
  const local = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointerdown', e => { if (pinchUsed || !mom || mom.phase !== 'drive') return; steerP = e.pointerId; mom.fing = local(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener('pointermove', e => { if (steerP !== e.pointerId || !mom || mom.phase !== 'drive') return; if (pinchUsed) { mom.fing = null; return; } mom.fing = local(e); });
  const steerEnd = e => { if (steerP === e.pointerId) { steerP = null; if (mom) mom.fing = null; } };
  cv.addEventListener('pointerup', steerEnd); cv.addEventListener('pointercancel', steerEnd);
  let duelP = null;
  cv.addEventListener('pointerdown', e => { if (pinchUsed || !mom || mom.phase !== 'duel') return; duelP = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() }; mom.fing = local(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener('pointermove', e => { if (!duelP || duelP.id !== e.pointerId || !mom || mom.phase !== 'duel') return; if (pinchUsed) { mom.fing = null; return; } mom.fing = local(e); });
  const duelEnd = e => {
    if (!duelP || duelP.id !== e.pointerId) return; const d = duelP; duelP = null; if (!mom || mom.phase !== 'duel') return; mom.fing = null;
    if (e.type === 'pointercancel' || pinchUsed || performance.now() - d.t > 280) return;   // a hold just moves
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.hypot(dx, dy) > 28) return slideTackle(Math.atan2(dy, dx));   // flick: slide in that direction
    const r = cv.getBoundingClientRect(), wx = (e.clientX - r.left - W / 2) / cam.s + cam.x, wy = (e.clientY - r.top - H / 2) / cam.s + cam.y;
    slideTackle(Math.atan2(wy - me.y, wx - me.x));   // tap: slide towards the tapped spot
  };
  cv.addEventListener('pointerup', duelEnd); cv.addEventListener('pointercancel', duelEnd);
  const canAim = () => mom && mom.phase === 'aim' && !mom.res && ball.own === me && c3.k === 0;
  const AIM_LEN = () => Math.min(W, H) * .38;
  cv.addEventListener('pointerdown', e => { if (!canAim() || pinchUsed || touches.size > 1) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now() }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id || !mom || pinchUsed) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) < 10) return; mom.drag = { dx, dy, pw: clamp(Math.hypot(dx, dy) / AIM_LEN(), 0, 1) }; });
  cv.addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (pinchUsed) { if (mom) mom.drag = null; return; }
    if (!canAim()) { if (mom) mom.drag = null; return; }
    const dx = e.clientX - d.x, dy = e.clientY - d.y, moved = Math.hypot(dx, dy);
    if (moved < 10) {   // tap = dribble towards the tapped spot (never a shot)
      if (mom.type === 'fk' || mom.type === 'pen' || performance.now() - d.t > 450) return;
      const r = cv.getBoundingClientRect(), wx = (e.clientX - r.left - W / 2) / cam.s + cam.x, wy = (e.clientY - r.top - H / 2) / cam.s + cam.y, l = Math.hypot(wx - me.x, wy - me.y) || 1, len = Math.min(7, l);
      mom.dribble = { x: clamp(me.x + (wx - me.x) / l * len, 1, 67), y: clamp(me.y + (wy - me.y) / l * len, 1, 104) }; mom.drag = null; return;
    }
    const pw = clamp(moved / AIM_LEN(), 0, 1); mom.drag = null;
    if (pw < .12) { pop('Daha uzun çek', '#fca5a5'); return; }   // too short: nothing happens
    enterContact(Math.atan2(-dy, -dx), pw);
  });
  cv.addEventListener('pointercancel', () => { drag = null; if (mom) mom.drag = null; });
  const pinchEnd = e => { touches.delete(e.pointerId); if (touches.size < 2 && pinch) { pinch = null; o.onZoom && o.onZoom(zoom.t); } if (!touches.size) pinchUsed = false; };
  cv.addEventListener('pointerup', pinchEnd); cv.addEventListener('pointercancel', pinchEnd);

  function finish() { if (dead) return; const r = result(); destroy(); o.onEnd(r); }
  function destroy() { dead = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); FBA.stopCrowd(); }
  window.addEventListener('resize', resize);
  resize(); scoreUI(); refreshRating(); attach(T0.find(p => p.role === 'ST' && p !== me) || T0[6]);
  if (TUT) { showTicker(false); FBA.crowdLevel(.12); tutCard('⚽ Antrenman sahası', TUT_STEPS[0], `<p class="fbm-tutn">4 kısa ders · her dersi geçince sıradakine geçersin</p><button class="fbm-btn pri" data-a="tgo">Başla ▶</button>`); }
  else { feed(o.resume ? `⏯ ${Math.floor(st.min)}. dakikadan devam ediliyor` : `▶ 1' Hakem başlama düdüğünü çaldı`, 'mut'); FBA.play('whistle', 'long'); FBA.crowdLevel(.3); }
  raf = requestAnimationFrame(tick);
  return { _cam: cam, _wh: () => [W, H], _all: ALL, _zoom: zoom, _gk: GK1, _step: dt => update(dt), _c3: c3, _kv: kickVec, _sim: simPath, _setContact: (x, y) => setContact(x, y), _enterContact: enterContact, destroy, pause() { if (!st.ended && !st.paused) $('.fbm-pause').click(); }, _st: st, _simRest: simRest, get mom() { return mom; }, _kick: userKick, _me: me, _ball: ball, _enter: enterScene, _slide: slideTackle, get tut() { return TUT; } };
}
