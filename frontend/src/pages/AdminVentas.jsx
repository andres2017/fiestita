import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { THEMES } from "../themes";

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
    document.title = "Mis ventas - Fiestita";
    if (key) cargar(key);
    return () => { document.title = "Fiestita"; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salir = () => {
    sessionStorage.removeItem(KEY_STORAGE);
    setKey("");
    setData(null);
    setInput("");
  };

  if (!key || !data) {
    return (
      <div style={st.page}>
        <div style={st.loginBox} data-testid="admin-login">
          <div style={{ fontSize: 40 }}>🔒</div>
          <h1 style={{ ...st.h1, marginBottom: 6 }}>Mis ventas</h1>
          <p style={st.muted}>Panel privado de Fiestita. Ingresa tu clave de administrador.</p>
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
            <Link to="/" style={{ color: "#8B5CF6", fontSize: 13 }}>← Volver a Fiestita</Link>
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
