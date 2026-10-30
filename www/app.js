const GEMINI_API_KEY = ''; // 

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
