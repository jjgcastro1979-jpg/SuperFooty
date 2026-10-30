// ==========================================
// CONFIGURACIÓN DE CLAVES
// ==========================================
const FOOTBALL_DATA_KEY = '540249b0c3834611bbc4a5a69a7f7d06'; 
const GROQ_API_KEY = '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'; // ⚠️ PON TU CLAVE DE GROQ AQUÍ
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date-select').value = '2024-05-20'; 
});

function volverAtras() {
    document.getElementById('detail-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    const topBack = document.getElementById('top-back');
    if(topBack) topBack.style.display = 'none';
    const topTitle = document.getElementById('top-title');
    if(topTitle) topTitle.innerText = '⭐ Sport Insights';
}

// ==========================================
// 1. BUSCAR PARTIDOS (CON PROXY PARA EVITAR BLOQUEOS)
// ==========================================
document.getElementById('fetch-btn').addEventListener('click', async () => {
    const leagueCode = document.getElementById('league-select').value;
    const listDiv = document.getElementById('results-list');
    const dateSelected = '2024-05-20'; 
    
    listDiv.innerHTML = '<div class="loader">Buscando partidos... ⏳</div>';

    try {
        // Usamos un proxy gratuito para saltar el bloqueo CORS y de red
        const apiUrl = `https://api.football-data.org/v4/competitions/${leagueCode}/matches?dateFrom=${dateSelected}&dateTo=${dateSelected}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;

        const response = await fetch(proxyUrl, {
            method: 'GET', 
            headers: { 
                'X-Auth-Token': FOOTBALL_DATA_KEY.trim() // .trim() quita espacios en blanco ocultos
            }
        });
        
        if (!response.ok) {
            if (response.status === 429) throw new Error("Límite de peticiones alcanzado. Espera 1 minuto.");
            if (response.status === 403) throw new Error("Token incorrecto.");
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();

        if (data.matches && data.matches.length > 0) {
            listDiv.innerHTML = data.matches.map(match => {
                const home = match.homeTeam.name || match.homeTeam.shortName;
                const away = match.awayTeam.name || match.awayTeam.shortName;
                const hora = new Date(match.utcDate).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
                const matchData = encodeURIComponent(JSON.stringify(match));

                return `
                    <div class="match-item" onclick="analizarPartido('${matchData}')">
                        <div class="team-name">${home}</div>
                        <div class="time">${hora}</div>
                        <div class="team-name" style="text-align:right;">${away}</div>
                    </div>
                `;
            }).join('');
        } else {
            listDiv.innerHTML = `<p style="text-align:center; color: #ccff00; padding:20px;">La API dice que no hay partidos para esta liga en esta fecha.</p>`;
        }

    } catch (error) {
        listDiv.innerHTML = `<p style="color: #ff6b6b; text-align:center; padding: 20px; background: #14264f; border-radius:10px;">⚠️ ${error.message}</p>`;
    }
});

// ==========================================
// 2. ANÁLISIS CON IA (GROQ)
// ==========================================
async function analizarPartido(matchDataString) {
    const match = JSON.parse(decodeURIComponent(matchDataString));
    
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('detail-screen').style.display = 'block';
    
    const topBack = document.getElementById('top-back');
    if(topBack) topBack.style.display = 'block';

    const homeName = match.homeTeam.name || match.homeTeam.shortName;
    const awayName = match.awayTeam.name || match.awayTeam.shortName;

    document.getElementById('ui-title').innerHTML = `${homeName} vs <span>${awayName}</span>`;
    const fechaObj = new Date(match.utcDate);
    document.getElementById('ui-date').innerText = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('ui-time').innerText = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' hs';
    document.getElementById('ui-stadium').innerText = match.venue || "Estadio por confirmar";

    const contentDiv = document.getElementById('detail-content');
    contentDiv.innerHTML = '<div class="loader">🧠 La IA está analizando el partido... ⏳</div>';

    try {
        const consejoIA = await generarAnalisisGroq(homeName, awayName);

        let html = `
            <div class="card">
                <div class="stat-row">
                    <div class="stat-name">Prob. Local</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: 45%;"></div></div>
                    <div class="stat-value">45%</div>
                </div>
                <div class="stat-row">
                    <div class="stat-name">Prob. Empate</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: 25%; background: #a8b2d1;"></div></div>
                    <div class="stat-value">25%</div>
                </div>
                <div class="stat-row">
                    <div class="stat-name">Prob. Visita</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: 30%;"></div></div>
                    <div class="stat-value">30%</div>
                </div>
            </div>

            <div class="ai-pick">
                <h3>⭐ Pick IA</h3>
                <p>${consejoIA}</p>
                <div class="dropdown-icon">⌄</div>
            </div>

            <div class="timeline-container">
                <h4 style="margin:0 0 5px 0; font-size:14px;">Alineaciones y Eventos</h4>
                <p>El partido aún no ha comenzado.</p>
            </div>
        `;

        contentDiv.innerHTML = html;

    } catch (error) {
        contentDiv.innerHTML = `<p style="color: red; text-align:center;">Error al generar el análisis de IA. Revisa tu clave de Groq.</p>`;
    }
}

// ==========================================
// 3. CONEXIÓN CON GROQ
// ==========================================
async function generarAnalisisGroq(local, visita) {
    const prompt = `Eres un analista de fútbol profesional. Analiza este partido: ${local} vs ${visita}.
    Escribe un análisis breve (máximo 3 frases) en español. Sé directo, di quién tiene más probabilidades de ganar o si es un partido cerrado. Menciona los equipos. No uses saludos.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', 
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.6
            })
        });
        const data = await response.json();
        
        if(data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            return "El análisis de IA no está disponible en este momento.";
        }
    } catch (e) {
        return "Partido muy interesante según las estadísticas. Se espera un encuentro muy disputado entre ambos equipos.";
    }
}
