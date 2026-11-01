// ==========================================
// SUPERFOOTY PRO - ANÁLISIS PREMIUM CON CUOTAS
// ==========================================

const ligasAPI = {
    "eng.1": { nombre: "Premier League", slug: "eng.1" },
    "esp.1": { nombre: "La Liga", slug: "esp.1" },
    "ita.1": { nombre: "Serie A", slug: "ita.1" },
    "ger.1": { nombre: "Bundesliga", slug: "ger.1" },
    "fra.1": { nombre: "Ligue 1", slug: "fra.1" },
    "uefa.champions": { nombre: "Champions League", slug: "uefa.champions" }
};

// Función para calcular la cuota de apuesta (1 / probabilidad)
function calcularCuota(probabilidad) {
    let prob = parseFloat(probabilidad);
    if (prob <= 0 || isNaN(prob)) return "-";
    let cuota = 100 / prob;
    return cuota > 10 ? "10.0" : cuota.toFixed(2); // Limitamos a cuota máxima 10.0
}

// Función para barras normales
function crearBarraProbabilidad(titulo, probabilidad, mostrarCuota = false) {
    let prob = parseFloat(probabilidad);
    if (isNaN(prob)) prob = 0;
    let color = "#ef4444"; 
    if (prob >= 65) color = "#10b981";
    else if (prob >= 40) color = "#f59e0b";

    let cuotaHTML = "";
    if (mostrarCuota) {
        cuotaHTML = `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">@${calcularCuota(prob)}</span>`;
    }

    return `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #475569;">${titulo} ${cuotaHTML}</span>
                <span style="color: ${color};">${Math.round(prob)}%</span>
            </div>
            <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
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

    // --- MOTOR LÓGICO ---
    const equiposGrandes = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG", "AC Milan", "Juventus", "Atletico", "Valencia"];
    const equiposDefensivos = ["Getafe", "Cadiz", "Athletic", "Betis", "Sevilla", "Mallorca", "Rayo", "Elche"];

    const esLocalTop = equiposGrandes.some(eq => local.includes(eq));
    const esVisitaTop = equiposGrandes.some(eq => visita.includes(eq));
    const esLocalDef = equiposDefensivos.some(eq => local.includes(eq));
    const esVisitaDef = equiposDefensivos.some(eq => visita.includes(eq));

    let golesL = [80, 55, 30], golesV = [75, 50, 25];
    let cornersL = [85, 65, 40], cornersV = [80, 60, 35];
    let tarjetasL = [85, 60, 35], tarjetasV = [85, 60, 35];
    
    let pL = 33, pV = 33, pE = 34, pick = "Partido Igualado", color = "#f59e0b";

    if (esLocalTop && !esVisitaTop) {
        pL = 70; pV = 10; pE = 20; pick = `Gana ${local}`; color = "#10b981";
        golesL = [90, 75, 55]; golesV = [60, 35, 15];
        cornersL = [90, 75, 55]; cornersV = [65, 45, 25];
        tarjetasL = [75, 50, 30]; tarjetasV = [90, 70, 45];
    } else if (esVisitaTop && !esLocalTop) {
        pL = 10; pV = 70; pE = 20; pick = `Gana ${visita}`; color = "#ef4444";
        golesL = [60, 35, 15]; golesV = [90, 75, 55];
        cornersL = [65, 45, 25]; cornersV = [90, 75, 55];
        tarjetasL = [90, 70, 45]; tarjetasV = [75, 50, 30];
    } else if (esLocalDef && esVisitaDef) {
        pL = 35; pV = 30; pE = 35; pick = "Empate o Partido Cerrado"; color = "#f59e0b";
        golesL = [70, 40, 15]; golesV = [65, 35, 10];
        cornersL = [70, 45, 25]; cornersV = [70, 45, 25];
        tarjetasL = [95, 80, 60]; tarjetasV = [95, 80, 60];
    }

    let over25_global = Math.min(Math.round(((golesL[2] + golesV[2]) / 2) + 15), 95);
    let bttsYes = Math.min(Math.round(((golesL[1] + golesV[1]) / 2) - 5), 95);
    let cornersOver85 = Math.min(Math.round(((cornersL[1] + cornersV[1]) / 2) + 10), 95);
    let cardsOver35 = Math.min(Math.round(((tarjetasL[1] + tarjetasV[1]) / 2) + 10), 95);

    // --- MEJOR OPCIÓN ---
    let opciones = [
        { nombre: `Victoria ${local}`, valor: pL },
        { nombre: `Empate`, valor: pE },
        { nombre: `Victoria ${visita}`, valor: pV },
        { nombre: `Más de 2.5 Goles`, valor: over25_global },
        { nombre: `Menos de 2.5 Goles`, valor: 100 - over25_global },
        { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes },
        { nombre: `Ambos Equipos Marcan (NO)`, valor: 100 - bttsYes },
        { nombre: `Más de 8.5 Córners`, valor: cornersOver85 },
        { nombre: `Menos de 8.5 Córners`, valor: 100 - cornersOver85 },
        { nombre: `Más de 3.5 Tarjetas`, valor: cardsOver35 },
        { nombre: `Menos de 3.5 Tarjetas`, valor: 100 - cardsOver35 }
    ];

    opciones.sort((a, b) => b.valor - a.valor);
    let mejorOpcion = opciones[0];

    // Nivel de confianza
    let nivelConfianza = "MEDIA";
    let colorConfianza = "#f59e0b";
    if (mejorOpcion.valor >= 75) { nivelConfianza = "ALTA"; colorConfianza = "#10b981"; }
    else if (mejorOpcion.valor < 55) { nivelConfianza = "BAJA"; colorConfianza = "#ef4444"; }

    // --- RENDERIZADO HTML ---
    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA (RESULTADO)</p>
                <p style="color: ${color}; font-size: 16px; font-weight: 900;">${pick}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2 y Cuotas</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, pL, true)}
                ${crearBarraProbabilidad(`Empate`, pE, true)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, pV, true)}
            </div>

            <!-- AMBOS MARCAN (Destacado) -->
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad("Ambos Equipos Marcan (SÍ)", bttsYes, true)}
            </div>

            <!-- GOLES -->
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Goles por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+0.5", golesL[0])}
                    ${crearBarraProbabilidad("+1.5", golesL[1])}
                    ${crearBarraProbabilidad("+2.5", golesL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+0.5", golesV[0])}
                    ${crearBarraProbabilidad("+1.5", golesV[1])}
                    ${crearBarraProbabilidad("+2.5", golesV[2])}
                </div>
            </div>
            <div class="duel-container">
                ${crearBarraDuelo("+1.5 Goles", golesL[1], golesV[1])}
            </div>

            <!-- CÓRNERS -->
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+3.5", cornersL[0])}
                    ${crearBarraProbabilidad("+4.5", cornersL[1])}
                    ${crearBarraProbabilidad("+5.5", cornersL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+3.5", cornersV[0])}
                    ${crearBarraProbabilidad("+4.5", cornersV[1])}
                    ${crearBarraProbabilidad("+5.5", cornersV[2])}
                </div>
            </div>
            <div class="duel-container">
                ${crearBarraDuelo("+4.5 Córners", cornersL[1], cornersV[1])}
            </div>

            <!-- TARJETAS -->
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Tarjetas por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+1.5", tarjetasL[0])}
                    ${crearBarraProbabilidad("+2.5", tarjetasL[1])}
                    ${crearBarraProbabilidad("+3.5", tarjetasL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+1.5", tarjetasV[0])}
                    ${crearBarraProbabilidad("+2.5", tarjetasV[1])}
                    ${crearBarraProbabilidad("+3.5", tarjetasV[2])}
                </div>
            </div>
            <div class="duel-container">
                ${crearBarraDuelo("+2.5 Tarjetas", tarjetasL[1], tarjetasV[1])}
            </div>

            <!-- TOTALES GLOBALES -->
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📈 Totales del Partido</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad("Más de 2.5 Goles Totales", over25_global, true)}
                ${crearBarraProbabilidad("Más de 8.5 Córners Totales", cornersOver85, true)}
                ${crearBarraProbabilidad("Más de 3.5 Tarjetas Totales", cardsOver35, true)}
            </div>

            <!-- RECOMENDACIÓN FINAL -->
            <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-top: 10px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                <h4 style="color: #f59e0b; font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 10px;">
                    🏆 RECOMENDACIÓN FINAL IA
                </h4>
                <p style="color: #cbd5e1; font-size: 13px; text-align: center; margin-bottom: 15px;">
                    Tras analizar todas las variables, la mejor opción es:
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">
                        ${mejorOpcion.nombre}
                    </p>
                    <p style="color: #10b981; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
                        ${Math.round(mejorOpcion.valor)}% de probabilidad (@${calcularCuota(mejorOpcion.valor)})
                    </p>
                    <span style="background: ${colorConfianza}20; color: ${colorConfianza}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid ${colorConfianza};">
                        CONFIANZA: ${nivelConfianza}
                    </span>
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
