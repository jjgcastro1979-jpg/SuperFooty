// ==========================================
// SUPERFOOTY PRO - VERSIÓN THESPORTSDB (SIN REGISTRO)
// ==========================================

const ligasAPI = {
    "eng.1": { nombre: "Premier League", id: "4328" },
    "esp.1": { nombre: "La Liga", id: "4335" }, // Nota: La Liga usa 4335 en TheSportsDB
    "ita.1": { nombre: "Serie A", id: "4332" },
    "ger.1": { nombre: "Bundesliga", id: "4331" },
    "fra.1": { nombre: "Ligue 1", id: "4334" }
};

// Clave pública gratuita (no necesita registro)
const API_KEY = '3'; 
const API_BASE = 'https://www.thesportsdb.com/api/v1/json';

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

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos del ${fechaInput} en ${ligaInfo.nombre}... ⏳</div>`;

    try {
        // Usamos el endpoint eventsday de TheSportsDB
        const url = `${API_BASE}/${API_KEY}/eventsday.php?d=${fechaInput}&l=${ligaInfo.id}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        
        // TheSportsDB devuelve los eventos en 'events'
        const partidos = data.events || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.map(match => {
                const local = match.strHomeTeam;
                const visita = match.strAwayTeam;
                const hora = match.strTime ? match.strTime.substring(0, 5) : '20:00';
                const matchId = match.idEvent;

                // Adaptamos los estados de TheSportsDB
                const estado = match.strStatus;
                const scoreHome = match.intHomeScore;
                const scoreAway = match.intAwayScore;

                let displayTime = `⏰ ${hora}`;
                let extraBadge = `<span style="background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Pendiente</span>`;

                if (estado === 'Match Finished' || estado === 'FT') {
                    displayTime = `<span style="color: #ef4444; font-weight: 900; font-size: 14px;">${scoreHome} - ${scoreAway}</span>`;
                    extraBadge = `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Finalizado</span>`;
                } else if (estado === 'In Progress' || estado === 'Live') {
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos programados para el ${fechaInput} en ${ligaInfo.nombre}.<br><br><span style="font-size:12px;">(TheSportsDB solo permite ver 3 partidos por día en su plan gratuito).</span></p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error al conectar con TheSportsDB.<br><br>${error.message}</p>`;
    }
}

// (El resto de funciones: variar, analizarPartido, etc., se mantienen exactamente igual)
