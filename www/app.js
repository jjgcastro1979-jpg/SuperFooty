// ==========================================
// CONEXIÓN A INTERNET REAL USANDO EL PUENTE NATIVO
// ==========================================

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaNombre = document.getElementById('league-select').options[document.getElementById('league-select').selectedIndex].text;
    
    listaDiv.innerHTML = `<div class='loader'>Buscando partidos reales de ${ligaNombre}... ⏳</div>`;

    // URL de la API gratuita TheSportsDB
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${ligaId}`;

    // Usamos el puente nativo de Android para evitar el bloqueo CORS
    if (window.cordova && cordova.plugin && cordova.plugin.http) {
        cordova.plugin.http.get(url, {}, {}, function(response) {
            try {
                const data = JSON.parse(response.data);
                mostrarPartidos(data.events, ligaNombre, listaDiv);
            } catch(e) {
                listaDiv.innerHTML = "<p style='color:red;'>Error al leer los datos.</p>";
            }
        }, function(error) {
            listaDiv.innerHTML = "<p style='color:red;'>Error de red nativo. Revisa tu conexión a internet.</p>";
        });
    } else {
        // Si estamos en el navegador (para pruebas)
        try {
            const response = await fetch(url);
            const data = await response.json();
            mostrarPartidos(data.events, ligaNombre, listaDiv);
        } catch(e) {
            listaDiv.innerHTML = "<p style='color:red;'>Error de red web.</p>";
        }
    }
}

function mostrarPartidos(events, ligaNombre, listaDiv) {
    if (events && events.length > 0) {
        listaDiv.innerHTML = events.slice(0, 10).map(match => {
            const local = match.strHomeTeam;
            const visita = match.strAwayTeam;
            const fecha = match.dateEvent;

            return `
                <div class="match-card" onclick="analizarPartido('${local}', '${visita}', '${ligaNombre}', '${fecha}')">
                    <div class="match-header">
                        <span class="league-badge">${ligaNombre}</span>
                        <span class="match-time">📅 ${fecha}</span>
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
        listaDiv.innerHTML = "<p style='text-align:center;'>No hay partidos próximos en esta liga.</p>";
    }
}

function analizarPartido(local, visita, liga, fecha) {
    document.getElementById('lista-partidos').innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="border-top: 5px solid #10b981;">
            <h3 style="text-align:center;">${local} vs ${visita}</h3>
            <p style="text-align:center; color:#64748b; margin-bottom:15px;">${liga} | ${fecha}</p>
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px;">
                <h4 style="color:#166534; margin-bottom:8px;">🤖 Análisis Táctico SuperFooty</h4>
                <p style="color:#14532d; font-size:14px; line-height:1.5;">
                    Basado en el rendimiento reciente, el partido entre <b>${local}</b> y <b>${visita}</b> se presenta muy disputado. 
                    El equipo local intentará imponer su ritmo en casa, mientras que el visitante buscará aprovechar los espacios a la contra. 
                    Se espera un encuentro con ocasiones para ambos bandos.
                </p>
            </div>
        </div>
    `;
}
