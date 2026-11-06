"use strict";
const PROXY_URL = "https://workers.dev";
let partidosActuales = [];
const $ = (id) => document.getElementById(id);

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" }[c]));
}

async function api(path, opt = {}) {
  let r = await fetch(PROXY_URL + path, opt), t = await r.text(), d;
  try { d = JSON.parse(t); } catch { throw Error("Respuesta no válida del Worker"); }
  if (!r.ok) throw Error(d?.error?.message || d?.error || `HTTP ${r.status}`);
  return d;
}

// CORREGIDO: Enlaza directamente con "estado-conexion" del HTML
async function comprobarConexion() {
  let b = $("estado-conexion");
  if (!b) return;
  b.textContent = "Comprobando conexiones...";
  try {
    let d = await api("/health");
    b.innerHTML = `Cloudflare: conectado<br>5DollarAPI: ${d.fiveDollar ? "configurada" : "falta clave"}<br>Gemini: ${d.gemini ? "configurada" : "falta clave"}`;
  } catch (e) { b.textContent = "Error: " + e.message; }
}

function unixDay(s) {
  let [y, m, d] = s.split("-").map(Number);
  return Math.floor(new Date(y, m - 1, d).getTime() / 1000);
}

async function cargarPartidos() {
  let list = $("lista-partidos"), btn = $("btn-cargar"), league = $("league-select").value, date = $("date-select").value;
  if (!date || !list) return;
  if (btn) { btn.disabled = true; btn.textContent = "Buscando..."; }
  list.innerHTML = '<div class="loader">🌐 Buscando partidos...</div>';
  try {
    let start = unixDay(date), d = await api(`/five-dollar/fixtures?league=${league}&start_time=${start}&end_time=${start + 86400}&status=scheduled&per_page=100&lang=es`);
    partidosActuales = Array.isArray(d.data) ? d.data : [];
    if (!partidosActuales.length) {
      list.innerHTML = '<div class="info-box">No hay partidos en esta fecha.</div>';
      return;
    }
    mostrarPartidos();
  } catch (e) { list.innerHTML = `<div class="error-box">${esc(e.message)}</div>`; }
  finally { if (btn) { btn.disabled = false; btn.textContent = "🔄 GENERAR PARTIDOS"; } }
}

function mostrarPartidos() {
  let list = $("lista-partidos"); if (!list) return;
  list.innerHTML = partidosActuales.map((f, i) => {
    let dt = f.kickoff_utc ? new Date(f.kickoff_utc).toLocaleString("es-ES") : "Hora pendiente";
    return `<div class="match-card"><div class="match-header"><span class="league-badge">${esc(f.league?.name)}</span><span class="match-time">${esc(dt)}</span></div><div class="teams-row"><div class="team-name">${esc(f.teams?.home?.name)}</div><div class="vs-badge">VS</div><div class="team-name right">${esc(f.teams?.away?.name)}</div></div><button class="btn" onclick="analizarPartido(${i})">📊 ANALIZAR PARTIDO</button></div>`;
  }).join("");
}

function poisson(k, l) {
  let f = 1; for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * Math.pow(l, k)) / f;
}

function model() {
  let total = 0, w = 0, dr = 0, l = 0, o25 = 0;
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= 6; j++) {
      let p = poisson(i, 1.35) * poisson(j, 1.15); total += p;
      if (i > j) w += p; else if (i === j) dr += p; else l += p;
      if (i + j >= 3) o25 += p;
    }
  }
  return { home: (w/total)*100, draw: (dr/total)*100, away: (l/total)*100, o25: (o25/total)*100 };
}

const bar = (label, v) => `<div class="chart-row"><div class="chart-label"><span>${esc(label)}</span><span>${v.toFixed(1)}%</span></div><div class="chart-track"><div class="chart-fill" style="width:${v}%;background:#10b981"></div></div></div>`;

async function analizarPartido(i) {
  let f = partidosActuales[i]; if (!f || !$("lista-partidos")) return;
  $("lista-partidos").innerHTML = '<div class="loader">Consultando a Gemini IA...</div>';
  let m = model(), ia = null, err = null;
  try {
    let g = await api("/gemini/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ local: f.teams?.home?.name, visita: f.teams?.away?.name, modelo: m })
    });
    ia = g.analysis || g.analisis || null;
  } catch (e) { err = e.message; }

  $("lista-partidos").innerHTML = `
    <button class="btn btn-secondary" onclick="mostrarPartidos()">← VOLVER</button>
    <div class="match-card">
      <div class="tabs">
        <button id="tab-general" class="tab active" onclick="tab('general')">📊 General</button>
        <button id="tab-ia" class="tab" onclick="tab('ia')">🧠 Gemini</button>
      </div>
      <div id="panel-general" class="analysis-panel active">
        <div class="chart-box">
          ${bar("Gana Local", m.home)} ${bar("Empate", m.draw)} ${bar("Gana Visitante", m.away)} ${bar("Más de 2.5 Goles", m.o25)}
        </div>
      </div>
      <div id="panel-ia" class="analysis-panel">
        <div class="recommendation">
          <h3>🤖 VEREDICTO GEMINI IA</h3>
          <p style="text-align:left; font-size:13px; line-height:1.4; color:#f8fafc; margin-top:10px;">
            ${ia ? esc(ia).replace(/\n/g, '<br>') : (err ? `Error IA: ${esc(err)}` : 'Modo offline.')}
          </p>
        </div>
      </div>
    </div>`;
}

function tab(n) {
  document.querySelectorAll(".analysis-panel").forEach((x) => x.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
  $("panel-" + n)?.classList.add("active"); $("tab-" + n)?.classList.add("active");
}

function inicializarApp() {
  window.comprobarConexion = comprobarConexion; window.cargarPartidos = cargarPartidos;
  window.analizarPartido = analizarPartido; window.mostrarPartidos = mostrarPartidos; window.tab = tab;
  const b1 = $("btn-comprobar-conexion"), b2 = $("btn-cargar");
  if (b1) b1.onclick = comprobarConexion; if (b2) b2.onclick = cargarPartidos;
}
document.addEventListener('deviceready', inicializarApp, false);
document.addEventListener('DOMContentLoaded', inicializarApp, false);
