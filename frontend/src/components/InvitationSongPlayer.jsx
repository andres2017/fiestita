import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * InvitationSongPlayer — "Nuestra canción" card with a fully custom player.
 *
 * Plays the actual track via YouTube's IFrame Player API or Spotify's
 * iFrame API (both official, documented APIs meant exactly for building a
 * custom UI around their playback), but the platform's own iframe is kept
 * off-screen and only our own play/pause button + equalizer bars are ever
 * shown — no YouTube/Spotify chrome, thumbnail or branding is visible.
 *
 * `url` arrives already validated server-side against these exact shapes:
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

function parseSongUrl(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    return { kind: "youtube", id: u.pathname.split("/")[1] };
  }
  if (host === "youtube.com") {
    const id = u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
    return { kind: "youtube", id };
  }
  const [, type, id] = u.pathname.split("/");
  return { kind: "spotify", uri: `spotify:${type}:${id}` };
}

// --- Lazy, shared SDK loaders (safe to call from multiple mounts) ---

let ytApiPromise = null;
function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve(window.YT);
    };
    if (!document.querySelector('script[data-fiestita-yt-api]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.setAttribute("data-fiestita-yt-api", "1");
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

let spotifyApiPromise = null;
function loadSpotifyApi() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.__fiestitaSpotifyIFrameAPI) return Promise.resolve(window.__fiestitaSpotifyIFrameAPI);
  if (spotifyApiPromise) return spotifyApiPromise;
  spotifyApiPromise = new Promise((resolve) => {
    const prev = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      window.__fiestitaSpotifyIFrameAPI = IFrameAPI;
      if (typeof prev === "function") prev(IFrameAPI);
      resolve(IFrameAPI);
    };
    if (!document.querySelector('script[data-fiestita-sp-api]')) {
      const tag = document.createElement("script");
      tag.src = "https://open.spotify.com/embed/iframe-api/v1";
      tag.async = true;
      tag.setAttribute("data-fiestita-sp-api", "1");
      document.head.appendChild(tag);
    }
  });
  return spotifyApiPromise;
}

export const InvitationSongPlayer = ({ url }) => {
  const reduced = useReducedMotion();
  const info = useMemo(() => parseSongUrl(url), [url]);
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    setIsPlaying(false);

    if (info.kind === "youtube") {
      loadYouTubeApi().then((YT) => {
        if (cancelled || !YT || !mountRef.current) return;
        playerRef.current = new YT.Player(mountRef.current, {
          videoId: info.id,
          width: "1",
          height: "1",
          playerVars: {
            controls: 0, disablekb: 1, fs: 0, modestbranding: 1,
            rel: 0, iv_load_policy: 3, playsinline: 1,
          },
          events: {
            onReady: () => !cancelled && setIsReady(true),
            onStateChange: (e) => {
              if (cancelled) return;
              setIsPlaying(e.data === YT.PlayerState.PLAYING);
            },
          },
        });
      });
    } else {
      loadSpotifyApi().then((IFrameAPI) => {
        if (cancelled || !IFrameAPI || !mountRef.current) return;
        IFrameAPI.createController(mountRef.current, { uri: info.uri, width: "1", height: "1" }, (controller) => {
          if (cancelled) return;
          playerRef.current = controller;
          setIsReady(true);
          controller.addListener("playback_update", (e) => {
            if (!cancelled) setIsPlaying(!e.data.isPaused);
          });
        });
      });
    }

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* already gone */ }
      }
      playerRef.current = null;
    };
  }, [info]);

  const toggle = () => {
    if (!isReady || !playerRef.current) return;
    if (info.kind === "youtube") {
      if (isPlaying) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
    } else {
      playerRef.current.togglePlay();
    }
  };

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

      <button
        type="button"
        className={`inv-song-playbtn ${isPlaying ? "is-playing" : ""}`}
        onClick={toggle}
        disabled={!isReady}
        aria-label={isPlaying ? "Pausar canción" : "Reproducir canción"}
        data-testid="inv-song-toggle"
      >
        <span className="inv-song-playbtn-icon" aria-hidden="true">
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="22" height="22"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          )}
        </span>
      </button>

      <div className={`inv-song-bars ${isPlaying ? "is-playing" : ""}`} aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      <p className="inv-song-hint" data-testid="inv-song-hint">
        {!isReady ? "Cargando…" : isPlaying ? "Reproduciendo" : "Toca para reproducir"}
      </p>

      <div ref={mountRef} className="inv-song-hidden-mount" aria-hidden="true" />
    </motion.section>
  );
};
