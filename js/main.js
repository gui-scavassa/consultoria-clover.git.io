/* =========================================================
   CLOVER CORPORATION — Interactions & Animations
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

  // parallax orbs
  gsap.to('.hero-orb.a', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-orb.b', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
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

/* ---------- 5c. Parallax drift ---------- */
function initParallax() {
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax) || 0.12;
    gsap.fromTo(el, { yPercent: amount * 100 }, {
      yPercent: -amount * 100, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ---------- 5d. Image reveal (scale + fade) ---------- */
function initImageReveal() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.utils.toArray('[data-img-reveal]').forEach((el) => {
    if (reduce) { el.style.opacity = 1; return; }
    const inner = el.querySelector('.shot-inner') || el;
    gsap.set(el, { opacity: 0, y: 44 });
    gsap.set(inner, { scale: 1.16 });
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
        gsap.to(inner, { scale: 1, duration: 1.3, ease: 'power3.out' });
      },
    });
  });
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

/* ---------- 6. Count-up stats ---------- */
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

/* ---------- 7. Magnetic buttons ---------- */
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

/* ---------- 8. Contact form (demo) ---------- */
function initForm() {
  const form = document.querySelector('.form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = form.querySelector('.form-success');
    if (ok) ok.classList.add('show');
    form.querySelectorAll('input, textarea, select').forEach((f) => { f.value = ''; });
    setTimeout(() => ok && ok.classList.remove('show'), 6000);
  });
}

/* ---------- Boot ---------- */
window.addEventListener('DOMContentLoaded', () => {
  // Always run — no GSAP dependency
  initNav();
  initProgress();
  initForm();
  initDeck();

  // Animation layer — only if GSAP/ScrollTrigger loaded
  if (ANIM) {
    initSmoothScroll();
    initHero();
    initHeroScroll();
    initReveals();
    initParallax();
    initImageReveal();
    initCounters();
    initMagnetic();
    // refresh after fonts load to fix trigger positions
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
});
