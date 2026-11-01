// ==========================================
// SUPERFOOTY PRO - COMPLETO Y FUNCIONAL
// ==========================================

// ⚠️ PON TUS CLAVES AQUÍ
const CONFIG = {
    GOAL_API_KEY: 'gapi_1db22217e01cf4be68deb0e0d61b6702d40de011453cdd853792e56f4e3fb714',
    GEMINI_API_KEY: 'AQ.Ab8RN6Kf-CUT_40yAqHaawuRZWhw-CMDsCizTQthJKYmtdW9oQ'
};

const ligasESPN = {
    "eng.1": "Premier League", "esp.1": "La Liga", "ita.1": "Serie A",
    "ger.1": "Bundesliga", "fra.1": "Ligue 1", "uefa.champions": "Champions League"
};

// ===================== HACER PETICIÓN =====================
async function hacerPeticion(url, headers = {}) {
    try {
        const res = await fetch(url, { headers });
        return await res.json();
    } catch (e) {
        console.error("Error en petición:", e);
        return null;
    }
}

// ===================== CARGAR PARTIDOS =====================
async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const fechaInput = document.getElementById('date-select').value;
    
    if (!fechaInput) {
        alert("Por favor, selecciona una fecha.");
        return;
    }

    const fechaFormateada = fechaInput.replace(/-/g, '');
    listaDiv.innerHTML = `<div style="text-align:center; padding:30px;">⏳ Cargando partidos...</div>`;

    try {
        const data = await hacerPeticion(`https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaId}/scoreboard?dates=${fechaFormateada}`);

        if (data && data.events && data.events.length > 0) {
            listaDiv.innerHTML = data.events.map(match => {
                const home = match.competitions[0].competitors.find(c => c.homeAway === 'home').team;
                const away = match.competitions[0].competitors.find(c => c.homeAway === 'away').team;
                const hora = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                return `
                    <div style="background:white; border-radius:12px; padding:15px; margin-bottom:10px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span style="background:#e0e7ff; color:#1e3a8a; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:bold;">${ligasESPN[ligaId]}</span>
                            <span style="color:#64748b; font-size:13px;">⏰ ${hora}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:bold; font-size:15px;">${home.displayName}</span>
                            <span style="color:#64748b; font-weight:bold;">VS</span>
                            <span style="font-weight:bold; font-size:15px;">${away.displayName}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaDiv.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b;">No hay partidos para esta fecha.</div>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<div style="text-align:center; padding:40px; color:red;">❌ Error de conexión. Comprueba tu internet.</div>`;
    }
}

console.log("✅ SuperFooty cargado correctamente");
