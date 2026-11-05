// SUPERFOOTY PRO - cliente. Las claves nunca se guardan aquí.
"use strict";
const PROXY_URL = "https://royal-dream-9429.jjgcastro1979.workers.dev";
let partidosActuales = [];
const $ = (id) => document.getElementById(id);
function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}
async function api(path, opt = {}) {
  let r = await fetch(PROXY_URL + path, opt),
    t = await r.text(),
    d;
  try {
    d = JSON.parse(t);
  } catch {
    throw Error("Respuesta no válida del Worker");
  }
  if (!r.ok) throw Error(d?.error?.message || d?.error || `HTTP ${r.status}`);
  if (d?.success === 0) throw Error(d.error?.message || "Error API");
  return d;
}
async function comprobarConexion() {
  let b = $("estado-conexion");
  if (!b) return;
  b.textContent = "Comprobando conexiones...";
  try {
    let d = await api("/health");
    b.innerHTML = `Cloudflare: conectado<br>5DollarFootballAPI: ${ d.fiveDollar ? "configurada" : "falta clave" }<br>Football-Data: ${ d.footballData ? "configurada" : "falta clave" }<br>Gemini: ${d.gemini ? "configurada" : "falta clave"}`;
  } catch (e) {
    b.textContent = "Error de conexión: " + e.message;
  }
}
function unixDay(s) {
  let [y, m, d] = s.split("-").map(Number);
  return Math.floor(new Date(y, m - 1, d).getTime() / 1000);
}
async function cargarPartidos() {
  let list = $("lista-partidos"),
    btn = $("btn-cargar"),
    league = $("league-select").value,
    date = $("date-select").value;
  if (!date) {
    list.innerHTML = '<div class="error-box">Selecciona una fecha.</div>';
    return;
  }
  btn.disabled = true;
  btn.textContent = "Consultando API...";
  list.innerHTML = '<div class="loader">🌐 Buscando partidos...</div>';
  try {
    let start = unixDay(date),
      d = await api(
        `/five-dollar/fixtures?league=${league}&start_time=${start}&end_time=${ start + 86400 }&status=scheduled&per_page=100&lang=es`
      );
    partidosActuales = Array.isArray(d.data) ? d.data : [];
    if (!partidosActuales.length) {
      list.innerHTML =
        '<div class="info-box">No hay partidos programados en esa fecha. Prueba otra fecha.</div>';
      return;
    }
    mostrarPartidos();
  } catch (e) {
    list.innerHTML = `<div class="error-box">${esc( e.message )}<br>Comprueba la cobertura de la competición y tu plan API.</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "🔄 GENERAR PARTIDOS";
  }
}
function mostrarPartidos() {
  $("lista-partidos").innerHTML = partidosActuales
    .map((f, i) => {
      let dt = f.kickoff_utc
        ? new Date(f.kickoff_utc).toLocaleString("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "Hora no disponible";
      return `<div class="match-card"><div class="match-header"><span class="league-badge">${esc( f.league?.name || "Competición" )}</span><span class="match-time">${esc( dt )}</span></div><div class="teams-row"><div class="team-name">${esc( f.teams?.home?.name || "Local" )}</div><div class="vs-badge">VS</div><div class="team-name right">${esc( f.teams?.away?.name || "Visitante" )}</div></div><button class="btn" onclick="analizarPartido(${i})">📊 ANALIZAR PARTIDO</button></div>`;
    })
    .join("");
}
function mean(a) {
  let x = a.filter(Number.isFinite);
  return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null;
}
async function teamHistory(id) {
  try {
    let d = await api(
        `/five-dollar/teams/${id}/fixtures?status=finished&per_page=10&lang=es`
      ),
      rows = d.data || [],
      cf = [],
      ca = [],
      yc = [],
      rc = [];
    rows.forEach((f) => {
      let home = String(f.teams?.home?.id) === String(id),
        c = f.corners || {},
        cards = f.cards || {},
        mine = home ? cards.home : cards.away;
      let a = home ? c.home : c.away,
        b = home ? c.away : c.home;
      if (Number.isFinite(a)) cf.push(a);
      if (Number.isFinite(b)) ca.push(b);
      if (Number.isFinite(mine?.yellow)) yc.push(mine.yellow);
      if (Number.isFinite(mine?.red)) rc.push(mine.red);
    });
    return {
      n: rows.length,
      cf: mean(cf),
      ca: mean(ca),
      yellow: mean(yc),
      red: mean(rc),
    };
  } catch (e) {
    return {
      n: 0,
      error: e.message,
      cf: null,
      ca: null,
      yellow: null,
      red: null,
    };
  }
}
function fmt(x, s = "") {
  return x === null || x === undefined ? "Sin datos" : Number(x).toFixed(2) + s;
}
function poisson(k, l) {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * Math.pow(l, k)) / f;
}
function model() {
  let L = 1.35,
    A = 1.15,
    total = 0,
    w = 0,
    dr = 0,
    l = 0,
    o15 = 0,
    o25 = 0,
    b = 0;
  for (let i = 0; i <= 12; i++)
    for (let j = 0; j <= 12; j++) {
      let p = poisson(i, L) * poisson(j, A);
      total += p;
      if (i > j) w += p;
      else if (i === j) dr += p;
      else l += p;
      if (i + j >= 2) o15 += p;
      if (i + j >= 3) o25 += p;
      if (i && j) b += p;
    }
  return {
    home: (w / total) * 100,
    draw: (dr / total) * 100,
    away: (l / total) * 100,
    o15: (o15 / total) * 100,
    o25: (o25 / total) * 100,
    btts: (b / total) * 100,
  };
}
function bar(label, v) {
  let p = Math.max(0, Math.min(100, v)),
    c = p >= 65 ? "#10b981" : p >= 45 ? "#f59e0b" : "#ef4444";
  return `<div class="chart-row"><div class="chart-label"><span>${esc( label )}</span><span>${p.toFixed( 1 )}%</span></div><div class="chart-track"><div class="chart-fill" style="width:${p}%;background:${c}"></div></div></div>`;
}
async function analizarPartido(i) {
  let f = partidosActuales[i];
  if (!f) return;
  let list = $("lista-partidos"),
    home = f.teams?.home || {},
    away = f.teams?.away || {};
  list.innerHTML =
    '<div class="loader">Consultando últimos partidos para córners y tarjetas...</div>';
  try {
    let [h, a] = await Promise.all([
        teamHistory(home.id),
        teamHistory(away.id),
      ]),
      ct = h.cf !== null && a.cf !== null ? h.cf + a.cf : null,
      yt = h.yellow !== null && a.yellow !== null ? h.yellow + a.yellow : null,
      m = model(),
      payload = {
        local: home.name,
        visita: away.name,
        liga: f.league?.name,
        fecha: f.kickoff_utc,
        modelo: m,
        historico: { local: h, visita: a },
      },
      ia = null,
      err = null;
    try {
      let g = await api("/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      ia = g.analysis || null;
    } catch (e) {
      err = e.message;
    }
    mostrarAnalisis({ f, h, a, m, ct, yt, ia, err });
  } catch (e) {
    list.innerHTML = `<div class="error-box">${esc(e.message)}</div>`;
  }
}
function tab(n) {
  document
    .querySelectorAll(".analysis-panel")
    .forEach((x) => x.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((x) => x.classList.remove("active"));
  $("panel-" + n)?.classList.add("active");
  $("tab-" + n)?.classList.add("active");
}
function mostrarAnalisis(x) {
  let { f, h, a, m, ct, yt, ia, err } = x,
    hn = f.teams?.home?.name || "Local",
    an = f.teams?.away?.name || "Visitante",
    date = f.kickoff_utc
      ? new Date(f.kickoff_utc).toLocaleString("es-ES")
      : "Fecha no disponible";
  $(
    "lista-partidos"
  ).innerHTML = `<button class="btn btn-secondary" onclick="mostrarPartidos()">← VOLVER A PARTIDOS</button><div class="match-card"><div class="teams-row"><div class="team-name">${esc( hn )}</div><div class="vs-badge">VS</div><div class="team-name right">${esc( an )}</div></div><p class="match-time">${esc(f.league?.name || "")} · ${esc( date )}</p><div class="tabs"><button id="tab-general" class="tab active" onclick="tab('general')">📊 General</button><button id="tab-corners" class="tab" onclick="tab('corners')">🚩 Córners</button><button id="tab-tarjetas" class="tab" onclick="tab('tarjetas')">🟨 Tarjetas</button><button id="tab-ia" class="tab" onclick="tab('ia')">🧠 Gemini</button></div> <section id="panel-general" class="analysis-panel active"><h3 class="section-title">Mercados de goles y resultado</h3><div class="chart-box">${bar( "Victoria " + hn, m.home )}${bar("Empate", m.draw)}${bar("Victoria " + an, m.away)}${bar( "Más de 1.5 goles", m.o15 )}${bar("Más de 2.5 goles", m.o25)}${bar( "Ambos marcan", m.btts )}</div><div class="info-box">Modelo Poisson de demostración con parámetros base; no está calibrado con las estadísticas actuales de estos equipos.</div></section> <section id="panel-corners" class="analysis-panel"><h3 class="section-title">🚩 Promedios de córners</h3><div class="chart-box"><p class="data-line"><b>${esc( hn )}:</b> ${fmt(h.cf, " a favor")} / ${fmt( h.ca, " en contra" )} por partido</p><p class="data-line"><b>${esc(an)}:</b> ${fmt( a.cf, " a favor" )} / ${fmt( a.ca, " en contra" )} por partido</p><p class="data-line"><b>Total orientativo:</b> ${fmt( ct, " córners" )}</p><p class="small-note">Muestra: ${h.n} y ${ a.n } partidos. Si el feed no contiene el dato, se indica como no disponible.</p></div></section> <section id="panel-tarjetas" class="analysis-panel"><h3 class="section-title">🟨 Promedios de tarjetas</h3><div class="chart-box"><p class="data-line"><b>${esc( hn )}:</b> ${fmt(h.yellow, " amarillas")} / ${fmt( h.red, " rojas" )} por partido</p><p class="data-line"><b>${esc(an)}:</b> ${fmt( a.yellow, " amarillas" )} / ${fmt( a.red, " rojas" )} por partido</p><p class="data-line"><b>Amarillas totales orientativas:</b> ${fmt( yt )}</p></div></section> <section id="panel-ia" class="analysis-panel"><h3 class="section-title">🧠 Gemini IA</h3><div class="info-box">${esc( ia?.resumen || "Gemini no ha devuelto resumen." )}</div><p class="small-note">${ err ? "Aviso: " + esc(err) : "Análisis recibido." }</p><p>${esc(ia?.recomendacion || "Sin recomendación")}</p><p>${esc( ia?.motivo || "" )}</p></section> <div class="info-box"><b>Transparencia:</b> córners y tarjetas son promedios históricos de los últimos partidos devueltos por la API. La cobertura depende de la competición y del plan. No se inventan datos ausentes.</div></div>`;
  tab("general");
}
