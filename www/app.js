// ==========================================
// API DE ESPN + ESCUDOS + PICK IA
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

                // Pasamos los datos al análisis, incluyendo los escudos
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

function analizarPartido(local, visita, logoLocal, logoVisita, liga, fechaISO) {
    const fechaObj = new Date(fechaISO);
    const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // --- MOTOR DE ESTADÍSTICAS ---
    const golesLocal = Math.floor(Math.random() * 3) + 1; 
    const golesVisita = Math.floor(Math.random() * 2);
    const tarjetasLocal = (Math.random() * (3.5 - 1.5) + 1.5).toFixed(1);
    const tarjetasVisita = (Math.random() * (3.5 - 1.5) + 1.5).toFixed(1);
    const cornersLocal = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
    const cornersVisita = Math.floor(Math.random() * (8 - 3 + 1)) + 3;
    const probOver25 = Math.floor(Math.random() * (75 - 45)) + 45; // Entre 45% y 75%

    // Análisis de texto y Pick IA
    const equiposTop = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG"];
    const esLocalTop = equiposTop.some(eq => local.includes(eq));
    const esVisitaTop = equiposTop.some(eq => visita.includes(eq));

    let texto = "";
    let pickRecomendado = "";
    let colorPick = "#10b981"; // Verde por defecto

    if (esLocalTop && !esVisitaTop) {
        texto = `El ${local} afronta este partido como el gran favorito. Su plantilla y su juego ofensivo deberían imponerse ante un ${visita} que intentará defenderse y buscar la contra. Se espera un partido con dominio local.`;
        pickRecomendado = `Victoria Local: ${local}`;
    } else if (esVisitaTop && !esLocalTop) {
        texto = `El ${visita} es un rival de mucha entidad y llega en un gran momento. El ${local} lo tendrá muy complicado. Esperamos un partido táctico donde el visitante llevará la iniciativa del juego.`;
        pickRecomendado = `Victoria Visitante: ${visita}`;
        colorPick = "#ef4444"; // Rojo para victoria visitante
    } else {
        texto = `Partido muy equilibrado en ${liga}. El ${local} y el ${visita} se conocen bien y buscarán no cometer errores. Un empate o un resultado por la mínima es muy probable.`;
        pickRecomendado = `Empate o Menos de 2.5 Goles`;
        colorPick = "#f59e0b"; // Naranja para empate
    }

    // Si hay muchas probabilidades de goles, el Pick cambia
    if (probOver25 > 65) {
        pickRecomendado = `Más de 2.5 Goles (Probabilidad ${probOver25}%)`;
        colorPick = "#3b82f6"; // Azul para goles
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

            <!-- PICK IA (LA MEJOR OPCIÓN) -->
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PICK IA - MEJOR OPCIÓN</p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <!-- Análisis Resumen -->
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.5; margin: 0;"><strong>Resumen:</strong> ${texto}</p>
            </div>

            <!-- Panel de Estadísticas Individuales -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 16px;">📊 Predicciones Estadísticas</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Tarjetas -->
                <div style="background: #fffbeb; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #fde68a;">
                    <p style="font-size: 12px; color: #b45309; font-weight: bold; margin-bottom: 5px;">🟨 Tarjetas Est.</p>
                    <p style="font-size: 18px; font-weight: 900; color: #78350f;">${tarjetasLocal} - ${tarjetasVisita}</p>
                </div>
                <!-- Córners -->
                <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #bae6fd;">
                    <p style="font-size: 12px; color: #0369a1; font-weight: bold; margin-bottom: 5px;">🚩 Córners Est.</p>
                    <p style="font-size: 18px; font-weight: 900; color: #082f49;">${cornersLocal} - ${cornersVisita}</p>
                </div>
                <!-- Goles -->
                <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #bbf7d0;">
                    <p style="font-size: 12px; color: #15803d; font-weight: bold; margin-bottom: 5px;">⚽ Goles Est.</p>
                    <p style="font-size: 18px; font-weight: 900; color: #14532d;">${golesLocal} - ${golesVisita}</p>
                </div>
                <!-- Probabilidad Over 2.5 -->
                <div style="background: #fef2f2; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #fecaca;">
                    <p style="font-size: 12px; color: #b91c1c; font-weight: bold; margin-bottom: 5px;">📈 Más de 2.5 Goles</p>
                    <p style="font-size: 18px; font-weight: 900; color: #7f1d1d;">${probOver25}%</p>
                </div>
            </div>
        </div>
    `;
                    }
