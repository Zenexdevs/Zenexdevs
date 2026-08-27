# Zenex Mods — Website

A fully static site (HTML/CSS/JS only — no build step, no backend, no database) with a clean, minimalist dark theme and a lime/yellow-green accent. Ready to host directly on **GitHub Pages**.

## What's inside

```
index.html    Main page (Home, Fabric API notice, Downloads, Discord, Footer)
style.css     All styling (theme, layout, animations, responsive rules)
script.js     Particle background, nav behavior, scroll reveal, download effect
images/       Favicon, OG banner
fonts/        (empty — site currently uses Google Fonts via CDN link)
assets/       (reserved for any extra static assets you add)
```

All mod and Discord icons are inline SVG directly in `index.html` — there are no icon image files that can ever show up broken.

## How to publish on GitHub Pages

1. **Create a repository** named exactly `zenexmods.github.io` under your `zenexmods` GitHub account (this exact naming pattern is required for a *user/org* Pages site to be served at the root domain). If you'd rather use a project repo (e.g. `zenex-mods`), that works too — the site's relative paths work either way.
2. **Upload all the files in this ZIP** to the root of that repository (keep the folder structure).
3. Commit and push (or use the GitHub web uploader: **Add file → Upload files**, drag in everything, then **Commit changes**).
4. Go to **Settings → Pages** in the repo.
5. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
6. Wait 1–2 minutes for the site to go live.

## Editing content

- **Download links**: each download button in `index.html` is a `<button class="mod-download">` with a `data-download-url` attribute — just change the URL to update where it downloads from. `data-filename` controls the suggested filename.
- **Mod descriptions/icons**: each mod card is an `<article class="mod-card">` block — swap the SVG in `.mod-icon` or edit the text directly.
- **Fabric API card**: lives in the `#fabric` section, separate from the mod grid as requested — edit its link/copy directly there.
- **Discord / YouTube links**: appear in the hero, the Discord section, and the footer.
- **Colors**: all colors are CSS variables at the top of `style.css` under `:root` — change `--lime`, `--bg`, etc. to retheme the whole site in one place.

## Notes on the Google Drive download links

Google Drive's `uc?export=download` links work well for smaller files, but Drive can occasionally show an interstitial "can't scan this file for viruses" confirmation page for larger files instead of downloading directly — this is a Google-side limitation, not something the site controls. If that becomes an issue, consider hosting the `.jar` files directly in this repo (e.g. in an `assets/downloads/` folder) and pointing `data-download-url` at the relative path instead.

## Notes

- The particle background is drawn with a `<canvas>` in `script.js` — lightweight, no external libraries. Particles drift on their own and gently get pushed away from the cursor (soft repulsion within ~140px), plus a lagging radial "cursor glow" layer follows the pointer for depth.
- Mod cards, the Fabric API card, and the Discord card have a subtle magnetic 3D tilt that follows the cursor position within each card (desktop with a mouse only — disabled on touch and when `prefers-reduced-motion` is set).
- The download button now has a full interaction sequence on click: a ripple expands from the exact click point, the button pulses, then flips to a glowing "Downloaded ✓" state for ~2 seconds, alongside a toast confirmation in the corner.
- All of the above automatically no-ops on touch devices and for users with `prefers-reduced-motion` enabled — the site stays fully usable and instant for them, just without the extra motion.
- Fonts (`Space Grotesk`, `Inter`) load from Google Fonts via CDN. Self-host by dropping `.woff2` files into `fonts/` if preferred.
