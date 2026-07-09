import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, THEME_LIST, THEMES } from "../themes";
import { InvitationRevealElegant } from "../components/InvitationRevealElegant";
import axios from "axios";

// Demo content for the hero's mini preview card. Same couple/theme as the public demo
// invitation (see DEMO_INVITATION_ID below), so the two stay consistent — but this is a
// small, purpose-built minimal card, NOT a live render of the full InvitationHeroElegant
// (that component is sized for a whole invitation page; stuffed into a hero-image-sized
// slot it was either clipped mid-content or forced the frame to grow full-height —
// tried both, neither read as "minimalista").
const HERO_DEMO_THEME = THEMES.boda;
// Real, live invitation (same couple/theme as the preview card) — created via the admin
// endpoint, paid:true so it's publicly viewable — linked right under the mini card, so
// visitors can see the actual full invitation, not just this small taste of it.
const DEMO_INVITATION_ID = "e08ce410-20df-4d8a-b9a1-26a63c299f1b";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CONTACT_WHATSAPP = "573108175926";
const contactWaUrl = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(
  "¡Hola! Vi Invitaciones Digitales Fiestita y quiero que me ayuden a crear una invitación 🎉"
)}`;
const NEW_THEME_IDS = ["cumbre", "cielito", "llama_viva", "tardeo", "gloria", "aguinaldos"];

// Brand palette for the landing page's own envelope-break intro — not tied to any
// specific invitation theme, since this is the marketing teaser shown before the
// visitor has picked one. Warm coral + gold, matching the app's own brand color
// (index.html's theme-color meta is the same #FF6B6B).
const BRAND_STYLE_VARS = {
  "--inv-bg": "#1A0F0A",
  "--inv-surface": "#2A1810",
  "--inv-primary": "#FF6B6B",
  "--inv-text": "#FFF5E8",
  "--inv-accent": "#FFD166",
  "--inv-soft": "#FFE3C2",
  // Fredoka (the rest of the landing page's font) reads as a cartoon bubble letter
  // when it's the lone engraved monogram inside the wax seal — Cinzel Decorative
  // has that carved-into-stone/metal look real seal dies use.
  "--inv-font": "'Cinzel Decorative', serif",
  "--inv-scale": 1,
};

export default function Landing() {
  const navigate = useNavigate();
  const [priceCop, setPriceCop] = useState(null);
  const [activeCategory, setActiveCategory] = useState("todas");
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    axios.get(`${API}/pricing`).then((r) => setPriceCop(r.data.price_cop)).catch(() => {});
  }, []);

  const filteredThemes = activeCategory === "todas" ? THEME_LIST : THEME_LIST.filter((t) => t.category === activeCategory);

  if (!opened) {
    return (
      <div style={BRAND_STYLE_VARS}>
        <InvitationRevealElegant
          emoji="🎉"
          themeName="INVITACIONES DIGITALES"
          guestLabel="Fiestita"
          dark
          onOpen={() => setOpened(true)}
        />
      </div>
    );
  }

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">🎈 Invitaciones Digitales Fiestita</span>
        <div className="landing-nav-links">
          <a href="#tematicas">Temáticas</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#contacto">Contacto</a>
        </div>
        <Link to="/crear" className="btn-primary-sm" data-testid="nav-create-btn">Crear invitación</Link>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-tag animate-fade-up delay-1">🔥 Nuevo: Tarjeta de regalo, Baby Shower y Grado</span>
          <h1 className="animate-fade-up delay-2">Invitaciones digitales <span className="hl">para cada celebración</span></h1>
          <p className="animate-fade-up delay-3">
            Cumpleaños, bodas, el partido, conferencias, bautizos, baby showers, grados o la novena
            de aguinaldos: elige una temática, cuéntanos los datos y arma una invitación con efectos
            espectaculares — pon la canción que quieras que suene, agrega fotos y video, y comparte
            un link único con cuenta regresiva, mapa y confirmación de asistencia por WhatsApp. 🎉
          </p>
          <div className="landing-features animate-fade-up delay-3" data-testid="landing-features">
            <span className="landing-feature-chip liquid-glass">🎵 Tu canción favorita</span>
            <span className="landing-feature-chip liquid-glass">✨ Efectos espectaculares</span>
            <span className="landing-feature-chip liquid-glass">📸 Fotos y video</span>
            <span className="landing-feature-chip liquid-glass">💌 100% personalizada</span>
          </div>
          <div className="landing-cta animate-fade-up delay-4">
            <Link to="/crear" className="btn-primary" data-testid="hero-create-btn">🎉 Crear mi invitación</Link>
            {priceCop && <span className="landing-price">💳 Solo ${priceCop.toLocaleString("es-CO")} COP</span>}
          </div>
        </div>
        <div className="landing-hero-img animate-fade-up delay-5">
          <div
            className="landing-hero-mini"
            data-testid="landing-hero-mini"
            style={{
              background: `radial-gradient(ellipse 120% 90% at 30% 0%, color-mix(in srgb, ${HERO_DEMO_THEME.colors.primary} 45%, transparent), transparent 65%), color-mix(in srgb, ${HERO_DEMO_THEME.colors.primary} 16%, #0a0709 84%)`,
              borderColor: `color-mix(in srgb, ${HERO_DEMO_THEME.colors.accent} 45%, #1F2937)`,
            }}
          >
            <span className="landing-hero-mini-badge">DEMO</span>
            <span className="landing-hero-mini-ring" aria-hidden="true">{HERO_DEMO_THEME.emoji}</span>
            <p className="landing-hero-mini-name">Isabella y Mateo</p>
            <p className="landing-hero-mini-date">12 DIC · 2026</p>
            <div className="landing-nowplaying liquid-glass" data-testid="landing-nowplaying">
              <span className="landing-nowplaying-disc" aria-hidden="true" />
              <span className="landing-nowplaying-info">
                <span className="landing-nowplaying-title">Tu canción favorita</span>
                <span className="landing-nowplaying-sub">🎵 sonando en tu invitación</span>
              </span>
            </div>
          </div>
          <a
            href={`/i/${DEMO_INVITATION_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-hero-demo-link"
            data-testid="landing-demo-link"
          >
            👉 Ver esta invitación real
          </a>
        </div>
      </header>

      <section className="landing-themes" id="tematicas">
        <h2>Elige tu temática favorita</h2>
        <p className="landing-themes-sub">{THEME_LIST.length} temáticas para cumpleaños, bodas, partidos y más</p>

        <div className="category-picker" data-testid="landing-category-picker">
          <button
            className={`category-chip ${activeCategory === "todas" ? "active" : ""}`}
            onClick={() => setActiveCategory("todas")}
            data-testid="landing-category-todas"
          >
            ✨ Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`category-chip ${activeCategory === c.id ? "active" : ""}`}
              onClick={() => setActiveCategory(c.id)}
              data-testid={`landing-category-${c.id}`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        <div className="theme-grid">
          {filteredThemes.map((t) => (
            <button key={t.id} className="theme-card" onClick={() => navigate(`/crear?tema=${t.id}`)} data-testid={`theme-card-${t.id}`}>
              <div className="theme-card-img">
                <img src={t.image} alt={t.name} loading="lazy" />
                {NEW_THEME_IDS.includes(t.id) && <span className="theme-card-badge">🔥 Nuevo</span>}
              </div>
              <div className="theme-card-body">
                <span className="theme-card-emoji">{t.emoji}</span>
                <span className="theme-card-name">{t.name}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-steps" id="como-funciona">
        <h2>¿Cómo funciona?</h2>
        <div className="steps-grid">
          <div className="step-card"><span className="step-num">1</span><h3>🎨 Elige y personaliza</h3><p>Escoge el tipo de evento y la temática, y llena los datos: nombre, fecha, lugar y mensaje.</p></div>
          <div className="step-card"><span className="step-num">2</span><h3>💳 Paga seguro</h3><p>Pagas una sola vez con Wompi (tarjeta, Nequi, PSE o Bancolombia) y listo.</p></div>
          <div className="step-card"><span className="step-num">3</span><h3>🔗 Comparte el link</h3><p>Obtienes un link único para enviar por WhatsApp a todos los invitados.</p></div>
          <div className="step-card"><span className="step-num">4</span><h3>✅ Recibe confirmaciones</h3><p>Los invitados confirman en la misma invitación y las ves al instante en tu panel.</p></div>
        </div>
      </section>

      <section className="landing-help" id="contacto">
        <div className="landing-help-card">
          <h2>¿Prefieres que te la hagamos nosotros? 💛</h2>
          <p>Escríbenos por WhatsApp y te ayudamos a crear tu invitación paso a paso, sin importar la ocasión.</p>
          <a href={contactWaUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" data-testid="contact-whatsapp-btn">
            💬 Escríbenos al WhatsApp
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Hecho con 💛 para celebraciones inolvidables · Invitaciones Digitales Fiestita 🎈</p>
        <Link to="/admin/ventas" className="landing-admin-link" data-testid="admin-link">Panel de administrador</Link>
      </footer>

      <a
        href={contactWaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        data-testid="whatsapp-fab"
        aria-label="Escríbenos por WhatsApp"
      >
        💬
      </a>
    </div>
  );
}
