import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationRevealElegant — "romper el sello" cover for adult/formal events
 * (weddings, adult birthdays). Alternate to InvitationReveal (the envelope),
 * which keeps serving every other category untouched.
 *
 * Concept: the whole cover is one object — a wax seal hanging from a silk
 * thread, stamped with the celebrant's monogram initial. The guest doesn't
 * watch an envelope open; they BREAK THE SEAL, the gesture formal
 * correspondence has always been opened with. On tap the seal compresses
 * under the finger, cracks along an irregular seam, the two wax halves drift
 * apart and dissolve, the thread releases, and in the seal's exact place the
 * guest line materializes out of focus — crowned by the theme name in small
 * caps and underlined by the house ornamental divider (hairline ✦ hairline)
 * drawing itself outward. Then the cover fades and onOpen() fires.
 *
 * Restraint is deliberate: no confetti, no bounce/spring, no overshoot. The
 * only idle motion is a soft breathing glow and a few twinkling motes around
 * the seal while it waits to be tapped — otherwise everything holds still
 * until the guest acts. On mount, the thread drops, the seal settles in
 * after it, and the hint copy below settles in last — a brief one-shot
 * choreography, not a loop.
 * Every color comes from the theme's --inv-* custom properties so it works
 * across all adult palettes (tan/gold wedding, wine/gold confirmation,
 * black/gold night party), light or dark.
 *
 * Props (identical contract to InvitationReveal so the parent swaps 1:1):
 *   emoji        string   fallback die mark when no monogram letter   default "🥂"
 *   themeName    string   small-caps line above the revealed name     default ""
 *   guestLabel   string   revealed line; its first letter is the die  default "Tu invitación"
 *   decorations  string[] accepted for contract parity but NOT rendered —
 *                         an emoji scatter would undercut the formal look
 *   dieStyle     string   what's engraved in the die: "letter" (default —
 *                         the monogram initial, emoji fallback, exactly the
 *                         behavior before this prop existed) or "crest" (a
 *                         simplified heraldic escutcheon — fleur-de-lis
 *                         shield in fine strokes, flanked by laurel sprigs)
 *   dark         boolean  dark theme treatment (glow, contrast tweaks) default false
 *   onOpen       func     called ONCE when the open sequence resolves  default noop
 *
 * Must render inside an element that defines the --inv-* CSS custom props
 * (same styleVars wrapper used by InvitationView).
 */

const EASE = [0.22, 1, 0.36, 1]; // weighted ease-out — no spring, no overshoot

/** First real letter of the label (any alphabet), uppercased — the seal die. */
const monogramOf = (label) => {
  const m = String(label || "").trim().match(/\p{L}/u);
  return m ? m[0].toUpperCase() : null;
};

/**
 * Scalloped seal silhouette — 19 rounded lobes (like a hand-pressed wax seal's
 * rippled edge) with a subtle low-frequency wobble so it reads poured, not
 * machine-cut. Emitted once at module load as a %-based clip-path polygon:
 * percentages resolve against each layer's own box, so the rim / valley / body
 * layers below can share this one shape at different insets and any seal size
 * while staying perfectly concentric.
 */
const SEAL_SHAPE = (() => {
  const POINTS = 200, LOBES = 19, DEPTH = 0.047, RADIUS = 47.6;
  const pts = [];
  for (let i = 0; i < POINTS; i++) {
    const t = (i / POINTS) * 2 * Math.PI;
    const wobble = 1 + 0.011 * Math.sin(3 * t + 1.7) + 0.007 * Math.sin(5 * t + 0.6);
    const r = RADIUS * (1 - DEPTH + DEPTH * Math.cos(LOBES * t)) * wobble;
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)}% ${(50 + r * Math.sin(t)).toFixed(2)}%`);
  }
  return `polygon(${pts.join(",")})`;
})();

/**
 * Engraved heraldic crest — the alternative die (dieStyle="crest") to the
 * monogram letter. The founder's reference photo (a real armorial seal with
 * lion supporters, a fleur-de-lis and a motto ribbon) is deliberately reduced
 * to what stays legible on a ~60-90px die: an escutcheon with a double
 * hairline border, one solid fleur-de-lis, and a small laurel sprig per side.
 * Everything is stroked/filled in currentColor so it inherits the letter
 * die's exact incised tone (color-mix of --inv-primary toward black, set on
 * .reveal-elegant-die) and works on light and dark wax alike. Static element
 * shared by the three SealFace copies — it contains no ids, so duplicating
 * it in the DOM stays valid.
 */
const CREST_DIE = (
  <svg
    className="reveal-elegant-crest"
    viewBox="8 13 32 23"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {/* escutcheon — double engraved outline */}
    <path strokeWidth="1.1" d="M14.5 13.6H33.5V22.4C33.5 28.6 29.8 32.9 24 35.3C18.2 32.9 14.5 28.6 14.5 22.4Z" />
    <path strokeWidth="0.75" opacity="0.8" d="M16.6 15.6H31.4V22.2C31.4 27.3 28.5 30.7 24 32.8C19.5 30.7 16.6 27.3 16.6 22.2Z" />
    {/* fleur-de-lis: three solid petals over a stroked band, lens-shaped tail */}
    <g fill="currentColor" stroke="none">
      <path d="M24 17.4C22.9 19.2 22.9 21.6 24 23.9C25.1 21.6 25.1 19.2 24 17.4Z" />
      <path d="M22.9 23.8C20.9 24 19.4 22.9 19.4 21.2C19.4 20.6 19.7 20.1 20.2 19.8C20.6 21.2 21.6 22.6 22.9 23.8Z" />
      <path d="M25.1 23.8C27.1 24 28.6 22.9 28.6 21.2C28.6 20.6 28.3 20.1 27.8 19.8C27.4 21.2 26.4 22.6 25.1 23.8Z" />
      <path d="M24 25.5C23.3 26.5 23.3 27.5 24 28.5C24.7 27.5 24.7 26.5 24 25.5Z" />
    </g>
    <path strokeWidth="0.9" d="M21.2 24.75H26.8" />
    {/* laurel sprigs hugging the shield's lower curve, leaves fanning upward */}
    <path d="M12 30.6C10.4 28.9 10.4 21.1 12 19.4" />
    <path d="M36 30.6C37.6 28.9 37.6 21.1 36 19.4" />
    <g fill="currentColor" stroke="none">
      <path d="M0 0Q1.5 -1.1 3 0Q1.5 1.1 0 0Z" transform="translate(11.5 29.3) rotate(-160)" />
      <path d="M0 0Q1.5 -1.1 3 0Q1.5 1.1 0 0Z" transform="translate(10.8 25) rotate(-130)" />
      <path d="M0 0Q1.5 -1.1 3 0Q1.5 1.1 0 0Z" transform="translate(11.5 20.7) rotate(-100)" />
      <path d="M0 0Q1.5 -1.1 3 0Q1.5 1.1 0 0Z" transform="translate(36.5 29.3) rotate(-20)" />
      <path d="M0 0Q1.5 -1.1 3 0Q1.5 1.1 0 0Z" transform="translate(37.2 25) rotate(-50)" />
      <path d="M0 0Q1.5 -1.1 3 0Q1.5 1.1 0 0Z" transform="translate(36.5 20.7) rotate(-80)" />
    </g>
  </svg>
);

/**
 * One full seal face — beveled scalloped rim, pressed valley groove, satin wax
 * body, engraved ring and die. The die is the monogram initial (emoji
 * fallback) or, when dieStyle="crest", the heraldic crest above — either way
 * it keeps the ✦ marks over and under it, so both styles share one stamped-
 * emblem language. Rendered three times — an intact copy on top, and two
 * pre-cracked halves hidden beneath it — so the closed seal is seamless and
 * the crack simply "appears" when the intact copy vanishes.
 */
const SealFace = ({ monogram, emoji, dieStyle }) => (
  <span className="reveal-elegant-face" style={{ "--seal-shape": SEAL_SHAPE }} aria-hidden="true">
    <span className="reveal-elegant-wax-rim" />
    <span className="reveal-elegant-wax-valley" />
    <span className="reveal-elegant-wax">
      <span className="reveal-elegant-wax-sheen" />
      <span className="reveal-elegant-wax-ring" />
      {dieStyle === "crest" ? (
        <span className="reveal-elegant-die">{CREST_DIE}</span>
      ) : (
        <span className={`reveal-elegant-die${monogram ? "" : " reveal-elegant-die-emoji"}`}>
          {monogram || emoji}
        </span>
      )}
    </span>
  </span>
);

export const InvitationRevealElegant = ({
  emoji = "🥂",
  themeName = "",
  guestLabel = "Tu invitación",
  dieStyle = "letter",
  dark = false,
  onOpen = () => {},
}) => {
  const [stage, setStage] = useState("sealed"); // sealed -> cracking -> revealed -> leaving
  const openedRef = useRef(false);
  const timers = useRef([]);
  const reduced = useReducedMotion();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const monogram = monogramOf(guestLabel);

  const open = () => {
    if (openedRef.current) return;
    openedRef.current = true;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
    } catch {
      /* haptics are best-effort */
    }
    const seq = reduced
      ? [
          [() => setStage("cracking"), 20],
          [() => setStage("revealed"), 260],
          [() => setStage("leaving"), 1550],
          [onOpen, 1950],
        ]
      : [
          [() => setStage("cracking"), 20],
          [() => setStage("revealed"), 780],
          [() => setStage("leaving"), 2650],
          [onOpen, 3200],
        ];
    seq.forEach(([fn, ms]) => timers.current.push(setTimeout(fn, ms)));
  };

  /* --- seal break --- */
  const intactV = {
    sealed: { opacity: 1 },
    cracking: { opacity: 0, transition: { duration: reduced ? 0.25 : 0.1, ease: "easeOut" } },
  };
  const halfLV = {
    sealed: { x: 0, y: 0, rotate: 0, opacity: 1 },
    cracking: reduced
      ? { opacity: 0, transition: { duration: 0.25 } }
      : {
          x: -36, y: 26, rotate: -7, opacity: [1, 1, 0],
          transition: { delay: 0.08, duration: 0.9, ease: EASE, times: [0, 0.55, 1] },
        },
  };
  const halfRV = {
    sealed: { x: 0, y: 0, rotate: 0, opacity: 1 },
    cracking: reduced
      ? { opacity: 0, transition: { duration: 0.25 } }
      : {
          x: 38, y: 31, rotate: 8.5, opacity: [1, 1, 0],
          transition: { delay: 0.08, duration: 0.9, ease: EASE, times: [0, 0.55, 1] },
        },
  };
  const ringV = {
    sealed: { opacity: 0, scale: 0.85 },
    cracking: reduced
      ? { opacity: 0 }
      : { opacity: [0, 0.5, 0], scale: 1.5, transition: { duration: 0.85, ease: EASE, times: [0, 0.22, 1] } },
  };
  const ribbonV = {
    hidden: { scaleY: 0, opacity: 0 }, // mount only — thread not yet dropped
    sealed: { scaleY: 1, opacity: 1, transition: { duration: 0.6, ease: EASE } },
    cracking: reduced
      ? { opacity: 0, transition: { duration: 0.3 } }
      : { scaleY: 0, opacity: 0, transition: { delay: 0.12, duration: 0.55, ease: EASE } },
  };
  const introV = {
    hidden: { opacity: 0, y: 10 }, // mount only — settles in after the seal
    sealed: { opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.75, ease: EASE } },
    cracking: { opacity: 0, y: 6, transition: { duration: 0.3, ease: "easeOut" } },
  };

  /* --- payoff (materializes where the seal was) --- */
  const payKickerV = {
    hidden: { opacity: 0, y: 8 },
    in: { opacity: 1, y: 0, transition: { duration: reduced ? 0.3 : 0.55, ease: EASE } },
  };
  const payNameV = reduced
    ? { hidden: { opacity: 0 }, in: { opacity: 1, transition: { duration: 0.35 } } }
    : {
        hidden: { opacity: 0, y: 14, scale: 0.985, filter: "blur(7px)" },
        in: {
          opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
          transition: { delay: 0.08, duration: 0.8, ease: EASE },
        },
      };
  const payLineV = reduced
    ? { hidden: { opacity: 0 }, in: { opacity: 1, transition: { delay: 0.1, duration: 0.35 } } }
    : { hidden: { scaleX: 0 }, in: { scaleX: 1, transition: { delay: 0.5, duration: 0.65, ease: EASE } } };
  const payStarV = {
    hidden: { opacity: 0 },
    in: { opacity: 0.85, transition: { delay: reduced ? 0.1 : 0.45, duration: 0.4 } },
  };

  const crackAnim = stage === "sealed" ? "sealed" : "cracking";
  const payAnim = stage === "revealed" || stage === "leaving" ? "in" : "hidden";
  const canTap = stage === "sealed";

  return (
    <motion.div
      className={`reveal-elegant-root ${dark ? "reveal-elegant-dark" : "reveal-elegant-light"}${canTap ? "" : " reveal-elegant-opened"}`}
      data-testid="reveal-elegant-root"
      onClick={open}
      animate={stage === "leaving" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="reveal-elegant-stage">
        <motion.div className="reveal-elegant-ribbon" variants={ribbonV} initial={reduced ? false : "hidden"} animate={crackAnim} aria-hidden="true" />

        <div className="reveal-elegant-center">
          <span className="reveal-elegant-ambient" aria-hidden="true">
            <span className="reveal-elegant-glow" />
            <span className="reveal-elegant-spark reveal-elegant-spark-1" />
            <span className="reveal-elegant-spark reveal-elegant-spark-2" />
            <span className="reveal-elegant-spark reveal-elegant-spark-3" />
            <span className="reveal-elegant-spark reveal-elegant-spark-4" />
          </span>

          <motion.button
            type="button"
            className="reveal-elegant-seal"
            data-testid="reveal-elegant-open-btn"
            aria-label="Abrir invitación"
            aria-disabled={!canTap}
            onClick={open}
            initial={reduced ? false : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.75, delay: 0.3, ease: EASE } }}
            whileHover={canTap && !reduced ? { scale: 1.02 } : undefined}
            whileTap={canTap && !reduced ? { scale: 0.955 } : undefined}
            transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
          >
            <motion.span className="reveal-elegant-half reveal-elegant-half-l" variants={halfLV} animate={crackAnim}>
              <SealFace monogram={monogram} emoji={emoji} dieStyle={dieStyle} />
            </motion.span>
            <motion.span className="reveal-elegant-half reveal-elegant-half-r" variants={halfRV} animate={crackAnim}>
              <SealFace monogram={monogram} emoji={emoji} dieStyle={dieStyle} />
            </motion.span>
            <motion.span className="reveal-elegant-intact" variants={intactV} animate={crackAnim}>
              <SealFace monogram={monogram} emoji={emoji} dieStyle={dieStyle} />
            </motion.span>
            <motion.span className="reveal-elegant-ringpulse" variants={ringV} animate={crackAnim} aria-hidden="true" />
          </motion.button>

          <div className="reveal-elegant-payoff" aria-hidden={payAnim === "hidden"}>
            {themeName ? (
              <motion.p className="reveal-elegant-payoff-kicker" variants={payKickerV} animate={payAnim}>
                {themeName}
              </motion.p>
            ) : null}
            <motion.p className="reveal-elegant-name" data-testid="reveal-elegant-name" variants={payNameV} animate={payAnim}>
              {guestLabel}
            </motion.p>
            <div className="reveal-elegant-payoff-divider">
              <motion.span className="reveal-elegant-payoff-line reveal-elegant-payoff-line-l" variants={payLineV} animate={payAnim} />
              <motion.span className="reveal-elegant-payoff-star" variants={payStarV} animate={payAnim} aria-hidden="true">✦</motion.span>
              <motion.span className="reveal-elegant-payoff-line reveal-elegant-payoff-line-r" variants={payLineV} animate={payAnim} />
            </div>
          </div>
        </div>

        <motion.div className="reveal-elegant-intro" variants={introV} initial={reduced ? false : "hidden"} animate={crackAnim}>
          <p className="reveal-elegant-kicker">Una invitación para ti</p>
          <p className="reveal-elegant-hint">Toca el sello para abrirla</p>
        </motion.div>

        <div className="reveal-elegant-spacer" aria-hidden="true" />
      </div>
    </motion.div>
  );
};

export default InvitationRevealElegant;
