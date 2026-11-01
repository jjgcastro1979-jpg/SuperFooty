// ==========================================
// SUPERFOOTY PRO - ANÁLISIS INDIVIDUAL POR EQUIPO
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
    let prob = parseFloat(probabilidad);
    if (isNaN(prob)) prob = 0;
    let color = "#ef4444"; 
    if (prob >= 65) color = "#10b981";
    else if (prob >= 40) color = "#f59e0b";

    return `
        <div style="margin-bottom: 12px;">
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

                return `
                    <div class="match-card" onclick="analizarPartido('${matchId}', '${ligaId}', '${local}', '${visita}', '${fechaInput}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaInfo.nombre}</span>
                            <span class="match-time">⏰ ${hora}</span>
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

async function analizarPartido(matchId, ligaId, local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando estadísticas del partido... ⏳</div>`;

    // --- MOTOR LÓGICO DE ESTADÍSTICAS INDIVIDUALES ---
    const equiposGrandes = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG", "AC Milan", "Juventus"];
    const esLocalTop = equiposGrandes.some(eq => local.includes(eq));
    const esVisitaTop = equiposGrandes.some(eq => visita.includes(eq));

    let pL = 33, pV = 33, pE = 34;
    let pick = "Partido Igualado", color = "#f59e0b";

    // Datos base para simular probabilidades individuales
    let golesL = [80, 60, 35], golesV = [75, 50, 25];
    let cornersL = [75, 55, 35], cornersV = [65, 45, 25];
    let tarjetasL = [85, 60, 35], tarjetasV = [80, 55, 30];

    if (esLocalTop && !esVisitaTop) {
        pL = 65; pV = 15; pE = 20; pick = `Gana ${local}`; color = "#10b981";
        golesL = [90, 75, 55]; golesV = [60, 35, 15];
        cornersL = [85, 70, 50]; cornersV = [55, 35, 20];
        tarjetasL = [70, 45, 25]; tarjetasV = [90, 65, 40]; // El visitante suele hacer más faltas
    } else if (esVisitaTop && !esLocalTop) {
        pL = 15; pV = 65; pE = 20; pick = `Gana ${visita}`; color = "#ef4444";
        golesL = [60, 35, 15]; golesV = [90, 75, 55];
        cornersL = [55, 35, 20]; cornersV = [85, 70, 50];
        tarjetasL = [90, 65, 40]; tarjetasV = [70, 45, 25];
    } else if (esLocalTop && esVisitaTop) {
        pL = 40; pV = 40; pE = 20; pick = "Partido Muy Igualado"; color = "#f59e0b";
        golesL = [85, 65, 45]; golesV = [85, 65, 45];
        cornersL = [75, 55, 35]; cornersV = [75, 55, 35];
        tarjetasL = [80, 55, 30]; tarjetasV = [80, 55, 30];
    }

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <!-- CABECERA -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>
            
            <!-- PICK IA -->
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA (RESULTADO)</p>
                <p style="color: ${color}; font-size: 16px; font-weight: 900;">${pick}</p>
            </div>

            <!-- 1X2 -->
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
                ${crearBarraProbabilidad(`Empate`, pE)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}
            </div>

            <!-- GOLES INDIVIDUALES -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Goles por Equipo</h4>
            <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 12px; color: var(--primary); margin-bottom: 15px;">${local}</p>
                    ${crearBarraProbabilidad("+0.5 Goles", golesL[0])}
                    ${crearBarraProbabilidad("+1.5 Goles", golesL[1])}
                    ${crearBarraProbabilidad("+2.5 Goles", golesL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 12px; color: #ef4444; margin-bottom: 15px;">${visita}</p>
                    ${crearBarraProbabilidad("+0.5 Goles", golesV[0])}
                    ${crearBarraProbabilidad("+1.5 Goles", golesV[1])}
                    ${crearBarraProbabilidad("+2.5 Goles", golesV[2])}
                </div>
            </div>

            <!-- CÓRNERS INDIVIDUALES -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners por Equipo</h4>
            <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 12px; color: var(--primary); margin-bottom: 15px;">${local}</p>
                    ${crearBarraProbabilidad("+3.5 Córners", cornersL[0])}
                    ${crearBarraProbabilidad("+4.5 Córners", cornersL[1])}
                    ${crearBarraProbabilidad("+5.5 Córners", cornersL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 12px; color: #ef4444; margin-bottom: 15px;">${visita}</p>
                    ${crearBarraProbabilidad("+3.5 Córners", cornersV[0])}
                    ${crearBarraProbabilidad("+4.5 Córners", cornersV[1])}
                    ${crearBarraProbabilidad("+5.5 Córners", cornersV[2])}
                </div>
            </div>

            <!-- TARJETAS INDIVIDUALES -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Tarjetas por Equipo</h4>
            <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 12px; color: var(--primary); margin-bottom: 15px;">${local}</p>
                    ${crearBarraProbabilidad("+1.5 Tarjetas", tarjetasL[0])}
                    ${crearBarraProbabilidad("+2.5 Tarjetas", tarjetasL[1])}
                    ${crearBarraProbabilidad("+3.5 Tarjetas", tarjetasL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 12px; color: #ef4444; margin-bottom: 15px;">${visita}</p>
                    ${crearBarraProbabilidad("+1.5 Tarjetas", tarjetasV[0])}
                    ${crearBarraProbabilidad("+2.5 Tarjetas", tarjetasV[1])}
                    ${crearBarraProbabilidad("+3.5 Tarjetas", tarjetasV[2])}
                </div>
            </div>

        </div>
    `;
}
