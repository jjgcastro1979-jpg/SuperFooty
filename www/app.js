b; font-size:12px; margin-bottom:20px; text-transform: capitalize;">📅 ${fechaStr}</p>

            <!-- PICK IA (REAL) -->
            <div style="background: #0f172a; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                <p style="color: #94a3b8; font-size: 12px; font-weight: bold; margin-bottom: 5px;">🤖 PREDICCIÓN ESPN (DATOS REALES)</p>
                <p style="color: ${colorPick}; font-size: 18px; font-weight: 900;">${pickRecomendado}</p>
            </div>

            <!-- H2H (REAL) -->
            <h4 style="margin-bottom: 10px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚔️ Historial Real (H2H)</h4>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 10px; border-radius: 8px; text-align: center; font-size: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <div><strong style="color: #166534; font-size: 16px;">${h2hLocal}</strong><br>Gana ${local}</div>
                <div><strong style="color: #64748b; font-size: 16px;">${h2hEmpate}</strong><br>Empates</div>
                <div><strong style="color: #b91c1c; font-size: 16px;">${h2hVisita}</strong><br>Gana ${visita}</div>
            </div>

            <!-- Resumen -->
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:15px; border-radius:12px; margin-bottom: 20px;">
                <p style="color:#14532d; font-size:13px; line-height:1.5; margin: 0;">${resumenTexto}</p>
            </div>

            <!-- GOLES INDIVIDUALES -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">⚽ Probabilidad de Goles (Estimación)</h4>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${local}</p>
                    ${crearBarraProbabilidad("Más de 0.5", gLocal[0])}
                    ${crearBarraProbabilidad("Más de 1.5", gLocal[1])}
                    ${crearBarraProbabilidad("Más de 2.5", gLocal[2])}
                    ${crearBarraProbabilidad("Más de 3.5", gLocal[3])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${visita}</p>
                    ${crearBarraProbabilidad("Más de 0.5", gVisita[0])}
                    ${crearBarraProbabilidad("Más de 1.5", gVisita[1])}
                    ${crearBarraProbabilidad("Más de 2.5", gVisita[2])}
                    ${crearBarraProbabilidad("Más de 3.5", gVisita[3])}
                </div>
            </div>

            <!-- CÓRNERS INDIVIDUALES -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">🚩 Probabilidad de Córners</h4>
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${local}</p>
                    ${crearBarraProbabilidad("Más de 3.5", cLocal[0])}
                    ${crearBarraProbabilidad("Más de 4.5", cLocal[1])}
                    ${crearBarraProbabilidad("Más de 5.5", cLocal[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${visita}</p>
                    ${crearBarraProbabilidad("Más de 3.5", cVisita[0])}
                    ${crearBarraProbabilidad("Más de 4.5", cVisita[1])}
                    ${crearBarraProbabilidad("Más de 5.5", cVisita[2])}
                </div>
            </div>

            <!-- TARJETAS INDIVIDUALES -->
            <h4 style="margin-bottom: 15px; color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 5px; font-size: 14px;">🟨 Probabilidad de Tarjetas</h4>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 10px;">${local}</p>
                    ${crearBarraProbabilidad("Más de 1.5", tLocal[0])}
                    ${crearBarraProbabilidad("Más de 2.5", tLocal[1])}
                    ${crearBarraProbabilidad("Más de 3.5", tLocal[2])}
                </div>
                <div style="flex: 1; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p style="text-align: center; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${visita}</p>
                    ${crearBarraProbabilidad("Más de 1.5", tVisita[0])}
                    ${crearBarraProbabilidad("Más de 2.5", tVisita[1])}
                    ${crearBarraProbabilidad("Más de 3.5", tVisita[2])}
                </div>
            </div>

        </div>
    `;
}
