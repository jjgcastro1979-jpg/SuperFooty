// ==========================================
// SUPERFOOTY PRO - DOBLE RESPALDO (GOAL API + ESPN)
// ==========================================
const GOAL_API_KEY = 'gapi_1db22217e01cf4be68deb0e0d61b6702d40de011453cdd853792e56f4e3fb714'; // ⚠️ PON TU CLAVE AQUÍ

const ligasESPN = {
    "eng.1": "Premier League", "esp.1": "La Liga", "ita.1": "Serie A",
    "ger.1": "Bundesliga", "fra.1": "Ligue 1", "uefa.champions": "Champions League"
};

async function hacerPeticion(url, headers = {}) {
    if (window.cordova && cordova.plugin && cordova.plugin.http) {
        return new Promise((resolve, reject) => {
            cordova.plugin.http.get(url, {}, headers, 
                (response) => {
                    try { resolve(JSON.parse(response.data)); } 
                    catch(e) { reject(new Error("Error JSON")); }
                }, 
                (error) => reject(new Error(`Error HTTP: ${error.status}`))
            );
        });
    } else {
        const res = await fetch(url, { headers });
        return await res.json();
    }
}

function crearBarraProbabilidad(titulo, probabilidad) {
    let color = "#ef4444"; 
    if (probabilidad >= 65) color = "#10b981";
    else if (probabilidad >= 40) color = "#f59e0b";

    return `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #475569;">${titulo}</span>
                <span style="color: ${color};">${Math.round(probabilidad)}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${probabilidad}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
            </div>
        </div>
    `;
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const fechaInput = document.getElementById('date-select').value;
    
    if (!fechaInput) {
        alert("Por favor, selecciona una fecha.");
        return;
    }

    // Convertir fecha a formato ESPN (YYYYMMDD)
    const fechaFormateada = fechaInput.replace(/-/g, '');
    
    listaDiv.innerHTML = `<div class='loader'>Buscando partidos para el ${fechaInput}... ⏳</div>`;

    try {
        // Añadimos ?dates=YYYYMMDD a la URL para buscar en el futuro
        const data = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/scoreboard?dates=${fechaFormateada}`);

        if (data.events && data.events.length > 0) {
            listaDiv.innerHTML = data.events.map(match => {
                const home = match.competitions[0].competitors.find(c => c.homeAway === 'home').team;
                const away = match.competitions[0].competitors.find(c => c.homeAway === 'away').team;
                const hora = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="match-card" onclick="analizarPartido('${match.id}', '${ligaId}', '${home.displayName}', '${away.displayName}', '${home.logo}', '${away.logo}', '${match.date}')">
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
            listaDiv.innerHTML = `<p style='text-align:center;'>No hay partidos de ${ligasESPN[ligaId]} programados para esta fecha.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center;'>Error de conexión.</p>`;
    }
}

async function analizarPartido(eventId, ligaId, local, visita, logoLocal, logoVisita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Analizando datos reales... ⏳</div>`;

    let h2hLocal = 0, h2hEmpate = 0, h2hVisita = 0;
    let pickRecomendado = "Calculando...";
    let colorPick = "#f59e0b";
    let resumenTexto = "";

    // 1. INTENTO CON GOAL API
    try {
        const resHome = await hacerPeticion(`https://api.goal-api.com/v1/teams?search=${encodeURIComponent(local)}`, { 'Authorization': `Bearer ${GOAL_API_KEY}` });
        const resAway = await hacerPeticion(`https://api.goal-api.com/v1/teams?search=${encodeURIComponent(visita)}`, { 'Authorization': `Bearer ${GOAL_API_KEY}` });

        const idLocal = resHome.data?.[0]?.id;
        const idVisita = resAway.data?.[0]?.id;

        if (idLocal && idVisita) {
            const h2hData = await hacerPeticion(`https://api.goal-api.com/v1/h2h/${idLocal}/${idVisita}/stats`, { 'Authorization': `Bearer ${GOAL_API_KEY}` });
            
            if (h2hData.success && h2hData.data && (h2hData.data.team1_wins > 0 || h2hData.data.team2_wins > 0 || h2hData.data.draws > 0)) {
                const stats = h2hData.data;
                h2hLocal = stats.team1_wins;
                h2hEmpate = stats.draws;
                h2hVisita = stats.team2_wins;
                resumenTexto = `Datos de Goal API: ${local} suma ${h2hLocal} victorias, ${h2hEmpate} empates y ${h2hVisita} victorias para ${visita}.`;
            }
        }
    } catch (e) {
        console.log("Goal API sin datos, usando ESPN.");
    }

    // 2. RESPALDO: USAMOS ESPN
    if (h2hLocal === 0 && h2hVisita === 0 && h2hEmpate === 0) {
        try {
            const espnRes = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/summary?event=${eventId}`);
            
            if (espnRes.headToHeadGames && espnRes.headToHeadGames.length > 0) {
                espnRes.headToHeadGames.forEach(game => {
                    const comps = game.competitions[0].competitors;
                    const homeScore = parseInt(comps.find(c => c.homeAway === 'home').score);
                    const awayScore = parseInt(comps.find(c => c.homeAway === 'away').score);
                    const homeName = comps.find(c => c.homeAway === 'home').team.displayName;

                    if (homeScore === awayScore) h2hEmpate++;
                    else if ((homeName === local && homeScore > awayScore) || (homeName === visita && awayScore > homeScore)) h2hLocal++;
                    else h2hVisita++;
                });
                resumenTexto = `Historial (ESPN): ${h2hLocal} victorias para ${local}, ${h2hEmpate} empates y ${h2hVisita} victorias para ${visita}.`;
            }

            if (espnRes.predictor && espnRes.predictor.homeTeam) {
                const pL = Math.round(espnRes.predictor.homeTeam.gameProjection);
                const pV = Math.round(espnRes.predictor.awayTeam.gameProjection);
                pickRecomendado = pL > pV ? `Gana ${local} (${pL}%)` : `Gana ${visita} (${pV}%)`;
                colorPick = pL > pV ? "#10b981" : "#ef4444";
                resumenTexto += ` El Predictor de ESPN da un ${pL}% de victoria local y ${pV}% visitante.`;
            } else {
                if (h2hLocal > h2hVisita) { pickRecomendado = `Favorito: ${local}`; colorPick = "#10b981"; }
                else if (h2hVisita > h2hLocal) { pickRecomendado = `Favorito: ${visita}`; colorPick = "#ef4444"; }
                else { pickRecomendado = `Empate Técnico`; colorPick = "#f59e0b"; }
            }
        } catch (e) {
            resumenTexto = "No se pudieron cargar datos históricos. Mostrando análisis estimado.";
            pickRecomendado = "Partido Igualado";
        }
    }

    if (!resumenTexto) {
        resumenTexto = `Partido de ${ligasESPN[ligaId]}. No hay historial reciente registrado entre ambos equipos.`;
        pickRecomendado = "Partido Igualado";
    }

    let probGolesLocal = Math.min((h2hLocal * 10) + 40, 90);
    let probGolesVisita = Math.min((h2hVisita * 10) + 30, 90);

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
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA</p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚔️ Historial (H2H)</h4>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <div><strong style="color: #166534; font-size: 16px;">${h2hLocal}</strong><br>${local}</div>
                <div><strong style="color: #64748b; font-size: 16px;">${h2hEmpate}</strong><br>Empates</div>
                <div><strong style="color: #b91c1c; font-size: 16px;">${h2hVisita}</strong><br>${visita}</div>
            </div>

            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.5; margin: 0;">${resumenTexto}</p>
            </div>

            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚽ Probabilidad de Goles</h4>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${local}</p>
                    ${crearBarraProbabilidad("Más de 0.5", Math.min(probGolesLocal + 20, 95))}
                    ${crearBarraProbabilidad("Más de 1.5", probGolesLocal)}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${visita}</p>
                    ${crearBarraProbabilidad("Más de 0.5", Math.min(probGolesVisita + 20, 95))}
                    ${crearBarraProbabilidad("Más de 1.5", probGolesVisita)}
                </div>
            </div>
        </div>
    `;
}
