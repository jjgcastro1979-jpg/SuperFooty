// ==========================================
// SUPERFOOTY PRO - VERSIÓN LIGERA Y ESTABLE
// ==========================================

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
    const fechaInput = document.getElementById('date-select').value;

    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos del ${fechaInput}... ⏳</div>`;

    try {
        // Buscamos los partidos en el archivo de GitHub para 2026-27
        const url = `https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/${ligaId}.json`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Temporada no encontrada");
        const data = await response.json();
        
        // Filtramos por la fecha elegida
        const partidosDelDia = data.matches.filter(m => m.date === fechaInput);

        if (partidosDelDia.length > 0) {
            listaDiv.innerHTML = partidosDelDia.map(m => {
                const matchId = `${m.date}-${m.team1}-${m.team2}`;
                const hora = m.time ? m.time.split(' ')[0] : '20:00';
                return `
                    <div class="match-card" onclick="analizarPartido('${m.team1}', '${m.team2}', '${fechaInput}')">
                        <div class="match-header">
                            <span class="league-badge">Partido</span>
                            <span class="match-time">⏰ ${hora}</span>
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos programados para el ${fechaInput} (o el archivo de 2026-27 aún no se ha subido en GitHub).</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>La API de GitHub aún no tiene los datos de la temporada 2026-27, o no tienes conexión.</p>`;
    }
}

function analizarPartido(local, visita, fecha) {
    const listaDiv = document.getElementById('lista-partidos');
    
    // Motor local de análisis
    let pL = 45, pE = 25, pV = 30;
    let golesL = [80, 60, 35], golesV = [75, 50, 25];
    let cornersL = [85, 65, 40], cornersV = [80, 60, 35];
    let tarjetasL = [85, 60, 35], tarjetasV = [85, 60, 35];
    
    if (local.includes("Real Madrid") || local.includes("Barcelona")) { pL = 70; pV = 10; pE = 20; }
    if (visita.includes("Real Madrid") || visita.includes("Barcelona")) { pL = 10; pV = 70; pE = 20; }

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA</p>
                <p style="color: #10b981; font-size: 16px; font-weight: 900;">Gana ${pL > pV ? local : visita}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 1X2</h4>
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
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+0.5", golesV[0])}
                    ${crearBarraProbabilidad("+1.5", golesV[1])}
                </div>
            </div>
            <div class="duel-container">
                ${crearBarraDuelo("+1.5 Goles", golesL[1], golesV[1])}
            </div>
            
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners</h4>
            <div class="duel-container">
                ${crearBarraDuelo("+4.5 Córners", cornersL[1], cornersV[1])}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Tarjetas</h4>
            <div class="duel-container">
                ${crearBarraDuelo("+2.5 Tarjetas", tarjetasL[1], tarjetasV[1])}
            </div>
        </div>
    `;
    
    setTimeout(() => {
        document.querySelectorAll('.duel-bar-left, .duel-bar-right').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);
}
