import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationHeroElegant — redesigned opening/hero for the six "formal/adult"
 * categories (boda, cumple_adulto, conferencia, bautizo, confirmacion,
 * novena), plus the three "energetic" categories (partido, parche,
 * reto_deportivo) via the `energetic` prop below. Alternate to the plain
 * `<header className="inv-hero">` block in InvitationView.jsx, which keeps
 * serving every other category untouched.
 *
 * Concept: a Canva-style formal invitation card — delicate gold-equivalent
 * line-art in all four corners (a single sparse "twig" mark, mirrored), a
 * small letter-spaced eyebrow, then the resolved event/name line HUGE and
 * unmistakably the star, a small emblem echoing the reference's wedding
 * rings, a calm italic supporting line, an ornamental hairline+glyph
 * divider, and a small-caps date line. Airy, mobile-first, one restrained
 * entrance cascade on mount — no idle motion once settled.
 *
 * Energetic variant (`energetic` prop, themes mundial/tardeo/gloria): those
 * three run bold impact/poster fonts (Anton, Lilita One, Russo One) on
 * saturated, near-neon dark palettes, with shouty slang copy ("¡GOOOL!",
 * "¡DE UNA, ME APUNTO!", "¿Te le mides?"). The default CornerMark is a
 * literal botanical twig-and-bud rendered at a 1.15px hairline — that's
 * wedding-stationery filigree by construction, and it visually undercuts
 * that register instead of framing it. Rather than force one ornament
 * across both moods, `energetic` swaps in CornerMarkEnergetic (a crop-mark
 * bracket + diagonal speed-slashes + a filled diamond stud, heavy stroke,
 * sharp miter/square joins) and the divider/date glyph (✦ -> ◆), while the
 * structural skeleton, sizing, stagger choreography and reduced-motion
 * handling are identical for every category — only the ornament mood
 * changes, never the layout contract.
 *
 * Copy-field mapping:
 *   kicker (small, top)   fixed phrase ("Tienes una invitación especial") —
 *                          NOT copy.badge(dispInv). Earlier version reused
 *                          badge here, but badge already contains the name
 *                          in every theme, so it duplicated the name that
 *                          also appears in the giant title right below —
 *                          read as a repetition bug, not a lead-in/payoff
 *                          structure. A name-free kicker fixes that while
 *                          still echoing the reference's "Nos complace
 *                          invitarte a:" framing line.
 *   name   (GIANT, star)  copy.title(dispInv)    the full per-category
 *                          announcement sentence, rendered AS-IS/verbatim —
 *                          already the field the plain production hero
 *                          trusts for its <h1>, so reusing it here is a
 *                          presentation upgrade, not a content change.
 *   sub    (calm support) copy.subtitle(dispInv) the warm/tagline sentence,
 *                          echoing the reference's italic paragraph,
 *                          rendered AS-IS/verbatim
 *
 * `emoji` (theme.emoji) is not string-parsed out of any copy field — it's
 * rendered on its own as a small ringed medallion, standing in for the
 * reference's interlocked-rings graphic in a way that generalizes to any
 * of the themes (rings, a martini glass, a briefcase, a dove, a medal, ...).
 *
 * Props:
 *   copy       object   theme.copy — .badge/.title/.subtitle(inv) functions
 *   dispInv    object   invitation data, child_name already resolved
 *   eventDate  string   "YYYY-MM-DD" or ""                default ""
 *   emoji      string   theme.emoji                        default "✦"
 *   dark       boolean  theme.dark                          default false
 *   energetic  boolean  opt into the bolder ornament set     default false
 *                        (mundial/tardeo/gloria today). Unset for every
 *                        existing call site, so the six formal categories
 *                        render byte-for-byte as before.
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

/**
 * Bolder counterpart to CornerMark for the `energetic` variant: a crop-mark
 * bracket (reads as "premium framing", same job as the twig) plus a pair of
 * diagonal speed-slashes for motion, plus a filled diamond stud standing in
 * for the twig's soft circle bud. Sharp angles only — no organic curves —
 * rendered with a heavier stroke via CSS (see .inv-hero-elegant-energetic
 * .inv-hero-elegant-corner in App.css). Same viewBox and mirroring strategy
 * as CornerMark, so it drops into the same four corner slots unchanged.
 */
const CornerMarkEnergetic = () => (
  <svg viewBox="0 0 56 56" aria-hidden="true">
    <path d="M3 22 L3 3 L22 3" />
    <path d="M13 33 L33 13" />
    <path d="M21 41 L41 21" />
    <rect x="35" y="3" width="8.5" height="8.5" transform="rotate(45 39.25 7.25)" />
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
  energetic = false,
}) => {
  const reduced = useReducedMotion();
  const dateLabel = formatHeroDate(eventDate) || "FECHA POR CONFIRMAR";
  const Mark = energetic ? CornerMarkEnergetic : CornerMark;
  const rootClass = [
    "inv-hero-elegant-root",
    dark ? "inv-hero-elegant-dark" : "inv-hero-elegant-light",
    energetic ? "inv-hero-elegant-energetic" : "",
  ].filter(Boolean).join(" ");

  return (
    <motion.header
      className={rootClass}
      data-testid="inv-hero-elegant"
      variants={containerV}
      initial={reduced ? "show" : "hidden"}
      animate="show"
    >
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-tl" variants={cornerV}><Mark /></motion.span>
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-tr" variants={cornerV}><Mark /></motion.span>
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-bl" variants={cornerV}><Mark /></motion.span>
      <motion.span className="inv-hero-elegant-corner inv-hero-elegant-corner-br" variants={cornerV}><Mark /></motion.span>

      <div className="inv-hero-elegant-inner">
        <motion.p className="inv-hero-elegant-kicker" data-testid="inv-badge" variants={upV}>
          Tienes una invitación especial
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
          <span className="inv-hero-elegant-divider-glyph">{energetic ? "◆" : "✦"}</span>
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
