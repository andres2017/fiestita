import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationReveal — optional "surprise" cover shown before the invitation.
 *
 * A closed, wax-sealed envelope. Tapping anywhere (or activating the button
 * via keyboard) breaks the seal, the flap folds open, and the invitation
 * card rises up out of the envelope with a burst of sparkles — revealing the
 * guest's name for the first time as part of the payoff. Once the card has
 * settled, the whole cover fades away and `onOpen()` fires so the parent can
 * swap in the real invitation with no visual jump.
 *
 * Props:
 *   emoji        string   theme emoji for the wax seal (e.g. "🏅")          default "🎉"
 *   themeName    string   theme display name (e.g. "Sudor y Gloria")       default ""
 *   guestLabel   string   resolved name/event line, revealed on the card   default "Tu invitación"
 *   decorations  string[] ~6 emoji for ambient float + sparkle burst       default sparkles
 *   dark         boolean  dark theme treatment (button text, glow)        default false
 *   onOpen       func     called ONCE when the open sequence finishes     default noop
 *
 * Requirements: must render inside an element that defines the --inv-* CSS
 * custom properties (same styleVars object used by InvitationView).
 */

const FALLBACK_DECOS = ["✨", "🎉", "💫", "🎊", "⭐", "🎈"];
const SPARKLES = ["✨", "⭐", "💫"];

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

  const sparkles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i * 137.5 * Math.PI) / 180;
        const dist = 70 + ((i * 47) % 120);
        const glyph = i % 4 === 0 ? decos[i % decos.length] : SPARKLES[i % SPARKLES.length];
        return {
          glyph,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 20,
          delay: 0.5 + (i % 6) * 0.045,
        };
      }),
    [decos]
  );

  const open = () => {
    if (openedRef.current) return;
    openedRef.current = true;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
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
          [() => setStage("risen"), 780],
          [() => setStage("leaving"), 1750],
          [onOpen, 2200],
        ];
    t.forEach(([fn, ms]) => timers.current.push(setTimeout(fn, ms)));
  };

  const flapV = {
    closed: { rotateX: 0, opacity: 1 },
    open: reduced
      ? { rotateX: 0, opacity: 0, transition: { duration: 0.2 } }
      : { rotateX: -150, opacity: [1, 1, 0], transition: { duration: 0.55, ease: "easeIn", times: [0, 0.6, 1] } },
  };

  const sealV = {
    closed: { scale: 1, opacity: 1, rotate: 0 },
    open: reduced
      ? { opacity: 0, transition: { duration: 0.15 } }
      : { scale: [1, 1.3, 0], rotate: [0, -10, 18], opacity: [1, 1, 0], transition: { duration: 0.4, ease: "easeOut" } },
  };

  const cardV = {
    closed: { y: "34%", scale: 0.86, opacity: 0, rotate: 0 },
    opening: reduced ? { y: "34%", opacity: 0 } : { y: "34%", opacity: 0, transition: { duration: 0 } },
    risen: reduced
      ? { y: "-6%", scale: 1, opacity: 1, rotate: 0, transition: { duration: 0.35, delay: 0.15 } }
      : {
          y: "-42%",
          scale: 1,
          opacity: 1,
          rotate: -2.5,
          transition: { delay: 0.42, type: "spring", stiffness: 170, damping: 16 },
        },
    leaving: { scale: reduced ? 1 : 6, opacity: 0, rotate: 0, transition: { duration: 0.55, ease: "easeIn" } },
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

  const showSparkles = stage === "opening" && !reduced;
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

            {showSparkles && (
              <div className="reveal-sparkles" aria-hidden="true">
                {sparkles.map((s, i) => (
                  <motion.span
                    key={i}
                    className="reveal-sparkle"
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{ x: s.x, y: s.y, scale: [0, 1.2, 0.8, 0], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.1, delay: s.delay, ease: "easeOut" }}
                  >
                    {s.glyph}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div className="reveal-btn-row" variants={textV} animate={stage === "closed" ? "closed" : "opening"}>
          <div className="reveal-btn-bob">
            <button type="button" className="reveal-btn" data-testid="reveal-open-btn">
              Abrir invitación
            </button>
          </div>
          <p className="reveal-hint">toca en cualquier parte para abrirla ✨</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InvitationReveal;
