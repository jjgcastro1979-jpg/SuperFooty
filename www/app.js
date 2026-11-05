'use strict';

// ==========================================
// SUPERFOOTY PRO - MOTOR PRINCIPAL
// ==========================================

const PROXY_URL = 'https://royal-dream-9429.jjgcastro1979.workers.dev';

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
let analisisActual=null;

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

function pct(v){
 return Math.max(0,Math.min(100,v*100));
}

function barra(titulo,valor){
 const p=Math.max(0,Math.min(100,Number(valor)||0));
 const color=p>=65?'#10b981':p>=45?'#f59e0b':'#ef4444';
 return `<div class="chart-row">
 <div class="chart-label"><span>${escapeHTML(titulo)}</span><span>${p.toFixed(1)}%</span></div>
 <div class="chart-track"><div class="chart-fill" style="width:${p}%;background:${color}"></div></div>
 </div>`;
}

// ==========================================
// CONEXION CLOUDFLARE
// ==========================================

async function comprobarConexion(){
 const caja=document.getElementById('estado-conexion');
 caja.textContent='Comprobando Cloudflare y las API...';
 try{
  const r=await fetch(PROXY_URL+'/health');
  const d=await r.json();
  if(!r.ok)throw new Error(d.error||'Error de conexión');
  caja.innerHTML=`<strong>Cloudflare:</strong> conectado<br>
  <strong>Football-Data:</strong> ${d.footballData?'configurada':'sin configurar'}<br>
  <strong>Gemini:</strong> ${d.gemini?'configurada':'sin configurar'}`;
 }catch(e){
  caja.textContent='No se pudo comprobar la conexión: '+e.message;
 }
}

// ==========================================
// PARTIDOS
// ==========================================

async function cargarPartidos(){
 const lista=document.getElementById('lista-partidos');
 const boton=document.getElementById('btn-cargar');
 const ligaId=document.getElementById('league-select').value;
 const fecha=document.getElementById('date-select').value;
 const liga=ligasFootballData[ligaId];

 if(!fecha){lista.innerHTML='<div class="error-box">Selecciona una fecha.</div>';return;}

 boton.disabled=true;
 boton.textContent='Buscando partidos...';
 lista.innerHTML='<div class="loader">🌐 Consultando Football-Data...</div>';

 try{
  const url=`${PROXY_URL}/competitions/${liga.slug}/matches?dateFrom=${encodeURIComponent(fecha)}&dateTo=${encodeURIComponent(fecha)}`;
  const r=await fetch(url);
  const texto=await r.text();
  if(!r.ok)throw new Error(`Football-Data HTTP ${r.status}: ${texto.slice(0,180)}`);
  const d=JSON.parse(texto);
  if(!Array.isArray(d.matches))throw new Error('Respuesta de partidos no válida.');

  partidosActuales=d.matches;
  if(!partidosActuales.length){
   lista.innerHTML='<div class="info-box">No hay partidos para esa fecha y competición.</div>';
   return;
  }
  mostrarPartidos(liga);
 }catch(e){
  lista.innerHTML=`<div class="error-box">${escapeHTML(e.message)}</div>`;
 }finally{
  boton.disabled=false;
  boton.textContent='🔄 GENERAR PARTIDOS';
 }
}

function mostrarPartidos(liga){
 const lista=document.getElementById('lista-partidos');
 lista.innerHTML=partidosActuales.map((m,i)=>{
  const fecha=new Date(m.utcDate);
  return `<div class="match-card">
   <div class="match-header">
    <span class="league-badge">${escapeHTML(liga.nombre)}</span>
    <span class="match-time">${fecha.toLocaleDateString('es-ES')} · ${fecha.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span>
   </div>
   <div class="teams-row">
    <div class="team-name">${escapeHTML(m.homeTeam?.name||'Local')}</div>
    <div class="vs-badge">VS</div>
    <div class="team-name right">${escapeHTML(m.awayTeam?.name||'Visitante')}</div>
   </div>
   <button class="btn" onclick="analizarPartido(${i})">🧠 ANALIZAR CON GEMINI</button>
  </div>`;
 }).join('');
}

// ==========================================
// MODELO POISSON
// ==========================================

function calcularModelo(local,visita){
 const l=obtenerFuerza(local),v=obtenerFuerza(visita);
 const xgL=l.atk*v.def*1.2;
 const xgV=v.atk*l.def;
 const max=12;
 let total=0,localWin=0,draw=0,awayWin=0;
 let over15=0,over25=0,under25=0,btts=0;
 let localGol=0,visitaGol=0,unoX=0,equisDos=0;
 let comb1X15=0,combLocal15=0,combVisita15=0;

 for(let i=0;i<=max;i++){
  for(let j=0;j<=max;j++){
   const p=poisson(i,xgL)*poisson(j,xgV);
   total+=p;
   if(i>j)localWin+=p;
   else if(i===j)draw+=p;
   else awayWin+=p;
   if(i+j>=2)over15+=p;
   if(i+j>=3)over25+=p;
   if(i+j<=2)under25+=p;
   if(i>0&&j>0)btts+=p;
   if(i>0)localGol+=p;
   if(j>0)visitaGol+=p;
   if(i>=j)unoX+=p;
   if(j>=i)equisDos+=p;
   if(i>=j&&i+j>=2)comb1X15+=p;
   if(i>j&&i+j>=2)combLocal15+=p;
   if(j>i&&i+j>=2)combVisita15+=p;
  }
 }
 const n=x=>pct(x/total);
 return {
  xgL,xgV,
  local:n(localWin),empate:n(draw),visita:n(awayWin),
  over15:n(over15),over25:n(over25),under25:n(under25),
  btts:n(btts),localGol:n(localGol),visitaGol:n(visitaGol),
  unoX:n(unoX),equisDos:n(equisDos),
  comb1X15:n(comb1X15),combLocal15:n(combLocal15),combVisita15:n(combVisita15)
 };
}

// ==========================================
// ANALISIS CON GEMINI
// ==========================================

async function analizarPartido(index){
 const match=partidosActuales[index];
 if(!match)return;

 const local=match.homeTeam?.name||'Local';
 const visita=match.awayTeam?.name||'Visitante';
 const liga=match.competition?.name||'Competición';
 const fecha=match.utcDate||'';
 const m=calcularModelo(local,visita);

 const lista=document.getElementById('lista-partidos');
 lista.innerHTML='<div class="loader">🧠 Gemini está estudiando el partido...<br><br>Analizando goles, mercados y recomendaciones.</div>';

 try{
  const r=await fetch(PROXY_URL+'/gemini/analyze',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({
    local,visita,liga,fecha,
    modelo:m,
    datosCorners:null,
    datosTarjetas:null
   })
  });

  const texto=await r.text();
  if(!r.ok)throw new Error(`Gemini HTTP ${r.status}: ${texto.slice(0,250)}`);
  const respuesta=JSON.parse(texto);
  analisisActual={local,visita,liga,fecha,modelo:m,ia:respuesta.analysis};
  mostrarAnalisis(analisisActual);
 }catch(e){
  analisisActual={local,visita,liga,fecha,modelo:m,ia:null,error:e.message};
  mostrarAnalisis(analisisActual);
 }
}

// ==========================================
// PESTAÑAS DEL INFORME
// ==========================================

function cambiarPestana(nombre){
 document.querySelectorAll('.analysis-panel').forEach(p=>p.classList.remove('active'));
 document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
 const panel=document.getElementById('panel-'+nombre);
 const boton=document.getElementById('tab-'+nombre);
 if(panel)panel.classList.add('active');
 if(boton)boton.classList.add('active');
}

function mostrarAnalisis(a){
 const lista=document.getElementById('lista-partidos');
 const m=a.modelo;
 const ia=a.ia||{};
 const fecha=a.fecha?new Date(a.fecha).toLocaleString('es-ES'):'Fecha no disponible';

 const aiText=(v,def='Sin datos suficientes para valorar.')=>
  typeof v==='string'&&v.trim()?escapeHTML(v):def;

 const corners=ia.corners||{};
 const tarjetas=ia.tarjetas||{};
 const goles=ia.goles||{};
 const combinadas=Array.isArray(ia.combinadas)?ia.combinadas:[];
 const recomendacion=ia.recomendacion||{};

 lista.innerHTML=`
 <button class="btn btn-secondary" onclick="cargarPartidos()">← VOLVER A PARTIDOS</button>

 <div class="match-card" style="margin-top:14px">
  <div class="teams-row">
   <div class="team-name">${escapeHTML(a.local)}</div>
   <div class="vs-badge">VS</div>
   <div class="team-name right">${escapeHTML(a.visita)}</div>
  </div>
  <p class="match-time" style="text-align:center">${escapeHTML(a.liga)} · ${escapeHTML(fecha)}</p>

  <div class="chart-box" style="text-align:center;margin-top:15px">
   <p class="small-note">GOLES ESPERADOS DEL MODELO</p>
   <div class="stat-value">${m.xgL.toFixed(2)} - ${m.xgV.toFixed(2)}</div>
   <p class="small-note">Estimación matemática orientativa, no dato oficial.</p>
  </div>

  <div class="tabs">
   <button id="tab-general" class="tab active" onclick="cambiarPestana('general')">📊 General</button>
   <button id="tab-corners" class="tab" onclick="cambiarPestana('corners')">🚩 Córners</button>
   <button id="tab-tarjetas" class="tab" onclick="cambiarPestana('tarjetas')">🟨 Tarjetas</button>
   <button id="tab-combinadas" class="tab" onclick="cambiarPestana('combinadas')">🔗 Combinadas</button>
  </div>

  <section id="panel-general" class="analysis-panel active">
   <h3 class="section-title">⚽ RESULTADO 1X2</h3>
   <div class="chart-box">
    ${barra('Victoria '+a.local,m.local)}
    ${barra('Empate',m.empate)}
    ${barra('Victoria '+a.visita,m.visita)}
   </div>

   <h3 class="section-title">⚽ GOLES Y BTTS</h3>
   <div class="chart-box">
    ${barra('Más de 1.5 goles',m.over15)}
    ${barra('Más de 2.5 goles',m.over25)}
    ${barra('Menos de 2.5 goles',m.under25)}
    ${barra('Ambos equipos marcan - Sí',m.btts)}
    ${barra(a.local+' marca',m.localGol)}
    ${barra(a.visita+' marca',m.visitaGol)}
   </div>

   <h3 class="section-title">🧠 VALORACIÓN DE GEMINI</h3>
   <div class="info-box">${aiText(goles.valoracion||ia.resumen,'Gemini no ha devuelto una valoración.')}</div>
   <p class="small-note">${a.error?'Aviso de conexión con Gemini: '+escapeHTML(a.error):'Análisis recibido de Gemini.'}</p>
  </section>

  <section id="panel-corners" class="analysis-panel">
   <h3 class="section-title">🚩 ANÁLISIS DE CÓRNERS</h3>
   <div class="chart-box">
    <p><strong>${escapeHTML(a.local)}:</strong> ${aiText(corners.local)}</p>
    <p style="margin-top:10px"><strong>${escapeHTML(a.visita)}:</strong> ${aiText(corners.visita)}</p>
    <p style="margin-top:10px"><strong>Total del partido:</strong> ${aiText(corners.total)}</p>
    <p style="margin-top:10px"><strong>Mercado sugerido:</strong> ${aiText(corners.mercado)}</p>
   </div>
   <div class="info-box">No se han proporcionado estadísticas reales de córners. Gemini no debe inventar promedios ni porcentajes.</div>
  </section>

  <section id="panel-tarjetas" class="analysis-panel">
   <h3 class="section-title">🟨 ANÁLISIS DE TARJETAS</h3>
   <div class="chart-box">
    <p><strong>${escapeHTML(a.local)}:</strong> ${aiText(tarjetas.local)}</p>
    <p style="margin-top:10px"><strong>${escapeHTML(a.visita)}:</strong> ${aiText(tarjetas.visita)}</p>
    <p style="margin-top:10px"><strong>Total del partido:</strong> ${aiText(tarjetas.total)}</p>
    <p style="margin-top:10px"><strong>Mercado sugerido:</strong> ${aiText(tarjetas.mercado)}</p>
   </div>
   <div class="info-box">Sin datos históricos de tarjetas no se puede calcular una probabilidad fiable.</div>
  </section>

  <section id="panel-combinadas" class="analysis-panel">
   <h3 class="section-title">🔗 COMBINADAS</h3>
   ${combinadas.length?combinadas.map(c=>`
    <div class="chart-box">
     <strong>${aiText(c.mercado,'Mercado no indicado')}</strong>
     <p style="margin-top:7px">${aiText(c.motivo,'Sin explicación')}</p>
     <p style="margin-top:7px">Probabilidad: ${Number.isFinite(Number(c.probabilidad))?Number(c.probabilidad).toFixed(1)+'%':'No disponible'}</p>
    </div>`).join(''):'<div class="info-box">No hay combinadas justificadas con los datos disponibles.</div>'}
  </section>

  <div class="recommendation">
   <h3>🏆 RECOMENDACIÓN FINAL SUPERFOOTY</h3>
   <p class="small-note" style="color:#cbd5e1">Selección valorada por el modelo y Gemini</p>
   <p class="pick">${aiText(recomendacion.mercado,'SIN APUESTA RECOMENDADA')}</p>
   <p style="font-size:14px;margin:8px 0">Probabilidad: ${Number.isFinite(Number(recomendacion.probabilidad))?Number(recomendacion.probabilidad).toFixed(1)+'%':'No calculada'}</p>
   <p>${aiText(recomendacion.motivo,'No hay datos suficientes para emitir una recomendación.')}</p>
   <p style="margin-top:10px;font-weight:bold;color:#fbbf24">${aiText(recomendacion.confianza,'CONFIANZA NO DETERMINADA')}</p>
  </div>

  <div class="info-box" style="margin-top:15px">
   <strong>Transparencia del análisis</strong><br>
   Los porcentajes Poisson son orientativos y usan fuerzas de equipos de ejemplo, no estadísticas actuales.
   Gemini no puede convertir datos inexistentes en estadísticas reales. No se garantiza ningún resultado.
  </div>
 </div>`;
 cambiarPestana('general');
}

// ==========================================
// FIN SUPERFOOTY PRO
// ==========================================
                       
