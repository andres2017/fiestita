import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { InvitationView } from "../components/InvitationView";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function InvitationPage() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get(`${API}/invitations/${id}`)
      .then((r) => setInv(r.data))
      .catch((err) => setError(err.response?.status === 402 ? "unpublished" : "notfound"));
  }, [id]);

  if (error === "unpublished") {
    return (
      <div className="builder-error" data-testid="invitation-unpublished">
        <h2>🔒 Esta invitación aún no ha sido publicada</h2>
        <p>Si eres el organizador, entra con tu link secreto de edición y publícala para poder compartirla.</p>
        <Link to="/" className="btn-primary">Crear mi invitación</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="builder-error" data-testid="invitation-not-found">
        <h2>😢 Invitación no encontrada</h2>
        <p>El link puede estar incompleto o la invitación ya no existe.</p>
        <Link to="/" className="btn-primary">Crear una invitación</Link>
      </div>
    );
  }

  if (!inv) return <div className="inv-loading" data-testid="invitation-loading">🎈 Cargando la fiesta...</div>;

  return <InvitationView inv={inv} />;
}
