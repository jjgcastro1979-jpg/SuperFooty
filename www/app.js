// ==========================================
// SUPERFOOTY PRO - ANÁLISIS PROFESIONAL (POISSON + TEMPORADA + H2H)
// ==========================================

// Base de datos de fuerzas (Ataque / Defensa)
const equiposData = {
    "Real Madrid": { atk: 2.1, def: 0.8 },
    "Barcelona": { atk: 2.0, def: 1.0 },
    "Atletico": { atk: 1.6, def: 0.7 },
    "Athletic": { atk: 1.4, def: 0.9 },
    "Real Sociedad": { atk: 1.3, def: 1.0 },
    "Betis": { atk: 1.3, def: 1.2 },
    "Sevilla": { atk: 1.1, def: 1.3 },
    "Valencia": { atk: 1.1, def: 1.2 },
    "Villarreal": { atk: 1.5, def: 1.3 },
    "Getafe": { atk: 0.8, def: 1.1 },
    "Osasuna": { atk: 1.0, def: 1.1 },
    "Elche": { atk: 0.9, def: 1.2 },
    "Deportivo": { atk: 1.2, def: 1.3 },
    "Racing Santander": { atk: 1.0, def: 1.4 },
    "Malaga": { atk: 1.1, def: 1.2 }
};

const defaultTeam = { atk: 1.2, def: 1.2 };

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function poisson(k, lambda) {
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function crearBarraProbabilidad(titulo, probabilidad) {
    let prob = parseFloat(probabilidad) || 0;
    let color = "#ef4444"; 
    if (prob >= 65) color = "#10b981";
    else if (prob >= 40) color = "#f59e0b";

    return `
        <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #475569;">${titulo}</span>
                <span style="color: ${color};">${Math.round(prob)}%</span>
            </div>
            <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${prob}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
            </div>
        </div>
    `;
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaNombre = document.getElementById('league-select').options[document.getElementById('league-select').selectedIndex].text;
    const fechaInput = document.getElementById('date-select').value;

    if (!fechaInput) { alert("Por favor, selecciona una fecha."); return; }

    listaDiv.innerHTML = `<div class='loader'>Generando jornada del ${fechaInput}... ⏳</div>`;

    const equipos = Object.keys(equiposData);
    const mezclados = [...equipos].sort(() => 0.5 - Math.random());

    setTimeout(() => {
        let html = '';
        for (let i = 0; i < 4; i++) {
            let local = mezclados[i*2];
            let visita = mezclados[i*2+1];
            const hora = `${18 + i}:00`;

            html += `
                <div class="match-card" onclick="analizarPartido('${local}', '${visita}', '${fechaInput}')">
                    <div class="match-header">
                        <span class="league-badge">${ligaNombre}</span>
                        <span class="match-time">⏰ ${hora}</span>
                    </div>
                    <div class="teams-row">
                        <div class="team-name">${local}</div>
                        <div class="vs-badge">VS</div>
                        <div class="team-name right">${visita}</div>
                    </div>
                </div>
            `;
        }
        listaDiv.innerHTML = html;
    }, 500);
}

function analizarPartido(local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    const fechaStr = new Date(fechaISO + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    listaDiv.innerHTML = `<div class='loader'>🧠 Analizando con modelo matemático y estadísticas... ⏳</div>`;

    const dataL = equiposData[local]
