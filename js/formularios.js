// ========== GENERACIÓN DE FORMULARIOS ==========

function generarFormulario(tipo, dataPaciente = null) {
    const container = document.getElementById('formulario-container');
    if (!container) {
        console.error('No hay contenedor para formulario');
        return;
    }

    const datos = dataPaciente || {};
    const dp = datos.datosPersonales || {};

    let html = `
        <div class="historia-clinica">
            <!-- DATOS PERSONALES -->
            <div class="historia-section">
                <h3>Datos Personales</h3>
                <div class="datos-personales">
                    <div class="form-group">
                        <label>Nombre y Apellido *</label>
                        <input type="text" id="campo-nombre" value="${dp.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>¿Cómo le gusta que lo llamen?</label>
                        <input type="text" id="campo-alias" value="${dp.alias || ''}">
                    </div>
                    <div class="form-group">
                        <label>Edad *</label>
                        <input type="number" id="campo-edad" value="${dp.edad || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha de Nacimiento</label>
                        <input type="date" id="campo-fechaNacimiento" value="${dp.fechaNacimiento || ''}">
                    </div>
                    <div class="form-group">
                        <label>Domicilio</label>
                        <input type="text" id="campo-domicilio" value="${dp.domicilio || ''}">
                    </div>
                    <div class="form-group">
                        <label>Nombre de Madre/Padre</label>
                        <input type="text" id="campo-nombrePadre" value="${dp.nombrePadre || ''}">
                    </div>
                    <div class="form-group">
                        <label>Teléfono de Contacto</label>
                        <input type="tel" id="campo-telefono" value="${dp.telefono || ''}">
                    </div>
                    <div class="form-group">
                        <label>Obra Social</label>
                        <input type="text" id="campo-obraSocial" value="${dp.obraSocial || ''}">
                    </div>
                    <div class="form-group">
                        <label>N° Afiliado</label>
                        <input type="text" id="campo-nAfiliado" value="${dp.nAfiliado || ''}">
                    </div>
                    ${tipo === 'odontopediatrica' ? `
                        <div class="form-group">
                            <label>DNI</label>
                            <input type="text" id="campo-dni" value="${dp.dni || ''}">
                        </div>
                    ` : ''}
                </div>
            </div>
    `;

    // SECCIÓN ESPECÍFICA POR TIPO
    if (tipo === 'neurodivergente') {
        html += generarSeccionNeuro(datos);
    } else {
        html += generarSeccionOdonto(datos);
    }

    // TRATAMIENTOS
    html += `
        <div class="historia-section">
            <h3>Tratamientos</h3>
            <div class="form-group">
                <label>Tratamientos Realizados</label>
                <textarea id="campo-tratamientos-realizados" style="min-height: 120px;">${datos.tratamientos?.realizados || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Propuesta de Tratamiento</label>
                <textarea id="campo-propuesta-tratamiento" style="min-height: 120px;">${datos.tratamientos?.propuesta || ''}</textarea>
            </div>
        </div>
    `;

    // ODONTOGRAMA
    html += `
        <div class="historia-section">
            <h3>Odontograma</h3>
            <p style="color: #666; margin-bottom: 20px;">
                Haz clic sobre las zonas de cada diente para marcar:
                <span style="color: #FF6B6B;">● Rojo = Prácticas Existentes</span> |
                <span style="color: #4A90E2;">● Azul = Prácticas Requeridas</span>
            </p>
            <canvas id="odontograma-canvas" class="odontograma-canvas" style="border: 1px solid #E0E0E0; border-radius: 5px; background: white;"></canvas>
            <div class="odontograma-legend" style="margin-top: 20px; padding: 15px; background: #F5F5F5; border-radius: 5px; text-align: center;">
                <p style="margin: 0 0 15px; font-weight: bold; color: #333;">Leyenda de colores:</p>
                <div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">
                    <div class="legend-item" style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; background: #FF6B6B; border: 2px solid #333; border-radius: 3px;"></div>
                        <span style="font-weight: 500;">🔴 Prácticas Existentes (Rojo)</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; background: #4A90E2; border: 2px solid #333; border-radius: 3px;"></div>
                        <span style="font-weight: 500;">🔵 Prácticas Requeridas (Azul)</span>
                    </div>
                    <div class="legend-item" style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 30px; height: 30px; background: #FFFFFF; border: 2px solid #333; border-radius: 3px;"></div>
                        <span style="font-weight: 500;">⚪ Sin marcar (Blanco)</span>
                    </div>
                </div>
            </div>
        </div>
        </div>
    `;

    container.innerHTML = html;

    // Renderizar odontograma
    setTimeout(() => {
        const canvas = document.getElementById('odontograma-canvas');
        if (canvas) {
            // Asegurar que el canvas tiene dimensiones
            if (canvas.width === 0 || canvas.width === undefined) {
                canvas.width = Math.min(window.innerWidth - 60, 1200);
            }
            if (canvas.height === 0 || canvas.height === undefined) {
                canvas.height = 900;
            }

            const datosOdontograma = datos.odontograma || {};
            canvas.datosOdontograma = datosOdontograma;
            canvas.datosZonas = [];
            dibujarOdontograma(canvas, datosOdontograma);

            // Agregar event listener para clicks en el odontograma
            canvas.addEventListener('click', (event) => {
                manejarClickOdontograma(event, canvas, datosOdontograma);
            });
        }
    }, 100);
}

function generarSeccionNeuro(datos) {
    const ant = datos.antecedentes || {};
    const desafios = datos.desafios || {};

    return `
        <div class="historia-section">
            <h3>Antecedentes Patológicos</h3>
            <div class="form-group">
                <label>Diagnóstico</label>
                <textarea id="campo-diagnostico">${ant.diagnostico || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Enfermedades Preexistentes</label>
                <textarea id="campo-enfermedades">${ant.enfermedadesPreexistentes || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Medicación</label>
                <textarea id="campo-medicacion">${ant.medicacion || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Cirugías</label>
                <textarea id="campo-cirugias">${ant.cirugias || ''}</textarea>
            </div>
        </div>

        <div class="historia-section">
            <h3>Desafíos y Características</h3>
            <div class="form-group">
                <label>Comunicación y Lenguaje</label>
                <textarea id="campo-comunicacion">${desafios.comunicacion || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Conducta (Nivel de Apoyo)</label>
                <textarea id="campo-conducta">${desafios.conducta || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Desafíos Sensoriales</label>
                <textarea id="campo-sensoriales">${desafios.sensoriales || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Desafíos en la Motricidad</label>
                <textarea id="campo-motricidad">${desafios.motricidad || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Terapias que Realiza</label>
                <textarea id="campo-terapias">${desafios.terapias || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Escala de Frank</label>
                <textarea id="campo-frank">${desafios.frank || ''}</textarea>
            </div>
            <div class="form-group">
                <label>¿Qué le gusta?</label>
                <textarea id="campo-leGusta">${desafios.leGusta || ''}</textarea>
            </div>
        </div>
    `;
}

function generarSeccionOdonto(datos) {
    const carac = datos.caracteristicas || {};
    return `
        <div class="historia-section">
            <h3>Características del Paciente</h3>
            <div class="form-group">
                <label>Observaciones</label>
                <textarea id="campo-observaciones">${carac.observaciones || ''}</textarea>
            </div>
        </div>
    `;
}
