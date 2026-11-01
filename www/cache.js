// ==========================================
// CACHE.JS - Memoria local de SuperFooty
// ==========================================

// Guarda los datos en la memoria del teléfono
function guardarEnCache(fecha, liga, datos) {
    try {
        let cache = JSON.parse(localStorage.getItem('superfooty_cache')) || {};
        if (!cache[fecha]) cache[fecha] = {};
        
        cache[fecha][liga] = {
            timestamp: new Date().getTime(),
            datos: datos
        };
        
        localStorage.setItem('superfooty_cache', JSON.stringify(cache));
        console.log("Datos guardados en caché para:", fecha, liga);
    } catch (e) {
        console.error("Error guardando en caché:", e);
    }
}

// Recupera los datos de la memoria (válidos por 2 horas)
function obtenerDeCache(fecha, liga) {
    try {
        let cache = JSON.parse(localStorage.getItem('superfooty_cache')) || {};
        let entrada = cache[fecha] && cache[fecha][liga];
        
        if (entrada) {
            let tiempoTranscurrido = new Date().getTime() - entrada.timestamp;
            // 7200000 ms = 2 horas
            if (tiempoTranscurrido < 7200000) {
                console.log("Cargando desde caché...");
                return entrada.datos;
            }
        }
    } catch (e) {
        console.error("Error leyendo caché:", e);
    }
    return null;
}

// Limpia la caché vieja
function limpiarCache() {
    localStorage.removeItem('superfooty_cache');
    console.log("Caché limpiada.");
}
