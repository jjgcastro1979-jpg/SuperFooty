async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasFootballData[ligaId];
    const fechaInput = document.getElementById('date-select').value;

    if (!ligaInfo) { alert("Liga no configurada."); return; }
    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos reales del ${fechaInput}... ⏳</div>`;

    try {
        // AHORA SÍ USAMOS LA FECHA (dateFrom y dateTo)
        const url = `${PROXY_URL}/competitions/${ligaInfo.slug}/matches?dateFrom=${fechaInput}&dateTo=${fechaInput}`;
        const response = await fetch(url);
        
        // Control de errores (por si la API nos bloquea por pulsar muy rápido)
        if (!response.ok) {
            if (response.status === 429) throw new Error("Has pulsado demasiado rápido. La API te ha bloqueado 1 minuto. Espera y vuelve a intentarlo.");
            if (response.status === 403) throw new Error("Límite de peticiones de la API alcanzado. Espera un momento.");
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        const partidos = data.matches || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.map(match => {
                const local = match.homeTeam.name;
                const visita = match.awayTeam.name;
                const fechaObj = new Date(match.utcDate);
                const fechaReal = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="match-card" onclick="analizarPartido('${local}', '${visita}', '${fechaReal}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaInfo.nombre}</span>
                            <span class="match-time">📅 ${fechaReal} - ⏰ ${hora}</span>
                        </div>
                        <div class="teams-row">
                            <div class="team-name">${local}</div>
                            <div class="vs-badge">VS</div>
                            <div class="team-name right">${visita}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos de ${ligaInfo.nombre} programados para el ${fechaInput}.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px; font-weight:bold;'>⚠️ ${error.message}</p>`;
    }
}
