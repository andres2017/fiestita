import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationItinerary — elegant vertical timeline of the event's moments.
 *
 * A single hairline runs down a left rail; each moment gets a small dot,
 * a right-aligned time in the theme's primary color, an optional emoji and
 * a label. Works for any event type (ceremonia → brindis → cena → baile,
 * or a match day, a conference agenda, etc). Items fade in with a gentle
 * stagger as the card scrolls into view.
 *
 * Props:
 *   items  Array<{ time: "HH:MM", label: string, emoji?: string }>
 *          already in display order; emoji may be "" or missing.
 *
 * Must render inside an element that defines the --inv-* CSS variables
 * (same styleVars wrapper used by InvitationView).
 */

const EASE = [0.22, 1, 0.36, 1];

function formatTimeEs(timeStr) {
  if (!timeStr) return "";
  const [h, min] = timeStr.split(":").map(Number);
  const period = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${period}`;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE, staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export const InvitationItinerary = ({ items }) => {
  const reduced = useReducedMotion();

  return (
    <motion.section
      className="inv-card inv-card-elegant inv-itin-card"
      variants={listVariants}
      initial={reduced ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      data-testid="inv-itinerary"
    >
      <h2 className="inv-section-title">🗓️ Itinerario</h2>
      <div className="inv-elegant-divider" aria-hidden="true"><span>✦</span></div>
      <ol className="inv-itin">
        {items.map((it, i) => (
          <motion.li
            className="inv-itin-item"
            variants={itemVariants}
            key={`${it.time}-${i}`}
            data-testid="inv-itinerary-item"
          >
            <span className="inv-itin-time">{formatTimeEs(it.time)}</span>
            <span className="inv-itin-rail" aria-hidden="true"><span className="inv-itin-dot" /></span>
            <span className="inv-itin-body">
              {it.emoji && it.emoji.trim() ? (
                <span className="inv-itin-emoji" aria-hidden="true">{it.emoji}</span>
              ) : null}
              <span className="inv-itin-label">{it.label}</span>
            </span>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
};
