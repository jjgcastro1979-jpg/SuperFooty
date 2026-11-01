// ==========================================
// SUPERFOOTY PRO - VERSIÓN ESTABLE (SIN RIESGOS)
// ==========================================

const ligasAPI = {
    "eng.1": { nombre: "Premier League", slug: "eng.1" },
    "esp.1": { nombre: "La Liga", slug: "esp.1" },
    "ita.1": { nombre: "Serie A", slug: "ita.1" },
    "ger.1": { nombre: "Bundesliga", slug: "ger.1" },
    "fra.1": { nombre: "Ligue 1", slug: "fra.1" },
    "uefa.champions": { nombre: "Champions League", slug: "uefa.champions" }
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

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasAPI[ligaId];
    const fechaInput = document.getElementById('date-select').value;

    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }
    if (!ligaInfo) {
        listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#f59e0b; font-weight:bold;'>La liga seleccionada no está configurada.</p>`;
        return;
    }

    const fechaFormateada = fechaInput.replace(/-/g, '');
    listaDiv.innerHTML = `<div class='loader'>Buscando partidos del ${fechaInput} en ${ligaInfo.nombre}... ⏳</div>`;

    try {
        const url = `https://worldcup26.ir/get/soccer/${ligaInfo.slug}/scoreboard?dates=${fechaFormateada}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        const partidos = data.events || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.map(match => {
                const local = match.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName;
                const visita = match.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName;
                const hora = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const matchId = match.id;

                const estado = match.status?.type?.state;
                const descEstado = match.status?.type?.description;
                const scoreHome = match.competitions[0].competitors.find(c => c.homeAway === 'home').score;
                const scoreAway = match.competitions[0].competitors.find(c => c.homeAway === 'away').score;

                let displayTime = `⏰ ${hora}`;
                let extraBadge = `<span style="background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Pendiente</span>`;

                if (estado === 'post' || descEstado === 'Final' || descEstado === 'Full Time') {
                    displayTime = `<span style="color: #ef4444; font-weight: 900; font-size: 14px;">${scoreHome} - ${scoreAway}</span>`;
                    extraBadge = `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Finalizado</span>`;
                } else if (estado === 'in') {
                    displayTime = `<span style="color: #10b981; font-weight: 900; font-size: 14px;">${scoreHome} - ${scoreAway}</span>`;
                    extraBadge = `<span style="background:#10b981; color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">EN VIVO</span>`;
                }

                return `
                    <div class="match-card" onclick="analizarPartido('${matchId}', '${ligaId}', '${local}', '${visita}', '${fechaInput}', '${estado}', '${scoreHome}', '${scoreAway}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaInfo.nombre} ${extraBadge}</span>
                            <span class="match-time">${displayTime}</span>
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos programados para el ${fechaInput}.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error al conectar con la API.<br><br>${error.message}</p>`;
    }
}

function variar(val) {
    let varianza = Math.floor(Math.random() * 11) - 5;
    return Math.min(Math.max(val + varianza, 5), 98);
}

async function analizarPartido(matchId, ligaId, local, visita, fechaISO, estado, scoreHome, scoreAway) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando análisis completo... ⏳</div>`;

    const equiposGrandes = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG", "AC Milan", "Juventus", "Atletico"];
    const equiposDefensivos = ["Getafe", "Cadiz", "Athletic", "Betis", "Sevilla", "Mallorca", "Rayo", "Elche", "Valencia"];

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

    let opciones =
