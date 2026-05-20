// ========== GENERACIÓN DE FORMULARIOS ==========

function generarFormulario(tipo, dataPaciente = null) {
    const container = document.getElementById('formulario-container');

    if (!container) {
        console.error('No se encontró #formulario-container');
        return;
    }

    let html = '<form>';

    // SECCIÓN: DATOS PERSONALES (Igual para ambos tipos)
    html += `
        <div class="historia-clinica">
            <div class="historia-section">
                <h3>Datos Personales</h3>
                <div class="datos-personales">
                    <div class="form-group">
                        <label for="campo-nombre">Nombre y Apellido *</label>
                        <input type="text" id="campo-nombre" value="${dataPaciente?.datosPersonales?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="campo-alias">¿Cómo le gusta que lo llamen?</label>
                        <input type="text" id="campo-alias" value="${dataPaciente?.datosPersonales?.alias || ''}">
                    </div>
                    <div class="form-group">
                        <label for="campo-edad">Edad *</label>
                        <input type="number" id="campo-edad" value="${dataPaciente?.datosPersonales?.edad || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="campo-fechaNacimiento">Fecha de Nacimiento</label>
                        <input type="date" id="campo-fechaNacimiento" value="${dataPaciente?.datosPersonales?.fechaNacimiento || ''}">
                    </div>
                    <div class="form-group">
                        <label for="campo-domicilio">Domicilio</label>
                        <input type="text" id="campo-domicilio" value="${dataPaciente?.datosPersonales?.domicilio || ''}">
                    </div>
                    <div class="form-group">
                        <label for="campo-nombrePadre">Nombre de Madre/Padre</label>
                        <input type="text" id="campo-nombrePadre" value="${dataPaciente?.datosPersonales?.nombrePadre || ''}">
                    </div>
                    <div class="form-group">
                        <label for="campo-telefono">Teléfono de Contacto</label>
                        <input type="tel" id="campo-telefono" value="${dataPaciente?.datosPersonales?.telefono || ''}">
                    </div>
                    <div class="form-group">
                        <label for="campo-obraSocial">Obra Social</label>
                        <input type="text" id="campo-obraSocial" value="${dataPaciente?.datosPersonales?.obraSocial || ''}">
                    </div>
                    <div class="form-group">
                        <label for="campo-nAfiliado">N° Afiliado</label>
                        <input type="text" id="campo-nAfiliado" value="${dataPaciente?.datosPersonales?.nAfiliado || ''}">
                    </div>
                    ${tipo === 'odontopediatrica' ? `
                        <div class="form-group">
                            <label for="campo-dni">DNI</label>
                            <input type="text" id="campo-dni" value="${dataPaciente?.datosPersonales?.dni || ''}">
                        </div>
                    ` : ''}
                </div>
            </div>
    `;

    // SECCIÓN: TIPO ESPECÍFICO
    if (tipo === 'neurodivergente') {
        html += generarFormularioNeurodiverente(dataPaciente);
    } else {
        html += generarFormularioOdontopediatrica(dataPaciente);
    }

    <!-- SECCIÓN: TRATAMIENTOS -->
            <div class="historia-section">
                <h3>Tratamientos</h3>
                <div class="form-group">
                    <label for="campo-tratamientos-realizados">Tratamientos Realizados</label>
                    <textarea id="campo-tratamientos-realizados" placeholder="Describe los tratamientos que se han realizado..." style="min-height: 120px;">${dataPaciente?.tratamientos?.realizados || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="campo-propuesta-tratamiento">Propuesta de Tratamiento</label>
                    <textarea id="campo-propuesta-tratamiento" placeholder="Describe la propuesta de tratamiento para el paciente..." style="min-height: 120px;">${dataPaciente?.tratamientos?.propuesta || ''}</textarea>
                </div>
            </div>

            <!-- SECCIÓN: ODONTOGRAMA -->
            <div class="historia-section">
                <h3>Odontograma</h3>
                <p style="color: #666; margin-bottom: 20px;">
                    Haz clic sobre las zonas de cada diente para marcar:
                    <span style="color: #FF6B6B;">● Rojo = Prácticas Existentes</span> |
                    <span style="color: #4A90E2;">● Azul = Prácticas Requeridas</span>
                </p>
                <canvas id="odontograma-canvas" class="odontograma-canvas"></canvas>
                <div class="odontograma-legend">
                    <div class="legend-item">
                        <div class="legend-color red"></div>
                        <span>Prácticas Existentes</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color blue"></div>
                        <span>Prácticas Requeridas</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: white;"></div>
                        <span>Sin marcar</span>
                    </div>
                </div>
            </div>
        </div>
        </form>
    `;

    container.innerHTML = html;

    // Renderizar el odontograma
    setTimeout(() => {
        const canvas = document.getElementById('odontograma-canvas');
        if (canvas) {
            const dataOdontograma = dataPaciente?.odontograma || {};
            dibujarOdontograma(canvas, dataOdontograma);

            canvas.addEventListener('click', (e) => {
                manejarClickOdontograma(e, canvas, dataOdontograma);
            });
        }
    }, 100);
}

function generarFormularioNeurodiverente(dataPaciente) {
    const ant = dataPaciente?.antecedentes || {};
    const desafios = dataPaciente?.desafios || {};

    return `
        <div class="historia-section">
            <h3>Antecedentes Patológicos</h3>
            <div class="form-group">
                <label for="campo-diagnostico">Diagnóstico</label>
                <textarea id="campo-diagnostico">${ant.diagnostico || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="campo-enfermedades">Enfermedades Preexistentes</label>
                <textarea id="campo-enfermedades">${ant.enfermedadesPreexistentes || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="campo-medicacion">Medicación</label>
                <textarea id="campo-medicacion">${ant.medicacion || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="campo-cirugias">Cirugías</label>
                <textarea id="campo-cirugias">${ant.cirugias || ''}</textarea>
            </div>
        </div>

        <div class="historia-section">
            <h3>Desafíos de Comunicación y Lenguaje</h3>
            <div class="checkbox-group">
                <label class="checkbox">
                    <input type="checkbox" value="no-verbal" ${desafios.comunicacion?.includes('no-verbal') ? 'checked' : ''}>
                    No Verbal
                </label>
                <label class="checkbox">
                    <input type="checkbox" value="preverbal" ${desafios.comunicacion?.includes('preverbal') ? 'checked' : ''}>
                    Preverbal
                </label>
                <label class="checkbox">
                    <input type="checkbox" value="extraverbal" ${desafios.comunicacion?.includes('extraverbal') ? 'checked' : ''}>
                    Extraverbal
                </label>
            </div>
        </div>

        <div class="historia-section">
            <h3>Recursos que Usa</h3>
            <div class="checkbox-group">
                <label class="checkbox">
                    <input type="checkbox" value="saacs" ${desafios.recursos?.includes('saacs') ? 'checked' : ''}>
                    SAACS
                </label>
                <label class="checkbox">
                    <input type="checkbox" value="pictogramas" ${desafios.recursos?.includes('pictogramas') ? 'checked' : ''}>
                    Pictogramas
                </label>
                <label class="checkbox">
                    <input type="checkbox" value="anticipacion" ${desafios.recursos?.includes('anticipacion') ? 'checked' : ''}>
                    Anticipación
                </label>
                <label class="checkbox">
                    <input type="checkbox" value="no-usan" ${desafios.recursos?.includes('no-usan') ? 'checked' : ''}>
                    No usan
                </label>
            </div>
        </div>

        <div class="historia-section">
            <h3>Desafío en la Conducta</h3>
            <div class="radio-group">
                <label class="radio">
                    <input type="radio" name="conducta" value="leve" ${desafios.conducta === 'leve' ? 'checked' : ''}>
                    Leve
                </label>
                <label class="radio">
                    <input type="radio" name="conducta" value="considerable" ${desafios.conducta === 'considerable' ? 'checked' : ''}>
                    Considerable
                </label>
                <label class="radio">
                    <input type="radio" name="conducta" value="muy-considerable" ${desafios.conducta === 'muy-considerable' ? 'checked' : ''}>
                    Muy Considerable
                </label>
            </div>

            <div class="form-group" style="margin-top: 20px;">
                <label for="campo-sensoriales">Desafíos Sensoriales (Olor, Sabor, Sonidos, Tacto, Visual)</label>
                <textarea id="campo-sensoriales">${desafios.sensoriales || ''}</textarea>
            </div>

            <div class="form-group">
                <label for="campo-motricidad">Desafíos en la Motricidad</label>
                <textarea id="campo-motricidad">${desafios.motricidad || ''}</textarea>
            </div>

            <div class="form-group">
                <label for="campo-terapias">Terapias que Realiza</label>
                <textarea id="campo-terapias">${desafios.terapias || ''}</textarea>
            </div>
        </div>

        <div class="historia-section">
            <h3>Escala de Frank</h3>
            <div class="radio-group">
                <label class="radio">
                    <input type="radio" name="frank" value="definitivamente-negativo" ${desafios.frank === 'definitivamente-negativo' ? 'checked' : ''}>
                    Definitivamente Negativo
                </label>
                <label class="radio">
                    <input type="radio" name="frank" value="negativo" ${desafios.frank === 'negativo' ? 'checked' : ''}>
                    Negativo
                </label>
                <label class="radio">
                    <input type="radio" name="frank" value="cooperador-leve" ${desafios.frank === 'cooperador-leve' ? 'checked' : ''}>
                    Cooperador Leve
                </label>
                <label class="radio">
                    <input type="radio" name="frank" value="cooperador-positivo" ${desafios.frank === 'cooperador-positivo' ? 'checked' : ''}>
                    Cooperador y Positivo
                </label>
            </div>
        </div>

        <div class="historia-section">
            <h3>Preferencias</h3>
            <div class="form-group">
                <label for="campo-leGusta">¿Qué le gusta?</label>
                <textarea id="campo-leGusta">${desafios.leGusta || ''}</textarea>
            </div>
        </div>
    `;
}

function generarFormularioOdontopediatrica(dataPaciente) {
    const caracteristicas = dataPaciente?.caracteristicas || {};

    return `
        <div class="historia-section">
            <h3>Características del Paciente</h3>
            <div class="form-group">
                <label for="campo-observaciones">Observaciones</label>
                <textarea id="campo-observaciones">${caracteristicas.observaciones || ''}</textarea>
            </div>
        </div>
    `;
}

// Obtener datos del formulario
function obtenerDatosFormulario() {
    const tipo = document.querySelector('input[name="tipo-historia"]:checked').value;
    const datos = {
        tipoHistoria: tipo,
        datosPersonales: {
            nombre: document.getElementById('campo-nombre')?.value || '',
            alias: document.getElementById('campo-alias')?.value || '',
            edad: document.getElementById('campo-edad')?.value || '',
            fechaNacimiento: document.getElementById('campo-fechaNacimiento')?.value || '',
            domicilio: document.getElementById('campo-domicilio')?.value || '',
            nombrePadre: document.getElementById('campo-nombrePadre')?.value || '',
            telefono: document.getElementById('campo-telefono')?.value || '',
            obraSocial: document.getElementById('campo-obraSocial')?.value || '',
            nAfiliado: document.getElementById('campo-nAfiliado')?.value || ''
        }
    };

    if (tipo === 'neurodivergente') {
        // Obtener checkboxes de comunicación
        const comunicacionChecks = document.querySelectorAll('.historia-section:nth-of-type(2) .checkbox input[type="checkbox"]:checked');
        const comunicacion = Array.from(comunicacionChecks).map(c => c.value);

        datos.antecedentes = {
            diagnostico: document.getElementById('campo-diagnostico')?.value || '',
            enfermedadesPreexistentes: document.getElementById('campo-enfermedades')?.value || '',
            medicacion: document.getElementById('campo-medicacion')?.value || '',
            cirugias: document.getElementById('campo-cirugias')?.value || ''
        };

        datos.desafios = {
            comunicacion: comunicacion,
            conducta: document.querySelector('input[name="conducta"]:checked')?.value || '',
            sensoriales: document.getElementById('campo-sensoriales')?.value || '',
            motricidad: document.getElementById('campo-motricidad')?.value || '',
            terapias: document.getElementById('campo-terapias')?.value || '',
            frank: document.querySelector('input[name="frank"]:checked')?.value || '',
            leGusta: document.getElementById('campo-leGusta')?.value || ''
        };
    } else {
        datos.caracteristicas = {
            observaciones: document.getElementById('campo-observaciones')?.value || ''
        };
    }

    return datos;
}
