// ==========================================
// SUPERFOOTY PRO - DATOS 100% REALES (ESPN HOY)
// ==========================================

const ligasESPN = {
    "esp.1": { nombre: "La Liga", slug: "esp.1" },
    "eng.1": { nombre: "Premier League", slug: "eng.1" },
    "ita.1": { nombre: "Serie A", slug: "ita.1" },
    "ger.1": { nombre: "Bundesliga", slug: "ger.1" },
    "fra.1": { nombre: "Ligue 1", slug: "fra.1" }
};

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
    "Malaga": { atk: 1.1, def: 1.2 },
    "Man City": { atk: 2.2, def: 0.9 },
    "Arsenal": { atk: 1.9, def: 0.8 },
    "Liverpool": { atk: 1.8, def: 1.0 },
    "Chelsea": { atk: 1.5, def: 1.1 },
    "Man United": { atk: 1.3, def: 1.2 },
    "Tottenham": { atk: 1.5, def: 1.3 }
};

const defaultTeam = { atk: 1.2, def: 1.2 };

function factorial(n) { if (n === 0 || n === 1) return 1; let result = 1; for (let i = 2; i <= n; i++) result *= i; return result; }
function poisson(k, lambda) { return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k); }

function crearBarraProbabilidad(titulo, probabilidad) {
    let prob = parseFloat(probabilidad) || 0;
    let color = "#ef4444"; if (prob >= 65) color = "#10b981"; else if (prob >= 40) color = "#f59e0b";
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
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasESPN[ligaId];

    if (!ligaInfo) { alert("Liga no configurada."); return; }

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos reales de hoy... ⏳</div>`;

    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${ligaInfo.slug}/scoreboard`;
        const response = await fetch(url);
        const data = await response.json();
        
        const partidos = data.events || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.map(match => {
                const local = match.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName;
                const visita = match.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName;
                const fechaReal = new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const hora = new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
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
                    <div class="match-card" onclick="analizarPartido('${local}', '${visita}', '${fechaReal}')">
                        <div class="match-header">
                            <span class="league-badge">${ligaInfo.nombre} ${extraBadge}</span>
                            <span class="match-time">📅 ${fechaReal} - ${displayTime}</span>
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay partidos de ${ligaInfo.nombre} programados para hoy en la vida real.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<p style='color:red; text-align:center; padding:20px;'>Error al conectar con los datos reales de ESPN.</p>`;
    }
}

function analizarPartido(local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = `<div class='loader'>🧠 Analizando partido real... ⏳</div>`;

    // --- BUSCAMOS LAS FUERZAS REALES ---
    let dataL = defaultTeam;
    let dataV = defaultTeam;
    
    // Buscamos coincidencias parciales en los nombres para asignar la fuerza
    for (let key in equiposData) {
        if (local.includes(key)) dataL = equiposData[key];
        if (visita.includes(key)) dataV = equiposData[key];
    }

    const xgL = dataL.atk * dataV.def * 1.2; 
    const xgV = dataV.atk * dataL.def;

    let probGolL = 1 - poisson(0, xgL);
    let probGolV = 1 - poisson(0, xgV);
    let probOver15 = 1 - (poisson(0, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(1, xgV) + poisson(1, xgL)*poisson(0, xgV));
    let probOver25 = 1 - (poisson(0, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(1, xgV) + poisson(1, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(2, xgV) + poisson(1, xgL)*poisson(1, xgV) + poisson(2, xgL)*poisson(0, xgV));
    let bttsYes = probGolL * probGolV * 100;

    let probWinL = 0, probWinV = 0, probDraw = 0;
    for(let i=0; i<=5; i++) {
        for(let j=0; j<=5; j++) {
            let p = poisson(i, xgL) * poisson(j, xgV);
            if(i > j) probWinL += p;
            else if(j > i) probWinV += p;
            else probDraw += p;
        }
    }

    probWinL = probWinL * 100; probWinV = probWinV * 100; probDraw = probDraw * 100;
    probOver15 = probOver15 * 100; probOver25 = probOver25 * 100;

    // SIMULAMOS EL RESUMEN DE TEMPORADA BASADO EN LA FUERZA REAL
    const pj = 14; 
    let winL = Math.round(dataL.atk * 4); let drawL = Math.round(dataL.def * 2); let lossL = pj - winL - drawL;
    let winV = Math.round(dataV.atk * 3); let drawV = Math.round(dataV.def * 2); let lossV = pj - winV - drawV;

    let mejorOpcion = { nombre: "Empate", valor: probDraw };
    if (probWinL > mejorOpcion.valor) mejorOpcion = { nombre: `Victoria ${local}`, valor: probWinL };
    if (probWinV > mejorOpcion.valor) mejorOpcion = { nombre: `Victoria ${visita}`, valor: probWinV };
    if (probOver25 > mejorOpcion.valor) mejorOpcion = { nombre: `Más de 2.5 Goles`, valor: probOver25 };
    if (bttsYes > mejorOpcion.valor) mejorOpcion = { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes };

    let confColor = mejorOpcion.valor >= 70 ? "#10b981" : (mejorOpcion.valor >= 50 ? "#f59e0b" : "#ef4444");

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:15px;">📅 Partido Real: ${fechaISO}</p>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📈 Temporada (Estimación por Fuerza)</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                <div style="width: 45%; text-align: center;">
                    <p style="font-weight: bold; color: var(--primary); margin-bottom: 5px;">${local}</p>
                    <p style="font-size: 12px; color: #475569;">${winL}V - ${drawL}E - ${lossL}D</p>
                </div>
                <div style="width: 45%; text-align: center;">
                    <p style="font-weight: bold; color: #ef4444; margin-bottom: 5px;">${visita}</p>
                    <p style="font-size: 12px; color: #475569;">${winV}V - ${drawV}E - ${lossV}D</p>
                </div>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, probWinL)}
                ${crearBarraProbabilidad(`Empate`, probDraw)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, probWinV)}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Goles</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad("Ambos Marcan (SÍ)", bttsYes)}
                ${crearBarraProbabilidad("Más de 2.5 Goles Totales", probOver25)}
            </div>

            <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-top: 10px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                <h4 style="color: #f59e0b; font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 10px;">
                    🏆 RECOMENDACIÓN FINAL
                </h4>
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">
                        ${mejorOpcion.nombre}
                    </p>
                    <p style="color: #10b981; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
                        ${Math.round(mejorOpcion.valor)}% de probabilidad
                    </p>
                </div>
            </div>

        </div>
    `;
                                              }
