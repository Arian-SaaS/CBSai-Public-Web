# AGENTS.md — CBSai Public Website

Shared brief for every AI agent working in this repo (Codex, Claude Code, or otherwise).
**Two agents work in this tree concurrently.** Read "Working alongside another agent"
before your first edit.

---

## 1. What this is

Marketing site for **CBSai** — a connected business operating system (finance,
customers, employees, vendors, inventory, projects, and AI assistants).

Positioning: *Connected operations. Explainable intelligence. Human control.*

One long-scroll landing page. Sections in document order:

`hero(#top)` → `#problem` → `#workflow` → `#platform` → `#industries` →
`#assistants` → `#intelligence` (Artemis) → `#outcomes` → `#security` →
`#resources` → `#adoption` → `#ecosystem` → `#about` → `#contact`

`#solutions` is **not** a section — it is the `.platform-grid` div inside `#platform`
that the nav links to.

Named AI assistants (content lives in `assistantData` in `script.js`):
**Ziba** finance · **Jupiter** customers/revenue · **Atoosa** workforce ·
**Artemis** cross-business intelligence.

---

## 2. Architecture — a static site with one React island

This is **not** a React app. It is hand-authored static HTML/CSS/JS, with React
mounted into the hero only.

```
index.html    hand-authored, ~36KB, very long lines (one line per section)
styles.css    ~115KB plain CSS. No Tailwind utilities are used in the markup.
script.js     vanilla ES modules, no framework
src/main.tsx  → mounts <App/> into #animate-hero-root  ← React island, HERO ONLY
```

`index.html` loads both `/script.js` and `/src/main.tsx` (bottom of file). Because of
the bare `.tsx` import, **`index.html` cannot be opened as a file://** — it requires
Vite.

```
npm install
npm run dev       # Vite dev server — the only correct way to view the site
npm run build     # tsc -b && vite build  → dist/
npm run preview
```

Vite + Tailwind v4 + shadcn (`components.json`, `lib/utils.ts`, `@` → repo root) are
scaffolded but **barely used**: `src/index.css` is just `@import "tailwindcss";`, and
the React components style themselves with classes from `styles.css`, not utilities.
Do not assume Tailwind is available in the static markup — it is not.

**Where to make a change:**

| Change | File |
|---|---|
| Hero copy, hero animation | `src/App.tsx`, `components/ui/glow-horizon-utils/animated-title-fm.tsx` |
| Hero glow visuals | `components/ui/glow-horizon.tsx` |
| Any other section's markup | `index.html` |
| Any styling at all | `styles.css` |
| Interactivity, assistant/ecosystem copy, consent | `script.js` |

---

## 3. Design system — read before any visual change

1. `design-system/cbsai-public-website/MASTER.md` — the generated base spec.
2. `design-system/cbsai-public-website/pages/home.md` — **page overrides, which win.**

Read the overrides file. The Master file is stale in four specific ways (palette is
dark not light, violet is an approved AI-signal colour despite the Master's
anti-pattern line, motion is Framer Motion not GSAP, and the focus ring differs).

**Use `--brand-*` tokens for all new CSS.** Interaction/CTA fills use `--brand-blue`,
accents and hairlines use `--brand-blue-bright`, and `--brand-violet` is reserved for
AI signal only.

The legacy `--violet` / `--violet-soft` / `--pink` / `--blue` tokens were **removed**
on 2026-08-20 (all 43 usages migrated). Their names were actively misleading —
`--violet` was blue, `--pink` was cyan. Do not reintroduce them. Non-colour legacy
tokens (`--ink`, `--paper`, `--line`, `--shadow-*`, `--radius-*`, `--ease`) are still
in use and are fine.

The **Pre-Delivery Checklist** at the bottom of `MASTER.md` applies in full and is not
overridden — no emojis as icons, `cursor:pointer` on clickables, 150–300ms
transitions, visible focus, `prefers-reduced-motion`, 4.5:1 contrast, and no
horizontal scroll at 375/768/1024/1440.

### The cascade-lock pattern

`styles.css` is layered, not linear. A late block (`/* Final cascade lock ... */`,
near the end) re-asserts brand values over earlier rules, and there are `!important`
hero background rules. Consequences:

- **Grepping a selector is not enough.** The same selector may be redefined 2–3
  times; the last one wins. Check every occurrence before concluding what renders.
- Some early rules are *partially* shadowed — e.g. the `:focus-visible` rule at the
  top still supplies `outline-width` and `outline-offset` while later rules override
  only `outline-color`. Do not delete an "overridden" rule without checking which
  properties actually still apply.
- Prefer editing the rule that actually wins over adding another override layer.

---

## 4. Working alongside another agent

Both Codex and Claude Code edit **this same working tree**, sometimes in the same
session. The uncommitted diff is usually the other agent's in-flight work.

- **Re-read a file immediately before editing it.** Do not trust a read from earlier
  in the conversation.
- **Make surgical edits.** Never rewrite `styles.css` or `index.html` wholesale —
  they are large and hold another agent's work.
- **Never revert, reformat, or "clean up" changes you did not make.** A half-finished
  migration is not a bug. Ask.
- **Do not commit unless explicitly asked.** The tree may hold partial work.
- Check `git diff` / file mtimes before assuming the current state is what you last saw.

---

## 5. Privacy — do not regress this

`script.js` implements a deliberate privacy-first consent manager:

- **No analytics vendor is loaded by default.** None is bundled.
- `track()` is a no-op unless **both** analytics consent is granted **and**
  `window.CBSAI_ANALYTICS_ENDPOINT` is set to a first-party collector.
- Consent persists to `localStorage` with a cookie fallback (private browsing).
- Marketing consent is hard-defaulted to `false`.

Do not add third-party scripts, pixels, or tag managers. Do not make `track()` fire
before consent. Do not add a fourth-party CDN — the only external origin is Google
Fonts.

---

## 6. Accessibility invariants already in place

Preserve these; they are implemented and easy to break:

- Skip link to `#main-content`.
- Focus traps in **both** the demo modal and the consent dialog (Tab/Shift-Tab wrap,
  Escape closes, focus restores to the trigger).
- `alignHashTarget()` in `script.js` corrects anchor scrolling for the sticky header —
  it re-runs on `hashchange`, `load`, and `document.fonts.ready`. If you change header
  height or fonts, verify deep links still land correctly.
- `aria-expanded` / `aria-selected` / `aria-pressed` are maintained on the menu
  toggle, assistant tabs, and ecosystem nodes.
- The `.reveal` → `.is-visible` observer is bypassed entirely under
  `prefers-reduced-motion`, which sets all items visible immediately.

---

## 7. Glow systems — the intended architecture

There are two *live* glow systems, and this split is **deliberate**:

| Scope | System | Rule |
|---|---|---|
| Animate Hero only | React `GlowHorizonFM` (Framer Motion) | **Do not alter its visual output.** The violet/blue arc animation is the intentional AI accent. |
| Every other section | CSS `.site-glow-horizon` (fixed, full-viewport) | The single shared site-wide glow. |

The hero currently sits on an opaque `.hero { background: var(--brand-void) !important; }`
(the winning rule is the last of three), so it fully occludes the site-wide glow —
which is what keeps the two from compositing. If you ever make the hero background
translucent, the two systems will blend and the hero's appearance will change.

`GlowHorizonFM` reads `--brand-violet` / `--brand-violet-deep` via `var()`. Keep it
that way — no hex literals back in the component.

## 8. Hero structure — read before touching the hero

The hero is an **absolutely positioned fixed-height canvas** on desktop:
`#animate-hero-root` and `.react-animate-hero-layer` are both `position:absolute;
inset:0; overflow:hidden`, so **nothing inside them contributes height to `.hero`**.
`.hero` gets its height from its own `min-height` alone.

That is a live trap. Adding any tall element to the hero silently clips it rather
than growing the section. Below 980px a rule in `styles.css` unpins the mount point
and lets the hero flow normally — if you add hero content, verify at 375px, and
check `document.querySelector('#top').getBoundingClientRect().height` is not ~34px.

`.hero-foot` is `position:absolute; bottom` on desktop and static below 980px.

The hero copy sits on the glow arc's brightest edge. It measured **1.09:1 contrast**
before a scrim was added behind it (`.animate-hero-content::before`). If you move,
resize, or restyle that scrim, re-measure — do not eyeball it. Body text needs 4.5:1.

## 9. Known open items

- **Consolidate the glow systems** (planned, not yet done). A third, *orphaned* CSS
  re-implementation of the hero glow still exists: `.animate-hero-horizon`,
  `.animate-hero-arc-*`, `.animate-hero-spark-*` — ~18 rules in `styles.css` with
  **zero references in `index.html`**, left over from before the React hero landed.
  Nothing can render them. Removing them is the consolidation work, and it cannot
  affect the hero because no markup matches. Verify with:
  `grep -c 'animate-hero-arc' index.html` → must be `0` before deleting.
  Leave `.site-glow-horizon` / `.site-horizon-arc` alone — those are live.
- **Dead CSS from the removed static hero console**: `.console-*`, `.sparkle`,
  `.insight-card`, `.chart-line` have no markup either. Note that the *new* hero
  console uses the `.hero-console-*` namespace and is live — do not confuse them.
- `#outcomes` has no lede paragraph in its `.section-heading`, and `#adoption`
  carries an extra `.integration-note` child. The two-column editorial heading is
  therefore scoped to `#workflow` and `#industries` only. Check a section's actual
  children before extending that rule to it.
- The `:focus-visible` rule is stated identically in three places; two are redundant
  but sit inside the cascade-lock block.
- `.qa/` is gitignored and currently empty.

## 10. Responsive architecture

Breakpoints in use: **1080** (platform bento 4→2 col), **980** (hero split → stacked),
**820** (Artemis stage → readable grid; mockup type floor), **720**, **560**, **480**.

Two sections are *rebuilt*, not merely reflowed, on small screens:

- **Hero** — see §8. The mount point is unpinned below 980px so it can flow.
- **Artemis stage** (`.ecosystem-stage`) — on desktop it is an absolutely
  positioned constellation whose labels are 7–10px. At phone width those became
  **6px**, i.e. an interactive section rendered illegible. Below 820px the stage
  becomes a 2-column grid of static `.stage-node` buttons (56px tall) with the
  core as a banner and the readout below; the decorative `.horizon-field`,
  `.stage-grid`, `.stage-beam`, `.stage-orbit` layers are hidden rather than
  scaled, since they assume the absolute geometry. Note `.stage-node` uses
  `position: static` there — `relative` would let the desktop `top`/`left`
  offsets still apply.

Tap targets are padded to 44px on `max-width: 900px` only, so desktop density is
unchanged. The 1×1 inputs inside `.consent-option-toggle` are visually-hidden
checkboxes — the wrapping `<label>` is the real target; do not "fix" them.

Known-acceptable: uppercase monospace micro-labels (`.message-label`, mockup
chrome inside `.demo-window`) sit at 8–9px on desktop. They are a deliberate
device, floored at 10px below 820px.

## 11. Verifying visual work

Playwright 1.62.1 is available globally with cached Chromium (no MCP server). Drive
it from a script. `npm run dev` serves on 5173, or the next free port.

Always check, at minimum: console errors, `scrollWidth - clientWidth` (horizontal
overflow) at 375/768/1440, and the reduced-motion path via Playwright's
`reducedMotion: 'reduce'` context option.

**Do not judge layout from a full-page screenshot thumbnail.** A 13,000px page scaled
to thumbnail width has repeatedly produced false readings — both a phantom "blank
region" and a false "everything is centred". Measure the DOM or screenshot at
viewport scale instead.

## 12. MCP

`21st` (21st.dev component API, HTTP transport) is registered for this project in
`~/.claude.json` under `projects[...].mcpServers`. It is **local scope on purpose** —
the API key must not go into a committed `.mcp.json`. MCP servers attach at session
start, so a newly added server needs a restart before its tools appear.
