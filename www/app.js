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
 const fechaSeleccionada = fechaInput.value; // Formato YYYY-MM-DD
 const liga = ligasFootballData[ligaId];
 
 // Modificación clave: Solicitamos los partidos de la competición de forma limpia sin filtros conflictivos de fechas
 const url = `${PROXY_URL}/v4/competitions/${liga.slug}/matches`;

 try {
  const response = await fetch(url, { 
   method: 'GET',
   mode: 'cors',
   headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
   throw new Error(`Error de conexión con el servidor (${response.status})`);
  }

  const data = await response.json();
  const todosLosPartidos = data.matches || [];

  // Filtramos los partidos por la fecha seleccionada localmente en la APK
  partidosActuales = todosLosPartidos.filter(partido => {
   if (!partido.utcDate) return false;
   const fechaPartido = partido.utcDate.slice(0, 10); // Extrae el formato YYYY-MM-DD
   return fechaPartido === fechaSeleccionada;
  });

  if (partidosActuales.length === 0) {
   lista.innerHTML = `<div class="info-box">No se encontraron partidos programados para la liga <b>${escapeHTML(liga.nombre)}</b> en la fecha seleccionada (${fechaSeleccionada}). Prueba con las fechas del fin de semana (sábado o domingo).</div>`;
   return;
  }

  renderizarPartidos(liga.nombre);
 } catch (error) {
  lista.innerHTML = `<div class="error-box">⚠️ Aviso de la app: <br><b>${escapeHTML(error.message)}</b><br><br>Por favor, comprueba que has guardado el último código en tu Worker de Cloudflare.</div>`;
 } finally {
  if (btn) btn.disabled = false;
 }
}
