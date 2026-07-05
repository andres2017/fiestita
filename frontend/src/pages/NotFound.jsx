import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="builder-error" data-testid="not-found-page">
      <h2>🎈 Página no encontrada</h2>
      <p>El link que seguiste no existe o cambió de dirección.</p>
      <Link to="/" className="btn-primary">Ir al inicio</Link>
    </div>
  );
}
