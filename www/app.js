async function consultarGemini(prompt) {
    try {
        // Usamos Puter.js para conectar con Gemini sin claves API
        const respuesta = await puter.ai.chat(prompt, { model: 'google/gemini-2.5-flash' });
        return respuesta;
    } catch (error) {
        throw new Error("La IA no pudo responder. Revisa tu conexión.");
    }
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

    const prompt = `Actúa como analista de "SuperFooty". Analiza el partido ${local} vs ${visita} en 3 frases. Di quién ganará.`;

    try {
        const respuesta = await consultarGemini(prompt);
        caja.innerHTML = `<h4>🤖 Análisis de SuperFooty IA</h4><p>${respuesta}</p>`;
    } catch (error) {
        caja.innerHTML = `<p style='color:red; font-size:12px;'>${error.message}</p>`;
    }
        }
