"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Link as LinkIcon, Activity, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* Adapted from the supplied radial-orbital-timeline for CBSai. Four deliberate
   deviations from the original, all noted in HANDOFF-CODEX.md:

   1. THEME — the original renders on `bg-black h-screen` with a purple/blue/teal
      gradient core. This keeps the Artemis section's own surface and palette
      (--brand-*), with violet reserved for the AI core per the design system.
   2. ACCESSIBILITY — the original's nodes are <div onClick>, unreachable by
      keyboard. They are <button> here, with aria-expanded/aria-label. The site
      has strict a11y invariants.
   3. MOTION — the original rotates via setInterval(50ms) writing React state,
      i.e. 20 re-renders/second forever. Rotation here is rAF-driven and written
      straight to the DOM through refs, so idle orbiting causes zero re-renders.
      It also stops entirely under prefers-reduced-motion.
   4. RESPONSIVE — the original hard-codes radius 200. Here it derives from the
      measured container so it works from 320px up.                            */

export interface OrbitalItem {
  id: number;
  title: string;
  /** Short qualifier shown under the title, e.g. the assistant that owns it. */
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  /** 0–100. Drives the halo size and the strength meter. */
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: OrbitalItem[];
  /** Label rendered inside the core. */
  centerLabel?: string;
  centerSublabel?: string;
}

export default function RadialOrbitalTimeline({
  timelineData,
  centerLabel = "Artemis",
  centerSublabel = "Cross-business intelligence",
}: RadialOrbitalTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [radius, setRadius] = useState(200);

  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const angleRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  const total = timelineData.length;

  /* Position every node from the current angle. Called from rAF, so it must not
     touch state — it writes transforms directly. */
  const paint = useCallback(() => {
    for (let i = 0; i < total; i++) {
      const item = timelineData[i];
      const node = nodeRefs.current[item.id];
      if (!node) continue;
      const deg = ((i / total) * 360 + angleRef.current) % 360;
      const rad = (deg * Math.PI) / 180;
      const x = radius * Math.cos(rad);
      const y = radius * Math.sin(rad);
      const isOpen = node.dataset.open === "true";
      node.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
      node.style.zIndex = String(isOpen ? 200 : Math.round(100 + 50 * Math.cos(rad)));
      node.style.opacity = isOpen
        ? "1"
        : String(Math.max(0.55, Math.min(1, 0.55 + 0.45 * ((1 + Math.sin(rad)) / 2))));
    }
  }, [timelineData, total, radius]);

  // Measure the container so the orbit scales instead of using a fixed radius.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const box = Math.min(el.clientWidth, el.clientHeight);
      // Leave room for the node chip and its caption.
      setRadius(Math.max(96, Math.min(230, box / 2 - 74)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // rAF orbit. Time-based so speed is framerate-independent.
  useEffect(() => {
    paint();
    if (reduceMotion) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      if (!pausedRef.current) {
        angleRef.current = (angleRef.current + dt * 0.006) % 360;
        paint();
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [paint, reduceMotion]);

  // Pause while a node is open, and bring that node to the front.
  useEffect(() => {
    pausedRef.current = expandedId !== null;
    if (expandedId !== null) {
      const idx = timelineData.findIndex((i) => i.id === expandedId);
      if (idx >= 0) angleRef.current = (270 - (idx / total) * 360 + 360) % 360;
    }
    paint();
  }, [expandedId, timelineData, total, paint]);

  const open = timelineData.find((i) => i.id === expandedId) ?? null;

  const relatedTo = (id: number | null) =>
    id === null ? [] : timelineData.find((i) => i.id === id)?.relatedIds ?? [];

  const statusStyles = (status: OrbitalItem["status"]) => {
    switch (status) {
      case "completed":
        return "border-transparent bg-[rgba(141,225,197,.16)] text-[#8de1c5]";
      case "in-progress":
        return "border-transparent bg-[rgba(88,201,255,.16)] text-[#58c9ff]";
      default:
        return "border-transparent bg-[rgba(156,174,199,.14)] text-[#9caec7]";
    }
  };
  const statusLabel = (status: OrbitalItem["status"]) =>
    status === "completed" ? "Connected" : status === "in-progress" ? "Live" : "Ready";

  return (
    <div
      ref={containerRef}
      className={`artemis-orbit relative flex w-full items-center justify-center overflow-hidden ${open ? "has-open" : ""}`}
      onClick={(e) => {
        if (e.target === containerRef.current || e.target === orbitRef.current) setExpandedId(null);
      }}
    >
      <div ref={orbitRef} className="artemis-orbit-ring absolute inset-0 flex items-center justify-center">
        {/* Orbit rings */}
        <div
          className="pointer-events-none absolute rounded-full border border-[rgba(137,188,239,.16)]"
          style={{ width: radius * 2, height: radius * 2 }}
        />
        <div
          className="pointer-events-none absolute rounded-full border border-dashed border-[rgba(137,188,239,.09)]"
          style={{ width: radius * 1.34, height: radius * 1.34 }}
        />

        {/* Artemis core */}
        <div className="artemis-core absolute z-10 flex flex-col items-center justify-center rounded-full text-center">
          <span className="artemis-core-glyph" aria-hidden="true">
            <Activity size={15} strokeWidth={2.4} />
          </span>
          <b>{centerLabel}</b>
          <small>{centerSublabel}</small>
        </div>

        {timelineData.map((item) => {
          const isOpen = expandedId === item.id;
          const isRelated = relatedTo(expandedId).includes(item.id);
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              ref={(el) => {
                nodeRefs.current[item.id] = el;
              }}
              data-open={isOpen ? "true" : "false"}
              className="absolute left-1/2 top-1/2 will-change-transform"
              style={{ transition: "opacity .4s ease" }}
            >
              <button
                type="button"
                className={`artemis-node ${isOpen ? "is-open" : ""} ${isRelated ? "is-related" : ""}`}
                aria-expanded={isOpen}
                aria-label={`${item.title} — ${item.category}. ${isOpen ? "Hide" : "Show"} details.`}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(isOpen ? null : item.id);
                }}
              >
                <span className="artemis-node-chip" aria-hidden="true">
                  <Icon size={15} strokeWidth={2.2} />
                </span>
                <span className="artemis-node-label">
                  <b>{item.title}</b>
                  <small>{item.date}</small>
                </span>
              </button>

            </div>
          );
        })}
      </div>

      {/* One detail panel anchored at the base of the stage. The original
          rendered a card from each node, which covered the Artemis core — the
          whole subject of this section. */}
      {open && (
        <Card className="artemis-card absolute inset-x-4 bottom-4 z-[300] overflow-visible">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className={`px-2 text-[10px] tracking-wider ${statusStyles(open.status)}`}>
                  {statusLabel(open.status)}
                </Badge>
                <CardTitle className="text-sm">{open.title}</CardTitle>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8ea6c4]">
                  {open.date}
                </span>
              </div>
              <button
                type="button"
                className="artemis-card-close"
                onClick={() => setExpandedId(null)}
                aria-label="Close details"
              >
                <X size={13} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-[#c8dcf2]">
            <div className="artemis-card-grid">
              <p className="leading-relaxed">{open.content}</p>

              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-[#9caec7]">
                    <Activity size={10} /> Signal strength
                  </span>
                  <span className="font-mono text-[#58c9ff]">{open.energy}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(137,188,239,.16)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2c9ff0] to-[#58c9ff]"
                    style={{ width: `${open.energy}%` }}
                  />
                </div>

                {open.relatedIds.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center gap-1">
                      <LinkIcon size={10} className="text-[#9caec7]" />
                      <h4 className="text-[10px] font-medium uppercase tracking-wider text-[#9caec7]">
                        Connected context
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {open.relatedIds.map((rid) => {
                        const rel = timelineData.find((i) => i.id === rid);
                        if (!rel) return null;
                        return (
                          <Button
                            key={rid}
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-md border-[rgba(137,188,239,.24)] bg-transparent px-2 py-0 text-[11px] text-[#c8dcf2] hover:bg-[rgba(88,201,255,.12)] hover:text-white"
                            onClick={() => setExpandedId(rid)}
                          >
                            {rel.title}
                            <ArrowRight size={9} className="ml-1 text-[#58c9ff]" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
