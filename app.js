
const API_KEY = '7103c2e016acb7d22fdf503a1dab45c9'; 
const API_HOST = 'https://v3.football.api-sports.io';

document.getElementById('fetch-btn').addEventListener('click', async () => {
    const leagueId = document.getElementById('league-select').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Cargando partidos... ⏳</p>';

    try {
        const response = await fetch(`${API_HOST}/fixtures?league=${leagueId}&next=5`, {
            method: 'GET',
            headers: {
                'x-apisports-key': API_KEY 
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.response && data.response.length > 0) {
            resultsDiv.innerHTML = data.response.map(match => {
                const homeTeam = match.teams.home.name;
                const awayTeam = match.teams.away.name;
                const date = new Date(match.fixture.date).toLocaleString('es-ES');
                return `
                    <div class="match-card">
                        <strong>${homeTeam} vs ${awayTeam}</strong>
                        <p>📅 ${date}</p>
                    </div>
                `;
            }).join('');
        } else {
            resultsDiv.innerHTML = '<p>No hay partidos programados para esta liga en los próximos días.</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `<p style="color: red;">Error: ${error.message}. Revisa tu clave API o tu conexión.</p>`;
    }
});
