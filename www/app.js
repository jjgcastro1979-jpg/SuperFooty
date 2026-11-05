'use strict';

// ==========================================
// SUPERFOOTY PRO - MOTOR PRINCIPAL
// ==========================================

// TU PUENTE CLOUDFLARE
const PROXY_URL =
    'https://royal-dream-9429.jjgcastro1979.workers.dev';

const ligasFootballData = {
    'esp.1': { nombre: 'La Liga', slug: 'PD' },
    'eng.1': { nombre: 'Premier League', slug: 'PL' },
    'ita.1': { nombre: 'Serie A', slug: 'SA' },
    'ger.1': { nombre: 'Bundesliga', slug: 'BL1' },
    'fra.1': { nombre: 'Ligue 1', slug: 'FL1' }
};

// ==========================================
// FUERZAS ORIENTATIVAS
// No son estadísticas actuales de temporada.
// ==========================================

const equiposData = {
    'Real Madrid': { atk: 2.1, def: 0.8 },
    'Barcelona': { atk: 2.0, def: 1.0 },
    'Atletico': { atk: 1.6, def: 0.7 },
    'Athletic': { atk: 1.4, def: 0.9 },
    'Real Sociedad': { atk: 1.3, def: 1.0 },
    'Betis': { atk: 1.3, def: 1.2 },
    'Sevilla': { atk: 1.1, def: 1.3 },
    'Valencia': { atk: 1.1, def: 1.2 },
    'Villarreal': { atk: 1.5, def: 1.3 },
    'Getafe': { atk: 0.8, def: 1.1 },
    'Osasuna': { atk: 1.0, def: 1.1 },
    'Elche': { atk: 0.9, def: 1.2 },
    'Man City': { atk: 2.2, def: 0.9 },
    'Arsenal': { atk: 1.9, def: 0.8 },
    'Liverpool': { atk: 1.8, def: 1.0 },
    'Chelsea': { atk: 1.5, def: 1.1 },
    'Man United': { atk: 1.3, def: 1.2 },
    'Tottenham': { atk: 1.5, def: 1.3 }
};

const defaultTeam = { atk: 1.2, def: 1.2 };

let partidosActuales = [];

// ==========================================
// UTILIDADES
// ==========================================

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, function(c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c];
    });
}

function obtenerFuerza(nombre) {
    const normalizar = texto => texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const buscado = normalizar(nombre);

    for (const key in equiposData) {
        if (buscado.includes(normalizar(key))) {
            return equiposData[key];
        }
    }

    return defaultTeam;
}

function factorial(n) {
    let resultado = 1;

    for (let i = 2; i <= n; i++) {
        resultado *= i;
    }

    return resultado;
}

function poisson(k, lambda) {
    return Math.exp(-lambda) *
        Math.pow(lambda, k) / factorial(k);
}

function porcentaje(valor) {
    return Math.max(0, Math.min(100, valor * 100));
}

function crearBarraProbabilidad(titulo, valor) {
    const prob = Math.max(0, Math.min(100, valor));
    let color = '#ef4444';

    if (prob >= 65) color = '#10b981';
    else if (prob >= 45) color = '#f59e0b';

    return `
        <div class="chart-row">
            <div class="chart-label">
                <span>${escapeHTML(titulo)}</span>
                <span style="color:${color}">
                    ${prob.toFixed(1)}%
                </span>
            </div>

            <div class="chart-track">
                <div class="chart-fill"
                    style="width:${prob}%;background:${color}">
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// CARGAR PARTIDOS REALES
// ==========================================

async function cargarPartidos() {

    const listaDiv = document.getElementById('lista-partidos');
    const boton = document.getElementById('btn-cargar');

    const ligaId = document.getElementById('league-select').value;
    const fecha = document.getElementById('date-select').value;

    const ligaInfo = ligasFootballData[ligaId];

    if (!ligaInfo) {
        listaDiv.innerHTML = 'Liga no configurada.';
        return;
    }

    if (!fecha) {
        listaDiv.innerHTML =
            '<div class="error-box">Selecciona una fecha.</div>';
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Buscando partidos...';

    listaDiv.innerHTML =
        '<div class="loader">🌐 Conectando con Football-Data...</div>';

    try {

        const fechaInicio = fecha;

        const url = `${PROXY_URL}/competitions/${ligaInfo.slug}/matches?dateFrom=${fechaInicio}&dateTo=${fechaInicio}&status=SCHEDULED`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const texto = await response.text();

        if (!response.ok) {
            throw new Error(
                `Error HTTP ${response.status}: ${texto.substring(0, 180)}`
            );
        }

        let data;

        try {
            data = JSON.parse(texto);
        } catch (e) {
            throw new Error(
                'Cloudflare no está devolviendo JSON. Revisa el código del Worker.'
            );
        }

        if (!Array.isArray(data.matches)) {
            throw new Error(
                'La API no devuelve la lista de partidos esperada.'
            );
        }

        partidosActuales = data.matches;

        if (partidosActuales.length === 0) {
            listaDiv.innerHTML = `
                <div class="info-box info-blue">
                    No hay partidos programados para esta fecha
                    en ${escapeHTML(ligaInfo.nombre)}.
                </div>
            `;
            return;
        }

        mostrarPartidos(ligaInfo);

    } catch (error) {

        listaDiv.innerHTML = `
            <div class="error-box">
                <h3>⚠️ Error de conexión</h3>
                <p>${escapeHTML(error.message)}</p>
                <p style="margin-top:8px">
                    Comprueba tu conexión, la clave API y el Worker
                    de Cloudflare.
                </p>
            </div>
        `;

    } finally {

        boton.disabled = false;
        boton.textContent = '🔄 Generar partidos';

    }
}

// ==========================================
// MOSTRAR PARTIDOS
// ==========================================

function mostrarPartidos(ligaInfo) {

    const listaDiv = document.getElementById('lista-partidos');

    listaDiv.innerHTML = partidosActuales.map((match, index) => {

        const local = match.homeTeam?.name || 'Equipo local';
        const visita = match.awayTeam?.name || 'Equipo visitante';

        const fecha = new Date(match.utcDate);

        const fechaTexto = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });

        const hora = fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="match-card">

                <div class="match-header">
                    <span class="league-badge">
                        ${escapeHTML(ligaInfo.nombre)}
                    </span>

                    <span class="match-time">
                        ${fechaTexto} · ${hora}
                    </span>
                </div>

                <div class="teams-row">
                    <div class="team-name">
                        ${escapeHTML(local)}
                    </div>

                    <div class="vs-badge">VS</div>

                    <div class="team-name right">
                        ${escapeHTML(visita)}
                    </div>
                </div>

                <button class="btn"
                    onclick="analizarPartido(${index})">
                    📊 ANALIZAR PARTIDO
                </button>

            </div>
        `;

    }).join('');
}

// ==========================================
// MOTOR MATEMÁTICO POISSON
// ==========================================

function calcularModelo(local, visita) {

    const dataL = obtenerFuerza(local);
    const dataV = obtenerFuerza(visita);

    // Estimaciones orientativas
    const xgL = dataL.atk * dataV.def * 1.2;
    const xgV = dataV.atk * dataL.def;

    const MAX_GOLES = 12;

    const matriz = [];

    let probLocal = 0;
    let probEmpate = 0;
    let probVisita = 0;

    let over15 = 0;
    let over25 = 0;
    let btts = 0;

    let prob1X = 0;
    let probX2 = 0;

    let probLocalGol = 0;
    let probVisitaGol = 0;

    let combLocalOver15 = 0;
    let combVisitaOver15 = 0;
    let comb1XOver15 = 0;

    for (let i = 0; i <= MAX_GOLES; i++) {

        matriz[i] = [];

        for (let j = 0; j <= MAX_GOLES; j++) {

            const p = poisson(i, xgL) * poisson(j, xgV);

            matriz[i][j] = p;

            if (i > j) probLocal += p;
            else if (i === j) probEmpate += p;
            else probVisita += p;

            if (i + j >= 2) over15 += p;
            if (i + j >= 3) over25 += p;

            if (i >= 1 && j >= 1) btts += p;

            if (i >= 1) probLocalGol += p;
            if (j >= 1) probVisitaGol += p;

            if (i >= j) prob1X += p;
            if (j >= i) probX2 += p;

            if (i > j && i + j >= 2) {
                combLocalOver15 += p;
            }

            if (j > i && i + j >= 2) {
                combVisitaOver15 += p;
            }

            if (i >= j && i + j >= 2) {
                comb1XOver15 += p;
            }
        }
    }

    // Normalización por el pequeño margen de truncamiento
    const total = matriz.reduce(
        (suma, fila) => suma + fila.reduce((a, b) => a + b, 0),
        0
    );

    function normalizar(valor) {
        return porcentaje(valor / total);
    }

    return {
        xgL,
        xgV,

        local: normalizar(probLocal),
        empate: normalizar(probEmpate),
        visita: normalizar(probVisita),

        over15: normalizar(over15),
        over25: normalizar(over25),
        btts: normalizar(btts),

        localGol: normalizar(probLocalGol),
        visitaGol: normalizar(probVisitaGol),

        unoX: normalizar(prob1X),
        equisDos: normalizar(probX2),

        combLocalOver15: normalizar(combLocalOver15),
        combVisitaOver15: normalizar(combVisitaOver15),
        comb1XOver15: normalizar(comb1XOver15)
    };
}

// ==========================================
// ANALIZAR PARTIDO
// ==========================================

function analizarPartido(index) {

    const match = partidosActuales[index];

    if (!match) return;

    const local = match.homeTeam?.name || 'Local';
    const visita = match.awayTeam?.name || 'Visitante';

    const fecha = new Date(match.utcDate).toLocaleString('es-ES');

    const listaDiv = document.getElementById('lista-partidos');

    listaDiv.innerHTML =
        '<div class="loader">🧠 Calculando probabilidades...</div>';

    try {

        const m = calcularModelo(local, visita);

        mostrarAnalisis(local, visita, fecha, m);

    } catch (error) {

        listaDiv.innerHTML = `
            <div class="error-box">
                Error al calcular el análisis:
                ${escapeHTML(error.message)}
            </div>
        `;

    }
}

// ==========================================
// ANÁLISIS Y GRÁFICOS
// ==========================================

function mostrarAnalisis(local, visita, fecha, m) {

    const listaDiv = document.getElementById('lista-partidos');

    const opciones = [
        { nombre: `Más de 1.5 goles`, valor: m.over15 },
        { nombre: `Más de 2.5 goles`, valor: m.over25 },
        { nombre: `Ambos equipos marcan`, valor: m.btts },
        { nombre: `${local} o empate (1X)`, valor: m.unoX },
        { nombre: `${visita} o empate (X2)`, valor: m.equisDos },
        { nombre: `Victoria ${local}`, valor: m.local },
        { nombre: `Empate`, valor: m.empate },
        { nombre: `Victoria ${visita}`, valor: m.visita }
    ];

    opciones.sort((a, b) => b.valor - a.valor);

    const mejor = opciones[0];

    const confianza =
        mejor.valor >= 75 ? 'ALTA' :
        mejor.valor >= 60 ? 'MEDIA' : 'BAJA';

    const color =
        confianza === 'ALTA' ? '#10b981' :
        confianza === 'MEDIA' ? '#f59e0b' : '#ef4444';

    listaDiv.innerHTML = `

        <button class="btn btn-secondary"
            onclick="cargarPartidos()">
            ← VOLVER A PARTIDOS
        </button>

        <div class="match-card" style="margin-top:15px">

            <div class="teams-row">
                <div class="team-name">
                    ${escapeHTML(local)}
                </div>

                <div class="vs-badge">VS</div>

                <div class="team-name right">
                    ${escapeHTML(visita)}
                </div>
            </div>

            <p class="match-time"
                style="text-align:center;margin-top:12px">
                📅 ${escapeHTML(fecha)}
            </p>

            <div style="
                background:#0f172a;
                padding:18px;
                border-radius:12px;
                margin-top:18px;
                text-align:center">

                <p style="color:#94a3b8;font-size:12px">
                    GOLES ESPERADOS (xG)
                </p>

                <p style="
                    color:#10b981;
                    font-size:25px;
                    font-weight:900;
                    margin-top:8px">

                    ${m.xgL.toFixed(2)}
                    -
                    ${m.xgV.toFixed(2)}

                </p>

                <p style="color:#94a3b8;font-size:10px;margin-top:8px">
                    Estimación del modelo matemático
                </p>
            </div>

            <h3 class="section-title">
                📊 GRÁFICO DE RESULTADOS 1X2
            </h3>

            <div class="chart-box">

                ${crearBarraProbabilidad(
                    `Victoria ${local}`, m.local
                )}

                ${crearBarraProbabilidad(
                    'Empate', m.empate
                )}

                ${crearBarraProbabilidad(
                    `Victoria ${visita}`, m.visita
                )}

            </div>

            <h3 class="section-title">
                ⚽ GRÁFICO DE GOLES
            </h3>

            <div class="chart-box">

                ${crearBarraProbabilidad(
                    'Más de 1.5 goles', m.over15
                )}

                ${crearBarraProbabilidad(
                    'Más de 2.5 goles', m.over25
                )}

                ${crearBarraProbabilidad(
                    'Ambos equipos marcan SÍ', m.btts
                )}

                ${crearBarraProbabilidad(
                    `${local} marca al menos un gol`, m.localGol
                )}

                ${crearBarraProbabilidad(
                    `${visita} marca al menos un gol`, m.visitaGol
                )}

            </div>

            <h3 class="section-title">
                🔗 DOBLE OPORTUNIDAD
            </h3>

            <div class="chart-box">

                ${crearBarraProbabilidad(
                    `${local} o empate (1X)`, m.unoX
                )}

                ${crearBarraProbabilidad(
                    `${visita} o empate (X2)`, m.equisDos
                )}

            </div>

            <h3 class="section-title">
                📈 COMBINACIONES
            </h3>

            <div class="chart-box">

                ${crearBarraProbabilidad(
                    `${local} gana + Más de 1.5 goles`,
                    m.combLocalOver15
                )}

                ${crearBarraProbabilidad(
                    `${visita} gana + Más de 1.5 goles`,
                    m.combVisitaOver15
                )}

                ${crearBarraProbabilidad(
                    `${local} o empate + Más de 1.5 goles`,
                    m.comb1XOver15
                )}

            </div>

            <div class="recommendation">

                <h3>🏆 RECOMENDACIÓN DEL MODELO</h3>

                <p style="font-size:12px;color:#cbd5e1">
                    Opción con mayor probabilidad estimada
                </p>

                <p class="pick">
                    ${escapeHTML(mejor.nombre)}
                </p>

                <p style="font-size:22px;font-weight:900;color:#10b981">
                    ${mejor.valor.toFixed(1)}%
                </p>

                <p style="
                    display:inline-block;
                    color:${color};
                    border:1px solid ${color};
                    padding:6px 12px;
                    border-radius:6px;
                    margin-top:10px;
                    font-size:12px;
                    font-weight:bold">

                    CONFIANZA ${confianza}

                </p>

            </div>

            <div class="info-box info-blue" style="margin-top:18px">

                <strong>ℹ️ Información del análisis</strong>

                <p style="margin-top:7px">
                    Los partidos y sus fechas proceden de Football-Data.
                    Las probabilidades son estimaciones matemáticas
                    basadas en fuerzas orientativas de los equipos.
                    No equivalen a estadísticas reales de temporada
                    ni garantizan resultados.
                </p>

                <p style="margin-top:7px">
                    Córners, tarjetas, alineaciones, lesiones e
                    historial H2H no están disponibles en este modelo.
                </p>

            </div>

        </div>
    `;
}

// ==========================================
// FIN SUPERFOOTY PRO
// ==========================================
