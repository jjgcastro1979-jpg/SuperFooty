async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaInput = document.getElementById('date-select').value;
    const PROXY_URL = 'https://royal-dream-9429.jjgcastro1979.workers.dev';

    if (!fechaInput) { alert("Por favor, selecciona una fecha primero."); return; }

    listaDiv.innerHTML = `<div class='loader'>Conectando con tu Cloudflare... ⏳</div>`;

    try {
        // Pedimos los partidos reales de la Premier League (PL) para la fecha elegida
        const url = `${PROXY_URL}/competitions/PL/matches?dateFrom=${fechaInput}&dateTo=${fechaInput}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Error HTTP: " + response.status);

        const data = await response.json();
        const partidos = data.matches || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.map(m => `
                <div class="match-card" style="padding: 15px; margin-bottom: 10px;">
                    <h3>${m.homeTeam.name} vs ${m.awayTeam.name}</h3>
                    <p style="color: #10b981;">✅ ¡Conexión con la API Exitosa!</p>
                </div>
            `).join('');
        } else {
            listaDiv.innerHTML = `<p style="color: orange; text-align: center;">El puente funciona, pero no hay partidos de Premier League el ${fechaInput}.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}</p>`;
    }
}
