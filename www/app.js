// ==========================================
// CONFIGURACIÓN DE CLAVES (SOLO GROQ)
// ==========================================
const GROQ_API_KEY = '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';

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date-select');
    const hoy = new Date();
    dateInput.value = new Date(hoy.getTime() - (hoy.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
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
// 1. BUSCAR PARTIDOS GENERADOS POR IA
// ==========================================
document.getElementById('fetch-btn').addEventListener('click', async () => {
    const leagueSelect = document.getElementById('league-select');
    const leagueName = leagueSelect.options[leagueSelect.selectedIndex].text;
    const dateSelected = document.getElementById('date-select').value;
    const listDiv = document.getElementById('results-list');
    
    listDiv.innerHTML = '<div class="loader">🧠 La IA está buscando los mejores partidos... ⏳</div>';

    const prompt = `Genera 4 enfrentamientos de fútbol realistas para la competición "${leagueName}" en la fecha ${dateSelected}.
    Devuelve ÚNICAMENTE un array JSON válido con este formato exacto, sin texto adicional, sin saludos y sin bloques de código markdown:
    [{"local": "Nombre Equipo Local", "visita": "Nombre Equipo Visita", "hora": "20:00"}, ...]`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // 👈 Modelo activo
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error de Groq (${response.status}): ${errorData.error ? errorData.error.message : 'Revisa tu clave'}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        const startIndex = content.indexOf('[');
        const endIndex = content.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            content = content.substring(startIndex, endIndex + 1);
        }
        
        const matches = JSON.parse(content);

        listDiv.innerHTML = matches.map(match => {
            return `
                <div class="match-item" onclick="analizarPartido('${match.local}', '${match.visita}', '${dateSelected}')">
                    <div class="team-name">${match.local}</div>
                    <div class="time">${match.hora}</div>
                    <div class="team-name" style="text-align:right;">${match.visita}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        listDiv.innerHTML = `<p style="color: #ff6b6b; text-align:center; padding: 20px; background: #14264f; border-radius:10px; font-size: 13px;">⚠️ ${error.message}</p>`;
    }
});

// ==========================================
// 2. ANÁLISIS DEL PARTIDO GENERADO POR IA
// ==========================================
async function analizarPartido(local, visita, fecha) {
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('detail-screen').style.display = 'block';
    
    const topBack = document.getElementById('top-back');
    if(topBack) topBack.style.display = 'block';
    document.getElementById('top-title').innerText = 'Partido IA';

    document.getElementById('ui-title').innerHTML = `${local} vs <span>${visita}</span>`;
    const fechaObj = new Date(fecha + "T20:00:00Z");
    document.getElementById('ui-date').innerText = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('ui-time').innerText = "20:00 hs";
    document.getElementById('ui-stadium').innerText = "Estadio IA Simulation";

    const contentDiv = document.getElementById('detail-content');
    contentDiv.innerHTML = '<div class="loader">🧠 La IA está redactando el análisis... ⏳</div>';

    const prompt = `Analiza el partido de fútbol ${local} vs ${visita}.
    Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto, sin texto adicional:
    {
        "probLocal": 45,
        "probEmpate": 25,
        "probVisita": 30,
        "btts": "SÍ",
        "ganador": "Nombre del ganador o Empate",
        "analisis": "Un análisis de 3 frases explicando por qué."
    }`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // 👈 Modelo activo
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.6
            })
        });
        
        if (!response.ok) {
            throw new Error("Error al conectar con la IA.");
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            content = content.substring(startIndex, endIndex + 1);
        }

        const pred = JSON.parse(content);

        let html = `
            <div class="card">
                <div class="stat-row">
                    <div class="stat-name">Prob. Local</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${pred.probLocal}%;"></div></div>
                    <div class="stat-value">${pred.probLocal}%</div>
                </div>
                <div class="stat-row">
                    <div class="stat-name">Prob. Empate</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${pred.probEmpate}%; background: #a8b2d1;"></div></div>
                    <div class="stat-value">${pred.probEmpate}%</div>
                </div>
                <div class="stat-row">
                    <div class="stat-name">Prob. Visita</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${pred.probVisita}%;"></div></div>
                    <div class="stat-value">${pred.probVisita}%</div>
                </div>
            </div>

            <div class="ai-pick">
                <h3>⭐ Pick IA</h3>
                <p style="margin-bottom:5px;"><strong>Ganador:</strong> ${pred.ganador}</p>
                <p style="margin-bottom:5px;"><strong>Ambos Marcan (BTTS):</strong> ${pred.btts}</p>
                <p style="font-size:12px; color:#ccc; margin-top:10px;">${pred.analisis}</p>
                <div class="dropdown-icon">⌄</div>
            </div>

            <div class="timeline-container">
                <h4 style="margin:0 0 5px 0; font-size:14px;">Alineaciones y Eventos</h4>
                <p>Simulación generada por Inteligencia Artificial para el año 2026.</p>
            </div>
        `;

        contentDiv.innerHTML = html;

    } catch (error) {
        contentDiv.innerHTML = `<p style="color: red; text-align:center;">Error al generar el análisis de IA.</p>`;
    }
}
