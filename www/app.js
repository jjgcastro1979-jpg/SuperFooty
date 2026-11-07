"use strict";

// CONFIGURACIÓN DIRECTA EN LA APK (SIN PROXIES DE CLOUDFLARE)
const FIVEDOLLAR_KEY = "Sustituye_Esto_Por_Tu_Clave_De_FiveDollar_Aqui";
const GEMINI_KEY = "Sustituye_Esto_Por_Tu_Clave_De_Gemini_Aqui";

let partidosActuales = [];
const $ = (id) => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "'" }[c]));

// 1. COMPROBAR CONEXIÓN DIRECTA NATIVA
async function comprobarConexion() {
  let b = $("estado-conexion"); if (!b) return;
  b.textContent = "Comprobando conexiones directas...";
  
  let f5d = FIVEDOLLAR_KEY.includes("_") ? "❌ Falta clave" : "🟢 Conectada";
  let gem = GEMINI_KEY.includes("_") ? "❌ Falta clave" : "🟢 Conectada";
  
  b.innerHTML = `FiveDollarAPI: ${f5d}<br>Google Gemini IA: ${gem}<br><br>💡 Modifica las dos primeras líneas de tu app.js con tus claves reales.`;
}

function unixDay(s) {
  let [y, m, d] = s.split("-").map(Number);
  return Math.floor(new Date(y, m - 1, d).getTime() / 1000);
}

// 2. CARGAR PARTIDOS DIRECTO DESDE FIVE-DOLLAR
async function cargarPartidos() {
  let list = $("lista-partidos"), btn = $("btn-cargar"), league = $("league-select").value, date = $("date-select").value;
  if (!date || !list) return;
  if (btn) { btn.disabled = true; btn.textContent = "Buscando..."; }
  list.innerHTML = '<div class="loader">🌐 Descargando partidos desde FiveDollar...</div>';
  
  let start = unixDay(date);
  let url = `https://fivedollarfootballapi.com{league}&start_time=${start}&end_time=${start + 86400}&status=scheduled&per_page=100&lang=es`;
  
  try {
    let r = await fetch(url, { headers: { "Authorization": `Bearer ${FIVEDOLLAR_KEY}`, "Accept": "application/json" } });
    let d = await r.json();
    partidosActuales = Array.isArray(d.data) ? d.data : [];
    if (!partidosActuales.length) {
      list.innerHTML = '<div class="info-box">No hay partidos programados para hoy en esta liga.</div>';
      return;
    }
    mostrarPartidos();
  } catch (e) { list.innerHTML = `<div class="error-box">Error de clave o red: Introduce tus tokens en las líneas 4 y 5 de tu app.js.</div>`; }
  finally { if (btn) { btn.disabled = false; btn.textContent = "🔄 GENERAR PARTIDOS"; } }
}

function mostrarPartidos() {
  let list = $("lista-partidos"); if (!list) return;
  list.innerHTML = partidosActuales.map((f, i) => {
    let dt = f.kickoff_utc ? new Date(f.kickoff_utc).toLocaleString("es-ES", {hour: '2-digit', minute:'2-digit'}) : "Hora pend.";
    return `<div class="match-card"><div class="match-header"><span class="league-badge">${esc(f.league?.name || "Fútbol")}</span><span class="match-time">🕒 ${esc(dt)}</span></div><div class="teams-row"><div class="team-name">${esc(f.teams?.home?.name)}</div><div class="vs-badge">VS</div><div class="team-name right">${esc(f.teams?.away?.name)}</div></div><button class="btn" onclick="analizarPartido(${i})">📊 ANALIZAR CON GEMINI</button></div>`;
  }).join("");
}

function poisson(k, l) {
  let f = 1; for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * Math.pow(l, k)) / f;
}

function model() {
  let total = 0, w = 0, dr = 0, l = 0, o25 = 0;
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      let p = poisson(i, 1.4) * poisson(j, 1.15); total += p;
      if (i > j) w += p; else if (i === j) dr += p; else l += p;
      if (i + j >= 3) o25 += p;
    }
  }
  return { home: (w/total)*100, draw: (dr/total)*100, away: (l/total)*100, o25: (o25/total)*100 };
}

const bar = (label, v) => `<div class="chart-row"><div class="chart-label"><span>${esc(label)}</span><span>${v.toFixed(1)}%</span></div><div class="chart-track"><div class="chart-fill" style="width:${v}%;background:#10b981"></div></div></div>`;

// 3. ANÁLISIS DE GEMINI DIRECTO DESDE LA APK
async function analizarPartido(i) {
  let f = partidosActuales[i]; if (!f || !$("lista-partidos")) return;
  $("lista-partidos").innerHTML = '<div class="loader">🧠 Cerebro Gemini analizando variables tácticas...</div>';
  let m = model(), ia = "Modo offline.", err = null;
  
  let prompt = `Analiza el partido ${f.teams?.home?.name} vs ${f.teams?.away?.name}. Datos Poisson: Local ${m.home.toFixed(1)}%, Empate ${m.draw.toFixed(1)}%, Visitante ${m.away.toFixed(1)}%. Danos un pronóstico corto de 2 líneas con mercados recomendados.`;
  let geminiUrl = `https://googleapis.com{GEMINI_KEY}`;

  try {
    let res = await fetch(geminiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    let geminiData = await res.json();
    ia = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Análisis completado.";
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
          <h3>🤖 VEREDICTO EXPERTO GEMINI</h3>
          <p style="text-align:left; font-size:13px; id:gemini-t; line-height:1.4; color:#f8fafc; margin-top:10px;">
            ${esc(ia).replace(/\n/g, '<br>')}
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
