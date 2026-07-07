import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { THEME_LIST } from "../themes";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CONTACT_WHATSAPP = "573108175926";
const contactWaUrl = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(
  "¡Hola! Vi Fiestita y quiero que me ayuden a crear una invitación 🎉"
)}`;

export default function Landing() {
  const navigate = useNavigate();
  const [priceCop, setPriceCop] = useState(null);

  useEffect(() => {
    axios.get(`${API}/pricing`).then((r) => setPriceCop(r.data.price_cop)).catch(() => {});
  }, []);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">🎈 Fiestita</span>
        <Link to="/crear" className="btn-primary-sm" data-testid="nav-create-btn">Crear invitación</Link>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-tag">✨ Sin registro, lista en minutos</span>
          <h1>Invitaciones de cumpleaños <span className="hl">mágicas</span> para tus peques</h1>
          <p>
            Elige una temática, escribe los datos de la fiesta y comparte un link único con
            cuenta regresiva, mapa, confirmación de asistencia y botón de WhatsApp. 🎂
          </p>
          <div className="landing-cta">
            <Link to="/crear" className="btn-primary" data-testid="hero-create-btn">🎉 Crear mi invitación</Link>
            {priceCop && <span className="landing-price">💳 Solo ${priceCop.toLocaleString("es-CO")} COP</span>}
          </div>
        </div>
        <div className="landing-hero-img">
          <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="Fiesta infantil con confeti" />
        </div>
      </header>

      <section className="landing-themes">
        <h2>Elige tu temática favorita</h2>
        <p className="landing-themes-sub">{THEME_LIST.length} mundos distintos, cada uno con sus colores, letras y sorpresas</p>
        <div className="theme-grid">
          {THEME_LIST.map((t) => (
            <button key={t.id} className="theme-card" onClick={() => navigate(`/crear?tema=${t.id}`)} data-testid={`theme-card-${t.id}`}>
              <div className="theme-card-img"><img src={t.image} alt={t.name} loading="lazy" /></div>
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
          <div className="step-card"><span className="step-num">1</span><h3>🎨 Elige y personaliza</h3><p>Escoge la temática y llena los datos: nombre, edad, fecha, lugar y mensaje.</p></div>
          <div className="step-card"><span className="step-num">2</span><h3>💳 Paga seguro</h3><p>Pagas una sola vez con Wompi (tarjeta, Nequi, PSE o Bancolombia) y listo.</p></div>
          <div className="step-card"><span className="step-num">3</span><h3>🔗 Comparte el link</h3><p>Obtienes un link único para enviar por WhatsApp a todos los invitados.</p></div>
          <div className="step-card"><span className="step-num">4</span><h3>✅ Recibe confirmaciones</h3><p>Los invitados confirman en la misma invitación y llegan a tu Google Sheets.</p></div>
        </div>
      </section>

      <section className="landing-help">
        <div className="landing-help-card">
          <h2>¿Prefieres que te la hagamos nosotros? 💛</h2>
          <p>Escríbenos por WhatsApp y te ayudamos a crear tu invitación paso a paso.</p>
          <a href={contactWaUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" data-testid="contact-whatsapp-btn">
            💬 Escríbenos al WhatsApp
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Hecho con 💛 para fiestas inolvidables · Fiestita 🎈</p>
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
