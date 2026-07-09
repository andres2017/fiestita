import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { THEMES, CATEGORY_FIELDS, PALETTE_MAP, formatDateEs, formatTimeEs, calendarUrl, whatsappUrl } from "../themes";
import { InvitationReveal } from "./InvitationReveal";
import { InvitationRevealElegant } from "./InvitationRevealElegant";
import { InvitationHeroElegant } from "./InvitationHeroElegant";
import { InvitationSongPlayer } from "./InvitationSongPlayer";
import { InvitationGiftCard } from "./InvitationGiftCard";
import { InvitationItinerary } from "./InvitationItinerary";
import { InvitationPhotoGallery } from "./InvitationPhotoGallery";

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_BASE}/api`;
const ELEGANT_REVEAL_CATEGORIES = new Set(["boda", "cumple_adulto"]);
const ELEGANT_HERO_CATEGORIES = new Set([
  "boda", "cumple_adulto", "conferencia", "bautizo", "confirmacion", "novena",
  "partido", "parche", "reto_deportivo",
]);

// Uploaded media may be a full URL (Cloudflare R2) or a legacy local backend path.
const mediaUrl = (u) => (!u ? u : u.startsWith("http") ? u : `${BACKEND_BASE}${u}`);

function useCountdown(dateStr, timeStr) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!dateStr) return;
    const target = new Date(`${dateStr}T${timeStr || "00:00"}:00`).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return setLeft({ d: 0, h: 0, m: 0, s: 0, done: true });
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
        done: false,
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [dateStr, timeStr]);
  return left;
}

export const InvitationView = ({ inv, preview = false }) => {
  const theme = THEMES[inv.theme] || THEMES.videojuegos;
  const palette = PALETTE_MAP[inv.color_palette];
  const c = { ...theme.colors, ...(palette ? { primary: palette.primary, accent: palette.accent, soft: palette.soft } : null) };
  const copy = theme.copy;
  const left = useCountdown(inv.event_date, inv.event_time);
  const [form, setForm] = useState({ nombre: "", telefono: "", asiste: "✅ ¡Sí, voy!", adultos: 1, ninos: 0, mensaje: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [opened, setOpened] = useState(!inv.reveal_effect);
  useEffect(() => { setOpened(!inv.reveal_effect); }, [inv.reveal_effect]);

  const styleVars = {
    "--inv-bg": c.bg,
    "--inv-surface": c.surface,
    "--inv-primary": c.primary,
    "--inv-text": c.text,
    "--inv-accent": c.accent,
    "--inv-soft": c.soft,
    "--inv-font": theme.font,
    "--inv-scale": theme.fontScale,
  };

  const submitRsvp = async (e) => {
    e.preventDefault();
    if (preview) return;
    setSending(true);
    setError(false);
    try {
      await axios.post(`${API}/invitations/${inv.id}/rsvp`, {
        ...form,
        adultos: Number(form.adultos) || 0,
        ninos: Number(form.ninos) || 0,
      });
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const waUrl = whatsappUrl(inv);
  const name = inv.child_name || CATEGORY_FIELDS[theme.category]?.fallbackName || "Tu invitado";
  const age = inv.age || "?";
  const dispInv = { ...inv, child_name: name, age };
  const showKidsCount = inv.audience !== "adultos";
  const showAdultsCount = inv.audience !== "ninos";
  const showPhoneField = inv.ask_phone !== false;

  if (!opened) {
    const RevealComponent = ELEGANT_REVEAL_CATEGORIES.has(theme.category) ? InvitationRevealElegant : InvitationReveal;
    return (
      <div className={`inv-root ${theme.dark ? "inv-dark" : "inv-light"}`} style={styleVars}>
        <RevealComponent
          emoji={theme.emoji}
          themeName={theme.name}
          guestLabel={name}
          decorations={theme.decorations}
          dark={theme.dark}
          onOpen={() => setOpened(true)}
        />
      </div>
    );
  }

  return (
    <div className={`inv-root ${theme.dark ? "inv-dark" : "inv-light"}`} style={styleVars} data-testid="invitation-view">
      <div className="inv-decorations" aria-hidden="true">
        {theme.decorations.map((d, i) => (
          <span key={i} className={`inv-deco inv-deco-${i}`}>{d}</span>
        ))}
      </div>

      <div className="inv-content">
        {/* HERO */}
        {ELEGANT_HERO_CATEGORIES.has(theme.category) ? (
          <InvitationHeroElegant
            copy={copy}
            dispInv={dispInv}
            eventDate={inv.event_date}
            emoji={theme.emoji}
            category={theme.category}
          />
        ) : (
          <header className="inv-hero">
            <div className="inv-badge" data-testid="inv-badge">
              {copy.badge(dispInv)} · {inv.event_date ? inv.event_date.split("-").reverse().join(" · ") : ""}
            </div>
            <h1 className="inv-title" data-testid="inv-title">{copy.title(dispInv)}</h1>
            {inv.child_full_name && <p className="inv-fullname">{inv.child_full_name.toUpperCase()}</p>}
            <p className="inv-subtitle">{copy.subtitle(dispInv)}</p>
            <div className="inv-arrows">▼ ▼ ▼</div>
          </header>
        )}

        {/* VIDEO */}
        {inv.video_url && (
          <section className="inv-card">
            <h2 className="inv-section-title">🎥 Video</h2>
            <video
              src={mediaUrl(inv.video_url)}
              controls
              playsInline
              className="inv-video"
              data-testid="inv-video"
            />
          </section>
        )}

        {/* PHOTO GALLERY */}
        {inv.photo_urls?.length > 0 && (
          <InvitationPhotoGallery photos={inv.photo_urls.map(mediaUrl)} />
        )}

        {/* SONG */}
        {inv.song_url && <InvitationSongPlayer url={inv.song_url} />}

        {/* COUNTDOWN */}
        <section className="inv-card inv-countdown-card">
          <h2 className="inv-section-title">{copy.countdown}</h2>
          <div className="inv-countdown" data-testid="inv-countdown">
            {[["d", "DÍAS"], ["h", "HORAS"], ["m", "MIN"], ["s", "SEG"]].map(([k, label]) => (
              <div className="inv-count-box" key={k}>
                <span className="inv-count-num">{left ? String(left[k]).padStart(2, "0") : "--"}</span>
                <span className="inv-count-label">{label}</span>
              </div>
            ))}
          </div>
          {left?.done && <p className="inv-count-done">🎉 ¡Es hoy, es hoy! 🎉</p>}
        </section>

        {/* DETAILS */}
        <section className="inv-card">
          <h2 className="inv-section-title">{copy.details}</h2>
          <div className="inv-detail" data-testid="inv-date">
            <span className="inv-detail-icon">📅</span>
            <div><strong>FECHA</strong><p>{formatDateEs(inv.event_date) || "Por definir"}</p></div>
          </div>
          <div className="inv-detail" data-testid="inv-time">
            <span className="inv-detail-icon">⏰</span>
            <div><strong>HORA</strong><p>{formatTimeEs(inv.event_time) || "Por definir"}</p><em>{copy.punctual}</em></div>
          </div>
          <div className="inv-detail" data-testid="inv-venue">
            <span className="inv-detail-icon">🗺️</span>
            <div><strong>LUGAR</strong><p>{inv.venue || "Por definir"}</p><p className="inv-address">{inv.address}</p></div>
          </div>
          {inv.message && (
            <div className="inv-detail" data-testid="inv-message">
              <span className="inv-detail-icon">💌</span>
              <div><strong>MENSAJE</strong><p>{inv.message}</p></div>
            </div>
          )}
          <a href={calendarUrl(inv)} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-outline" data-testid="inv-calendar-btn">
            📅 Agendar en mi calendario
          </a>
        </section>

        {/* ITINERARY */}
        {inv.itinerary?.length > 0 && <InvitationItinerary items={inv.itinerary} />}

        {/* HOW TO ARRIVE */}
        {(inv.how_arrive || inv.maps_url || inv.waze_url) && (
          <section className="inv-card">
            <h2 className="inv-section-title">{copy.arrive}</h2>
            {inv.venue && <p className="inv-arrive-venue"><strong>{inv.venue}</strong></p>}
            {inv.how_arrive && <p className="inv-arrive-text">{inv.how_arrive}</p>}
            <div className="inv-map-btns">
              {inv.maps_url && (
                <a href={inv.maps_url} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-primary" data-testid="inv-maps-btn">
                  🗺️ Abrir en Google Maps
                </a>
              )}
              {inv.waze_url && (
                <a href={inv.waze_url} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-outline" data-testid="inv-waze-btn">
                  🚗 Navegar con Waze
                </a>
              )}
            </div>
          </section>
        )}

        {/* RSVP */}
        <section className="inv-card" id="rsvp">
          <h2 className="inv-section-title">{copy.rsvpTitle}</h2>
          <p className="inv-rsvp-subtitle">{copy.rsvpSubtitle}</p>
          {inv.audience !== "todos" && (
            <p className="inv-audience-note" data-testid="inv-audience-note">
              {inv.audience === "adultos" ? "🥂 Este evento es solo para adultos" : "🧒 Este evento es para niños"}
            </p>
          )}

          {sent ? (
            <div className="inv-success" data-testid="rsvp-success">
              <p className="inv-success-title">{copy.successTitle}</p>
              <p className="inv-success-extra">{copy.successExtra}</p>
              <p>
                ¡Gracias por confirmar! {name} y su familia te esperan el {formatDateEs(inv.event_date)} a las {formatTimeEs(inv.event_time)}. 🎉
              </p>
            </div>
          ) : (
            <form onSubmit={submitRsvp} className="inv-form">
              <input required className="inv-input" placeholder="Tu nombre completo" value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} data-testid="rsvp-name-input" />
              {showPhoneField && (
                <input className="inv-input" placeholder="Celular / WhatsApp" value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })} data-testid="rsvp-phone-input" />
              )}
              <label className="inv-label">¿Nos acompañas?</label>
              <div className="inv-attend-btns">
                {["✅ ¡Sí, voy!", "❌ No podré"].map((opt) => (
                  <button type="button" key={opt}
                    className={`inv-attend-btn ${form.asiste === opt ? "active" : ""}`}
                    onClick={() => setForm({ ...form, asiste: opt })}
                    data-testid={opt.includes("Sí") ? "rsvp-yes-btn" : "rsvp-no-btn"}>
                    {opt}
                  </button>
                ))}
              </div>
              <div className={`inv-counts ${showKidsCount && showAdultsCount ? "" : "inv-counts-single"}`}>
                {showAdultsCount && (
                  <div>
                    <label className="inv-label" htmlFor="rsvp-adults-input">Adultos</label>
                    <input id="rsvp-adults-input" type="number" min="0" className="inv-input" value={form.adultos}
                      onChange={(e) => setForm({ ...form, adultos: e.target.value })} data-testid="rsvp-adults-input" />
                  </div>
                )}
                {showKidsCount && (
                  <div>
                    <label className="inv-label" htmlFor="rsvp-kids-input">Niños</label>
                    <input id="rsvp-kids-input" type="number" min="0" className="inv-input" value={form.ninos}
                      onChange={(e) => setForm({ ...form, ninos: e.target.value })} data-testid="rsvp-kids-input" />
                  </div>
                )}
              </div>
              <textarea className="inv-input" rows="3" placeholder={copy.msgLabel(dispInv)} value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })} data-testid="rsvp-message-input" />
              <button type="submit" disabled={sending} className="inv-btn inv-btn-primary inv-btn-submit" data-testid="rsvp-submit-btn">
                {sending ? "Enviando..." : copy.confirm}
              </button>
              {error && (
                <p className="inv-error" data-testid="rsvp-error">
                  No se pudo enviar. Revisa tu conexión e inténtalo de nuevo, o confirma por WhatsApp aquí abajo. 👇
                </p>
              )}
            </form>
          )}

          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inv-btn inv-btn-whatsapp" data-testid="inv-whatsapp-btn">
              💬 Confirmar por WhatsApp
            </a>
          )}
        </section>

        {/* GIFT REGISTRY */}
        {(inv.gift_note || inv.gift_registry_url) && (
          <InvitationGiftCard note={inv.gift_note} registryUrl={inv.gift_registry_url} />
        )}

        {!preview && (
          <section className="inv-card inv-promo" data-testid="inv-promo">
            <p className="inv-promo-title">✨ ¿Te gustó esta invitación?</p>
            <p className="inv-promo-text">Crea la tuya en minutos, para cumpleaños, bodas, el partido o cualquier ocasión.</p>
            <Link to="/crear" className="inv-btn inv-btn-primary" data-testid="inv-promo-btn">
              🎉 Crear mi invitación
            </Link>
          </section>
        )}

        <footer className="inv-footer">
          {inv.host_names ? `Con cariño, ${inv.host_names} 💛` : "Hecho con 💛 para una fiesta inolvidable"}
        </footer>
      </div>
    </div>
  );
};
