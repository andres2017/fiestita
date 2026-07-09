import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationQuickInfoElegant — the "everything at a glance" continuation of
 * InvitationHeroElegant: personal message, FECHA + LUGAR, an optional
 * dress-code tag, and a solid gold CTA that jumps to the real #rsvp section.
 *
 * Rendered as `children` of InvitationHeroElegant, so it lives INSIDE the
 * hero's own .inv-hero-glass-card — one continuous card, one border, one
 * shadow, not two cards stacked with a seam between them (an earlier
 * revision rendered this as its own section+card and the founder flagged
 * that it visually read as "separated"; merging into a single card via the
 * children prop fixed that structurally instead of fighting it with
 * negative-margin CSS tricks).
 *
 * Theming: same contract as the hero — every hue comes from the ancestor's
 * --inv-primary/--inv-accent/--inv-soft via color-mix(), so it holds up
 * across every palette (including the custom-palette override). No
 * hardcoded non-neutral color.
 *
 * Props:
 *   inv            object  raw invitation (NOT dispInv). Reads event_date,
 *                          event_time, venue, address, message, dress_code —
 *                          every one of those may be "" / null / undefined.
 *   punctualNote   string  optional small note shown under the date/venue
 *                          block (e.g. the theme's copy.punctual). Skipped
 *                          when empty or when there's no date to anchor it.
 *   rsvpHref       string  anchor target for the CTA, e.g. "#rsvp"
 *   confirmLabel   string  CTA button label, e.g. "Confirmar asistencia"
 *
 * Every data block hides completely when its source field is empty — no
 * "Por definir" placeholders here (unlike the rest of the page): this
 * always wants to read as fully curated, never half-filled.
 */

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * "YYYY-MM-DD" (+ optional "HH:MM") -> "22 de noviembre, 2026 · 5:00 PM".
 * Returns null when there's no usable date — the whole FECHA block hides.
 */
function formatQuickDate(dateStr, timeStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d || !MONTHS_ES[m - 1]) return null;

  let out = `${d} de ${MONTHS_ES[m - 1]}, ${y}`;

  if (timeStr) {
    const [h, min] = String(timeStr).split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(min)) {
      const period = h < 12 ? "AM" : "PM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      out += ` · ${h12}:${String(min).padStart(2, "0")} ${period}`;
    }
  }

  return out;
}

const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
};
const upV = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export const InvitationQuickInfoElegant = ({
  inv,
  punctualNote,
  rsvpHref = "#rsvp",
  confirmLabel = "Confirmar asistencia",
}) => {
  const reduced = useReducedMotion();
  const data = inv || {};

  const dateLabel = formatQuickDate(data.event_date, data.event_time);
  const hasVenue = Boolean(data.venue || data.address);
  const hasMessage = Boolean(data.message);
  const hasDressCode = Boolean(data.dress_code);
  const showPunctual = Boolean(punctualNote && dateLabel);

  return (
    <motion.div
      className="inv-quickinfo"
      data-testid="inv-quickinfo"
      variants={containerV}
      initial={reduced ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {hasMessage && (
        <motion.p
          className="inv-quickinfo-message"
          data-testid="inv-quickinfo-message"
          variants={upV}
        >
          {data.message}
        </motion.p>
      )}

      {(dateLabel || hasVenue) && (
        <motion.div className="inv-quickinfo-grid" variants={upV}>
          {dateLabel && (
            <div className="inv-quickinfo-block" data-testid="inv-quickinfo-date">
              <span className="inv-quickinfo-label">Fecha</span>
              <p className="inv-quickinfo-value">{dateLabel}</p>
            </div>
          )}
          {hasVenue && (
            <div className="inv-quickinfo-block" data-testid="inv-quickinfo-venue">
              <span className="inv-quickinfo-label">Lugar</span>
              {data.venue && <p className="inv-quickinfo-value">{data.venue}</p>}
              {data.address && <p className="inv-quickinfo-sub">{data.address}</p>}
            </div>
          )}
        </motion.div>
      )}

      {showPunctual && (
        <motion.p className="inv-quickinfo-punctual" variants={upV}>
          {punctualNote}
        </motion.p>
      )}

      {hasDressCode && (
        <motion.div className="inv-quickinfo-tagwrap" variants={upV}>
          <span className="inv-quickinfo-tag" data-testid="inv-quickinfo-dresscode">
            {data.dress_code}
          </span>
        </motion.div>
      )}

      <motion.div className="inv-quickinfo-cta" variants={upV}>
        <a href={rsvpHref} className="inv-quickinfo-btn" data-testid="inv-quickinfo-rsvp-btn">
          {confirmLabel}
        </a>
      </motion.div>
    </motion.div>
  );
};

export default InvitationQuickInfoElegant;
