'use strict';

// ==========================================
// SUPERFOOTY PRO
// Conexión con Cloudflare + Gemini IA
// ==========================================

const PROXY_URL = 'https://royal-dream-9429.jjgcastro1979.workers.dev';

const COMPETICIONES = {
  'esp.1': 'La Liga - España',
  'eng.1': 'Premier League',
  'ita.1': 'Serie A - Italia',
  'ger.1': 'Bundesliga - Alemania',
  'fra.1': 'Ligue 1 - Francia'
};

let partidosActuales = [];
let partidoSeleccionado = null;

// ==========================================
// FUNCIONES GENERALES
// ==========================================

function elemento(id) {
  return document.getElementById(id);
}

function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, letra => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[letra]);
}

function mostrarMensaje(contenedor, mensaje, clase = '') {
  if (!contenedor) return;
  contenedor.innerHTML =
    `<div class="info-box ${clase}">${escapar(mensaje)}</div>`;
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function showPage(nombre) {
  document.querySelectorAll('.page').forEach(pagina => {
    pagina.classList.remove('active');
  });

  document.querySelectorAll('.nav-item').forEach(boton => {
    boton.classList.remove('active');
  });

  const pagina = elemento(nombre);
  if (pagina) pagina.classList.add('active');

  const boton = document.querySelector(
    `.nav-item[data-page="${nombre}"]`
  );

  if (boton) boton.classList.add('active');
}

// ==========================================
// COMPROBAR CLOUDFLARE
// ==========================================

async function comprobarConexion() {
  const caja = elemento('estado-conexion');
  const boton = elemento('btn-comprobar-conexion');

  if (caja) caja.textContent = 'Comprobando conexión...';
  if (boton) boton.disabled = true;

  try {
    const respuesta = await fetch(`${PROXY_URL}/health`);
    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.ok) {
      throw new Error(datos.error || 'No se pudo conectar.');
    }

    caja.innerHTML = `
      <strong class="success">Cloudflare: conectado</strong><br>
      Calendario ESPN: ${datos.matches ? 'disponible' : 'no disponible'}<br>
      Gemini IA: ${datos.gemini ? 'configurada' : 'falta configurar la clave'}<br>
      Modelo: ${escapar(datos.model || 'No indicado')}
    `;

  } catch (error) {
    if (caja) {
      caja.innerHTML =
        `<span class="error">Error de conexión: ${escapar(error.message)}</span>`;
    }
  } finally {
    if (boton) boton.disabled = false;
  }
}

// ==========================================
// FECHA INICIAL
// ==========================================

function prepararFecha() {
  const campo = elemento('date-select');
  if (!campo || campo.value) return;

  const ahora = new Date();
  const fecha = new Date(
    ahora.getTime() - ahora.getTimezoneOffset() * 60000
  );

  campo.value = fecha.toISOString().slice(0, 10);
}

// ==========================================
// CARGAR PARTIDOS
// ==========================================

async function cargarPartidos() {
  const lista = elemento('lista-partidos');
  const boton = elemento('btn-cargar');
  const selector = elemento('league-select');
  const fechaCampo = elemento('date-select');

  if (!lista || !boton || !selector || !fechaCampo) return;

  const liga = selector.value;
  const fecha = fechaCampo.value;

  if (!COMPETICIONES[liga]) {
    mostrarMensaje(lista, 'Selecciona una competición válida.');
    return;
  }

  if (!fecha) {
    mostrarMensaje(lista, 'Selecciona una fecha.');
    return;
  }

  boton.disabled = true;
  boton.textContent = 'Buscando partidos...';
  lista.innerHTML =
    '<div class="loader">🌐 Consultando calendario de partidos...</div>';

  try {
    const url = `${PROXY_URL}/matches?league=${encodeURIComponent(liga)}&date=${encodeURIComponent(fecha)}`;

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || `Error HTTP ${respuesta.status}`);
    }

    if (!Array.isArray(datos.matches)) {
      throw new Error('La respuesta del calendario no es válida.');
    }

    partidosActuales = datos.matches;

    if (partidosActuales.length === 0) {
      lista.innerHTML = `
        <div class="info-box">
          No aparecen partidos publicados para esa fecha y competición.
          Prueba con otra fecha.
        </div>`;
      return;
    }

    mostrarPartidos();

  } catch (error) {
    mostrarMensaje(lista, error.message, 'error');
  } finally {
    boton.disabled = false;
    boton.textContent = '🔄 GENERAR PARTIDOS';
  }
}

// ==========================================
// MOSTRAR PARTIDOS
// ==========================================

function mostrarPartidos() {
  const lista = elemento('lista-partidos');
  if (!lista) return;

  lista.innerHTML = partidosActuales.map((partido, indice) => {
    const fecha = partido.date
      ? new Date(partido.date)
      : null;

    const horario = fecha && !Number.isNaN(fecha.getTime())
      ? fecha.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Horario no disponible';

    return `
      <div class="match-card">
        <p>${escapar(partido.league || 'Fútbol')} · ${escapar(horario)}</p>

        <h3>
          ${escapar(partido.home)}
          <span> VS </span>
          ${escapar(partido.away)}
        </h3>

        <p>Estado: ${escapar(partido.status || 'No indicado')}</p>

        <button type="button" onclick="analizarPartido(${indice})">
          🧠 ANALIZAR CON GEMINI
        </button>
      </div>
    `;
  }).join('');
}

// ==========================================
// SOLICITAR ANÁLISIS A GEMINI
// ==========================================

async function analizarPartido(indice) {
  const partido = partidosActuales[indice];
  const lista = elemento('lista-partidos');

  if (!partido) return;

  partidoSeleccionado = partido;

  lista.innerHTML = `
    <div class="loader">
      🧠 Gemini está analizando ${escapar(partido.home)}
      contra ${escapar(partido.away)}...
      <p>Preparando estimaciones de goles, córners y tarjetas.</p>
    </div>
  `;

  try {
    const respuesta = await fetch(`${PROXY_URL}/gemini/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        home: partido.home,
        away: partido.away,
        league: partido.league,
        date: partido.date
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || `Error HTTP ${respuesta.status}`);
    }

    if (!datos.analysis) {
      throw new Error('Gemini no devolvió el análisis.');
    }

    mostrarAnalisis(datos.analysis);

  } catch (error) {
    lista.innerHTML = `
      <div class="info-box error">
        <strong>No se pudo completar el análisis.</strong>
        <p>${escapar(error.message)}</p>
        <button class="btn" onclick="mostrarPartidos()">
          VOLVER A LOS PARTIDOS
        </button>
      </div>
    `;
  }
}

// ==========================================
// MOSTRAR RESULTADOS DEL ANÁLISIS
// ==========================================

function rango(objeto) {
  if (!objeto || objeto.min == null || objeto.max == null) {
    return 'No estimable';
  }

  return `${escapar(objeto.min)} - ${escapar(objeto.max)}`;
}

function nota(valor) {
  return escapar(valor || 'Sin información suficiente.');
}

function mostrarAnalisis(a) {
  const lista = elemento('lista-partidos');
  if (!lista || !a) return;

  const g = a.goals || {};
  const c = a.corners || {};
  const t = a.cards || {};

  lista.innerHTML = `
    <div class="match-card">
      <h3>
        ${escapar(partidoSeleccionado.home)}
        VS
        ${escapar(partidoSeleccionado.away)}
      </h3>

      <p>${escapar(partidoSeleccionado.league)}</p>

      <div class="analysis-card">
        <h4>📊 ANÁLISIS GENERAL</h4>
        <p>${nota(a.summary)}</p>
        <p><strong>Confianza:</strong> ${nota(a.confidence)}</p>
        <p><strong>Limitaciones:</strong> ${nota(a.limitations)}</p>
      </div>

      <div class="analysis-card">
        <h4>⚽ ANÁLISIS DE GOLES</h4>
        <p><strong>Estimación total:</strong> ${rango(g.total)} goles</p>
        <p><strong>Más de 1.5:</strong> ${nota(g.over15)}</p>
        <p><strong>Más de 2.5:</strong> ${nota(g.over25)}</p>
        <p><strong>Ambos marcan:</strong> ${nota(g.btts)}</p>
        <p>${nota(g.note)}</p>
      </div>

      <div class="analysis-card">
        <h4>🚩 CÓRNERS POR EQUIPO</h4>
        <p><strong>Local:</strong> ${rango(c.home)}</p>
        <p>${nota(c.home_note)}</p>
        <p><strong>Visitante:</strong> ${rango(c.away)}</p>
        <p>${nota(c.away_note)}</p>
        <p><strong>Total del partido:</strong> ${rango(c.total)}</p>
        <p>${nota(c.total_note)}</p>
      </div>

      <div class="analysis-card">
        <h4>🟨 TARJETAS POR EQUIPO</h4>
        <p><strong>Local:</strong> ${rango(t.home)}</p>
        <p>${nota(t.home_note)}</p>
        <p><strong>Visitante:</strong> ${rango(t.away)}</p>
        <p>${nota(t.away_note)}</p>
        <p><strong>Total del partido:</strong> ${rango(t.total)}</p>
        <p>${nota(t.total_note)}</p>
      </div>

      <div class="analysis-card">
        <h4>🎯 CONCLUSIÓN</h4>
        <p>${nota(a.verdict)}</p>
      </div>

      <div class="info-box warning">
        ⚠️ IMPORTANTE: son estimaciones orientativas generadas por IA.
        No son estadísticas oficiales, promedios históricos verificados
        ni garantías de resultados. No se han confirmado alineaciones,
        lesiones ni datos del árbitro.
      </div>

      <button class="btn" onclick="mostrarPartidos()">
        ← VOLVER A LOS PARTIDOS
      </button>
    </div>
  `;
}

// ==========================================
// INICIO DE LA APLICACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  prepararFecha();

  const botonConexion = elemento('btn-comprobar-conexion');
  const botonPartidos = elemento('btn-cargar');

  if (botonConexion) {
    botonConexion.addEventListener('click', comprobarConexion);
  }

  if (botonPartidos) {
    botonPartidos.addEventListener('click', cargarPartidos);
  }

  comprobarConexion();
});

document.addEventListener('deviceready', () => {
  comprobarConexion();
}, false);
         
