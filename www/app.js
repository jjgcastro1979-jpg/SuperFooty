// ==========================================
// API DE ESPN (Datos reales, sin claves, sin bloqueos)
// ==========================================

// Mapeo de las ligas de nuestra app a los códigos de ESPN
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

    // Llamada directa a la API pública de ESPN
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/scoreboard`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fallo en la red");
        
        const data = await response.json();

        if (data.events && data.events.length > 0) {
            listaDiv.innerHTML = data.events.map(match => {
                const local = match.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName;
                const visita = match.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName;
                
                // Formatear fecha real del partido
                const fechaObj = new Date(match.date);
                const fechaStr = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const horaStr = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="match-card" onclick="analizarPartido('${local}', '${visita}', '${ligaNombre}', '${match.date}')">
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

function analizarPartido(local, visita, liga, fechaISO) {
    const fechaObj = new Date(fechaISO);
    const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    // Generamos un análisis basado en reglas
    const equiposTop = ["Real Madrid", "Barcelona", "Manchester City", "Arsenal", "Liverpool", "Bayern", "Inter", "PSG"];
    const esLocalTop = equiposTop.some(eq => local.includes(eq));
    const esVisitaTop = equiposTop.some(eq => visita.includes(eq));

    let texto = "";
    if (esLocalTop && !esVisitaTop) {
        texto = `El ${local} afronta este partido de ${liga} como el gran favorito. Su plantilla y su juego ofensivo deberían imponerse ante un ${visita} que intentará defenderse y buscar la contra. Se espera un partido con dominio local.`;
    } else if (esVisitaTop && !esLocalTop) {
        texto = `El ${visita} es un rival de mucha entidad y llega en un gran momento. El ${local} lo tendrá muy complicado para sacar algo positivo. Esperamos un partido táctico donde el visitante llevará la iniciativa del juego.`;
    } else {
        texto = `Partido muy equilibrado en ${liga}. El ${local} y el ${visita} se conocen bien y buscarán no cometer errores. El que consiga adelantarse en el marcador tendrá media victoria. Un empate es un resultado muy probable.`;
    }

    document.getElementById('lista-partidos').innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver a los partidos</button>
        <div class="match-card" style="border-top: 5px solid #10b981;">
            <h3 style="text-align:center; margin-bottom:5px;">${local} vs ${visita}</h3>
            <p style="text-align:center; color:#64748b; font-size:13px; margin-bottom:15px; text-transform: capitalize;">📅 ${fechaStr}</p>
            
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px;">
                <h4 style="color:#166534; margin-bottom:8px;">🤖 Análisis Táctico SuperFooty</h4>
                <p style="color:#14532d; font-size:14px; line-height:1.5; margin-bottom:15px;">${texto}</p>
                
                <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; color:#166534; border-top:1px solid #bbf7d0; padding-top:10px;">
                    <span>Goles Est: ${Math.floor(Math.random() * 3)} - ${Math.floor(Math.random() * 3)}</span>
                    <span>Posesión: ${Math.floor(Math.random() * 20) + 40}% - ${Math.floor(Math.random() * 20) + 40}%</span>
                </div>
            </div>
        </div>
    `;
            }
