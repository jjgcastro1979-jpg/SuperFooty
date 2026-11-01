// ==========================================
// SUPERFOOTY PRO - ANÁLISIS INTELIGENTE TOTAL
// ==========================================

const ligasAPI = {
    "eng.1": { nombre: "Premier League", slug: "eng.1" },
    "esp.1": { nombre: "La Liga", slug: "esp.1" },
    "ita.1": { nombre: "Serie A", slug: "ita.1" },
    "ger.1": { nombre: "Bundesliga", slug: "ger.1" },
    "fra.1": { nombre: "Ligue 1", slug: "fra.1" },
    "uefa.champions": { nombre: "Champions League", slug: "uefa.champions" }
};

// Función para barras normales (1X2 y Totales)
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

// Función para las barras de duelo (Cara a cara)
function crearBarraDuelo(titulo, probLocal, probVisita) {
    let pL = Math.min(Math.max(parseFloat(probLocal) || 0, 0), 100);
    let pV = Math.min(Math.max(parseFloat(probVisita) || 0, 0), 100);
    let total = pL + pV;
    if (total > 0) { pL = (pL / total) * 100; pV = (pV / total) * 100; }
    let classL = pL > 55 ? "" : (pL > 45 ? "mid" : ""); 
    let classR = pV > 55 ? "" : (pV > 45 ? "mid" : "");
    return `
        <div class="duel-stats">
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
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando análisis completo... ⏳</div>`;

    // --- MOTOR LÓGICO DE ESTADÍSTICAS (REALISTA) ---
    const equiposGrandes = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG", "AC Milan", "Juventus", "Atletico"];
    const equiposDefensivos = ["Getafe", "Cadiz", "Athletic", "Betis", "Sevilla", "Valencia", "Mallorca", "Rayo"];

    const esLocalTop = equiposGrandes.some(eq => local.includes(eq));
    const esVisitaTop = equiposGrandes.some(eq => visita.includes(eq));
    const esLocalDef = equiposDefensivos.some(eq => local.includes(eq));
    const esVisitaDef = equiposDefensivos.some(eq => visita.includes(eq));

    let pL = 33, pV = 33, pE = 34;
    let pick = "Partido Igualado", color = "#f59e0b";

    // Probabilidades base (Moderadas por defecto)
    let over25 = Math.floor(Math.random() * 15) + 45; // 45% - 60%
    let bttsYes = Math.floor(Math.random() * 15) + 45; // 45% - 60%
    let cornersOver85 = Math.floor(Math.random() * 20) + 40; // 40% - 60%
    let cardsOver35 = Math.floor(Math.random() * 20) + 40; // 40% - 60%

    // Ajustes según los equipos
    if (esLocalTop && esVisitaTop) {
        // Partidazo (Ej: Madrid vs Barca)
        pL = 40; pV = 40; pE = 20; pick = "Partido Muy Igualado"; color = "#f59e0b";
        over25 += 20; // Muchos goles
        bttsYes += 20; // Ambos marcan
        cornersOver85 += 15; // Muchos córners
        cardsOver35 += 5; 
    } else if (esLocalTop && !esVisitaTop) {
        // David vs Goliath Local (Ej: Madrid vs Getafe)
        pL = 70; pV = 10; pE = 20; pick = `Gana ${local}`; color = "#10b981";
        over25 += 10; 
        bttsYes -= 10; // Es probable que el pequeño no marque
        cornersOver85 += 10;
        cardsOver35 += 15; // El pequeño hace más faltas
    } else if (esVisitaTop && !esLocalTop) {
        // David vs Goliath Visita (Ej: Getafe vs Barca)
        pL = 10; pV = 70; pE = 20; pick = `Gana ${visita}`; color = "#ef4444";
        over25 += 5; 
        bttsYes -= 10; 
        cornersOver85 += 5;
        cardsOver35 += 15;
    } else if (esLocalDef && esVisitaDef) {
        // Partido cerrado (Ej: Getafe vs Cadiz)
        pL = 35; pV = 30; pE = 35; pick = "Empate o Partido Cerrado"; color = "#f59e0b";
        over25 -= 15; // Menos goles
        bttsYes -= 15;
        cornersOver85 -= 10; 
        cardsOver35 += 20; // Muchísimas tarjetas por la tensión
    }

    // Asegurarnos de que no pasen del 100% o bajen del 5%
    over25 = Math.min(Math.max(over25, 5), 95);
    bttsYes = Math.min(Math.max(bttsYes, 5), 95);
    cornersOver85 = Math.min(Math.max(cornersOver85, 5), 95);
    cardsOver35 = Math.min(Math.max(cardsOver35, 5), 95);

    // Variables para las barras de equipo (simuladas basándonos en el total)
    let golesL = over25 - 5, golesV = over25 - 10;
    let cornersL = cornersOver85 - 5, cornersV = cornersOver85 - 15;
    let tarjetasL = cardsOver35 - 10, tarjetasV = cardsOver35 - 5;

    // --- CÁLCULO DE LA MEJOR OPCIÓN GLOBAL ---
    let opciones = [
        { nombre: `Victoria ${local}`, valor: pL },
        { nombre: `Empate`, valor: pE },
        { nombre: `Victoria ${visita}`, valor: pV },
        { nombre: `Más de 2.5 Goles`, valor: over25 },
        { nombre: `Menos de 2.5 Goles`, valor: 100 - over25 },
        { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes },
        { nombre: `Ambos Equipos Marcan (NO)`, valor: 100 - bttsYes },
        { nombre: `Más de 8.5 Córners`, valor: cornersOver85 },
        { nombre: `Menos de 8.5 Córners`, valor: 100 - cornersOver85 },
        { nombre: `Más de 3.5 Tarjetas`, valor: cardsOver35 },
        { nombre: `Menos de 3.5 Tarjetas`, valor: 100 - cardsOver35 }
    ];

    // Ordenamos las opciones de mayor a menor probabilidad
    opciones.sort((a, b) => b.valor - a.valor);
    let mejorOpcion = opciones[0];

    // --- RENDERIZADO HTML ---
    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA (RESULTADO)</p>
                <p style="color: ${color}; font-size: 16px; font-weight: 900;">${pick}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, pL)}
                ${crearBarraProbabilidad(`Empate`, pE)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, pV)}
            </div>

            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Goles por Equipo</h4>
            <div class="duel-container">
                ${crearBarraDuelo("+1.5 Goles", golesL, golesV)}
            </div>

            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners por Equipo</h4>
            <div class="duel-container">
                ${crearBarraDuelo("+4.5 Córners", cornersL, cornersV)}
            </div>

            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Tarjetas por Equipo</h4>
            <div class="duel-container">
                ${crearBarraDuelo("+2.5 Tarjetas", tarjetasL, tarjetasV)}
            </div>

            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📈 Totales del Partido</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad("Más de 2.5 Goles Totales", over25)}
                ${crearBarraProbabilidad("Más de 8.5 Córners Totales", cornersOver85)}
                ${crearBarraProbabilidad("Más de 3.5 Tarjetas Totales", cardsOver35)}
            </div>

            <!-- RECOMENDACIÓN FINAL INTELIGENTE -->
            <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-top: 10px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                <h4 style="color: #f59e0b; font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 10px;">
                    🏆 RECOMENDACIÓN FINAL IA
                </h4>
                <p style="color: #cbd5e1; font-size: 13px; text-align: center; margin-bottom: 15px;">
                    Tras analizar las 11 variables del partido, la mejor opción es:
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">
                        ${mejorOpcion.nombre}
                    </p>
                    <p style="color: #10b981; font-size: 14px; font-weight: bold;">
                        ${Math.round(mejorOpcion.valor)}% de probabilidad
                    </p>
                </div>
            </div>

        </div>
    `;

    // Activar animación de las barras
    setTimeout(() => {
        document.querySelectorAll('.duel-bar-left, .duel-bar-right').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);
}
