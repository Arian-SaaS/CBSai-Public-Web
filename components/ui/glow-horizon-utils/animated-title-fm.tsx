"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const lineVariants = {
  closed: { opacity: 0, y: 28, filter: "blur(10px)" },
  open: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
};

export function AnimatedTitleFM({ open }: { open: boolean }) {
  const reduce = useReducedMotion();

  // Reduced motion: render the headline in its final state immediately.
  if (reduce) {
    return (
      <h1 className="animate-hero-title">
        <span>See what changes.</span>
        <em>Act earlier.</em>
      </h1>
    );
  }

  return (
    <motion.h1
      className="animate-hero-title"
      initial="closed"
      animate={open ? "open" : "closed"}
      variants={{
        closed: {},
        open: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
      }}
    >
      <motion.span variants={lineVariants}>See what changes.</motion.span>
      <motion.em variants={lineVariants}>Act earlier.</motion.em>
    </motion.h1>
  );
}
