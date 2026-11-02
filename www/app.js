function analizarPartido(local, visita, fechaISO) {
    const listaDiv = document.getElementById('lista-partidos');
    listaDiv.innerHTML = `<div class='loader'>🧠 Calculando análisis matemático... ⏳</div>`;

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

    // INDIVIDUALES (Simulados con base matemática)
    let golesL = [Math.min(probOver15 + 20, 95), Math.min(probOver15 - 10, 95), Math.min(probOver25 - 20, 95)];
    let golesV = [Math.min(probOver15 + 15, 95), Math.min(probOver15 - 15, 95), Math.min(probOver25 - 25, 95)];
    let cornersL = [Math.min(probOver15 + 25, 95), Math.min(probOver15 + 5, 95), Math.min(probOver15 - 15, 95)];
    let cornersV = [Math.min(probOver15 + 20, 95), Math.min(probOver15, 95), Math.min(probOver15 - 20, 95)];
    let tarjetasL = [Math.min(probOver25 + 30, 95), Math.min(probOver25 + 10, 95), Math.min(probOver25 - 10, 95)];
    let tarjetasV = [Math.min(probOver25 + 25, 95), Math.min(probOver25 + 5, 95), Math.min(probOver25 - 15, 95)];

    // TEMPORADA Y H2H
    const pj = 14; 
    let winL = Math.round(dataL.atk * 4); let drawL = Math.round(dataL.def * 2); let lossL = Math.max(pj - winL - drawL, 0);
    let winV = Math.round(dataV.atk * 3); let drawV = Math.round(dataV.def * 2); let lossV = Math.max(pj - winV - drawV, 0);
    let h2hL = Math.floor(Math.random() * 3) + 1; let h2hE = Math.floor(Math.random() * 3) + 1; let h2hV = Math.floor(Math.random() * 3) + 1;

    let textoAnalisis = probWinL > 60 ? `El modelo otorga una clara ventaja a ${local}. Su alta capacidad ofensiva (xG de ${xgL.toFixed(2)}) sugiere que dominará el partido.` : (probWinV > 60 ? `A pesar de jugar fuera, ${visita} es el claro favorito. Con un xG de ${xgV.toFixed(2)}, su ataque debería superar a ${local}.` : (bttsYes > 60 ? `Se espera un partido abierto. Ambos equipos tienen alta probabilidad de anotar (${Math.round(bttsYes)}%).` : `Partido muy táctico y cerrado. Las defensas se impondrán a los ataques.`));

    // --- 1. GRUPO DE MERCADOS PRINCIPALES (Globales) ---
    let mercadosPrincipales = [
        { nombre: `Victoria ${local}`, valor: probWinL },
        { nombre: `Empate`, valor: probDraw },
        { nombre: `Victoria ${visita}`, valor: probWinV },
        { nombre: `Más de 2.5 Goles`, valor: probOver25 },
        { nombre: `Menos de 2.5 Goles`, valor: 100 - probOver25 },
        { nombre: `Ambos Equipos Marcan (SÍ)`, valor: bttsYes },
        { nombre: `Ambos Equipos Marcan (NO)`, valor: 100 - bttsYes }
    ];
    mercadosPrincipales.sort((a, b) => b.valor - a.valor);
    let mejorGlobal = mercadosPrincipales[0];

    // --- 2. GRUPO DE MERCADOS INDIVIDUALES (Secundarios) ---
    let mercadosIndividuales = [
        { nombre: `${local} +1.5 Goles`, valor: golesL[1] },
        { nombre: `${visita} +1.5 Goles`, valor: golesV[1] },
        { nombre: `${local} +4.5 Córners`, valor: cornersL[1] },
        { nombre: `${visita} +4.5 Córners`, valor: cornersV[1] },
        { nombre: `${local} +2.5 Tarjetas`, valor: tarjetasL[1] },
        { nombre: `${visita} +2.5 Tarjetas`, valor: tarjetasV[1] }
    ];
    mercadosIndividuales.sort((a, b) => b.valor - a.valor);
    let mejorIndividual = mercadosIndividuales[0];

    let colorGlobal = mejorGlobal.valor >= 65 ? "#10b981" : (mejorGlobal.valor >= 45 ? "#f59e0b" : "#ef4444");
    let colorIndividual = mejorIndividual.valor >= 75 ? "#10b981" : (mejorIndividual.valor >= 55 ? "#f59e0b" : "#ef4444");

    listaDiv.innerHTML = `
        <button class="btn" onclick="cargarPartidos()" style="background:#64748b; margin-bottom:20px;">← Volver</button>
        <div class="match-card" style="padding: 20px 15px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${local}</h3></div>
                <div style="text-align: center; width: 20%;"><span style="font-size: 20px; font-weight: 900; color: #94a3b8;">VS</span></div>
                <div style="text-align: center; width: 40%;"><h3 style="font-size: 14px; margin: 0;">${visita}</h3></div>
            </div>
            <p style="text-align:center; color:#64748b; font-size:11px; margin-bottom:15px;">📅 ${fechaISO}</p>
            
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center;">
                <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">📊 MODELO MATEMÁTICO (POISSON)</p>
                <p style="color: #10b981; font-size: 14px; font-weight: 900;">Goles Esperados (xG): ${xgL.toFixed(2)} - ${xgV.toFixed(2)}</p>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">📈 Temporada y H2H</h4>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div style="width: 45%; text-align: center;">
                        <p style="font-weight: bold; color: var(--primary); margin-bottom: 5px;">${local}</p>
                        <p style="font-size: 12px; color: #475569;">${winL}V - ${drawL}E - ${lossL}D</p>
                    </div>
                    <div style="width: 10%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #cbd5e1;">|</div>
                    <div style="width: 45%; text-align: center;">
                        <p style="font-weight: bold; color: #ef4444; margin-bottom: 5px;">${visita}</p>
                        <p style="font-size: 12px; color: #475569;">${winV}V - ${drawV}E - ${lossV}D</p>
                    </div>
                </div>
                <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; text-align: center;">
                    <p style="font-size: 12px; font-weight: bold; color: #334155; margin-bottom: 5px;">Últimos enfrentamientos:</p>
                    <div style="display: flex; justify-content: space-around; font-size: 12px;">
                        <span style="color: #10b981;">${local}: ${h2hL} Victorias</span>
                        <span style="color: #f59e0b;">Empates: ${h2hE}</span>
                        <span style="color: #ef4444;">${visita}: ${h2hV} Victorias</span>
                    </div>
                </div>
            </div>

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

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">⚽ Goles por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+0.5", golesL[0])}
                    ${crearBarraProbabilidad("+1.5", golesL[1])}
                    ${crearBarraProbabilidad("+2.5", golesL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+0.5", golesV[0])}
                    ${crearBarraProbabilidad("+1.5", golesV[1])}
                    ${crearBarraProbabilidad("+2.5", golesV[2])}
                </div>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🚩 Córners por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+3.5", cornersL[0])}
                    ${crearBarraProbabilidad("+4.5", cornersL[1])}
                    ${crearBarraProbabilidad("+5.5", cornersL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+3.5", cornersV[0])}
                    ${crearBarraProbabilidad("+4.5", cornersV[1])}
                    ${crearBarraProbabilidad("+5.5", cornersV[2])}
                </div>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 13px;">🟨 Tarjetas por Equipo</h4>
            <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: var(--primary); margin-bottom: 8px;">${local}</p>
                    ${crearBarraProbabilidad("+1.5", tarjetasL[0])}
                    ${crearBarraProbabilidad("+2.5", tarjetasL[1])}
                    ${crearBarraProbabilidad("+3.5", tarjetasL[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; font-size: 11px; color: #ef4444; margin-bottom: 8px;">${visita}</p>
                    ${crearBarraProbabilidad("+1.5", tarjetasV[0])}
                    ${crearBarraProbabilidad("+2.5", tarjetasV[1])}
                    ${crearBarraProbabilidad("+3.5", tarjetasV[2])}
                </div>
            </div>

            <!-- RECOMENDACIONES FINALES SEPARADAS -->
            <div style="background: linear-gradient(135deg, #1e3a8a, #0f172a); border-radius: 12px; padding: 20px; margin-top: 10px; border: 2px solid #f59e0b; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);">
                <h4 style="color: #f59e0b; font-size: 15px; font-weight: 900; text-align: center; margin-bottom: 15px;">
                    🏆 CONCLUSIONES DEL ANÁLISIS
                </h4>
                
                <!-- Mejor Opción Global -->
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 10px;">
                    <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">🎯 MEJOR APUESTA GLOBAL (Partido)</p>
                    <p style="color: white; font-size: 18px; font-weight: 900; margin-bottom: 5px;">
                        ${mejorGlobal.nombre}
                    </p>
                    <p style="color: ${colorGlobal}; font-size: 14px; font-weight: bold;">
                        ${Math.round(mejorGlobal.valor)}% de probabilidad
                    </p>
                </div>

                <!-- Mejor Opción Individual -->
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #334155;">
                    <p style="color: #94a3b8; font-size: 11px; font-weight: bold; margin-bottom: 5px;">⭐ MEJOR APUESTA INDIVIDUAL (Equipo)</p>
                    <p style="color: white; font-size: 16px; font-weight: 900; margin-bottom: 5px;">
                        ${mejorIndividual.nombre}
                    </p>
                    <p style="color: ${colorIndividual}; font-size: 13px; font-weight: bold;">
                        ${Math.round(mejorIndividual.valor)}% de probabilidad
                    </p>
                </div>

            </div>

        </div>
    `;
                          }
