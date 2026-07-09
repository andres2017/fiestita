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
 * card, Playfair Display for the announcement, Montserrat for labels/date,
 * a hairline+glyph divider, and a magnetic-hover affordance at the bottom.
 * Always dark regardless of the theme's own light/dark mode — this is a
 * deliberate "premium cover moment," the same way a book's dust jacket
 * doesn't have to match its interior page color. Every hue still comes from
 * the theme's own --inv-primary/--inv-accent (mixed toward near-black via
 * color-mix), so a pastel baptism and a neon happy-hour theme both render
 * this in their own palette, not one fixed look.
 *
 * Refinement pass (post-launch founder feedback): the announcement name
 * runs smaller and narrower now (max-width in `ch`, so long Spanish titles
 * balance into 2-4 short lines instead of one huge line) for a calmer,
 * "premium stationery" feel instead of a shouting headline. The hero also
 * carries more ambient richness — a slow light sweep across the name, a
 * handful of twinkling sparkle motes in the top/bottom margins, and a soft
 * breathing glow on the emblem ring — layered on top of the existing drift
 * orbs and magnetic scroll dot, all gated behind prefers-reduced-motion.
 * Corner ornaments are no longer a single generic vine: `category` selects
 * a small hand-drawn line-art motif (roses for boda, laurel for conferencia,
 * holly for novena, etc. — see HERO_MOTIFS below) so the decoration feels
 * intentional per event type instead of reused clip-art. Never emoji —
 * always `currentColor` strokes, so each motif inherits the theme via
 * color-mix exactly like everything else in this component.
 *
 * Copy-field mapping (all rendered AS-IS, verbatim, never modified):
 *   kicker    fixed phrase ("Tienes una invitación especial") — not
 *              copy.badge(dispInv), which repeats the name also shown in
 *              the giant title right below (see prior fix).
 *   name      copy.title(dispInv), in Playfair Display — the star, sized
 *              to read as an elegant announcement, not a shouting poster.
 *   sub       copy.subtitle(dispInv), Playfair italic, calm support line.
 *
 * Props:
 *   copy       object   theme.copy — .title/.subtitle(inv) functions
 *   dispInv    object   invitation data, child_name already resolved
 *   eventDate  string   "YYYY-MM-DD" or ""                default ""
 *   emoji      string   theme.emoji, shown in the ringed medallion   default "✦"
 *   category   string   theme.category, selects the corner motif       default "boda"
 *   children   node     optional — rendered inside the SAME card, right after
 *                       the date, behind its own divider (see
 *                       InvitationQuickInfoElegant). Replaces the scroll-cue
 *                       affordance, since there's nothing left to scroll to
 *                       once the quick-info content is already in this card.
 *                       Omit to keep the original scroll-cue ending.
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

/**
 * Corner ornaments: one thin line-art motif per family, stroke="currentColor"
 * so it inherits the theme via color-mix exactly like the rest of the hero.
 * Each is authored to read from a top-left corner and is reused for the
 * bottom-right corner via a 180deg CSS rotation (.inv-hero-glass-vine-br) —
 * same trick the original single vine used, just with a motif picked per
 * category instead of one fixed drawing. A couple of motifs are deliberately
 * shared across related categories (partido/reto_deportivo both read as
 * "laurel") per the founder's own note: quality over a forced 1-per-category
 * count.
 */
const HERO_MOTIFS = {
  // boda — a rosebud + leaf on a curved stem.
  rose: (
    <>
      <path d="M6 6 C 21 9, 25 23, 39 27 C 33 30, 35 42, 45 47" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M17 15 C 14 12, 10 13, 8 17 C 11.5 18.5, 15.5 18, 17 15 Z" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinejoin="round" />
      <path d="M42 19 C 45.3 19.2, 47 21.3, 46 24 C 45.2 26.2, 42.3 26.4, 41 24.5 C 40.1 23.1, 41 21.5, 42.6 21.7" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="23" r="1.1" fill="currentColor" />
      <circle cx="6" cy="6" r="2" fill="currentColor" />
      <circle cx="45" cy="47" r="1.8" fill="currentColor" />
    </>
  ),
  // cumple_adulto — festive floral laurel: leaf ticks + two small berries.
  floralLaurel: (
    <>
      <path d="M6 6 C 18 10, 22 20, 34 24 C 40 26, 44 30, 46 38" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M16 12 C 14 9, 10 9.5, 9 13" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M22 18 C 24 14.5, 28 14.5, 30 17.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M31 24 C 30 20, 33 17.5, 37 18" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle cx="41" cy="33" r="1.6" fill="currentColor" />
      <circle cx="45" cy="38" r="1.2" fill="currentColor" />
      <circle cx="6" cy="6" r="2" fill="currentColor" />
    </>
  ),
  // conferencia — sober, geometric: a straight line with minimal ticks.
  laurel: (
    <>
      <path d="M6 6 L 46 46" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M14 14 L 20 10" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M22 22 L 28 18" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M30 30 L 36 26" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M38 38 L 44 34" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle cx="6" cy="6" r="2" fill="currentColor" />
      <circle cx="46" cy="46" r="1.6" fill="currentColor" />
    </>
  ),
  // bautizo — a stylized dove wing, three fanning feather strokes.
  dove: (
    <>
      <path d="M8 8 C 20 6, 34 10, 44 22" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M8 8 C 18 12, 28 18, 36 30" stroke="currentColor" strokeWidth="0.95" fill="none" strokeLinecap="round" />
      <path d="M8 8 C 14 16, 20 26, 24 38" stroke="currentColor" strokeWidth="0.85" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <circle cx="44" cy="22" r="1.3" fill="currentColor" />
    </>
  ),
  // confirmacion — an olive branch, narrow paired leaves.
  olive: (
    <>
      <path d="M6 6 C 20 9, 26 21, 40 27 C 30 31, 34 43, 44 48" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M16 13 C 19.5 10.5, 19.5 15, 16.5 16.5 C 14 15, 14 13.5, 16 13 Z" stroke="currentColor" strokeWidth="0.85" fill="none" strokeLinejoin="round" />
      <path d="M27 22 C 30.5 19.5, 30.5 24, 27.5 25.5 C 25 24, 25 22.5, 27 22 Z" stroke="currentColor" strokeWidth="0.85" fill="none" strokeLinejoin="round" />
      <path d="M34 36 C 37.5 33.5, 37.5 38, 34.5 39.5 C 32 38, 32 36.5, 34 36 Z" stroke="currentColor" strokeWidth="0.85" fill="none" strokeLinejoin="round" />
      <circle cx="6" cy="6" r="2" fill="currentColor" />
      <circle cx="44" cy="48" r="1.8" fill="currentColor" />
    </>
  ),
  // novena — a spiky holly leaf, three berries, tiny star-glint at the corner.
  holly: (
    <>
      <path d="M8 8 C 20 10, 26 22, 38 28" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M19 13 L 23 9.5 L 24 14 L 29 12 L 26.5 17 L 31.5 18.5 L 25.5 20 L 26.5 25 L 21.5 21.5 L 17.5 24.5 L 18.5 18.5 L 13.5 17.5 Z" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinejoin="round" />
      <circle cx="33.5" cy="25" r="1.6" fill="currentColor" />
      <circle cx="37.5" cy="27.5" r="1.4" fill="currentColor" />
      <circle cx="35.5" cy="29.5" r="1.3" fill="currentColor" />
      <path d="M8 8 L 9.8 7.4 M8 8 L 8.4 6.2 M8 8 L 6.4 9" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </>
  ),
  // partido / reto_deportivo — athletic laurel, upswept, with a motion chevron.
  laurelDynamic: (
    <>
      <path d="M6 10 C 16 6, 24 10, 30 20 C 34 27, 40 30, 46 30" stroke="currentColor" strokeWidth="1.15" fill="none" strokeLinecap="round" />
      <path d="M13 10 C 12 6.5, 16 5, 18 8" stroke="currentColor" strokeWidth="0.95" fill="none" strokeLinecap="round" />
      <path d="M20 15 C 19.5 11, 23.5 9.5, 26 12.5" stroke="currentColor" strokeWidth="0.95" fill="none" strokeLinecap="round" />
      <path d="M27 21 C 27 17, 31.5 16, 33.5 19.5" stroke="currentColor" strokeWidth="0.95" fill="none" strokeLinecap="round" />
      <path d="M34 26 C 34.5 22, 39 21.5, 41 25" stroke="currentColor" strokeWidth="0.95" fill="none" strokeLinecap="round" />
      <path d="M43 27 L 46 28.3 L 44.7 31.3" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="10" r="2" fill="currentColor" />
      <circle cx="46" cy="30" r="1.5" fill="currentColor" />
    </>
  ),
  // parche — minimal botanical, two small leaf flicks, deliberately discreet.
  sprig: (
    <>
      <path d="M6 6 C 16 9, 20 17, 28 22" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M14 11 C 17 8.5, 17 12.5, 14.3 13.8" stroke="currentColor" strokeWidth="0.85" fill="none" strokeLinecap="round" />
      <path d="M21 17 C 24 14.5, 24 18.5, 21.3 19.8" stroke="currentColor" strokeWidth="0.85" fill="none" strokeLinecap="round" />
      <circle cx="6" cy="6" r="1.8" fill="currentColor" />
      <circle cx="28" cy="22" r="1.4" fill="currentColor" />
    </>
  ),
  // baby_shower — a gentle mobile-style arc of graduated bubbles, plus a tiny rattle ring.
  baby: (
    <>
      <path d="M6 28 C 12 14, 30 8, 44 15" stroke="currentColor" strokeWidth="1.05" fill="none" strokeLinecap="round" />
      <circle cx="6" cy="28" r="2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <circle cx="27" cy="8" r="1.3" fill="currentColor" />
      <circle cx="38" cy="10" r="1.7" fill="currentColor" />
      <circle cx="44" cy="15" r="1.3" fill="currentColor" />
      <circle cx="21" cy="23" r="3.4" stroke="currentColor" strokeWidth="0.85" fill="none" />
    </>
  ),
  // grado — a simple mortarboard with a hanging tassel.
  gradCap: (
    <>
      <path d="M6 20 L 25 12 L 44 20 L 25 28 Z" stroke="currentColor" strokeWidth="1.05" fill="none" strokeLinejoin="round" />
      <path d="M25 28 L 25 37" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <circle cx="25" cy="39.5" r="1.8" fill="currentColor" />
      <path d="M38 22.5 L 38 31 C 38 33.5, 34 34.5, 32 32.5" stroke="currentColor" strokeWidth="0.85" fill="none" strokeLinecap="round" />
      <circle cx="6" cy="20" r="1.8" fill="currentColor" />
    </>
  ),
};

const CATEGORY_MOTIF = {
  boda: "rose",
  cumple_adulto: "floralLaurel",
  conferencia: "laurel",
  bautizo: "dove",
  confirmacion: "olive",
  novena: "holly",
  partido: "laurelDynamic",
  reto_deportivo: "laurelDynamic",
  parche: "sprig",
  tarjeta_regalo: "rose",
  baby_shower: "baby",
  grado: "gradCap",
};

function getHeroMotif(category) {
  return HERO_MOTIFS[CATEGORY_MOTIF[category]] || HERO_MOTIFS.rose;
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

export const InvitationHeroElegant = ({ copy, dispInv, eventDate = "", emoji = "✦", category = "boda", children }) => {
  const reduced = useReducedMotion();
  const dateLabel = formatHeroDate(eventDate) || "FECHA POR CONFIRMAR";
  const magnetRef = useMagnetic(reduced);
  const motif = getHeroMotif(category);

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
      <div className="inv-hero-glass-sparkles" aria-hidden="true">
        <span className="inv-hero-glass-spark inv-hero-glass-spark-1" />
        <span className="inv-hero-glass-spark inv-hero-glass-spark-2" />
        <span className="inv-hero-glass-spark inv-hero-glass-spark-3" />
        <span className="inv-hero-glass-spark inv-hero-glass-spark-4" />
        <span className="inv-hero-glass-spark inv-hero-glass-spark-5" />
      </div>

      <div className="inv-hero-glass-card">
        <span className="inv-hero-glass-vine inv-hero-glass-vine-tl" aria-hidden="true">
          <svg viewBox="0 0 100 100">{motif}</svg>
        </span>
        <span className="inv-hero-glass-vine inv-hero-glass-vine-br" aria-hidden="true">
          <svg viewBox="0 0 100 100">{motif}</svg>
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

        {children ? (
          <>
            <motion.div className="inv-hero-glass-divider" variants={upV} aria-hidden="true">
              <motion.span className="inv-hero-glass-divider-line" variants={lineV} />
              <span className="inv-hero-glass-divider-glyph">✦</span>
              <motion.span className="inv-hero-glass-divider-line" variants={lineV} />
            </motion.div>
            {children}
          </>
        ) : (
          <motion.div className="inv-hero-glass-scroll" variants={upV} aria-hidden="true">
            <span ref={magnetRef} className="inv-hero-glass-scroll-dot">▼</span>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default InvitationHeroElegant;
