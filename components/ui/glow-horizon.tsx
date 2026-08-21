"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 2;

export type GlowHorizonVariant = "top" | "bottom" | "left" | "right";

const VARIANTS: Record<GlowHorizonVariant, {
  axis: "x" | "y";
  scaleAxis: "scaleX" | "scaleY";
  enterPct: string;
  restPct: string;
}> = {
  top: { axis: "y", scaleAxis: "scaleY", enterPct: "-100%", restPct: "-50%" },
  bottom: { axis: "y", scaleAxis: "scaleY", enterPct: "100%", restPct: "50%" },
  left: { axis: "x", scaleAxis: "scaleX", enterPct: "100%", restPct: "50%" },
  right: { axis: "x", scaleAxis: "scaleX", enterPct: "-100%", restPct: "-50%" },
};

export interface GlowHorizonProps {
  className?: string;
  variant?: GlowHorizonVariant;
}

export default function GlowHorizonFM({ className, variant = "top" }: GlowHorizonProps) {
  const { axis, scaleAxis, enterPct, restPct } = VARIANTS[variant];
  const reduce = useReducedMotion();

  // Under reduced motion the glow renders straight to its rest state: same
  // final appearance, no entrance animation.
  const rest = { [axis]: restPct, [scaleAxis]: 1, opacity: 1, filter: "blur(0px)" };

  return (
    <motion.div
      className={`absolute h-full w-full ${className ?? ""}`}
      style={{ isolation: "isolate" }}
      initial={reduce ? rest : { [axis]: enterPct, [scaleAxis]: 1.5, opacity: 0, filter: "blur(15px)" }}
      animate={rest}
      transition={reduce ? { duration: 0 } : { duration: DURATION, ease: EASE }}
    >
      <Arc variant={variant} color="#FFFFFF" size="132%" boxShadow="0px -4px 23px 0px #ffffffb5" delay={1.2} reduce={reduce} />
      <Arc variant={variant} color="var(--brand-violet)" size="120%" initialOffset="10%" blur={31} delay={0.6} reduce={reduce} />
      <Arc variant={variant} color="var(--brand-violet-deep)" size="124%" initialOffset="10%" blur={21} delay={0} reduce={reduce} />
      <Arc variant={variant} color="#000" size="120%" initialOffset="10%" blur={51} delay={0} reduce={reduce} />
    </motion.div>
  );
}

function Arc({
  variant,
  color,
  size,
  initialOffset,
  blur,
  boxShadow,
  delay,
  reduce,
}: {
  variant: GlowHorizonVariant;
  color: string;
  size: string;
  initialOffset?: string;
  blur?: number;
  boxShadow?: string;
  delay: number;
  reduce: boolean | null;
}) {
  const scale = parseFloat(size) / 100;
  const { axis, enterPct } = VARIANTS[variant];
  const sign = enterPct.startsWith("-") ? -1 : 1;
  const startPct = initialOffset
    ? `${sign * Math.abs(parseFloat(initialOffset) - 50)}%`
    : undefined;

  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 rounded-[100%]"
      style={{
        scale,
        background: color,
        ...(blur !== undefined && { filter: `blur(${blur}px)` }),
        ...(boxShadow && { boxShadow }),
      }}
      initial={startPct && !reduce ? { [axis]: startPct } : false}
      animate={startPct ? { [axis]: 0 } : undefined}
      transition={reduce ? { duration: 0 } : { duration: DURATION, ease: EASE, delay }}
    />
  );
}
