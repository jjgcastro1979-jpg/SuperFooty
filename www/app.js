'use strict';

const PROXY_URL = 'https://workers.dev';

const ligasFootballData = {
 'esp.1':{nombre:'La Liga',slug:'PD'}, 'eng.1':{nombre:'Premier League',slug:'PL'},
 'ita.1':{nombre:'Serie A',slug:'SA'}, 'ger.1':{nombre:'Bundesliga',slug:'BL1'}, 'fra.1':{nombre:'Ligue 1',slug:'FL1'}
};

const equiposData = {
 'Real Madrid':{atk:2.1,def:.8}, 'Barcelona':{atk:2.0,def:1.0}, 'Atletico':{atk:1.6,def:.7},
 'Man City':{atk:2.2,def:.9}, 'Arsenal':{atk:1.9,def:.8}, 'Liverpool':{atk:1.8,def:1.0},
 'Inter':{atk:2.0,def:.8}, 'Juventus':{atk:1.5,def:.7}, 'Bayern':{atk:2.4,def:.9}, 'PSG':{atk:2.3,def:.9}
};

const calendarioSimulado = {
 'PD': [{ homeTeam: { name: 'Real Madrid' }, awayTeam: { name: 'Barcelona' } }, { homeTeam: { name: 'Atletico' }, awayTeam: { name: 'Sevilla' } }],
 'PL': [{ homeTeam: { name: 'Man City' }, awayTeam: { name: 'Arsenal' } }, { homeTeam: { name: 'Liverpool' }, awayTeam: { name: 'Chelsea' } }],
 'SA': [{ homeTeam: { name: 'Inter' }, awayTeam: { name: 'Juventus' } }], 'BL1': [{ homeTeam: { name: 'Bayern' }, awayTeam: { name: 'Dortmund' } }], 'FL1': [{ homeTeam: { name: 'PSG' }, awayTeam: { name: 'Marseille' } }]
};

let partidosActuales=[];
const escapeHTML = v => String(v??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"' toggle":'&#39;'}[c]));

function obtenerFuerza(n){
 const t = String(n).toLowerCase();
 for(const k in equiposData){ if(t.includes(String(k).toLowerCase())) return equiposData[k]; }
 return {atk:1.2,def:1.2};
}
function factorial(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function poisson(k,l){ return Math.exp(-l)*Math.pow(l,k)/factorial(k); }

async function comprobarConexion() {
 const box = document.getElementById('estado-conexion'); if(!box) return;
 box.className = "info-box"; box.textContent = "Comprobando...";
 try {
  const res = await fetch(`${PROXY_URL}/v4/competitions`, { method: 'GET' });
  if (res.ok) {
   box.className = "info-box"; box.style.background = "#dcfce7"; box.style.borderColor = "#bbf7d0"; box.style.color = "#166534";
   box.textContent = "🟢 Conexión exitosa con Cloudflare Worker.";
  } else { throw new Error(); }
 } catch (e) {
  box.className = "error-box"; box.style.background = "#fee2e2"; box.style.borderColor = "#fca5a5"; box.style.color = "#991b1b";
  box.textContent = "🔴 Error de red: El proxy no responde.";
 }
}

async function cargarPartidos() {
 const lista = document.getElementById('lista-partidos');
 const ligaSelect = document.getElementById('league-select');
 const btn = document.getElementById('btn-cargar');
 if (!lista || !ligaSelect) return;
 
 if (btn) btn.disabled = true;
 lista.innerHTML = '<div class="loader">🔄 Cargando partidos oficiales...</div>';
 const liga = ligasFootballData[ligaSelect.value];

 try {
  const response = await fetch(`${PROXY_URL}/v4/competitions/${liga.slug}/matches`, { method: 'GET', mode: 'cors' });
  const data = await response.json();
  partidosActuales = data.matches || [];
  if (partidosActuales.length === 0) { partidosActuales = calendarioSimulado[liga.slug]; }
 } catch (e) { 
  partidosActuales = calendarioSimulado[liga.slug]; 
 } finally {
  renderizarPartidos(liga.nombre);
  if (btn) btn.disabled = false;
 }
}

function renderizarPartidos(nombreLiga) {
 const lista = document.getElementById('lista-partidos'); if(!lista) return; lista.innerHTML = '';
 partidosActuales.forEach((partido, index) => {
  const card = document.createElement('div'); card.className = 'match-card';
  card.innerHTML = `
   <div class="match-header"><span class="league-badge">${escapeHTML(nombreLiga)}</span><span class="match-time">🕒 20:00</span></div>
   <div class="teams-row"><div class="team-name">${escapeHTML(partido.homeTeam.name)}</div><div class="vs-badge">VS</div><div class="team-name right">${escapeHTML(partido.awayTeam.name)}</div></div>
   <button class="btn" onclick="analizarPartidoConIA(${index}, this)">🧠 ANALIZAR CON IA</button>
   <div id="analisis-container-${index}" style="margin-top: 15px;"></div>
  `;
  lista.appendChild(card);
 });
}

async function analizarPartidoConIA(index, btn) {
 const partido = partidosActuales[index]; const container = document.getElementById(`analisis-container-${index}`);
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
  <div id="panel-${index}-mercados" class="analysis-panel active"><div class="chart-box"><div class="chart-row"><div class="chart-label"><span>Local</span><span>${pctLocal}%</span></div></div><div class="chart-row"><div class="chart-label"><span>Empate</span><span>${pctEmpate}%</span></div></div><div class="chart-row"><div class="chart-label"><span>Visitante</span><span>${pctVisitante}%</span></div></div></div></div>
  <div id="panel-${index}-goles" class="analysis-panel"><div class="chart-box"><div class="chart-row"><div class="chart-label"><span>+2.5 Goles</span><span>${pctOver25}%</span></div></div><div class="chart-row"><div class="chart-label"><span>Ambos Anotan</span><span>${pctAmbosMarcan}%</span></div></div></div></div>
  <div id="panel-${index}-ia" class="analysis-panel"><div class="recommendation"><h3>🧠 ANÁLISIS EXPERTO GEMINI AI</h3><div id="gemini-texto-${index}" class="small-note" style="color:#f8fafc; text-align:left; font-size:12px; line-height:1.4; margin-top:10px;">⏳ Procesando con Gemini...</div></div></div>
 `;
 if(btn) btn.style.display = "none";

 try {
  const prompt = `Analiza brevemente en 2 lineas el partido ${partido.homeTeam.name} vs ${partido.awayTeam.name}. Poisson: Local ${pctLocal}%, Empate ${pctEmpate}%, Visitante ${pctVisitante}%.`;
  const res = await fetch(`${PROXY_URL}/v1/gemini`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  const data = await res.json();
  const boxText = document.getElementById(`gemini-texto-${index}`);
  if (boxText && data.analisis) boxText.textContent = data.analisis;
 } catch (err) {
  const boxText = document.getElementById(`gemini-texto-${index}`);
  if (boxText) boxText.textContent = "Modo offline probabilístico activo.";
 }
}

function cambiarTabAnalis(index, tabId, botonActivo) {
 const cTabs = botonActivo.parentElement; cTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); botonActivo.classList.add('active');
 cTabs.parentElement.querySelectorAll('.analysis-panel').forEach(p => p.classList.remove('active'));
 const pDestino = document.getElementById(`panel-${index}-${tabId}`); if (pDestino) pDestino.classList.add('active');
}

function inicializarApp() {
 window.comprobarConexion = comprobarConexion; window.cargarPartidos = cargarPartidos;
 window.analizarPartidoConIA = analizarPartidoConIA; window.cambiarTabAnalis = cambiarTabAnalis;
 const bConexion = document.getElementById('btn-comprobar-conexion'), bCargar = document.getElementById('btn-cargar');
 if (bConexion) bConexion.onclick = comprobarConexion; if (bCargar) bCargar.onclick = cargarPartidos;
}

document.addEventListener('deviceready', inicializarApp, false);
document.addEventListener('DOMContentLoaded', inicializarApp, false);
                          
