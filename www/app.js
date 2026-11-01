// ==========================================
// SUPERFOOTY PRO - DATOS REALES 2026/27 (openfootball)
// ==========================================

// Mapeo de nuestras ligas a los archivos JSON de openfootball
const ligasOpenFootball = {
    "eng.1": { nombre: "Premier League", archivo: "en.1.json" },
    "esp.1": { nombre: "La Liga", archivo: "es.1.json" },
    "ita.1": { nombre: "Serie A", archivo: "it.1.json" },
    "ger.1": { nombre: "Bundesliga", archivo: "de.1.json" },
    "fra.1": { nombre: "Ligue 1", archivo: "fr.1.json" }
};

// Función para calcular la forma y los goles de un equipo
function calcularEstadisticasEquipo(nombreEquipo, partidos) {
    // Filtramos los partidos que ya se han jugado (que tienen 'score' con 'ft')
    const jugados = partidos.filter(p => 
        p.score && p.score.ft && p.score.ft.length === 2
    );

    // Filtramos los partidos de este equipo
    const partidosEquipo = jugados.filter(p => 
        p.team1 === nombreEquipo || p.team2 === nombreEquipo
    );

    // Cogemos los últimos 5 (los más recientes)
    const ultimos5 = partidosEquipo.slice(-5);

    if (ultimos5.length === 0) {
        return { formaStr: "Sin datos", mediaFavor: "0.0", mediaContra: "0.0", victorias: 0 };
    }

    let forma = [];
    let gfTotal = 0, gcTotal = 0;
    let victorias = 0;

    ultimos5.forEach(p => {
        const esLocal = p.team1 === nombreEquipo;
        const gf = esLocal ? p.score.ft[0] : p.score.ft[1];
        const gc = esLocal ? p.score.ft[1] : p.score.ft[0];

        gfTotal += gf;
        gcTotal += gc;

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

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasOpenFootball[ligaId];

    if (!ligaInfo) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Liga no soportada por openfootball.</p>`;
        return;
    }

    listaDiv.innerHTML = `<div class='loader'>Cargando partidos reales de ${ligaInfo.nombre} 2026/27... ⏳</div>`;

    try {
        // URL raw de GitHub (sin CORS, sin claves)
        const url = `https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/${ligaInfo.archivo}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.matches || data.matches.length === 0) {
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px;'>No hay partidos en el archivo de esta temporada.</p>`;
            return;
        }

        // Filtramos los partidos que aún NO se han jugado (sin score)
        const partidosFuturos = data.matches.filter(p => !p.score || !p.score.ft);

        if (partidosFuturos.length === 0) {
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px;'>La temporada ya ha terminado o no hay partidos futuros.</p>`;
            return;
        }

        // Mostramos los partidos futuros (puedes limitar a los 10 primeros para no saturar)
        const proximos = partidosFuturos.slice(0, 10);

        listaDiv.innerHTML = proximos.map(match => {
            // Generamos un ID único para el partido (usando fecha y equipos)
            const matchId = btoa(`${match.date}-${match.team1}-${match.team2}`).replace(/=/g, '');

            return `
                <div class="match-card" onclick="analizarPartido('${matchId}', '${ligaId}', '${match.team1}', '${match.team2}', '${match.date}')">
                    <div class="match-header">
                        <span class="league-badge">${ligaInfo.nombre}</span>
                        <span class="match-time">📅 ${match.date} - ⏰ ${match.time || '20:00'}</span>
                    </div>
                    <div class="teams-row">
                        <div class="team-name">${match.team1}</div>
                        <div class="vs-badge">VS</div>
                        <div class="team-name right">${match.team2}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error al cargar los datos desde GitHub.</p>`;
        console.error(error);
    }
}

async function analizarPartido(matchId, ligaId, local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    
    listaDiv.innerHTML = `<div class='loader'>🧠 Analizando datos de la temporada 2026/27... ⏳</div>`;

    try {
        const ligaInfo = ligasOpenFootball[ligaId];
        const url = `https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/${ligaInfo.archivo}`;
        const response = await fetch(url);
        const data = await response.json();

        // 1. Calcular estadísticas reales de ambos equipos
        const statsLocal = calcularEstadisticasEquipo(local, data.matches);
        const statsVisita = calcularEstadisticasEquipo(visita, data.matches);

        // 2. Calcular probabilidades simples basadas en la forma
        let pL = 33, pV = 33, pE = 34;

        // Usamos una fuerza basada en victorias y goles a favor
        let fuerzaLocal = statsLocal.victorias + parseFloat(statsLocal.mediaFavor);
        let fuerzaVisita = statsVisita.victorias + parseFloat(statsVisita.mediaFavor);
        let totalFuerza = fuerzaLocal + fuerzaVisita;

        if (totalFuerza > 0) {
            pL = Math.round((fuerzaLocal / totalFuerza) * 70) + 15;
            pV = Math.round((fuerzaVisita / totalFuerza) * 70) + 15;
            pE = 100 - pL - pV;
        }

        // 3. Determinar el Pick
        let pickRecomendado = "Partido Igualado";
        let colorPick = "#f59e0b";

        if (pL > pV + 10) { pickRecomendado = `Gana ${local} (${pL}%)`; colorPick = "#10b981"; }
        else if (pV > pL + 10) { pickRecomendado = `Gana ${visita} (${pV}%)`; colorPick = "#ef4444"; }

        // 4. Resumen
        let resumenTexto = `
            <strong>${local}:</strong> Forma [${statsLocal.formaStr}]. Marca ${statsLocal.mediaFavor} goles/partido.<br><br>
            <strong>${visita}:</strong> Forma [${statsVisita.formaStr}]. Marca ${statsVisita.mediaFavor} goles/partido.
        `;

        // 5. Renderizar (diseño idéntico al que te gusta)
        listaDiv.innerHTML = `
            <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
            <div class="match-card" style="padding: 20px 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                    <div style="text-align: center; width: 20%;"><span style="font-size: 24px; font-weight: 900; color: #94a3b8;">VS</span></div>
                    <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
                </div>
                <p style="text-align:center; color:#64748b; font-size:12px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>
                
                <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PREDICCIÓN</p>
                    <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
                </div>

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">📊 Probabilidades</h4>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
                    ${crearBarraProbabilidad(`Empate`, pE)}
                    ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}
                </div>

                <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">🔥 Forma Reciente (2026/27)</h4>
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
            </div>
        `;

    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error al analizar el partido.</p>`;
        console.error(error);
    }
}

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
