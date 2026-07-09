import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, CATEGORY_FIELDS, THEMES, THEME_LIST, PALETTES, FONTS, ELEGANT_HERO_CATEGORIES } from "../themes";
import { InvitationView } from "../components/InvitationView";

const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_BASE}/api`;
const MAX_VIDEO_MB = 50;
const MAX_PHOTO_MB = 8;
const MAX_PHOTOS = 3;
const MAX_CUSTOM_INVITE_MB = 20;
const MAX_CUSTOM_INVITE_VIDEO_SECONDS = 30;

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
  audience: "todos",
  ask_phone: true,
  color_palette: "",
  font_family: "",
  dress_code: "",
  show_emojis: true,
  custom_invite_url: "",
  custom_invite_type: "",
  custom_invite_active: false,
};

const AUDIENCE_OPTIONS = [
  { value: "ninos", label: "🧒 Solo niños" },
  { value: "todos", label: "👨‍👩‍👧 Niños y adultos" },
  { value: "adultos", label: "🥂 Solo adultos" },
];

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
  const themeColors = THEMES[inv.theme]?.colors || THEMES.videojuegos.colors;
  const isElegantCategory = ELEGANT_HERO_CATEGORIES.has(THEMES[inv.theme]?.category);

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

  const [uploadingPhotoSlot, setUploadingPhotoSlot] = useState(null);
  const handlePhotoSlotChange = (slotIndex) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`Cada foto no puede pesar más de ${MAX_PHOTO_MB}MB.`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploadingPhotoSlot(slotIndex);
    try {
      const r = await axios.post(`${API}/uploads/photo`, formData);
      setInv((prev) => {
        const next = [...prev.photo_urls];
        next[slotIndex] = r.data.photo_url;
        return { ...prev, photo_urls: next };
      });
      toast.success("¡Foto subida! 📸");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setUploadingPhotoSlot(null);
    }
  };
  const removePhotoSlot = (slotIndex) => setInv((prev) => ({ ...prev, photo_urls: prev.photo_urls.filter((_, i) => i !== slotIndex) }));

  /** Reads a video file's duration client-side (no upload yet) via a throwaway <video>. */
  const readVideoDuration = (file) =>
    new Promise((resolve, reject) => {
      const el = document.createElement("video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        URL.revokeObjectURL(el.src);
        resolve(el.duration);
      };
      el.onerror = () => {
        URL.revokeObjectURL(el.src);
        reject(new Error("No se pudo leer el video"));
      };
      el.src = URL.createObjectURL(file);
    });

  const [uploadingCustomInvite, setUploadingCustomInvite] = useState(false);
  const handleCustomInviteChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_CUSTOM_INVITE_MB * 1024 * 1024) {
      toast.error(`El archivo no puede pesar más de ${MAX_CUSTOM_INVITE_MB}MB.`);
      return;
    }
    if (file.type.startsWith("video/")) {
      try {
        const duration = await readVideoDuration(file);
        if (duration > MAX_CUSTOM_INVITE_VIDEO_SECONDS) {
          toast.error(`El video no puede durar más de ${MAX_CUSTOM_INVITE_VIDEO_SECONDS} segundos.`);
          return;
        }
      } catch {
        toast.error("No se pudo leer el video. Prueba con otro archivo.");
        return;
      }
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploadingCustomInvite(true);
    try {
      const r = await axios.post(`${API}/uploads/custom-invite`, formData);
      setInv((prev) => ({
        ...prev,
        custom_invite_url: r.data.custom_invite_url,
        custom_invite_type: r.data.custom_invite_type,
        custom_invite_active: true,
      }));
      toast.success("¡Invitación personalizada subida! 🎨");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No se pudo subir el archivo. Inténtalo de nuevo.");
    } finally {
      setUploadingCustomInvite(false);
    }
  };
  const removeCustomInvite = () =>
    setInv((prev) => ({ ...prev, custom_invite_url: "", custom_invite_type: "", custom_invite_active: false }));

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
          <motion.div className="theme-picker" data-testid="theme-picker" layout transition={{ duration: 0.25, ease: "easeOut" }}>
            <AnimatePresence initial={false}>
              {THEME_LIST.filter((t) => t.category === selectedCategory).map((t) => (
                <motion.button
                  type="button" key={t.id} layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`theme-chip ${inv.theme === t.id ? "active" : ""}`}
                  onClick={() => setInv({ ...inv, theme: t.id })}
                  data-testid={`theme-chip-${t.id}`}>
                  <span>{t.emoji}</span> {t.name}
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>

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

          <div className="field custom-invite-field">
            <label className="field-label">¿Ya tienes tu invitación diseñada? (opcional)</label>
            <p className="field-help">
              Sube tu propio diseño (hecho en Canva u otra herramienta) como imagen, PDF o video de hasta{" "}
              {MAX_CUSTOM_INVITE_VIDEO_SECONDS} segundos. Puedes elegir si se muestra esa o la que arma Fiestita.
            </p>

            {inv.custom_invite_url ? (
              <div className="custom-invite-preview" data-testid="custom-invite-preview">
                {inv.custom_invite_type === "image" && (
                  <img src={inv.custom_invite_url} alt="Tu invitación" className="custom-invite-thumb" />
                )}
                {inv.custom_invite_type === "video" && (
                  <video src={inv.custom_invite_url} className="custom-invite-thumb" controls playsInline />
                )}
                {inv.custom_invite_type === "pdf" && (
                  <a href={inv.custom_invite_url} target="_blank" rel="noopener noreferrer" className="custom-invite-pdf-chip">
                    📄 Ver PDF subido
                  </a>
                )}
                <button type="button" className="btn-outline" onClick={removeCustomInvite} data-testid="custom-invite-remove-btn">
                  ✕ Quitar
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime,video/ogg"
                onChange={handleCustomInviteChange}
                disabled={uploadingCustomInvite}
                data-testid="input-custom-invite"
              />
            )}
            {uploadingCustomInvite && <p className="field-help">Subiendo... 🎨</p>}

            {inv.custom_invite_url && (
              <label className="reveal-toggle custom-invite-active-toggle" htmlFor="input-custom-invite-active">
                <input
                  id="input-custom-invite-active"
                  type="checkbox"
                  checked={inv.custom_invite_active}
                  onChange={(e) => setInv({ ...inv, custom_invite_active: e.target.checked })}
                  data-testid="input-custom-invite-active"
                />
                <span>
                  🖼️ Mostrar mi invitación personalizada como portada
                  <small>Si lo desactivas, se muestra la invitación que arma Fiestita en su lugar.</small>
                </span>
              </label>
            )}
          </div>

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
              <p className="field-help">Aparece como mensaje bajo el nombre en la portada de tu invitación.</p>
            </div>
          )}

          {isElegantCategory && (
            <div className="field">
              <label className="field-label" htmlFor="input-dress-code">{fieldConfig.dressCodeLabel || "Código de vestimenta o etiqueta (opcional)"}</label>
              <input id="input-dress-code" value={inv.dress_code} onChange={set("dress_code")} placeholder={fieldConfig.dressCodePlaceholder || "Ej: Formal"} data-testid="input-dress-code" />
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
                  src={inv.video_url.startsWith("http") ? inv.video_url : `${BACKEND_BASE}${inv.video_url}`}
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
            <label className="field-label">Fotos para tu invitación (opcional, hasta {MAX_PHOTOS})</label>
            <div className="photo-slots" data-testid="photo-slots">
              {Array.from({ length: MAX_PHOTOS }, (_, i) => i).map((slotIndex) => {
                const url = inv.photo_urls[slotIndex];
                const isUploading = uploadingPhotoSlot === slotIndex;
                const src = url ? (url.startsWith("http") ? url : `${BACKEND_BASE}${url}`) : null;
                return (
                  <div className="photo-slot" key={slotIndex}>
                    {url ? (
                      <div className="photo-slot-filled">
                        <img src={src} alt={`Imagen ${slotIndex + 1}`} data-testid="photo-upload-preview" />
                        <button type="button" className="photo-upload-remove" onClick={() => removePhotoSlot(slotIndex)} data-testid="remove-photo-btn">✕</button>
                      </div>
                    ) : (
                      <label className={`photo-slot-empty ${isUploading ? "is-uploading" : ""}`} htmlFor={`input-photo-${slotIndex}`}>
                        <span className="photo-slot-plus">{isUploading ? "…" : "+"}</span>
                        <span className="photo-slot-label">Imagen {slotIndex + 1}</span>
                        <input
                          id={`input-photo-${slotIndex}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoSlotChange(slotIndex)}
                          disabled={isUploading}
                          data-testid={`input-photo-${slotIndex}`}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="field-help">Formatos: JPG, PNG, WEBP. Máximo {MAX_PHOTO_MB}MB cada una.</p>
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

          <div className="field">
            <label className="field-label">¿Para quién es la celebración?</label>
            <div className="audience-picker" data-testid="audience-picker">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button type="button" key={opt.value}
                  className={`audience-chip ${inv.audience === opt.value ? "active" : ""}`}
                  onClick={() => setInv({ ...inv, audience: opt.value })}
                  data-testid={`audience-chip-${opt.value}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="field-help">Así los invitados saben si es para niños, adultos, o toda la familia.</p>
          </div>

          <div className="field">
            <label className="field-label">Colores de la tarjeta</label>
            <div className="palette-picker" data-testid="palette-picker">
              <button
                type="button"
                className={`palette-swatch ${!inv.color_palette ? "active" : ""}`}
                style={{ background: `linear-gradient(135deg, ${themeColors.primary} 50%, ${themeColors.accent} 50%)` }}
                onClick={() => setInv({ ...inv, color_palette: "" })}
                title="Colores originales de la temática"
                data-testid="palette-swatch-original"
              />
              {PALETTES.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={`palette-swatch ${inv.color_palette === p.id ? "active" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.accent} 50%)` }}
                  onClick={() => setInv({ ...inv, color_palette: p.id })}
                  title={p.name}
                  data-testid={`palette-swatch-${p.id}`}
                />
              ))}
            </div>
            <p className="field-help">Opcional: cambia los colores de tu tarjeta sin cambiar la temática. El primer círculo son los colores originales.</p>
          </div>

          {isElegantCategory && (
            <div className="field">
              <label className="field-label">Tipo de letra</label>
              <div className="font-picker" data-testid="font-picker">
                <button
                  type="button"
                  className={`font-chip ${!inv.font_family ? "active" : ""}`}
                  onClick={() => setInv({ ...inv, font_family: "" })}
                  data-testid="font-chip-original">
                  Original
                </button>
                {FONTS.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    className={`font-chip ${inv.font_family === f.id ? "active" : ""}`}
                    style={{ fontFamily: f.css }}
                    onClick={() => setInv({ ...inv, font_family: f.id })}
                    data-testid={`font-chip-${f.id}`}>
                    {f.name}
                  </button>
                ))}
              </div>
              <p className="field-help">Opcional: cambia la fuente de tu tarjeta sin cambiar la temática.</p>
            </div>
          )}

          <label className="reveal-toggle" htmlFor="input-show-emojis">
            <input
              id="input-show-emojis"
              type="checkbox"
              checked={inv.show_emojis}
              onChange={(e) => setInv({ ...inv, show_emojis: e.target.checked })}
              data-testid="input-show-emojis"
            />
            <span>
              😀 Usar emoticones en la tarjeta
              <small>Si lo desactivas, tu invitación se ve sin emoticones — solo texto, para un estilo más sobrio.</small>
            </span>
          </label>

          <label className="reveal-toggle" htmlFor="input-ask-phone">
            <input
              id="input-ask-phone"
              type="checkbox"
              checked={inv.ask_phone}
              onChange={(e) => setInv({ ...inv, ask_phone: e.target.checked })}
              data-testid="input-ask-phone"
            />
            <span>
              📱 Pedir celular al confirmar asistencia
              <small>Si lo desactivas, los invitados solo confirman con su nombre, sin dejar su número.</small>
            </span>
          </label>

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
