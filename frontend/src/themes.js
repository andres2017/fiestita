export const THEMES = {
  videojuegos: {
    id: "videojuegos",
    name: "Videojuegos",
    emoji: "🎮",
    dark: true,
    font: "'Press Start 2P', monospace",
    fontScale: 0.62,
    colors: { bg: "#111827", surface: "#1F2937", primary: "#22C55E", text: "#FFFFFF", accent: "#EF4444", soft: "#FBBF24" },
    image: "https://images.unsplash.com/photo-1660507224958-729c18ba1277?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    decorations: ["🍄", "⭐", "👾", "🕹️", "🏆", "💎"],
    copy: {
      badge: (n) => `${n}MUNDO`,
      title: (n, a) => `¡${n} sube al nivel ${a}!`,
      subtitle: (a) => `CUMPLE ${a} AÑITOS 🎂`,
      countdown: "⏳ La aventura comienza en",
      details: "▼ Datos de la misión ▼",
      arrive: "🧭 Cómo llegar",
      rsvpTitle: "🎮 Registro de jugadores",
      rsvpSubtitle: "Confirma tu asistencia para reservar tu lugar en la aventura",
      confirm: "🪙 CONFIRMAR ASISTENCIA",
      successTitle: "★ ¡JUGADOR REGISTRADO! ★",
      successExtra: "+1UP 🍄",
      punctual: "¡Llega puntual, la aventura no espera!",
      gallery: "🖼️ Galería del jugador",
      msgLabel: (n) => `Mensaje para ${n} (opcional)`,
    },
  },
  princesas: {
    id: "princesas",
    name: "Princesas",
    emoji: "👑",
    dark: false,
    font: "'Dancing Script', cursive",
    fontScale: 1.25,
    colors: { bg: "#FDF2F8", surface: "#FFFFFF", primary: "#EC4899", text: "#831843", accent: "#F59E0B", soft: "#FBCFE8" },
    image: "https://images.unsplash.com/photo-1650571057388-3921855f66c9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    decorations: ["👑", "🏰", "✨", "🌸", "🦋", "💖"],
    copy: {
      badge: (n) => `Reino de ${n}`,
      title: (n, a) => `¡La princesa ${n} cumple ${a}!`,
      subtitle: (a) => `CUMPLE ${a} AÑITOS 🎂`,
      countdown: "⏳ El baile real comienza en",
      details: "✨ Detalles de la celebración real ✨",
      arrive: "🏰 Cómo llegar al castillo",
      rsvpTitle: "👑 Lista de invitados reales",
      rsvpSubtitle: "Confirma tu asistencia para reservar tu lugar en el gran baile",
      confirm: "💖 CONFIRMAR ASISTENCIA",
      successTitle: "✨ ¡INVITACIÓN REAL ACEPTADA! ✨",
      successExtra: "👑💖",
      punctual: "¡Llega puntual, la carroza no espera!",
      gallery: "📸 Álbum real",
      msgLabel: (n) => `Mensaje para ${n} (opcional)`,
    },
  },
  superheroes: {
    id: "superheroes",
    name: "Superhéroes",
    emoji: "🦸",
    dark: false,
    font: "'Bangers', cursive",
    fontScale: 1.1,
    colors: { bg: "#EFF6FF", surface: "#FFFFFF", primary: "#EF4444", text: "#1E3A8A", accent: "#EAB308", soft: "#BFDBFE" },
    image: "https://images.unsplash.com/photo-1760954185931-40d5b65fbb86?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    decorations: ["💥", "⚡", "🦸", "🛡️", "💫", "🌟"],
    copy: {
      badge: (n) => `Escuadrón ${n}`,
      title: (n, a) => `¡${n} cumple ${a} y salva el día!`,
      subtitle: (a) => `CUMPLE ${a} AÑITOS 🎂`,
      countdown: "⏳ La misión heroica comienza en",
      details: "💥 Datos de la operación 💥",
      arrive: "🗺️ Cómo llegar al cuartel",
      rsvpTitle: "🦸 Reclutamiento de héroes",
      rsvpSubtitle: "Confirma tu asistencia y únete al escuadrón",
      confirm: "⚡ CONFIRMAR ASISTENCIA",
      successTitle: "💥 ¡HÉROE RECLUTADO! 💥",
      successExtra: "⚡🦸",
      punctual: "¡Llega puntual, la ciudad te necesita!",
      gallery: "📸 Archivo de héroes",
      msgLabel: (n) => `Mensaje para ${n} (opcional)`,
    },
  },
  dinosaurios: {
    id: "dinosaurios",
    name: "Dinosaurios",
    emoji: "🦖",
    dark: false,
    font: "'Bowlby One SC', cursive",
    fontScale: 0.85,
    colors: { bg: "#F0FDF4", surface: "#FFFFFF", primary: "#16A34A", text: "#14532D", accent: "#D97706", soft: "#BBF7D0" },
    image: "https://images.unsplash.com/photo-1743600160621-144e62297185?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    decorations: ["🦖", "🦕", "🌋", "🌿", "🥚", "🐾"],
    copy: {
      badge: (n) => `Dinolandia de ${n}`,
      title: (n, a) => `¡${n} cumple ${a} dino-años!`,
      subtitle: (a) => `CUMPLE ${a} AÑITOS 🎂`,
      countdown: "⏳ La expedición comienza en",
      details: "🦴 Datos de la expedición 🦴",
      arrive: "🗺️ Cómo llegar al valle jurásico",
      rsvpTitle: "🦖 Registro de exploradores",
      rsvpSubtitle: "Confirma tu asistencia para unirte a la expedición",
      confirm: "🦕 CONFIRMAR ASISTENCIA",
      successTitle: "🦖 ¡EXPLORADOR REGISTRADO! 🦖",
      successExtra: "🐾🌋",
      punctual: "¡Llega puntual, los dinos no esperan!",
      gallery: "📸 Huellas y recuerdos",
      msgLabel: (n) => `Mensaje para ${n} (opcional)`,
    },
  },
  espacio: {
    id: "espacio",
    name: "Espacio",
    emoji: "🚀",
    dark: true,
    font: "'Space Grotesk', sans-serif",
    fontScale: 1,
    colors: { bg: "#0F172A", surface: "#1E293B", primary: "#8B5CF6", text: "#FFFFFF", accent: "#38BDF8", soft: "#FBBF24" },
    image: "https://images.unsplash.com/photo-1656464868371-602be27fd4c2?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    decorations: ["🚀", "🪐", "⭐", "👨‍🚀", "🛸", "🌙"],
    copy: {
      badge: (n) => `Misión ${n}`,
      title: (n, a) => `¡${n} despega al año ${a}!`,
      subtitle: (a) => `CUMPLE ${a} AÑITOS 🎂`,
      countdown: "⏳ El despegue es en",
      details: "🛰️ Datos de la misión espacial 🛰️",
      arrive: "🧭 Coordenadas de la base",
      rsvpTitle: "🚀 Registro de astronautas",
      rsvpSubtitle: "Confirma tu asistencia para abordar la nave",
      confirm: "🛸 CONFIRMAR ASISTENCIA",
      successTitle: "⭐ ¡ASTRONAUTA A BORDO! ⭐",
      successExtra: "🚀🪐",
      punctual: "¡Llega puntual, el cohete no espera!",
      gallery: "📸 Bitácora espacial",
      msgLabel: (n) => `Mensaje para ${n} (opcional)`,
    },
  },
  unicornios: {
    id: "unicornios",
    name: "Unicornios",
    emoji: "🦄",
    dark: false,
    font: "'Caveat Brush', cursive",
    fontScale: 1.2,
    colors: { bg: "#FAF5FF", surface: "#FFFFFF", primary: "#D946EF", text: "#4A044E", accent: "#06B6D4", soft: "#F5D0FE" },
    image: "https://images.unsplash.com/photo-1604937455095-ef2fe3d46fcd?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    decorations: ["🦄", "🌈", "☁️", "⭐", "🍭", "💜"],
    copy: {
      badge: (n) => `Mundo mágico de ${n}`,
      title: (n, a) => `¡${n} cumple ${a} añitos mágicos!`,
      subtitle: (a) => `CUMPLE ${a} AÑITOS 🎂`,
      countdown: "⏳ La magia comienza en",
      details: "🌈 Detalles de la fiesta mágica 🌈",
      arrive: "🗺️ Cómo llegar al arcoíris",
      rsvpTitle: "🦄 Registro de invitados mágicos",
      rsvpSubtitle: "Confirma tu asistencia para entrar al mundo mágico",
      confirm: "🌈 CONFIRMAR ASISTENCIA",
      successTitle: "🦄 ¡INVITADO MÁGICO REGISTRADO! 🦄",
      successExtra: "🌈✨",
      punctual: "¡Llega puntual, la magia no espera!",
      gallery: "📸 Recuerdos mágicos",
      msgLabel: (n) => `Mensaje para ${n} (opcional)`,
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

export function formatDateEs(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const s = date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatTimeEs(timeStr) {
  if (!timeStr) return "";
  const [h, min] = timeStr.split(":").map(Number);
  const period = h < 12 ? "de la mañana" : h < 19 ? "de la tarde" : "de la noche";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${period}`;
}

export function calendarUrl(inv) {
  if (!inv.event_date || !inv.event_time) return "#";
  const start = `${inv.event_date.replace(/-/g, "")}T${inv.event_time.replace(":", "")}00`;
  const [h, m] = inv.event_time.split(":").map(Number);
  const endH = Math.min(h + 4, 23);
  const end = `${inv.event_date.replace(/-/g, "")}T${String(endH).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Cumpleaños de ${inv.child_name} 🎂`,
    dates: `${start}/${end}`,
    details: `Cumpleaños número ${inv.age} de ${inv.child_full_name || inv.child_name}`,
    location: `${inv.venue}${inv.address ? ", " + inv.address : ""}`,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function whatsappUrl(inv) {
  if (!inv.whatsapp) return null;
  const num = inv.whatsapp.replace(/\D/g, "");
  const text = encodeURIComponent(
    `¡Hola! Confirmo mi asistencia al cumpleaños de ${inv.child_name} 🎂 el ${formatDateEs(inv.event_date)}. Somos: `
  );
  return `https://wa.me/${num}?text=${text}`;
}
