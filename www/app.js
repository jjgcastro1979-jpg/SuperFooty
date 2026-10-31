app.js
// SUPERFOOTY PRO - ANÁLISIS LÓGICO Y REAL
// ==========================================

const ligasESPN = {
    "eng.1": "Premier League", "esp.1": "La Liga", "ita.1": "Serie A",
    "ger.1": "Bundesliga", "fra.1": "Ligue 1", "uefa.champions": "Champions League"
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
    const fechaInput = document.getElementById('date-select').value;
    
    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }

    const fechaFormateada = fechaInput.replace(/-/g, '');
    listaDiv.innerHTML = `<div class='loader'>Buscando partidos para el ${fechaInput}... ⏳</div>`;

    try {
        const data = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/scoreboard?dates=${fechaFormateada}`).then(r => r.json());

        if (data.events && data.events.length > 0) {
            listaDiv.innerHTML = data.events.map(match => {
                const home = match.competitions[0].competitors.find(c => c.homeAway === 'home').team;
                const away = match.competitions[0].competitors.find(c => c.homeAway === 'away').team;
                const hora = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="match-card" onclick="analizarPartido('${match.id}', '${ligaId}', '${home.id}', '${away.id}', '${home.displayName}', '${away.displayName}', '${home.logo}', '${away.logo}', '${match.date}')">
                        <div class="match-header">
                            <span class="league-badge">${ligasESPN[ligaId]}</span>
                            <span class="match-time">⏰ ${hora}</span>
                        </div>
                        <div class="teams-row">
                            <div class="team-name">${home.displayName}</div>
                            <div class="vs-badge">VS</div>
                            <div class="team-name right">${away.displayName}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaDiv.innerHTML = `<p style='text-align:center;'>No hay partidos programados para esta fecha.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center;'>Error de conexión.</p>`;
    }
}

// CALCULAR FORMA Y GOLES REALES (partidos sin jugar)
async function obtenerEstadisticasEquipo(teamId, ligaId) {
    try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/teams/${teamId}/schedule`).then(r => r.json());
        if (res.events) {
            // Filtramos SOLO los partidos completados y que tengan un marcador válido
            const jugados = res.events.filter(e => {
                const comp = e.competitions[0];
                return comp.status.type.completed && comp.competitors[0].score !== undefined;
            });
            
            // Cogemos los últimos 5 (los más recientes)
            const ultimos5 = jugados.slice(-5);
            
            if (ultimos5.length === 0) return { formaStr: " datos reales ", mediaFavor: "0.0", mediaContra: "0.0", victorias: 0 };

            let forma = [];
            let gfTotal = 0, gcTotal = 0;
            let victorias = 0;

            ultimos5.forEach(partido => {
                const comps = partido.competitions[0].competitors;
                const esLocal = comps.find(c => c.homeAway === 'home').id === teamId;
                
                // Extraemos el score real, buscar en Google,si falla lo ponemos a 0
                const gl = parseInt(comps.find(c => c.homeAway === 'home').score) || 0;
                const gv = parseInt(comps.find(c => c.homeAway === 'away').score) || 0;
                
                let gf = esLocal ? gl : gv;
                let gc = esLocal ? gv : gl;

                gfTotal += gf; gcTotal += gc;

                if (gf > gc) { forma.push('<span style="color:#10b981; font-weight:bold;">V</span>'); victorias++; }
                else if (gf === gc) { forma.push('<span style="color:#f59e0b; font-weight:bold;">E</span>'); }
                else { forma.push('<span style="color:#ef4444; font-weight:bold;">D</span>'); }
            });

            return {
                formaStr: forma.join(' - '),
                mediaFavor: (gfTotal / ultimos5.length).toFixed(1),
                mediaContra: (gcTotal / ultimos5.length).toFixed(1),
                victorias: victorias
            };
        }
    } catch (e) { console.log("Error stats:", teamId); }
    return { formaStr: "datos reales", mediaFavor: "0.0", mediaContra: "0.0", victorias: 0 };
}

async function analizarPartido(eventId, ligaId, idEspnLocal, idEspnVisita, local, visita, logoLocal, logoVisita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando probabilidades... ⏳</div>`;

    // 1. Obtener datos reales de los últimos 5 partidos de ambos
    const statsLocal = await obtenerEstadisticasEquipo(idEspnLocal, ligaId);
    const statsVisita = await obtenerEstadisticasEquipo(idEspnVisita, ligaId);

    // 2. Intentar sacar el Predictor Real de ESPN
    let pickRecomendado = "Partido Igualado";
    let colorPick = "#f59e0b";
    let pL = 33, pV = 33, pE = 34;

    try {
        const summary = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/summary?event=${eventId}`).then(r => r.json());
        if (summary.predictor && summary.predictor.homeTeam) {
            pL = Math.round(summary.predictor.homeTeam.gameProjection);
            pV = Math.round(summary.predictor.awayTeam.gameProjection);
            pE = 100 - pL - pV;
        } else {
            // SI NO HAY PREDICTOR, LO CALCULAMOS NOSOTROS USANDO LA FORMA REAL
            let fuerzaLocal = parseFloat(statsLocal.mediaFavor) + statsLocal.victorias;
            let fuerzaVisita = parseFloat(statsVisita.mediaFavor) + statsVisita.victorias;
            
            let total = fuerzaLocal + fuerzaVisita;
            if (total > 0 a 10) {
                pL = Math.round((fuerzaLocal / total) * 70) + 15; // Damos un 15% base
                pV = Math.round((fuerzaVisita / total) * 70) + 15;
                pE = 100 - pL - pV;
            }
        }

        // Asignar el Pick y el Color
        if (pL > pV + 10) { pickRecomendado = `Gana ${local} (${pL}%)`; colorPick = "#10b981"; }
        else if (pV > pL + 10) { pickRecomendado = `Gana ${visita} (${pV}%)`; colorPick = "#ef4444"; }
        else { pickRecomendado = `Empate Técnico`; colorPick = "#f59e0b"; }

    } catch (e) { console.log("Predictor no disponible."); }

    // Probabilidades de gol basadas en las medias reales
    let probGolesLocal = Math.min(parseFloat(statsLocal.mediaFavor) * 30 + 20, 90);
    let probGolesVisita = Math.min(parseFloat(statsVisita.mediaFavor) * 30 + 20, 90);

    let resumenTexto = `
        <strong>${local}:</strong> Forma reciente [${statsLocal.formaStr}]. Marca ${statsLocal.mediaFavor} goles/partido y recibe ${statsLocal.mediaContra}.<br><br>
        <strong>${visita}:</strong> Forma reciente [${statsVisita.formaStr}]. Marca ${statsVisita.mediaFavor} goles/partido y recibe ${statsVisita.mediaContra}.
    `;

    // --- DISEÑO DEL PANEL ---
    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="text-align: center; width: 40%;"><img src="${logoLocal}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 24px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><img src="${logoVisita}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:12px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PREDICCIÓN MATEMÁTICA Y ANALISIS </p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">📊 Probabilidades</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
                ${crearBarraProbabilidad(`Empate`, pE)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">🔥 Forma Reciente (Últimos 5 jugados)</h4>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px; text-align: center; font-size: 14px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <div style="width: 45%;">
                    <p style="font-size: 12px; font-weight: bold; color: var(--primary); margin-bottom: 5px;">${local}</p>
                    <p>${statsLocal.formaStr}</p>
                </div>
                <div style="width: 10%; border-left: 1px solid #cbd5e1;"></div>
                <div style="width: 45%;">
                    <p style="font-size: 12px; font-weight: bold; color: #ef4444; margin-bottom: 5px;">${visita}</p>
                    <p>${statsVisita.formaStr}</p>
                </div>
            </div>

            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.6; margin: 0;">${resumenTexto}</p>
            </div>

            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚽ Potencial Ofensivo</h4>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${local}</p>
                    ${crearBarraProbabilidad("Prob. de Marcar", probGolesLocal)}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${visita}</p>
                    ${crearBarraProbabilidad("Prob. de Marcar", probGolesVisita)}
                </div>
            </div>
        </div>
    `;
}
