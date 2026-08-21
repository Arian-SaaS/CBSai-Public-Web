import GlowHorizonFM from "@/components/ui/glow-horizon";
import { AnimatedTitleFM } from "@/components/ui/glow-horizon-utils/animated-title-fm";
import { HeroConsole } from "@/components/ui/hero-console";

export default function App() {
  return (
    <div className="react-animate-hero-layer" aria-label="CBSai connected operations">
      <GlowHorizonFM variant="top" className="react-glow-horizon" />
      <div className="animate-hero-content hero-split">
        <div className="hero-split-copy">
          <div className="eyebrow light-eyebrow">
            <span className="status-dot" aria-hidden="true" /> Connected business operations
          </div>
          <AnimatedTitleFM open={true} />
          <p>CBSai connects finance, customers, employees, vendors, inventory, projects, and AI-assisted operations in one governed platform. See what is happening across the business, understand why it is happening, and act before problems become expensive.</p>
          <p className="hero-icp">Built for businesses where customers, projects, employees, vendors, inventory, and financial performance all depend on each other.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#contact" data-open-demo>
              Book a demo <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-ghost" href="#platform">
              See how work connects <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="animate-hero-meta">
            <span><i aria-hidden="true" /> Connected operations</span>
            <span>Explainable intelligence</span>
            <span>Human control</span>
          </div>
        </div>

        <div className="hero-split-visual">
          <HeroConsole />
        </div>
      </div>
    </div>
  );
}
