const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover)').matches;

// reveal with stagger
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => {
  const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.transitionDelay = (sibs.indexOf(el) % 6) * 0.08 + 's';
  io.observe(el);
});

// nav state + progress + steps line
const nav = document.getElementById('nav'), bar = document.getElementById('progress'), steps = document.getElementById('steps');
let tick = false;
function onScroll() {
  const h = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  nav.classList.toggle('scrolled', scrollY > 20);
  if (steps) {
    const r = steps.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.3), 0), 1);
    steps.style.setProperty('--p', p.toFixed(3));
  }
  tick = false;
}
addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// counters
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const el = e.target, end = +el.dataset.count, t0 = performance.now(); cio.unobserve(el);
  if (reduce) { el.textContent = end; return; }
  const step = (t) => { const p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}), { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

// terminal typing
const term = document.getElementById('term');
const lines = [
  ['c', '# ลูกค้า: "อยากได้เว็บองค์กร 2 ภาษา แก้ข้อมูลเองได้"'],
  ['g', '$ ', 'w', 'monica plan --client=acme'],
  ['b', '✔ ', 'w', 'Scope: 6 หน้า · TH/EN · PDPA · LINE'],
  ['b', '✔ ', 'w', 'Timeline: 2 สัปดาห์'],
  ['g', '$ ', 'w', 'monica build --stack=wordpress'],
  ['y', '⚡ ', 'w', 'PageSpeed 96 · Mobile ready'],
  ['g', '$ ', 'w', 'monica deploy --ssl --backup'],
  ['b', '✔ ', 'w', 'Live! พร้อมดูแลรายเดือน 🚀'],
];
function render(done, partial) {
  const html = lines.slice(0, done).map(fmt).join('\n') + (partial != null ? (done ? '\n' : '') + partial : '');
  term.innerHTML = html + '<span class="cur"></span>';
}
function fmt(l) { let s = ''; for (let i = 0; i < l.length; i += 2) s += `<span class="${l[i]}">${l[i + 1]}</span>`; return s; }
async function typeAll() {
  if (reduce) { render(lines.length); return; }
  while (true) {
    for (let i = 0; i < lines.length; i++) {
      const full = fmt(lines[i]);
      const plain = lines[i].filter((_, k) => k % 2).join('');
      for (let c = 1; c <= plain.length; c++) {
        // build partial with same coloring
        let left = c, out = '';
        for (let k = 0; k < lines[i].length && left > 0; k += 2) { const t = lines[i][k + 1].slice(0, left); out += `<span class="${lines[i][k]}">${t}</span>`; left -= t.length; }
        render(i, out); await sleep(lines[i][0] === 'c' ? 18 : 28);
      }
      render(i + 1); await sleep(lines[i][1] === '$ ' ? 380 : 260);
    }
    await sleep(3200); render(0);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (term) typeAll();

// tilt + spotlight
if (fine && !reduce) {
  document.querySelectorAll('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
      el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  // magnetic buttons
  document.querySelectorAll('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
  // cursor glow
  const g = document.getElementById('cursorGlow');
  addEventListener('pointermove', (e) => { g.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`; }, { passive: true });
}

// network canvas
(() => {
  const c = document.getElementById('net'); if (!c || reduce) return;
  const ctx = c.getContext('2d'); let w, h, pts = [], mouse = { x: -999, y: -999 }, raf, visible = true;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(Math.round(w * h / 16000), 90);
    pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 120) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) { ctx.strokeStyle = `rgba(52,245,160,${(1 - d / 130) * .35})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      ctx.fillStyle = 'rgba(120,255,200,.8)'; ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 1.6, 0, 6.283); ctx.fill();
    }
    raf = visible ? requestAnimationFrame(draw) : null;
  }
  size(); draw();
  addEventListener('resize', size);
  c.parentElement.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  c.parentElement.addEventListener('pointerleave', () => { mouse = { x: -999, y: -999 }; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) draw(); }).observe(c);
})();

document.getElementById('year').textContent = new Date().getFullYear();
