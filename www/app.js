// ==========================================
// SUPERFOOTY PRO - VERSIÓN SIN CORTES (TABS)
// ==========================================

var PROXY_URL = 'https://royal-dream-9429.jjgcastro1979.workers.dev';

var ligasFootballData = {
    "esp.1": { nombre: "La Liga", slug: "PD" },
    "eng.1": { nombre: "Premier League", slug: "PL" },
    "ita.1": { nombre: "Serie A", slug: "SA" },
    "ger.1": { nombre: "Bundesliga", slug: "BL1" },
    "fra.1": { nombre: "Ligue 1", slug: "FL1" }
};

var equiposData = {
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

var defaultTeam = { atk: 1.2, def: 1.2 };

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    var result = 1;
    for (var i = 2; i <= n; i++) result *= i;
    return result;
}

function poisson(k, lambda) {
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function getOverProb(line, lambda) {
    var prob = 0;
    for(var i = 0; i <= Math.floor(line); i++) {
        prob += poisson(i, lambda);
    }
    return (1 - prob) * 100;
}

function crearBarraProbabilidad(titulo, probabilidad) {
    var prob = parseFloat(probabilidad) || 0;
    var color = "#ef4444"; 
    if (prob >= 65) color = "#10b981";
    else if (prob >= 40) color = "#f59e0b";

    var html = '<div style="margin-bottom: 8px;">';
    html += '<div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 4px;">';
    html += '<span style="color: #475569;">' + titulo + '</span>';
    html += '<span style="color: ' + color + ';">' + Math.round(prob) + '%</span>';
    html += '</div>';
    html += '<div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">';
    html += '<div style="width: ' + prob + '%; height: 100%; background: ' + color + '; border-radius: 3px;"></div>';
    html += '</div></div>';
    
    return html;
}

function generarTablaLineas(lambdaL, lambdaV, maxLine) {
    var lambdaT = lambdaL + lambdaV;
    var html = '<table style="width:100%; border-collapse: collapse; font-size: 12px; text-align: center; margin-top: 10px;">';
    html += '<tr style="background:#e2e8f0; color:#334155;">';
    html += '<th style="padding:8px; border:1px solid #cbd5e1;">Línea</th>';
    html += '<th style="padding:8px; border:1px solid #cbd5e1;">Local</th>';
    html += '<th style="padding:8px; border:1px solid #cbd5e1;">Total</th>';
    html += '<th style="padding:8px; border:1px solid #cbd5e1;">Visita</th>';
    html += '</tr>';
    
    var getColor = function(p) { return p >= 65 ? '#10b981' : (p >= 40 ? '#f59e0b' : '#ef4444'); };
    
    for (var line = 1.5; line <= maxLine; line += 1) {
        var probL = getOverProb(line, lambdaL);
        var probV = getOverProb(line, lambdaV);
        var probT = getOverProb(line, lambdaT);
        
        html += '<tr>';
        html += '<td style="padding:6px; border:1px solid #cbd5e1; font-weight:bold; background:#f8fafc;">+' + line + '</td>';
        html += '<td style="padding:6px; border:1px solid #cbd5e1; color:' + getColor(probL) + '; font-weight:bold;">' + Math.round(probL) + '%</td>';
        html += '<td style="padding:6px; border:1px solid #cbd5e1; color:' + getColor(probT) + '; font-weight:bold; background:#f8fafc;">' + Math.round(probT) + '%</td>';
        html += '<td style="padding:6px; border:1px solid #cbd5e1; color:' + getColor(probV) + '; font-weight:bold;">' + Math.round(probV) + '%</td>';
        html += '</tr>';
    }
    html += '</table>';
    return html;
}

function cambiarPestana(idTab) {
    document.getElementById('tab-principal').style.display = 'none';
    document.getElementById('tab-goles').style.display = 'none';
    document.getElementById('tab-corners').style.display = 'none';
    document.getElementById('tab-cards').style.display = 'none';
    
    document.getElementById('btn-tab-principal').style.background = '#ffffff';
    document.getElementById('btn-tab-principal').style.color = '#1e3a8a';
    document.getElementById('btn-tab-goles').style.background = '#ffffff';
    document.getElementById('btn-tab-goles').style.color = '#1e3a8a';
    document.getElementById('btn-tab-corners').style.background = '#ffffff';
    document.getElementById('btn-tab-corners').style.color = '#1e3a8a';
    document.getElementById('btn-tab-cards').style.background = '#ffffff';
    document.getElementById('btn-tab-cards').style.color = '#1e3a8a';

    document.getElementById('tab-' + idTab).style.display = 'block';
    document.getElementById('btn-tab-' + idTab).style.background = '#10b981';
    document.getElementById('btn-tab-' + idTab).style.color = '#ffffff';
}

async function cargarPartidos() {
    var listaDiv = document.getElementById('lista-partidos');
    var ligaId = document.getElementById('league-select').value;
    var ligaInfo = ligasFootballData[ligaId];

    if (!ligaInfo) { alert("Liga no configurada."); return; }

    listaDiv.innerHTML = '<div class="loader">Buscando partidos reales en la API... ⏳</div>';

    try {
        var url = PROXY_URL + '/competitions/' + ligaInfo.slug + '/matches?status=SCHEDULED';
        var response = await fetch(url);
        var textoRespuesta = await response.text();

        if (textoRespuesta.indexOf("Hola, este") !== -1 || textoRespuesta.indexOf("Hello World") !== -1) {
            throw new Error("El Worker de Cloudflare tiene el código por defecto.");
        }

        if (!response.ok) throw new Error("Error HTTP: " + response.status);

        var data = JSON.parse(textoRespuesta);
        var partidos = data.matches || [];

        if (partidos.length > 0) {
            var htmlPartidos = "";
            for (var i = 0; i < Math.min(partidos.length, 10); i++) {
                var match = partidos[i];
                var local = match.homeTeam.name || "Local";
                var visita = match.awayTeam.name || "Visitante";
                
                var fechaObj = new Date(match.utcDate);
                var fechaReal = fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                var hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                
                var safeLocal = local.replace(/'/g, "\\'");
                var safeVisita = visita.replace(/'/g, "\\'");

                htmlPartidos += '<div class="match-card" onclick="analizarPartido(\'' + safeLocal + '\', \'' + safeVisita + '\', \'' + fechaReal + '\')">';
                htmlPartidos += '<div class="match-header">';
                htmlPartidos += '<span class="league-badge">' + ligaInfo.nombre + '</span>';
                htmlPartidos += '<span class="match-time">📅 ' + fechaReal + ' - ⏰ ' + hora + '</span>';
                htmlPartidos += '</div>';
                htmlPartidos += '<div class="teams-row">';
                htmlPartidos += '<div class="team-name">' + local + '</div>';
                htmlPartidos += '<div class="vs-badge">VS</div>';
                htmlPartidos += '<div class="team-name right">' + visita + '</div>';
                htmlPartidos += '</div></div>';
            }
            listaDiv.innerHTML = htmlPartidos;
        } else {
            listaDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">No hay próximos partidos programados.</p>';
        }
    } catch (error) {
        listaDiv.innerHTML = '<div style="background: #fee2e2; padding: 15px; border-radius: 8px; color: #b91c1c;">';
        listaDiv.innerHTML += '<h4>Error de conexión</h4><p>' + error.message + '</p></div>';
    }
}

function analizarPartido(local, visita, fechaISO) {
    var listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = '<div class="loader">🧠 Calculando análisis... ⏳</div>';

    try {
        var dataL = defaultTeam;
        var dataV = defaultTeam;
        
        for (var key in equiposData) {
            if (local.indexOf(key) !== -1) dataL = equiposData[key];
            if (visita.indexOf(key) !== -1) dataV = equiposData[key];
        }

        var xgL = dataL.atk * dataV.def * 1.2; 
        var xgV = dataV.atk * dataL.def;

        var probGolL = 1 - poisson(0, xgL);
        var probGolV = 1 - poisson(0, xgV);
        var probOver15 = 1 - (poisson(0, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(1, xgV) + poisson(1, xgL)*poisson(0, xgV));
        var probOver25 = 1 - (poisson(0, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(1, xgV) + poisson(1, xgL)*poisson(0, xgV) + poisson(0, xgL)*poisson(2, xgV) + poisson(1, xgL)*poisson(1, xgV) + poisson(2, xgL)*poisson(0, xgV));
        var bttsYes = probGolL * probGolV * 100;

        var probWinL = 0, probWinV = 0, probDraw = 0;
        for(var i=0; i<=5; i++) {
            for(var j=0; j<=5; j++) {
                var p = poisson(i, xgL) * poisson(j, xgV);
                if(i > j) probWinL += p;
                else if(j > i) probWinV += p;
                else probDraw += p;
            }
        }

        probWinL = probWinL * 100; probWinV = probWinV * 100; probDraw = probDraw * 100;
        probOver15 = probOver15 * 100; probOver25 = probOver25 * 100;

        var lambdaCornersL = Math.max(3.5, (dataL.atk * 3) - (dataV.def * 0.5) + 2);
        var lambdaCornersV = Math.max(3.5, (dataV.atk * 3) - (dataL.def * 0.5) + 2);
        var lambdaCardsL = Math.max(1.5, (dataV.atk * 1.5) - (dataL.def * 0.5) + 1);
        var lambdaCardsV = Math.max(1.5, (dataL.atk * 1.5) - (dataV.def * 0.5) + 1);

        var lambdaCornersT = lambdaCornersL + lambdaCornersV;
        var lambdaCardsT = lambdaCardsL + lambdaCardsV;

        var textoAnalisis = "";
        if (probWinL > 60) textoAnalisis = "El modelo otorga ventaja a " + local + ". Su capacidad ofensiva (xG: " + xgL.toFixed(2) + ") será clave.";
        else if (probWinV > 60) textoAnalisis = "A pesar de jugar fuera, " + visita + " es favorito. Su xG es de " + xgV.toFixed(2) + ".";
        else if (bttsYes > 60) textoAnalisis = "Partido abierto. Ambos equipos anotarán (" + Math.round(bttsYes) + "%). Habrá espacios.";
        else textoAnalisis = "Partido cerrado y táctico. Ambos priorizan el orden defensivo.";

        var comb1X = Math.min(probWinL + probDraw, 98);
        var combX2 = Math.min(probWinV + probDraw, 98);
        var combLocalOver15 = (probWinL * probOver15) / 100;
        var combVisitaOver15 = (probWinV * probOver15) / 100;
        var combBTTS_Over25 = (bttsYes * probOver25) / 100;

        var todasLasOpciones = [
            { nombre: "Victoria " + local, valor: probWinL },
            { nombre: "Empate", valor: probDraw },
            { nombre: "Victoria " + visita, valor: probWinV },
            { nombre: "Más de 1.5 Goles", valor: probOver15 },
            { nombre: "Más de 2.5 Goles", valor: probOver25 },
            { nombre: "Ambos Equipos Marcan (SÍ)", valor: bttsYes },
            { nombre: "Combinada: " + local + " o Empate (1X)", valor: comb1X },
            { nombre: "Combinada: " + visita + " o Empate (X2)", valor: combX2 },
            { nombre: "Combinada: Gana " + local + " + Más de 1.5 Goles", valor: combLocalOver15 },
            { nombre: "Combinada: Gana " + visita + " + Más de 1.5 Goles", valor: combVisitaOver15 },
            { nombre: "Combinada: Ambos Marcan + Más de 2.5 Goles", valor: combBTTS_Over25 }
        ];

        for(var l=3.5; l<=10.5; l+=1) {
            var pC = getOverProb(l, lambdaCornersT);
            if(pC >= 50) todasLasOpciones.push({ nombre: "Más de " + l + " Córners Totales", valor: pC });
        }
        for(var l2=1.5; l2<=8.5; l2+=1) {
            var pT = getOverProb(l2, lambdaCardsT);
            if(pT >= 50) todasLasOpciones.push({ nombre: "Más de " + l2 + " Tarjetas Totales", valor: pT });
        }

        var opcionesValidas = todasLasOpciones.filter(function(op) { return op.valor >= 50; }).sort(function(a, b) { return b.valor - a.valor; });
        var mejorOpcion = opcionesValidas.length > 0 ? opcionesValidas[0] : todasLasOpciones.sort(function(a, b) { return b.valor - a.valor; })[0];

        var nivelConfianza = mejorOpcion.valor >= 75 ? "ALTA" : (mejorOpcion.valor >= 60 ? "MEDIA" : "BAJA");
        var colorConfianza = nivelConfianza === "ALTA" ? "#10b981" : (nivelConfianza === "MEDIA" ? "#f59e0b" : "#ef4444");

        var tablaCorners = generarTablaLineas(lambdaCornersL, lambdaCornersV, 10.5);
        var tablaCards = generarTablaLineas(lambdaCardsL, lambdaCardsV, 8.5);

        var html = "";
        
        html += '<button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:15px; padding:10px;">← Volver a Partidos</button>';
        html += '<div class="match-card" style="padding: 15px 10px;">';
        
        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">';
        html += '<div style="text-align: center; width: 42%;"><h3 style="font-size: 14px; margin: 0; line-height: 1.2;">' + local + '</h3></div>';
        html += '<div style="text-align: center; width: 16%;"><span style="font-size: 18px; font-weight: 900; color: #94a3b8;">VS</span></div>';
        html += '<div style="text-align: center; width: 42%;"><h3 style="font-size: 14px; margin: 0; line-height: 1.2;">' + visita + '</h3></div>';
        html += '</div>';

        html += '<div style="display: flex; gap: 5px; margin-bottom: 15px; overflow-x: auto; padding-bottom: 5px;">';
        html += '<button id="btn-tab-principal" onclick="cambiarPestana(\'principal\')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: #10b981; color: white; white-space: nowrap; cursor: pointer;">🏆 Principal</button>';
        html += '<button id="btn-tab-goles" onclick="cambiarPestana(\'goles\')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: white; color: #1e3a8a; white-space: nowrap; cursor: pointer;">⚽ Goles</button>';
        html += '<button id="btn-tab-corners" onclick="cambiarPestana(\'corners\')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: white; color: #1e3a8a; white-space: nowrap; cursor: pointer;">🚩 Córners</button>';
        html += '<button id="btn-tab-cards" onclick="cambiarPestana(\'cards\')" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 12px; background: white; color: #1e3a8a; white-space: nowrap; cursor: pointer;">🟨 Tarjetas</button>';
        html += '</div>';

        // PESTAÑA 1: PRINCIPAL
        html += '<div id="tab-principal" style="display: block;">';
        html += '<div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 2px solid #f59e0b; text-align: center;">';
        html += '<h4 style="color: #f59e0b; font-size: 14px; margin-bottom: 10px;">RECOMENDACIÓN FINAL</h4>';
        html += '<p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">' + mejorOpcion.nombre + '</p>';
        html += '<p style="color: #10b981; font-size: 15px; font-weight: bold; margin-bottom: 10px;">' + Math.round(mejorOpcion.valor) + '% de prob.</p>';
        html += '<span style="background: ' + colorConfianza + '20; color: ' + colorConfianza + '; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid ' + colorConfianza + ';">CONFIANZA: ' + nivelConfianza + '</span>';
        html += '</div>';

        html += '<div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 15px; text-align: center;">';
        html += '<p style="color: #94a3b8; font-size: 10px; font-weight: bold; margin-bottom: 5px;">GOLES ESPERADOS (xG)</p>';
        html += '<p style="color: #10b981; font-size: 14px; font-weight: 900;">' + xgL.toFixed(2) + ' - ' + xgV.toFixed(2) + '</p>';
        html += '</div>';

        html += '<div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 15px;">';
        html += '<p style="color:#14532d; font-size:12px; line-height:1.5; margin: 0;"><strong>Análisis:</strong> ' + textoAnalisis + '</p>';
        html += '</div>';

        html += '<h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>';
        html += '<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">';
        html += crearBarraProbabilidad("Victoria " + local, probWinL);
        html += crearBarraProbabilidad("Empate", probDraw);
        html += crearBarraProbabilidad("Victoria " + visita, probWinV);
        html += '</div></div>';

        // PESTAÑA 2: GOLES
        html += '<div id="tab-goles" style="display: none;">';
        html += '<h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Mercados de Goles</h4>';
        html += '<div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0;">';
        html += crearBarraProbabilidad("Más de 1.5 Goles Totales", probOver15);
        html += crearBarraProbabilidad("Más de 2.5 Goles Totales", probOver25);
        html += crearBarraProbabilidad("Ambos Equipos Marcan (SÍ)", bttsYes);
        html += '</div>';
        
        html += '<h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🔗 Combinadas</h4>';
        html += '<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">';
        html += crearBarraProbabilidad(local + " o Empate (1X)", comb1X);
        html += crearBarraProbabilidad(visita + " o Empate (X2)", combX2);
        html += crearBarraProbabilidad("Gana " + local + " + Más de 1.5 Goles", combLocalOver15);
        html += crearBarraProbabilidad("Gana " + visita + " + Más de 1.5 Goles", combVisitaOver15);
        html += crearBarraProbabilidad("Ambos Marcan + Más de 2.5 Goles", combBTTS_Over25);
        html += '</div></div>';

        // PESTAÑA 3: CÓRNERS
        html += '<div id="tab-corners" style="display: none;">';
        html += '<h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Líneas de Córners</h4>';
        html += '<div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">';
        html += tablaCorners;
        html += '</div></div>';

        // PESTAÑA 4: TARJETAS
        html += '<div id="tab-cards" style="display: none;">';
        html += '<h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Líneas de Tarjetas</h4>';
        html += '<div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">';
        html += tablaCards;
        html += '</div></div>';

        html += '</div>'; // Fin match-card

        listaDiv.innerHTML = html;

    } catch(e) {
        listaDiv.innerHT
