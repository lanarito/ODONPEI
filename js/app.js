// ========== GESTIÓN DE APLICACIÓN ==========
let pacienteActual = null;
let pacienteEnEdicion = null;
let pacientesFiltrados = [];

// ========== RELOJ ==========
function iniciarReloj() {
    function tick() {
        const ahora = new Date();
        const h = document.getElementById('reloj-hora');
        const f = document.getElementById('reloj-fecha-nav');
        if (h) h.textContent = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        if (f) {
            const txt = ahora.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
            f.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
        }
    }
    tick();
    setInterval(tick, 1000);
}

// ========== CONTADOR DE ATENCIONES ==========
const COUNTER_KEY = 'ODONPEI_ATENCIONES';

function getMesKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getContadorData() {
    return JSON.parse(localStorage.getItem(COUNTER_KEY) || '{}');
}

function saveContadorData(data) {
    localStorage.setItem(COUNTER_KEY, JSON.stringify(data));
    // Sync a Firebase
    if (typeof guardarContadorEnFirestore === 'function') {
        guardarContadorEnFirestore(data);
    }
}

function registrarAtencion() {
    const key = getMesKey();
    const data = getContadorData();
    data[key] = (data[key] || 0) + 1;
    saveContadorData(data);
    renderizarContador();
}

function restarAtencion() {
    const key = getMesKey();
    const data = getContadorData();
    data[key] = Math.max(0, (data[key] || 0) - 1);
    saveContadorData(data);
    renderizarContador();
}

function renderizarContador() {
    const ahora = new Date();
    const key = getMesKey(ahora);
    const data = getContadorData();
    const count = data[key] || 0;
    const mesNombre = ahora.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
    const esUltimoDia = ahora.getDate() === ultimoDia;

    const elMes = document.getElementById('contador-mes-nombre');
    const elNum = document.getElementById('contador-numero');
    const elMsg = document.getElementById('contador-mensaje-fin');
    if (elMes) elMes.textContent = mesNombre;
    if (elNum) elNum.textContent = count;
    if (elMsg) {
        elMsg.style.display = esUltimoDia ? 'block' : 'none';
        if (esUltimoDia) elMsg.textContent = `Total de atenciones de ${mesNombre}: ${count}`;
    }
}

async function sincronizarContadorDesdeFirebase() {
    if (typeof obtenerContadorDesdeFirestore !== 'function') return;
    try {
        const remoto = await obtenerContadorDesdeFirestore();
        if (remoto && Object.keys(remoto).length > 0) {
            // Combinar: tomar el valor más alto entre local y remoto para cada mes
            const local = getContadorData();
            const merged = { ...local };
            for (const [mes, val] of Object.entries(remoto)) {
                merged[mes] = Math.max(merged[mes] || 0, val);
            }
            localStorage.setItem(COUNTER_KEY, JSON.stringify(merged));
            renderizarContador();
        }
    } catch (e) { console.warn('Sync contador:', e); }
}

// ========== USUARIOS (sin contraseña por ahora) ==========
const USUARIOS_VALIDOS = ['odonpei'];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
});

function verificarSesion() {
    const usuario = sessionStorage.getItem('odonpei_usuario');
    if (usuario) {
        mostrarApp(usuario);
    } else {
        mostrarLogin();
    }
}

function mostrarLogin() {
    document.getElementById('pantalla-login').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    setTimeout(() => {
        const input = document.getElementById('login-usuario');
        if (input) input.focus();
    }, 100);
}

function mostrarApp(usuario) {
    document.getElementById('pantalla-login').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    const navUsuario = document.getElementById('nav-usuario');
    if (navUsuario) navUsuario.textContent = '👤 ' + usuario.toUpperCase();
    iniciarReloj();
    renderizarContador();
    setTimeout(sincronizarContadorDesdeFirebase, 2000);
    cargarPacientes();
}

function hacerLogin() {
    const usuario = document.getElementById('login-usuario')?.value?.trim().toLowerCase();
    const errorEl = document.getElementById('login-error');

    if (!usuario) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Ingresa tu usuario';
        return;
    }

    if (USUARIOS_VALIDOS.includes(usuario)) {
        errorEl.style.display = 'none';
        sessionStorage.setItem('odonpei_usuario', usuario);
        mostrarApp(usuario);
    } else {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Usuario no encontrado. Usuarios válidos: ' + USUARIOS_VALIDOS.join(', ');
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('odonpei_usuario');
    mostrarLogin();
}

// ========== NAVEGACIÓN ==========
function cambiarPagina(pagina) {
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

    // Mostrar la página seleccionada
    const elemento = document.getElementById('pagina-' + pagina);
    if (elemento) {
        elemento.style.display = 'block';
    }

    // Ejecutar acciones específicas por página
    switch (pagina) {
        case 'inicio':
            renderizarContador();
            break;
        case 'turnos':
            cargarTurnos();
            break;
        case 'pacientes':
            cargarPacientes();
            break;
        case 'nuevo-paciente':
            try {
                limpiarFormulario();
                pacienteEnEdicion = null;
                document.getElementById('titulo-paciente').textContent = 'Nuevo Paciente';
                generarFormulario('odontopediatrica');
            } catch (error) {
                console.error('Error al generar formulario:', error);
                alert('Error al cargar el formulario. Recarga la página.');
            }
            break;
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// ========== CARGAR Y MOSTRAR PACIENTES ==========
function cargarPacientes() {
    pacientesFiltrados = obtenerTodos();
    mostrarPacientes(pacientesFiltrados);

    // Limpiar búsqueda cuando se carga la página
    const buscador = document.getElementById('buscador-pacientes');
    if (buscador) {
        buscador.value = '';
    }
}

function mostrarPacientes(pacientes, esBusqueda = false) {
    const container = document.getElementById('lista-pacientes');

    if (pacientes.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <p style="color: #999; font-size: 16px;">${esBusqueda ? 'No se encontraron resultados.' : 'No hay pacientes registrados.'}</p>
                ${!esBusqueda ? `<button onclick="cambiarPagina('nuevo-paciente')" class="btn btn-primary" style="margin-top: 20px;">Crear Primer Paciente</button>` : ''}
            </div>
        `;
        return;
    }

    const ordenados = [...pacientes].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    const visibles = esBusqueda ? ordenados : ordenados.slice(0, 5);
    const ocultos = (!esBusqueda && ordenados.length > 5) ? ordenados.length - 5 : 0;

    container.innerHTML = visibles.map(p => `
        <div class="paciente-card" onclick="verDetallesPaciente('${p.id}')">
            <h3>${p.datosPersonales.nombre}</h3>
            <p><strong>Alias:</strong> ${p.datosPersonales.alias || 'N/A'}</p>
            <p><strong>Edad:</strong> ${p.datosPersonales.edad} años</p>
            <p><strong>Tipo:</strong> ${p.tipoHistoria === 'odontopediatrica' ? 'Odontopediátrica' : 'Neurodivergente'}</p>
            <div class="meta">
                <span>${new Date(p.fechaCreacion).toLocaleDateString('es-AR')}</span>
                <span>${p.fotos ? p.fotos.length : 0} fotos</span>
            </div>
        </div>
    `).join('');

    if (ocultos > 0) {
        container.innerHTML += `
            <div style="grid-column:1/-1; text-align:center; padding:20px 0; color:#999; font-size:14px;">
                Hay <strong>${ocultos}</strong> paciente(s) más. Buscá por nombre, alias o edad para encontrarlos.
            </div>
        `;
    }
}

function filtrarPacientes() {
    const busqueda = document.getElementById('buscador-pacientes')?.value.toLowerCase() || '';

    if (!busqueda) {
        mostrarPacientes(pacientesFiltrados, false);
        return;
    }

    const resultados = pacientesFiltrados.filter(p => {
        const nombre = p.datosPersonales.nombre.toLowerCase();
        const alias = (p.datosPersonales.alias || '').toLowerCase();
        const edad = String(p.datosPersonales.edad);
        return nombre.includes(busqueda) || alias.includes(busqueda) || edad.includes(busqueda);
    });

    mostrarPacientes(resultados, true);
}

// ========== VER DETALLES DEL PACIENTE ==========
function verDetallesPaciente(id) {
    pacienteActual = obtenerPorId(id);

    if (!pacienteActual) {
        alert('Paciente no encontrado');
        return;
    }

    // Mostrar página de detalles
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('pagina-detalle-paciente').style.display = 'block';

    // Actualizar título
    document.getElementById('nombre-paciente-detalle').textContent = pacienteActual.datosPersonales.nombre;

    // Mostrar la historia clínica
    mostrarHistoriaClinica();

    // Cargar fotos y archivos
    cargarFotosTimeline();
    cargarArchivos();

    // Resetear tabs
    cambiarTab('historia-clinica');

    window.scrollTo(0, 0);
}

// ========== MOSTRAR HISTORIA CLÍNICA ==========
function mostrarHistoriaClinica() {
    const container = document.getElementById('contenido-historia');
    const data = pacienteActual;

    let html = `
        <div class="historia-clinica">
            <!-- DATOS PERSONALES -->
            <div class="historia-section">
                <h3>Datos Personales</h3>
                <div class="datos-personales">
                    <div>
                        <strong>Nombre:</strong><br>${data.datosPersonales.nombre}
                    </div>
                    <div>
                        <strong>Alias:</strong><br>${data.datosPersonales.alias || 'N/A'}
                    </div>
                    <div>
                        <strong>Edad:</strong><br>${data.datosPersonales.edad} años
                    </div>
                    <div>
                        <strong>Fecha de Nacimiento:</strong><br>${data.datosPersonales.fechaNacimiento}
                    </div>
                    <div>
                        <strong>Domicilio:</strong><br>${data.datosPersonales.domicilio}
                    </div>
                    <div>
                        <strong>Teléfono:</strong><br>${data.datosPersonales.telefono}
                    </div>
                    <div>
                        <strong>Obra Social:</strong><br>${data.datosPersonales.obraSocial || 'N/A'}
                    </div>
                    <div>
                        <strong>N° Afiliado:</strong><br>${data.datosPersonales.nAfiliado || 'N/A'}
                    </div>
                </div>
            </div>
    `;

    // Mostrar específicamente según el tipo de historia
    if (data.tipoHistoria === 'neurodivergente') {
        html += mostrarHistoriaNeurodiverente(data);
    } else {
        html += mostrarHistoriaOdontopediatrica(data);
    }

    // Agregar odontograma
    html += `
        <div class="historia-section">
            <h3>Odontograma</h3>
            <canvas id="odontograma-canvas-detalle" class="odontograma-canvas"></canvas>
        </div>
    </div>
    `;

    container.innerHTML = html;

    // Renderizar el odontograma (modo solo lectura)
    setTimeout(() => {
        const canvas = document.getElementById('odontograma-canvas-detalle');
        if (!canvas) return;
        canvas.width  = 900;
        canvas.height = 380;
        dibujarFondo(canvas);
        const datos = pacienteActual.odontograma;
        if (datos && typeof datos === 'string' && datos.startsWith('data:')) {
            const img = new Image();
            img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0);
            img.src = datos;
        }
    }, 150);
}

function mostrarHistoriaNeurodiverente(data) {
    const ant = data.antecedentes || {};
    const desafios = data.desafios || {};

    return `
        <!-- ANTECEDENTES PATOLÓGICOS -->
        <div class="historia-section">
            <h3>Antecedentes Patológicos</h3>
            <div>
                <strong>Diagnóstico:</strong><br>
                <p>${ant.diagnostico || 'N/A'}</p>
                <strong>Enfermedades Preexistentes:</strong><br>
                <p>${ant.enfermedadesPreexistentes || 'N/A'}</p>
                <strong>Medicación:</strong><br>
                <p>${ant.medicacion || 'N/A'}</p>
                <strong>Cirugías:</strong><br>
                <p>${ant.cirugias || 'N/A'}</p>
            </div>
        </div>

        <!-- DESAFÍOS Y CARACTERÍSTICAS -->
        <div class="historia-section">
            <h3>Desafíos y Características</h3>
            <div style="display: grid; gap: 20px;">
                <div>
                    <strong>Comunicación y Lenguaje:</strong><br>
                    ${desafios.comunicacion || 'N/A'}
                </div>
                <div>
                    <strong>Conducta (Nivel de Apoyo):</strong><br>
                    ${desafios.conducta || 'N/A'}
                </div>
                <div>
                    <strong>Desafíos Sensoriales:</strong><br>
                    ${desafios.sensoriales || 'N/A'}
                </div>
                <div>
                    <strong>Desafíos en la Motricidad:</strong><br>
                    ${desafios.motricidad || 'N/A'}
                </div>
                <div>
                    <strong>Terapias que Realiza:</strong><br>
                    ${desafios.terapias || 'N/A'}
                </div>
                <div>
                    <strong>Escala de Frank:</strong><br>
                    ${desafios.frank || 'N/A'}
                </div>
                <div>
                    <strong>¿Qué le gusta?</strong><br>
                    ${desafios.leGusta || 'N/A'}
                </div>
            </div>
        </div>
    `;
}

function mostrarHistoriaOdontopediatrica(data) {
    const caracteristicas = data.caracteristicas || {};

    return `
        <!-- CARACTERÍSTICAS DEL PACIENTE -->
        <div class="historia-section">
            <h3>Características del Paciente</h3>
            <div style="display: grid; gap: 20px;">
                ${caracteristicas.observaciones ? `
                    <div>
                        <strong>Observaciones:</strong><br>
                        ${caracteristicas.observaciones}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ========== EDITAR PACIENTE ==========
function editarPaciente() {
    if (!pacienteActual) return;

    pacienteEnEdicion = pacienteActual;
    document.getElementById('titulo-paciente').textContent = 'Editar Paciente';

    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('pagina-nuevo-paciente').style.display = 'block';

    // Cambiar tipo de historia
    document.querySelector(`input[name="tipo-historia"][value="${pacienteActual.tipoHistoria}"]`).checked = true;
    generarFormulario(pacienteActual.tipoHistoria, pacienteActual);

    window.scrollTo(0, 0);
}

// ========== ELIMINAR PACIENTE ==========
function eliminarPaciente() {
    if (!pacienteActual) return;

    if (confirm(`¿Está seguro que desea eliminar el paciente "${pacienteActual.datosPersonales.nombre}"? Esta acción no se puede deshacer.`)) {
        eliminar(pacienteActual.id);
        cambiarPagina('pacientes');
    }
}

// ========== GUARDAR PACIENTE ==========
function guardarPaciente() {
    try {
        const nombre = document.getElementById('campo-nombre')?.value || '';

        if (!nombre) {
            alert('El nombre del paciente es requerido');
            return;
        }

        const tipoHistoria = document.querySelector('input[name="tipo-historia"]:checked')?.value || 'odontopediatrica';

        // Obtener datos del odontograma del canvas como imagen PNG
        const datosOdontograma = obtenerDatosOdontogramaDelCanvas() || null;

        const paciente = {
            tipoHistoria: tipoHistoria,
            datosPersonales: {
                nombre: nombre,
                alias: document.getElementById('campo-alias')?.value || '',
                edad: document.getElementById('campo-edad')?.value || '',
                fechaNacimiento: document.getElementById('campo-fechaNacimiento')?.value || '',
                domicilio: document.getElementById('campo-domicilio')?.value || '',
                nombrePadre: document.getElementById('campo-nombrePadre')?.value || '',
                telefono: document.getElementById('campo-telefono')?.value || '',
                obraSocial: document.getElementById('campo-obraSocial')?.value || '',
                nAfiliado: document.getElementById('campo-nAfiliado')?.value || '',
                dni: document.getElementById('campo-dni')?.value || ''
            },
            tratamientos: {
                realizados: document.getElementById('campo-tratamientos-realizados')?.value || '',
                propuesta: document.getElementById('campo-propuesta-tratamiento')?.value || ''
            },
            odontograma: datosOdontograma,
            fotos: [],
            archivos: []
        };

        if (tipoHistoria === 'neurodivergente') {
            paciente.antecedentes = {
                diagnostico: document.getElementById('campo-diagnostico')?.value || '',
                enfermedadesPreexistentes: document.getElementById('campo-enfermedades')?.value || '',
                medicacion: document.getElementById('campo-medicacion')?.value || '',
                cirugias: document.getElementById('campo-cirugias')?.value || ''
            };
            paciente.desafios = {
                comunicacion: document.getElementById('campo-comunicacion')?.value || '',
                conducta: document.getElementById('campo-conducta')?.value || '',
                sensoriales: document.getElementById('campo-sensoriales')?.value || '',
                motricidad: document.getElementById('campo-motricidad')?.value || '',
                terapias: document.getElementById('campo-terapias')?.value || '',
                frank: document.getElementById('campo-frank')?.value || '',
                leGusta: document.getElementById('campo-leGusta')?.value || ''
            };
        } else {
            paciente.caracteristicas = {
                observaciones: document.getElementById('campo-observaciones')?.value || ''
            };
        }

        if (pacienteEnEdicion) {
            paciente.id = pacienteEnEdicion.id;
            paciente.fotos = pacienteEnEdicion.fotos || [];
            paciente.archivos = pacienteEnEdicion.archivos || [];
            paciente.fechaCreacion = pacienteEnEdicion.fechaCreacion;
            // Usar el odontograma del canvas si existe, sino mantener el anterior
            if (!datosOdontograma) {
                paciente.odontograma = pacienteEnEdicion.odontograma || null;
            }
            actualizar(paciente);
            alert('✅ Paciente actualizado correctamente');
        } else {
            guardar(paciente);
            alert('✅ Paciente creado correctamente');
        }

        cambiarPagina('pacientes');
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('❌ Error al guardar el paciente: ' + error.message);
    }
}

// ========== LIMPIAR FORMULARIO ==========
function limpiarFormulario() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
}

// ========== TABS ==========
function cambiarTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Mostrar el tab seleccionado
    document.getElementById('tab-' + tabName).style.display = 'block';
    event.target.classList.add('active');

    // Cargar contenido específico
    if (tabName === 'tratamientos') {
        mostrarTratamientos();
    } else if (tabName === 'presupuesto') {
        mostrarPresupuesto();
    }
}

// ========== FOTOS ==========
function subirFoto(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const foto = {
                id: Date.now(),
                nombre: file.name,
                data: e.target.result,
                fecha: new Date().toISOString()
            };

            if (!pacienteActual.fotos) pacienteActual.fotos = [];
            pacienteActual.fotos.push(foto);
            actualizar(pacienteActual);
            cargarFotosTimeline();
        };
        reader.readAsDataURL(file);
    });

    event.target.value = '';
}

function cargarFotosTimeline() {
    const container = document.getElementById('timeline-fotos');
    if (!pacienteActual.fotos || pacienteActual.fotos.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999;">Sin fotos aún</p>';
        return;
    }

    const fotosSorted = [...pacienteActual.fotos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    container.innerHTML = fotosSorted.map(foto => `
        <div class="foto-item">
            <img src="${foto.data}" alt="${foto.nombre}">
            <div class="foto-fecha">${new Date(foto.fecha).toLocaleDateString('es-AR')}</div>
            <div style="position: absolute; top: 10px; right: 10px;">
                <button onclick="eliminarFoto(${foto.id})" class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;">✕</button>
            </div>
        </div>
    `).join('');
}

function eliminarFoto(fotoId) {
    if (!pacienteActual.fotos) return;
    pacienteActual.fotos = pacienteActual.fotos.filter(f => f.id !== fotoId);
    actualizar(pacienteActual);
    cargarFotosTimeline();
}

// ========== ARCHIVOS ==========
function subirArchivo(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const archivo = {
                id: Date.now(),
                nombre: file.name,
                tipo: file.type,
                data: e.target.result,
                fecha: new Date().toISOString(),
                tamaño: file.size
            };

            if (!pacienteActual.archivos) pacienteActual.archivos = [];
            pacienteActual.archivos.push(archivo);
            actualizar(pacienteActual);
            cargarArchivos();
        };
        reader.readAsDataURL(file);
    });

    event.target.value = '';
}

function cargarArchivos() {
    const container = document.getElementById('lista-archivos');
    if (!pacienteActual.archivos || pacienteActual.archivos.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #999;">Sin archivos aún</p>';
        return;
    }

    container.innerHTML = pacienteActual.archivos.map(archivo => `
        <div class="archivo-item">
            ${archivo.tipo.includes('image')
                ? `<img src="${archivo.data}" alt="${archivo.nombre}" style="width:100%;height:160px;object-fit:cover;display:block;border-radius:6px 6px 0 0;">`
                : `<div class="archivo-icon">${getIconoArchivo(archivo.tipo)}</div>`
            }
            <div class="archivo-nombre">${archivo.nombre}</div>
            <div class="archivo-fecha">${new Date(archivo.fecha).toLocaleDateString('es-AR')}</div>
            <div class="archivo-actions">
                <button onclick="descargarArchivo(${archivo.id})" class="btn btn-primary">Descargar</button>
                <button onclick="eliminarArchivo(${archivo.id})" class="btn btn-danger">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function getIconoArchivo(tipo) {
    if (tipo.includes('pdf')) return '📄';
    if (tipo.includes('image')) return '🖼️';
    if (tipo.includes('word') || tipo.includes('document')) return '📋';
    return '📎';
}

function descargarArchivo(archivoId) {
    const archivo = pacienteActual.archivos.find(a => a.id === archivoId);
    if (!archivo) return;

    const link = document.createElement('a');
    link.href = archivo.data;
    link.download = archivo.nombre;
    link.click();
}

function eliminarArchivo(archivoId) {
    if (!pacienteActual.archivos) return;
    pacienteActual.archivos = pacienteActual.archivos.filter(a => a.id !== archivoId);
    actualizar(pacienteActual);
    cargarArchivos();
}

// ========== CAMBIAR TIPO DE HISTORIA ==========
function cambiarTipoHistoria(tipo) {
    limpiarFormulario();
    generarFormulario(tipo);
}

