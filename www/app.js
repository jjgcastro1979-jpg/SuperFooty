// ==========================================
// SUPERFOOTY PRO - MOTOR CON CACHÉ Y FECHAS REALES
// ==========================================

const ligasOpenFootball = {
    "eng.1": { nombre: "Premier League", archivo: "en.1.json" },
    "esp.1": { nombre: "La Liga", archivo: "es.1.json" },
    "ita.1": { nombre: "Serie A", archivo: "it.1.json" },
    "ger.1": { nombre: "Bundesliga", archivo: "de.1.json" },
    "fra.1": { nombre: "Ligue 1", archivo: "fr.1.json" }
};

function crearBarraProbabilidad(titulo, probabilidad) {
    let prob = parseFloat(probabilidad);
    if (isNaN(prob)) prob = 0;
    let color = "#ef4444"; 
    if (prob >= 65) color = "#10b981";
    else if (prob >= 40) color = "#f59e0b";

    return `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #475569;">${titulo}</span>
                <span style="color: ${color};">${Math.round(prob)}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${prob}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
            </div>
        </div>
    `;
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasOpenFootball[ligaId];
    const fechaUsuario = document.getElementById('date-select').value;

    if (!fechaUsuario) { alert("Por favor, selecciona una fecha."); return; }

    // 1. COMPROBAR CACHÉ
    const datosCache = obtenerDeCache(fechaUsuario, ligaId);
    if (datosCache) {
        listaDiv.innerHTML = `<p style="text-align:center; color:#10b981; font-size:12px; margin-bottom:10px;">⚡ Cargado desde memoria (Offline)</p>`;
        renderizarListaPartidos(datosCache, ligaInfo, fechaUsuario);
        return;
    }

    // 2. SI NO HAY CACHÉ, IR A INTERNET
    const mesDia = fechaUsuario.substring(5); 
    const fechaBusqueda = `2024${mesDia}`; // Buscamos en la temporada 2024 real

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos en la red... ⏳</div>`;

    try {
        const url = `https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/${ligaInfo.archivo}`;
        const response = await fetch(url);
        const data = await response.json();

        const partidosDelDia = data.matches.filter(p => p.date === fechaBusqueda);

        if (partidosDelDia.length > 0) {
            // GUARDAR EN CACHÉ
            guardarEnCache(fechaUsuario, ligaId, partidosDelDia);
            renderizarListaPartidos(partidosDelDia, ligaInfo, fechaUsuario);
        } else {
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos para el ${fechaUsuario}.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error de conexión.</p>`;
    }
}

function renderizarListaPartidos(partidos, ligaInfo, fechaUsuario) {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = partidos.map(match => {
        const matchId = btoa(`${match.date}-${match.team1}-${match.team2}`).replace(/=/g, '');
        return `
            <div class="match-card" onclick="analizarPartido('${matchId}', '${match.team1}', '${match.team2}', '${fechaUsuario}')">
                <div class="match-header">
                    <span class="league-badge">${ligaInfo.nombre}</span>
                    <span class="match-time">⏰ ${match.time || '20:00'}</span>
                </div>
                <div class="teams-row">
                    <div class="team-name">${match.team1}</div>
                    <div class="vs-badge">VS</div>
                    <div class="team-name right">${match.team2}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function analizarPartido(matchId, local, visita, fechaUsuario) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaUsuario + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Analizando...</div>`;

    // Análisis rápido simulado basado en la fuerza
    const equiposTop = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG"];
    const esLocalTop = equiposTop.some(eq => local.includes(eq));
    const esVisitaTop = equiposTop.some(eq => visita.includes(eq));

    let pL = 40, pV = 30, pE = 30;
    let pick = `Gana ${local}`;
    let color = "#10b981";

    if (esVisitaTop && !esLocalTop) { pL = 20; pV = 60; pE = 20; pick = `Gana ${visita}`; color = "#ef4444"; }
    else if (esLocalTop && esVisitaTop) { pL = 35; pV = 35; pE = 30; pick = "Partido Igualado"; color = "#f59e0b"; }

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            <h3 style="text-align:center; font-size: 18px; margin-bottom: 5px;">${local} vs ${visita}</h3>
            <p style="text-align:center; color:#64748b; font-size:12px; margin-bottom:20px;">📅 ${fechaStr}</p>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA</p>
                <p style="color: ${color}; font-size: 18px; font-weight: 900;">${pick}</p>
            </div>

            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
                ${crearBarraProbabilidad(`Empate`, pE)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}
            </div>
        </div>
    `;
}
