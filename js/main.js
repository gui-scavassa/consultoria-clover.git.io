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

/* ---------- 5. Hero intro timeline ---------- */
function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero [data-hero]', {
    yPercent: 115,
    duration: 1,
    stagger: 0.09,
  })
  .from('.hero-actions > *', { y: 24, opacity: 0, duration: .7, stagger: .1 }, '-=0.4')
  .from('.hero-meta .stat', { y: 20, opacity: 0, duration: .6, stagger: .08 }, '-=0.5');

  // parallax orbs
  gsap.to('.hero-orb.a', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-orb.b', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- 6. Scroll reveals ---------- */
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

/* ---------- 8. FAQ accordion ---------- */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((other) => {
        if (other !== item) { other.classList.remove('open'); other.querySelector('.faq-a').style.maxHeight = null; }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = isOpen ? null : a.scrollHeight + 'px';
    });
  });
}

/* ---------- 9. Magnetic buttons ---------- */
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

/* ---------- 10. Contact form (demo) ---------- */
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
  initFAQ();
  initForm();

  // Animation layer — only if GSAP/ScrollTrigger loaded
  if (ANIM) {
    initSmoothScroll();
    initHero();
    initReveals();
    initCounters();
    initMagnetic();
    // refresh after fonts load to fix trigger positions
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
});
