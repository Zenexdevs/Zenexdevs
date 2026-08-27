// =========================================================
// Zenex Mods — Site Scripts
// Vanilla JS, no dependencies, no build step.
// =========================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initParticleField();
  initCursorGlow();
  initNavToggle();
  initNavbarScroll();
  initScrollReveal();
  initStagger();
  initYear();
  initDownloadButtons();
  initTiltCards();
});

/* ---------- Mouse-reactive particle field ---------- */
// Particles drift slowly on their own, and are gently pushed away from
// the cursor (soft repulsion) for a "field reacting to you" feel.
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
    const count = Math.min(70, Math.floor((width * height) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseVx: (Math.random() - 0.5) * 0.15,
      baseVy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.6 + 0.6,
      alpha: Math.random() * 0.35 + 0.15
    }));
  }

  const REPEL_RADIUS = 140;
  const REPEL_STRENGTH = 0.55;

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(198, 255, 94, ${0.06 * (1 - dist / 130)})`;
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
      ctx.fillStyle = `rgba(198, 255, 94, ${p.alpha})`;
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

/* ---------- Soft cursor-following glow ---------- */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || !isFinePointer || prefersReducedMotion) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  function loop() {
    // Smooth lag (lerp) so the glow trails the cursor elegantly
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    glow.classList.add('active');
  }, { passive: true });

  window.addEventListener('pointerleave', () => glow.classList.remove('active'));

  requestAnimationFrame(loop);
}

/* ---------- Magnetic tilt on cards ---------- */
// Gives mod cards / fabric card / discord card a subtle 3D tilt that
// follows the cursor position within the card bounds.
function initTiltCards() {
  if (!isFinePointer || prefersReducedMotion) return;

  const cards = document.querySelectorAll('.tilt');
  const MAX_TILT = 6; // degrees

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
        `perspective(800px) rotateX(${curRX}deg) rotateY(${curRY}deg) translateY(${lift}px)`;
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

      // Position the ripple at the click point
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
      btn.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
      btn.classList.remove('rippling');
      void btn.offsetWidth; // restart animation
      btn.classList.add('rippling');

      // Trigger the actual file download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Micro-interaction: pulse + swap to success state
      btn.classList.remove('pulse');
      void btn.offsetWidth;
      btn.classList.add('pulse', 'downloaded');

      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(() => {
        btn.classList.remove('downloaded');
      }, 2200);

      // Toast confirmation
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
