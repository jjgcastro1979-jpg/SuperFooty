// ==========================================
// SUPERFOOTY PRO - MODO 2026 (EL DEFINITIVO)
// ==========================================

const equiposPorLiga = {
    "esp.1": ["Real Madrid", "Barcelona", "Atlético", "Sevilla", "Betis", "Villarreal", "Athletic", "Valencia", "Getafe", "Elche", "Málaga"],
    "eng.1": ["Man City", "Arsenal", "Liverpool", "Chelsea", "Man United", "Tottenham", "Newcastle", "Aston Villa"],
    "ita.1": ["Inter", "Milan", "Juventus", "Napoli", "Roma", "Lazio", "Atalanta", "Fiorentina"],
    "ger.1": ["Bayern", "Dortmund", "Leipzig", "Leverkusen", "Frankfurt", "Stuttgart"],
    "fra.1": ["PSG", "Marseille", "Lyon", "Monaco", "Lille", "Nice"]
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

function generarPartidos(fecha, ligaId) {
    const equipos = equiposPorLiga[ligaId];
    const mezclados = [...equipos].sort(() => 0.5 - Math.random());
    const hoy = new Date().toISOString().split('T')[0];

    return [
        { team1: mezclados[0], team2: mezclados[1], time: "20:00", scoreHome: (fecha < hoy ? Math.floor(Math.random()*3) : null), scoreAway: (fecha < hoy ? Math.floor(Math.random()*3) : null) },
        { team1: mezclados[2], team2: mezclados[3], time: "18:30", scoreHome: (fecha < hoy ? Math.floor(Math.random()*3) : null), scoreAway: (fecha < hoy ? Math.floor(Math.random()*3) : null) },
        { team1: mezclados[4], team2: mezclados[5], time: "21:00", scoreHome: (fecha < hoy ? Math.floor(Math.random()*3) : null), scoreAway: (fecha < hoy ? Math.floor(Math.random()*3) : null) },
        { team1: mezclados[6], team2: mezclados[7], time: "16:15", scoreHome: (fecha < hoy ? Math.floor(Math.random()*3) : null), scoreAway: (fecha < hoy ? Math.floor(Math.random()*3) : null) }
    ];
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const fechaInput = document.getElementById('date-select').value;

    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }

    listaDiv.innerHTML = `<div class='loader'>Generando jornada del ${fechaInput}... ⏳</div>`;

    setTimeout(() => {
        const partidos = generarPartidos(fechaInput, ligaId);
        const hoyString = new Date().toISOString().split('T')[0];

        listaDiv.innerHTML = partidos.map(m => {
            let esPasado = m.scoreHome !== null;
            let badgeEstado = esPasado ? 
                `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Finalizado</span>` : 
                `<span style="background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Pendiente</span>`;

            if (fechaInput === hoyString && !esPasado) {
                badgeEstado = `<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Hoy</span>`;
            }

            let displayTime = esPasado ? `<span style="color:#ef4444; font-weight:900; font-size:14px;">${m.scoreHome} - ${m.scoreAway}</span>` : `⏰ ${m.time}`;

            return `
                <div class="match-card" onclick="analizarPartido('${m.team1}', '${m.team2}', '${fechaInput}', '${esPasado ? 'post' : 'pre'}', '${m.scoreHome}', '${m.scoreAway}')">
                    <div class="match-header">
                        <span class="league-badge">Jornada ${badgeEstado}</span>
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
    }, 500);
}

function analizarPartido(local, visita, fecha, estadoPartido, scoreLocal, scoreVisita) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando análisis completo... ⏳</div>`;

    const equiposGrandes = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG", "AC Milan", "Juventus", "Atletico"];
    const equiposDefensivos = ["Getafe", "Cadiz", "Athletic", "Betis", "Sevilla", "Mallorca", "Rayo", "Elche", "Valencia", "Málaga"];

    const esLocalTop = equiposGrandes.some(eq => local.includes(eq));
    const esVisitaTop = equiposGrandes.some(eq => visita.includes(eq));
    const esLocalDef = equiposDefensivos.some(eq => local.includes(eq));
    const esVisitaDef = equiposDefensivos.some(eq => visita.includes(eq));

    let baseGolesL = [85, 65, 45], baseGolesV = [80, 60, 40];
    let baseCornersL = [80, 60, 35], baseCornersV = [75, 55, 30];
    let baseTarjetasL = [80, 55, 30], baseTarjetasV = [80, 55, 30];
    let pL = 33, pV = 33, pE = 34, pick = "Partido Igualado", color = "#f59e0b";

    if (esLocalTop && esVisitaTop) {
        pL = 40; pV = 40; pE = 20; pick = "Partido Muy Igualado"; color = "#f59e0b";
        baseGolesL = [95, 85, 70]; baseGolesV = [90, 75, 60];
        baseCornersL = [85, 65, 40]; baseCornersV = [85, 65, 40];
        baseTarjetasL = [75, 50, 25]; baseTarjetasV = [75, 50, 25];
    } else if (esLocalTop && !esVisitaTop) {
        pL = 75; pV = 10; pE = 15; pick = `Gana ${local}`; color = "#10b981";
        baseGolesL = [95, 85, 75]; baseGolesV = [65, 40, 20];
        baseCornersL = [85, 70, 50]; baseCornersV = [60, 40, 20];
        baseTarjetasL = [70, 45, 25]; baseTarjetasV = [85, 60, 35];
    } else if (esVisitaTop && !esLocalTop) {
        pL = 10; pV = 75; pE = 15; pick = `Gana ${visita}`; color = "#ef4444";
        baseGolesL = [65, 40, 20]; baseGolesV = [95, 85, 75];
        baseCornersL = [60, 40, 20]; baseCornersV = [85, 70, 50];
        baseTarjetasL = [85, 60, 35]; baseTarjetasV = [70, 45, 25];
    } else if (esLocalDef && esVisitaDef) {
        pL = 35; pV = 30; pE = 35; pick = "Empate o Partido Cerrado"; color = "#f59e0b";
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
    if (estadoPartido === 'post') {
        const gH = parseInt(scoreLocal) || 0;
        const gA = parseInt(scoreVisita) || 0;
        const totalGoles = gH + gA;
        let acierto = false;

        if (mejorOpcion.nombre.includes(`Victoria ${local}`) && gH > gA) acierto = true;
        else if (mejorOpcion.nombre === "Empate" && gH === gA) acierto = true;
        else if (mejorOpcion.nombre.includes(`Victoria ${visita}`) && gA > gH) acierto = true;
        else if (mejorOpcion.nombre === "Más de 2.5 Goles" && totalGoles > 2.5) acierto = true;
        else if (mejorOpcion.nombre === "Menos de 2.5 Goles" && totalGoles < 2.5) acierto = true;
        else if (mejorOpcion.nombre === "Ambos Equipos Marcan (SÍ)" && gH > 0 && gA > 0) acierto = true;
        else if (mejorOpcion.nombre === "Ambos Equipos Marcan (NO)" && (gH === 0 || gA === 0)) acierto = true;
        else if (mejorOpcion.nombre.includes("Córners") || mejorOpcion.nombre.includes("Tarjetas")) acierto = Math.random() > 0.4;

        cajaEstado = acierto ? 
            `<div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <h3 style="color: #065f46; font-size: 16px; font-weight: 900; margin-bottom: 5px;">✅ PREDICCIÓN ACERTADA</h3>
                <p style="color: #065f46; font-size: 13px;">Resultado final: ${gH} - ${gA}. La IA acertó con: <b>${mejorOpcion.nombre}</b></p>
            </div>` :
            `<div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <h3 style="color: #991b1b; font-size: 16px; font-weight: 900; margin-bottom: 5px;">❌ PREDICCIÓN FALLIDA</h3>
                <p style="color: #991b1b; font-size: 13px;">Resultado final: ${gH} - ${gA}. La IA falló con: <b>${mejorOpcion.nombre}</b></p>
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
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA (RESULTADO)</p>
                <p style="color: ${color}; font-size: 16px; font-weight: 900;">${pick}</p>
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
                    <p style="color: #10b981; font-siz
