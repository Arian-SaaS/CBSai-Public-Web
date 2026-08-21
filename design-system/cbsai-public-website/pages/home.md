# Home — Page Overrides

> Per `MASTER.md`'s override logic, the rules in this file **supersede** the Master
> file for the CBSai public website (the site is one long-scroll page, so this file
> effectively governs the whole build).
>
> This file records where the **shipped implementation deliberately diverges** from
> the generated Master spec. Reconciled 2026-08-20 against `styles.css`,
> `index.html`, and `components/ui/glow-horizon.tsx`.

---

## 1. Palette — dark brand system, not the light Master palette

The Master file specifies a light surface (`#F8FAFC` background, navy foreground).
**The site ships dark.** The authoritative tokens are the `--brand-*` set defined on
`:root` in `styles.css`:

| Role | Token | Hex |
|------|-------|-----|
| Page void / base | `--brand-void` | `#05070d` |
| Navy surface | `--brand-navy` | `#071126` |
| Navy raised | `--brand-navy-2` | `#0a1831` |
| Card surface | `--brand-surface` | `#0d2040` |
| Interaction / CTA | `--brand-blue` | `#2c9ff0` |
| Interaction bright / focus | `--brand-blue-bright` | `#58c9ff` |
| AI signal | `--brand-violet` | `#a558fb` |
| AI signal deep | `--brand-violet-deep` | `#4922e5` |
| Body text | `--brand-text` | `#eff6ff` |
| Muted text | `--brand-muted` | `#9caec7` |
| Hairline | `--brand-line` | `rgba(137,188,239,.2)` |
| Success / status | `--brand-success` | `#8de1c5` |

**Use `--brand-*` for all work.** Semantic assignment:

- `--brand-blue` — solid interaction/CTA fills (buttons, nav CTA, toggles, chart bars)
- `--brand-blue-bright` — accents: link/icon colour, hairlines, focus ring, emphasis
- `--brand-violet` — **AI signal only** (see §2)

The legacy colour tokens `--violet` / `--violet-soft` / `--pink` / `--blue` were
**removed on 2026-08-20**; all 43 usages migrated to the above. Their names were
actively misleading (`--violet` was blue `#2563eb`, `--pink` was cyan `#0ea5e9`).
Do not reintroduce them. Non-colour legacy tokens — `--ink`, `--paper`, `--line`,
`--shadow-*`, `--radius-*`, `--ease` — remain in use and are fine.

## 2. Violet is an approved brand colour — the Master anti-pattern does not apply

Master lists `❌ AI purple/pink gradients` as forbidden. **This override cancels that
rule.** Violet is the designated *AI signal* colour in the CBSai brand system, used
for the hero glow horizon and AI-attributed UI. It is a deliberate semantic, not
decorative AI-startup gradient.

Constraints that still hold: violet is reserved for AI signal only — never for
generic CTAs, links, or surfaces (those are `--brand-blue`), and never as a
purple→pink decorative gradient.

Single source of truth: `--brand-violet` / `--brand-violet-deep`.
`components/ui/glow-horizon.tsx` consumes those tokens via `var()`; it must not
reintroduce hex literals.

**The supplied `GlowHorizonFM` violet/blue animation is preserved as-designed.** Its
visual output is fixed — do not retune its colours, timing, or arc geometry.

### Glow scope

| Scope | System |
|---|---|
| Animate Hero | React `GlowHorizonFM` — the AI accent. Visually frozen. |
| All other sections | CSS `.site-glow-horizon` — one shared site-wide glow. |

These are kept separate by the hero's opaque `--brand-void` background. A planned
consolidation removes only the orphaned `.animate-hero-arc-*` CSS (no markup
references it); it must not change what the hero renders.

## 3. Motion — Framer Motion, not GSAP

Master's Motion section prescribes GSAP (`gsap.from`, `back.out(1.4)`).
**The project has no GSAP dependency.** Motion is implemented with:

- **Framer Motion** for the React hero island (`glow-horizon.tsx`,
  `animated-title-fm.tsx`), standard easing `[0.16, 1, 0.3, 1]`.
- **CSS transitions + `IntersectionObserver`** for everything else — the
  `.reveal` / `.is-visible` pattern driven from `script.js`.

The Master's stagger *intent* still applies (300–450ms, sequential reveal); only the
library differs. Do not use `back.out`-style overshoot on data-dense UI.

## 4. Focus ring

`rgba(88, 201, 255, .82)` (i.e. `--brand-blue-bright`), 3px solid, 3px offset.
The Master's `--color-ring: #2563EB` belongs to the deprecated light palette.

---

## Unchanged from MASTER.md

Typography (Calistoga headings / Inter body / JetBrains Mono eyebrows), the spacing
and shadow scales, the component specs, the Real-Time / Operations page pattern, and
**the entire Pre-Delivery Checklist** — including no emojis as icons, `cursor:pointer`
on clickables, 150–300ms transitions, visible focus states, `prefers-reduced-motion`,
4.5:1 contrast, and the 375/768/1024/1440 responsive checks.
