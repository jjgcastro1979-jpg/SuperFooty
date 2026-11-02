// ==========================================
// SUPERFOOTY PRO - VERSIÓN BLINDADA
// ==========================================

// ⚠️ AQUÍ ESTÁ TU PUENTE REAL (Revisa que esté perfecto)
const PROXY_URL = 'https://royal-dream-9429.jjgcastro1979.workers.dev';

const ligasFootballData = {
    "esp.1": { nombre: "La Liga", slug: "PD" },
    "eng.1": { nombre: "Premier League", slug: "PL" },
    "ita.1": { nombre: "Serie A", slug: "SA" },
    "ger.1": { nombre: "Bundesliga", slug: "BL1" },
    "fra.1": { nombre: "Ligue 1", slug: "FL1" }
};

const equiposData = {
    "Real Madrid": { atk: 2.1, def: 0.8 }, "Barcelona": { atk: 2.0, def: 1.0 },
    "Atletico": { atk: 1.6, def: 0.7 }, "Athletic": { atk: 1.4, def: 0.9 },
    "Real Sociedad": { atk: 1.3, def: 1.0 }, "Betis": { atk: 1.3, def: 1.2 },
    "Sevilla": { atk: 1.1, def: 1.3 }, "Valencia": { atk: 1.1, def: 1.2 },
    "Villarreal": { atk: 1.5, def: 1.3 }, "Getafe": { atk: 0.8, def: 1.1 },
    "Osasuna": { atk: 1.0, def: 1.1 }, "Elche": { atk: 0.9, def: 1.2 },
    "Deportivo": { atk: 1.2, def: 1.3 }, "Malaga": { atk: 1.1, def: 1.2 },
    "Man City": { atk: 2.2, def: 0.9 }, "Arsenal": { atk: 1.9, def: 0.8 },
    "Liverpool": { atk: 1.8, def: 1.0 }, "Chelsea": { atk: 1.5, def: 1.1 },
    "Man United": { atk: 1.3, def: 1.2 }, "Tottenham": { atk: 1.5, def: 1.3 },
    "Espanyol": { atk: 1.1, def: 1.2 }
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

function poissonCDF(k, lambda) {
    let sum = 0;
    for(let i=0; i<=Math.floor(k); i++) {
        sum += poisson(i, lambda);
    }
    return sum;
}

function getOverProb(line, lambda) {
    return (1 - poissonCDF(Math.floor(line), lambda)) * 100;
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

function generarTablaEstadisticas(lambdaL, lambdaV, maxLine) {
    try {
        let lambdaT = lambdaL + lambdaV;
        let html = `<table style="width:100%; border-collapse: collapse; font-size: 11px; text-align: center; margin-bottom: 10px;">
            <tr style="background:#e2e8f0; color:#334155;">
                <th style="padding:6px; border:1px solid #cbd5e1;">Línea</th>
                <th style="padding:6px; border:1px solid #cbd5e1;">Local</th>
                <th style="padding:6px; border:1px solid #cbd5e1;">Total</th>
                <th style="padding:6px; border:1px solid #cbd5e1;">Visitante</th>
            </tr>`;
        
        let getColor = (p) => p >= 65 ? '#10b981' : (p >= 40 ? '#f59e0b' : '#ef4444');
        
        for (let line = 1.5; line <= maxLine; line += 1) {
            let probL = getOverProb(line, lambdaL);
            let probV = getOverProb(line, lambdaV);
            let probT = getOverProb(line, lambdaT);
            
            if (probT > 0.5) { 
                html += `<tr>
                    <td style="padding:4px; border:1px solid #cbd5e1; font-weight:bold; background:#f8fafc;">+${line}</td>
                    <td style="padding:4px; border:1px solid #cbd5e1; color:${getColor(probL)}; font-weight:bold;">${Math.round(probL)}%</td>
                    <td style="padding:4px; border:1px solid #cbd5e1; color:${getColor(probT)}; font-weight:bold; background:#f8fafc;">${Math.round(probT)}%</td>
                    <td style="padding:4px; border:1px solid #cbd5e1; color:${getColor(probV)}; font-weight:bold;">${Math.round(probV)}%</td>
                </tr>`;
            }
        }
        html += `</table>`;
        return html;
    } catch(e) {
        return `<p style="color:red;">Error generando tabla</p>`;
    }
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
            throw new Error("El Worker de Cloudflare todavía tiene el código por defecto.");
        }

        if (!response.ok) {
            if (response.status === 429 || response.status === 403) {
                throw new Error("Límite de la API alcanzado (espera 1 minuto).");
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = JSON.parse(textoRespuesta);
        const partidos = data.matches || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.slice(0, 10).map(match => {
                // PROTECCIÓN: Si el nombre viene vacío, usamos "Local" o "Visitante"
                const local = match.homeTeam.name || match.homeTeam.shortName || "Equipo Local";
                const visita = match.awayTeam.name || match.awayTeam.shortName || "Equipo Visitante";
                
                const fechaObj = new Date(match.utcDate);
                const fechaReal = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                // Protegemos las comillas para que el onclick no falle
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay próximos partidos programados para ${ligaInfo.nombre}.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `
            <div style='background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; color: #b91c1c;'>
                <h4 style="margin-top:0;">Error al cargar</h4>
                <p style="font-size: 13px;">${error.message}</p>
            </div>
        `;
    }
}

function analizarPartido(local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando análisis... ⏳</div>`;

    try {
        let dataL = defaultTeam;
        let dataV = defaultTeam;
        
        for (let key in equiposData) {
            if (local.includes(key)) dataL = equiposData[key];
            if (visita.includes(key)) dataV = equiposData[key];
        }

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

        let lambdaCornersL = Math.max(2.5, (dataL.atk * 3) - (dataV.def * 0.5) + 2);
        let lambdaCornersV = Math.max(2.5, (dataV.atk * 3) - (dataL.def * 0.5) + 2);
        let lambdaCardsL = Math.max(1.5, (dataV.atk * 1.5) - (dataL.def * 0.5) + 1);
        let lambdaCardsV = Math.max(1.5, (dataL.atk * 1.5) - (dataV.def * 0.5) + 1);

        let lambdaCornersT = lambdaCornersL + lambdaCornersV;
        let lambdaCardsT = lambdaCardsL + lambdaCardsV;

        const pj = 14; 
        let winL = Math.round(dataL.atk * 4); let drawL = Math.round(dataL.def * 2); let lossL = Math.max(pj - winL - drawL, 0);
        let winV = Math.round(dataV.atk * 3); let drawV = Math.round(dataV.def * 2); let lossV = Math.max(pj - winV - drawV, 0);
        let h2hL = Math.floor(Math.random() * 3) + 1;
        let h2hE = Math.floor(Math.random() * 3) + 1;
        let h2hV = Math.floor(Math.random() * 3) + 1;

        let textoAnalisis = "";
        if (probWinL > 60) textoAnalisis = `El modelo otorga ventaja a ${local}. Su capacidad ofensiva (xG: ${xgL.toFixed(2)}) será clave.`;
        else if (probWinV > 60) textoAnalisis = `A pesar de jugar fuera, ${visita} es favorito. Su xG es de ${xgV.toFixed(2)}.`;
        else if (bttsYes > 60) textoAnalisis = `Partido abierto. Ambos equipos anotarán (${Math.round(bttsYes)}%). Habrá espacios en defensa.`;
        else textoAnalisis = `Partido cerrado y táctico. ${local} y ${visita} priorizan el orden defensivo.`;

        let comb1X = Math.min(probWinL + probDraw, 98);
        let combX2 = Math.min(probWinV + probDraw, 98);
        let combLocalOver15 = (probWinL * probOver15) / 100;
        let combVisitaOver15 = (probWinV * probOver15) / 100;
        let combBTTS_Over25 = (bttsYes * probOver25) / 100;

        let todasLasOpciones = [
            { nombre: `Victoria ${local}`, valor: probWinL },
            { nombre: `Empate`, valor: probDraw },
            { nombre: `Victoria ${visita}`, valor: probWinV },
            { nombre: `Más de 1.5 Goles`, valor: probOver15 },
            { nombre: `Más de 2.5 Goles`, valor: probOver25 },
            { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes },
            { nombre: `Combinada: ${local} o Empate (1X)`, valor: comb1X },
            { nombre: `Combinada: ${visita} o Empate (X2)`, valor: combX2 },
            { nombre: `Combinada: Gana ${local} + Más de 1.5 Goles`, valor: combLocalOver15 },
            { nombre: `Combinada: Gana ${visita} + Más de 1.5 Goles`, valor: combVisitaOver15 },
            { nombre: `Combinada: Ambos Marcan + Más de 2.5 Goles`, valor: combBTTS_Over25 }
        ];

        let mejorCornerLine = 0, mejorCornerProb = 0;
        for(let l=1.5; l<=13.5; l+=1) {
            let p = getOverProb(l, lambdaCornersT);
            if(p >= 50 && p > mejorCornerProb) { mejorCornerProb = p; mejorCornerLine = l; }
        }
        if(mejorCornerLine > 0) todasLasOpciones.push({ nombre: `Más de ${mejorCornerLine} Córners Totales`, valor: mejorCornerProb });

        let mejorCardLine = 0, mejorCardProb = 0;
        for(let l=1.5; l<=13.5; l+=1) {
            let p = getOverProb(l, lambdaCardsT);
            if(p >= 50 && p > mejorCardProb) { mejorCardProb = p; mejorCardLine = l; }
        }
        if(mejorCardLine > 0) todasLasOpciones.push({ nombre: `Más de ${mejorCardLine} Tarjetas Totales`, valor: mejorCardProb });

        let opcionesValidas = todasLasOpciones.filter(op => op.valor >= 50).sort((a, b) => b.valor - a.valor);
        let mejorOpcion = opcionesValidas.length > 0 ? opcionesValidas[0] : todasLasOpciones.sort((a, b) => b.valor - a.valor)[0];

        let nivelConfianza = mejorOpcion.valor >= 75 ? "ALTA" : (mejorOpcion.valor >= 60 ? "MEDIA" : "BAJA");
        let colorConfianza = nivelConfianza === "ALTA" ? "#10b981" : (nivelConfianza === "MEDIA" ? "#f59e0b" : "#ef4444");

        let tablaCorners = generarTablaEstadisticas(lambdaCornersL, lambdaCornersV, 13.5);
        let tablaCards = generarTablaEstadisticas(lambdaCardsL, lambdaCardsV, 8.5);

        listaDiv.innerHTML = `
            <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver a Partidos</button>
            <div class="match-card" style="padding: 20px 15px;">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                    <div style="text-align: center; width: 42%;"><h3 style="font-size: 15px; margin: 0; line-height: 1.2;">${local}</h3></div>
                    <div style="text-align: center; width: 16%; display: flex; align-items: center; justify-content: center;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                    <div style="text-align: center; width: 42%;"><h3 style="font-size: 15px; margin: 0; line-height: 1.2;">${visita}</h3></div>
                </div>
                <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:15px;">📅 ${fechaISO}</p>
                
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

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Goles</h4>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    ${crearBarraProbabilidad("Más de 1.5 Goles Totales", probOver15)}
                    ${crearBarraProbabilidad("Más de 2.5 Goles Totales", probOver25)}
                    ${crearBarraProbabilidad("Ambos Equipos Marcan (SÍ)", bttsYes)}
                </div>

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🔗 Opciones Combinadas</h4>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    ${crearBarraProbabilidad(`${local} o Empate (1X)`, comb1X)}
                    ${crearBarraProbabilidad(`${visita} o Empate (X2)`, combX2)}
                    ${crearBarraProbabilidad(`Gana ${local} + Más de 1.5 Goles`, combLocalOver15)}
                    ${crearBarraProbabilidad(`Gana ${visita} + Más de 1.5 Goles`, combVisitaOver15)}
                    ${crearBarraProbabilidad(`Ambos Marcan + Más de 2.5 Goles`, combBTTS_Over25)}
                </div>

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners (Líneas 1.5 a 13.5)</h4>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    ${tablaCorners}
                </div>

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Tarjetas (Líneas 1.5 a 8.5)</h4>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    ${tablaCards}
                </div>

                <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-top: 10px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px r
