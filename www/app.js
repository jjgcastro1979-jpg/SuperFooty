// ==========================================
// SUPERFOOTY PRO - VERSIÓN PESTAÑAS A PRUEBA DE BALAS
// ==========================================

const PROXY_URL = 'https://royal-dream-9429.jjgcastro1979.workers.dev';

const ligasFootballData = {
    "esp.1": { nombre: "La Liga", slug: "PD" },
    "eng.1": { nombre: "Premier League", slug: "PL" },
    "ita.1": { nombre: "Serie A", slug: "SA" },
    "ger.1": { nombre: "Bundesliga", slug: "BL1" },
    "fra.1": { nombre: "Ligue 1", slug: "FL1" }
};

const equiposData = {
    "Real Madrid": { atk: 2.1, def: 0.8 }, "Barcelona": { atk: 2.0, def: 1.0 },
    "Atletico": { atk: 1.6, def: 0.7 }, "Athletic": { atk: 1.4, def: 0.9 },
    "Real Sociedad": { atk: 1.3, def: 1.0 }, "Betis": { atk: 1.3, def: 1.2 },
    "Sevilla": { atk: 1.1, def: 1.3 }, "Valencia": { atk: 1.1, def: 1.2 },
    "Villarreal": { atk: 1.5, def: 1.3 }, "Getafe": { atk: 0.8, def: 1.1 },
    "Osasuna": { atk: 1.0, def: 1.1 }, "Elche": { atk: 0.9, def: 1.2 },
    "Deportivo": { atk: 1.2, def: 1.3 }, "Malaga": { atk: 1.1, def: 1.2 },
    "Man City": { atk: 2.2, def: 0.9 }, "Arsenal": { atk: 1.9, def: 0.8 },
    "Liverpool": { atk: 1.8, def: 1.0 }, "Chelsea": { atk: 1.5, def: 1.1 },
    "Man United": { atk: 1.3, def: 1.2 }, "Tottenham": { atk: 1.5, def: 1.3 }
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

function getOverProb(line, lambda) {
    let prob = 0;
    for(let i = 0; i <= Math.floor(line); i++) {
        prob += poisson(i, lambda);
    }
    return (1 - prob) * 100;
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

function generarTablaLineas(lambdaL, lambdaV, maxLine) {
    let lambdaT = lambdaL + lambdaV;
    let html = `<table style="width:100%; border-collapse: collapse; font-size: 12px; text-align: center; margin-top: 10px;">
        <tr style="background:#e2e8f0; color:#334155;">
            <th style="padding:8px; border:1px solid #cbd5e1;">Línea</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">Local</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">Total</th>
            <th style="padding:8px; border:1px solid #cbd5e1;">Visita</th>
        </tr>`;
    
    let getColor = (p) => p >= 65 ? '#10b981' : (p >= 40 ? '#f59e0b' : '#ef4444');
    
    for (let line = 1.5; line <= maxLine; line += 1) {
        let probL = getOverProb(line, lambdaL);
        let probV = getOverProb(line, lambdaV);
        let probT = getOverProb(line, lambdaT);
        
        html += `<tr>
            <td style="padding:6px; border:1px solid #cbd5e1; font-weight:bold; background:#f8fafc;">+${line}</td>
            <td style="padding:6px; border:1px solid #cbd5e1; color:${getColor(probL)}; font-weight:bold;">${Math.round(probL)}%</td>
            <td style="padding:6px; border:1px solid #cbd5e1; color:${getColor(probT)}; font-weight:bold; background:#f8fafc;">${Math.round(probT)}%</td>
            <td style="padding:6px; border:1px solid #cbd5e1; color:${getColor(probV)}; font-weight:bold;">${Math.round(probV)}%</td>
        </tr>`;
    }
    html += `</table>`;
    return html;
}

// Función SÚPER SIMPLE para cambiar de pestaña sin fallos
function cambiarPestana(idTab) {
    // Ocultar todas las pestañas
    document.getElementById('tab-principal').style.display = 'none';
    document.getElementById('tab-goles').style.display = 'none';
    document.getElementById('tab-corners').style.display = 'none';
    document.getElementById('tab-cards').style.display = 'none';
    
    // Quitar color verde a todos los botones
    document.getElementById('btn-tab-principal').style.background = '#ffffff';
    document.getElementById('btn-tab-principal').style.color = '#1e3a8a';
    document.getElementById('btn-tab-goles').style.background = '#ffffff';
    document.getElementById('btn-tab-goles').style.color = '#1e3a8a';
    document.getElementById('btn-tab-corners').style.background = '#ffffff';
    document.getElementById('btn-tab-corners').style.color = '#1e3a8a';
    document.getElementById('btn-tab-cards').style.background = '#ffffff';
    document.getElementById('btn-tab-cards').style.color = '#1e3a8a';

    // Mostrar la pestaña seleccionada y poner su botón verde
    document.getElementById('tab-' + idTab).style.display = 'block';
    document.getElementById('btn-tab-' + idTab).style.background = '#10b981';
    document.getElementById('btn-tab-' + idTab).style.color = '#ffffff';
}

async function cargarPartidos() {
    const listaDiv = document.getElementById('lista-partidos');
    const ligaId = document.getElementById('league-select').value;
    const ligaInfo = ligasFootballData[ligaId];

    if (!ligaInfo) { alert("Liga no configurada."); return; }

    listaDiv.innerHTML = `<div class='loader'>Buscando partidos reales en la API... ⏳</div>`;

    try {
        const url = `${PROXY_URL}/competitions/${ligaInfo.slug}/matches?status=SCHEDULED`;
        const response = await fetch(url);
        const textoRespuesta = await response.text();

        if (textoRespuesta.includes("Hola, este") || textoRespuesta.includes("Hello World")) {
            throw new Error("El Worker de Cloudflare tiene el código por defecto.");
        }

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = JSON.parse(textoRespuesta);
        const partidos = data.matches || [];

        if (partidos.length > 0) {
            listaDiv.innerHTML = partidos.slice(0, 10).map(match => {
                const local = match.homeTeam.name || "Local";
                const visita = match.awayTeam.name || "Visitante";
                
                const fechaObj = new Date(match.utcDate);
                const fechaReal = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                const safeLocal = local.replace(/'/g, "\\'");
                const safeVisita = visita.replace(/'/g, "\\'");

                return `
                    <div class="match-card" onclick="analizarPartido('${safeLocal}', '${safeVisita}', '${fechaReal}')">
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
            listaDiv.innerHTML = `<p style='text-align:center; padding:20px; color:#64748b;'>No hay próximos partidos programados.</p>`;
        }
    } catch (error) {
        listaDiv.innerHTML = `<div style='background: #fee2e2; padding: 15px; border-radius: 8px; color: #b91c1c;'>
            <h4>Error de conexión</h4><p>${error.message}</p></div>`;
    }
}

function analizarPartido(local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando análisis... ⏳</div>`;

    try {
        let dataL = defaultTeam;
        let dataV = defaultTeam;
        
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

        let lambdaCornersL = Math.max(3.5, (dataL.atk * 3) - (dataV.def * 0.5) + 2);
        let lambdaCornersV = Math.max(3.5, (dataV.atk * 3) - (dataL.def * 0.5) + 2);
        let lambdaCardsL = Math.max(1.5, (dataV.atk * 1.5) - (dataL.def * 0.5) + 1);
        let lambdaCardsV = Math.max(1.5, (dataL.atk * 1.5) - (dataV.def * 0.5) + 1);

        let lambdaCornersT = lambdaCornersL + lambdaCornersV;
        let lambdaCardsT = lambdaCardsL + lambdaCardsV;

        let textoAnalisis = "";
        if (probWinL > 60) textoAnalisis = `El modelo otorga ventaja a ${local}. Su capacidad ofensiva (xG: ${xgL.toFixed(2)}) será clave.`;
        else if (probWinV > 60) textoAnalisis = `A pesar de jugar fuera, ${visita} es favorito. Su xG es de ${xgV.toFixed(2)}.`;
        else if (bttsYes > 60) textoAnalisis = `Partido abierto. Ambos equipos anotarán (${Math.round(bttsYes)}%). Habrá espacios.`;
        else textoAnalisis = `Partido cerrado y táctico. Ambos priorizan el orden defensivo.`;

        let comb1X = Math.min(probWinL + probDraw, 98);
        let combX2 = Math.min(probWinV + probDraw, 98);
        let combLocalOver15 = (probWinL * probOver15) / 100;
        let combVisitaOver15 = (probWinV * probOver15) / 100;
        let combBTTS_Over25 = (bttsYes * probOver25) / 100;

        let todasLasOpciones = [
            { nombre: `Victoria ${local}`, valor: probWinL },
            { nombre: `Empate`, valor: probDraw },
            { nombre: `Victoria ${visita}`, valor: probWinV },
            { nombre: `Más de 1.5 Goles`, valor: probOver15 },
            { nombre: `Más de 2.5 Goles`, valor: probOver25 },
            { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes },
            { nombre: `Combinada: ${local} o Empate (1X)`, valor: comb1X },
            { nombre: `Combinada: ${visita} o Empate (X2)`, valor: combX2 },
            { nombre: `Combinada: Gana ${local} + Más de 1.5 Goles`, valor: combLocalOver15 },
            { nombre: `Combinada: Gana ${visita} + Más de 1.5 Goles`, valor: combVisitaOver15 },
            { nombre: `Combinada: Ambos Marcan + Más de 2.5 Goles`, valor: combBTTS_Over25 }
        ];

        for(let l=3.5; l<=10.5; l+=1) {
            let p = getOverProb(l, lambdaCornersT);
            if(p >= 50) todasLasOpciones.push({ nombre: `Más de ${l} Córners Totales`, valor: p });
        }
        for(let l=1.5; l<=8.5; l+=1) {
            let p = getOverProb(l, lambdaCardsT);
            if(p >= 50) todasLasOpciones.push({ nombre: `Más de ${l} Tarjetas Totales`, valor: p });
        }

        let opcionesValidas = todasLasOpciones.filter(op => op.valor >= 50).sort((a, b) => b.valor - a.valor);
        let mejorOpcion = opcionesValidas.length > 0 ? opcionesValidas[0] : todasLasOpciones.sort((a, b) => b.valor - a.valor)[0];

        let nivelConfianza = mejorOpcion.valor >= 75 ? "ALTA" : (mejorOpcion.valor >= 60 ? "MEDIA" : "BAJA");
        let colorConfianza = nivelConfianza === "ALTA" ? "#10b981" : (nivelConfianza === "MEDIA" ? "#f59e0b" : "#ef4444");

        let tablaCorners = generarTablaLineas(lambdaCornersL, lambdaCornersV, 10.5);
        let tablaCards = generarTablaLineas(lambdaCardsL, lambdaCardsV, 8.5);

        listaDiv.innerHTML = `
            <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:15px; padding:10px;">← Volver a Partidos</button>
            
            <div class="match-card" style="padding: 15px 10px;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="text-align: center; width: 42%;"><h3 style="font-size: 14px; margin: 0; line-height: 1.2;">${local}</h3></div>
                    <div style="text-align: center; width: 16%;"><span style="font-size: 18px; font-weight: 900; color: #94a3b8;">VS</span></div>
                    <div style="text-align: center; width: 42%;"><h3 style="font-size: 14px; margin: 0; line-height: 1.2;">${visita}</h3></div>
                </div>

                <!-- BOTONES DE LAS PESTAÑAS -->
                <div style="display: flex; gap: 5px; margin-bottom: 15px; overflow-x: auto; padding-bottom: 5px;">
                    <button id="btn-tab-principal" onclick="cambiarPestana('principal')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: #10b981; color: white; white-space: nowrap; cursor: pointer;">🏆 Principal</button>
                    <button id="btn-tab-goles" onclick="cambiarPestana('goles')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: white; color: #1e3a8a; white-space: nowrap; cursor: pointer;">⚽ Goles</button>
                    <button id="btn-tab-corners" onclick="cambiarPestana('corners')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: white; color: #1e3a8a; white-space: nowrap; cursor: pointer;">🚩 Córners</button>
                    <button id="btn-tab-cards" onclick="cambiarPestana('cards')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: white; color: #1e3a8a; white-space: nowrap; cursor: pointer;">🟨 Tarjetas</button>
                </div>

                <!-- PESTAÑA 1: PRINCIPAL -->
                <div id="tab-principal" style="display: block;">
                    <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 2px solid #f59e0b; text-align: center;">
                        <h4 style="color: #f59e0b; font-size: 14px; margin-bottom: 10px;">RECOMENDACIÓN FINAL</h4>
                        <p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">${mejorOpcion.nombre}</p>
                        <p style="color: #10b981; font-size: 15px; font-weight: bold; margin-bottom: 10px;">${Math.round(mejorOpcion.valor)}% de prob.</p>
                        <span style="background: ${colorConfianza}20; color: ${colorConfianza}; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid ${colorConfianza};">CONFIANZA: ${nivelConfianza}</span>
                    </div>

                    <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 15px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 10px; font-weight: bold; margin-bottom: 5px;">GOLES ESPERADOS (xG)</p>
                        <p style="color: #10b981; font-size: 14px; font-weight: 900;">${xgL.toFixed(2)} - ${xgV.toFixed(2)}</p>
                    </div>

                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 15px;">
                        <p style="color:#14532d; font-size:12px; line-height:1.5; margin: 0;"><strong>Análisis:</strong> ${textoAnalisis}</p>
                    </div>

                    <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        ${crearBarraProbabilidad(`Victoria ${local}`, probWinL)}
                        ${crearBarraProbabilidad(`Empate`, probDraw)}
                        ${crearBarraProbabilidad(`Victoria ${visita}`, probWinV)}
                    </div>
                </div>

                <!-- PESTAÑA 2: GOLES -->
                <div id="tab-goles" style="display: none;">
                    <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Mercados de Goles</h4>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0;">
                        ${crearBarraProbabilidad("Más de 1.5 Goles Totales", probOver15)}
                        ${crearBarraProbabilidad("Más de 2.5 Goles Totales", probOver25)}
                        ${crearBarraProbabilidad("Ambos Equipos Marcan (SÍ)", bttsYes)}
                    </div>
                    
                    <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🔗 Combinadas</h4>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        ${crearBarraProbabilidad(`${local} o Empate (1X)`, comb1X)}
                        ${crearBarraProbabilidad(`${visita} o Empate (X2)`, combX2)}
                        ${crearBarraProbabilidad(`Gana ${local} + +1.5 Goles`, combLocalOver15)}
                        ${crearBarraProbabilidad(`Gana ${visita} + +1.5 Goles`, combVisitaOver15)}
                        ${crearBarraProbabilidad(`Ambos Marcan + +2.5 Goles`, combBTTS_Over25)}
                    </div>
                </div>

                <!-- PESTAÑA 3: CÓRNERS -->
                <div id="tab-corners" style="display: none;">
                    <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Líneas de Córners (1.5 a 10.5)</h4>
                    <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        ${tablaCorners}
                    </div>
                </div>

                <!-- PESTAÑA 4: TARJETAS -->
                <div id="tab-cards" style="display: none;">
                    <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Líneas de Tarjetas (1.5 a 8.5)</h4>
                    <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        ${tablaCards}
                    </div>
                </div>

            </div>
        `;
    } catch(e) {
        listaDiv.innerHTML = `
           
