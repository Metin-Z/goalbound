/* ===================== GOALBOUND — standalone shell: fullscreen, effects, mounting ===================== */
'use strict';
// Real visible height (iOS Safari toolbars, address bar, rotation): kept in --app-h for the host
const STANDALONE = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches));
if (STANDALONE) document.documentElement.classList.add('standalone');
function fitApp() { const h = (window.visualViewport && visualViewport.height) || window.innerHeight; document.documentElement.style.setProperty('--app-h', Math.round(h) + 'px'); }
fitApp(); addEventListener('resize', fitApp); addEventListener('orientationchange', () => { fitApp(); setTimeout(fitApp, 350); });
if (window.visualViewport) visualViewport.addEventListener('resize', fitApp);
// iPhone Safari has no Fullscreen API for pages: explain the closest thing (Add to Home Screen opens it full screen)
function iosTip() {
  if (document.querySelector('.ios-tip')) return;
  const d = document.createElement('div'); d.className = 'ios-tip';
  d.innerHTML = 'iPhone Safari sayfaların tam ekran açılmasına izin vermiyor. Tam ekran için: <b>Paylaş ⬆️ → Ana Ekrana Ekle</b>, sonra oyunu ana ekrandaki GOALBOUND simgesinden aç.<button>Tamam</button>';
  d.querySelector('button').onclick = () => d.remove(); document.body.appendChild(d);
}
// Toggle browser fullscreen (silently ignored where the browser blocks it)
function fsToggle() {
  const d = document, el = d.documentElement;
  try {
    if (d.fullscreenElement || d.webkitFullscreenElement) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
    const req = el.requestFullscreen || el.webkitRequestFullscreen; if (!req) { if (!STANDALONE) iosTip(); return; }
    const p = req.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}
document.addEventListener('fullscreenchange', () => document.querySelectorAll('[data-t="fs"]').forEach(b => b.textContent = document.fullscreenElement ? '🗗' : '⛶'));
// Screen effects (confetti, floating text, shake) — same implementation as in Oyun Durağı
const JUICE = (() => {
  const cv = document.createElement('canvas'); cv.id = 'fxc'; document.body.appendChild(cv);
  const c = cv.getContext('2d'); let parts = [], raf = 0, last = 0;
  const R = Math.min(2, devicePixelRatio || 1);
  function fit() { cv.width = innerWidth * R; cv.height = innerHeight * R; }
  fit(); addEventListener('resize', fit);
  function loop(t) {
    const dt = Math.min(.05, last ? (t - last) / 1000 : .016); last = t;
    c.setTransform(R, 0, 0, R, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => (p.life -= dt) > 0);
    for (const p of parts) {
      p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      const a = Math.min(1, p.life / p.max * 1.6); c.globalAlpha = a; c.fillStyle = p.col;
      c.save(); c.translate(p.x, p.y); c.rotate(p.r);
      if (p.sh === 'c') { c.beginPath(); c.arc(0, 0, p.s / 2, 0, 7); c.fill(); } else c.fillRect(-p.s / 2, -p.s * .3, p.s, p.s * (p.sh === 'r' ? .6 : 1));
      c.restore();
    }
    c.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(loop); else { raf = 0; last = 0; c.clearRect(0, 0, innerWidth, innerHeight); }
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const PAL = ['#ffd400', '#7c5cff', '#22d3ee', '#22c55e', '#f97316', '#ef4444', '#f472b6'];
  return {
    at(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; },
    // Radial burst of sparks
    burst(x, y, o = {}) {
      const n = o.n || 14, cols = o.colors || PAL;
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, sp = (o.spd || 240) * (.35 + Math.random() * .8); parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 60), g: o.g ?? 520, drag: .985, s: (o.size || 6) * (.6 + Math.random() * .7), r: Math.random() * 6, vr: (Math.random() - .5) * 12, col: cols[i % cols.length], life: (o.life || .7) * (.7 + Math.random() * .5), max: o.life || .7, sh: o.shape || 'c' }); }
      if (parts.length > 600) parts.splice(0, parts.length - 600);
      kick();
    },
    confetti() {
      if (FBU.calm) return;   // respect reduced motion
      for (let i = 0; i < 120; i++) parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .3, vx: (Math.random() - .5) * 120, vy: 80 + Math.random() * 160, g: 140, drag: .995, s: 7 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * 10, col: PAL[i % PAL.length], life: 2.6 + Math.random(), max: 3, sh: 'r' });
      kick();
    },
    float(x, y, text, col = '#fff', size = 18) {
      const d = document.createElement('div'); d.className = 'flt'; d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.color = col; d.style.fontSize = size + 'px';
      document.body.appendChild(d); setTimeout(() => d.remove(), 950);
    },
    shake(el, k = 1) { if (!el || FBU.calm) return; el.style.setProperty('--sk', (4 * k) + 'px'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); },
    bump(el, cls = 'bump') { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  };
})();
// Boot: mount the game into the full-screen host
window.addEventListener('DOMContentLoaded', () => {
  try { Futbol(document.getElementById('app')); }
  catch (e) { console.error(e); document.getElementById('app').innerHTML = '<p style="padding:24px">GOALBOUND başlatılamadı: ' + String(e.message).replace(/</g, '&lt;') + '</p>'; }
});
