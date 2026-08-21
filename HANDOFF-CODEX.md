# Handoff for Codex — audit request

## ARTEMIS ORBIT — third-party component integration (2026-08-20)

`radial-orbital-timeline.tsx` (supplied by salma) now drives the `#ecosystem`
section: **Artemis at the centre, the six operating domains orbiting it.**

### Setup notes

Project already satisfied shadcn + Tailwind v4 + TS; components live at
`/components/ui` matching the `@/components/ui` alias. Only `@radix-ui/react-slot`
was missing — installed. Added `badge.tsx`, `button.tsx`, `card.tsx` verbatim.

**`src/index.css` gained an `@theme` block.** The shadcn primitives reference
`bg-primary`, `bg-card`, `border-input`, `ring-ring` etc., and the file was bare
`@import "tailwindcss"` with no tokens — those utilities would not have existed.
They are mapped to the `--brand-*` palette so shadcn components render on-brand.

### Second React root

`index.html`'s `.ecosystem-stage` static constellation was replaced with
`<div class="ecosystem-stage" id="artemis-orbit-root">`, and `src/main.tsx` now
mounts a **second** root there. The site therefore has two React islands: the
hero and the orbit.

The old `[data-ecosystem-domain]` handlers in `script.js` are now inert — they
query an empty NodeList and the readout lookup is null-guarded, so it is safe,
but that block is dead code and a refactor candidate.

### Four deliberate deviations from the supplied component

1. **Theme** — original is `bg-black h-screen` with a purple/blue/teal gradient
   core. Kept the Artemis surface and `--brand-*`; violet is reserved for the
   core only, per `pages/home.md`.
2. **Accessibility** — original nodes are `<div onClick>`, unreachable by
   keyboard. Now `<button>` with `aria-expanded` / `aria-label`.
   Verified: 6 nodes focusable, Enter opens the panel.
3. **Motion** — original rotates via `setInterval(50ms)` writing React state:
   20 re-renders/second, forever, ignoring reduced-motion. Now rAF-driven and
   written straight to the DOM via refs, so idle orbiting causes **zero
   re-renders**, and it stops completely under reduced motion.
   Verified: static under `reducedMotion: 'reduce'`, rotating otherwise.
4. **Responsive** — original hard-codes `radius = 200`. Now derived from a
   `ResizeObserver` on the container. Verified 0/6 nodes escape the stage at
   1440 / 768 / 375.

### One UX fix beyond the brief

The original renders a detail card from each node at `top-20`, which **covered
the Artemis core** — the subject of the section. The card is now a single panel
anchored at the base of the stage, and the orbit lifts 52px while it is open so
the lower nodes' labels stay readable.

### Verified after integration

Perf **16.7ms median (60fps)** with 25 animations running — unchanged budget.
375/768/1024/1440: 0 overflow, 0 console errors, nav + modal + focus intact.
Hero collisions 0. Contrast 8.12:1. Build and `tsc -b` clean.

---

## BACKGROUND UNIFICATION + PERF RESOLUTION (2026-08-20, post-audit)

salma asked for one background tone matching the top of the page. Sections had
been stepping through lighter navies (#071126, #060d1c, #0a1831, #0b1b35,
#050b19, #050a15, #030812) while the hero sat at rgb(5,7,13) — visible banding.
**Every surface is now `--brand-void`**, with a 1px hairline between sections so
the rhythm stays readable.

### This resolved the open performance finding

With all sections opaque, `.site-glow-horizon` is fully occluded. Proven rather
than assumed — and the naive test was misleading:

| Test | Result | Meaning |
|---|---|---|
| Hide whole layer (`display:none`) | 1.35% pixels differ | **Misleading** |
| Hide layer, grain also off | 1.35% | Not the grain |
| Inspect worst pixel | rgb(228,232,241) vs (227,238,255) | It is **glyph edges** |
| Keep layer, hide only artwork | **0.0004%** (92 / 20,842,560 px) | Artwork paints nothing |

Removing a fixed layer changes compositing, which shifts **text antialiasing**
across the page. That is what the 1.35% was. Isolating the artwork while keeping
the layer gives the true answer.

So its arcs/glows/sparks were animating something invisible — and they were the
largest frame cost measured. Disabled via `animation: none` on `.site-glow`,
`.site-horizon-arc`, `.site-horizon-spark`:

**Frame median 50.0ms (~20fps) → 16.7ms (60fps)**, now identical to the
zero-animation control, with all 27 remaining animations running.

The element and its flat base colour are retained, so the DOM and stacking
context are unchanged. **Reversible:** if any section is ever made translucent
again, delete that block to bring the glow back. The hero's `GlowHorizonFM` and
the ecosystem stage's `horizon-*` animations are untouched — those are visible.

### Post-change state

375/768/1024/1440: 0 overflow, 0 console errors, nav + modal + focus intact.
Hero collisions 0 at seven widths. Motion 27 running / 0 errors. Reduced motion:
0 running **and 0 pixels of movement** between t=350ms and t=3000ms.
Contrast 8.12:1. `styles.css` 113.99 kB → now includes the unification block.

---

## AUDIT RESPONSE (2026-08-20, after Codex review)

All four findings addressed. Codex was right on finding 1 and my claim was wrong.

**1. Reduced motion — CONFIRMED BUG, FIXED.** `GlowHorizonFM` and `AnimatedTitleFM`
had unconditional `initial`/`animate`/`transition`. Reproduced exactly as reported:
0 anims at 300ms, **9 at 500ms, 12 at 1200ms**, back to 0 by 3000ms.

*Why I got this wrong:* my test sampled once at ~3000ms — after the entrance
animations had already finished — and I reported that 0 as proof. A single late
sample cannot prove absence of motion. **Test over a timeline, not at one instant.**

Fixed with `useReducedMotion()` in both components (rendering straight to final
state). New proof method, which is stronger than counting animations:
screenshot at t=350ms and t=3000ms under `reducedMotion: 'reduce'` and diff them —
**0/1,296,000 pixels changed. Nothing moves.**

Note: `document.getAnimations()` still lists ~10 `tab-size`/`border-width`
CSSTransition entries early on. Those are inert longhand bookkeeping (there is no
`transition: all` in the file — verified, count 0) and produce no visible motion,
per the pixel test above. Count animations only as a smoke signal; diff pixels to
decide.

**2. Legacy pink/purple literals — FIXED.** All 28 rules cleaned; `rgba(124,58,237)`
→ brand blue, `rgba(236,72,153)` → brand blue-bright, plus 9 hex literals mapped to
the value the cascade already produced. **0 legacy literals remain.**
I checked `.action-button:hover` specifically before bulk-replacing (its `#faf9ff`
looked like it might be a live white-on-hover bug) — it resolves to
`rgba(37,99,235,.16)`, so it was already overridden. Not a bug.

**3. Dead CSS — REMOVED.** 62 rules dropped: `.animate-hero-horizon/-arc/-spark`,
all 11 `.console-*`, `.sidebar-active`, `.sparkle`, `.insight-card`, `.chart-line`.
Three mixed selector-lists were trimmed rather than dropped.
Care taken: `console-body`/`console-live`/`console-mark` appear as **substrings** of
the live `hero-console-*` classes. All 26 `.hero-console-*` selectors are intact.
`stage-console-label` is also live and untouched.

**4. Override path — RESOLVED.** salma decided to keep the project-scoped path.
`MASTER.md`'s LOGIC header now points at
`design-system/cbsai-public-website/pages/[page-name].md`, names `home.md` as the
active override, and records that the old `design-system/pages/…` path does not
exist. No generator ambiguity remains.

### On verifying visual no-ops

Pixel-diffing this site has a **noise floor of ~0.18%** — the glow animates
continuously, so two captures of *identical code* differ by that much. I measured
that control explicitly. Dead-CSS removal came in at 0.12–0.22% and palette cleanup
at 0.08–0.21%, i.e. both inside the noise. **Always run the identical-code control
before concluding a diff means something.**

### Post-fix state

Build clean. 375/768/1024/1440: 0 overflow, 0 console errors, nav + modal + focus
intact. Hero collisions 0 at seven widths. Motion 34 running / 0 errors; reduced
motion 0 running and 0 pixels of movement. Hero contrast 8.12:1.

---

**Author:** Claude · **Date:** 2026-08-20 · **Branch:** `codex/cbsai-public-web`
**Nothing is committed.** All changes sit in the working tree alongside your own.

Read [AGENTS.md](AGENTS.md) first — it is the shared brief and now carries the
architecture traps discovered during this work.

---

## 1. Files touched

| File | Change |
|---|---|
| `styles.css` | All visual work. Additions are appended as commented blocks at EOF. |
| `index.html` | **Now edited by me** — see §1.1. Careers section + contact email only. |
| `script.js` | Two appended blocks: material/motion helpers, workflow motion orchestrator. |
| `src/App.tsx` | Hero restructured into an asymmetric split. |
| `components/ui/hero-console.tsx` | **New.** Hero product console. |
| `components/ui/glow-horizon.tsx` | Hex literals → `var(--brand-violet*)`. No visual change. |
| `AGENTS.md`, `CLAUDE.md` | **New.** Shared brief + pointer. |
| `design-system/cbsai-public-website/pages/home.md` | **New.** Page-level design overrides. |
| `~/.claude.json` | 21st.dev MCP registered (local scope, outside the repo). |

I did not modify your consent manager, focus traps, or assistant/ecosystem data.

`index.html` was already `M` in git before I started — **most of that diff is
yours, not mine.** My edits to it are limited to the four listed in §1.1.
`package.json` is unpolluted (Playwright and pngjs resolved from outside the
project; nothing was added to your dependencies).

### 1.1 My `index.html` edits (the only four)

1. **New `<section id="careers">`** inserted directly after `#about`, before
   `#contact`. Four role cards + an open-application block. Uses existing
   `.reveal` classes so it animates via your observer (verified 6/6 fire).
2. `.cta-contact` line added inside the `#contact` CTA card.
3. `.modal-contact` line appended inside the demo modal form.
4. Footer **Company** column: added `Careers` link, and the contact link changed
   from `mailto:hello@cbsai.com` to `mailto:marketing@cbsai.co`.

**Flag for salma/you:** the old address was `hello@cbsai.com` (**.com**) while the
new one is `marketing@cbsai.co` (**.co**). Different TLD. I replaced it because it
was the only client contact point and salma asked for `marketing@cbsai.co` there —
but if `hello@cbsai.com` is a real routed mailbox, restoring it alongside is a
one-line change. There are now 4 `mailto:` links, all `marketing@cbsai.co`.

Careers applications also route to `marketing@cbsai.co`; a dedicated `careers@`
address would be more conventional if one exists.

---

## 2. Highest-value things to audit

### 2.1 The stacking-context fix (most likely to hide a regression)

The material pass originally added `.platform-card > * { position: relative; z-index: 1 }`
so the cursor-lighting `::before` would sit behind content. That **silently overrode
`.card-chart-mini`'s `position: absolute`**, letting it escape the card by 236px.

Replaced with `.platform-card { isolation: isolate }` + `z-index: -1` on the `::before`.

**Please verify** no other absolutely-positioned descendant inside `.platform-card`
regressed. Candidates: `.kanban-mini`, `.star-field`, `.card-number`, `.card-icon`.

### 2.2 Hero paragraph contrast

The hero copy sits on the glow arc's brightest edge. Measured **1.09:1** before the
fix (AA needs 4.5:1), now **9.02:1**, via a scrim at `.animate-hero-content::before`.

Two selectors carry this and are easy to break: restructuring the hero into
`.hero-split-copy` already broke `.animate-hero-content > p` once during this work.
**If you move hero copy, re-measure — do not eyeball it.**

### 2.2b Hero strap-line collision — specificity trap

`.animate-hero-meta` ("Connected operations · Explainable intelligence · Human
control") was overlapping `.hero-foot` ("Built for operations-heavy businesses…").
Measured: **327x12px at 1440, 357x10px at 1024**, and on mobile `.hero-foot` sat
**20px on top of the console**.

Two causes, both worth knowing:

1. **Specificity, not source order.** My earlier mobile fix targeted `.hero-foot`
   (0,1,0) but the base rule is `.hero-animate .hero-foot` (0,2,0) — it won
   regardless of being earlier in the file. Appending to EOF is *not* enough in
   this stylesheet; match the specificity.
2. **Fixed-height canvas.** `.hero-foot` is absolute at the hero's bottom while
   the meta row is in flow, so a tall copy column runs into it. This is
   viewport-*height* dependent, so per-breakpoint padding only moves it around.

**Fix shipped:** `.hero-animate { min-height: max(calc(100svh - 77px), 820px) }`
above 980px — the hero still fills tall screens (1440x900 is **pixel-identical**
to before, verified by diff) but is guaranteed 820px on short ones like 1280x800.
Below 980px the foot flows normally.

**I tried and REVERTED** unpinning the mount point at all widths. It fixed every
collision but sized `.react-animate-hero-layer` to its content instead of the
hero, visibly flattening the glow arc — 9% of hero pixels changed. The Animate
Hero's output must not change, so it was reverted. **Do not re-attempt this
without a pixel diff.**

Verified zero collisions at 1440/1280/1100/1024/980/768/375 via a collision
detector (`collide.mjs` approach: compare bounding boxes of hero children).

### 2.3 Hero height trap

`#animate-hero-root` and `.react-animate-hero-layer` are both `position:absolute;
inset:0; overflow:hidden`, so **nothing inside contributes height to `.hero`**.
Adding the console clipped the headline off-screen on mobile and left `.hero` at
**34px tall**. Fixed by unpinning the mount point below 980px.

**Check:** `document.querySelector('#top').getBoundingClientRect().height` at 375px
must not be ~34px.

### 2.4 Motion system

CSS in `styles.css` owns every animation; `script.js` only stamps a `--i` stagger
index and adds `.is-animated` via IntersectionObserver. Eight diagrams participate:

`.workflow-rail`, `.fragmentation-map`, `.card-chart-mini`, `.bar-chart`,
`.kanban-mini`, `.star-field`, `.governance-visual`, `.adoption-steps`

Motion vocabulary is deliberately only four verbs — signal travel, sequential wake,
materialise, ambient life — so the page reads as one system.

**Failure mode is safe and I verified it:** if the observer never fires, content
renders at full value (`transform: none`, real bar heights, opacity 1). It degrades
to "unanimated", never "invisible". Please re-check this if you extend the list.

`@property --bar` is used to animate the demo bar chart. Browsers without
`@property` support show the final state — acceptable, but worth knowing.

---

## 3. Verified state

Build clean (`tsc -b && vite build`). Playwright, four viewports:

| | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| Horizontal overflow | 0px | 0px | 0px | 0px |
| Console errors | 0 | 0 | 0 | 0 |
| Tap targets <40px | none¹ | none¹ | — | — |
| Nav toggle | ✓ | ✓ | — | — |
| Modal open/fit/focus/Esc | ✓ | ✓ | ✓ | ✓ |

¹ The 1×1 inputs inside `.consent-option-toggle` are visually-hidden checkboxes;
the wrapping `<label>` is the real target. **Do not "fix" them.**

Also verified this round: security control labels raised 8px → **11px**; the
`#careers` anchor lands clear of the sticky header (top 85px vs 77px header);
adding contact links regressed one tap target (`.modal-contact a` at 140×17) which
was caught by the audit and fixed. Re-run `audit.mjs` after adding any link.

Reduced-motion: **0 running animations**, nothing stamped, verified via Playwright's
`reducedMotion: 'reduce'`.

---

## 4. Open — needs your judgement

### 4.1 Glow performance (please verify on real hardware)

Measured in headless Chromium (**software rendering, no GPU**):

| Condition | Median frame | Running animations |
|---|---|---|
| Everything on | 50.0ms (~20fps) | 34 |
| My workflow motion only | **16.7ms (60fps)** | 20 |
| Glow animations only | 50.0ms | 16 |
| Nothing animating | 16.7ms | 2 |

**The entire cost is the pre-existing glow layers, not the motion I added.** Their
keyframes only touch transform/opacity; the cost is re-rasterising `blur(38–42px)`
across 112%-of-viewport elements each frame.

I tried `will-change` layer promotion — it made it **worse (183ms)** and I reverted
rather than shipping it.

**I am not claiming the site is broken for real users.** Headless has no GPU
compositor, so this likely overstates the cost. If it reproduces on real hardware,
the lever is blur radius / element size — which changes the Animate Hero's
appearance and needs salma's sign-off first.

### 4.2 Still open from earlier

- **Orphaned CSS**: `.animate-hero-horizon`, `.animate-hero-arc-*`,
  `.animate-hero-spark-*` — ~18 rules, **zero** references in `index.html`.
  Removing them is the glow-consolidation work. Verify
  `grep -c 'animate-hero-arc' index.html` → `0` first. Do **not** touch
  `.site-glow-horizon` / `.site-horizon-arc` (live) or the new `.hero-console-*`
  namespace (live).
- **Dead CSS** from the removed static console: `.console-*`, `.sparkle`,
  `.insight-card`, `.chart-line`.
- The `:focus-visible` rule is stated identically in three places; two are
  redundant but sit inside your cascade-lock block, so I left them.
- Uppercase monospace micro-labels sit at 8–9px on desktop (`.message-label`,
  `.demo-window` chrome). Deliberate device, floored at 10px below 820px.

---

## 5. Corrections I made to my own earlier claims

Recorded so you don't inherit them as fact:

1. I reported a "blank mid-page region" — **false**, an artefact of reading a
   13,460px page as a 214px thumbnail. All 14 sections render.
2. I claimed "10 of 14 sections are centre-aligned" and recommended work on that
   basis — **false**. Only `#platform` uses `.centered`. The real uniformity was
   structural (every section is eyebrow → headline → card grid).
3. I called the magenta `:focus-visible` rule dead code — **wrong**. It still
   supplies `outline-width`/`outline-offset`; only its colour was overridden.
   Deleting it would have removed the 3px ring.
4. I called the purple glow a design-system violation — **wrong**. `--brand-violet`
   is a deliberate AI-signal token; MASTER.md's anti-pattern line is the stale part.

---

## 6. Conventions to keep

- `--brand-blue` = solid interaction fills · `--brand-blue-bright` = accents ·
  `--brand-violet` = **AI signal only**. Legacy `--violet`/`--pink`/`--blue` were
  removed (43 usages migrated); do not reintroduce.
- `styles.css` is layered — check **every** occurrence of a selector before
  concluding what renders; the last one wins and early rules can be partially
  shadowed.
- Do not judge layout from full-page thumbnails. Measure the DOM or screenshot at
  viewport scale.
