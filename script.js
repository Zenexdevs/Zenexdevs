/* =============================================================================
   ZENEX MODS — v3 "AURORA"
   Vanilla JS. No dependencies, no build step.
   Every module bails out cleanly if its markup isn't on the page,
   so this one file serves every page on the site.
   ============================================================================= */

'use strict';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Utility: throttle a callback to one call per animation frame */
function rafThrottle(fn) {
  let queued = false;
  return function (...args) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn.apply(this, args);
    });
  };
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  // Each module runs isolated: if one ever throws, the rest still initialise.
  // Losing a tilt effect should never take the download buttons down with it.
  [
    initLoader, initPageTransitions, initScrollProgress, initCursor, initRipples,
    initSparkField, initNavToggle, initNavScroll, initNavPill, initActiveSection,
    initHeroWords, initReveal, initCounters, initTilt, initSpotlight, initMagnetic,
    initHeroPanel, initTicker, initFaq, initTermsNav, initDownloads,
    initCopyButtons, initFilters, initBackToTop, initYear
  ].forEach(fn => {
    try { fn(); } catch (err) { console.error(`[zenex] ${fn.name} failed:`, err); }
  });
});

/* -----------------------------------------------------------------------------
   LOADER
   Full animation on the first visit of a tab session, quick pass afterwards.
   -------------------------------------------------------------------------- */
function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  const fill = $('#loader-fill');
  const seen = sessionStorage.getItem('zenexSeen') === '1';
  const duration = REDUCED ? 120 : (seen ? 320 : 1250);
  const start = performance.now();

  function finish() {
    loader.classList.add('hidden');
    document.body.classList.add('ready');
    sessionStorage.setItem('zenexSeen', '1');
    setTimeout(() => { loader.style.display = 'none'; }, 750);
  }

  function tick(now) {
    const pct = Math.min(100, ((now - start) / duration) * 100);
    // ease-out so the bar decelerates into place
    const eased = 100 * (1 - Math.pow(1 - pct / 100, 2.2));
    if (fill) fill.style.width = eased + '%';
    if (pct < 100) requestAnimationFrame(tick);
    else finish();
  }
  requestAnimationFrame(tick);

  // Hard safety net — never trap the page behind the loader.
  setTimeout(finish, 3500);
}

/* -----------------------------------------------------------------------------
   PAGE TRANSITIONS
   Fades out before same-origin navigations. Skips downloads, new tabs,
   hash links, and modifier-clicks so nothing breaks.
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  if (REDUCED) return;

  const veil = document.createElement('div');
  veil.className = 'page-veil';
  document.body.appendChild(veil);

  // Clear the veil when arriving via the back button (bfcache restore).
  window.addEventListener('pageshow', () => veil.classList.remove('active'));

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest('a');
    if (!link) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    if (link.getAttribute('href')?.startsWith('#')) return;

    let url;
    try { url = new URL(link.href); } catch { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;

    e.preventDefault();
    veil.classList.add('active');
    setTimeout(() => { location.href = link.href; }, 300);
    // If navigation stalls for any reason, lift the veil again.
    setTimeout(() => veil.classList.remove('active'), 2600);
  });
}

/* -----------------------------------------------------------------------------
   SCROLL PROGRESS BAR
   -------------------------------------------------------------------------- */
function initScrollProgress() {
  const fill = $('#scroll-progress-fill');
  if (!fill) return;

  const update = rafThrottle(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    fill.style.width = pct + '%';
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* -----------------------------------------------------------------------------
   CUSTOM CURSOR — dot snaps, ring trails with easing
   -------------------------------------------------------------------------- */
function initCursor() {
  if (!FINE_POINTER || REDUCED) return;

  const dot = $('#cursor-dot');
  const ring = $('#cursor-ring');
  if (!dot || !ring) return;

  let rx = innerWidth / 2, ry = innerHeight / 2;
  let tx = rx, ty = ry;

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    dot.classList.add('on');
    ring.classList.add('on');
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    dot.classList.remove('on');
    ring.classList.remove('on');
  });

  (function loop() {
    rx += (tx - rx) * 0.16;
    ry += (ty - ry) * 0.16;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  })();

  const HOT = 'a, button, .surface, input, [role="button"]';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(HOT)) ring.classList.add('hot');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest(HOT)) ring.classList.remove('hot');
  });
}

/* -----------------------------------------------------------------------------
   CLICK RIPPLE — on a pointer-events:none layer, so it never blocks clicks
   -------------------------------------------------------------------------- */
function initRipples() {
  if (REDUCED) return;

  const layer = document.createElement('div');
  layer.className = 'ripple-layer';
  document.body.appendChild(layer);

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    layer.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }, { passive: true });
}

/* -----------------------------------------------------------------------------
   SPARK FIELD — drifting aurora dust on canvas
   Particles rise slowly, flicker, and drift away from the cursor.
   -------------------------------------------------------------------------- */
function initSparkField() {
  const canvas = $('#spark-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999, on: false };

  const PALETTE = [
    [123, 97, 255],   // violet
    [0, 223, 196],    // aqua
    [255, 77, 141],   // rose
    [190, 175, 255],  // pale violet
    [255, 255, 255]   // white
  ];

  let w = 0, h = 0, particles = [];

  function makeParticle(fromBottom) {
    const tone = PALETTE[(Math.random() * PALETTE.length) | 0];
    return {
      x: Math.random() * w,
      y: fromBottom ? h + Math.random() * 60 : Math.random() * h,
      r: Math.random() * 1.9 + 0.5,
      vy: -(Math.random() * 0.34 + 0.1),
      vx: (Math.random() - 0.5) * 0.16,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.012 + 0.004,
      swayAmp: Math.random() * 0.4 + 0.12,
      flick: Math.random() * Math.PI * 2,
      flickSpeed: Math.random() * 0.035 + 0.012,
      alpha: Math.random() * 0.42 + 0.16,
      color: tone,
      glow: Math.random() < 0.4
    };
  }

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Scale count with viewport, capped so low-end devices stay smooth.
    const count = Math.min(110, Math.max(28, Math.floor((w * h) / 17000)));
    particles = Array.from({ length: count }, () => makeParticle(false));
  }

  const REPEL_R = 130;
  const REPEL_F = 0.55;

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.flick += p.flickSpeed;
      const flick = 0.55 + Math.sin(p.flick) * 0.45;
      const a = p.alpha * flick;
      const radius = p.r * (0.75 + flick * 0.45);
      const [r, g, b] = p.color;

      let vx = p.vx;
      if (mouse.on) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < REPEL_R && d > 0.01) {
          const force = (1 - d / REPEL_R) * REPEL_F;
          vx += (dx / d) * force;
        }
      }

      ctx.beginPath();
      if (p.glow) {
        ctx.shadowBlur = radius * 5;
        ctx.shadowColor = `rgba(${r},${g},${b},${a * 0.85})`;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (!REDUCED) {
        p.sway += p.swaySpeed;
        p.x += vx + Math.sin(p.sway) * p.swayAmp * 0.06;
        p.y += p.vy;
        if (p.y < -30) Object.assign(p, makeParticle(true));
        if (p.x < -30) p.x = w + 30;
        if (p.x > w + 30) p.x = -30;
      }
    }

    if (!REDUCED) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', rafThrottle(resize));

  if (FINE_POINTER && !REDUCED) {
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
    }, { passive: true });
    document.addEventListener('mouseleave', () => { mouse.on = false; });
  }

  draw();
}

/* -----------------------------------------------------------------------------
   MOBILE NAV — full-screen overlay, staggered links, scroll lock
   -------------------------------------------------------------------------- */
function initNavToggle() {
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  if (!toggle || !links) return;

  $$('a', links).forEach((a, i) => a.style.setProperty('--i', i));

  function close() {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('open', !open);
    document.body.style.overflow = !open ? 'hidden' : '';
  });

  $$('a', links).forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* -----------------------------------------------------------------------------
   NAVBAR SCROLL STATE
   -------------------------------------------------------------------------- */
function initNavScroll() {
  const nav = $('#navbar');
  if (!nav) return;
  const onScroll = rafThrottle(() => nav.classList.toggle('scrolled', window.scrollY > 16));
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* -----------------------------------------------------------------------------
   NAV PILL — a sliding highlight that follows hover, resting on the active link
   -------------------------------------------------------------------------- */
function initNavPill() {
  const wrap = $('#nav-links');
  if (!wrap || window.innerWidth <= 920) return;

  const pill = document.createElement('span');
  pill.className = 'nav-pill';
  wrap.appendChild(pill);

  const links = $$('a', wrap);
  if (!links.length) return;

  function moveTo(el) {
    if (!el) return;
    pill.style.width = el.offsetWidth + 'px';
    pill.style.transform = `translateX(${el.offsetLeft}px)`;
  }

  function restToActive() {
    const active = wrap.querySelector('a.active');
    if (active) {
      moveTo(active);
      pill.classList.add('pinned');
    } else {
      pill.classList.remove('pinned');
    }
  }

  links.forEach(link => link.addEventListener('mouseenter', () => {
    pill.classList.add('pinned');
    moveTo(link);
  }));

  wrap.addEventListener('mouseleave', restToActive);
  window.addEventListener('resize', rafThrottle(restToActive));

  // Wait a frame so fonts/layout have settled before measuring.
  requestAnimationFrame(() => requestAnimationFrame(restToActive));
}

/* -----------------------------------------------------------------------------
   ACTIVE SECTION HIGHLIGHTING (homepage anchors)
   -------------------------------------------------------------------------- */
function initActiveSection() {
  const navLinks = $$('.nav-links a[data-nav]');
  if (!navLinks.length || !('IntersectionObserver' in window)) return;

  const sections = navLinks
    .map(l => document.getElementById(l.dataset.nav))
    .filter(Boolean);
  if (!sections.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.nav === entry.target.id));
      const pill = $('.nav-pill');
      const active = $('.nav-links a.active');
      if (pill && active && !$('.nav-links:hover')) {
        pill.style.width = active.offsetWidth + 'px';
        pill.style.transform = `translateX(${active.offsetLeft}px)`;
        pill.classList.add('pinned');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => io.observe(s));
}

/* -----------------------------------------------------------------------------
   HERO WORD SPLIT — each word rises out of its own clipping mask
   -------------------------------------------------------------------------- */
function initHeroWords() {
  const targets = $$('[data-split]');
  if (!targets.length) return;

  let index = 0;
  targets.forEach(el => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines.map(line => {
      const words = line.trim().split(/\s+/).filter(Boolean).map(word => {
        const html = `<span class="word-wrap"><span class="word" style="--wi:${index}">${word}</span></span>`;
        index++;
        return html;
      }).join(' ');
      return `<span class="line">${words}</span>`;
    }).join('');
  });

  // If the loader already finished, make sure the words still animate in.
  if (document.body.classList.contains('ready')) return;
  setTimeout(() => document.body.classList.add('ready'), 1400);
}

/* -----------------------------------------------------------------------------
   SCROLL REVEAL — staggered, unobserved once shown
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in'));
    return;
  }

  // Auto-stagger siblings inside grids/lists that didn't set --d by hand.
  $$('[data-stagger]').forEach(group => {
    $$('.reveal', group).forEach((el, i) => {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', i);
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  items.forEach(el => io.observe(el));

  // Safety net: content must never stay stuck at opacity 0. If anything above
  // the fold hasn't revealed shortly after load, show it regardless.
  setTimeout(() => {
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 1200);
}

/* -----------------------------------------------------------------------------
   ANIMATED COUNTERS
   -------------------------------------------------------------------------- */
function initCounters() {
  const nums = $$('[data-count]');
  if (!nums.length) return;

  function run(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = (el.dataset.count.split('.')[1] || '').length;

    if (REDUCED || !isFinite(target)) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    const duration = 1500;
    const start = performance.now();

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    nums.forEach(run);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  nums.forEach(el => io.observe(el));
}

/* -----------------------------------------------------------------------------
   3D TILT ON CARDS
   -------------------------------------------------------------------------- */
function initTilt() {
  if (!FINE_POINTER || REDUCED) return;

  const MAX = 5.5;

  $$('.tilt').forEach(card => {
    let raf = null;
    let tRX = 0, tRY = 0, cRX = 0, cRY = 0;
    let hovering = false;

    function apply() {
      cRX += (tRX - cRX) * 0.14;
      cRY += (tRY - cRY) * 0.14;
      const lift = hovering ? -7 : 0;
      card.style.transform =
        `perspective(1000px) rotateX(${cRX}deg) rotateY(${cRY}deg) translateY(${lift}px)`;

      if (hovering || Math.abs(cRX) > 0.02 || Math.abs(cRY) > 0.02) {
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
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tRY = px * MAX * 2;
      tRX = -py * MAX * 2;
    });

    card.addEventListener('mouseleave', () => {
      hovering = false;
      tRX = 0; tRY = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  });
}

/* -----------------------------------------------------------------------------
   CURSOR SPOTLIGHT ON CARDS
   -------------------------------------------------------------------------- */
function initSpotlight() {
  if (!FINE_POINTER) return;

  $$('.surface').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });
}

/* -----------------------------------------------------------------------------
   MAGNETIC BUTTONS — a light pull toward the cursor
   -------------------------------------------------------------------------- */
function initMagnetic() {
  if (!FINE_POINTER || REDUCED) return;

  $$('[data-magnetic]').forEach(el => {
    const STRENGTH = 0.28;

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * STRENGTH;
      const y = (e.clientY - r.top - r.height / 2) * STRENGTH;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });

    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* -----------------------------------------------------------------------------
   HERO PANEL — cycles a highlight through the mod rows
   -------------------------------------------------------------------------- */
function initHeroPanel() {
  const rows = $$('.panel-row');
  if (rows.length < 2 || REDUCED) return;

  let i = 0;
  setInterval(() => {
    rows.forEach(r => r.classList.remove('lit'));
    rows[i].classList.add('lit');
    i = (i + 1) % rows.length;
  }, 2000);
}

/* -----------------------------------------------------------------------------
   TICKER — duplicate the track so the marquee loops seamlessly
   -------------------------------------------------------------------------- */
function initTicker() {
  const track = $('.ticker-track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
}

/* -----------------------------------------------------------------------------
   FAQ ACCORDION
   -------------------------------------------------------------------------- */
function initFaq() {
  const items = $$('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const q = $('.faq-q', item);
    if (!q) return;

    q.addEventListener('click', () => {
      const open = item.classList.contains('open');

      // Close the others so only one answer is open at a time.
      items.forEach(other => {
        if (other === item) return;
        other.classList.remove('open');
        $('.faq-q', other)?.setAttribute('aria-expanded', 'false');
      });

      item.classList.toggle('open', !open);
      q.setAttribute('aria-expanded', String(!open));
    });
  });
}

/* -----------------------------------------------------------------------------
   TERMS PAGE SCROLLSPY
   -------------------------------------------------------------------------- */
function initTermsNav() {
  const links = $$('.terms-nav a');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const sections = links
    .map(l => document.getElementById(l.getAttribute('href').slice(1)))
    .filter(Boolean);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-18% 0px -72% 0px', threshold: 0 });

  sections.forEach(s => io.observe(s));
}

/* -----------------------------------------------------------------------------
   DOWNLOAD BUTTONS
   The original download behaviour is unchanged — each button still triggers a
   real download from its data-download-url. Everything here is feedback only.
   -------------------------------------------------------------------------- */
function initDownloads() {
  const buttons = $$('.mod-download[data-download-url]');
  if (!buttons.length) return;

  const toast = $('#toast');
  const toastText = $('#toast-text');
  let toastTimer = null;

  function showToast(msg) {
    if (!toast || !toastText) return;
    toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = btn.dataset.downloadUrl;
      const filename = btn.dataset.filename || 'download';
      if (!url) return;

      // Ripple from the exact click point
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--rx', (e.clientX - r.left) + 'px');
      btn.style.setProperty('--ry', (e.clientY - r.top) + 'px');
      btn.classList.remove('rippling');
      void btn.offsetWidth;
      btn.classList.add('rippling');

      // Trigger the actual download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();

      btn.classList.remove('pulse');
      void btn.offsetWidth;
      btn.classList.add('pulse', 'done');

      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(() => btn.classList.remove('done'), 2600);

      const label =
        btn.dataset.modName ||
        btn.closest('.mod-card, .release-card')?.querySelector('.mod-name, h3')?.textContent?.trim() ||
        'Download';
      showToast(`${label} — download started`);
    });
  });
}

/* -----------------------------------------------------------------------------
   COPY-TO-CLIPBOARD (version numbers)
   -------------------------------------------------------------------------- */
function initCopyButtons() {
  const buttons = $$('[data-copy]');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    const original = btn.querySelector('.copy-label');

    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for browsers/contexts without the async clipboard API
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { /* give up quietly */ }
        ta.remove();
      }

      btn.classList.add('copied');
      if (original) original.textContent = 'Copied';
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => {
        btn.classList.remove('copied');
        if (original) original.textContent = 'Copy';
      }, 1600);
    });
  });
}

/* -----------------------------------------------------------------------------
   DOWNLOADS PAGE — search + category filter
   -------------------------------------------------------------------------- */
function initFilters() {
  const search = $('#release-search');
  const chips = $$('.chip[data-filter]');
  const cards = $$('.release-card[data-tags]');
  const empty = $('#filter-empty');

  if (!cards.length || (!search && !chips.length)) return;

  let activeFilter = 'all';
  let query = '';

  function apply() {
    let visible = 0;

    cards.forEach(card => {
      const tags = (card.dataset.tags || '').toLowerCase();
      const text = card.textContent.toLowerCase();
      const matchesFilter = activeFilter === 'all' || tags.includes(activeFilter);
      const matchesQuery = !query || text.includes(query) || tags.includes(query);
      const show = matchesFilter && matchesQuery;

      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });

    empty?.classList.toggle('show', visible === 0);
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => {
        c.classList.toggle('active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      activeFilter = chip.dataset.filter;
      apply();
    });
  });

  search?.addEventListener('input', () => {
    query = search.value.trim().toLowerCase();
    apply();
  });

  apply();
}

/* -----------------------------------------------------------------------------
   BACK TO TOP
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const btn = $('#to-top');
  if (!btn) return;

  const onScroll = rafThrottle(() => btn.classList.toggle('show', window.scrollY > 600));
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  });
}

/* -----------------------------------------------------------------------------
   FOOTER YEAR
   -------------------------------------------------------------------------- */
function initYear() {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
}
