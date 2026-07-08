import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationHeroElegant — redesigned opening/hero for the six "formal/adult"
 * categories (boda, cumple_adulto, conferencia, bautizo, confirmacion,
 * novena). Alternate to the plain `<header className="inv-hero">` block in
 * InvitationView.jsx, which keeps serving every other category untouched.
 *
 * Concept: a Canva-style formal invitation card — delicate gold-equivalent
 * line-art in all four corners (a single sparse "twig" mark, mirrored), a
 * small letter-spaced eyebrow, then the resolved event/name line HUGE and
 * unmistakably the star, a small emblem echoing the reference's wedding
 * rings, a calm italic supporting line, an ornamental hairline+glyph
 * divider, and a small-caps date line. Airy, mobile-first, one restrained
 * entrance cascade on mount — no idle motion once settled.
 *
 * Copy-field mapping (all three are rendered AS-IS, verbatim, never
 * modified — only their visual role changes):
 *   kicker (small, top)   copy.badge(dispInv)    short label in every theme
 *                          (for boda it's literally just the names; for the
 *                          other five it's "[event] de/donde [name]")
 *   name   (GIANT, star)  copy.title(dispInv)    the full per-category
 *                          announcement sentence — already the field the
 *                          current production hero trusts for its <h1>, so
 *                          reusing it here is a presentation upgrade, not a
 *                          content change. Showing the plain name first in
 *                          the kicker, then this sentence huge right below,
 *                          is what removes the "run-on sentence" complaint:
 *                          the names are no longer the ONLY place to find
 *                          them, and they're never buried without a lead-in.
 *   sub    (calm support) copy.subtitle(dispInv) the warm/tagline sentence,
 *                          echoing the reference's italic paragraph
 *
 * `emoji` (theme.emoji) is not string-parsed out of any copy field — it's
 * rendered on its own as a small ringed medallion, standing in for the
 * reference's interlocked-rings graphic in a way that generalizes to any
 * of the six themes (rings, a martini glass, a briefcase, a dove, ...).
 *
 * Props:
 *   copy       object   theme.copy — .badge/.title/.subtitle(inv) functions
 *   dispInv    object   invitation data, child_name already resolved
 *   eventDate  string   "YYYY-MM-DD" or ""                default ""
 *   emoji      string   theme.emoji                        default "✦"
 *   dark       boolean  theme.dark                          default false
 *
 * Must render inside an element that defines the --inv-* CSS custom
 * properties (same styleVars wrapper used by InvitationView).
 */

const EASE = [0.22, 1, 0.36, 1]; // weighted ease-out — no spring, no overshoot

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
 * One sparse angular "twig" mark, anchored at a corner. Reused in all four
 * corners purely via CSS mirroring (scaleX/scaleY) — one shape, one source
 * of truth. Pure line art: currentColor strokes, no raster assets.
 */
const CornerMark = () => (
  <svg viewBox="0 0 56 56" aria-hidden="true">
    <path d="M4 4 L24 24" />
    <path d="M9 9 L20 3" />
    <path d="M15 15 L28 11" />
    <path d="M19 19 L17 32" />
    <path d="M24 24 L34 21" />
    <path d="M29 22.5 L29 16" />
    <circle cx="34" cy="21" r="1.6" />
  </svg>
);

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const cornerV = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.9, ease: EASE } },
};
const upV = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const nameV = {
  hidden: { opacity: 0, y: 14, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: EASE } },
};
const lineV = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.7, ease: EASE } },
};

export const InvitationHeroElegant = ({
  copy,
  dispInv,
  eventDate = "",
  emoji = "✦",
  dark = false,
}) => {
  const reduced = useReducedMotion();
  const dateLabel = formatHeroDate(eventDate) || "FECHA POR CONFIRMAR";

  return (
    <motion.header
      className={`inv-hero-elegant-root ${dark ? "inv-hero-elegant-dark" : "inv-hero-elegant-light"}`}
      data-testid="inv-hero-elegant"
      variants={containerV}
      initial={reduced ? "show" : "hidden"}
      animate="show"
    >
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-tl" variants={cornerV}><CornerMark /></motion.span>
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-tr" variants={cornerV}><CornerMark /></motion.span>
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-bl" variants={cornerV}><CornerMark /></motion.span>
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-br" variants={cornerV}><CornerMark /></motion.span>

      <div className="inv-hero-elegant-inner">
        <motion.p className="inv-hero-elegant-kicker" data-testid="inv-badge" variants={upV}>
          {copy.badge(dispInv)}
        </motion.p>

        <motion.h1 className="inv-hero-elegant-name" data-testid="inv-title" variants={nameV}>
          {copy.title(dispInv)}
        </motion.h1>

        <motion.div className="inv-hero-elegant-emblem" variants={upV} aria-hidden="true">
          <span className="inv-hero-elegant-emblem-ring">
            <span className="inv-hero-elegant-emblem-icon">{emoji}</span>
          </span>
        </motion.div>

        <motion.p className="inv-hero-elegant-sub" data-testid="inv-subtitle" variants={upV}>
          {copy.subtitle(dispInv)}
        </motion.p>

        <motion.div className="inv-hero-elegant-divider" variants={upV} aria-hidden="true">
          <motion.span className="inv-hero-elegant-divider-line" variants={lineV} />
          <span className="inv-hero-elegant-divider-glyph">✦</span>
          <motion.span className="inv-hero-elegant-divider-line" variants={lineV} />
        </motion.div>

        <motion.p className="inv-hero-elegant-date" data-testid="inv-hero-elegant-date" variants={upV}>
          {dateLabel}
        </motion.p>
      </div>
    </motion.header>
  );
};

export default InvitationHeroElegant;
