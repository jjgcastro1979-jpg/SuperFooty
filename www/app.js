'use strict';

const PROXY_URL = 'https://workers.dev';

const ligasFootballData = {
 'eng.1':{nombre:'Premier League',slug:'PL'},
 'esp.1':{nombre:'La Liga',slug:'PD'},
 'ita.1':{nombre:'Serie A',slug:'SA'},
 'ger.1':{nombre:'Bundesliga',slug:'BL1'},
 'fra.1':{nombre:'Ligue 1',slug:'FL1'}
};

const equiposData = {
 'Real Madrid':{atk:2.1,def:.8}, 'Barcelona':{atk:2,def:1}, 'Atletico':{atk:1.6,def:.7},
 'Man City':{atk:2.2,def:.9}, 'Arsenal':{atk:1.9,def:.8}, 'Liverpool':{atk:1.8,def:1},
 'Chelsea':{atk:1.5,def:1.1}, 'Man United':{atk:1.3,def:1.2}, 'Tottenham':{atk:1.5,def:1.3}
};

let partidosActuales=[];
const escapeHTML = v => String(v??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalizarTexto = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function obtenerFuerza(nombre){
 const n = normalizarTexto(nombre);
 for(const k in equiposData){ if(n.includes(normalizarTexto(k))) return equiposData[k]; }
 return {atk:1.2,def:1.2};
}
function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function poisson(k,l){ return Math.exp(-l)*Math.pow(l,k)/factorial(k); }

// 1. COMPROBAR CONEXIÓN
async function comprobarConexion() {
 const box = document.getElementById('estado-conexion');
 if(!box) return;
 box.className = "info-box"; box.textContent = "Comprobando conexión...";
 try {
  const res = await fetch(`${PROXY_URL}/v4/competitions`, { method: 'GET' });
  if (res.ok) {
   box.className = "info-box"; box.style.background = "#dcfce7"; box.style.borderColor = "#bbf7d0"; box.style.color = "#166534";
   box.textContent = "🟢 Conexión exitosa con Cloudflare Worker.";
  } else { throw new Error(`Estado: ${res.status}`); }
 } catch (err) {
  box.className = "error-box"; box.style.background = "#fee2e2"; box.style.borderColor = "#fca5a5"; box.style.color = "#991b1b";
  box.textContent = `🔴 Fallo de red: ${err.message}`;
 }
}

// 2. CARGAR PARTIDOS (BLINDADO CONTRA ERRORES HTML)
async function cargarPartidos() {
 const lista = document.getElementById('lista-partidos');
 const ligaSelect = document.getElementById('league-select');
 const fechaInput = document.getElementById('date-select');
 const btn = document.getElementById('btn-cargar');
 if (!lista || !ligaSelect || !fechaInput) return;
 if (!fechaInput.value) { lista.innerHTML = '<div class="error-box">Selecciona una fecha válida.</div>'; return; }
 
 if (btn) btn.disabled = true;
 lista.innerHTML = '<div class="loader">🔄 Descargando partidos...</div>';
 const liga = ligasFootballData[ligaSelect.value];
 const url = `${PROXY_URL}/v4/competitions/${liga.slug}/matches?dateFrom=${fechaInput.value}&dateTo=${fechaInput.value}`;

 try {
  const response = await fetch(url, { method: 'GET', mode: 'cors' });
  const textoRespuesta = await response.text();
  
  let data;
  try {
   data = JSON.parse(textoRespuesta);
  } catch (e) {
   // CAPTURA EL ERROR DE PROHIBICIÓN Y MUESTRA LA SOLUCIÓN SIN ROMPER LA APP
   lista.innerHTML = `<div class="error-box">⚠️ <b>Acceso Restringido por la API</b><br><br>Tu token gratuito de Football-Data no incluye los partidos de <b>${escapeHTML(liga.nombre)}</b>.<br><br>💡 <b>Solución:</b> Selecciona la <b>Premier League</b> (Inglaterra) en el desplegable, pon la fecha de mañana **07/11/2026** y pulsa en Generar Partidos. ¡Esa liga es 100% gratuita!</div>`;
   return;
  }

  if (!response.ok) throw new Error(data.message || `Error (${response.status})`);
  partidosActuales = data.matches || [];
  
  if (partidosActuales.length === 0) {
   lista.innerHTML = `<div class="info-box">No hay partidos programados para <b>${escapeHTML(liga.nombre)}</b> en esta fecha (${fechaInput.value}). Intenta cambiando el día al fin de semana.</div>`;
   return;
  }
  renderizarPartidos(liga.nombre);
 } catch (error) { 
  lista.innerHTML = `<div class="error-box">⚠️ Error: ${escapeHTML(error.message)}</div>`; 
 } finally { if (btn) btn.disabled = false; }
}

// 3. RENDERIZADO DE LOS ENCUENTROS
function renderizarPartidos(nombreLiga) {
 const lista = document.getElementById('lista-partidos');
 if(!lista) return; lista.innerHTML = '';
 partidosActuales.forEach((partido, index) => {
  let hora = "Pénd.";
  if (partido.utcDate) hora = new Date(partido.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const card = document.createElement('div');
  card.className = 'match-card';
  card.innerHTML = `
   <div class="match-header"><span class="league-badge">${escapeHTML(nombreLiga)}</span><span class="match-time">🕒 ${hora}</span></div>
   <div class="teams-row"><div class="team-name">${escapeHTML(partido.homeTeam.name)}</div><div class="vs-badge">VS</div><div class="team-name right">${escapeHTML(partido.awayTeam.name)}</div></div>
   <button class="btn" onclick="analizarPartidoConIA(${index}, this)">🧠 ANALIZAR CON IA</button>
   <div id="analisis-container-${index}" style="margin-top: 15px;"></div>
  `;
  lista.appendChild(card);
 });
}

// 4. ANÁLISIS DE POISSON LLAMANDO EN SEGUNDO PLANO A GEMINI
async function analizarPartidoConIA(index, btn) {
 const partido = partidosActuales[index];
 const container = document.getElementById(`analisis-container-${index}`);
 if (!partido || !container) return;
 const fLocal = obtenerFuerza(partido.homeTeam.name), fVisitante = obtenerFuerza(partido.awayTeam.name);
 const expLocal = fLocal.atk * fVisitante.def, expVisitante = fVisitante.atk * fLocal.def;
 let pLocal = 0, pEmpate = 0, pVisitante = 0, pOver25 = 0, pAmbosMarcan = 0;
 for (let l = 0; l <= 5; l++) {
  for (let v = 0; v <= 5; v++) {
   const prob = poisson(l, expLocal) * poisson(v, expVisitante);
   if (l > v) pLocal += prob; else if (l === v) pEmpate += prob; else pVisitante += prob;
   if ((l + v) > 2.5) pOver25 += prob; if (l > 0 && v > 0) pAmbosMarcan += prob;
  }
 }
 const pctLocal = Math.round(pLocal * 100), pctEmpate = Math.round(pEmpate * 100), pctVisitante = Math.round(pVisitante * 100);
 const pctOver25 = Math.round(pOver25 * 100), pctAmbosMarcan = Math.round(pAmbosMarcan * 100);

 container.innerHTML = `
  <div class="tabs">
   <button class="tab active" onclick="cambiarTabAnalis(${index}, 'mercados', this)">📈 Mercados</button>
   <button class="tab" onclick="cambiarTabAnalis(${index}, 'goles', this)">⚽ Goles</button>
   <button class="tab" onclick="cambiarTabAnalis(${index}, 'ia', this)">🧠 IA Gemini</button>
  </div>
  <div id="panel-${index}-mercados" class="analysis-panel active"><div class="chart-box">${renderBarraProgreso("Local", pctLocal, "#1e3a8a")}${renderBarraProgreso("Empate", pctEmpate, "#64748b")}${renderBarraProgreso("Visitante", pctVisitante, "#10b981")}</div></div>
  <div id="panel-${index}-goles" class="analysis-panel"><div class="chart-box">${renderBarraProgreso("Más de 2.5 Goles", pctOver25, "#f59e0b")}${renderBarraProgreso("Ambos Anotan", pctAmbosMarcan, "#ec4899")}</div></div>
  <div id="panel-${index}-ia" class="analysis-panel"><div class="recommendation"><h3>🧠 ANÁLISIS EXPERTO GEMINI AI</h3><div id="gemini-texto-${index}" class="small-note" style="color:#f8fafc; text-align:left; font-size:12px; line-height:1.4; margin-top:10px;">⏳ Procesando veredicto con Gemini...</div></div></div>
 `;
 if(btn) btn.style.display = "none";

 try {
  const prompt = `Analiza: ${partido.homeTeam.name} vs ${partido.awayTeam.name}. Poisson: Local ${pctLocal}%, Empate ${pctEmpate}%, Visitante ${pctVisitante}%. Más de 2.5: ${pctOver25}%. Danos un pronóstico muy corto de 2 líneas con mercados lógicos recomendados.`;
  const res = await fetch(`${PROXY_URL}/v1/gemini`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  const data = await res.json();
  const boxText = document.getElementById(`gemini-texto-${index}`);
  if (boxText && data.analisis) boxText.textContent = data.analisis;
 } catch (err) {
  const boxText = document.getElementById(`gemini-texto-${index}`);
  if (boxText) boxText.textContent = "Modo offline probabilístico activo.";
 }
}

const renderBarraProgreso = (e, v, c) => `<div class="chart-row"><div class="chart-label"><span>${escapeHTML(e)}</span><span>${v}%</span></div><div class="chart-track"><div class="chart-fill" style="width: ${v}%; background: ${c};"></div></div></div>`;

function cambiarTabAnalis(index, tabId, botonActivo) {
 const cTabs = botonActivo.parentElement;
 cTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); botonActivo.classList.add('active');
 cTabs.parentElement.querySelectorAll('.analysis-panel').forEach(p => p.classList.remove('active'));
 const pDestino = document.getElementById(`panel-${index}-${tabId}`); if (pDestino) pDestino.classList.add('active');
}

// 5. VINCULACIÓN ABSOLUTA NATIVA GLOBAL
function inicializarApp() {
 window.comprobarConexion = comprobarConexion; window.cargarPartidos = cargarPartidos;
 window.analizarPartidoConIA = analizarPartidoConIA; window.cambiarTabAnalis = cambiarTabAnalis;
 const bConexion = document.getElementById('btn-comprobar-conexion'), bCargar = document.getElementById('btn-cargar');
 if (bConexion) bConexion.onclick = comprobarConexion;
 if (bCargar) bCargar.onclick = cargarPartidos;
}
document.addEventListener('deviceready', inicializarApp, false);
document.addEventListener('DOMContentLoaded', inicializarApp, false);
  
