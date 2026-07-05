import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { THEME_LIST } from "../themes";
import { InvitationView } from "../components/InvitationView";

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_BASE}/api`;
const MAX_VIDEO_MB = 50;

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
  video_url: "",
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
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (editMode && id && token) {
      axios.get(`${API}/invitations/${id}/edit`, { params: { token } })
        .then((r) => setInv({ ...EMPTY, ...r.data }))
        .catch(() => setLoadError(true));
    }
  }, [editMode, id, token]);

  const set = (k) => (e) => setInv({ ...inv, [k]: e.target.value });

  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`El video no puede pesar más de ${MAX_VIDEO_MB}MB.`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploadingVideo(true);
    try {
      const r = await axios.post(`${API}/uploads/video`, formData);
      setInv((prev) => ({ ...prev, video_url: r.data.video_url }));
      toast.success("¡Video subido! 🎥");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No se pudo subir el video. Inténtalo de nuevo.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeVideo = () => setInv((prev) => ({ ...prev, video_url: "" }));

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
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado 📋`);
    } catch {
      toast.error(`No se pudo copiar ${label.toLowerCase()}. Selecciónalo y cópialo manualmente.`);
    }
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
              <label className="field-label" htmlFor="input-child-name">Nombre del peque *</label>
              <input id="input-child-name" required value={inv.child_name} onChange={set("child_name")} placeholder="Gabriel" data-testid="input-child-name" />
            </div>
            <div className="field field-sm">
              <label className="field-label" htmlFor="input-age">Edad que cumple *</label>
              <input id="input-age" required type="number" min="1" max="15" value={inv.age} onChange={set("age")} placeholder="2" data-testid="input-age" />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="input-full-name">Nombre completo (opcional)</label>
            <input id="input-full-name" value={inv.child_full_name} onChange={set("child_full_name")} placeholder="Gabriel Alejandro Vargas Cetina" data-testid="input-full-name" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="input-date">Fecha de la fiesta *</label>
              <input id="input-date" required type="date" value={inv.event_date} onChange={set("event_date")} data-testid="input-date" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="input-time">Hora *</label>
              <input id="input-time" required type="time" value={inv.event_time} onChange={set("event_time")} data-testid="input-time" />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="input-venue">Lugar *</label>
            <input id="input-venue" required value={inv.venue} onChange={set("venue")} placeholder="Salón de fiestas Villa Feliz" data-testid="input-venue" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="input-address">Dirección</label>
            <input id="input-address" value={inv.address} onChange={set("address")} placeholder="Carrera 8 # 21-66, Centro, Tunja" data-testid="input-address" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="input-how-arrive">Indicaciones para llegar</label>
            <textarea id="input-how-arrive" rows="3" value={inv.how_arrive} onChange={set("how_arrive")} placeholder="🚶 A pie: a pocas cuadras de la plaza... 🚗 En carro: toma la Carrera 9..." data-testid="input-how-arrive" />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="input-maps-url">Link de Google Maps</label>
              <input id="input-maps-url" value={inv.maps_url} onChange={set("maps_url")} placeholder="https://maps.google.com/..." data-testid="input-maps-url" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="input-waze-url">Link de Waze</label>
              <input id="input-waze-url" value={inv.waze_url} onChange={set("waze_url")} placeholder="https://waze.com/ul?..." data-testid="input-waze-url" />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="input-message">Mensaje personal</label>
            <textarea id="input-message" rows="3" value={inv.message} onChange={set("message")} placeholder="Con la alegría de sus papás, queremos que nos acompañes..." data-testid="input-message" />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="input-video">Video para tu invitación (opcional)</label>
            {inv.video_url ? (
              <div className="video-upload-preview">
                <video
                  src={`${BACKEND_BASE}${inv.video_url}`}
                  controls
                  className="video-upload-player"
                  data-testid="video-upload-preview"
                />
                <button type="button" className="btn-outline" onClick={removeVideo} data-testid="remove-video-btn">
                  🗑️ Quitar video
                </button>
              </div>
            ) : (
              <input
                id="input-video"
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/ogg"
                onChange={handleVideoChange}
                disabled={uploadingVideo}
                data-testid="input-video"
              />
            )}
            <p className="field-help">
              {uploadingVideo ? "Subiendo video... 🎬" : "Formatos: MP4, WebM, MOV. Máximo 50MB."}
            </p>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="input-whatsapp">WhatsApp para confirmaciones</label>
              <input id="input-whatsapp" value={inv.whatsapp} onChange={set("whatsapp")} placeholder="573001234567" data-testid="input-whatsapp" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="input-hosts">Firma (opcional)</label>
              <input id="input-hosts" value={inv.host_names} onChange={set("host_names")} placeholder="Papás de Gabriel" data-testid="input-hosts" />
            </div>
          </div>

          <details className="advanced">
            <summary>⚙️ Avanzado: guardar confirmaciones en Google Sheets</summary>
            <div className="field">
              <label className="field-label" htmlFor="input-script-url">URL de tu Google Apps Script (termina en /exec)</label>
              <input id="input-script-url" value={inv.script_url} onChange={set("script_url")} placeholder="https://script.google.com/macros/s/.../exec" data-testid="input-script-url" />
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
