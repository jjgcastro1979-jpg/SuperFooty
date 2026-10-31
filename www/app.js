// ==========================================
// SUPERFOOTY PRO - ANÁLISIS 100% REAL Y LIMPIO
// ==========================================
const GOAL_API_KEY = 'gapi_1db22217e01cf4be68deb0e0d61b6702d40de011453cdd853792e56f4e3fb714'; // ⚠️ PON TU CLAVE DE GOAL API AQUÍ

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
    // Evitar NaN
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
        const data = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/scoreboard?dates=${fechaFormateada}`);

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

// FORMA RECIENTE LIMPIA
async function obtenerFormaEquipo(teamId, ligaId) {
    try {
        const res = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/teams/${teamId}/schedule`);
        if (res.events) {
            // Filtramos solo partidos TERMINADOS y que TENGAN marcador válido
            const terminados = res.events.filter(e => {
                const comp = e.competitions[0];
                const home = comp.competitors.find(c => c.homeAway === 'home');
                const away = comp.competitors.find(c => c.homeAway === 'away');
                return comp.status.type.completed && home.score !== undefined && away.score !== undefined;
            });
            
            const ultimos5 = terminados.slice(-5);
            
            if (ultimos5.length === 0) return { formaStr: "Sin datos", mediaFavor: "0.0", mediaContra: "0.0" };

            let forma = [];
            let gfTotal = 0, gcTotal = 0;

            ultimos5.forEach(partido => {
                const comps = partido.competitions[0].competitors;
                const esLocal = comps.find(c => c.homeAway === 'home').id === teamId;
                const gl = parseInt(comps.find(c => c.homeAway === 'home').score) || 0;
                const gv = parseInt(comps.find(c => c.homeAway === 'away').score) || 0;
                
                let gf = esLocal ? gl : gv;
                let gc = esLocal ? gv : gl;

                gfTotal += gf; gcTotal += gc;

                if (gf > gc) forma.push('<span style="color:#10b981; font-weight:bold;">V</span>');
                else if (gf === gc) forma.push('<span style="color:#f59e0b; font-weight:bold;">E</span>');
                else forma.push('<span style="color:#ef4444; font-weight:bold;">D</span>');
            });

            return {
                formaStr: forma.join(' - '),
                mediaFavor: (gfTotal / ultimos5.length).toFixed(1),
                mediaContra: (gcTotal / ultimos5.length).toFixed(1)
            };
        }
    } catch (e) { console.log("Error forma:", teamId); }
    return { formaStr: "Sin datos", mediaFavor: "0.0", mediaContra: "0.0" };
}

async function analizarPartido(eventId, ligaId, idEspnLocal, idEspnVisita, local, visita, logoLocal, logoVisita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Analizando con Goal API y ESPN... ⏳</div>`;

    const formaLocal = await obtenerFormaEquipo(idEspnLocal, ligaId);
    const formaVisita = await obtenerFormaEquipo(idEspnVisita, ligaId);

    let pickRecomendado = "Partido Igualado";
    let colorPick = "#f59e0b";
    let pL = 33, pV = 33, pE = 34;

    // 1. Predictor de ESPN
    try {
        const summary = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/summary?event=${eventId}`);
        if (summary.predictor && summary.predictor.homeTeam) {
            pL = Math.round(summary.predictor.homeTeam.gameProjection);
            pV = Math.round(summary.predictor.awayTeam.gameProjection);
            pE = 100 - pL - pV;
            
            if (pL > pV + 10) { pickRecomendado = `Gana ${local} (${pL}%)`; colorPick = "#10b981"; }
            else if (pV > pL + 10) { pickRecomendado = `Gana ${visita} (${pV}%)`; colorPick = "#ef4444"; }
        }
    } catch (e) { console.log("Predictor no disponible."); }

    // 2. Historial Goal API
    let h2hLocal = 0, h2hEmpate = 0, h2hVisita = 0;
    let origenH2H = "No disponible";

    try {
        const resHome = await hacerPeticion(`https://api.goal-api.com/v1/teams?search=${encodeURIComponent(local)}`, { 'Authorization': `Bearer ${GOAL_API_KEY}` });
        const resAway = await hacerPeticion(`https://api.goal-api.com/v1/teams?search=${encodeURIComponent(visita)}`, { 'Authorization': `Bearer ${GOAL_API_KEY}` });

        const idGoalLocal = resHome.data?.[0]?.id;
        const idGoalVisita = resAway.data?.[0]?.id;

        if (idGoalLocal && idGoalVisita) {
            const h2hData = await hacerPeticion(`https://api.goal-api.com/v1/h2h/${idGoalLocal}/${idGoalVisita}/stats`, { 'Authorization': `Bearer ${GOAL_API_KEY}` });
            
            if (h2hData.success && h2hData.data) {
                const sum = (h2hData.data.team1_wins || 0) + (h2hData.data.team2_wins || 0) + (h2hData.data.draws || 0);
                if (sum > 0) {
                    h2hLocal = h2hData.data.team1_wins;
                    h2hEmpate = h2hData.data.draws;
                    h2hVisita = h2hData.data.team2_wins;
                    origenH2H = "Goal API (Real)";
                }
            }
        }
    } catch (e) { console.log("Goal API falló."); }

    // 3. Respaldo de H2H con ESPN
    if (h2hLocal === 0 && h2hVisita === 0 && h2hEmpate === 0) {
        try {
            const summary = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/summary?event=${eventId}`);
            if (summary.headToHeadGames && summary.headToHeadGames.length > 0) {
                summary.headToHeadGames.forEach(game => {
                    const comps = game.competitions[0].competitors;
                    const hs = parseInt(comps.find(c => c.homeAway === 'home').score) || 0;
                    const as = parseInt(comps.find(c => c.homeAway === 'away').score) || 0;
                    const homeName = comps.find(c => c.homeAway === 'home').team.displayName;

                    if (hs === as) h2hEmpate++;
                    else if ((homeName === local && hs > as) || (homeName === visita && as > hs)) h2hLocal++;
                    else h2hVisita++;
                });
                
                if(h2hLocal > 0 || h2hVisita > 0 || h2hEmpate > 0) {
                    origenH2H = "ESPN (Respaldo)";
                }
            }
        } catch (e) {}
    }

    // 4. Cálculo de probabilidades
    let probGolesLocal = 50;
    let probGolesVisita = 50;
    
    if (parseFloat(formaLocal.mediaFavor) > 0) probGolesLocal = Math.min(parseFloat(formaLocal.mediaFavor) * 35 + 30, 95);
    if (parseFloat(formaVisita.mediaFavor) > 0) probGolesVisita = Math.min(parseFloat(formaVisita.mediaFavor) * 35 + 30, 95);

    let resumenTexto = `
        <strong>${local}:</strong> Forma reciente [${formaLocal.formaStr}]. Marca ${formaLocal.mediaFavor} goles/partido y recibe ${formaLocal.mediaContra}.<br><br>
        <strong>${visita}:</strong> Forma reciente [${formaVisita.formaStr}]. Marca ${formaVisita.mediaFavor} goles/partido y recibe ${formaVisita.mediaContra}.
    `;

    // Renderizar H2H
    let h2hDisplay = "";
    if (h2hLocal === 0 && h2hVisita === 0 && h2hEmpate === 0) {
        h2hDisplay = `<div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; font-size: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; color: #64748b;">No hay historial reciente registrado entre ambos equipos para esta fecha.</div>`;
    } else {
        h2hDisplay = `
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <div><strong style="color: #166534; font-size: 16px;">${h2hLocal}</strong><br>${local}</div>
                <div><strong style="color: #64748b; font-size: 16px;">${h2hEmpate}</strong><br>Empates</div>
                <div><strong style="color: #b91c1c; font-size: 16px;">${h2hVisita}</strong><br>${visita}</div>
            </div>
        `;
    }

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
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PREDICCIÓN (ESPN ALGORITHM)</p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">📊 Probabilidades</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
                ${crearBarraProbabilidad(`Empate`, pE)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚔️ Historial (H2H) - <span style="font-size:11px; font-weight:normal; color:#64748b;">${origenH2H}</span></h4>
            ${h2hDisplay}

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">🔥 Forma Reciente (Últimos 5)</h4>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px; text-align: center; font-size: 14px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <div style="width: 45%;">
                    <p style="font-size: 12px; font-weight: bold; color: var(--primary); margin-bottom: 5px;">${local}</p>
                    <p>${formaLocal.formaStr}</p>
                </div>
                <div style="width: 10%; border-left: 1px solid #cbd5e1;"></div>
                <div style="width: 45%;">
                    <p style="font-size: 12px; font-weight: bold; color: #ef4444; margin-bottom: 5px;">${visita}</p>
                    <p>${formaVisita.formaStr}</p>
                </div>
            </div>

            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.6; margin: 0;">${resumenTexto}</p>
            </div>

            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚽ Potencial Ofensivo (Real)</h4>
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
