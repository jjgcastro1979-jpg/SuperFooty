import { GoalApi } from '@goalapi/sdk';

// ==========================================
// INICIALIZACIÓN DEL SDK OFICIAL
// ==========================================
const goal = new GoalApi({ 
    apiKey: 'gapi_1db22217e01cf4be68deb0e0d61b6702d40de011453cdd853792e56f4e3fb714', // ⚠️ PON TU CLAVE DE GOAL API
    baseUrl: 'https://api.goal-api.com/v1' 
});

// Función para buscar el ID de un equipo por nombre
async function obtenerIdEquipo(nombreEquipo) {
    try {
        const res = await goal.teams.list({ search: nombreEquipo, limit: 1 });
        return res.data?.[0]?.id || null;
    } catch (e) {
        console.error("Error buscando equipo:", e);
        return null;
    }
}

// Función principal de análisis
async function analizarPartido(local, visita, logoLocal, logoVisita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    
    listaDiv.innerHTML = `<div class='loader'>🧠 Consultando SDK de Goal API... ⏳</div>`;

    try {
        // 1. Obtener los IDs de los equipos
        const idLocal = await obtenerIdEquipo(local);
        const idVisita = await obtenerIdEquipo(visita);

        if (!idLocal || !idVisita) {
            throw new Error("No se encontraron los equipos en la base de datos de Goal API.");
        }

        // 2. Obtener el H2H (si existe) y la forma de ambos equipos en paralelo
        const [h2hData, statsLocal, statsVisita] = await Promise.allSettled([
            goal.h2h.stats(idLocal, idVisita),
            goal.teams.statistics(idLocal, { season: '2025-2026' }),
            goal.teams.statistics(idVisita, { season: '2025-2026' })
        ]);

        // 3. Procesar el H2H
        let h2hLocal = 0, h2hEmpate = 0, h2hVisita = 0;
        let origenH2H = "No disponible";
        
        if (h2hData.status === 'fulfilled' && h2hData.value?.data) {
            const stats = h2hData.value.data;
            h2hLocal = stats.team1_wins || 0;
            h2hEmpate = stats.draws || 0;
            h2hVisita = stats.team2_wins || 0;
            if (h2hLocal + h2hEmpate + h2hVisita > 0) origenH2H = "Goal API (Real)";
        }

        // 4. Calcular probabilidades basadas en la forma si no hay H2H
        let pL = 33, pE = 34, pV = 33;
        let pickRecomendado = "Partido Igualado";
        let colorPick = "#f59e0b";
        let resumenTexto = "No hay suficientes datos históricos. Mostrando estimación basada en la temporada actual.";

        if (statsLocal.status === 'fulfilled' && statsVisita.status === 'fulfilled') {
            const formaL = statsLocal.value.data;
            const formaV = statsVisita.value.data;
            
            // Creamos una fuerza basada en victorias y goles (ejemplo simple)
            let fuerzaL = (formaL?.wins || 0) * 2 + (formaL?.goalsFor || 0);
            let fuerzaV = (formaV?.wins || 0) * 2 + (formaV?.goalsFor || 0);
            let totalFuerza = fuerzaL + fuerzaV;

            if (totalFuerza > 0) {
                pL = Math.round((fuerzaL / totalFuerza) * 80) + 10; // Ajuste para dar un mínimo
                pV = Math.round((fuerzaV / totalFuerza) * 80) + 10;
                pE = 100 - pL - pV;
            }
            
            resumenTexto = `Datos de la temporada: ${local} (${formaL?.wins || 0} victorias) vs ${visita} (${formaV?.wins || 0} victorias).`;
        }

        // Determinar el Pick
        if (pL > pV + 10) { pickRecomendado = `Gana ${local} (${pL}%)`; colorPick = "#10b981"; }
        else if (pV > pL + 10) { pickRecomendado = `Gana ${visita} (${pV}%)`; colorPick = "#ef4444"; }

        // 5. Renderizar el panel (igual que te gusta)
        listaDiv.innerHTML = `
            <!-- ... (El mismo diseño HTML de tu panel: escudos, caja de Pick IA, probabilidades, H2H, etc.) ... -->
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PREDICCIÓN (Goal API SDK)</p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>
            <!-- ... Resto del HTML ... -->
        `;

    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center;'>Error: ${error.message}</p>`;
    }
}
