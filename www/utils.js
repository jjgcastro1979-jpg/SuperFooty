// ==========================================
// UTILS.JS - Manejo de Fechas y Conexiones
// ==========================================

// Función que convierte la fecha de 2026 a 2024 para que la API encuentre partidos
function calcularFechaReal(fechaUsuario) {
    if (!fechaUsuario) return "";
    
    let fechaBusqueda = fechaUsuario;
    // Si el año es 2025 o 2026, lo cambiamos a 2024
    if (fechaBusqueda.startsWith('2025') || fechaBusqueda.startsWith('2026')) {
        fechaBusqueda = '2024' + fechaBusqueda.substring(4);
    }
    return fechaBusqueda.replace(/-/g, '');
}

// Función para buscar partidos (Con Plan B de seguridad)
async function buscarPartidosAPI(ligaSlug, fechaUsuario) {
    const fechaParaAPI = calcularFechaReal(fechaUsuario);
    
    // 1. Intentar con la API principal
    try {
        const url = `https://worldcup26.ir/get/soccer/${ligaSlug}/scoreboard?dates=${fechaParaAPI}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.events && data.events.length > 0) {
                return data.events;
            }
        }
    } catch (e) {
        console.log("Fallo la API principal, intentando Plan B...");
    }

    // 2. Plan B: Si la principal falla, usamos ESPN directamente
    try {
        const urlESPN = `https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaSlug}/scoreboard?dates=${fechaParaAPI}`;
        const responseESPN = await fetch(urlESPN);
        if (responseESPN.ok) {
            const dataESPN = await responseESPN.json();
            return dataESPN.events || [];
        }
    } catch (e) {
        console.log("También falló ESPN.");
    }

    // Si ambas fallan, devolvemos lista vacía
    return [];
}
