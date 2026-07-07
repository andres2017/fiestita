import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { THEMES, THEME_LIST, CATEGORIES, CATEGORY_FIELDS } from "../themes";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const KEY_STORAGE = "fiestita_admin_key";

const fmtCOP = (v) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

const fmtFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const fmtMes = (ym) => {
  if (!ym || ym.length < 7) return ym;
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const s = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const METODO = {
  CARD: "💳 Tarjeta",
  NEQUI: "📱 Nequi",
  PSE: "🏦 PSE",
  BANCOLOMBIA_TRANSFER: "🏦 Bancolombia",
  BANCOLOMBIA_COLLECT: "🏦 Corresponsal",
  DAVIPLATA: "📱 Daviplata",
  MANUAL: "✍️ Manual",
};

const EMPTY_MANUAL = {
  theme: "videojuegos",
  child_name: "",
  age: "",
  event_date: "",
  event_time: "",
  venue: "",
  whatsapp: "",
  host_names: "",
  event_subtitle: "",
  amount_cop: "",
  customer_email: "",
  payment_note: "",
};

const st = {
  page: { minHeight: "100vh", background: "#0F172A", color: "#E2E8F0", fontFamily: "'Space Grotesk', system-ui, sans-serif", padding: "24px 16px" },
  wrap: { maxWidth: 960, margin: "0 auto" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" },
  h1: { fontSize: 26, margin: 0 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 },
  card: { background: "#1E293B", borderRadius: 14, padding: "16px 18px", border: "1px solid #334155" },
  cardLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#94A3B8", marginBottom: 6 },
  cardValue: { fontSize: 24, fontWeight: 700, color: "#FFFFFF" },
  tableWrap: { background: "#1E293B", borderRadius: 14, border: "1px solid #334155", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 640 },
  th: { textAlign: "left", padding: "12px 14px", color: "#94A3B8", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #334155" },
  td: { padding: "12px 14px", borderBottom: "1px solid #24344D", verticalAlign: "top" },
  btn: { background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  btnGhost: { background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
  input: { background: "#0F172A", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, width: "100%", boxSizing: "border-box" },
  loginBox: { maxWidth: 380, margin: "12vh auto 0", background: "#1E293B", border: "1px solid #334155", borderRadius: 16, padding: 28, textAlign: "center" },
  error: { color: "#F87171", fontSize: 14, marginTop: 10 },
  muted: { color: "#94A3B8", fontSize: 13 },
  monthRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #334155", fontSize: 14 },
  manualHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" },
  manualGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  select: { background: "#0F172A", border: "1px solid #334155", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, width: "100%", boxSizing: "border-box" },
  linkRow: { display: "flex", gap: 8, marginTop: 6 },
  linkInput: { flex: 1, background: "#0F172A", border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, minWidth: 0 },
  categoryChips: { display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 4px" },
  categoryChip: { background: "transparent", color: "#94A3B8", border: "1px solid #334155", borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
  categoryChipActive: { background: "#8B5CF6", color: "#fff", borderColor: "#8B5CF6" },
};

export default function AdminVentas() {
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || "");
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async (k) => {
    setLoading(true);
    setError("");
    try {
      const r = await axios.get(`${API}/admin/sales`, { headers: { "X-Admin-Key": k } });
      setData(r.data);
      setKey(k);
      sessionStorage.setItem(KEY_STORAGE, k);
    } catch (e) {
      setData(null);
      if (e?.response?.status === 403) {
        sessionStorage.removeItem(KEY_STORAGE);
        setKey("");
        setError("Clave incorrecta o no autorizada.");
      } else {
        setError("No se pudo cargar. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Mis ventas - Invitaciones Digitales Fiestita";
    if (key) cargar(key);
    return () => { document.title = "Invitaciones Digitales Fiestita"; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salir = () => {
    sessionStorage.removeItem(KEY_STORAGE);
    setKey("");
    setData(null);
    setInput("");
  };

  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL);
  const [manualCategory, setManualCategory] = useState("cumple_infantil");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const setManual = (k) => (e) => setManualForm({ ...manualForm, [k]: e.target.value });
  const manualFieldConfig = CATEGORY_FIELDS[manualCategory];
  const manualThemesForCategory = THEME_LIST.filter((t) => t.category === manualCategory);

  const selectManualCategory = (catId) => {
    setManualCategory(catId);
    const firstTheme = THEME_LIST.find((t) => t.category === catId);
    setManualForm((prev) => ({ ...prev, theme: firstTheme?.id || prev.theme }));
  };

  const crearManual = async (e) => {
    e.preventDefault();
    setManualSaving(true);
    setManualError("");
    setManualResult(null);
    try {
      const payload = {
        ...manualForm,
        age: Number(manualForm.age) || 0,
        amount_cop: manualForm.amount_cop ? Number(manualForm.amount_cop) : null,
      };
      const r = await axios.post(`${API}/admin/invitations`, payload, { headers: { "X-Admin-Key": key } });
      setManualResult(r.data);
      setManualForm(EMPTY_MANUAL);
      setManualCategory("cumple_infantil");
      cargar(key);
    } catch (err) {
      setManualError(err?.response?.data?.detail || "No se pudo crear la invitación.");
    } finally {
      setManualSaving(false);
    }
  };

  if (!key || !data) {
    return (
      <div style={st.page}>
        <div style={st.loginBox} data-testid="admin-login">
          <div style={{ fontSize: 40 }}>🔒</div>
          <h1 style={{ ...st.h1, marginBottom: 6 }}>Mis ventas</h1>
          <p style={st.muted}>Panel privado de Invitaciones Digitales Fiestita. Ingresa tu clave de administrador.</p>
          <input
            style={{ ...st.input, marginTop: 14 }}
            type="password"
            placeholder="Clave de administrador"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && input && cargar(input)}
            data-testid="admin-key-input"
          />
          <button
            style={{ ...st.btn, marginTop: 14, width: "100%", opacity: loading || !input ? 0.6 : 1 }}
            disabled={loading || !input}
            onClick={() => cargar(input)}
            data-testid="admin-login-btn"
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
          {error && <div style={st.error}>{error}</div>}
          <div style={{ marginTop: 18 }}>
            <Link to="/" style={{ color: "#8B5CF6", fontSize: 13 }}>← Volver a Invitaciones Digitales Fiestita</Link>
          </div>
        </div>
      </div>
    );
  }

  const mesActual = new Date().toISOString().slice(0, 7);
  const ingresosMes = data.by_month.find((m) => m.month === mesActual)?.total_cop || 0;

  return (
    <div style={st.page}>
      <div style={st.wrap}>
        <div style={st.top}>
          <h1 style={st.h1} data-testid="admin-sales-title">💰 Mis ventas</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={st.btnGhost} onClick={() => cargar(key)} disabled={loading}>
              {loading ? "Actualizando..." : "↻ Actualizar"}
            </button>
            <button style={st.btnGhost} onClick={salir}>Salir</button>
          </div>
        </div>

        <div style={st.cards}>
          <div style={st.card}>
            <div style={st.cardLabel}>Ingresos totales</div>
            <div style={st.cardValue} data-testid="total-revenue">{fmtCOP(data.total_cop)}</div>
          </div>
          <div style={st.card}>
            <div style={st.cardLabel}>Invitaciones pagadas</div>
            <div style={st.cardValue} data-testid="total-sales">{data.count}</div>
          </div>
          <div style={st.card}>
            <div style={st.cardLabel}>Este mes</div>
            <div style={st.cardValue}>{fmtCOP(ingresosMes)}</div>
          </div>
        </div>

        <div style={{ ...st.card, marginBottom: 24 }}>
          <div style={st.manualHeader} onClick={() => setManualOpen(!manualOpen)} data-testid="manual-toggle">
            <div style={st.cardLabel}>✍️ Crear invitación manual (pago por fuera de Wompi)</div>
            <span style={{ color: "#94A3B8", fontSize: 18 }}>{manualOpen ? "−" : "+"}</span>
          </div>

          {manualOpen && (
            <>
              <p style={{ ...st.muted, marginTop: 10 }}>
                Úsalo cuando alguien te pague por WhatsApp, efectivo o transferencia. La invitación queda
                activa de inmediato y se registra como venta con método "Manual".
              </p>

              <label style={st.label}>Tipo de evento</label>
              <div style={st.categoryChips} data-testid="manual-category-chips">
                {CATEGORIES.map((c) => (
                  <button type="button" key={c.id}
                    style={{ ...st.categoryChip, ...(manualCategory === c.id ? st.categoryChipActive : {}) }}
                    onClick={() => selectManualCategory(c.id)}
                    data-testid={`manual-category-${c.id}`}>
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>

              <form onSubmit={crearManual}>
                <div style={st.manualGrid}>
                  <div>
                    <label style={st.label} htmlFor="manual-theme">Temática</label>
                    <select id="manual-theme" style={st.select} value={manualForm.theme} onChange={setManual("theme")} data-testid="manual-theme">
                      {manualThemesForCategory.map((t) => (
                        <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-name">{manualFieldConfig.nameLabel}</label>
                    <input id="manual-name" style={st.input} required value={manualForm.child_name} onChange={setManual("child_name")} placeholder={manualFieldConfig.namePlaceholder} data-testid="manual-child-name" />
                  </div>
                  {manualFieldConfig.showAge && (
                    <div>
                      <label style={st.label} htmlFor="manual-age">{manualFieldConfig.ageLabel}</label>
                      <input id="manual-age" style={st.input} required type="number" min="1" max="110" value={manualForm.age} onChange={setManual("age")} data-testid="manual-age" />
                    </div>
                  )}
                  {manualFieldConfig.showSubtitle && (
                    <div>
                      <label style={st.label} htmlFor="manual-subtitle">{manualFieldConfig.subtitleLabel}</label>
                      <input id="manual-subtitle" style={st.input} value={manualForm.event_subtitle} onChange={setManual("event_subtitle")} placeholder={manualFieldConfig.subtitlePlaceholder} data-testid="manual-subtitle" />
                    </div>
                  )}
                  <div>
                    <label style={st.label} htmlFor="manual-date">Fecha de la fiesta *</label>
                    <input id="manual-date" style={st.input} required type="date" value={manualForm.event_date} onChange={setManual("event_date")} data-testid="manual-date" />
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-time">Hora *</label>
                    <input id="manual-time" style={st.input} required type="time" value={manualForm.event_time} onChange={setManual("event_time")} data-testid="manual-time" />
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-venue">Lugar</label>
                    <input id="manual-venue" style={st.input} value={manualForm.venue} onChange={setManual("venue")} data-testid="manual-venue" />
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-whatsapp">WhatsApp para confirmaciones</label>
                    <input id="manual-whatsapp" style={st.input} value={manualForm.whatsapp} onChange={setManual("whatsapp")} placeholder="573001234567" data-testid="manual-whatsapp" />
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-hosts">Firma (opcional)</label>
                    <input id="manual-hosts" style={st.input} value={manualForm.host_names} onChange={setManual("host_names")} placeholder="Papás de..." data-testid="manual-hosts" />
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-amount">Monto cobrado (COP)</label>
                    <input id="manual-amount" style={st.input} type="number" min="0" value={manualForm.amount_cop} onChange={setManual("amount_cop")} placeholder={`Por defecto: precio actual`} data-testid="manual-amount" />
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-email">Correo del cliente (opcional)</label>
                    <input id="manual-email" style={st.input} type="email" value={manualForm.customer_email} onChange={setManual("customer_email")} data-testid="manual-email" />
                  </div>
                  <div>
                    <label style={st.label} htmlFor="manual-note">Nota del pago (opcional)</label>
                    <input id="manual-note" style={st.input} value={manualForm.payment_note} onChange={setManual("payment_note")} placeholder="Ej: pagó por Nequi al 310..." data-testid="manual-note" />
                  </div>
                </div>

                <button type="submit" style={{ ...st.btn, marginTop: 16, opacity: manualSaving ? 0.6 : 1 }} disabled={manualSaving} data-testid="manual-submit">
                  {manualSaving ? "Creando..." : "✅ Crear invitación pagada"}
                </button>
                {manualError && <div style={st.error}>{manualError}</div>}
              </form>

              {manualResult && (
                <div style={{ marginTop: 18, padding: 14, background: "#0F172A", borderRadius: 10, border: "1px solid #334155" }} data-testid="manual-result">
                  <div style={{ color: "#4ADE80", fontWeight: 700, marginBottom: 8 }}>🎉 ¡Invitación creada y marcada como pagada!</div>
                  <label style={st.label}>Link para invitados</label>
                  <div style={st.linkRow}>
                    <input readOnly style={st.linkInput} value={`${window.location.origin}/i/${manualResult.id}`} data-testid="manual-public-link" />
                  </div>
                  <label style={{ ...st.label, marginTop: 10 }}>Link secreto de edición (envíalo al cliente)</label>
                  <div style={st.linkRow}>
                    <input readOnly style={st.linkInput} value={`${window.location.origin}/editar/${manualResult.id}/${manualResult.edit_token}`} data-testid="manual-edit-link" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {data.by_month.length > 0 && (
          <div style={{ ...st.card, marginBottom: 24 }}>
            <div style={st.cardLabel}>Ingresos por mes</div>
            {data.by_month.map((m) => (
              <div key={m.month} style={st.monthRow}>
                <span>{fmtMes(m.month)}</span>
                <strong>{fmtCOP(m.total_cop)}</strong>
              </div>
            ))}
          </div>
        )}

        <div style={st.tableWrap}>
          <table style={st.table} data-testid="sales-table">
            <thead>
              <tr>
                <th style={st.th}>Fecha de pago</th>
                <th style={st.th}>Invitación</th>
                <th style={st.th}>Método</th>
                <th style={st.th}>Referencia</th>
                <th style={{ ...st.th, textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.length === 0 && (
                <tr>
                  <td style={st.td} colSpan={5}>
                    Aún no hay ventas registradas. Cuando Wompi apruebe un pago, aparecerá aquí automáticamente. 🎉
                  </td>
                </tr>
              )}
              {data.sales.map((s) => {
                const inv = s.invitation;
                const tema = inv ? THEMES[inv.theme] : null;
                return (
                  <tr key={s.wompi_transaction_id || s.id}>
                    <td style={st.td}>{fmtFecha(s.finalized_at || s.created_at)}</td>
                    <td style={st.td}>
                      {inv ? (
                        <>
                          <div>{tema?.emoji} <strong>{inv.child_name}</strong></div>
                          <div style={st.muted}>
                            {inv.event_date} · <Link to={`/i/${inv.id}`} style={{ color: "#8B5CF6" }}>ver invitación</Link>
                          </div>
                        </>
                      ) : (
                        <span style={st.muted}>Sin invitación asociada</span>
                      )}
                    </td>
                    <td style={st.td}>{METODO[s.payment_method_type] || s.payment_method_type || "—"}</td>
                    <td style={st.td}>
                      <div style={{ fontFamily: "monospace", fontSize: 12 }}>{s.reference || "—"}</div>
                      {s.customer_email && <div style={st.muted}>{s.customer_email}</div>}
                    </td>
                    <td style={{ ...st.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <strong>{fmtCOP((s.amount_in_cents || 0) / 100)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ ...st.muted, marginTop: 16 }}>
          Solo se muestran transacciones con estado APPROVED reportadas por el webhook de Wompi.
        </p>
      </div>
    </div>
  );
}
