import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, THEME_LIST } from "../themes";
import { InvitationRevealElegant } from "../components/InvitationRevealElegant";
import axios from "axios";

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
  "--inv-font": "'Fredoka', sans-serif",
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
          <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="Celebración con confeti" />
        </div>
      </header>

      <section className="landing-themes">
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

      <section className="landing-steps">
        <h2>¿Cómo funciona?</h2>
        <div className="steps-grid">
          <div className="step-card"><span className="step-num">1</span><h3>🎨 Elige y personaliza</h3><p>Escoge el tipo de evento y la temática, y llena los datos: nombre, fecha, lugar y mensaje.</p></div>
          <div className="step-card"><span className="step-num">2</span><h3>💳 Paga seguro</h3><p>Pagas una sola vez con Wompi (tarjeta, Nequi, PSE o Bancolombia) y listo.</p></div>
          <div className="step-card"><span className="step-num">3</span><h3>🔗 Comparte el link</h3><p>Obtienes un link único para enviar por WhatsApp a todos los invitados.</p></div>
          <div className="step-card"><span className="step-num">4</span><h3>✅ Recibe confirmaciones</h3><p>Los invitados confirman en la misma invitación y las ves al instante en tu panel.</p></div>
        </div>
      </section>

      <section className="landing-help">
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
