// ==========================================
// CLAVE DE GOOGLE GEMINI
// ==========================================
const GEMINI_API_KEY = 'AQ.Ab8RN6LCG9Bz-WqoaUL0RIAQEcJ56ieeD-CSg0RSuGI-r_KS0g'; // ⚠️ PON TU CLAVE AQUÍ

// ==========================================
// CONEXIÓN NATIVA (EL PUENTE DEFINITIVO)
// ==========================================
async function consultarGemini(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const bodyData = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
    };

    // Si el plugin nativo está disponible (en la APK), lo usamos
    if (window.cordova && cordova.plugin && cordova.plugin.http) {
        return new Promise((resolve, reject) => {
            cordova.plugin.http.post(apiUrl, bodyData, { 'Content-Type': 'application/json' }, (response) => {
                try {
                    const data = JSON.parse(response.data);
                    resolve(data.candidates[0].content.parts[0].text);
                } catch(e) {
                    reject(new Error("Error procesando la respuesta de Google"));
                }
            }, (error) => {
                reject(new Error(`Error nativo de Google: ${error.status}`));
            });
        });
    }

    // Si estamos en el navegador web, usamos fetch normal
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        if (!response.ok) throw new Error("Error de red en navegador");
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        throw new Error(`Fallo web: ${e.message}`);
    }
}

// ==========================================
// 1. CARGAR PARTIDOS
// ==========================================
async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = "<div class='loader'>🧠 La IA está generando partidos... ⏳</div>";

    const prompt = `Genera 4 partidos de fútbol emocionantes. Devuelve SOLO un array JSON válido, sin texto extra, sin markdown:
    [{"local": "Equipo A", "visita": "Equipo B", "hora": "20:00", "liga": "La Liga"}]`;

    try {
        let respuesta = await consultarGemini(prompt);
        
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
        listaDiv.innerHTML = `<div style='color:red; text-align:center; padding:20px; background:#ffeeee; border-radius:10px; border:1px solid red; font-size:12px;'>
            <strong>⚠️ Error:</strong><br><br>${error.message}
        </div>`;
    }
}

// ==========================================
// 2. ANÁLISIS DEL PARTIDO
// ==========================================
async function analizarPartido(local, visita, index) {
    const caja = document.getElementById(`analisis-${index}`);
    
    if(caja.style.display === 'block') {
        caja.style.display = 'none';
        return;
    }

    caja.style.display = 'block';
    caja.innerHTML = "<p>🧠 Analizando tácticas...</p>";

    const prompt = `Actúa como analista de "SuperFooty". Analiza el partido ${local} vs ${visita}. 
    Escribe un análisis breve (máximo 3 frases) en español. 
    Di quién ganará, si habrá más o menos de 2.5 goles y si ambos marcarán. Sé directo.`;

    try {
        const respuesta = await consultarGemini(prompt);
        caja.innerHTML = `<h4>🤖 Análisis de SuperFooty IA</h4><p>${respuesta}</p>`;
    } catch (error) {
        caja.innerHTML = `<p style='color:red; font-size:12px;'>${error.message}</p>`;
    }
}
