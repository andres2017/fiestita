import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { CATEGORIES, CATEGORY_FIELDS, THEMES, THEME_LIST } from "../themes";
import { InvitationView } from "../components/InvitationView";

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_BASE}/api`;
const MAX_VIDEO_MB = 50;
const MAX_PHOTO_MB = 8;
const MAX_PHOTOS = 3;

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
  event_subtitle: "",
  script_url: "",
  host_names: "",
  video_url: "",
  reveal_effect: false,
  photo_urls: [],
  song_url: "",
  gift_note: "",
  gift_registry_url: "",
  itinerary: [],
};

export default function Builder({ editMode = false }) {
  const { id, token } = useParams();
  const [searchParams] = useSearchParams();
  const initialTheme = searchParams.get("tema") || "videojuegos";
  const [inv, setInv] = useState({ ...EMPTY, theme: initialTheme });
  const [selectedCategory, setSelectedCategory] = useState(THEMES[initialTheme]?.category || "cumple_infantil");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState("form");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [priceCop, setPriceCop] = useState(null);
  const [rsvps, setRsvps] = useState(null);
  const [loadingRsvps, setLoadingRsvps] = useState(false);
  const [expired, setExpired] = useState(false);

  const fieldConfig = CATEGORY_FIELDS[THEMES[inv.theme]?.category] || CATEGORY_FIELDS.cumple_infantil;

  useEffect(() => {
    if (editMode && id && token) {
      axios.get(`${API}/invitations/${id}/edit`, { params: { token } })
        .then((r) => {
          setInv({ ...EMPTY, ...r.data });
          setSelectedCategory(THEMES[r.data.theme]?.category || "cumple_infantil");
          setExpired(Boolean(r.data.expired));
        })
        .catch(() => setLoadError(true));
    }
  }, [editMode, id, token]);

  useEffect(() => {
    if (!editMode) {
      axios.get(`${API}/pricing`).then((r) => setPriceCop(r.data.price_cop)).catch(() => {});
    }
  }, [editMode]);

  const loadRsvps = useCallback(() => {
    if (!editMode || !id || !token) return;
    setLoadingRsvps(true);
    axios.get(`${API}/invitations/${id}/rsvps`, { params: { token } })
      .then((r) => setRsvps(r.data))
      .catch(() => {})
      .finally(() => setLoadingRsvps(false));
  }, [editMode, id, token]);

  useEffect(() => { loadRsvps(); }, [loadRsvps]);

  const isAttending = (asiste) => {
    if (asiste.includes("✅")) return true;
    if (asiste.includes("❌")) return false;
    const normalized = asiste.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return /\bsi\b/.test(normalized);
  };
  const totalPersonas = rsvps
    ? rsvps.rsvps.filter((r) => isAttending(r.asiste)).reduce((sum, r) => sum + Number(r.adultos || 0) + Number(r.ninos || 0), 0)
    : 0;

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

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (inv.photo_urls.length >= MAX_PHOTOS) {
      toast.error(`Máximo ${MAX_PHOTOS} fotos.`);
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`Cada foto no puede pesar más de ${MAX_PHOTO_MB}MB.`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploadingPhoto(true);
    try {
      const r = await axios.post(`${API}/uploads/photo`, formData);
      setInv((prev) => ({ ...prev, photo_urls: [...prev.photo_urls, r.data.photo_url] }));
      toast.success("¡Foto subida! 📸");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setUploadingPhoto(false);
    }
  };
  const removePhoto = (url) => setInv((prev) => ({ ...prev, photo_urls: prev.photo_urls.filter((u) => u !== url) }));

  const addItineraryItem = () => setInv((prev) => ({ ...prev, itinerary: [...prev.itinerary, { time: "", label: "", emoji: "" }] }));
  const updateItineraryItem = (i, key) => (e) =>
    setInv((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((it, idx) => (idx === i ? { ...it, [key]: e.target.value } : it)),
    }));
  const removeItineraryItem = (i) => setInv((prev) => ({ ...prev, itinerary: prev.itinerary.filter((_, idx) => idx !== i) }));

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
        const { id: newId, edit_token, checkout } = r.data;
        if (!checkout) {
          toast.error("Los pagos no están disponibles en este momento. Intenta más tarde.");
          return;
        }
        const params = new URLSearchParams({
          "public-key": checkout.public_key,
          currency: checkout.currency,
          "amount-in-cents": String(checkout.amount_in_cents),
          reference: checkout.reference,
          "signature:integrity": checkout.signature,
          "redirect-url": `${window.location.origin}/pago/${newId}/${edit_token}`,
        });
        window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    } finally {
      setSaving(false);
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

  if (expired) {
    return (
      <div className="builder-error" data-testid="builder-expired">
        <h2>⏳ Esta invitación ya expiró</h2>
        <p>El evento ya pasó, así que esta invitación ya no se puede editar. Si necesitas otra, crea una nueva.</p>
        <Link to="/crear" className="btn-primary">Crear nueva invitación</Link>
      </div>
    );
  }

  return (
    <div className="builder">
      <nav className="landing-nav builder-nav">
        <Link to="/" className="landing-logo">🎈 Invitaciones Digitales Fiestita</Link>
        <div className="builder-tabs">
          <button className={tab === "form" ? "active" : ""} onClick={() => setTab("form")} data-testid="tab-form-btn">✏️ Editar</button>
          <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")} data-testid="tab-preview-btn">👀 Vista previa</button>
        </div>
      </nav>

      {editMode && (
        <section className="rsvp-panel" data-testid="rsvp-panel">
          <div className="rsvp-panel-header">
            <h2>
              📋 Confirmaciones {rsvps ? `(${rsvps.count})` : ""}
              {totalPersonas > 0 && <span className="rsvp-panel-total"> · {totalPersonas} personas confirmadas</span>}
            </h2>
            <button type="button" className="btn-outline rsvp-refresh-btn" onClick={loadRsvps} disabled={loadingRsvps} data-testid="rsvp-refresh-btn">
              {loadingRsvps ? "Actualizando..." : "🔄 Actualizar"}
            </button>
          </div>
          {!rsvps || rsvps.count === 0 ? (
            <p className="rsvp-empty">Aún no hay confirmaciones. Comparte el link de invitados para empezar a recibirlas. 🎉</p>
          ) : (
            <div className="rsvp-list">
              {rsvps.rsvps.map((r) => (
                <div key={r.id} className="rsvp-item" data-testid="rsvp-item">
                  <div className="rsvp-item-top">
                    <strong>{r.nombre}</strong>
                    <span className={`rsvp-badge ${isAttending(r.asiste) ? "yes" : "no"}`}>{r.asiste}</span>
                  </div>
                  <div className="rsvp-item-meta">
                    {r.adultos} adulto{Number(r.adultos) === 1 ? "" : "s"} · {r.ninos} niño{Number(r.ninos) === 1 ? "" : "s"}
                    {r.telefono && <> · {r.telefono}</>}
                  </div>
                  {r.mensaje && <p className="rsvp-item-msg">"{r.mensaje}"</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="builder-grid">
        <form onSubmit={save} className={`builder-form ${tab === "form" ? "" : "hide-mobile"}`}>
          <h1>{editMode ? "✏️ Edita tu invitación" : "🎨 Crea tu invitación"}</h1>

          <label className="field-label">Tipo de evento</label>
          <div className="category-picker" data-testid="category-picker">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id}
                className={`category-chip ${selectedCategory === c.id ? "active" : ""}`}
                onClick={() => !editMode && setSelectedCategory(c.id)}
                disabled={editMode && selectedCategory !== c.id}
                title={editMode && selectedCategory !== c.id ? "No puedes cambiar la categoría de una invitación ya creada" : undefined}
                data-testid={`category-chip-${c.id}`}>
                <span>{c.emoji}</span> {c.name}
              </button>
            ))}
          </div>
          {editMode && (
            <p className="field-help category-locked-note">
              🔒 La categoría no se puede cambiar en una invitación ya creada. Si quieres otra
              (por ejemplo pasar de cumpleaños a boda), crea una invitación nueva.
            </p>
          )}

          <label className="field-label">Temática</label>
          <div className="theme-picker" data-testid="theme-picker">
            {THEME_LIST.filter((t) => t.category === selectedCategory).map((t) => (
              <button type="button" key={t.id}
                className={`theme-chip ${inv.theme === t.id ? "active" : ""}`}
                onClick={() => setInv({ ...inv, theme: t.id })}
                data-testid={`theme-chip-${t.id}`}>
                <span>{t.emoji}</span> {t.name}
              </button>
            ))}
          </div>

          <label className="reveal-toggle" htmlFor="input-reveal-effect">
            <input
              id="input-reveal-effect"
              type="checkbox"
              checked={inv.reveal_effect}
              onChange={(e) => setInv({ ...inv, reveal_effect: e.target.checked })}
              data-testid="input-reveal-effect"
            />
            <span>
              ✨ Efecto sorpresa al abrir <em>(opcional)</em>
              <small>Los invitados ven un sobre cerrado que abren con un toque, y tu invitación aparece con una animación.</small>
            </span>
          </label>

          <div className="field-row">
            <div className={fieldConfig.showAge ? "field" : "field field-full"}>
              <label className="field-label" htmlFor="input-child-name">{fieldConfig.nameLabel}</label>
              <input id="input-child-name" required value={inv.child_name} onChange={set("child_name")} placeholder={fieldConfig.namePlaceholder} data-testid="input-child-name" />
            </div>
            {fieldConfig.showAge && (
              <div className="field field-sm">
                <label className="field-label" htmlFor="input-age">{fieldConfig.ageLabel}</label>
                <input id="input-age" required type="number" min={fieldConfig.ageMin || 1} max={fieldConfig.ageMax || 110} value={inv.age} onChange={set("age")} placeholder="2" data-testid="input-age" />
              </div>
            )}
          </div>

          {fieldConfig.showFullName && (
            <div className="field">
              <label className="field-label" htmlFor="input-full-name">Nombre completo (opcional)</label>
              <input id="input-full-name" value={inv.child_full_name} onChange={set("child_full_name")} placeholder="Gabriel Alejandro Vargas Cetina" data-testid="input-full-name" />
            </div>
          )}

          {fieldConfig.showSubtitle && (
            <div className="field">
              <label className="field-label" htmlFor="input-subtitle">{fieldConfig.subtitleLabel}</label>
              <input id="input-subtitle" value={inv.event_subtitle} onChange={set("event_subtitle")} placeholder={fieldConfig.subtitlePlaceholder} data-testid="input-subtitle" />
            </div>
          )}

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

          <div className="field">
            <label className="field-label" htmlFor="input-photo">Fotos para tu invitación (opcional, máx. {MAX_PHOTOS})</label>
            {inv.photo_urls.length > 0 && (
              <div className="photo-upload-grid" data-testid="photo-upload-grid">
                {inv.photo_urls.map((url) => (
                  <div className="photo-upload-item" key={url}>
                    <img src={`${BACKEND_BASE}${url}`} alt="" data-testid="photo-upload-preview" />
                    <button type="button" className="photo-upload-remove" onClick={() => removePhoto(url)} data-testid="remove-photo-btn">✕</button>
                  </div>
                ))}
              </div>
            )}
            {inv.photo_urls.length < MAX_PHOTOS && (
              <input
                id="input-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
                data-testid="input-photo"
              />
            )}
            <p className="field-help">
              {uploadingPhoto ? "Subiendo foto... 📸" : `Formatos: JPG, PNG, WEBP. Máximo ${MAX_PHOTO_MB}MB cada una.`}
            </p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="input-song">Link de tu canción favorita (opcional)</label>
            <input id="input-song" value={inv.song_url} onChange={set("song_url")} placeholder="https://open.spotify.com/track/... o https://youtu.be/..." data-testid="input-song" />
            <p className="field-help">Pega un link de YouTube o Spotify y se reproducirá en tu invitación.</p>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="input-gift-note">Sugerencia de regalos (opcional)</label>
            <textarea id="input-gift-note" rows="2" value={inv.gift_note} onChange={set("gift_note")} placeholder="Tu presencia es nuestro mejor regalo, pero si quieres darnos algo más..." data-testid="input-gift-note" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="input-gift-url">Link de mesa de regalos (opcional)</label>
            <input id="input-gift-url" value={inv.gift_registry_url} onChange={set("gift_registry_url")} placeholder="https://..." data-testid="input-gift-url" />
          </div>

          <div className="field">
            <label className="field-label">Itinerario del evento (opcional)</label>
            {inv.itinerary.map((item, i) => (
              <div className="itinerary-row" key={i} data-testid="itinerary-row">
                <input type="time" value={item.time} onChange={updateItineraryItem(i, "time")} data-testid="itinerary-time" />
                <input value={item.emoji} onChange={updateItineraryItem(i, "emoji")} placeholder="🥂" maxLength={4} className="itinerary-emoji" data-testid="itinerary-emoji" />
                <input value={item.label} onChange={updateItineraryItem(i, "label")} placeholder="Brindis" className="itinerary-label" data-testid="itinerary-label" />
                <button type="button" className="itinerary-remove" onClick={() => removeItineraryItem(i)} data-testid="itinerary-remove-btn">✕</button>
              </div>
            ))}
            <button type="button" className="btn-outline itinerary-add-btn" onClick={addItineraryItem} data-testid="itinerary-add-btn">
              ➕ Agregar momento
            </button>
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
            <summary>⚙️ Opcional: exportar confirmaciones también a Google Sheets</summary>
            <p className="field-help advanced-intro">
              No hace falta para ver quién confirmó — eso ya aparece solo, sin configurar nada, en el
              panel de confirmaciones de tu invitación. Usa esto solo si además quieres una copia
              automática en tu propia hoja de cálculo.
            </p>
            <div className="field">
              <label className="field-label" htmlFor="input-script-url">URL de tu Google Apps Script (termina en /exec)</label>
              <input id="input-script-url" value={inv.script_url} onChange={set("script_url")} placeholder="https://script.google.com/macros/s/.../exec" data-testid="input-script-url" />
              <p className="field-help">
                Si la agregas, cada confirmación llegará a tu hoja de Google Sheets automáticamente.
              </p>
            </div>
          </details>

          <button type="submit" disabled={saving} className="btn-primary btn-save" data-testid="save-invitation-btn">
            {saving
              ? "Guardando..."
              : editMode
                ? "💾 Guardar cambios"
                : priceCop
                  ? `💳 Pagar $${priceCop.toLocaleString("es-CO")} y crear`
                  : "💳 Pagar y crear invitación"}
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
