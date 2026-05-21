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

            <!-- Herramientas -->
            <div style="display:flex; gap:10px; justify-content:center; margin-bottom:15px; flex-wrap:wrap;">
                <button type="button" id="btn-rojo" class="btn-herramienta activo"
                    onclick="setHerramienta('rojo')"
                    style="background:#E53935; color:white; border:3px solid transparent; padding:10px 22px; border-radius:8px; font-weight:bold; cursor:pointer;">
                    🔴 Rojo
                </button>
                <button type="button" id="btn-azul" class="btn-herramienta"
                    onclick="setHerramienta('azul')"
                    style="background:#1E88E5; color:white; border:3px solid transparent; padding:10px 22px; border-radius:8px; font-weight:bold; cursor:pointer;">
                    🔵 Azul
                </button>
                <button type="button" id="btn-ausente" class="btn-herramienta"
                    onclick="setHerramienta('ausente')"
                    style="background:#555; color:white; border:3px solid transparent; padding:10px 22px; border-radius:8px; font-weight:bold; cursor:pointer;">
                    ✕ Ausente
                </button>
                <button type="button" id="btn-borrador" class="btn-herramienta"
                    onclick="setHerramienta('borrador')"
                    style="background:#eee; color:#333; border:3px solid transparent; padding:10px 22px; border-radius:8px; font-weight:bold; cursor:pointer;">
                    🧹 Borrador
                </button>
                <button type="button" onclick="limpiarOdontograma()"
                    style="background:white; color:#E53935; border:2px solid #E53935; padding:10px 22px; border-radius:8px; font-weight:bold; cursor:pointer;">
                    🗑 Limpiar todo
                </button>
            </div>

            <canvas id="odontograma-canvas" style="width:100%; max-width:900px; display:block; margin:0 auto; cursor:crosshair;"></canvas>
        </div>
        </div>
    `;

    container.innerHTML = html;

    // Iniciar odontograma modo Paint
    setTimeout(() => {
        iniciarOdontograma('odontograma-canvas', datos.odontograma || null);
    }, 150);
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
