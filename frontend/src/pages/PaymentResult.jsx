import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentResult() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const txId = searchParams.get("id");
  const token = searchParams.get("token");
  const [state, setState] = useState("verifying");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!txId) {
      setState("missing");
      return;
    }
    axios.get(`${API}/invitations/${id}/verify-payment`, { params: { transaction_id: txId } })
      .then((r) => {
        setStatus(r.data.status);
        setState(r.data.paid ? "approved" : r.data.status === "PENDING" ? "pending" : "declined");
      })
      .catch(() => setState("error"));
  }, [id, txId]);

  const retryVerify = () => {
    setState("verifying");
    axios.get(`${API}/invitations/${id}/verify-payment`, { params: { transaction_id: txId } })
      .then((r) => {
        setStatus(r.data.status);
        setState(r.data.paid ? "approved" : r.data.status === "PENDING" ? "pending" : "declined");
      })
      .catch(() => setState("error"));
  };

  const publicUrl = `${window.location.origin}/i/${id}`;
  const editUrl = token ? `/editar/${id}/${token}` : null;

  return (
    <div className="success-screen">
      <div className="success-card" data-testid="payment-result">
        {state === "verifying" && (
          <>
            <div className="success-confetti">⏳</div>
            <h1>Verificando tu pago...</h1>
            <p>Un momento, estamos confirmando con Wompi.</p>
          </>
        )}

        {state === "approved" && (
          <>
            <div className="success-confetti">🎉💳✅🎈✨</div>
            <h1>¡Pago aprobado, invitación publicada!</h1>
            <p>Ya puedes compartir el link con todos los invitados.</p>
            <div className="link-box">
              <label>🔗 Link para invitados</label>
              <div className="link-row">
                <input readOnly value={publicUrl} data-testid="paid-public-link-input" />
                <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Link copiado 📋"); }} data-testid="paid-copy-link-btn">Copiar</button>
              </div>
            </div>
            <div className="success-actions">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" data-testid="paid-view-btn">👀 Ver invitación</a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`¡Estás invitado! 🎂 Mira la invitación aquí: ${publicUrl}`)}`}
                target="_blank" rel="noopener noreferrer" className="btn-outline" data-testid="paid-share-whatsapp-btn">
                💬 Compartir por WhatsApp
              </a>
            </div>
          </>
        )}

        {state === "pending" && (
          <>
            <div className="success-confetti">🕐</div>
            <h1>Pago en proceso</h1>
            <p>Tu pago está pendiente de confirmación ({status}). Puedes verificar de nuevo en unos segundos.</p>
            <button className="btn-primary" onClick={retryVerify} data-testid="retry-verify-btn">🔄 Verificar de nuevo</button>
          </>
        )}

        {(state === "declined" || state === "error" || state === "missing") && (
          <>
            <div className="success-confetti">😢</div>
            <h1>{state === "missing" ? "Falta información del pago" : "El pago no fue aprobado"}</h1>
            <p>
              {state === "missing"
                ? "No recibimos el número de transacción de Wompi."
                : `Estado: ${status || "desconocido"}. Puedes intentarlo de nuevo desde tu link de edición.`}
            </p>
            <div className="success-actions">
              {editUrl && <Link to={editUrl} className="btn-primary" data-testid="back-to-edit-btn">✏️ Volver a mi invitación</Link>}
              <Link to="/" className="btn-outline">Inicio</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
