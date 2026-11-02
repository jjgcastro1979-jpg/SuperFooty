// ==========================================
// SUPERFOOTY PRO - MOTOR MATEMÁTICO (POISSON) + TEXTO TÁCTICO
// ==========================================

// Base de datos de fuerzas (Ataque / Defensa). 
// 1.5 es una media normal. 2.0 es muy ofensivo. 0.7 es muy defensivo.
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

function crearBarraDuelo(titulo, probLocal, probVisita) {
    let pL = Math.min(Math.max(parseFloat(probLocal) || 0, 0), 100);
    let pV = Math.min(Math.max(parseFloat(probVisita) || 0, 0), 100);
    let total = pL + pV;
    if (total > 0) { pL = (pL / total) * 100; pV = (pV / total) * 100; }
    let classL = pL > 55 ? "" : (pL > 45 ? "mid" : ""); 
    let classR = pV > 55 ? "" : (pV > 45 ? "mid" : "");
    return `
        <div class="duel-stats" style="margin-bottom: 10px;">
            <div class="duel-header">
                <span style="color: #10b981;">${Math.round(pL)}%</span>
                <span style="font-size: 11px; color: #64748b;">${titulo}</span>
                <span style="color: #ef4444;">${Math.round(pV)}%</span>
            </div>
            <div class="duel-bar-bg">
                <div class="duel-bar-left ${classL}" style="width: 0%;" data-width="${pL}%"></div>
                <div class="duel-bar-right ${classR}" style="width: 0%;" data-width="${pV}%"></div>
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
    listaDiv.innerHTML = `<div class='loader'>🧠 Analizando con modelo matemático... ⏳</div>`;

    const dataL = equiposData[local] || defaultTeam;
    const dataV = equiposData[visita] || defaultTeam;

    // Cálculo de goles esperados (xG) con ventaja de localía
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

    probWinL = probWinL * 100;
    probWinV = probWinV * 100;
    probDraw = probDraw * 100;
    probOver15 = probOver15 * 100;
    probOver25 = probOver25 * 100;

    let cornersL = Math.min(probOver15 + 10, 95);
    let cornersV = Math.min(probOver15 + 5, 95);
    let tarjetasL = Math.min(probOver25 + 20, 95);
    let tarjetasV = Math.min(probOver25 + 15, 95);

    // --- GENERADOR DE TEXTO TÁCTICO ---
    let textoAnalisis = "";
    if (probWinL > 60) {
        textoAnalisis = `El modelo otorga una clara ventaja a ${local}. Su alta capacidad ofensiva (xG de ${xgL.toFixed(2)}) sugiere que dominará el partido y generará múltiples ocasiones claras frente a la defensa de ${visita}.`;
    } else if (probWinV > 60) {
        textoAnalisis = `A pesar de jugar fuera de casa, ${visita} es el claro favorito según las métricas. Con un xG de ${xgV.toFixed(2)}, su ataque debería superar la resistencia defensiva de ${local}.`;
    } else if (bttsYes > 60) {
        textoAnalisis = `Se espera un partido abierto y con intercambio de golpes. Ambos equipos tienen una alta probabilidad de anotar (${Math.round(bttsYes)}%), lo que sugiere que ninguna defensa logrará mantener su portería a cero.`;
    } else if (probOver25 > 60) {
        textoAnalisis = `El choque se presenta trepidante. La combinación de los ataques de ${local} y ${visita} apunta a un partido con muchos goles, superando fácilmente la línea de 2.5.`;
    } else {
        textoAnalisis = `Partido muy táctico y cerrado. El modelo matemático indica que las defensas se impondrán a los ataques, con un alto porcentaje de que el marcador se mantenga bajo (menos de 2.5 goles).`;
    }

    let mejorOpcion = { nombre: "Empate", valor: probDraw };
    if (probWinL > mejorOpcion.valor) mejorOpcion = { nombre: `Victoria ${local}`, valor: probWinL };
    if (probWinV > mejorOpcion.valor) mejorOpcion = { nombre: `Victoria ${visita}`, valor: probWinV };
    if (probOver25 > mejorOpcion.valor) mejorOpcion = { nombre: `Más de 2.5 Goles`, valor: probOver25 };
    if (bttsYes > mejorOpcion.valor) mejorOpcion = { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes };

    let nivelConfianza = mejorOpcion.valor >= 70 ? "ALTA" : (mejorOpcion.valor >= 50 ? "MEDIA" : "BAJA");
    let colorConfianza = nivelConfianza === "ALTA" ? "#10b981" : (nivelConfianza === "MEDIA" ? "#f59e0b" : "#ef4444");

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:15px; text-transform: capitalize;">📅 ${fechaStr}</p>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">📊 MODELO MATEMÁTICO (POISSON)</p>
                <p style="color: #10b981; font-size: 14px; font-weight: 900;">Goles Esperados (xG): ${xgL.toFixed(2)} - ${xgV.toFixed(2)}</p>
            </div>

            <!-- TEXTO DE ANÁLISIS TÁCTICO -->
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.6; margin: 0;"><strong>Análisis Táctico:</strong> ${textoAnalisis}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📊 Probabilidades 1X2</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad(`Victoria ${local}`, probWinL)}
                ${crearBarraProbabilidad(`Empate`, probDraw)}
                ${crearBarraProbabilidad(`Victoria ${visita}`, probWinV)}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🤝 Ambos Equipos Marcan</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad("SÍ (Ambos anotan)", bttsYes)}
                ${crearBarraProbabilidad("NO (Alguien deja la portería a cero)", 100 - bttsYes)}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Probabilidad de Goles</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                ${crearBarraProbabilidad("Más de 1.5 Goles Totales", probOver15)}
                ${crearBarraProbabilidad("Más de 2.5 Goles Totales", probOver25)}
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners y 🟨 Tarjetas (Estimación)</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+4.5 Córners", cornersL)}
                    ${crearBarraProbabilidad("+2.5 Tarjetas", tarjetasL)}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+4.5 Córners", cornersV)}
                    ${crearBarraProbabilidad("+2.5 Tarjetas", tarjetasV)}
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-top: 10px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                <h4 style="color: #f59e0b; font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 10px;">
                    🏆 RECOMENDACIÓN FINAL
                </h4>
                <p style="color: #cbd5e1; font-size: 13px; text-align: center; margin-bottom: 15px;">
                    La opción con mayor probabilidad estadística es:
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">
                        ${mejorOpcion.nombre}
                    </p>
                    <p style="color: #10b981; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
                        ${Math.round(mejorOpcion.valor)}% de probabilidad
                    </p>
                    <span style="background: ${colorConfianza}20; color: ${colorConfianza}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid ${colorConfianza};">
                        CONFIANZA: ${nivelConfianza}
                    </span>
                </div>
            </div>

        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.duel-bar-left, .duel-bar-right').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);
        }
