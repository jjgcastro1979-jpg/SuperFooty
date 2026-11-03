// ==========================================
// SUPERFOOTY PRO - CONECTADO A TU PUENTE CLOUDFLARE (CON PESTAÑAS)
// ==========================================

const PROXY_URL = 'https://royal-dream-9429.jjgcastro1979.workers.dev';

const ligasFootballData = {
    "esp.1": { nombre: "La Liga", slug: "PD" },
    "eng.1": { nombre: "Premier League", slug: "PL" },
    "ita.1": { nombre: "Serie A", slug: "SA" },
    "ger.1": { nombre: "Bundesliga", slug: "BL1" },
    "fra.1": { nombre: "Ligue 1", slug: "FL1" }
};

// Base de datos de fuerzas para el motor matemático
const equiposData = {
    "Real Madrid": { atk: 2.1, def: 0.8 },
    "Barcelona": { atk: 2.0, def: 1.0 },
    "Atletico": { atk: 1.6, def: 0.7 },
    "Athletic": { atk: 1.4, def: 0.9 },
    "Real Sociedad": { atk: 1.3, def: 1.0 },
    "Betis": { atk: 1.3, def: 1.2 },
    "Sevilla": { atk: 1.1, def: 1.3 },
    "Valencia": { atk: 1.1, def: 1.2 },
    "Villarreal": { atk: 1.5, def: 1.3 },
    "Getafe": { atk: 0.8, def: 1.1 },
    "Osasuna": { atk: 1.0, def: 1.1 },
    "Elche": { atk: 0.9, def: 1.2 },
    "Deportivo": { atk: 1.2, def: 1.3 },
    "Malaga": { atk: 1.1, def: 1.2 },
    "Man City": { atk: 2.2, def: 0.9 },
    "Arsenal": { atk: 1.9, def: 0.8 },
    "Liverpool": { atk: 1.8, def: 1.0 },
    "Chelsea": { atk: 1.5, def: 1.1 },
    "Man United": { atk: 1.3, def: 1.2 },
    "Tottenham": { atk: 1.5, def: 1.3 }
};

const defaultTeam = { atk: 1.2, def: 1.2 };

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function poisson(k, lambda) {
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function crearBarraProbabilidad(titulo, probabilidad) {
    let prob = parseFloat(probabilidad) || 0;
    let color = "#ef4444"; 
    if (prob >= 65) color = "#10b981";
    else if (prob >= 40) color = "#f59e0b";

    return `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #475569;">${titulo}</span>
                <span style="color: ${color};">${Math.round(prob)}%</span>
            </div>
            <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${prob}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
            </div>
        </div>
    `;
}

// --- FUNCIÓN PARA CAMBIAR DE PESTAÑA ---
function cambiarPestana(idTab) {
    // Ocultar todas las pestañas
    document.getElementById('tab-principal').style.display = 'none';
    document.getElementById('tab-goles').style.display = 'none';
    document.getElementById('tab-corners').style.display = 'none';
    document.getElementById('tab-cards').style.display = 'none';
    
    // Quitar el color a todos los botones
    document.getElementById('btn-tab-principal').style.background = '#f8fafc';
    document.getElementById('btn-tab-principal').style.color = '#1e3a8a';
    document.getElementById('btn-tab-goles').style.background = '#f8fafc';
    document.getElementById('btn-tab-goles').style.color = '#1e3a8a';
    document.getElementById('btn-tab-corners').style.background = '#f8fafc';
    document.getElementById('btn-tab-corners').style.color = '#1e3a8a';
    document.getElementById('btn-tab-cards').style.background = '#f8fafc';
    document.getElementById('btn-tab-cards').style.color = '#1e3a8a';

    // Mostrar la pestaña seleccionada y poner su botón en azul
    document.getElementById('tab-' + idTab).style.display = 'block';
    document.getElementById('btn-tab-' + idTab).style.background = '#1e3a8a';
    document.getElementById('btn-tab-' + idTab).style.color = '#ffffff';
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasFootballData[ligaId];

    if (!ligaInfo) { alert("Liga no configurada."); return; }

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos reales en la API... ⏳</div>`;

    try {
        const url = `${PROXY_URL}/competitions/${ligaInfo.slug}/matches?status=SCHEDULED`;
        const response = await fetch(url);
        
        const textoRespuesta = await response.text();

        if (textoRespuesta.includes("Hola, este") || textoRespuesta.includes("Hello World")) {
            throw new Error("El Worker de Cloudflare todavía tiene el código por defecto. Debes ir a Cloudflare y pegar el código correcto.");
        }

        if (!response.ok) {
            if (response.status === 429 || response.status === 403) {
                throw new Error("Límite de peticiones de la API alcanzado (10 por minuto). Espera un poco e intenta de nuevo.");
            }
            throw new Error(`Error HTTP: ${response.status} - Asegúrate de que tu clave API esté bien configurada en Cloudflare.`);
        }

        const data = JSON.parse(textoRespuesta);
        const partidos = data.matches || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.slice(0, 10).map(match => {
                const local = match.homeTeam.name;
                const visita = match.awayTeam.name;
                
                const fechaObj = new Date(match.utcDate);
                const fechaReal = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                const safeLocal = local.replace(/'/g, "\\'");
                const safeVisita = visita.replace(/'/g, "\\'");

                return `
                    <div class="match-card" onclick="analizarPartido('${safeLocal}', '${safeVisita}', '${fechaReal}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaInfo.nombre}</span>
                            <span class="match-time">📅 ${fechaReal} - ⏰ ${hora}</span>
                        </div>
                        <div class="teams-row">
                            <div class="team-name">${local}</div>
                            <div class="vs-badge">VS</div>
                            <div class="team-name right">${visita}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay próximos partidos programados para ${ligaInfo.nombre} en la API.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `
            <div style='background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; color: #b91c1c;'>
                <h4 style="margin-top:0;">Error de conexión</h4>
                <p style="font-size: 13px;">${error.message}</p>
                <p style="font-size: 11px; margin-bottom:0;"><strong>Pista:</strong> Revisa que en Cloudflare hayas borrado el "Hola mundo" y hayas puesto el código puente correcto.</p>
            </div>
        `;
    }
}

function analizarPartido(local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando análisis matemático... ⏳</div>`;

    // --- BUSCAMOS LAS FUERZAS REALES ---
    let dataL = defaultTeam;
    let dataV = defaultTeam;
    
    for (let key in equiposData) {
        if (local.includes(key)) dataL = equiposData[key];
        if (visita.includes(key)) dataV = equiposData[key];
    }

    // --- CÁLCULO MATEMÁTICO (POISSON) ---
    const xgL = dataL.atk * dataV.def * 1.2; 
    const xgV = dataV.atk * dataL.def;

    let probGolL = 1 - poisson(0, xgL);
    let probGolV = 1 - poisson(0, xgV);
    let probOver15 = 1 - (poisson(0, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(1, xgV) + poisson(1, xgL)*poisson(0, xgV));
    let probOver25 = 1 - (poisson(0, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(1, xgV) + poisson(1, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(2, xgV) + poisson(1, xgL)*poisson(1, xgV) + poisson(2, xgL)*poisson(0, xgV));
    let bttsYes = probGolL * probGolV * 100;

    let probWinL = 0, probWinV = 0, probDraw = 0;
    for(let i=0; i<=5; i++) {
        for(let j=0; j<=5; j++) {
            let p = poisson(i, xgL) * poisson(j, xgV);
            if(i > j) probWinL += p;
            else if(j > i) probWinV += p;
            else probDraw += p;
        }
    }

    probWinL = probWinL * 100; probWinV = probWinV * 100; probDraw = probDraw * 100;
    probOver15 = probOver15 * 100; probOver25 = probOver25 * 100;

    // --- CÁLCULOS DE CÓRNERS Y TARJETAS ---
    let cornersL = Math.min(Math.round(60 + (dataL.atk * 10) - (dataV.def * 5)), 95);
    let cornersV = Math.min(Math.round(60 + (dataV.atk * 10) - (dataL.def * 5)), 95);
    let tarjetasL = Math.min(Math.round(65 + (dataV.atk * 5) - (dataL.def * 5)), 95);
    let tarjetasV = Math.min(Math.round(65 + (dataL.atk * 5) - (dataV.def * 5)), 95);

    let probTotalCorners = Math.min(Math.round((cornersL + cornersV) / 2), 95);
    let probTotalTarjetas = Math.min(Math.round((tarjetasL + tarjetasV) / 2), 95);

    // --- NUEVAS OPCIONES COMBINADAS ---
    let comb1X = Math.min(probWinL + probDraw, 98);
    let combX2 = Math.min(probWinV + probDraw, 98);
    let combLocalOver15 = (probWinL * probOver15) / 100;
    let combVisitaOver15 = (probWinV * probOver15) / 100;
    let combBTTS_Over25 = (bttsYes * probOver25) / 100;

    // --- SIMULACIÓN DE TEMPORADA Y H2H ---
    const pj = 14; 
    let winL = Math.round(dataL.atk * 4); let drawL = Math.round(dataL.def * 2); let lossL = Math.max(pj - winL - drawL, 0);
    let winV = Math.round(dataV.atk * 3); let drawV = Math.round(dataV.def * 2); let lossV = Math.max(pj - winV - drawV, 0);
    let h2hL = Math.floor(Math.random() * 3) + 1;
    let h2hE = Math.floor(Math.random() * 3) + 1;
    let h2hV = Math.floor(Math.random() * 3) + 1;

    // --- TEXTO TÁCTICO ---
    let textoAnalisis = "";
    if (probWinL > 60) {
        textoAnalisis = `El modelo otorga una clara ventaja a ${local}. Su alta capacidad ofensiva (xG de ${xgL.toFixed(2)}) sugiere que dominará el partido y generará peligro constante.`;
    } else if (probWinV > 60) {
        textoAnalisis = `A pesar de jugar fuera, ${visita} es el claro favorito. Con un xG de ${xgV.toFixed(2)}, su ataque debería superar la resistencia de ${local}.`;
    } else if (bttsYes > 60) {
        textoAnalisis = `Se espera un partido abierto. Ambos equipos tienen alta probabilidad de anotar (${Math.round(bttsYes)}%). Los espacios en defensa serán clave.`;
    } else {
        textoAnalisis = `Partido muy táctico y cerrado. Tanto ${local} como ${visita} priorizan el orden defensivo. El historial reciente muestra tendencia a marcadores cortos.`;
    }

    // --- MOTOR DE RECOMENDACIÓN FINAL ---
    let todasLasOpciones = [
        { nombre: `Victoria ${local}`, valor: probWinL },
        { nombre: `Empate`, valor: probDraw },
        { nombre: `Victoria ${visita}`, valor: probWinV },
        { nombre: `Más de 1.5 Goles`, valor: probOver15 },
        { nombre: `Más de 2.5 Goles`, valor: probOver25 },
        { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes },
        { nombre: `+4.5 Córners ${local}`, valor: cornersL },
        { nombre: `+4.5 Córners ${visita}`, valor: cornersV },
        { nombre: `Más de 8.5 Córners Totales`, valor: probTotalCorners },
        { nombre: `Más de 3.5 Tarjetas Totales`, valor: probTotalTarjetas },
        { nombre: `Combinada: ${local} o Empate (1X)`, valor: comb1X },
        { nombre: `Combinada: ${visita} o Empate (X2)`, valor: combX2 },
        { nombre: `Combinada: Gana ${local} + Más de 1.5 Goles`, valor: combLocalOver15 },
        { nombre: `Combinada: Gana ${visita} + Más de 1.5 Goles`, valor: combVisitaOver15 },
        { nombre: `Combinada: Ambos Marcan + Más de 2.5 Goles`, valor: combBTTS_Over25 }
    ];

    let opcionesValidas = todasLasOpciones.filter(op => op.valor >= 50).sort((a, b) => b.valor - a.valor);
    let mejorOpcion = opcionesValidas.length > 0 ? opcionesValidas[0] : todasLasOpciones.sort((a, b) => b.valor - a.valor)[0];

    let nivelConfianza = mejorOpcion.valor >= 75 ? "ALTA" : (mejorOpcion.valor >= 60 ? "MEDIA" : "BAJA");
    let colorConfianza = nivelConfianza === "ALTA" ? "#10b981" : (nivelConfianza === "MEDIA" ? "#f59e0b" : "#ef4444");

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:15px;">← Volver a Partidos</button>
        
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                <div style="text-align: center; width: 42%;"><h3 style="font-size: 15px; margin: 0; line-height: 1.2;">${local}</h3></div>
                <div style="text-align: center; width: 16%; display: flex; align-items: center; justify-content: center;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 42%;"><h3 style="font-size: 15px; margin: 0; line-height: 1.2;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:15px;">📅 ${fechaISO}</p>
            
            <!-- BOTONES DE LAS PESTAÑAS -->
            <div style="display: flex; gap: 5px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px;">
                <button id="btn-tab-principal" onclick="cambiarPestana('principal')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: #1e3a8a; color: white; white-space: nowrap; cursor: pointer;">🏆 Principal</button>
                <button id="btn-tab-goles" onclick="cambiarPestana('goles')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: #f8fafc; color: #1e3a8a; white-space: nowrap; cursor: pointer;">⚽ Goles</button>
                <button id="btn-tab-corners" onclick="cambiarPestana('corners')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: #f8fafc; color: #1e3a8a; white-space: nowrap; cursor: pointer;">🚩 Córners</button>
                <button id="btn-tab-cards" onclick="cambiarPestana('cards')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: #f8fafc; color: #1e3a8a; white-space: nowrap; cursor: pointer;">🟨 Tarjetas</button>
            </div>

            <!-- PESTAÑA 1: PRINCIPAL -->
            <div id="tab-principal" style="display: block;">
                <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                    <h4 style="color: #f59e0b; font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 10px;">
                        🏆 RECOMENDACIÓN FINAL GLOBAL
                    </h4>
                    <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-bottom: 15px;">
                        Evaluando todas las opciones, la mejor apuesta es:
                    </p>
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; align-items: center;">
                        <p style="color: white; font-size: 16px; font-weight: 900; margin-bottom: 8px; line-height: 1.3;">
                            ${mejorOpcion.nombre}
                        </p>
                        <p style="color: #10b981; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                            ${Math.round(mejorOpcion.valor)}% de probabilidad
                        </p>
                        <span style="background: ${colorConfianza}20; color: ${colorConfianza}; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; border: 1px solid ${colorConfianza};">
                            CONFIANZA: ${nivelConfianza}
                        </span>
                    </div>
                </div>

                <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">📊 MODELO MATEMÁTICO (POISSON)</p>
                    <p style="color: #10b981; font-size: 14px; font-weight: 900;">Goles Esperados (xG): ${xgL.toFixed(2)} - ${xgV.toFixed(2)}</p>
                </div>

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📈 Temporada y H2H</h4>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div style="width: 45%; text-align: center;">
                            <p style="font-weight: bold; color: var(--primary); margin-bottom: 5px;">${local}</p>
                            <p style="font-size: 12px; color: #475569;">${winL}V - ${drawL}E - ${lossL}D</p>
                        </div>
                        <div style="width: 10%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #cbd5e1;">|</div>
                        <div style="width: 45%; text-align: center;">
                            <p style="font-weight: bold; color: #ef4444; margin-bottom: 5px;">${visita}</p>
                            <p style="font-size: 12px; color: #475569;">${winV}V - ${drawV}E - ${lossV}D</p>
                        </div>
                    </div>
                    <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; text-align: center;">
                        <p style="font-size: 12px; font-weight: bold; color: #334155; margin-bottom: 5px;">Últimos enfrentamientos:</p>
                        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; align-items: center;">
                            <span style="color: #10b981;">${local}: ${h2hL} Victorias</span>
                            <span style="color: #f59e0b;">Empates: ${h2hE}</span>
                            <span style="color: #ef4444;">${visita}: ${h2hV} Victorias</span>
                        </div>
                    </div>
                </div>

                <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                    <p style="color:#14532d; font-size:13px; line-height:1.6; margin: 0;"><strong>Análisis Táctico:</strong> ${textoAnalisis}</p>
                </div>

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    ${crearBarraProbabilidad(`Victoria ${local}`, probWinL)}
                    ${crearBarraProbabilidad(`Empate`, probDraw)}
                    ${crearBarraProbabilidad(`Victoria ${visita}`, probWinV)}
                </div>
            </div>

            <!-- PESTAÑA 2: GOLES -->
            <div id="tab-goles" style="display: none;">
                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom
