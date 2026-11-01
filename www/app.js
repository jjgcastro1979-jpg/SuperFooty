// ==========================================
// SUPERFOOTY PRO - INTEGRACIÓN COMPLETA
// Gemini AI + Goal API + ESPN
// ==========================================

// ⚠️ PON TUS CLAVES AQUÍ
const CONFIG = {
    GOAL_API_KEY: 'gapi_1db22217e01cf4be68deb0e0d61b6702d40de011453cdd853792e56f4e3fb714',     // Tu clave Goal API
    GEMINI_API_KEY: 'AQ.Ab8RN6Kf-CUT_40yAqHaawuRZWhw-CMDsCizTQthJKYmtdW9oQ',     // Tu clave Gemini
    GEMINI_MODEL: 'gemini-2.0-flash'
};

const ligasESPN = {
    "eng.1": "Premier League", "esp.1": "La Liga", "ita.1": "Serie A",
    "ger.1": "Bundesliga", "fra.1": "Ligue 1", "uefa.champions": "Champions League"
};

// ===================== PETICIONES =====================
async function hacerPeticion(url, headers = {}) {
    if (window.cordova && window.cordova.plugin && window.cordova.plugin.http) {
        return new Promise((resolve, reject) => {
            cordova.plugin.http.get(url, {}, headers,
                (response) => {
                    try { resolve(JSON.parse(response.data)); }
                    catch(e) { reject(new Error("Error JSON")); }
                },
                (error) => reject(new Error(`Error HTTP: ${error.status}`))
            );
        });
    } else {
        const res = await fetch(url, { headers });
        return await res.json();
    }
}

// ===================== GEMINI AI =====================
async function analizarConGemini(local, visita, datosPartido) {
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'AQUÍ_TU_CLAVE_GEMINI') {
        return "⚠️ Clave de Gemini no configurada. Sin análisis IA disponible.";
    }

    const prompt = `Eres un analista deportivo experto. Analiza este partido de fútbol:

📋 Partido: ${local} vs ${visita}
📊 Datos disponibles:
- Forma local: ${datosPartido.formaLocal}
- Forma visita: ${datosPartido.formaVisita}
- Goles promedio local: ${datosPartido.golesLocal}
- Goles promedio visita: ${datosPartido.golesVisita}
- Historial últimos 5 enfrentamientos: ${datosPartido.h2h}

Dame un análisis claro en español, en 3 puntos cortos:
1️⃣ Tendencias y estado de forma
2️⃣ Clave del partido y puntos fuertes/débiles
3️⃣ Recomendación de valor (sin garantías, solo análisis informativo)

Sé conciso, directo y profesional. Usa emojis apropiados.`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
            })
        });

        const data = await res.json();
        if (data.candidates && data.candidates[0]) {
            return data.candidates[0].content.parts[0].text;
        }
        return "❌ No se pudo obtener respuesta de Gemini.";
    } catch (e) {
        console.error("Error Gemini:", e);
        return "⚠️ Error al conectar con Gemini. Revisa tu conexión o clave API.";
    }
}

// ===================== GOAL API =====================
async function buscarEquipoGoalAPI(nombreEquipo) {
    if (!CONFIG.GOAL_API_KEY || CONFIG.GOAL_API_KEY === 'AQUÍ_TU_CLAVE_GOAL_API') {
        return null;
    }
    try {
        const res = await hacerPeticion(
            `https://api.goal-api.com/v1/teams?search=${encodeURIComponent(nombreEquipo)}`,
            { 'Authorization': `Bearer ${CONFIG.GOAL_API_KEY}` }
        );
        return res.success && res.data ? res.data[0] : null;
    } catch (e) {
        console.log("Goal API equipo falló:", nombreEquipo);
        return null;
    }
}

async function obtenerH2HGoalAPI(idLocal, idVisita) {
    if (!CONFIG.GOAL_API_KEY || CONFIG.GOAL_API_KEY === 'AQUÍ_TU_CLAVE_GOAL_API') {
        return null;
    }
    try {
        const res = await hacerPeticion(
            `https://api.goal-api.com/v1/h2h/${idLocal}/${idVisita}/stats`,
            { 'Authorization': `Bearer ${CONFIG.GOAL_API_KEY}` }
        );
        return res.success && res.data ? res.data : null;
    } catch (e) {
        console.log("Goal API H2H falló");
        return null;
    }
}

// ===================== FUNCIONES COMPARTIDAS =====================
function crearBarraProbabilidad(titulo, probabilidad) {
    let prob = parseFloat(probabilidad);
    if (isNaN(prob)) prob = 0;

    let color = "#ef4444";
    if (prob >= 65) color = "#10b981";
    else if (prob >= 40) color = "#f59e0b";

    return `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #475569;">${titulo}</span>
                <span style="color: ${color};">${Math.round(prob)}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${prob}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
            </div>
        </div>
    `;
}

async function obtenerFormaEquipo(teamId, ligaId) {
    try {
        const res = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/teams/${teamId}/schedule`);
        if (res.events) {
            const terminados = res.events.filter(e => {
                const comp = e.competitions[0];
                const home = comp.competitors.find(c => c.homeAway === 'home');
                const away = comp.competitors.find(c => c.homeAway === 'away');
                return comp.status.type.completed && home.score !== undefined && away.score !== undefined;
            });

            const ultimos5 = terminados.slice(-5);

            if (ultimos5.length === 0) return { formaStr: "Sin datos", mediaFavor: "0.0", mediaContra: "0.0" };

            let forma = [];
            let gfTotal = 0, gcTotal = 0;

            ultimos5.forEach(partido => {
                const comps = partido.competitions[0].competitors;
                const esLocal = comps.find(c => c.homeAway === 'home').id === teamId;
                const gl = parseInt(comps.find(c => c.homeAway === 'home').score) || 0;
                const gv = parseInt(comps.find(c => c.homeAway === 'away').score) || 0;

                let gf = esLocal ? gl : gv;
                let gc = esLocal ? gv : gl;

                gfTotal += gf; gcTotal += gc;

                if (gf > gc) forma.push('<span style="color:#10b981; font-weight:bold;">V</span>');
                else if (gf === gc) forma.push('<span style="color:#f59e0b; font-weight:bold;">E</span>');
                else forma.push('<span style="color:#ef4444; font-weight:bold;">D</span>');
            });

            return {
                formaStr: forma.join(' - '),
                mediaFavor: (gfTotal / ultimos5.length).toFixed(1),
                mediaContra: (gcTotal / ultimos5.length).toFixed(1)
            };
        }
    } catch (e) { console.log("Error forma:", teamId); }
    return { formaStr: "Sin datos", mediaFavor: "0.0", mediaContra: "0.0" };
}

console.log("✅ SuperFooty PRO cargado - Gemini + Goal API integrados");
            
