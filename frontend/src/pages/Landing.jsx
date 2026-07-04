import { Link, useNavigate } from "react-router-dom";
import { THEME_LIST } from "../themes";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">🎈 Fiestita</span>
        <Link to="/crear" className="btn-primary-sm" data-testid="nav-create-btn">Crear invitación</Link>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-tag">✨ Gratis y sin registro</span>
          <h1>Invitaciones de cumpleaños <span className="hl">mágicas</span> para tus peques</h1>
          <p>
            Elige una temática, escribe los datos de la fiesta y comparte un link único con
            cuenta regresiva, mapa, confirmación de asistencia y botón de WhatsApp. 🎂
          </p>
          <div className="landing-cta">
            <Link to="/crear" className="btn-primary" data-testid="hero-create-btn">🎉 Crear mi invitación</Link>
          </div>
        </div>
        <div className="landing-hero-img">
          <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="Fiesta infantil con confeti" />
        </div>
      </header>

      <section className="landing-themes">
        <h2>Elige tu temática favorita</h2>
        <p className="landing-themes-sub">6 mundos distintos, cada uno con sus colores, letras y sorpresas</p>
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
          <div className="step-card"><span className="step-num">2</span><h3>🔗 Comparte el link</h3><p>Obtienes un link único para enviar por WhatsApp a todos los invitados.</p></div>
          <div className="step-card"><span className="step-num">3</span><h3>✅ Recibe confirmaciones</h3><p>Los invitados confirman en la misma invitación y llegan a tu Google Sheets.</p></div>
        </div>
      </section>

      <footer className="landing-footer">Hecho con 💛 para fiestas inolvidables · Fiestita 🎈</footer>
    </div>
  );
}
