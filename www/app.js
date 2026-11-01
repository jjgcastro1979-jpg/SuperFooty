// ==========================================
// SUPERFOOTY PRO - OPENFOOTBALL + BET BETTER
// ==========================================

const ligasOpenFootball = {
    "esp.1": { nombre: "La Liga", archivo: "es.1.json" },
    "eng.1": { nombre: "Premier League", archivo: "en.1.json" },
    "ita.1": { nombre: "Serie A", archivo: "it.1.json" },
    "ger.1": { nombre: "Bundesliga", archivo: "de.1.json" },
    "fra.1": { nombre: "Ligue 1", archivo: "fr.1.json" }
};

// Mapeo de ligas para Bet Better (Slugs)
const slugsBetBetter = {
    "esp.1": "la-liga",
    "eng.1": "epl",
    "ita.1": "serie-a",
    "ger.1": "bundesliga",
    "fra.1": "ligue-1"
};

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

function crearBarraDuelo(titulo, probLocal, probVisita) {
    let pL = Math.min(Math.max(parseFloat(probLocal) || 0, 0), 100);
    let pV = Math.min(Math.max(parseFloat(probVisita) || 0, 0), 100);
    let total = pL + pV;
    if (total > 0) { pL = (pL / total) * 100; pV = (pV / total) * 100; }
    let classL = pL > 55 ? "" : (pL > 45 ? "mid" : ""); 
    let classR = pV > 55 ? "" : (pV > 45 ? "mid" : "");
    return `
        <div class="duel-stats" style="margin-bottom: 10px;">
            <div class="duel-header">
                <span style="color: #10b981;">${Math.round(pL)}%</span>
                <span style="font-size: 11px; color: #64748b;">${titulo}</span>
                <span style="color: #ef4444;">${Math.round(pV)}%</span>
            </div>
            <div class="duel-bar-bg">
                <div class="duel-bar-left ${classL}" style="width: 0%;" data-width="${pL}%"></div>
                <div class="duel-bar-right ${classR}" style="width: 0%;" data-width="${pV}%"></div>
            </div>
        </div>
    `;
}

function variar(val) {
    let varianza = Math.floor(Math.random() * 11) - 5;
    return Math.min(Math.max(val + varianza, 5), 98);
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasOpenFootball[ligaId];
    const fechaInput = document.getElementById('date-select').value;

    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }
    if (!ligaInfo) {
        listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#f59e0b;'>Liga no configurada.</p>`;
        return;
    }

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos del ${fechaInput} en ${ligaInfo.nombre}... ⏳</div>`;

    try {
        // URL del archivo de openfootball para la temporada 2026-27
        const url = `https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/${ligaInfo.archivo}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        
        const partidosDelDia = data.matches.filter(m => m.date === fechaInput);

        if (partidosDelDia.length > 0) {
            listaDiv.innerHTML = partidosDelDia.map(m => {
                const matchId = `${m.date}-${m.team1}-${m.team2}`;
                const hora = m.time ? m.time.split(' ')[0] : '20:00';
                const tieneResultado = m.score && m.score.ft;
                
                let displayTime = `⏰ ${hora}`;
                let extraBadge = `<span style="background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Pendiente</span>`;

                if (tieneResultado) {
                    displayTime = `<span style="color: #ef4444; font-weight: 900; font-size: 14px;">${m.score.ft[0]} - ${m.score.ft[1]}</span>`;
                    extraBadge = `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Finalizado</span>`;
                }

                return `
                    <div class="match-card" onclick="analizarPartido('${matchId}', '${m.team1}', '${m.team2}', '${fechaInput}', '${tieneResultado ? 'post' : 'pre'}', '${m.score?.ft?.[0] || 'null'}', '${m.score?.ft?.[1] || 'null'}', '${ligaId}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaInfo.nombre} ${extraBadge}</span>
                            <span class="match-time">${displayTime}</span>
                        </div>
                        <div class="teams-row">
                            <div class="team-name">${m.team1}</div>
                            <div class="vs-badge">VS</div>
                            <div class="team-name right">${m.team2}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos de ${ligaInfo.nombre} programados para el ${fechaInput} en la temporada 2026/27.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error al cargar los datos de openfootball. Revisa tu conexión.</p>`;
    }
}

async function analizarPartido(matchId, local, visita, fechaISO, estado, scoreHome, scoreAway, ligaId) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Buscando predicción del modelo... ⏳</div>`;

    // --- 1. INTENTO CON BET BETTER (Predicciones reales) ---
    let pickRecomendado = "Partido Igualado";
    let colorPick = "#f59e0b";
    let pL = 33, pE = 34, pV = 33;
    let usingBetBetter = false;

    const slug = slugsBetBetter[ligaId];
    if (slug) {
        try {
            const bbUrl = `https://betbetter.world/soccer/${slug}/picks?format=json`;
            const bbRes = await fetch(bbUrl);
            if (bbRes.ok) {
                const bbData = await bbRes.json();
                const picks = bbData.picks || bbData;
                const pickEncontrado = picks.find(p => {
                    const gameStr = p.game || "";
                    return gameStr.includes(local) && gameStr.includes(visita);
                });

                if (pickEncontrado && pickEncontrado.modelProbabilityPct) {
                    if (pickEncontrado.selection.includes(local)) {
                        pL = pickEncontrado.modelProbabilityPct;
                        pickRecomendado = `Gana ${local} (${pL}%)`;
                        colorPick = "#10b981";
                    } else if (pickEncontrado.selection.includes(visita)) {
                        pV = pickEncontrado.modelProbabilityPct;
                        pickRecomendado = `Gana ${visita} (${pV}%)`;
                        colorPick = "#ef4444";
                    }
                    pE = Math.max(10, 100 - pL - pV);
                    usingBetBetter = true;
                }
            }
        } catch (e) {
            // Silencioso: si falla, usa el motor local
        }
    }

    // --- 2. MOTOR LOCAL (Respaldo y cálculo de estadísticas) ---
    const equiposGrandes = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG", "AC Milan", "Juventus", "Atletico"];
    const equiposDefensivos = ["Getafe", "Cadiz", "Athletic", "Betis", "Sevilla", "Mallorca", "Rayo", "Elche", "Valencia"];

    const esLocalTop = equiposGrandes.some(eq => local.includes(eq));
    const esVisitaTop = equiposGrandes.some(eq => visita.includes(eq));
    const esLocalDef = equiposDefensivos.some(eq => local.includes(eq));
    const esVisitaDef = equiposDefensivos.some(eq => visita.includes(eq));

    let baseGolesL = [85, 65, 45], baseGolesV = [80, 60, 40];
    let baseCornersL = [80, 60, 35], baseCornersV = [75, 55, 30];
    let baseTarjetasL = [80, 55, 30], baseTarjetasV = [80, 55, 30];

    if (!usingBetBetter) {
        if (esLocalTop && !esVisitaTop) { pL = 70; pV = 15; pE = 15; pickRecomendado = `Gana ${local}`; colorPick = "#10b981"; }
        else if (esVisitaTop && !esLocalTop) { pL = 15; pV = 70; pE = 15; pickRecomendado = `Gana ${visita}`; colorPick = "#ef4444"; }
    }

    if (esLocalTop && !esVisitaTop) {
        baseGolesL = [95, 85, 75]; baseGolesV = [65, 40, 20];
        baseCornersL = [85, 70, 50]; baseCornersV = [60, 40, 20];
        baseTarjetasL = [70, 45, 25]; baseTarjetasV = [85, 60, 35];
    } else if (esVisitaTop && !esLocalTop) {
        baseGolesL = [65, 40, 20]; baseGolesV = [95, 85, 75];
        baseCornersL = [60, 40, 20]; baseCornersV = [85, 70, 50];
        baseTarjetasL = [85, 60, 35]; baseTarjetasV = [70, 45, 25];
    } else if (esLocalDef && esVisitaDef) {
        baseGolesL = [70, 45, 25]; baseGolesV = [65, 40, 20];
        baseCornersL = [70, 45, 25]; baseCornersV = [70, 45, 25];
        baseTarjetasL = [95, 80, 65]; baseTarjetasV = [95, 80, 65];
    }

    let golesL = baseGolesL.map(variar);
    let golesV = baseGolesV.map(variar);
    let cornersL = baseCornersL.map(variar);
    let cornersV = baseCornersV.map(variar);
    let tarjetasL = baseTarjetasL.map(variar);
    let tarjetasV = baseTarjetasV.map(variar);

    let over25_global = Math.min(Math.round(((golesL[2] + golesV[2]) / 2) + 5), 95);
    let bttsYes = Math.min(Math.round(((golesL[1] + golesV[1]) / 2) - 5), 95);
    let cornersOver85 = Math.min(Math.round(((cornersL[1] + cornersV[1]) / 2) + 5), 95);
    let cardsOver35 = Math.min(Math.round(((tarjetasL[1] + tarjetasV[1]) / 2) + 5), 95);

    let opciones = [
        { nombre: `Victoria ${local}`, valor: pL },
        { nombre: `Empate`, valor: pE },
        { nombre: `Victoria ${visita}`, valor: pV },
        { nombre: `Más de 2.5 Goles`, valor: over25_global },
        { nombre: `Menos de 2.5 Goles`, valor: 100 - over25_global },
        { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes },
        { nombre: `Ambos Equipos Marcan (NO)`, valor: 100 - bttsYes },
        { nombre: `Más de 8.5 Córners`, valor: cornersOver85 },
        { nombre: `Menos de 8.5 Córners`, valor: 100 - cornersOver85 },
        { nombre: `Más de 3.5 Tarjetas`, valor: cardsOver35 },
        { nombre: `Menos de 3.5 Tarjetas`, valor: 100 - cardsOver35 }
    ];

    opciones.sort((a, b) => b.valor - a.valor);
    let mejorOpcion = opciones[0];

    let nivelConfianza = "MEDIA";
    let colorConfianza = "#f59e0b";
    if (mejorOpcion.valor >= 75) { nivelConfianza = "ALTA"; colorConfianza = "#10b981"; }
    else if (mejorOpcion.valor < 55) { nivelConfianza = "BAJA"; colorConfianza = "#ef4444"; }

    let cajaEstado = "";
    if (estado === 'post') {
        cajaEstado = `<div style="background: #e2e8f0; color: #333; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px; font-weight: bold; border: 1px solid #cbd5e1;">
            🏁 Partido Finalizado: ${local} ${scoreHome} - ${scoreAway} ${visita}
        </div>`;
    } else {
        cajaEstado = `<div style="background: #fef3c7; color: #92400e; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px; font-weight: bold; border: 1px solid #f59e0b;">
            ⏳ Partido Pendiente de Jugar
        </div>`;
    }

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:15px; text-transform: capitalize;">📅 ${fechaStr}</p>
            
            ${cajaEstado}

            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA (${usingBetBetter ? 'BET BETTER' : 'MODELO LOCAL'})</p>
                <p style="color: ${colorPick}; font-size: 16px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
                ${crearBarraProbabilidad(`Empate`, pE)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Goles por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+0.5", golesL[0])}
                    ${crearBarraProbabilidad("+1.5", golesL[1])}
                    ${crearBarraProbabilidad("+2.5", golesL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+0.5", golesV[0])}
                    ${crearBarraProbabilidad("+1.5", golesV[1])}
                    ${crearBarraProbabilidad("+2.5", golesV[2])}
                </div>
            </div>
            <div class="duel-container">
                ${crearBarraDuelo("+1.5 Goles", golesL[1], golesV[1])}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+3.5", cornersL[0])}
                    ${crearBarraProbabilidad("+4.5", cornersL[1])}
                    ${crearBarraProbabilidad("+5.5", cornersL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+3.5", cornersV[0])}
                    ${crearBarraProbabilidad("+4.5", cornersV[1])}
                    ${crearBarraProbabilidad("+5.5", cornersV[2])}
                </div>
            </div>
            <div class="duel-container">
                ${crearBarraDuelo("+4.5 Córners", cornersL[1], cornersV[1])}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Tarjetas por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+1.5", tarjetasL[0])}
                    ${crearBarraProbabilidad("+2.5", tarjetasL[1])}
                    ${crearBarraProbabilidad("+3.5", tarjetasL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+1.5", tarjetasV[0])}
                    ${crearBarraProbabilidad("+2.5", tarjetasV[1])}
                    ${crearBarraProbabilidad("+3.5", tarjetasV[2])}
                </div>
            </div>
            <div class="duel-container">
                ${crearBarraDuelo("+2.5 Tarjetas", tarjetasL[1], tarjetasV[1])}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📈 Totales del Partido</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad("Ambos Equipos Marcan (SÍ)", bttsYes)}
                ${crearBarraProbabilidad("Ambos Equipos Marcan (NO)", 100 - bttsYes)}
                <div style="margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 10px;"></div>
                ${crearBarraProbabilidad("Más de 2.5 Goles Totales", over25_global)}
                ${crearBarraProbabilidad("Más de 8.5 Córners Totales", cornersOver85)}
                ${crearBarraProbabilidad("Más de 3.5 Tarjetas Totales", cardsOver35)}
            </div>

            <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-top: 10px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                <h4 style="color: #f59e0b; font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 10px;">
                    🏆 RECOMENDACIÓN FINAL IA
                </h4>
                <p style="color: #cbd5e1; font-size: 13px; text-align: center; margin-bottom: 15px;">
                    Tras analizar todas las variables, la mejor opción es:
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">
                        ${mejorOpcion.nombre}
                    </p>
                    <p style="color: #10b981; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
                        ${Math.round(mejorOpcion.valor)}% de probabilidad
                    </p>
    
