"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/* The hero's product surface. Deliberately shows the CBSai story rather than a
   generic dashboard: a customer commitment, the vendor event that threatens it,
   the margin consequence, and the assistant that traced the connection. */

const SIGNALS = [
  { domain: "Vendors", label: "Meridian Steel lead time", delta: "+6 days", tone: "warn" },
  { domain: "Projects", label: "Install milestone slips", delta: "Apr 18", tone: "warn" },
  { domain: "Finance", label: "Unbilled milestones", delta: "2 open", tone: "flat" },
] as const;

export function HeroConsole() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, ease: EASE, delay },
        };

  return (
    <motion.div
      className="hero-console-shell"
      aria-label="CBSai operations console showing a project at margin risk"
      {...(reduce
        ? { initial: { opacity: 1 } }
        : {
            initial: { opacity: 0, y: 34, rotateX: 7 },
            animate: { opacity: 1, y: 0, rotateX: 0 },
            transition: { duration: 1.15, ease: EASE, delay: 0.55 },
          })}
    >
      <div className="hero-console-bar">
        <span className="hero-console-mark" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="hero-console-title">Operations overview</span>
        <span className="hero-console-live">
          <span className="hero-console-dot" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="hero-console-body">
        <motion.div className="hero-console-project" {...rise(0.75)}>
          <div className="hero-console-project-top">
            <div>
              <span className="hero-console-eyebrow">Project · 4102</span>
              <b>Northstar Retrofit</b>
            </div>
            <span className="hero-console-chip hero-console-chip-warn">Margin at risk</span>
          </div>

          <div className="hero-console-metrics">
            <div>
              <span>Margin</span>
              <b>
                28.6<i>%</i>
              </b>
              <em className="is-down">▼ 3.8 vs plan</em>
            </div>
            <div>
              <span>Committed cost</span>
              <b>
                <i>$</i>1.24<i>M</i>
              </b>
              <em className="is-up">▲ 41K this week</em>
            </div>
          </div>

          <div className="hero-console-bar-track" role="img" aria-label="Budget consumed: 68 percent">
            <motion.span
              className="hero-console-bar-fill"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: "68%" }}
              transition={{ duration: 1.5, ease: EASE, delay: 1.15 }}
            />
            <span className="hero-console-bar-plan" aria-hidden="true" />
          </div>
          <div className="hero-console-bar-legend">
            <span>68% budget consumed</span>
            <span>54% delivered</span>
          </div>
        </motion.div>

        <motion.ul className="hero-console-signals" {...rise(0.95)}>
          {SIGNALS.map((s) => (
            <li key={s.label}>
              <span className="hero-console-domain">{s.domain}</span>
              <span className="hero-console-signal-label">{s.label}</span>
              <span className={`hero-console-delta is-${s.tone}`}>{s.delta}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div className="hero-console-insight" {...rise(1.15)}>
          <span className="hero-console-avatar" aria-hidden="true">
            Z
          </span>
          <div>
            <span className="hero-console-insight-label">Ziba · finance intelligence</span>
            <p>
              Margin is narrowing because materials are arriving later than planned. Two
              milestones remain unbilled.
            </p>
            <span className="hero-console-trace">
              <span className="hero-console-trace-dot" aria-hidden="true" />
              Traced to 14 project records, 3 vendor updates
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default HeroConsole;
