/* =========================================================
   MOLIOR — Interactions & Animations
   Lenis smooth scroll + GSAP + ScrollTrigger
   ========================================================= */

/* Fail-safe: if the GSAP/ScrollTrigger CDN didn't load, leave all content
   visible and skip animations entirely — never show a blank page. */
const ANIM = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
if (ANIM) {
  document.documentElement.classList.add('gsap-ready');
  gsap.registerPlugin(ScrollTrigger);
}

/* ---------- 1. Lenis smooth scroll ---------- */
let lenis;
function initSmoothScroll() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links route through lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const el = document.querySelector(id);
        if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80 }); }
      }
    });
  });
}

/* ---------- 2. Navbar behaviour ---------- */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && menu) {
    const close = () => {
      toggle.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    };
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  }
}

/* ---------- 3. Scroll progress bar ---------- */
function initProgress() {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = p + '%';
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- 4. Hero intro timeline ---------- */
function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero [data-hero]', {
    yPercent: 115,
    duration: 1,
    stagger: 0.09,
  })
  .from('.hero-actions > *', { y: 24, opacity: 0, duration: .7, stagger: .1 }, '-=0.4');

}

/* ---------- 5. Scroll reveals ---------- */
function initReveals() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = gsap.utils.toArray('[data-reveal]');

  items.forEach((el) => {
    if (reduce) { el.classList.add('is-visible'); return; }
    const delay = parseFloat(el.dataset.reveal) || 0;
    gsap.fromTo(el,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onStart: () => el.classList.add('is-visible'),
      }
    );
  });

  // staggered groups
  gsap.utils.toArray('[data-reveal-group]').forEach((group) => {
    const kids = group.children;
    if (reduce) return;
    gsap.from(kids, {
      opacity: 0, y: 40, duration: .8, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: group, start: 'top 82%', once: true },
    });
  });
}

/* ---------- 5b. Hero mock scroll (scale + tilt) ---------- */
function initHeroScroll() {
  const mock = document.querySelector('.hero-mock');
  if (!mock) return;
  gsap.fromTo(mock,
    { y: 60, scale: .94, rotateX: 9, transformPerspective: 1400, transformOrigin: 'center top' },
    { y: 0, scale: 1, rotateX: 0, ease: 'none',
      scrollTrigger: { trigger: mock, start: 'top 92%', end: 'top 30%', scrub: true } }
  );
}


/* ---------- Image deck (auto-cycle every 2s + fan on hover) ----------
   Pure CSS/JS — no GSAP dependency, runs even if animations are off.   */
function initDeck() {
  const deck = document.querySelector('[data-deck]');
  if (!deck) return;
  const stage = deck.querySelector('.deck-stage');
  const cards = Array.from(stage.querySelectorAll('.deck-card'));
  const n = cards.length;
  if (!n) return;

  let order = cards.map((_, i) => i);    // stacked order; order[0] = top
  let fanned = false;
  let front = Math.floor((n - 1) / 2);   // which card is at the front while fanned
  let timer = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const depthTransform = (d) => {
    const rot = d === 0 ? 0 : (d % 2 ? d * 2.2 : -d * 2.2);
    return `translateY(${d * 9}px) translateX(${d * 4}px) scale(${1 - d * 0.05}) rotate(${rot}deg)`;
  };

  // Stacked state — looks like a deck of cards
  const stack = () => {
    order.forEach((idx, depth) => {
      const c = cards[idx];
      c.style.transform = depthTransform(depth);
      c.style.zIndex = String(n - depth);
      c.style.opacity = '1';
    });
  };

  // Fanned carousel — LINEAR (com início e fim, não circular): the `front`
  // card is centered & raised; the others keep their natural left→right
  // sequence and fan out by their real distance from it. So selecting the
  // left-most card brings it to the centre and pushes the rest to the right.
  const fan = () => {
    cards.forEach((c, i) => {
      const off = i - front;                 // <0 = à esquerda, 0 = centro, >0 = à direita
      const a = Math.abs(off);
      const sc = off === 0 ? 0.96 : 0.82;
      c.style.transform =
        `translateX(${off * 12}%) translateY(${a * 7}px) rotate(${off * 9}deg) scale(${sc})`;
      c.style.zIndex = String(30 - a);
      c.style.opacity = '1';
    });
  };

  // Shuffle: send the top card down into the deck, promote the next one
  const cycle = () => {
    if (fanned) return;
    const top = cards[order[0]];
    top.style.transform = depthTransform(n - 1);
    top.style.opacity = '0';
    top.style.zIndex = '0';
    setTimeout(() => {
      order.push(order.shift());
      stack();
      top.style.opacity = '1';
    }, 430);
  };

  const start = () => { if (!timer && !reduce) timer = setInterval(cycle, 2000); };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  const openFan = () => { fanned = true; stop(); front = Math.floor((n - 1) / 2); fan(); };
  const closeFan = () => { fanned = false; stack(); start(); };

  stage.addEventListener('mouseenter', openFan);
  stage.addEventListener('mouseleave', closeFan);

  // Hover / click a card while fanned -> bring it to the front (carousel slide)
  cards.forEach((c, i) => {
    const bringToFront = () => { if (fanned && front !== i) { front = i; fan(); } };
    c.addEventListener('mouseenter', bringToFront);
    c.addEventListener('click', bringToFront);
  });

  stack();
  start();
}

/* ---------- 6. Editorial Ticker — driven purely by scroll position ----------
   Rows move only when the visitor scrolls. Odd rows go left, even go right.
   Content loops seamlessly (modulo half-width) so it never runs out.       */
function initTicker() {
  const rows = document.querySelectorAll('.ticker-row');
  if (!rows.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // px of translateX per px scrolled — different per row for parallax feel
  const speeds = [0.28, 0.40, 0.22, 0.34];
  const dirs   = Array.from(rows).map(r => parseInt(r.dataset.tickerDir) || -1);
  let halves   = null; // cached half-widths (recomputed after fonts load)

  const compute = () => {
    halves = Array.from(rows).map(row => {
      const inner = row.querySelector('.ticker-inner');
      return inner ? inner.scrollWidth / 2 : 1;
    });
  };

  const update = () => {
    if (!halves) compute();
    const raw = window.scrollY;
    rows.forEach((row, i) => {
      const inner = row.querySelector('.ticker-inner');
      if (!inner) return;
      const hw  = halves[i];
      const dist = raw * speeds[i % speeds.length];
      // Left rows: 0 → -hw → loop; right rows: -hw → 0 → loop (both seamless)
      const offset = dirs[i] === -1
        ? -(dist % hw)
        : (dist % hw) - hw;
      inner.style.transform = `translateX(${offset}px)`;
    });
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  // Recompute after fonts settle (avoids wrong scrollWidth on first paint)
  if (document.fonts) document.fonts.ready.then(() => { halves = null; update(); });
}

/* ---------- 7. Count-up stats ---------- */
function initCounters() {
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(obj, {
        v: target, duration: 1.8, ease: 'power2.out',
        onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; },
      }),
    });
  });
}

/* ---------- 8. Magnetic buttons ---------- */
function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(el, { x: x * 0.3, y: y * 0.4, duration: .6, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,0.4)' }));
  });
}

/* ---------- 9. Horizontal scroll gallery — maps vertical scroll → translateX ----------
   The .hscroll-container height is set dynamically so 1px vertical = 1px horizontal.
   Works with Lenis (dispatches native scroll events) and plain scroll.                */
function initHorizontalScroll() {
  const container = document.querySelector('[data-hscroll]');
  if (!container) return;
  const gallery = container.querySelector('.hscroll-gallery');
  if (!gallery) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gallery.style.flexWrap = 'wrap';
    gallery.style.padding = 'var(--gutter)';
    return;
  }

  const getGap = () => parseFloat(getComputedStyle(gallery).gap) || 24;
  const getDist = () => {
    const items = Array.from(gallery.children);
    if (!items.length) return 0;
    return (items.length - 1) * (items[0].offsetWidth + getGap());
  };

  const setHeight = () => {
    const dist = getDist();
    const items = Array.from(gallery.children);
    const nGaps = items.length - 1;
    if (nGaps <= 0) { container.style.height = '100vh'; return; }
    // Cap vertical scroll so each card takes max 50 % of vh — prevents locked feeling on desktop
    const perCard = Math.min(dist / nGaps, Math.max(200, window.innerHeight * 0.5));
    container.style.height = `calc(100vh + ${Math.round(nGaps * perCard)}px)`;
  };

  const update = () => {
    const rect = container.getBoundingClientRect();
    const scrollable = container.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
    gallery.style.transform = `translateX(${-progress * getDist()}px)`;
  };

  setHeight();
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => { setHeight(); update(); }, { passive: true });

  // Cards fall in from above (simulating dropping from the deck above)
  if (ANIM) {
    const items = gallery.querySelectorAll('.hscroll-item');
    gsap.from(items, {
      y: 80,
      opacity: 0,
      scale: 0.92,
      stagger: 0.13,
      duration: 1.1,
      ease: 'power4.out',
      clearProps: 'transform,translate,rotate,scale',
      scrollTrigger: {
        trigger: container,
        start: 'top 88%',
        once: true,
      },
    });
  }
}

/* ---------- 10. Contact form → Google Forms (posts to a hidden iframe) ----------
   The form submits natively (action -> Google Forms formResponse) targeting a
   hidden iframe, so the page never leaves. We only surface the success state
   and clear the fields AFTER the browser has serialized/sent the values.      */
function initForm() {
  const form = document.querySelector('.form');
  if (!form) return;
  const ok = form.querySelector('.form-success');
  form.addEventListener('submit', () => {
    // Runs only when native (required) validation passed.
    if (ok) ok.classList.add('show');
    setTimeout(() => form.reset(), 400);                      // after values are sent
    setTimeout(() => ok && ok.classList.remove('show'), 6000);
  });
}

/* ---------- 11. Hero beams — diagonal light-ray animation (Molior theme) ---------- */
function initHeroFlow() {
  const canvas = document.getElementById('hero-flow');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const hero = canvas.closest('.hero');
  const dpr = window.devicePixelRatio || 1;
  const mobile = () => window.innerWidth < 768;

  let width = 0, height = 0, animId = 0, beams = [];

  function mkBeam() {
    const isPurple = Math.random() < 0.7;
    return {
      x:         Math.random() * width  * 1.5 - width  * 0.25,
      y:         Math.random() * height * 1.5 - height * 0.25,
      width:     30  + Math.random() * 60,
      length:    height * 2.5,
      angle:     -35 + Math.random() * 10,
      speed:     0.6 + Math.random() * 1.2,
      opacity:   0.38 + Math.random() * 0.32,
      hue:       isPurple ? 240 + Math.random() * 25 : 38 + Math.random() * 14,
      isPurple,
      pulse:     Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    };
  }

  function resetBeam(b, i) {
    const col = i % 3, gap = width / 3;
    const isPurple = Math.random() < 0.7;
    b.y        = height + 100;
    b.x        = col * gap + gap / 2 + (Math.random() - 0.5) * gap * 0.5;
    b.width    = 100 + Math.random() * 100;
    b.speed    = 0.5 + Math.random() * 0.4;
    b.hue      = isPurple ? 240 + Math.random() * 25 : 38 + Math.random() * 14;
    b.isPurple = isPurple;
    b.opacity  = 0.45 + Math.random() * 0.25;
  }

  function drawBeam(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle * Math.PI / 180);

    const op  = b.opacity * (0.8 + Math.sin(b.pulse) * 0.2);
    const sat = b.isPurple ? '85%' : '95%';
    const lit = b.isPurple ? '55%' : '58%';
    const h   = b.hue;

    const g = ctx.createLinearGradient(0, 0, 0, b.length);
    g.addColorStop(0,   `hsla(${h},${sat},${lit},0)`);
    g.addColorStop(0.1, `hsla(${h},${sat},${lit},${op * 0.5})`);
    g.addColorStop(0.4, `hsla(${h},${sat},${lit},${op})`);
    g.addColorStop(0.6, `hsla(${h},${sat},${lit},${op})`);
    g.addColorStop(0.9, `hsla(${h},${sat},${lit},${op * 0.5})`);
    g.addColorStop(1,   `hsla(${h},${sat},${lit},0)`);

    ctx.fillStyle = g;
    ctx.fillRect(-b.width / 2, 0, b.width, b.length);
    ctx.restore();
  }

  function resize() {
    width  = hero ? hero.offsetWidth  : window.innerWidth;
    height = hero ? hero.offsetHeight : window.innerHeight;
    canvas.width  = Math.round(width  * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = mobile() ? 15 : 30;
    beams = Array.from({ length: count }, mkBeam);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.filter = mobile() ? 'blur(8px)' : 'blur(22px)';

    beams.forEach((b, i) => {
      b.y     -= b.speed;
      b.pulse += b.pulseSpeed;
      if (b.y + b.length < -100) resetBeam(b, i);
      drawBeam(b);
    });

    animId = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  render();

  if (typeof IntersectionObserver !== 'undefined' && hero) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!animId) render(); }
      else { cancelAnimationFrame(animId); animId = 0; }
    }, { threshold: 0 }).observe(hero);
  }
}

/* ---------- Boot ---------- */
window.addEventListener('DOMContentLoaded', () => {
  // Always run — no GSAP dependency
  initNav();
  initProgress();
  initForm();
  initDeck();
  initTicker();
  initHeroFlow();
  initHorizontalScroll();

  // Animation layer — only if GSAP/ScrollTrigger loaded
  if (ANIM) {
    initSmoothScroll();
    initHero();
    initHeroScroll();
    initReveals();
    initCounters();
    initMagnetic();
    // refresh after fonts load to fix trigger positions
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
});
