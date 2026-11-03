// ==========================================
// SUPERFOOTY PRO
// MOTOR INTEGRADO
// ==========================================

const PROXY_URL =
'https://royal-dream-9429.jjgcastro1979.workers.dev';

const ligasFootballData = {
    "esp.1": {nombre:"La Liga",slug:"PD"},
    "eng.1": {nombre:"Premier League",slug:"PL"},
    "ita.1": {nombre:"Serie A",slug:"SA"},
    "ger.1": {nombre:"Bundesliga",slug:"BL1"},
    "fra.1": {nombre:"Ligue 1",slug:"FL1"}
};

const equiposData = {
    "Real Madrid":{atk:2.1,def:0.8},
    "Barcelona":{atk:2.0,def:1.0},
    "Atletico":{atk:1.6,def:0.7},
    "Athletic":{atk:1.4,def:0.9},
    "Real Sociedad":{atk:1.3,def:1.0},
    "Betis":{atk:1.3,def:1.2},
    "Sevilla":{atk:1.1,def:1.3},
    "Valencia":{atk:1.1,def:1.2},
    "Villarreal":{atk:1.5,def:1.3},
    "Getafe":{atk:0.8,def:1.1},
    "Osasuna":{atk:1.0,def:1.1},
    "Man City":{atk:2.2,def:0.9},
    "Arsenal":{atk:1.9,def:0.8},
    "Liverpool":{atk:1.8,def:1.0},
    "Chelsea":{atk:1.5,def:1.1},
    "Man United":{atk:1.3,def:1.2},
    "Tottenham":{atk:1.5,def:1.3}
};

const defaultTeam = {atk:1.2,def:1.2};

let partidoActual = null;

function showPage(id) {

    document.querySelectorAll('.page')
        .forEach(p=>p.classList.remove('active'));

    document.querySelectorAll('nav a')
        .forEach(p=>p.classList.remove('active'));

    document.getElementById(id).classList.add('active');

    const nav = document.getElementById('nav-'+id);

    if(nav) nav.classList.add('active');
}

function poisson(k,lambda) {

    let factorial = 1;

    for(let i=2;i<=k;i++) {
        factorial *= i;
    }

    return Math.exp(-lambda) *
        Math.pow(lambda,k) / factorial;
}

function equipoDatos(nombre) {

    const nombreNormalizado = nombre.toLowerCase();

    for(const key in equiposData) {

        if(nombreNormalizado.includes(key.toLowerCase())) {
            return equiposData[key];
        }
    }

    return defaultTeam;
}

function probabilidadOver(lam1,lam2,linea) {

    let prob = 0;

    for(let i=0;i<=12;i++) {
        for(let j=0;j<=12;j++) {

            if(i+j>linea) {
                prob += poisson(i,lam1)*poisson(j,lam2);
            }

        }
    }

    return prob*100;
}

function calcularProbabilidades(lam1,lam2) {

    let local=0;
    let empate=0;
    let visita=0;

    for(let i=0;i<=12;i++) {

        for(let j=0;j<=12;j++) {

            const p=poisson(i,lam1)*poisson(j,lam2);

            if(i>j) local+=p;
            else if(i===j) empate+=p;
            else visita+=p;

        }
    }

    return {
        local:local*100,
        empate:empate*100,
        visita:visita*100,
        over05:probabilidadOver(lam1,lam2,0),
        over15:probabilidadOver(lam1,lam2,1),
        over25:probabilidadOver(lam1,lam2,2),
        over35:probabilidadOver(lam1,lam2,3),
        over45:probabilidadOver(lam1,lam2,4),
        btts:(1-Math.exp(-lam1))*
             (1-Math.exp(-lam2))*100
    };
}

function crearBarra(nombre,valor) {

    const n=Math.max(0,Math.min(100,valor));

    const color=n>=65?'green':
                n>=40?'yellow':'red';

    return `
    <div class="stat-row">

        <div class="stat-label">
            <span>${nombre}</span>
            <span>${Math.round(n)}%</span>
        </div>

        <div class="bar-container">
            <div class="bar-fill ${color}"
            style="width:${n}%"></div>
        </div>

    </div>`;
}

function crearColumna(nombre,datos) {

    return `
    <div class="team-column">

        <h3>${escapar(nombre)}</h3>

        ${datos.map(d=>crearBarra(d.nombre,d.valor)).join('')}

    </div>`;
}

function escapar(texto) {

    return String(texto).replace(/[&<>"']/g,c=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
    })[c]);
}

// ==========================================
// CARGAR PARTIDOS REALES
// ==========================================

async function cargarPartidos() {

    const lista=document.getElementById('lista-partidos');

    const ligaId=document.getElementById('league-select').value;

    const fecha=document.getElementById('date-select').value;

    const liga=ligasFootballData[ligaId];

    lista.innerHTML='<div class="loader">Buscando partidos... ⏳</div>';

    try {

        if(!fecha) {
            throw new Error('Selecciona una fecha.');
        }

        const url =
        `${PROXY_URL}/competitions/${liga.slug}/matches?dateFrom=${fecha}&dateTo=${fecha}`;

        const response=await fetch(url);

        if(!response.ok) {
            throw new Error('Error HTTP '+response.status);
        }

        const data=await response.json();

        const partidos=data.matches||[];

        if(!partidos.length) {

            lista.innerHTML=
            '<div class="match-card">No hay partidos programados para esta fecha.</div>';

            return;
        }

        lista.innerHTML=partidos.map((m,index)=>{

            const fechaObj=new Date(m.utcDate);

            const hora=fechaObj.toLocaleTimeString('es-ES',{
                hour:'2-digit',
                minute:'2-digit'
            });

            return `
            <div class="match-card clickable"
            data-index="${index}">

                <div class="match-header">

                    <span class="league-badge">
                        ${escapar(liga.nombre)}
                    </span>

                    <span>${fecha} · ${hora}</span>

                </div>

                <div class="teams-row">

                    <div class="team-name">
                        ${escapar(m.homeTeam.name)}
                    </div>

                    <div class="vs-badge">VS</div>

                    <div class="team-name right">
                        ${escapar(m.awayTeam.name)}
                    </div>

                </div>

            </div>`;

        }).join('');

        window.partidosCargados=partidos;

        lista.querySelectorAll('[data-index]').forEach(card=>{

            card.addEventListener('click',()=>{

                const index=Number(card.dataset.index);

                analizarPartido(partidos[index]);

            });

        });

    } catch(error) {

        lista.innerHTML=`
        <div class="notice">
            <strong>Error de conexión</strong>
            <p>${escapar(error.message)}</p>
            Comprueba que el Worker de Cloudflare esté funcionando.
        </div>`;

    }
}

// ==========================================
// ANALIZAR PARTIDO
// ==========================================

function analizarPartido(partido) {

    if(!partido) return;

    partidoActual=partido;

    const local=partido.homeTeam.name;
    const visita=partido.awayTeam.name;

    const dataL=equipoDatos(local);
    const dataV=equipoDatos(visita);

    const xgL=dataL.atk*dataV.def*1.2;
    const xgV=dataV.atk*dataL.def;

    const p=calcularProbabilidades(xgL,xgV);

    const fecha=new Date(partido.utcDate);

    document.getElementById('match-name').textContent=
    `${local} vs ${visita}`;

    document.getElementById('analysis-date').textContent=
    fecha.toLocaleString('es-ES');

    document.getElementById('general-content').innerHTML=`

        <div class="notice">
            Estimaciones matemáticas basadas en parámetros de fuerza.
            No son estadísticas oficiales ni garantías de resultado.
        </div>

        <div class="recommendation-box">
            <h4>GOLES ESPERADOS (xG)</h4>
            <div class="value">${xgL.toFixed(2)} - ${xgV.toFixed(2)}</div>
        </div>

        <h3 style="margin:20px 0 12px">Probabilidades 1X2</h3>

        <div class="team-columns">

            ${crearColumna(local,[
                {nombre:'Victoria',valor:p.local}
            ])}

            ${crearColumna('Resultado',[
                {nombre:'Empate',valor:p.empate},
                {nombre:'Victoria visitante',valor:p.visita}
            ])}

        </div>
    `;

    document.getElementById('goles-content').innerHTML=`

        <div class="team-columns">

            ${crearColumna('Goles del partido',[
                {nombre:'Más de 0.5',valor:p.over05},
                {nombre:'Más de 1.5',valor:p.over15},
                {nombre:'Más de 2.5',valor:p.over25},
                {nombre:'Más de 3.5',valor:p.over35},
                {nombre:'Más de 4.5',valor:p.over45},
                {nombre:'Ambos marcan',valor:p.btts}
            ])}

            ${crearColumna('Probabilidad por equipo',[
                {nombre:local+' marca',valor:(1-Math.exp(-xgL))*100},
                {nombre:visita+' marca',valor:(1-Math.exp(-xgV))*100}
            ])}

        </div>
    `;

    document.getElementById('corners-content').innerHTML=`

        <div class="notice">
            No hay datos históricos de córners conectados.
            Para calcular probabilidades fiables necesitamos estadísticas
            reales de córners de ambos equipos.
        </div>
    `;

    document.getElementById('tarjetas-content').innerHTML=`

        <div class="notice">
            No hay datos históricos de tarjetas conectados.
            No se mostrarán porcentajes inventados.
        </div>
    `;

    const opciones=[
        {nombre:'Más de 0.5 goles',valor:p.over05},
        {nombre:'Más de 1.5 goles',valor:p.over15},
        {nombre:'Más de 2.5 goles',valor:p.over25},
        {nombre:'Más de 3.5 goles',valor:p.over35},
        {nombre:'Ambos equipos marcan',valor:p.btts},
        {nombre:'Victoria '+local,valor:p.local},
        {nombre:'Empate',valor:p.empate},
        {nombre:'Victoria '+visita,valor:p.visita}
    ];

    opciones.sort((a,b)=>b.valor-a.valor);

    const mejor=opciones[0];

    const confianza=
    mejor.valor>=75?'ALTA':
    mejor.valor>=60?'MEDIA':'BAJA';

    document.getElementById('recommendation').innerHTML=`

        <div class="recommendation-box">

            <h4>🏆 RECOMENDACIÓN MATEMÁTICA</h4>

            <div class="value">
                ${escapar(mejor.nombre)}
            </div>

            <div style="font-size:20px;font-weight:bold;margin-top:8px">
                ${Math.round(mejor.valor)}%
            </div>

            <div class="confianza">
                CONFIANZA DEL MODELO: ${confianza}
            </div>

        </div>

    `;

    showPage('analisis');

    switchAnalysisTab('general');
}

// ==========================================
// CAMBIO DE PESTAÑAS
// ==========================================

function switchAnalysisTab(tab) {

    document.querySelectorAll('.analysis-tab')
    .forEach(t=>t.classList.remove('active'));

    document.querySelectorAll('.analysis-content')
    .forEach(t=>t.classList.remove('active'));

    const boton=document.querySelector(
        `.analysis-tab[data-tab="${tab}"]`
    );

    const contenido=document.getElementById('tab-'+tab);

    if(boton) boton.classList.add('active');

    if(contenido) contenido.classList.add('active');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded',()=>{

    const fecha=document.getElementById('date-select');

    const hoy=new Date();

    const localDate=[
        hoy.getFullYear(),
        String(hoy.getMonth()+1).padStart(2,'0'),
        String(hoy.getDate()).padStart(2,'0')
    ].join('-');

    fecha.value=localDate;

    document.getElementById('btn-generar')
    .addEventListener('click',cargarPartidos);

    document.querySelectorAll('.analysis-tab')
    .forEach(tab=>{

        tab.addEventListener('click',()=>{

            switchAnalysisTab(tab.dataset.tab);

        });

    });

});
