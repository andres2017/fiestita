import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { THEME_LIST } from "../themes";
import { InvitationView } from "../components/InvitationView";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY = {
  theme: "videojuegos",
  child_name: "",
  child_full_name: "",
  age: "",
  event_date: "",
  event_time: "",
  venue: "",
  address: "",
  how_arrive: "",
  maps_url: "",
  waze_url: "",
  whatsapp: "",
  message: "",
  script_url: "",
  host_names: "",
};

export default function Builder({ editMode = false }) {
  const { id, token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState({ ...EMPTY, theme: searchParams.get("tema") || "videojuegos" });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState("form");

  useEffect(() => {
    if (editMode && id && token) {
      axios.get(`${API}/invitations/${id}/edit`, { params: { token } })
        .then((r) => setInv({ ...EMPTY, ...r.data }))
        .catch(() => setLoadError(true));
    }
  }, [editMode, id, token]);

  const set = (k) => (e) => setInv({ ...inv, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...inv, age: Number(inv.age) || 0 };
      if (editMode) {
        await axios.put(`${API}/invitations/${id}`, payload, { params: { token } });
        toast.success("¡Invitación actualizada! 🎉");
      } else {
        const r = await axios.post(`${API}/invitations`, payload);
        setCreated(r.data);
      }
    } catch {
      toast.error("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado 📋`);
  };

  if (loadError) {
    return (
      <div className="builder-error" data-testid="builder-error">
        <h2>😢 Link de edición inválido</h2>
        <p>Revisa que el link secreto esté completo o crea una nueva invitación.</p>
        <Link to="/crear" className="btn-primary">Crear nueva invitación</Link>
      </div>
    );
  }

  if (created) {
    const publicUrl = `${window.location.origin}/i/${created.id}`;
    const editUrl = `${window.location.origin}/editar/${created.id}/${created.edit_token}`;
    return (
      <div className="success-screen" data-testid="success-screen">
        <div className="success-card">
          <div className="success-confetti">🎉🎂🎈✨🎁</div>
          <h1>¡Tu invitación está lista!</h1>
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
            <button className="btn-outline" onClick={() => navigate(`/editar/${created.id}/${created.edit_token}`)} data-testid="go-edit-btn">✏️ Seguir editando</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="builder">
      <nav className="landing-nav builder-nav">
        <Link to="/" className="landing-logo">🎈 Fiestita</Link>
        <div className="builder-tabs">
          <button className={tab === "form" ? "active" : ""} onClick={() => setTab("form")} data-testid="tab-form-btn">✏️ Editar</button>
          <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")} data-testid="tab-preview-btn">👀 Vista previa</button>
        </div>
      </nav>

      <div className="builder-grid">
        <form onSubmit={save} className={`builder-form ${tab === "form" ? "" : "hide-mobile"}`}>
          <h1>{editMode ? "✏️ Edita tu invitación" : "🎨 Crea tu invitación"}</h1>

          <label className="field-label">Temática</label>
          <div className="theme-picker" data-testid="theme-picker">
            {THEME_LIST.map((t) => (
              <button type="button" key={t.id}
                className={`theme-chip ${inv.theme === t.id ? "active" : ""}`}
                onClick={() => setInv({ ...inv, theme: t.id })}
                data-testid={`theme-chip-${t.id}`}>
                <span>{t.emoji}</span> {t.name}
              </button>
            ))}
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Nombre del peque *</label>
              <input required value={inv.child_name} onChange={set("child_name")} placeholder="Gabriel" data-testid="input-child-name" />
            </div>
            <div className="field field-sm">
              <label className="field-label">Edad que cumple *</label>
              <input required type="number" min="1" max="15" value={inv.age} onChange={set("age")} placeholder="2" data-testid="input-age" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Nombre completo (opcional)</label>
            <input value={inv.child_full_name} onChange={set("child_full_name")} placeholder="Gabriel Alejandro Vargas Cetina" data-testid="input-full-name" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Fecha de la fiesta *</label>
              <input required type="date" value={inv.event_date} onChange={set("event_date")} data-testid="input-date" />
            </div>
            <div className="field">
              <label className="field-label">Hora *</label>
              <input required type="time" value={inv.event_time} onChange={set("event_time")} data-testid="input-time" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Lugar *</label>
            <input required value={inv.venue} onChange={set("venue")} placeholder="Salón de fiestas Villa Feliz" data-testid="input-venue" />
          </div>
          <div className="field">
            <label className="field-label">Dirección</label>
            <input value={inv.address} onChange={set("address")} placeholder="Carrera 8 # 21-66, Centro, Tunja" data-testid="input-address" />
          </div>
          <div className="field">
            <label className="field-label">Indicaciones para llegar</label>
            <textarea rows="3" value={inv.how_arrive} onChange={set("how_arrive")} placeholder="🚶 A pie: a pocas cuadras de la plaza... 🚗 En carro: toma la Carrera 9..." data-testid="input-how-arrive" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Link de Google Maps</label>
              <input value={inv.maps_url} onChange={set("maps_url")} placeholder="https://maps.google.com/..." data-testid="input-maps-url" />
            </div>
            <div className="field">
              <label className="field-label">Link de Waze</label>
              <input value={inv.waze_url} onChange={set("waze_url")} placeholder="https://waze.com/ul?..." data-testid="input-waze-url" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Mensaje personal</label>
            <textarea rows="3" value={inv.message} onChange={set("message")} placeholder="Con la alegría de sus papás, queremos que nos acompañes..." data-testid="input-message" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">WhatsApp para confirmaciones</label>
              <input value={inv.whatsapp} onChange={set("whatsapp")} placeholder="573001234567" data-testid="input-whatsapp" />
            </div>
            <div className="field">
              <label className="field-label">Firma (opcional)</label>
              <input value={inv.host_names} onChange={set("host_names")} placeholder="Papás de Gabriel" data-testid="input-hosts" />
            </div>
          </div>

          <details className="advanced">
            <summary>⚙️ Avanzado: guardar confirmaciones en Google Sheets</summary>
            <div className="field">
              <label className="field-label">URL de tu Google Apps Script (termina en /exec)</label>
              <input value={inv.script_url} onChange={set("script_url")} placeholder="https://script.google.com/macros/s/.../exec" data-testid="input-script-url" />
              <p className="field-help">
                Si la agregas, cada confirmación llegará a tu hoja de Google Sheets automáticamente.
              </p>
            </div>
          </details>

          <button type="submit" disabled={saving} className="btn-primary btn-save" data-testid="save-invitation-btn">
            {saving ? "Guardando..." : editMode ? "💾 Guardar cambios" : "🎉 Crear invitación"}
          </button>
          {editMode && (
            <a href={`/i/${id}`} target="_blank" rel="noopener noreferrer" className="btn-outline btn-view-public" data-testid="view-public-btn">
              🔗 Ver invitación publicada
            </a>
          )}
        </form>

        <div className={`builder-preview ${tab === "preview" ? "" : "hide-mobile"}`} data-testid="builder-preview">
          <div className="preview-label">Vista previa en vivo ✨</div>
          <div className="preview-frame">
            <InvitationView inv={{ ...inv, age: inv.age || "?" }} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
