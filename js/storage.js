// ========== GESTIÓN DE STORAGE (localStorage) ==========

const STORAGE_KEY = 'ODONPEI_PACIENTES';

// Guardar nuevo paciente
function guardar(paciente) {
    paciente.id = Date.now().toString();
    paciente.fechaCreacion = new Date().toISOString();
    paciente.odontograma = {};
    paciente.fotos = [];
    paciente.archivos = [];

    const pacientes = obtenerTodos();
    pacientes.push(paciente);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));

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
        return true;
    }
    return false;
}

// Eliminar paciente
function eliminar(id) {
    const pacientes = obtenerTodos();
    const filtered = pacientes.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
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
                alert('Datos importados correctamente');
                location.reload();
            } else {
                alert('Formato de archivo inválido');
            }
        } catch (error) {
            alert('Error al importar: ' + error.message);
        }
    };
    reader.readAsText(file);
}
