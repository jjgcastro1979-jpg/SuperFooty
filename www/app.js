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
 
 // Llamamos a través de la ruta limpia de tu proxy
 const url = `${PROXY_URL}/v2/competitions/${liga.slug}/matches?dateFrom=${fecha}&dateTo=${fecha}`;

 try {
  const response = await fetch(url, { method: 'GET' });
  const data = await response.json();

  if (!response.ok) {
   throw new Error(data.message || `Error del servidor (${response.status})`);
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
