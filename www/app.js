// ==========================================
// THE SPORTS DB (Múltiples Ligas) + Proxy
// ==========================================

// Diccionario para saber qué liga ha elegido el usuario
const nombreLigas = {
    "4328": "Premier League",
    "4335": "La Liga",
    "4332": "Serie A",
    "4331": "Bundesliga",
    "4334": "Ligue 1",
    "4480": "Champions League"
};

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const nombreLiga = nombreLigas[ligaId];

    listaDiv.innerHTML = `<div class='loader'>Buscando próximos partidos de ${nombreLiga}... ⏳</div>`;

    // 1. URL Real de la liga elegida
    const urlReal = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${ligaId}`;
    
    // 2. El puente (Proxy) para evitar bloqueos
    const urlProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlReal)}`;

    try {
        const response = await fetch(urlProxy);
        
        if (!response.ok) throw new Error("Fallo en la red");
        
        const data = await response.json();

        if (data.events && data.events.length > 0) {
            listaDiv.innerHTML = data.events.slice(0, 10).map(match => {
                const local = match.strHomeTeam;
                const visita = match.strAwayTeam;
                const fecha = match.dateEvent;
                const hora = match.strTime ? match.strTime.substring(0, 5) : "20:00";

                return `
                    <div class="match-card" onclick="analizarPartido('${local}', '${visita}', '${fecha}', '${nombreLiga}')">
                        <div class="match-header">
                            <span class="league-badge">${nombreLiga}</span>
                            <span class="match-time">📅 ${fecha} - ⏰ ${hora}</span>
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
            listaDiv.innerHTML = `<p style='text-align:center;'>No hay partidos próximos en ${nombreLiga} en este momento.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center;'>Error al conectar con la base de datos real. Revisa tu conexión.</p>`;
    }
}

function analizarPartido(local, visita, fecha, liga) {
    // Generamos un análisis basado en reglas
    const golesLocal = Math.floor(Math.random() * 2) + 1; 
    const golesVisita = Math.floor(Math.random() * 2);
    const posesion = Math.floor(Math.random() * (65 - 45)) + 45;
    
    let textoAnalisis = "";
    const equiposTop = ["City", "Arsenal", "Liverpool", "Madrid", "Barcelona", "Atlético", "Inter", "Milan", "Bayern", "Dortmund", "PSG", "Marsella"];

    const esLocalTop = equiposTop.some(eq => local.includes(eq));
    const esVisitaTop = equiposTop.some(eq => visita.includes(eq));

    if (esLocalTop && !esVisitaTop) {
        textoAnalisis = `El ${local} llega como claro favorito en este choque de ${liga}. Su estilo de juego ofensivo y la presión alta deberían dominar la posesión del balón. El ${visita} intentará cerrar espacios y buscar la contra, pero la calidad individual del equipo local debería inclinar la balanza hacia la victoria local.`;
    } else if (esVisitaTop && !esLocalTop) {
        textoAnalisis = `El ${visita} es un rival temible que suele imponer su ritmo fuera de casa. El ${local} necesitará ser muy sólido defensivamente para frenar sus ataques. Esperamos un partido muy táctico donde el equipo visitante tendrá más ocasiones claras de gol.`;
    } else if (esLocalTop && esVisitaTop) {
         textoAnalisis = `¡Partidazo de la jornada en ${liga}! Dos gigantes se enfrentan. El ${local} querrá hacer valer su condición de local, pero el ${visita} tiene calidad suficiente para llevarse los tres puntos. Se esperan emociones fuertes, goles y un partido muy disputado en el mediocampo.`;
    } else {
        textoAnalisis = `Partido muy igualado en ${liga}. Ambos equipos conocen bien sus limitaciones y buscarán no cometer errores defensivos. El ${local} intentará hacerse fuerte en casa, mientras que el ${visita} apostará por un juego directo. Un empate o un resultado por la mínima es lo más probable.`;
    }

    document.getElementById('lista-partidos').innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver a los partidos</button>
        <div class="match-card" style="border-top: 5px solid #10b981;">
            <h3 style="text-align:center; margin-bottom:5px;">${local} vs ${visita}</h3>
            <p style="text-align:center; color:#64748b; font-size:12px; margin-bottom:15px;">${liga} | Fecha: ${fecha}</p>
            
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px;">
                <h4 style="color:#166534; margin-bottom:8px;">🤖 Análisis Táctico SuperFooty</h4>
                <p style="color:#14532d; font-size:14px; line-height:1.5; margin-bottom:15px;">${textoAnalisis}</p>
                
                <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; color:#166534; border-top:1px solid #bbf7d0; padding-top:10px;">
                    <span>Posesión: ${posesion}% - ${100-posesion}%</span>
                    <span>Goles Est: ${golesLocal} - ${golesVisita}</span>
                </div>
            </div>
        </div>
    `;
}
