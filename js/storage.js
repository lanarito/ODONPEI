// ========== GESTIÓN DE STORAGE (localStorage + Firebase) ==========

const STORAGE_KEY = 'ODONPEI_PACIENTES';

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

function descargarBackupPacientes(pacientes, etiqueta) {
    const blob = new Blob([JSON.stringify(pacientes, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ODONPEI_backup_${etiqueta}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

async function limpiarDuplicadosPacientes() {
    if (typeof obtenerDesdePacientesFirestore !== 'function') {
        alert('Firebase no disponible.');
        return;
    }

    let todos;
    try {
        todos = await obtenerDesdePacientesFirestore();
    } catch (e) {
        alert('No se pudieron leer los pacientes de Firebase. Revisá la consola.');
        return;
    }

    // Agrupar por el id interno del paciente
    const grupos = {};
    todos.forEach(p => {
        if (!p.id) return;
        (grupos[p.id] = grupos[p.id] || []).push(p);
    });

    const ids = Object.keys(grupos);
    const duplicados = todos.length - ids.length;

    if (duplicados <= 0) {
        alert(`✅ No hay duplicados.\n${ids.length} paciente(s), ${todos.length} documento(s).`);
        return;
    }

    if (!confirm(
        `Hay ${todos.length} documentos para ${ids.length} pacientes.\n` +
        `Se van a borrar ${duplicados} copias repetidas y queda una sola de cada paciente ` +
        `(la que tenga los datos más completos).\n\n` +
        `Primero se descarga un backup de TODO en tu computadora.\n\n` +
        `Hacelo en UN solo dispositivo, con los demás cerrados.\n\n¿Continuar?`
    )) return;

    // Backup antes de tocar nada
    descargarBackupPacientes(todos, 'pacientes_antes_de_limpiar');
    if (!confirm('Se descargó el backup.\n\nRevisá que el archivo esté en tu carpeta de Descargas y recién ahí aceptá para borrar los duplicados.')) return;

    let borrados = 0, errores = 0;
    const finales = [];

    for (const id of ids) {
        const copias = grupos[id];
        // La copia con los datos más completos gana
        const mejor = copias.reduce((a, b) => puntajeCopiaPaciente(b) > puntajeCopiaPaciente(a) ? b : a);

        // El documento canónico lleva el id del paciente
        const canonico = { ...mejor, firebaseId: id };
        if (mejor.firebaseId !== id) {
            const ok = await guardarEnFirestore(canonico);
            if (!ok) { errores++; continue; }
        }
        finales.push(canonico);

        // Borrar todas las copias que no sean el documento canónico
        for (const c of copias) {
            if (c.firebaseId && c.firebaseId !== id) {
                const ok = await eliminarDeFirestore(c.firebaseId);
                if (ok) borrados++; else errores++;
            }
        }
    }

    // Dejar el localStorage con una sola copia de cada uno
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finales));
    } catch (e) {
        console.warn('localStorage lleno:', e);
    }
    if (typeof cargarPacientes === 'function') cargarPacientes();

    alert(
        `✅ Limpieza completa.\n\n` +
        `${finales.length} paciente(s) quedaron con un solo documento.\n` +
        `${borrados} copia(s) repetida(s) eliminada(s).` +
        (errores ? `\n⚠️ ${errores} error(es), revisá la consola.` : '') +
        `\n\nRecargá los otros dispositivos (Ctrl+Shift+R).`
    );
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
        // 2. Escuchar en tiempo real — SOLO muestra, nunca sube (evita bucle/duplicados)
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
            });
        }
    }, 1500);
});
