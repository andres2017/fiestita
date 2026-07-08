import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationReveal — optional "surprise" cover shown before the invitation.
 *
 * A closed envelope, rendered with restraint (no confetti, no bounce) so it
 * reads as premium stationery rather than a party trick. Tapping anywhere
 * (or activating the button via keyboard) lets the seal fade, the flap swing
 * open with a slow, weighted ease, and the invitation card rise smoothly out
 * of the envelope — revealing the guest's name as the only payoff. Once the
 * card has settled, the whole cover fades away and `onOpen()` fires so the
 * parent can swap in the real invitation with no visual jump.
 *
 * Props:
 *   emoji        string   theme emoji for the wax seal (e.g. "🏅")          default "🎉"
 *   themeName    string   theme display name (e.g. "Sudor y Gloria")       default ""
 *   guestLabel   string   resolved name/event line, revealed on the card   default "Tu invitación"
 *   decorations  string[] ~6 emoji, shown static/ambient (no motion)       default sparkles
 *   dark         boolean  dark theme treatment (button text, glow)        default false
 *   onOpen       func     called ONCE when the open sequence finishes     default noop
 *
 * Requirements: must render inside an element that defines the --inv-* CSS
 * custom properties (same styleVars object used by InvitationView).
 */

const FALLBACK_DECOS = ["✨", "🎉", "💫", "🎊", "⭐", "🎈"];
const EASE = [0.22, 1, 0.36, 1]; // smooth, physical ease-out — no spring overshoot

export const InvitationReveal = ({
  emoji = "🎉",
  themeName = "",
  guestLabel = "Tu invitación",
  decorations = [],
  dark = false,
  onOpen = () => {},
}) => {
  const [stage, setStage] = useState("closed"); // closed -> opening -> risen -> leaving
  const openedRef = useRef(false);
  const timers = useRef([]);
  const reduced = useReducedMotion();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const decos = decorations && decorations.length ? decorations.slice(0, 6) : FALLBACK_DECOS;

  const open = () => {
    if (openedRef.current) return;
    openedRef.current = true;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(14);
    } catch {
      /* haptics are best-effort */
    }
    const t = reduced
      ? [
          [() => setStage("opening"), 20],
          [() => setStage("risen"), 260],
          [() => setStage("leaving"), 900],
          [onOpen, 1250],
        ]
      : [
          [() => setStage("opening"), 20],
          [() => setStage("risen"), 900],
          [() => setStage("leaving"), 1900],
          [onOpen, 2300],
        ];
    t.forEach(([fn, ms]) => timers.current.push(setTimeout(fn, ms)));
  };

  const flapV = {
    closed: { rotateX: 0, opacity: 1 },
    open: reduced
      ? { rotateX: 0, opacity: 0, transition: { duration: 0.2 } }
      : { rotateX: -168, opacity: [1, 1, 0], transition: { duration: 0.85, ease: EASE, times: [0, 0.75, 1] } },
  };

  const sealV = {
    closed: { scale: 1, opacity: 1 },
    open: reduced
      ? { opacity: 0, transition: { duration: 0.15 } }
      : { scale: 0.85, opacity: 0, transition: { duration: 0.4, ease: EASE } },
  };

  const cardV = {
    closed: { y: "34%", scale: 0.9, opacity: 0, rotate: 0 },
    opening: reduced ? { y: "34%", opacity: 0 } : { y: "34%", opacity: 0, transition: { duration: 0 } },
    risen: reduced
      ? { y: "-6%", scale: 1, opacity: 1, rotate: 0, transition: { duration: 0.35, delay: 0.15 } }
      : {
          y: "-40%",
          scale: 1,
          opacity: 1,
          rotate: -1.4,
          transition: { delay: 0.5, duration: 0.9, ease: EASE },
        },
    leaving: { scale: reduced ? 1 : 3.2, opacity: 0, rotate: 0, transition: { duration: 0.6, ease: "easeIn" } },
  };

  const stageWrapV = {
    closed: { opacity: 1 },
    opening: { opacity: 1 },
    risen: { opacity: 1 },
    leaving: { opacity: 0, transition: { duration: 0.4, delay: 0.15 } },
  };

  const textV = {
    closed: { opacity: 1, y: 0 },
    opening: { opacity: 0, y: -8, transition: { duration: 0.25 } },
    risen: { opacity: 0 },
    leaving: { opacity: 0 },
  };

  const isOpen = stage !== "closed";

  return (
    <motion.div
      className={`reveal-root ${dark ? "reveal-dark" : "reveal-light"}`}
      data-testid="reveal-root"
      onClick={open}
      animate={stage === "leaving" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.4, delay: stage === "leaving" ? 0.35 : 0 }}
    >
      <div className="reveal-decorations" aria-hidden="true">
        {decos.map((d, i) => (
          <span key={i} className={`reveal-deco reveal-deco-${i}`}>{d}</span>
        ))}
      </div>

      <div className="reveal-stage">
        <motion.p className="reveal-kicker" variants={textV} animate={stage === "closed" ? "closed" : "opening"}>
          💌 Te llegó una invitación
        </motion.p>

        <motion.div className="reveal-envelope-wrap" variants={stageWrapV} animate={stage}>
          <div className="reveal-envelope">
            <div className="reveal-env-body" />
            <div className="reveal-env-fold reveal-env-fold-l" />
            <div className="reveal-env-fold reveal-env-fold-r" />

            <motion.div className="reveal-card" variants={cardV} animate={stage} data-testid="reveal-card">
              <span className="reveal-card-emoji" aria-hidden="true">{emoji}</span>
              <p className="reveal-card-name">{guestLabel}</p>
              {themeName ? <p className="reveal-card-theme">{themeName}</p> : null}
            </motion.div>

            <motion.div className="reveal-env-flap" variants={flapV} animate={isOpen ? "open" : "closed"} />
            <motion.div className="reveal-env-seal" variants={sealV} animate={isOpen ? "open" : "closed"} aria-hidden="true">
              <span>{emoji}</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="reveal-btn-row" variants={textV} animate={stage === "closed" ? "closed" : "opening"}>
          <button type="button" className="reveal-btn" data-testid="reveal-open-btn">
            Abrir invitación
          </button>
          <p className="reveal-hint">Toca para abrir tu invitación</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InvitationReveal;
