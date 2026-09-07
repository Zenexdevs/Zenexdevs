# Zenex Mods — v2 (Premium Redesign)

A ground-up visual redesign of the existing Zenex Mods site. Still pure HTML/CSS/vanilla JS — no build step, no backend — and every existing download link, Discord/YouTube link, and Fabric API link is unchanged. Only the look and interaction layer changed.

## What's new

**Design system** — dark obsidian background (`#05070a`) with a two-color accent system: **electric cyan** as the primary interactive color (buttons, links, hover glows, mod icons) and **warm amber** reserved for two "this matters" moments — the Fabric API requirement and the Latest badge — so it reads as intentional rather than decorative.

**Loading screen** — a short branded loader (~1.1s) plays on a visitor's first page load each browser session, then gets out of the way; returning within the same session (`sessionStorage`) skips straight to a near-instant flash instead of repeating the full animation.

**Mouse-reactive background** — a canvas particle field drifts on its own and gently repels away from the cursor, plus three slow-drifting glow blobs and a faint grid/noise texture for depth.

**Custom cursor** — a small glowing dot plus a lagging outer ring on desktop, which expands over any clickable element. Automatically disabled on touch devices and under `prefers-reduced-motion`.

**Global click ripple** — every click or tap anywhere on the page (buttons, cards, nav, empty background) spawns a small ring/glow at the exact click point on a `pointer-events: none` overlay layer, so it's purely decorative and never intercepts clicks. Skipped entirely under `prefers-reduced-motion`.

**Scroll progress bar** — a thin cyan-to-amber bar at the very top of the page fills as you scroll.

**Active-section nav highlighting** — the nav link for whichever section is in view lights up automatically via `IntersectionObserver`.

**Cards** — mod cards, the Fabric API card, and the Discord card now have: a magnetic 3D tilt that follows the cursor, a soft "spotlight" highlight that tracks the cursor position, glowing borders on hover, and staggered fade-up entrance animations as they scroll into view.

**Featured mod** — Meteor Client is now visually distinct: a wider "featured" card with its own badge, stronger glow, and more prominent layout. Rigmaster v7 carries a "Latest" badge in the secondary amber color.

**Download button** — clicking still triggers the exact same download (verified against the original `data-download-url` values) — now with a ripple expanding from the click point, a spring pulse, and a glowing "Downloaded ✓" state for ~2 seconds, plus a toast confirmation.

Everything above automatically scales back or turns off under `prefers-reduced-motion: reduce`, and the custom cursor / tilt / spotlight effects are skipped entirely on touch devices — the site stays fully usable and fast either way.

## What's inside

```
index.html    Full page markup (loader, nav, hero, Fabric API, downloads, Discord, footer)
style.css     Complete design system + all animation/interaction styles
script.js     Loader, cursor, ripple, particle field, tilt, spotlight, nav, reveal, downloads
images/       Favicon, OG banner
fonts/        (empty — uses Google Fonts via CDN)
assets/       (reserved for extra static assets)
```

## Publishing

Same as before — this is a drop-in replacement for your existing GitHub Pages repo:

1. Copy all files in this ZIP into the root of your `Zenexdevs` repository, overwriting the existing `index.html`, `style.css`, and `script.js`.
2. Commit and push (or use **Add file → Upload files** on GitHub and commit).
3. Pages will redeploy automatically within a minute or two — no settings changes needed since the site structure and relative paths are unchanged.

## Editing content

Nothing about how you edit content has changed:

- **Download links**: each `<button class="mod-download">` has a `data-download-url` — change the URL there.
- **Badges**: `<span class="mod-badge mod-badge-featured">` / `mod-badge-latest` — move, remove, or add these to any card.
- **Colors**: everything flows from the CSS variables at the top of `style.css` (`--cyan`, `--amber`, `--bg`, etc.) — change them once to retheme the whole site.
- **Discord / YouTube / Fabric API links**: same locations as before (hero isn't linked directly, but Discord section, footer, and the Fabric card carry them).

## A note on the Google Drive links

Same caveat as before: Drive's `uc?export=download` links can occasionally show a virus-scan interstitial for larger files instead of downloading immediately — a Google-side limitation. If that becomes an issue, consider hosting the `.jar` files directly in the repo and pointing `data-download-url` at the relative path instead.
