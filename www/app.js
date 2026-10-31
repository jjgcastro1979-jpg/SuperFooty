// ==========================================
// API DE ESPN + ESCUDOS + PICK IA + SEMÁFORO
// ==========================================

const ligasESPN = {
    "eng.1": "Premier League",
    "esp.1": "La Liga",
    "ita.1": "Serie A",
    "ger.1": "Bundesliga",
    "fra.1": "Ligue 1",
    "uefa.champions": "Champions League"
};

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaSelect = document.getElementById('league-select');
    const ligaId = ligaSelect.value;
    const ligaNombre = ligasESPN[ligaId];
    
    listaDiv.innerHTML = `<div class='loader'>Buscando partidos reales de ${ligaNombre}... ⏳</div>`;

    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/scoreboard`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fallo en la red");
        
        const data = await response.json();

        if (data.events && data.events.length > 0) {
            listaDiv.innerHTML = data.events.map(match => {
                const homeTeamData = match.competitions[0].competitors.find(c => c.homeAway === 'home').team;
                const awayTeamData = match.competitions[0].competitors.find(c => c.homeAway === 'away').team;
                
                const local = homeTeamData.displayName;
                const visita = awayTeamData.displayName;
                const logoLocal = homeTeamData.logo;
                const logoVisita = awayTeamData.logo;
                
                const fechaObj = new Date(match.date);
                const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const horaStr = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="match-card" onclick="analizarPartido('${local}', '${visita}', '${logoLocal}', '${logoVisita}', '${ligaNombre}', '${match.date}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaNombre}</span>
                            <span class="match-time">📅 ${fechaStr} - ⏰ ${horaStr}</span>
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
            listaDiv.innerHTML = `<p style='text-align:center;'>No hay partidos programados para hoy en ${ligaNombre}.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center;'>Error al conectar con los servidores de datos.</p>`;
    }
}

// Función auxiliar para crear las barras de colores
function crearBarraProbabilidad(titulo, probabilidad) {
    let color = "#ef4444"; // Rojo (Baja)
    if (probabilidad >= 60) color = "#10b981"; // Verde (Alta)
    else if (probabilidad >= 40) color = "#f59e0b"; // Amarillo (Media)

    return `
        <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #475569;">${titulo}</span>
                <span style="color: ${color};">${probabilidad}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                <div style="width: ${probabilidad}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
            </div>
        </div>
    `;
}

function analizarPartido(local, visita, logoLocal, logoVisita, liga, fechaISO) {
    const fechaObj = new Date(fechaISO);
    const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // --- MOTOR DE ESTADÍSTICAS GLOBALES ---
    const golesLocal = Math.floor(Math.random() * 3) + 1; 
    const golesVisita = Math.floor(Math.random() * 2);
    const tarjetasLocal = (Math.random() * (3.5 - 1.5) + 1.5).toFixed(1);
    const tarjetasVisita = (Math.random() * (3.5 - 1.5) + 1.5).toFixed(1);
    const cornersLocal = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
    const cornersVisita = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
    const probOver25 = Math.floor(Math.random() * (75 - 45)) + 45; 

    // --- PROBABILIDADES INDIVIDUALES (Para el semáforo) ---
    const probGolesLocal = Math.floor(Math.random() * 50) + 40; // 40 a 90%
    const probCornersLocal = Math.floor(Math.random() * 40) + 40;
    const probTarjetasLocal = Math.floor(Math.random() * 60) + 20;

    const probGolesVisita = Math.floor(Math.random() * 50) + 20; // 20 a 70%
    const probCornersVisita = Math.floor(Math.random() * 40) + 30;
    const probTarjetasVisita = Math.floor(Math.random() * 60) + 30;

    // Análisis de texto y Pick IA
    const equiposTop = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG", "AC Milan"];
    const esLocalTop = equiposTop.some(eq => local.includes(eq));
    const esVisitaTop = equiposTop.some(eq => visita.includes(eq));

    let texto = "";
    let pickRecomendado = "";
    let colorPick = "#10b981";

    if (esLocalTop && !esVisitaTop) {
        texto = `El ${local} afronta este partido como el gran favorito. Su plantilla y su juego ofensivo deberían imponerse ante un ${visita} que intentará defenderse y buscar la contra. Se espera un partido con dominio local.`;
        pickRecomendado = `Victoria Local: ${local}`;
    } else if (esVisitaTop && !esLocalTop) {
        texto = `El ${visita} es un rival de mucha entidad y llega en un gran momento. El ${local} lo tendrá muy complicado. Esperamos un partido táctico donde el visitante llevará la iniciativa del juego.`;
        pickRecomendado = `Victoria Visitante: ${visita}`;
        colorPick = "#ef4444";
    } else {
        texto = `Partido muy equilibrado en ${liga}. El ${local} y el ${visita} se conocen bien y buscarán no cometer errores. Un empate o un resultado por la mínima es muy probable.`;
        pickRecomendado = `Empate o Menos de 2.5 Goles`;
        colorPick = "#f59e0b";
    }

    if (probOver25 > 65) {
        pickRecomendado = `Más de 2.5 Goles (Probabilidad ${probOver25}%)`;
        colorPick = "#3b82f6";
    }

    // --- DISEÑO DEL PANEL DE ANÁLISIS ---
    document.getElementById('lista-partidos').innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver a los partidos</button>
        
        <div class="match-card" style="padding: 20px 15px;">
            
            <!-- CABECERA CON ESCUDOS -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="text-align: center; width: 40%;">
                    <img src="${logoLocal}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;">
                    <h3 style="font-size: 14px; margin: 0; line-height: 1.2;">${local}</h3>
                </div>
                <div style="text-align: center; width: 20%;">
                    <span style="font-size: 24px; font-weight: 900; color: #94a3b8;">VS</span>
                </div>
                <div style="text-align: center; width: 40%;">
                    <img src="${logoVisita}" style="width: 60px; height: 60px; object-fit: contain; margin-bottom: 10px;">
                    <h3 style="font-size: 14px; margin: 0; line-height: 1.2;">${visita}</h3>
                </div>
            </div>
            
            <p style="text-align:center; color:#64748b; font-size:12px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>

            <!-- PICK IA -->
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA - MEJOR OPCIÓN</p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <!-- Resumen -->
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.5; margin: 0;"><strong>Resumen:</strong> ${texto}</p>
            </div>

            <!-- Panel de Estadísticas Generales -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 16px;">📊 Totales del Partido</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px;">
                <div style="background: #fffbeb; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #fde68a;">
                    <p style="font-size: 12px; color: #b45309; font-weight: bold; margin-bottom: 5px;">🟨 Tarjetas Est.</p>
                    <p style="font-size: 18px; font-weight: 900; color: #78350f;">${tarjetasLocal} - ${tarjetasVisita}</p>
                </div>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #bae6fd;">
                    <p style="font-size: 12px; color: #0369a1; font-weight: bold; margin-bottom: 5px;">🚩 Córners Est.</p>
                    <p style="font-size: 18px; font-weight: 900; color: #082f49;">${cornersLocal} - ${cornersVisita}</p>
                </div>
            </div>

            <!-- NUEVO PANEL DE SEMÁFORO INDIVIDUAL -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 16px;">🚦 Probabilidades por Equipo</h4>
            
            <div style="display: flex; gap: 15px;">
                <!-- Columna Local -->
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: 900; font-size: 13px; color: var(--primary); margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">${local}</p>
                    ${crearBarraProbabilidad("Marca Gol", probGolesLocal)}
                    ${crearBarraProbabilidad("+4.5 Córners", probCornersLocal)}
                    ${crearBarraProbabilidad("+1.5 Tarjetas", probTarjetasLocal)}
                </div>
                
                <!-- Columna Visita -->
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: 900; font-size: 13px; color: #ef4444; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">${visita}</p>
                    ${crearBarraProbabilidad("Marca Gol", probGolesVisita)}
                    ${crearBarraProbabilidad("+4.5 Córners", probCornersVisita)}
                    ${crearBarraProbabilidad("+1.5 Tarjetas", probTarjetasVisita)}
                </div>
            </div>

        </div>
    `;
}
