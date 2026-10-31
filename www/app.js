const GEMINI_API_KEY = 'AQ.Ab8RN6KOuBi5izAFwPq1S_uQBYrSKTfXFsuHE4SSfGDcTilNwg';

async function consultarGemini(prompt) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Tiempo de espera agotado."));
        }, 15000);

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;
        
        const bodyData = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        });

        const xhr = new XMLHttpRequest();
        xhr.open("POST", apiUrl, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-goog-api-key", GEMINI_API_KEY);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                clearTimeout(timeout);
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if(data.candidates && data.candidates.length > 0) {
                            resolve(data.candidates[0].content.parts[0].text);
                        } else {
                            reject(new Error("Google no devolvió resultados."));
                        }
                    } catch(e) {
                        reject(new Error("Error al leer respuesta."));
                    }
                } else {
                    try {
                        const errData = JSON.parse(xhr.responseText);
                        reject(new Error(`Error ${xhr.status}: ${errData[0].error.message}`));
                    } catch(e) {
                        reject(new Error(`Error de red: ${xhr.status}`));
                    }
                }
            }
        };

        xhr.onerror = function () {
            clearTimeout(timeout);
            reject(new Error("Error de conexión. Verifica tu internet."));
        };

        xhr.send(bodyData);
    });
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = "<div class='loader'>🧠 La IA está generando partidos... ⏳</div>";

    const prompt = `Genera 4 partidos de fútbol emocionantes. Devuelve SOLO un array JSON válido:
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

async function analizarPartido(local, visita, index) {
    const caja = document.getElementById(`analisis-${index}`);
    
    if(caja.style.display === 'block') {
        caja.style.display = 'none';
        return;
    }

    caja.style.display = 'block';
    caja.innerHTML = "<p>🧠 Analizando tácticas...</p>";

    const prompt = `Analiza el partido ${local} vs ${visita} en 3 frases. Di quién ganará.`;

    try {
        const respuesta = await consultarGemini(prompt);
        caja.innerHTML = `<h4>🤖 Análisis de SuperFooty IA</h4><p>${respuesta}</p>`;
    } catch (error) {
        caja.innerHTML = `<p style='color:red; font-size:12px;'>${error.message}</p>`;
    }
}
