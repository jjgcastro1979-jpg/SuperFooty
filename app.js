const API_KEY = '7103c2e016acb7d22fdf503a1dab45c9'; 
const API_HOST = 'https://v3.football.api-sports.io';

document.getElementById('fetch-btn').addEventListener('click', async () => {
    const leagueId = document.getElementById('league-select').value;
    const resultsDiv = document.getElementById('results');
    
    // Obtenemos la fecha de hoy en formato AAAA-MM-DD
    const hoy = new Date().toISOString().split('T')[0]; 
    
    resultsDiv.innerHTML = `<p>Buscando partidos para hoy (${hoy})... ⏳</p>`;

    try {
        // Añadimos &season=2023 y &date=hoy para asegurar que encuentre datos
        const response = await fetch(`${API_HOST}/fixtures?league=${leagueId}&season=2023&date=${hoy}`, {
            method: 'GET',
            headers: { 'x-apisports-key': API_KEY }
        });

        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            resultsDiv.innerHTML = `<p style="color: red;">❌ Error: ${JSON.stringify(data.errors)}</p>`;
            return;
        }

        if (data.response && data.response.length > 0) {
            resultsDiv.innerHTML = data.response.map(match => {
                const homeTeam = match.teams.home.name;
                const awayTeam = match.teams.away.name;
                // Formateamos la hora del partido
                const hora = new Date(match.fixture.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
                return `
                    <div class="match-card">
                        <strong>${homeTeam} vs ${awayTeam}</strong>
                        <p>⏰ Hora: ${hora}</p>
                    </div>
                `;
            }).join('');
        } else {
            resultsDiv.innerHTML = `<p>No hay partidos de esta liga programados para HOY (${hoy}). Prueba a seleccionar otra liga como la Premier League.</p>`;
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p style="color: red;">❌ Error de red: ${error.message}</p>`;
    }
});
