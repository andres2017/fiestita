import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationPhotoGallery — framed photos with a gallery-print feel.
 *
 * Each photo sits on a thin surface-colored mat with a hairline border and
 * a soft diffuse shadow (a clean nod to the "framed print / polaroid" look,
 * no literal ribbons). Layout adapts to the count:
 *   1 photo  → centered portrait hero
 *   2 photos → side-by-side pair with a gentle offset and counter-tilt
 *   3 photos → wide hero on top + tilted portrait pair below
 *
 * Props:
 *   photos  string[]  1 to 3 fully-qualified image URLs, ready for src.
 *
 * Must render inside an element that defines the --inv-* CSS variables
 * (same styleVars wrapper used by InvitationView).
 */

const EASE = [0.22, 1, 0.36, 1];

export const InvitationPhotoGallery = ({ photos }) => {
  const reduced = useReducedMotion();
  const shown = photos.slice(0, 3);

  return (
    <motion.section
      className="inv-card inv-card-elegant inv-gallery-card"
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: EASE }}
      data-testid="inv-photo-gallery"
    >
      <h2 className="inv-section-title">📸 Nuestros momentos</h2>
      <div className="inv-elegant-divider" aria-hidden="true"><span>✦</span></div>
      <div className={`inv-gallery inv-gallery-${shown.length}`}>
        {shown.map((src, i) => (
          <motion.div
            className="inv-gallery-item"
            key={`${src}-${i}`}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
          >
            <figure className="inv-gallery-frame">
              <img src={src} alt={`Fotografía ${i + 1} del evento`} loading="lazy" data-testid="inv-gallery-photo" />
            </figure>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
