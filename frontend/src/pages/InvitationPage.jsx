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
      .catch(() => setError(true));
  }, [id]);

  useEffect(() => {
    if (inv?.child_name) {
      document.title = `🎈 ${inv.child_name} - Invitaciones Digitales Fiestita`;
    }
    return () => {
      document.title = "Invitaciones Digitales Fiestita";
    };
  }, [inv]);

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
