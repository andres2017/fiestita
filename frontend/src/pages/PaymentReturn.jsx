import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const POLL_MS = 3000;
const MAX_ATTEMPTS = 20; // ~1 minuto

export default function PaymentReturn() {
  const { id, token } = useParams();
  const [status, setStatus] = useState("checking"); // checking | paid | pending | error

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      try {
        const r = await axios.get(`${API}/invitations/${id}/edit`, { params: { token } });
        if (cancelled) return;
        if (r.data.paid) {
          setStatus("paid");
          return;
        }
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) {
          setStatus("pending");
          return;
        }
        setTimeout(check, POLL_MS);
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    check();
    return () => { cancelled = true; };
  }, [id, token]);

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado 📋`);
    } catch {
      toast.error(`No se pudo copiar ${label.toLowerCase()}. Selecciónalo y cópialo manualmente.`);
    }
  };

  if (status === "checking") {
    return <div className="inv-loading" data-testid="payment-checking">💳 Confirmando tu pago con Wompi...</div>;
  }

  if (status === "error") {
    return (
      <div className="builder-error" data-testid="payment-error">
        <h2>😢 Link inválido</h2>
        <p>No pudimos verificar este pago. Revisa que el link esté completo.</p>
        <Link to="/crear" className="btn-primary">Crear nueva invitación</Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="builder-error" data-testid="payment-pending">
        <h2>⏳ Todavía estamos confirmando tu pago</h2>
        <p>
          A veces Wompi tarda unos minutos en avisarnos. Guarda este link y vuelve a intentarlo
          en un momento; si ya pagaste, se activará automáticamente.
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()} data-testid="retry-check-btn">
          🔄 Revisar de nuevo
        </button>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/i/${id}`;
  const editUrl = `${window.location.origin}/editar/${id}/${token}`;

  return (
    <div className="success-screen" data-testid="success-screen">
      <div className="success-card">
        <div className="success-confetti">🎉🎂🎈✨🎁</div>
        <h1>¡Pago confirmado! Tu invitación está lista</h1>
        <p>Comparte el link con tus invitados y guarda el link secreto para editarla cuando quieras.</p>

        <div className="link-box">
          <label>🔗 Link para invitados (compártelo)</label>
          <div className="link-row">
            <input readOnly value={publicUrl} data-testid="public-link-input" />
            <button onClick={() => copyText(publicUrl, "Link público")} data-testid="copy-public-link-btn">Copiar</button>
          </div>
        </div>

        <div className="link-box link-box-secret">
          <label>🔒 Link secreto de edición (¡no lo compartas!)</label>
          <div className="link-row">
            <input readOnly value={editUrl} data-testid="edit-link-input" />
            <button onClick={() => copyText(editUrl, "Link de edición")} data-testid="copy-edit-link-btn">Copiar</button>
          </div>
        </div>

        <div className="success-actions">
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" data-testid="view-invitation-btn">👀 Ver invitación</a>
          <Link to={`/editar/${id}/${token}`} className="btn-outline" data-testid="go-edit-btn">✏️ Seguir editando</Link>
        </div>
      </div>
    </div>
  );
}
