import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationSongPlayer — "Nuestra canción" card with an embedded player.
 *
 * An elegant, understated card wrapping a YouTube (responsive 16:9) or
 * Spotify (compact, 152px) embed. `url` arrives already validated
 * server-side against these exact shapes, so parsing is direct:
 *   YouTube : youtu.be/ID · youtube.com/watch?v=ID · youtube.com/shorts/ID
 *   Spotify : open.spotify.com/{track|album|playlist}/ID
 *
 * Props:
 *   url  string  YouTube or Spotify link (pre-validated)
 *
 * Must render inside an element that defines the --inv-* CSS variables
 * (same styleVars wrapper used by InvitationView).
 */

const EASE = [0.22, 1, 0.36, 1];

function toEmbed(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    return { kind: "youtube", src: `https://www.youtube.com/embed/${u.pathname.split("/")[1]}` };
  }
  if (host === "youtube.com") {
    const id = u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
    return { kind: "youtube", src: `https://www.youtube.com/embed/${id}` };
  }
  // open.spotify.com/{track|album|playlist}/ID → insert /embed after the domain, drop query params
  const [, type, id] = u.pathname.split("/");
  return { kind: "spotify", src: `https://open.spotify.com/embed/${type}/${id}` };
}

export const InvitationSongPlayer = ({ url }) => {
  const reduced = useReducedMotion();
  const embed = useMemo(() => toEmbed(url), [url]);

  return (
    <motion.section
      className="inv-card inv-card-elegant inv-song-card"
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: EASE }}
      data-testid="inv-song-player"
    >
      <h2 className="inv-section-title">🎵 Nuestra canción</h2>
      <div className="inv-elegant-divider" aria-hidden="true"><span>✦</span></div>
      <p className="inv-song-hint">Toca play para escucharla</p>
      <div className={`inv-song-embed ${embed.kind === "youtube" ? "inv-song-embed-yt" : "inv-song-embed-sp"}`}>
        {embed.kind === "youtube" ? (
          <iframe
            src={embed.src}
            title="Nuestra canción (YouTube)"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            data-testid="inv-song-iframe"
          />
        ) : (
          <iframe
            src={embed.src}
            title="Nuestra canción (Spotify)"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            data-testid="inv-song-iframe"
          />
        )}
      </div>
    </motion.section>
  );
};
