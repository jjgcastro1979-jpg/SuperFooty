// ==========================================
// API-FOOTBALL (Datos y Predicciones Reales)
// ==========================================
const API_KEY = '540249b0c3834611bbc4a5a69a7f7d06'; // Tu clave de API-Football
const API_HOST = 'https://v3.football.api-sports.io';

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = "<div class='loader'>Buscando partidos reales... ⏳</div>";

    const ligaId = '140'; // 140 = La Liga

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        // Pedimos los últimos 10 partidos jugados de la temporada 2023
        const url = `${API_HOST}/fixtures?league=${ligaId}&season=2023&last=10`;
        
        xhr.open("GET", url, true);
        xhr.setRequestHeader("x-apisports-key", API_KEY);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.response && data.response.length > 0) {
                            // Pintamos los partidos reales
                            listaDiv.innerHTML = data.response.map(match => {
                                const local = match.teams.home.name;
                                const visita = match.teams.away.name;
                                // Mostramos la fecha real del partido
                                const fecha = new Date(match.fixture.date).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'});
                                const idPartido = match.fixture.id;

                                return `
                                    <div class="match-card" onclick="analizarPartido(${idPartido}, '${local}', '${visita}')">
                                        <div class="match-header">
                                            <span class="league-badge">La Liga (Real)</span>
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
                            listaDiv.innerHTML = "<p style='text-align:center;'>La API no ha devuelto partidos. Puede que hayas agotado las 100 peticiones diarias.</p>";
                        }
                    } catch(e) {
                        listaDiv.innerHTML = "<p style='color:red;'>Error al leer los datos.</p>";
                    }
                } else {
                    listaDiv.innerHTML = "<p style='color:red;'>Error de red al conectar con API-Football.</p>";
                }
            }
        };
        xhr.send();
    });
}

async function analizarPartido(idPartido, local, visita) {
    document.getElementById('lista-partidos').innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver a los partidos</button>
        <div class="match-card" style="border-top: 5px solid #10b981;">
            <h3 style="text-align:center; margin-bottom:15px;">${local} vs ${visita}</h3>
            <div id="caja-analisis" style="background:#f8f9fa; padding:15px; border-radius:12px; text-align:center;">
                🧠 Obteniendo predicciones reales de la API... ⏳
            </div>
        </div>
    `;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${API_HOST}/predictions?fixture=${idPartido}`;
        
        xhr.open("GET", url, true);
        xhr.setRequestHeader("x-apisports-key", API_KEY);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                const caja = document.getElementById('caja-analisis');
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.response && data.response.length > 0) {
                            const pred = data.response[0].predictions;
                            const winner = pred.winner.name || "Empate / Incierto";
                            const advice = pred.advice || "Sin consejo directo.";
                            const percent = pred.percent;

                            caja.innerHTML = `
                                <h4 style="color:#166534; margin-bottom:10px;">🤖 Predicción Real de API-Football</h4>
                                <p style="font-size:14px; margin-bottom:10px;"><strong>Ganador probable:</strong> ${winner}</p>
                                <p style="font-size:13px; color:#333; margin-bottom:15px;">${advice}</p>
                                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; color:#166534;">
                                    <span>Local: ${percent.home}</span>
                                    <span>Empate: ${percent.draw}</span>
                                    <span>Visita: ${percent.away}</span>
                                </div>
                            `;
                        } else {
                            caja.innerHTML = "<p>La API no tiene predicciones para este partido.</p>";
                        }
                    } catch(e) {
                        caja.innerHTML = "<p>Error al leer la predicción.</p>";
                    }
                } else {
                    caja.innerHTML = "<p style='color:red;'>Error de red al pedir la predicción.</p>";
                }
            }
        };
        xhr.send();
    });
                       }
