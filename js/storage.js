// ========== GESTIÓN DE STORAGE (localStorage + Firebase) ==========

const STORAGE_KEY = 'ODONPEI_PACIENTES';

// Para que el mantenimiento automático corra una sola vez por sesión
let celularesYaUnificados = false;

// Guardar nuevo paciente
function guardar(paciente) {
    paciente.id = Date.now().toString();
    paciente.fechaCreacion = new Date().toISOString();

    // Inicializar campos si no existen
    if (!paciente.odontograma) paciente.odontograma = {};
    if (!paciente.fotos) paciente.fotos = [];
    if (!paciente.archivos) paciente.archivos = [];

    const pacientes = obtenerTodos();
    pacientes.push(paciente);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));

    // Guardar en Firebase si está disponible
    if (typeof guardarEnFirestore === 'function') {
        guardarEnFirestore(paciente).then(() => {
            // Actualizar localStorage con el firebaseId que retornó Firestore
            const todos = obtenerTodos();
            const idx = todos.findIndex(p => p.id === paciente.id);
            if (idx !== -1) {
                todos[idx].firebaseId = paciente.firebaseId;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
            }
            console.log('✅ Paciente guardado en Firebase');
        }).catch(error => {
            console.warn('Guardado en localStorage, Firebase error:', error);
        });
    }

    return paciente;
}

// Obtener todos los pacientes
function obtenerTodos() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Obtener paciente por ID
function obtenerPorId(id) {
    const pacientes = obtenerTodos();
    return pacientes.find(p => p.id === id);
}

// Actualizar paciente
function actualizar(paciente) {
    const pacientes = obtenerTodos();
    const index = pacientes.findIndex(p => p.id === paciente.id);

    if (index !== -1) {
        pacientes[index] = paciente;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));

        // Actualizar en Firebase
        if (typeof actualizarEnFirestore === 'function') {
            actualizarEnFirestore(paciente).catch(error => {
                console.warn('Actualizado en localStorage, Firebase error:', error);
            });
        }

        return true;
    }
    return false;
}

// Eliminar paciente
function eliminar(id) {
    const pacientes = obtenerTodos();
    const paciente = pacientes.find(p => p.id === id);
    const filtered = pacientes.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // Eliminar de Firebase
    if (paciente && paciente.firebaseId && typeof eliminarDeFirestore === 'function') {
        eliminarDeFirestore(paciente.firebaseId).catch(error => {
            console.warn('Eliminado en localStorage, Firebase error:', error);
        });
    }
}

// Exportar datos (backup)
function exportarDatos() {
    const pacientes = obtenerTodos();
    const json = JSON.stringify(pacientes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ODONPEI_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Importar datos (restore)
function importarDatos(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const pacientes = JSON.parse(e.target.result);
            if (Array.isArray(pacientes)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
                alert('✅ Datos importados correctamente');
                location.reload();
            } else {
                alert('❌ Formato de archivo inválido');
            }
        } catch (error) {
            alert('❌ Error al importar: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// ========== LIMPIAR PACIENTES DUPLICADOS ==========
// Durante meses los pacientes se guardaron con addDoc, que crea un documento
// NUEVO cada vez. Cada dispositivo que subía su copia generaba otro documento
// del mismo paciente: se llegó a 303 documentos para 77 pacientes.
// Esto deja UN documento por paciente, con el id del paciente como id del
// documento (igual que los turnos), y borra las copias.

// Entre varias copias del mismo paciente, cuál tiene los datos más completos
function puntajeCopiaPaciente(p) {
    const dp = p.datosPersonales || {};
    let s = 0;
    if (String(dp.telefono || '').startsWith('+54')) s += 1000;   // teléfono ya unificado
    if (dp.telefono2) s += 100;
    s += Object.values(dp).filter(v => String(v || '').trim()).length * 10;
    if (p.odontograma) s += 50;
    s += (p.fotos?.length || 0) * 3 + (p.archivos?.length || 0) * 3;
    if (p.tratamientos?.realizados) s += 5;
    if (p.tratamientos?.propuesta) s += 5;
    return s;
}

// Corre sola al abrir la app. Sin botón y sin preguntar nada: junta las copias
// de cada paciente en un solo documento y borra las sobrantes.
// Es seguro porque antes de borrar VERIFICA que el documento bueno quedó escrito.
async function deduplicarPacientesAuto() {
    if (typeof obtenerDesdePacientesFirestore !== 'function') return;

    let todos;
    try {
        todos = await obtenerDesdePacientesFirestore();
    } catch (e) {
        console.warn('No se pudieron leer los pacientes para deduplicar:', e);
        return;
    }

    // Agrupar por el id interno del paciente
    const grupos = {};
    todos.forEach(p => { if (p.id) (grupos[p.id] = grupos[p.id] || []).push(p); });

    const ids = Object.keys(grupos);
    if (todos.length === ids.length) return;   // no hay nada repetido, seguimos de largo

    console.log(`🧹 ${todos.length} documentos para ${ids.length} pacientes. Limpiando duplicados...`);

    let borrados = 0, errores = 0;

    for (const id of ids) {
        const copias = grupos[id];
        if (copias.length === 1) continue;

        // Gana la copia con los datos más completos
        const mejor = copias.reduce((a, b) => puntajeCopiaPaciente(b) > puntajeCopiaPaciente(a) ? b : a);

        // El documento bueno lleva el id del paciente como id de documento
        if (mejor.firebaseId !== id) {
            const guardado = await guardarEnFirestore({ ...mejor, firebaseId: id });
            if (!guardado) { errores++; continue; }
        }

        // ANTES de borrar nada, confirmar que el documento bueno está en la nube
        if (typeof existePacienteEnFirestore === 'function') {
            const existe = await existePacienteEnFirestore(id);
            if (!existe) { errores++; continue; }
        }

        for (const c of copias) {
            if (c.firebaseId && c.firebaseId !== id) {
                const ok = await eliminarDeFirestore(c.firebaseId);
                if (ok) borrados++; else errores++;
            }
        }
    }

    console.log(`✅ Duplicados limpiados: ${borrados} copia(s) borrada(s)` + (errores ? `, ${errores} error(es)` : ''));
    if (typeof cargarPacientes === 'function') cargarPacientes();
}

// Sincronizar desde Firebase al iniciar (si está disponible)
async function sincronizarDesdeFirebase() {
    if (typeof obtenerDesdePacientesFirestore !== 'function') return false;
    try {
        const pacientesFirebase = await obtenerDesdePacientesFirestore();
        if (pacientesFirebase.length > 0) {
            // Firebase tiene datos → usarlos como fuente de verdad
            console.log('✅ Cargando datos desde Firebase...');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientesFirebase));
            if (typeof cargarPacientes === 'function') cargarPacientes();
            return true;
        } else {
            // Firebase vacío → subir datos locales si existen
            const locales = obtenerTodos();
            if (locales.length > 0) {
                console.log('⬆️ Migrando datos locales a Firebase...');
                for (const p of locales) {
                    if (!p.firebaseId) {
                        await guardarEnFirestore(p);
                    }
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(locales));
                console.log('✅ Migración completada');
            }
        }
    } catch (error) {
        console.warn('Error sincronizando desde Firebase:', error);
    }
    return false;
}

// Esperar a que firebase-config.js (módulo) termine de asignar window.xxx
window.addEventListener('load', () => {
    setTimeout(async () => {
        // 1. Subir UNA SOLA VEZ los pacientes locales que aún no están en Firebase
        //    (se comparan por el campo .id, así no se duplican los que ya están)
        if (typeof obtenerDesdePacientesFirestore === 'function' && typeof guardarEnFirestore === 'function') {
            try {
                const remotos = await obtenerDesdePacientesFirestore();
                const idsRemotos = new Set(remotos.map(p => p.id));
                const locales = obtenerTodos();
                for (const p of locales) {
                    if (!idsRemotos.has(p.id)) await guardarEnFirestore(p);
                }
            } catch (e) { console.warn('Subida inicial pacientes:', e); }
        }
        // 2. Mantenimiento automático, sin botones y sin preguntar nada:
        //    primero se juntan las copias repetidas de cada paciente y después se
        //    dejan todos los teléfonos en el mismo formato. Las dos rutinas son
        //    idempotentes: si no hay nada que hacer, no hacen nada.
        try {
            await deduplicarPacientesAuto();
        } catch (e) { console.warn('Deduplicando pacientes:', e); }

        // 3. Escuchar en tiempo real — SOLO muestra, nunca sube (evita bucle/duplicados)
        if (typeof sincronizarEnTiempoReal === 'function') {
            sincronizarEnTiempoReal((pacientesRemotos) => {
                const locales = obtenerTodos();
                const idsRemotos = new Set(pacientesRemotos.map(p => p.id));
                const soloLocales = locales.filter(p => !idsRemotos.has(p.id));

                // Mientras queden documentos duplicados en la nube, dejar UNA sola
                // copia de cada paciente (la más completa). Si no, la lista muestra
                // el mismo paciente 3 veces y el localStorage se llena al pedo.
                const porId = new Map();
                for (const p of [...pacientesRemotos, ...soloLocales]) {
                    const previo = porId.get(p.id);
                    if (!previo || puntajeCopiaPaciente(p) > puntajeCopiaPaciente(previo)) {
                        porId.set(p.id, p);
                    }
                }

                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([...porId.values()]));
                } catch (e) {
                    // Se llenó el localStorage (fotos y odontogramas en base64 ocupan mucho)
                    console.warn('No se pudo guardar la copia local, se sigue con la de la nube:', e);
                }
                if (typeof cargarPacientes === 'function') cargarPacientes();

                // Los teléfonos se unifican DESPUÉS de tener los datos frescos de la
                // nube. Si se hiciera antes, se trabajaría sobre una copia local vieja
                // y quedarían números sin corregir (fue justo lo que pasó la vez pasada).
                if (!celularesYaUnificados && typeof unificarCelularesAuto === 'function') {
                    celularesYaUnificados = true;
                    unificarCelularesAuto().catch(e => console.warn('Unificando teléfonos:', e));
                }
            });
        }
    }, 1500);
});
