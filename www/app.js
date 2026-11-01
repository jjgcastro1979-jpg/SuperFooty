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
    let pL = parseFloat(probLocal) || 0;
    let pV = parseFloat(probVisita) || 0;
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
    // Añadimos un aviso para saber si el botón funciona
    console.log("Botón pulsado. Iniciando búsqueda...");
    
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = `<div class='loader'>Buscando partidos... ⏳</div>`;

    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasAPI[ligaId];
    const fechaInput = document.getElementById('date-select').value;

    if (!ligaInfo) {
        listaDiv.innerHTML = `<p style='text-align:center; color:red;'>Liga no configurada.</p>`;
        return;
    }

    const fechaFormateada = fechaInput.replace(/-/g, '');

    try {
        const url = `https://worldcup26.ir/get/soccer/${ligaInfo.slug}/scoreboard?dates=${fechaFormateada}`;
        const response = await fetch(url);
        const data = await response.json();
        const partidos = data.events || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.map(match => {
                const local = match.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName;
                const visita = match.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName;
                const hora = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                // Obtener resultados si existen
                const scoreHome = match.competitions[0].competitors.find(c => c.homeAway === 'home').score;
                const scoreAway = match.competitions[0].competitors.find(c => c.homeAway === 'away').score;
                const esFinalizado = scoreHome !== undefined && scoreHome !== null;

                let displayTime = `⏰ ${hora}`;
                let extraBadge = "";
                if (esFinalizado) {
                    displayTime = `<span style="color: #ef4444; font-weight: 900; font-size: 14px;">${scoreHome} - ${scoreAway}</span>`;
                    extraBadge = `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Finalizado</span>`;
                }

                return `
                    <div class="match-card" onclick="analizarPartido('${match.id}', '${local}', '${visita}', '${scoreHome}', '${scoreAway}')">
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px;'>No hay partidos programados.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error de conexión con la API.</p>`;
    }
}

function analizarPartido(matchId, local, visita, scoreHome, scoreAway) {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = `<div class='loader'>Calculando análisis... ⏳</div>`;

    // Simulación de datos (Idéntico a lo que teníamos)
    let pL = 45, pE = 25, pV = 30;
    let pick = `Gana ${local}`, color = "#10b981";
    let bttsYes = 55;
    let over25 = 60;
    
    const esFinalizado = scoreHome !== 'null' && scoreHome !== 'undefined' && scoreAway !== 'null' && scoreAway !== 'undefined';
    let cajaResultado = "";

    if (esFinalizado) {
        const gH = parseInt(scoreHome);
        const gA = parseInt(scoreAway);
        let acierto = false;
        
        if (gH > gA && pick.includes(`Gana ${local}`)) acierto = true;
        else if (gH === gA && pick === "Empate") acierto = true;
        else if (gH < gA && pick.includes(`Gana ${visita}`)) acierto = true;

        cajaResultado = acierto ? 
            `<div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;"><h3 style="color: #065f46; margin:0;">✅ PREDICCIÓN ACERTADA</h3><p style="color: #065f46; margin: 5px 0 0 0;">Resultado: ${gH} - ${gA}</p></div>` :
            `<div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;"><h3 style="color: #991b1b; margin:0;">❌ PREDICCIÓN FALLIDA</h3><p style="color: #991b1b; margin: 5px 0 0 0;">Resultado: ${gH} - ${gA}</p></div>`;
    } else {
        cajaResultado = `<div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;"><h3 style="color: #1d4ed8; margin:0;">⏳ PARTIDO PENDIENTE</h3></div>`;
    }

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card">
            <h3 style="text-align:center; margin-bottom: 15px;">${local} vs ${visita}</h3>
            ${cajaResultado}
            
            <div style="background: #0f172a; padding: 15px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <p style="color: #94a3b8; margin:0 0 5px 0; font-size:12px;">RECOMENDACIÓN IA</p>
                <p style="color: ${color}; font-size: 18px; font-weight: bold; margin:0;">${pick}</p>
            </div>

            <h4 style="color: var(--primary); margin-bottom: 10px;">Probabilidades 1X2</h4>
            ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
            ${crearBarraProbabilidad(`Empate`, pE)}
            ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}

            <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">Goles Totales</h4>
            ${crearBarraProbabilidad("Ambos Equipos Marcan (SÍ)", bttsYes)}
            ${crearBarraProbabilidad("Más de 2.5 Goles", over25)}
        </div>
    `;
}
