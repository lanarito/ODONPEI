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
    setTimeout(sincronizarDesdeFirebase, 1500);
});
