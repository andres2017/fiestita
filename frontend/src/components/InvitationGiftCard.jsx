import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationGiftCard — "Mesa de regalos" card.
 *
 * A quiet, stationery-style card: a centered note in italics and/or a
 * restrained outline button to an external gift registry. Renders whichever
 * combination of props is present (note-only, link-only, or both) — the
 * integrator only mounts it when at least one is set.
 *
 * Props:
 *   note         string  free text (may be ""); line breaks are preserved
 *   registryUrl  string  optional external registry/wishlist URL (may be "")
 *
 * Must render inside an element that defines the --inv-* CSS variables
 * (same styleVars wrapper used by InvitationView).
 */

const EASE = [0.22, 1, 0.36, 1];

export const InvitationGiftCard = ({ note, registryUrl }) => {
  const reduced = useReducedMotion();

  return (
    <motion.section
      className="inv-card inv-card-elegant inv-gift-card"
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: EASE }}
      data-testid="inv-gift-card"
    >
      <h2 className="inv-section-title">🎁 Mesa de regalos</h2>
      <div className="inv-elegant-divider" aria-hidden="true"><span>✦</span></div>
      {note ? (
        <p className="inv-elegant-note" data-testid="inv-gift-note">{note}</p>
      ) : null}
      {registryUrl ? (
        <div className="inv-gift-actions">
          <a
            href={registryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inv-btn-elegant"
            data-testid="inv-gift-registry-btn"
          >
            Ver mesa de regalos
          </a>
        </div>
      ) : null}
    </motion.section>
  );
};
