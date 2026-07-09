import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * InvitationHeroElegant — dark glassmorphic / mesh-gradient opening for the
 * nine "grown-up" categories (boda, cumple_adulto, conferencia, bautizo,
 * confirmacion, novena, partido, parche, reto_deportivo). Alternate to the
 * plain `<header className="inv-hero">` block in InvitationView.jsx, which
 * keeps serving every other category (cumple_infantil) untouched.
 *
 * Concept, approved by the founder from a standalone concept piece: an
 * animated dark mesh gradient + drifting glow orbs behind a frosted glass
 * card, Playfair Display for the announcement (huge, the star), Montserrat
 * for labels/date, a hairline+glyph divider, and a magnetic-hover affordance
 * at the bottom. Always dark regardless of the theme's own light/dark mode —
 * this is a deliberate "premium cover moment," the same way a book's dust
 * jacket doesn't have to match its interior page color. Every hue still
 * comes from the theme's own --inv-primary/--inv-accent (mixed toward near-
 * black via color-mix), so a pastel baptism and a neon happy-hour theme both
 * render this in their own palette, not one fixed look.
 *
 * Copy-field mapping (all rendered AS-IS, verbatim, never modified):
 *   kicker    fixed phrase ("Tienes una invitación especial") — not
 *              copy.badge(dispInv), which repeats the name also shown in
 *              the giant title right below (see prior fix).
 *   name      copy.title(dispInv), GIANT, in Playfair Display — the star.
 *   sub       copy.subtitle(dispInv), Playfair italic, calm support line.
 *
 * Props:
 *   copy       object   theme.copy — .title/.subtitle(inv) functions
 *   dispInv    object   invitation data, child_name already resolved
 *   eventDate  string   "YYYY-MM-DD" or ""                default ""
 *   emoji      string   theme.emoji, shown in the ringed medallion   default "✦"
 *
 * Must render inside an element that defines the --inv-* CSS custom
 * properties (same styleVars wrapper used by InvitationView).
 */

const MONTHS_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

/** "YYYY-MM-DD" -> "MARZO 25 · 2026". Returns null when unparseable. */
function formatHeroDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d || !MONTHS_ES[m - 1]) return null;
  return `${MONTHS_ES[m - 1]} ${d} · ${y}`;
}

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const upV = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
};
const nameV = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};
const lineV = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

/** Magnetic pull: the scroll cue eases toward the pointer within a small radius. */
function useMagnetic(reduced) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const radius = 60, strength = 0.3;
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;

    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
      raf = Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(loop) : null;
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      tx = dist < radius ? dx * strength : 0;
      ty = dist < radius ? dy * strength : 0;
      start();
    };
    const onLeave = () => { tx = 0; ty = 0; start(); };
    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);
  return ref;
}

export const InvitationHeroElegant = ({ copy, dispInv, eventDate = "", emoji = "✦" }) => {
  const reduced = useReducedMotion();
  const dateLabel = formatHeroDate(eventDate) || "FECHA POR CONFIRMAR";
  const magnetRef = useMagnetic(reduced);

  return (
    <motion.header
      className="inv-hero-glass"
      data-testid="inv-hero-elegant"
      variants={containerV}
      initial={reduced ? "show" : "hidden"}
      animate="show"
    >
      <div className="inv-hero-glass-atmosphere" aria-hidden="true" />
      <div className="inv-hero-glass-orb inv-hero-glass-orb-1" aria-hidden="true" />
      <div className="inv-hero-glass-orb inv-hero-glass-orb-2" aria-hidden="true" />
      <div className="inv-hero-glass-orb inv-hero-glass-orb-3" aria-hidden="true" />

      <div className="inv-hero-glass-card">
        <span className="inv-hero-glass-vine inv-hero-glass-vine-tl" aria-hidden="true">
          <svg viewBox="0 0 100 100"><path d="M6 6 C 20 10, 24 24, 40 26 C 30 30, 34 44, 46 48" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" /><circle cx="40" cy="26" r="2.4" fill="currentColor" /><circle cx="46" cy="48" r="2" fill="currentColor" /><circle cx="6" cy="6" r="2" fill="currentColor" /></svg>
        </span>
        <span className="inv-hero-glass-vine inv-hero-glass-vine-br" aria-hidden="true">
          <svg viewBox="0 0 100 100"><path d="M6 6 C 20 10, 24 24, 40 26 C 30 30, 34 44, 46 48" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" /><circle cx="40" cy="26" r="2.4" fill="currentColor" /><circle cx="46" cy="48" r="2" fill="currentColor" /><circle cx="6" cy="6" r="2" fill="currentColor" /></svg>
        </span>

        <motion.p className="inv-hero-glass-kicker" data-testid="inv-badge" variants={upV}>
          Tienes una invitación especial
        </motion.p>

        <motion.div className="inv-hero-glass-emblem" variants={upV} aria-hidden="true">
          <span className="inv-hero-glass-emblem-ring">
            <span className="inv-hero-glass-emblem-icon">{emoji}</span>
          </span>
        </motion.div>

        <motion.h1 className="inv-hero-glass-name" data-testid="inv-title" variants={nameV}>
          {copy.title(dispInv)}
        </motion.h1>

        <motion.p className="inv-hero-glass-sub" data-testid="inv-subtitle" variants={upV}>
          {copy.subtitle(dispInv)}
        </motion.p>

        <motion.div className="inv-hero-glass-divider" variants={upV} aria-hidden="true">
          <motion.span className="inv-hero-glass-divider-line" variants={lineV} />
          <span className="inv-hero-glass-divider-glyph">✦</span>
          <motion.span className="inv-hero-glass-divider-line" variants={lineV} />
        </motion.div>

        <motion.p className="inv-hero-glass-date" data-testid="inv-hero-elegant-date" variants={upV}>
          {dateLabel}
        </motion.p>

        <motion.div className="inv-hero-glass-scroll" variants={upV} aria-hidden="true">
          <span ref={magnetRef} className="inv-hero-glass-scroll-dot">▼</span>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default InvitationHeroElegant;
