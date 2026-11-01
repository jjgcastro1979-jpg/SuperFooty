async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasAPI[ligaId];
    const fechaInput = document.getElementById('date-select').value;

    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }
    if (!ligaInfo) {
        listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#f59e0b; font-weight:bold;'>La liga seleccionada no está configurada.</p>`;
        return;
    }

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos del ${fechaInput}... ⏳</div>`;

    try {
        let partidos = [];

        // --- 1. MUNDIAL 2026 (Archivo estático de openfootball) ---
        if (ligaId === 'worldcup2026') {
            const url = `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`;
            const res = await fetch(url);
            const data = await res.json();
            
            // Filtramos los partidos que coinciden con la fecha seleccionada
            const partidosDelDia = data.matches.filter(m => m.date === fechaInput);
            
            // Adaptamos el formato de openfootball al formato que espera tu app
            partidos = partidosDelDia.map(m => ({
                id: `${m.date}-${m.team1}-${m.team2}`,
                date: m.date + 'T' + (m.time ? m.time.split(' ')[0] : '20:00') + ':00Z',
                status: { type: { state: m.score ? 'post' : 'pre', description: m.score ? 'Final' : 'Scheduled' } },
                competitions: [{
                    competitors: [
                        { homeAway: 'home', team: { displayName: m.team1 }, score: m.score ? m.score.ft[0] : null },
                        { homeAway: 'away', team: { displayName: m.team2 }, score: m.score ? m.score.ft[1] : null }
                    ]
                }]
            }));
        } 
        // --- 2. LIGAS REGULARES (SportScore con proxy CORS) ---
        else {
            // Usamos un proxy CORS público para evitar bloqueos de Android
            const fechaFormateada = fechaInput.replace(/-/g, '');
            const apiUrl = `https://sportscore.com/api/sports/football/events/date/${fechaFormateada}`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
            
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const data = await res.json();
                // Adaptamos la respuesta de SportScore
                partidos = (data.events || []).map(e => ({
                    id: e.id,
                    date: e.start_time,
                    status: { type: { state: e.status === 'finished' ? 'post' : (e.status === 'live' ? 'in' : 'pre') } },
                    competitions: [{
                        competitors: [
                            { homeAway: 'home', team: { displayName: e.home_team.name }, score: e.home_score },
                            { homeAway: 'away', team: { displayName: e.away_team.name }, score: e.away_score }
                        ]
                    }]
                }));
            }
        }

        // --- RENDERIZADO (Igual que antes) ---
        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.map(match => {
                const local = match.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName;
                const visita = match.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName;
                const hora = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const matchId = match.id;

                const estado = match.status?.type?.state;
                const scoreHome = match.competitions[0].competitors.find(c => c.homeAway === 'home').score;
                const scoreAway = match.competitions[0].competitors.find(c => c.homeAway === 'away').score;

                let displayTime = `⏰ ${hora}`;
                let extraBadge = `<span style="background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Pendiente</span>`;

                if (estado === 'post') {
                    displayTime = `<span style="color: #ef4444; font-weight: 900; font-size: 14px;">${scoreHome} - ${scoreAway}</span>`;
                    extraBadge = `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">Finalizado</span>`;
                } else if (estado === 'in') {
                    displayTime = `<span style="color: #10b981; font-weight: 900; font-size: 14px;">${scoreHome} - ${scoreAway}</span>`;
                    extraBadge = `<span style="background:#10b981; color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:5px;">EN VIVO</span>`;
                }

                return `
                    <div class="match-card" onclick="analizarPartido('${matchId}', '${ligaId}', '${local}', '${visita}', '${fechaInput}', '${estado}', '${scoreHome}', '${scoreAway}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaInfo.nombre} ${extraBadge}</span>
                            <span class="match-time">${displayTime}</span>
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos programados para el ${fechaInput}.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error de conexión. Revisa tu conexión a internet.</p>`;
    }
                        }
