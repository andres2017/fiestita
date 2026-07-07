import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORIES, THEME_LIST } from "../themes";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CONTACT_WHATSAPP = "573108175926";
const contactWaUrl = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(
  "¡Hola! Vi Invitaciones Digitales Fiestita y quiero que me ayuden a crear una invitación 🎉"
)}`;
const NEW_THEME_IDS = ["cumbre", "cielito", "llama_viva", "tardeo", "gloria", "aguinaldos"];

export default function Landing() {
  const navigate = useNavigate();
  const [priceCop, setPriceCop] = useState(null);
  const [activeCategory, setActiveCategory] = useState("todas");

  useEffect(() => {
    axios.get(`${API}/pricing`).then((r) => setPriceCop(r.data.price_cop)).catch(() => {});
  }, []);

  const filteredThemes = activeCategory === "todas" ? THEME_LIST : THEME_LIST.filter((t) => t.category === activeCategory);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">🎈 Invitaciones Digitales Fiestita</span>
        <Link to="/crear" className="btn-primary-sm" data-testid="nav-create-btn">Crear invitación</Link>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-tag">🔥 Nuevo: 6 categorías más</span>
          <h1>Invitaciones digitales <span className="hl">para cada celebración</span></h1>
          <p>
            Cumpleaños, bodas, el partido, conferencias, bautizos, confirmaciones, parches, retos
            deportivos o la novena de aguinaldos: elige una temática, escribe los datos y comparte un
            link único con cuenta regresiva, mapa, confirmación de asistencia y botón de WhatsApp. 🎉
          </p>
          <div className="landing-cta">
            <Link to="/crear" className="btn-primary" data-testid="hero-create-btn">🎉 Crear mi invitación</Link>
            {priceCop && <span className="landing-price">💳 Solo ${priceCop.toLocaleString("es-CO")} COP</span>}
          </div>
        </div>
        <div className="landing-hero-img">
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
