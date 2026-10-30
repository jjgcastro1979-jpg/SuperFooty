// ==========================================
// CLAVE DE GOOGLE GEMINI
// ==========================================
const GEMINI_API_KEY = 'AQ.Ab8RN6LCG9Bz-WqoaUL0RIAQEcJ56ieeD-CSg0RSuGI-r_KS0g'; // ⚠️ PON TU CLAVE AQUÍ

async function consultarGemini(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`;

    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
        })
    });

    if (!response.ok) throw new Error("Error de conexión.");
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// ==========================================
// CARGAR PARTIDOS EN SUPERFOOTY
// ==========================================
async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = "<div class='loader'>🧠 Gemini está eligiendo los mejores partidos... ⏳</div>";

    const prompt = `Eres el motor de inteligencia artificial de la app "SuperFooty". Genera 4 partidos de fútbol emocionantes. 
    Devuelve SOLO un array JSON válido, sin texto extra, sin markdown:
    [{"local": "Equipo A", "visita": "Equipo B", "hora": "20:00", "liga": "La Liga"}]`;

    try {
        let respuesta = await consultarGemini(prompt);
        
        // Limpieza de seguridad para extraer el JSON
        const inicio = respuesta.indexOf('[');
        const fin = respuesta.lastIndexOf(']');
        if(inicio !== -1 && fin !== -1) respuesta = respuesta.substring(inicio, fin + 1);
        
        const partidos = JSON.parse(respuesta);

        listaDiv.innerHTML = partidos.map((p, i) => `
            <div class="match-card" onclick="analizarPartido('${p.local}', '${p.visita}', ${i})">
                <div class="match-header">
                    <span class="league-badge">${p.liga}</span>
                    <span class="match-time">⏰ ${p.hora}</span>
                </div>
                <div class="teams-row">
                    <div class="team-name">${p.local}</div>
                    <div class="vs-badge">VS</div>
                    <div class="team-name right">${p.visita}</div>
                </div>
                <div id="analisis-${i}" class="ia-box"></div>
            </div>
        `).join('');

    } catch (error) {
        listaDiv.innerHTML = "<p style='color:red; text-align:center;'>Error al cargar. Revisa tu clave de Gemini.</p>";
        console.error(error);
    }
}

// ==========================================
// ANÁLISIS DEL PARTIDO (Estilo SuperFooty)
// ==========================================
async function analizarPartido(local, visita, index) {
    const caja = document.getElementById(`analisis-${index}`);
    
    if(caja.style.display === 'block') {
        caja.style.display = 'none';
        return;
    }

    caja.style.display = 'block';
    caja.innerHTML = "<p>🧠 Analizando tácticas y probabilidades...</p>";

    const prompt = `Actúa como el analista jefe de "SuperFooty". Analiza el partido ${local} vs ${visita}. 
    Escribe un análisis breve (máximo 3 frases) en español. 
    Di quién ganará, si habrá más o menos de 2.5 goles y si ambos equipos marcarán. Sé directo y profesional.`;

    try {
        const respuesta = await consultarGemini(prompt);
        caja.innerHTML = `<h4>🤖 Análisis de SuperFooty IA</h4><p>${respuesta}</p>`;
    } catch (error) {
        caja.innerHTML = "<p style='color:red;'>Error al analizar. Inténtalo de nuevo.</p>";
    }
           }
