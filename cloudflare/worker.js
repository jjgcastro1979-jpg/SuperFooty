// ==========================================
// SUPERFOOTY PRO
// CLOUDFLARE WORKER
// ESPN + GEMINI IA
// ==========================================

const GEMINI_MODEL = 'gemini-3.8-flash';

const ESPN_BASE =
  'https://site.api.espn.com/apis/site/v2/sports/soccer';

const COMPETITIONS = {
  'esp.1': 'La Liga - España',
  'eng.1': 'Premier League',
  'ita.1': 'Serie A - Italia',
  'ger.1': 'Bundesliga - Alemania',
  'fra.1': 'Ligue 1 - Francia'
};

// ==========================================
// RESPUESTAS Y CORS
// ==========================================

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// ==========================================
// CALENDARIO ESPN
// ==========================================

async function obtenerPartidos(liga, fecha) {
  if (!COMPETITIONS[liga]) {
    throw new Error('Competición no compatible.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new Error('La fecha debe tener formato YYYY-MM-DD.');
  }

  const fechaESPN = fecha.replaceAll('-', '');

  const url =
    `${ESPN_BASE}/${liga}/scoreboard?dates=${fechaESPN}`;

  const respuesta = await fetch(url, {
    headers: {
      'User-Agent': 'SuperFooty-Pro'
    }
  });

  if (!respuesta.ok) {
    throw new Error(
      `ESPN no pudo consultar el calendario. HTTP ${respuesta.status}`
    );
  }

  const datos = await respuesta.json();
  const eventos = Array.isArray(datos.events) ? datos.events : [];

  return eventos.map(evento => {
    const competicion = evento.competitions?.[0];
    const equipos = competicion?.competitors || [];

    const local = equipos.find(e => e.homeAway === 'home');
    const visitante = equipos.find(e => e.homeAway === 'away');

    if (!local || !visitante) return null;

    return {
      id: String(evento.id || ''),
      home: local.team?.displayName || local.team?.name || 'Local',
      away: visitante.team?.displayName || visitante.team?.name || 'Visitante',
      date: evento.date || '',
      league: COMPETITIONS[liga],
      status:
        competicion?.status?.type?.description ||
        evento.status?.type?.description ||
        'No indicado'
    };
  }).filter(Boolean);
}

// ==========================================
// PROMPT DE GEMINI
// ==========================================

function crearInstrucciones(partido) {
  return `
Eres un analista de fútbol prudente y objetivo.

Analiza este encuentro:
Equipo local: ${partido.home}
Equipo visitante: ${partido.away}
Competición: ${partido.league}
Fecha: ${partido.date || 'No indicada'}

REGLAS IMPORTANTES:
1. No inventes estadísticas históricas, resultados, alineaciones,
   lesiones, sanciones, árbitros ni promedios reales.
2. Si no dispones de datos suficientes, indícalo claramente.
3. Las cifras de goles, córners y tarjetas son estimaciones orientativas,
   no estadísticas oficiales ni garantías.
4. No inventes porcentajes de probabilidad.
5. No recomiendes apuestas como seguras.
6. Devuelve exclusivamente un objeto JSON válido, sin Markdown
   ni explicaciones fuera del JSON.

Utiliza exactamente esta estructura:

{
  "summary": "Resumen general del encuentro",
  "confidence": "Baja, media o alta, explicando brevemente por qué",
  "limitations": "Datos que no se han podido verificar",
  "goals": {
    "total": {"min": 1, "max": 3},
    "over15": "Valoración cualitativa o no estimable",
    "over25": "Valoración cualitativa o no estimable",
    "btts": "Valoración cualitativa o no estimable",
    "note": "Explicación de la estimación"
  },
  "corners": {
    "home": {"min": 3, "max": 6},
    "home_note": "Explicación",
    "away": {"min": 2, "max": 5},
    "away_note": "Explicación",
    "total": {"min": 6, "max": 11},
    "total_note": "Explicación"
  },
  "cards": {
    "home": {"min": 1, "max": 3},
    "home_note": "Explicación",
    "away": {"min": 1, "max": 3},
    "away_note": "Explicación",
    "total": {"min": 2, "max": 6},
    "total_note": "Explicación"
  },
  "verdict": "Conclusión prudente"
}

Los números de ejemplo de la estructura son solo ilustrativos.
No los copies automáticamente. Si no puedes estimar un apartado
con fundamento, utiliza null en los valores min y max e indica
que no es estimable en las notas.

Los campos over15, over25 y btts deben ser texto cualitativo,
nunca porcentajes inventados.
`;
}

// ==========================================
// ANÁLISIS CON GEMINI
// ==========================================

async function analizarConGemini(partido, env) {
  if (!env.GEMINI_API_KEY) {
    throw new Error('Falta configurar el secreto GEMINI_API_KEY en Cloudflare.');
  }

  if (!partido.home || !partido.away || !partido.league) {
    throw new Error('Faltan datos del partido.');
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: crearInstrucciones(partido)
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.error?.message || `Error de Gemini: HTTP ${respuesta.status}`
    );
  }

  const texto =
    datos.candidates?.[0]?.content?.parts
      ?.map(parte => parte.text || '')
      .join('')
      .trim();

  if (!texto) {
    throw new Error('Gemini no devolvió contenido.');
  }

  let analisis;

  try {
    analisis = JSON.parse(texto);
  } catch {
    throw new Error('Gemini devolvió una respuesta que no es JSON válido.');
  }

  return analisis;
}

// ==========================================
// CONTROL PRINCIPAL
// ==========================================

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    const url = new URL(request.url);
    const ruta = url.pathname;

    try {
      // COMPROBAR CONEXIÓN
      if (ruta === '/health' && request.method === 'GET') {
        return jsonResponse({
          ok: true,
          gemini: Boolean(env.GEMINI_API_KEY),
          matches: true,
          model: GEMINI_MODEL,
          calendar: 'ESPN'
        });
      }

      // CONSULTAR PARTIDOS
      if (ruta === '/matches' && request.method === 'GET') {
        const liga = url.searchParams.get('league');
        const fecha = url.searchParams.get('date');

        if (!liga || !fecha) {
          return jsonResponse({
            ok: false,
            error: 'Debes indicar league y date.'
          }, 400);
        }

        const matches = await obtenerPartidos(liga, fecha);

        return jsonResponse({
          ok: true,
          league: COMPETITIONS[liga],
          date: fecha,
          total: matches.length,
          matches
        });
      }

      // ANALIZAR PARTIDO
      if (ruta === '/gemini/analyze' && request.method === 'POST') {
        const partido = await request.json();

        const analysis = await analizarConGemini(partido, env);

        return jsonResponse({
          ok: true,
          analysis
        });
      }

      return jsonResponse({
        ok: false,
        error: 'Ruta no encontrada.'
      }, 404);

    } catch (error) {
      return jsonResponse({
        ok: false,
        error: error.message || 'Error interno del servidor.'
      }, 500);
    }
  }
};
      
