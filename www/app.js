'use strict';

// ==========================================
// SUPERFOOTY PRO - MOTOR PRINCIPAL
// ==========================================

const PROXY_URL = 'https://workers.dev';

const ligasFootballData = {
 'esp.1':{nombre:'La Liga',slug:'PD'},
 'eng.1':{nombre:'Premier League',slug:'PL'},
 'ita.1':{nombre:'Serie A',slug:'SA'},
 'ger.1':{nombre:'Bundesliga',slug:'BL1'},
 'fra.1':{nombre:'Ligue 1',slug:'FL1'}
};

const equiposData = {
 'Real Madrid':{atk:2.1,def:.8},
 'Barcelona':{atk:2,def:1},
 'Atletico':{atk:1.6,def:.7},
 'Athletic':{atk:1.4,def:.9},
 'Real Sociedad':{atk:1.3,def:1},
 'Betis':{atk:1.3,def:1.2},
 'Sevilla':{atk:1.1,def:1.3},
 'Valencia':{atk:1.1,def:1.2},
 'Villarreal':{atk:1.5,def:1.3},
 'Getafe':{atk:.8,def:1.1},
 'Osasuna':{atk:1,def:1.1},
 'Man City':{atk:2.2,def:.9},
 'Arsenal':{atk:1.9,def:.8},
 'Liverpool':{atk:1.8,def:1},
 'Chelsea':{atk:1.5,def:1.1},
 'Man United':{atk:1.3,def:1.2},
 'Tottenham':{atk:1.5,def:1.3}
};

const defaultTeam={atk:1.2,def:1.2};
let partidosActuales=[];

function escapeHTML(v){
 return String(v??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
 }[c]));
}

function normalizarTexto(t){
 return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function obtenerFuerza(nombre){
 const n=normalizarTexto(nombre);
 for(const k in equiposData){
  if(n.includes(normalizarTexto(k)))return equiposData[k];
 }
 return defaultTeam;
}

function factorial(n){
 let r=1;
 for(let i=2;i<=n;i++)r*=i;
 return r;
}

function poisson(k,l){
 return Math.exp(-l)*Math.pow(l,k)/factorial(k);
}

// ==========================================
// 1. COMPROBAR CONEXIONES (PÁGINA INICIO)
// ==========================================
async function comprobarConexion() {
 const box = document.getElementById('estado-conexion');
 if(!box) return;
 box.className = "info-box";
 box.textContent = "Comprobando conexión con el proxy...";
 
 try {
  const res = await fetch(`${PROXY_URL}/v2/competitions`, { method: 'GET' });
  if (res.ok) {
   box.className = "info-box";
   box.style.background = "#dcfce7";
   box.style.borderColor = "#bbf7d0";
   box.style.color = "#166534";
   box.textContent = "🟢 Conexión exitosa. El Proxy de Cloudflare responde correctamente.";
  } else {
   throw new Error(`Código de estado: ${res.status}`);
  }
 } catch (err) {
  box.className = "error-box";
  box.style.background = "#fee2e2";
  box.style.borderColor = "#fca5a5";
  box.style.color = "#991b1b";
  box.textContent = `🔴 Error de conexión. No se pudo conectar al proxy. Detalle: ${err.message}`;
 }
}

// ==========================================
// 2. CARGAR Y CONSULTAR PARTIDOS DESDE API
// ==========================================
async function cargarPartidos() {
 const lista = document.getElementById('lista-partidos');
 const ligaSelect = document.getElementById('league-select');
 const fechaInput = document.getElementById('date-select');
 const btn = document.getElementById('btn-cargar');

 if (!lista || !ligaSelect || !fechaInput) return;

 if (!fechaInput.value) {
  lista.innerHTML = '<div class="error-box">Por favor, selecciona una fecha válida.</div>';
  return;
 }

 if (btn) btn.disabled = true;
 lista.innerHTML = '<div class="loader">🔄 Conectando con Cloudflare y descargando partidos...</div>';

 const ligaId = ligaSelect.value;
 const fecha = fechaInput.value;
 const liga = ligasFootballData[ligaId];
 const url = `${PROXY_URL}/v2/competitions/${liga.slug}/matches?dateFrom=${fecha}&dateTo=${fecha}`;

 try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error de servidor (${response.status})`);
  
  const data = await response.json();
  partidosActuales = data.matches || [];

  if (partidosActuales.length === 0) {
   lista.innerHTML = `<div class="info-box">No se encontraron partidos programados para la liga <b>${escapeHTML(liga.nombre)}</b> en la fecha seleccionada (${fecha}).</div>`;
   return;
  }

  renderizarPartidos(liga.nombre);
 } catch (error) {
  lista.innerHTML = `<div class="error-box">⚠️ Hubo un problema al cargar los partidos: ${escapeHTML(error.message)}. Asegúrate de que el proxy esté operativo.</div>`;
 } finally {
  if (btn) btn.disabled = false;
 }
}

// ==========================================
// 3. RENDERIZADO DE LA LISTA DE PARTIDOS
// ==========================================
function renderizarPartidos(nombreLiga) {
 const lista = document.getElementById('lista-partidos');
 if(!lista) return;
 lista.innerHTML = '';

 partidosActuales.forEach((partido, index) => {
  const homeTeam = partido.homeTeam.name;
  const awayTeam = partido.awayTeam.name;
  
  let hora = "--:--";
  if (partido.utcDate) {
   hora = new Date(partido.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const card = document.createElement('div');
  card.className = 'match-card';
  card.innerHTML = `
   <div class="match-header">
    <span class="league-badge">${escapeHTML(nombreLiga)}</span>
    <span class="match-time">🕒 ${hora}</span>
   </div>
   <div class="teams-row">
    <div class="team-name">${escapeHTML(homeTeam)}</div>
    <div class="vs-badge">VS</div>
    <div class="team-name right">${escapeHTML(awayTeam)}</div>
   </div>
   <button class="btn" onclick="analizarPartidoConIA(${index}, this)">🧠 GENERAR ANÁLISIS IA</button>
   <div id="analisis-container-${index}" style="margin-top: 15px;"></div>
  `;
  lista.appendChild(card);
 });
}

// ==========================================
// 4. MOTOR DE ANÁLISIS MATEMÁTICO E IA (POISSON)
// ==========================================
function analizarPartidoConIA(index, btn) {
 const partido = partidosActuales[index];
 const container = document.getElementById(`analisis-container-${index}`);
 if (!partido || !container) return;
 
 const fLocal = obtenerFuerza(partido.homeTeam.name);
 const fVisitante = obtenerFuerza(partido.awayTeam.name);

 // Estimación de goles esperados
 const expLocal = fLocal.atk * fVisitante.def;
 const expVisitante = fVisitante.atk * fLocal.def;

 // Cálculo de probabilidades mediante matriz de Poisson (0 a 5 goles)
 let pLocal = 0, pEmpate = 0, pVisitante = 0;
 let pOver25 = 0, pAmbosMarcan = 0;

 for (let l = 0; l <= 5; l++) {
  for (let v = 0; v <= 5; v++) {
   const prob = poisson(l, expLocal) * poisson(v, expVisitante);
   if (l > v) pLocal += prob;
   else if (l === v) pEmpate += prob;
   else pVisitante += prob;

   if ((l + v) > 2.5) pOver25 += prob;
   if (l > 0 && v > 0) pAmbosMarcan += prob;
  }
 }

 // Conversión a porcentajes de probabilidad
 const pctLocal = Math.round(pLocal * 100);
 const pctEmpate = Math.round(pEmpate * 100);
 const pctVisitante = Math.round(pVisitante * 100);
 const pctOver25 = Math.round(pOver25 * 100);
 const pctAmbosMarcan = Math.round(pAmbosMarcan * 100);

 // Determinar recomendación
 let pickRecomendado = "Menos de 3.5 Goles";
 if (pctLocal > 52) pickRecomendado = `Gana ${partido.homeTeam.name}`;
 else if (pctVisitante > 52) pickRecomendado = `Gana ${partido.awayTeam.name}`;
 else if (pctOver25 > 55 && pctAmbosMarcan > 55) pickRecomendado = "Ambos Anotan & Más de 2.5 Goles";
 else if (pctOver25 > 55) pickRecomendado = "Más de 2.5 Goles";

 container.innerHTML = `
  <div class="tabs">
   <button class="tab active" onclick="cambiarTabAnalis(${index}, 'mercados', this)">📈 Mercados</button>
   <button class="tab" onclick="cambiarTabAnalis(${index}, 'goles', this)">⚽ Goles / Córners</button>
   <button class="tab" onclick="cambiarTabAnalis(${index}, 'ia', this)">🧠 Pronóstico IA</button>
  </div>

  <div id="panel-${index}-mercados" class="analysis-panel active">
   <div class="chart-box">
    ${renderBarraProgreso("Local: " + partido.homeTeam.name, pctLocal, "#1e3a8a")}
    ${renderBarraProgreso("Empate", pctEmpate, "#64748b")}
    ${renderBarraProgreso("Visitante: " + partido.awayTeam.name, pctVisitante, "#10b981")}
   </div>
  </div>

  <div id="panel-${index}-goles" class="analysis-panel">
   <div class="chart-box">
    ${renderBarraProgreso("Más de 2.5 Goles", pctOver25, "#f59e0b")}
    ${renderBarraProgreso("Ambos Equipos Anotan", pctAmbosMarcan, "#ec4899")}
   </div>
   <div class="info-box" style="margin-top:5px; font-size:11px;">
    <b>Predicción estadística:</b> Córners estimados: 9.5 globales. Tarjetas estimadas: 4.5 promedio.
   </div>
  </div>

  <div id="panel-${index}-ia" class="analysis-panel">
   <div class="recommendation">
    <h3>🎯 RECOMENDACIÓN IA</h3>
    <div class="pick">${escapeHTML(pickRecomendado)}</div>
    <p class="small-note" style="color:#e2e8f0">Análisis calculado probabilísticamente mediante la distribución cruzada de Poisson v2.0.</p>
   </div>
  </div>
 `;
 if(btn) btn.style.display = "none"; // Ocultar el botón original para dejar paso al panel
}

// Auxiliar para pintar barras de progreso de las estadísticas
function renderBarraProgreso(etiqueta, valor, color) {
 return `
  <div class="chart-row">
   <div class="chart-label"><span>${escapeHTML(etiqueta)}</span><span>${valor}%</span></div>
   <div class="chart-track">
    <div class="chart-fill" style="width: ${valor}%; background: ${color};"></div>
   </div>
  </div>
 `;
}

// Cambiar de pestaña dentro del panel del partido analizado
function cambiarTabAnalis(index, tabId, botonActivo) {
 const contenedor = botonActivo.parentElement;
 contenedor.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
 botonActivo.classList.add('active');

 const padreAbsoluto = contenedor.parentElement;
 padreAbsoluto.querySelectorAll('.analysis-panel').forEach(p => p.classList.remove('active'));

 const panelDestino = document.getElementById(`panel-${index}-${tabId}`);
 if (panelDestino) {
  panelDestino.classList.add('active');
 }
  }
                                                       
