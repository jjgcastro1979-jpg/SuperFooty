// ==========================================
// 2. CARGAR Y CONSULTAR PARTIDOS DESDE API (CORREGIDO)
// ==========================================
async function cargarPartidos() {
 const lista = document.getElementById('lista-partidos');
 const ligaSelect = document.getElementById('league-select');
 const fechaInput = document.getElementById('date-select');
 const btn = document.getElementById('btn-cargar');

 if (!lista || !ligaSelect || !fechaInput) return;

 if (!fechaInput.value) {
  lista.innerHTML = '<div class="error-box">Por favor, selecciona una fecha válida.</div>';
  return;
 }

 if (btn) btn.disabled = true;
 lista.innerHTML = '<div class="loader">🔄 Conectando con Cloudflare y descargando partidos...</div>';

 const ligaId = ligaSelect.value;
 const fecha = fechaInput.value;
 const liga = ligasFootballData[ligaId];
 const url = `${PROXY_URL}/v2/competitions/${liga.slug}/matches?dateFrom=${fecha}&dateTo=${fecha}`;

 try {
  // NOTA: Si tu Worker de Cloudflare no añade automáticamente tu API KEY, 
  // introduce aquí tu Token de football-data.org sustituyendo 'TU_API_KEY_AQUI'
  const response = await fetch(url, {
   method: 'GET',
   headers: {
    'X-Auth-Token': 'TU_API_KEY_AQUI', // <- Pon aquí tu token si el proxy lo requiere
    'Accept': 'application/json'
   }
  });

  // Si la respuesta no es un JSON o falla, obtenemos el texto de error de forma segura
  const textoRespuesta = await response.text();
  
  let data;
  try {
   data = JSON.parse(textoRespuesta);
  } catch (e) {
   throw new Error("El servidor devolvió una página HTML en lugar de datos JSON. Esto suele ocurrir si la API Key es inválida o el formato de fecha no tiene partidos disponibles.");
  }

  if (!response.ok) {
   throw new Error(data.message || `Error del servidor de datos (${response.status})`);
  }

  partidosActuales = data.matches || [];

  if (partidosActuales.length === 0) {
   lista.innerHTML = `<div class="info-box">No se encontraron partidos programados para la liga <b>${escapeHTML(liga.nombre)}</b> en la fecha seleccionada (${fecha}).</div>`;
   return;
  }

  renderizarPartidos(liga.nombre);
 } catch (error) {
  lista.innerHTML = `<div class="error-box">⚠️ Hubo un problema al cargar los partidos: <br><b>${escapeHTML(error.message)}</b></div>`;
 } finally {
  if (btn) btn.disabled = false;
 }
    }
