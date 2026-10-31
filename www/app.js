// ==========================================
// CLAVE DE GOOGLE GEMINI
// ==========================================
const GEMINI_API_KEY = 'AQ.Ab8RN6LCG9Bz-WqoaUL0RIAQEcJ56ieeD-CSg0RSuGI-r_KS0g'; // ⚠️ PON TU CLAVE AQUÍ

// ==========================================
// CONEXIÓN NATIVA CON TEMPORIZADOR DE SEGURIDAD
// ==========================================
async function consultarGemini(prompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const bodyData = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
    };

    return new Promise((resolve, reject) => {
        // Temporizador: Si en 12 segundos no hay respuesta, lanzamos error
        const timeout = setTimeout(() => {
            reject(new Error("Tiempo de espera agotado. Google no responde. Revisa tu conexión a internet o la clave API."));
        }, 12000);

        if (window.cordova && cordova.plugin && cordova.plugin.http) {
            // Usamos el plugin nativo (APK)
            cordova.plugin.http.post(apiUrl, bodyData, { 'Content-Type': 'application/json' }, (response) => {
                clearTimeout(timeout);
                try {
                    const data = JSON.parse(response.data);
                    if(data.candidates && data.candidates.length > 0) {
                        resolve(data.candidates[0].content.parts[0].text);
                    } else {
                        reject(new Error("Google respondió pero sin partidos. Inténtalo otra vez."));
                    }
                } catch(e) {
                    reject(new Error("Error al leer la respuesta de Google."));
                }
            }, (error) => {
                clearTimeout(timeout);
                reject(new Error(`Error de red nativo: Código ${error.status || 'Desconocido'}. ¿Tienes internet?`));
            });
        } else {
            // Si estamos en el navegador web
            fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            })
            .then(res => {
                clearTimeout(timeout);
                if(!res.ok) throw new Error(`Error web: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if(data.candidates && data.candidates.length > 0) {
                    resolve(data.candidates[0].content.parts[0].text);
                } else {
                    reject(new Error("La IA no devolvió resultados."));
                }
            })
            .catch(err => {
                clearTimeout(timeout);
                reject(new Error(`Fallo web: ${err.message}`));
            });
        }
    });
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
        listaDiv.innerHTML = `<div style='color:red; text-align:center; padding:20px; background:#ffeeee; border-radius:10px; border:1px solid red; font-size:13px;'>
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
