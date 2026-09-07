// =========================================================
// Zenex Mods v2 — Site Scripts
// Vanilla JS, no dependencies, no build step.
// =========================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initScrollProgress();
  initCustomCursor();
  initGlobalClickRipple();
  initParticleField();
  initNavToggle();
  initNavbarScroll();
  initActiveNav();
  initScrollReveal();
  initStagger();
  initYear();
  initDownloadButtons();
  initTiltCards();
  initCardSpotlight();
  initFaqAccordion();
  initTermsNav();
});

/* ---------- FAQ accordion ---------- */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ---------- Terms page: highlight section nav on scroll ---------- */
function initTermsNav() {
  const navLinks = document.querySelectorAll('.terms-nav a');
  if (!navLinks.length || !('IntersectionObserver' in window)) return;

  const sections = Array.from(navLinks)
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const setActive = (id) => {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ---------- Loading screen ---------- */
// Full animated loader on first visit this session; near-instant on
// subsequent page loads within the same tab session.
function initLoader() {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loader-fill');
  if (!loader) return;

  const seenThisSession = sessionStorage.getItem('zenexLoaded') === '1';
  const duration = seenThisSession ? 250 : 1100;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const pct = Math.min(100, (elapsed / duration) * 100);
    if (fill) fill.style.width = `${pct}%`;
    if (pct < 100) {
      requestAnimationFrame(tick);
    } else {
      loader.classList.add('hidden');
      sessionStorage.setItem('zenexLoaded', '1');
      setTimeout(() => { loader.style.display = 'none'; }, 550);
    }
  }
  requestAnimationFrame(tick);
}

/* ---------- Scroll progress bar ---------- */
function initScrollProgress() {
  const fill = document.getElementById('scroll-progress-fill');
  if (!fill) return;
  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    fill.style.width = `${pct}%`;
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ---------- Custom cursor ---------- */
function initCustomCursor() {
  if (!isFinePointer || prefersReducedMotion) return;
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let ringX = window.innerWidth / 2, ringY = window.innerHeight / 2;
  let targetX = ringX, targetY = ringY;

  window.addEventListener('pointermove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    dot.classList.add('active');
    ring.classList.add('active');
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    dot.classList.remove('active');
    ring.classList.remove('active');
  });

  function loop() {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const hoverTargets = 'a, button, .tilt, input, select, textarea, [role="button"]';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.add('hover');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.remove('hover');
  });
}

/* ---------- Global click ripple ---------- */
// A single delegated pointerdown listener creates a short-lived ripple
// element at the exact click point, on a pointer-events:none overlay
// layer so it never blocks the actual click/navigation underneath.
function initGlobalClickRipple() {
  if (prefersReducedMotion) return;

  const layer = document.createElement('div');
  layer.className = 'click-ripple-layer';
  document.body.appendChild(layer);

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return; // left-click / touch only
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    layer.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, { passive: true });
}

/* ---------- Mouse-reactive particle field ---------- */
function initParticleField() {
  const canvas = document.getElementById('field-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let width, height;
  const mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(64, Math.floor((width * height) / 24000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseVx: (Math.random() - 0.5) * 0.14,
      baseVy: (Math.random() - 0.5) * 0.14,
      r: Math.random() * 1.5 + 0.6,
      alpha: Math.random() * 0.3 + 0.12,
      warm: Math.random() < 0.14
    }));
  }

  const REPEL_RADIUS = 140;
  const REPEL_STRENGTH = 0.55;

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(143, 212, 188, ${0.05 * (1 - dist / 130)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      let vx = p.baseVx;
      let vy = p.baseVy;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.01) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          vx += (dx / dist) * force;
          vy += (dy / dist) * force;
        }
      }

      ctx.beginPath();
      ctx.fillStyle = p.warm
        ? `rgba(255, 160, 106, ${p.alpha})`
        : `rgba(171, 157, 137, ${p.alpha * 0.8})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (!prefersReducedMotion) {
        p.x += vx;
        p.y += vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
    }

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);

  if (isFinePointer && !prefersReducedMotion) {
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });
    window.addEventListener('pointerleave', () => { mouse.active = false; });
  }

  requestAnimationFrame(draw);
  if (prefersReducedMotion) draw();
}

/* ---------- Magnetic tilt on cards ---------- */
function initTiltCards() {
  if (!isFinePointer || prefersReducedMotion) return;

  const cards = document.querySelectorAll('.tilt');
  const MAX_TILT = 5; // degrees

  cards.forEach(card => {
    let raf = null;
    let targetRX = 0, targetRY = 0;
    let curRX = 0, curRY = 0;
    let hovering = false;

    function apply() {
      curRX += (targetRX - curRX) * 0.15;
      curRY += (targetRY - curRY) * 0.15;
      const lift = hovering ? -6 : 0;
      card.style.transform =
        `perspective(900px) rotateX(${curRX}deg) rotateY(${curRY}deg) translateY(${lift}px)`;
      if (hovering || Math.abs(curRX) > 0.02 || Math.abs(curRY) > 0.02) {
        raf = requestAnimationFrame(apply);
      } else {
        card.style.transform = '';
        raf = null;
      }
    }

    card.addEventListener('mouseenter', () => {
      hovering = true;
      if (!raf) raf = requestAnimationFrame(apply);
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      targetRY = px * MAX_TILT * 2;
      targetRX = -py * MAX_TILT * 2;
    });

    card.addEventListener('mouseleave', () => {
      hovering = false;
      targetRX = 0;
      targetRY = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  });
}

/* ---------- Cursor-following spotlight highlight on cards ---------- */
function initCardSpotlight() {
  if (!isFinePointer) return;
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });
}

/* ---------- Mobile nav toggle ---------- */
function initNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    });
  });
}

/* ---------- Navbar background on scroll ---------- */
function initNavbarScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Active section highlighting in nav ---------- */
function initActiveNav() {
  const sections = ['home', 'downloads', 'fabric', 'discord']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const navLinks = document.querySelectorAll('.nav-links a[data-nav]');
  if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

  const setActive = (id) => {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-nav') === id);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ---------- Reveal-on-scroll ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
}

/* ---------- Stagger index for grid entrance animation ---------- */
function initStagger() {
  document.querySelectorAll('.card-grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.style.setProperty('--stagger', i);
    });
  });
}

/* ---------- Footer year ---------- */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Download buttons: ripple + glow + success state + toast ---------- */
// Original download functionality is fully preserved: each button still
// triggers a real download via its data-download-url — only the visual
// feedback layer is new.
function initDownloadButtons() {
  const buttons = document.querySelectorAll('.mod-download');
  const toast = document.getElementById('download-toast');
  const toastText = document.getElementById('toast-text');
  let toastTimer = null;

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = btn.getAttribute('data-download-url');
      const filename = btn.getAttribute('data-filename') || 'download';
      if (!url) return;

      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
      btn.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
      btn.classList.remove('rippling');
      void btn.offsetWidth;
      btn.classList.add('rippling');

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      btn.classList.remove('pulse');
      void btn.offsetWidth;
      btn.classList.add('pulse', 'downloaded');

      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(() => {
        btn.classList.remove('downloaded');
      }, 2200);

      if (toast && toastText) {
        const modName = btn.closest('.mod-card')?.querySelector('.mod-name')?.textContent || 'File';
        toastText.textContent = `${modName} download started`;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
      }
    });
  });
}
