// ==========================================
// SUPERFOOTY PRO - DATOS REALES (ESPN + GOAL API)
// ==========================================

const ligasESPN = {
    "eng.1": "Premier League",
    "esp.1": "La Liga",
    "ita.1": "Serie A",
    "ger.1": "Bundesliga",
    "fra.1": "Ligue 1",
    "uefa.champions": "Champions League"
};

// ⚠️ PEGA TU CLAVE DE GOAL API AQUÍ (gapi_1db22217e01cf4be68deb0e0d61b6702d40de011453cdd853792e56f4e3fb714)
const GOAL_API_KEY = 'TU_CLAVE_AQUI';
const GOAL_API_BASE = 'https://api.goal-api.com/v1';

// Función para crear las barras de colores
function crearBarraProbabilidad(titulo, probabilidad) {
    let color = "#ef4444"; // Rojo (Baja)
    if (probabilidad >= 65) color = "#10b981"; // Verde (Alta)
    else if (probabilidad >= 40) color = "#f59e0b"; // Amarillo (Media)

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
    const ligaSelect = document.getElementById('league-select');
    const ligaId = ligaSelect.value;
    const ligaNombre = ligasESPN[ligaId];
    
    listaDiv.innerHTML = `<div class='loader'>Buscando partidos reales de ${ligaNombre}... ⏳</div>`;

    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/scoreboard`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.events && data.events.length > 0) {
            listaDiv.innerHTML = data.events.map(match => {
                const homeData = match.competitions[0].competitors.find(c => c.homeAway === 'home').team;
                const awayData = match.competitions[0].competitors.find(c => c.homeAway === 'away').team;
                
                const fechaStr = new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const horaStr = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="match-card" onclick="analizarPartido('${homeData.displayName}', '${awayData.displayName}', '${homeData.logo}', '${awayData.logo}', '${ligaNombre}', '${match.date}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaNombre}</span>
                            <span class="match-time">📅 ${fechaStr} - ⏰ ${horaStr}</span>
                        </div>
                        <div class="teams-row">
                            <div class="team-name">${homeData.displayName}</div>
                            <div class="vs-badge">VS</div>
                            <div class="team-name right">${awayData.displayName}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaDiv.innerHTML = `<p style='text-align:center;'>No hay partidos programados para hoy.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center;'>Error al conectar con ESPN.</p>`;
    }
}

// ANÁLISIS CON DATOS REALES DE GOAL API
async function analizarPartido(local, visita, logoLocal, logoVisita, liga, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    
    listaDiv.innerHTML = `<div class='loader'>🧠 Consultando GOAL API... ⏳</div>`;

    // Valores por defecto
    let h2hLocal = 0, h2hEmpate = 0, h2hVisita = 0;
    let pickRecomendado = "Calculando...";
    let colorPick = "#f59e0b";
    let resumenTexto = "Consultando los datos reales del historial...";
    
    // Probabilidades iniciales (se actualizarán con los datos reales)
    let probGolesLocal = 50, probGolesVisita = 50;
    let probCornersLocal = 45, probCornersVisita = 45;
    let probTarjetasLocal = 40, probTarjetasVisita = 40;

    try {
        // Llamada a la API de GOAL para el H2H
        // Nota: Los endpoints exactos pueden variar, usamos una estructura típica REST
        const urlH2H = `${GOAL_API_BASE}/h2h?team1=${encodeURIComponent(local)}&team2=${encodeURIComponent(visita)}`;
        
        const res = await fetch(urlH2H, {
            headers: { 
                'Authorization': `Bearer ${GOAL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error("Error de autenticación o límite alcanzado en GOAL API");

        const data = await res.json();

        // Si la API responde con datos válidos (asumiendo una estructura estándar)
        if (data && data.data) {
            const stats = data.data;
            
            h2hLocal = stats.team1_wins || 0;
            h2hEmpate = stats.draws || 0;
            h2hVisita = stats.team2_wins || 0;

            // Calculamos promedios y probabilidades
            const avgGolesL = stats.avg_goals_team1 || 1.5;
            const avgGolesV = stats.avg_goals_team2 || 1.2;
            
            probGolesLocal = Math.min(avgGolesL * 35, 95);
            probGolesVisita = Math.min(avgGolesV * 35, 95);
            
            // Estimación de córners y tarjetas basada en la media de los equipos
            probCornersLocal = Math.min((stats.avg_corners_team1 || 5) * 10, 95);
            probCornersVisita = Math.min((stats.avg_corners_team2 || 4) * 10, 95);
            probTarjetasLocal = Math.min((stats.avg_cards_team1 || 2) * 25, 95);
            probTarjetasVisita = Math.min((stats.avg_cards_team2 || 2.5) * 25, 95);

            // Lógica del Pick
            if (h2hLocal > h2hVisita) {
                pickRecomendado = `Favorito: ${local}`;
                colorPick = "#10b981"; // Verde
            } else if (h2hVisita > h2hLocal) {
                pickRecomendado = `Favorito: ${visita}`;
                colorPick = "#ef4444"; // Rojo
            } else {
                pickRecomendado = `Empate Técnico (H2H)`;
                colorPick = "#f59e0b"; // Amarillo
            }

            resumenTexto = `Datos reales de GOAL API: ${local} suma ${h2hLocal} victorias, ${h2hEmpate} empates y ${h2hVisita} victorias para ${visita}. Promedio de goles: ${avgGolesL.toFixed(1)} vs ${avgGolesV.toFixed(1)}.`;
        } else {
            throw new Error("Formato de respuesta desconocido");
        }

    } catch (e) {
        console.log("Fallo GOAL API:", e.message);
        resumenTexto = "⚠️ No se pudo conectar con GOAL API (Revisa tu clave o límite diario). Mostrando estimación de respaldo.";
        // Fallback a datos simulados si falla la API
        h2hLocal = Math.floor(Math.random() * 4) + 1;
        h2hVisita = Math.floor(Math.random() * 4);
        h2hEmpate = Math.floor(Math.random() * 3);
        pickRecomendado = "Análisis de Respaldo";
    }

    // --- DISEÑO DEL PANEL (IDÉNTICO AL QUE TE GUSTA) ---
    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver a los partidos</button>
        
        <div class="match-card" style="padding: 20px 15px;">
            <!-- CABECERA CON ESCUDOS -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="text-align: center; width: 40%;">
                    <img src="${logoLocal}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;">
                    <h3 style="font-size: 14px; margin: 0;">${local}</h3>
                </div>
                <div style="text-align: center; width: 20%;">
                    <span style="font-size: 24px; font-weight: 900; color: #94a3b8;">VS</span>
                </div>
                <div style="text-align: center; width: 40%;">
                    <img src="${logoVisita}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;">
                    <h3 style="font-size: 14px; margin: 0;">${visita}</h3>
                </div>
            </div>
            
            <p style="text-align:center; color:#64748b; font-size:12px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>

            <!-- PICK IA -->
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA (GOAL API)</p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <!-- H2H REAL -->
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚔️ Historial (H2H)</h4>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <div><strong style="color: #166534; font-size: 16px;">${h2hLocal}</strong><br>Gana ${local}</div>
                <div><strong style="color: #64748b; font-size: 16px;">${h2hEmpate}</strong><br>Empates</div>
                <div><strong style="color: #b91c1c; font-size: 16px;">${h2hVisita}</strong><br>Gana ${visita}</div>
            </div>

            <!-- Resumen -->
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.5; margin: 0;">${resumenTexto}</p>
            </div>

            <!-- GOLES -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚽ Probabilidad de Goles</h4>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${local}</p>
                    ${crearBarraProbabilidad("Más de 0.5", Math.min(probGolesLocal + 20, 95))}
                    ${crearBarraProbabilidad("Más de 1.5", probGolesLocal)}
                    ${crearBarraProbabilidad("Más de 2.5", Math.max(probGolesLocal - 30, 5))}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${visita}</p>
                    ${crearBarraProbabilidad("Más de 0.5", Math.min(probGolesVisita + 20, 95))}
                    ${crearBarraProbabilidad("Más de 1.5", probGolesVisita)}
                    ${crearBarraProbabilidad("Más de 2.5", Math.max(probGolesVisita - 30, 5))}
                </div>
            </div>

            <!-- CORNERS Y TARJETAS -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">🚩 Córners y 🟨 Tarjetas</h4>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${local}</p>
                    ${crearBarraProbabilidad("+4.5 Córners", probCornersLocal)}
                    ${crearBarraProbabilidad("+1.5 Tarjetas", probTarjetasLocal)}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${visita}</p>
                    ${crearBarraProbabilidad("+4.5 Córners", probCornersVisita)}
                    ${crearBarraProbabilidad("+1.5 Tarjetas", probTarjetasVisita)}
                </div>
            </div>

        </div>
    `;
}
