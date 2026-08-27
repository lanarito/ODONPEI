// ========== RECORDATORIOS DE TURNOS POR WHATSAPP ==========
//
// Flujo "un clic": se lista un día de turnos y cada uno tiene un botón que abre
// WhatsApp con el mensaje YA ESCRITO — la doctora solo aprieta enviar.
//
// OJO: no hay envío automático y no puede haberlo. El sitio es estático
// (GitHub Pages), no hay un servidor propio que se despierte a las 9 AM a
// mandar mensajes. Por eso el envío final siempre lo confirma una persona.
//
// Lo que sí queda automático: saber qué turnos faltan recordar. La marca
// "recordadoEn" se guarda en Firebase, así que si ella recuerda un turno desde
// la notebook, en la máquina del consultorio ya aparece como hecho.

const PLANTILLA_KEY = 'ODONPEI_PLANTILLA_RECORDATORIO';
const PLANTILLA_DEFAULT =
    'Nos comunicamos de ODONPEI para recordar el turno de {nombre} este {diacorto} a las {hora}. Confirmar su asistencia.\n' +
    '\n' +
    'Cada turno es una oportunidad de salud. Si tienes una cita programada y surge un imprevisto, avísanos con tiempo. Tu cancelación anticipada le da la posibilidad a otra familia de ocupar ese lugar y recibir la atención que necesita.\n' +
    '\n' +
    '¡Gracias por tu respeto y solidaridad!';

// Estados a los que tiene sentido mandarles un recordatorio
const ESTADOS_RECORDABLES = ['pendiente', 'confirmado', 'reprogramado'];

let recordDiaOffset = 1;      // 0 = hoy, 1 = mañana, 2 = pasado...
let recordPanelAbierto = false;
let recordEditandoPlantilla = false;

// ---------- Plantilla del mensaje (compartida entre estaciones) ----------
function obtenerPlantilla() {
    return localStorage.getItem(PLANTILLA_KEY) || PLANTILLA_DEFAULT;
}

function guardarPlantillaTexto(texto) {
    const limpio = (texto || '').trim() || PLANTILLA_DEFAULT;
    localStorage.setItem(PLANTILLA_KEY, limpio);
    if (typeof guardarPlantillaEnFirestore === 'function') guardarPlantillaEnFirestore(limpio);
}

async function sincronizarPlantilla() {
    if (typeof obtenerPlantillaDesdeFirestore !== 'function') return;
    try {
        const remota = await obtenerPlantillaDesdeFirestore();
        if (remota) localStorage.setItem(PLANTILLA_KEY, remota);
    } catch (e) { console.warn('Sync plantilla:', e); }
}

// ---------- Celular → formato internacional para wa.me ----------
// Los celulares se cargan a mano y cada uno los escribe distinto:
// "11 1234-5678", "011 15 1234 5678", "+54 9 11 1234 5678"...
// wa.me necesita solo dígitos y con código de país: 5491112345678
function normalizarCelular(raw) {
    if (!raw) return '';
    const esInternacional = String(raw).trim().startsWith('+');
    let d = String(raw).replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('00')) d = d.slice(2);

    if (d.startsWith('54')) {                    // ya trae el código de país
        let resto = d.slice(2);
        if (resto.startsWith('9')) resto = resto.slice(1);
        return '549' + limpiarLocalAR(resto);
    }
    if (esInternacional) return d;               // otro país: se respeta tal cual
    return '549' + limpiarLocalAR(d);
}

// Saca el 0 de la característica y el 15 del celular (formato viejo argentino)
function limpiarLocalAR(n) {
    if (n.startsWith('0')) n = n.slice(1);
    // Con "15" el número queda en 12 dígitos: característica (2-4) + 15 + abonado
    if (n.length === 12) {
        for (const largo of [2, 3, 4]) {
            if (n.substr(largo, 2) === '15') {
                n = n.slice(0, largo) + n.slice(largo + 2);
                break;
            }
        }
    }
    return n;
}

// ---------- Formato único para mostrar y guardar ----------
// Todos los números terminan guardados igual: +54 9 11 1234-5678
// Se sigue guardando "lindo" (con espacios) porque se muestra en pantalla;
// normalizarCelular() lo vuelve a convertir a dígitos cuando se abre WhatsApp.

// Características de 3 dígitos más usadas (el resto se asume de 4; 11 es de 2)
const AREAS_3_DIGITOS = new Set([
    '220','221','223','230','236','237','249','260','261','263','264','266',
    '280','291','297','299','341','342','343','345','348','351','353','358',
    '362','364','370','376','379','380','381','383','385','387','388'
]);

function formatearCelular(digitos) {
    if (!digitos) return '';
    if (!digitos.startsWith('549')) return '+' + digitos;   // otro país: se deja como está
    const n = digitos.slice(3);
    let largoArea = 4;
    if (n.startsWith('11')) largoArea = 2;
    else if (AREAS_3_DIGITOS.has(n.slice(0, 3))) largoArea = 3;
    const area = n.slice(0, largoArea);
    const resto = n.slice(largoArea);
    const abonado = resto.length > 4 ? resto.slice(0, resto.length - 4) + '-' + resto.slice(-4) : resto;
    return '+54 9 ' + area + ' ' + abonado;
}

// Revisa un número cargado a mano y dice qué hacer con él.
// estado: 'vacio' | 'ok' | 'corregir' | 'revisar'
function analizarCelular(raw) {
    const texto = String(raw || '').trim();
    if (!texto) return { estado: 'vacio', valor: '', motivo: '' };

    // Más de un número en el mismo campo ("11 1234-5678 / 11 8765-4321")
    if (/[\/;,]| o /i.test(texto) && (texto.replace(/\D/g, '').length > 12)) {
        return { estado: 'revisar', valor: texto, motivo: 'parece tener más de un número' };
    }

    const digitos = normalizarCelular(texto);
    if (!digitos) return { estado: 'revisar', valor: texto, motivo: 'no tiene números' };

    if (digitos.startsWith('549')) {
        const resto = digitos.slice(3);
        if (resto.length !== 10) {
            return {
                estado: 'revisar', valor: texto,
                motivo: resto.length < 10 ? 'faltan dígitos (¿sin característica?)' : 'tiene dígitos de más'
            };
        }
    } else if (digitos.length < 8) {
        return { estado: 'revisar', valor: texto, motivo: 'demasiado corto' };
    }

    const unificado = formatearCelular(digitos);
    return {
        estado: unificado === texto ? 'ok' : 'corregir',
        valor: unificado,
        motivo: ''
    };
}

// Deja el número en formato único si se puede; si es dudoso lo devuelve tal cual
function unificarSiSePuede(raw) {
    const a = analizarCelular(raw);
    return (a.estado === 'corregir' || a.estado === 'ok') ? a.valor : String(raw || '').trim();
}

// ---------- Fechas ----------
function fechaDeOffset(off) {
    const d = new Date();
    d.setDate(d.getDate() + off);
    d.setHours(0, 0, 0, 0);
    return d;
}

function etiquetaDia(off) {
    const d = fechaDeOffset(off);
    const nombre = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (off === 0) return 'Hoy — ' + nombre;
    if (off === 1) return 'Mañana — ' + nombre;
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

function turnosParaRecordar(off) {
    const f = fechaStr(fechaDeOffset(off));
    return obtenerTurnos()
        .filter(t => t.fecha === f)
        .sort((a, b) => a.hora.localeCompare(b.hora));
}

// ---------- Mensaje ----------
function primerNombre(nombreCompleto) {
    return String(nombreCompleto || '').trim().split(/\s+/)[0] || '';
}

function armarMensaje(turno) {
    const f = new Date(turno.fecha + 'T12:00:00');
    const dia = f.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    // {diacorto} = "Martes 26/5" — día de la semana con mayúscula + día/mes
    const semana = f.toLocaleDateString('es-AR', { weekday: 'long' });
    const diacorto = semana.charAt(0).toUpperCase() + semana.slice(1) +
                     ' ' + f.getDate() + '/' + (f.getMonth() + 1);
    return obtenerPlantilla()
        .replace(/\{nombre\}/g, primerNombre(turno.pacienteNombre))
        .replace(/\{completo\}/g, turno.pacienteNombre || '')
        .replace(/\{diacorto\}/g, diacorto)
        .replace(/\{dia\}/g, dia)
        .replace(/\{fecha\}/g, f.toLocaleDateString('es-AR'))
        .replace(/\{hora\}/g, turno.hora);
}

// ---------- Acciones ----------
function recordarTurno(id) {
    const turnos = obtenerTurnos();
    const t = turnos.find(x => x.id === id);
    if (!t) return;

    const tel = normalizarCelular(t.celular);
    if (!tel) {
        alert('Este turno no tiene celular cargado.\n\nModificá el turno y agregalo para poder mandar el recordatorio.');
        return;
    }

    // Se abre desde el click del usuario → el navegador no lo bloquea como popup
    window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(armarMensaje(t)), '_blank');

    t.recordadoEn = new Date().toISOString();
    guardarTurnosStorage(turnos);
    if (typeof actualizarTurnoEnFirestore === 'function') actualizarTurnoEnFirestore(t);
    renderPanelRecordatorios();
    renderizarAvisoRecordatorios();
}

function desmarcarRecordado(id) {
    const turnos = obtenerTurnos();
    const t = turnos.find(x => x.id === id);
    if (!t) return;
    t.recordadoEn = '';          // vacío, no borrado: así updateDoc lo pisa en Firebase
    guardarTurnosStorage(turnos);
    if (typeof actualizarTurnoEnFirestore === 'function') actualizarTurnoEnFirestore(t);
    renderPanelRecordatorios();
    renderizarAvisoRecordatorios();
}

function navegarDiaRecordatorio(dir) {
    recordDiaOffset += dir;
    renderPanelRecordatorios();
}

// ---------- Panel ----------
function abrirPanelRecordatorios(off) {
    recordDiaOffset = (typeof off === 'number') ? off : 1;
    recordPanelAbierto = true;
    recordEditandoPlantilla = false;
    renderPanelRecordatorios();
}

function cerrarPanelRecordatorios() {
    recordPanelAbierto = false;
    recordEditandoPlantilla = false;
    const cont = document.getElementById('panel-recordatorios-container');
    if (cont) cont.innerHTML = '';
}

function editarTurnoDesdeRecordatorios(id) {
    cerrarPanelRecordatorios();     // los dos son modales: no los superponemos
    editarTurno(id);
}

function toggleEditorPlantilla() {
    recordEditandoPlantilla = !recordEditandoPlantilla;
    renderPanelRecordatorios();
}

function guardarPlantillaDesdePanel() {
    const txt = document.getElementById('rec-plantilla-texto')?.value;
    guardarPlantillaTexto(txt);
    recordEditandoPlantilla = false;
    renderPanelRecordatorios();
}

function restaurarPlantillaDefault() {
    const ta = document.getElementById('rec-plantilla-texto');
    if (ta) ta.value = PLANTILLA_DEFAULT;
}

function renderPanelRecordatorios() {
    const cont = document.getElementById('panel-recordatorios-container');
    if (!cont || !recordPanelAbierto) return;

    const turnos = turnosParaRecordar(recordDiaOffset);
    const recordables = turnos.filter(t => ESTADOS_RECORDABLES.includes(t.estado));
    const pendientes = recordables.filter(t => !t.recordadoEn);

    let lista;
    if (turnos.length === 0) {
        lista = '<div class="rec-vacio">No hay turnos para este día.</div>';
    } else {
        lista = turnos.map(t => {
            const tel = normalizarCelular(t.celular);
            const recordable = ESTADOS_RECORDABLES.includes(t.estado);
            let accion;

            if (!recordable) {
                accion = `<span class="rec-nota">no corresponde</span>`;
            } else if (!tel) {
                accion = `<button class="btn-rec btn-rec-falta" onclick="editarTurnoDesdeRecordatorios('${t.id}')">✏️ Cargar celular</button>`;
            } else if (t.recordadoEn) {
                const h = new Date(t.recordadoEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                accion = `<span class="rec-hecho">✅ ${h}</span>
                          <button class="rec-link" onclick="desmarcarRecordado('${t.id}')">deshacer</button>`;
            } else {
                accion = `<button class="btn-rec" onclick="recordarTurno('${t.id}')">📲 Recordar</button>`;
            }

            return `
                <div class="rec-item${t.recordadoEn ? ' rec-item-hecho' : ''}${recordable ? '' : ' rec-item-off'}">
                    <div class="rec-item-info">
                        <span class="rec-hora">${t.hora}</span>
                        <span class="rec-nombre">${t.pacienteNombre}</span>
                        <span class="rec-tel">${tel ? '+' + tel : '— sin celular —'}</span>
                    </div>
                    <div class="rec-item-accion">${accion}</div>
                </div>`;
        }).join('');
    }

    const plantillaBloque = recordEditandoPlantilla
        ? `<div class="rec-plantilla-editor">
               <label>Mensaje que se manda</label>
               <textarea id="rec-plantilla-texto" rows="9">${obtenerPlantilla()}</textarea>
               <div class="rec-plantilla-ayuda">
                   Podés usar:
                   <code>{nombre}</code> Shiara ·
                   <code>{completo}</code> Shiara Robledo ·
                   <code>{diacorto}</code> Martes 26/5 ·
                   <code>{dia}</code> martes, 26 de mayo ·
                   <code>{fecha}</code> 26/5/2026 ·
                   <code>{hora}</code> 18:30
               </div>
               <div class="rec-plantilla-btns">
                   <button class="btn btn-outline" onclick="restaurarPlantillaDefault()">Restaurar</button>
                   <button class="btn btn-outline" onclick="toggleEditorPlantilla()">Cancelar</button>
                   <button class="btn btn-primary" onclick="guardarPlantillaDesdePanel()">Guardar mensaje</button>
               </div>
           </div>`
        : `<button class="rec-link rec-link-editar" onclick="toggleEditorPlantilla()">✏️ Editar el mensaje</button>`;

    cont.innerHTML = `
        <div class="modal-overlay" onclick="cerrarPanelRecordatorios()">
            <div class="modal-content rec-modal" onclick="event.stopPropagation()">
                <h3 style="margin-bottom:12px; color:#333;">📲 Recordatorios por WhatsApp</h3>

                <div class="rec-nav">
                    <button class="rec-nav-btn" onclick="navegarDiaRecordatorio(-1)">←</button>
                    <span class="rec-dia">${etiquetaDia(recordDiaOffset)}</span>
                    <button class="rec-nav-btn" onclick="navegarDiaRecordatorio(1)">→</button>
                </div>

                <div class="rec-resumen">
                    ${recordables.length} turno(s) para recordar ·
                    <strong>${pendientes.length} sin recordar</strong>
                </div>

                <div class="rec-lista">${lista}</div>

                ${plantillaBloque}

                <div class="rec-pie">
                    Al tocar <strong>Recordar</strong> se abre WhatsApp con el mensaje escrito.
                    Solo hay que apretar enviar.
                </div>

                <div class="form-actions" style="margin-top:14px;">
                    <button class="btn btn-outline" onclick="cerrarPanelRecordatorios()" style="width:100%;">Cerrar</button>
                </div>
            </div>
        </div>`;
}

// ========== UNIFICAR CELULARES YA CARGADOS ==========
// Pasa por todos los turnos y pacientes y deja todos los números en el mismo
// formato. Primero muestra qué va a cambiar; recién con "Unificar" escribe.

let unificarPendientes = [];   // lo que se va a cambiar, calculado en el relevamiento

function relevarCelulares() {
    const filas = [];

    obtenerTurnos().forEach(t => {
        const a = analizarCelular(t.celular);
        if (a.estado === 'vacio') return;
        filas.push({
            tipo: 'Turno', id: t.id,
            nombre: t.pacienteNombre,
            detalle: new Date(t.fecha + 'T12:00:00').toLocaleDateString('es-AR') + ' ' + t.hora,
            actual: String(t.celular || '').trim(),
            nuevo: a.valor, estado: a.estado, motivo: a.motivo
        });
    });

    if (typeof obtenerTodos === 'function') {
        obtenerTodos().forEach(p => {
            const tel = p.datosPersonales?.telefono;
            const a = analizarCelular(tel);
            if (a.estado === 'vacio') return;
            filas.push({
                tipo: 'Paciente', id: p.id,
                nombre: p.datosPersonales?.nombre || '(sin nombre)',
                detalle: p.firebaseId ? '' : 'solo en este dispositivo',
                actual: String(tel || '').trim(),
                nuevo: a.valor, estado: a.estado, motivo: a.motivo,
                sinFirebase: !p.firebaseId
            });
        });
    }

    return filas;
}

function abrirUnificarCelulares() {
    const filas = relevarCelulares();
    unificarPendientes = filas.filter(f => f.estado === 'corregir');
    const ok      = filas.filter(f => f.estado === 'ok');
    const revisar = filas.filter(f => f.estado === 'revisar');

    const cont = document.getElementById('panel-recordatorios-container');
    if (!cont) return;

    const filaHTML = f => `
        <div class="uni-fila uni-${f.estado}">
            <div class="uni-quien">
                <span class="uni-tipo">${f.tipo}</span>
                <span class="uni-nombre">${f.nombre}</span>
                ${f.detalle ? `<span class="uni-detalle">${f.detalle}</span>` : ''}
            </div>
            <div class="uni-numeros">
                <span class="uni-antes">${f.actual}</span>
                ${f.estado === 'corregir' ? `<span class="uni-flecha">→</span><span class="uni-despues">${f.nuevo}</span>` : ''}
                ${f.estado === 'revisar' ? `<span class="uni-motivo">⚠️ ${f.motivo}</span>` : ''}
            </div>
        </div>`;

    let cuerpo = '';
    if (unificarPendientes.length) {
        cuerpo += `<div class="uni-titulo">Se van a corregir (${unificarPendientes.length})</div>
                   <div class="uni-lista">${unificarPendientes.map(filaHTML).join('')}</div>`;
    }
    if (revisar.length) {
        cuerpo += `<div class="uni-titulo uni-titulo-warn">Hay que revisarlos a mano (${revisar.length})</div>
                   <div class="uni-lista">${revisar.map(filaHTML).join('')}</div>
                   <div class="uni-nota">Estos no se tocan. Abrí el turno o el paciente y corregí el número.</div>`;
    }
    if (ok.length) {
        cuerpo += `<div class="uni-titulo uni-titulo-ok">Ya están bien (${ok.length})</div>`;
    }
    if (!cuerpo) {
        cuerpo = `<div class="rec-vacio">No hay teléfonos cargados todavía.</div>`;
    }

    recordPanelAbierto = false;   // este panel reemplaza al de recordatorios
    cont.innerHTML = `
        <div class="modal-overlay" onclick="cerrarPanelRecordatorios()">
            <div class="modal-content rec-modal" onclick="event.stopPropagation()">
                <h3 style="margin-bottom:6px; color:#333;">📞 Unificar celulares</h3>
                <p class="uni-intro">
                    Deja todos los números en el mismo formato
                    (<strong>+54 9 11 1234-5678</strong>) para que WhatsApp funcione siempre.
                </p>
                ${cuerpo}
                <div class="form-actions" style="margin-top:16px; display:flex; gap:8px;">
                    <button class="btn btn-outline" onclick="cerrarPanelRecordatorios()" style="flex:1;">Cancelar</button>
                    <button class="btn btn-primary" onclick="aplicarUnificacionCelulares()" style="flex:1;"
                        ${unificarPendientes.length ? '' : 'disabled'}>
                        ✅ Unificar ${unificarPendientes.length || ''}
                    </button>
                </div>
            </div>
        </div>`;
}

async function aplicarUnificacionCelulares() {
    if (!unificarPendientes.length) return;

    const turnosACambiar    = unificarPendientes.filter(f => f.tipo === 'Turno');
    const pacientesACambiar = unificarPendientes.filter(f => f.tipo === 'Paciente');
    let soloLocales = 0;

    // --- Turnos ---
    if (turnosACambiar.length) {
        const turnos = obtenerTurnos();
        const tocados = [];
        turnosACambiar.forEach(f => {
            const t = turnos.find(x => x.id === f.id);
            if (!t) return;
            t.celularOriginal = t.celular;   // por las dudas, se guarda lo que estaba
            t.celular = f.nuevo;
            tocados.push(t);
        });
        guardarTurnosStorage(turnos);
        if (typeof actualizarTurnoEnFirestore === 'function') {
            for (const t of tocados) await actualizarTurnoEnFirestore(t);
        }
    }

    // --- Pacientes ---
    if (pacientesACambiar.length && typeof obtenerTodos === 'function') {
        const pacientes = obtenerTodos();
        const tocados = [];
        pacientesACambiar.forEach(f => {
            const p = pacientes.find(x => x.id === f.id);
            if (!p || !p.datosPersonales) return;
            p.datosPersonales.telefonoOriginal = p.datosPersonales.telefono;
            p.datosPersonales.telefono = f.nuevo;
            if (p.firebaseId) tocados.push(p); else soloLocales++;
        });
        localStorage.setItem('ODONPEI_PACIENTES', JSON.stringify(pacientes));
        if (typeof actualizarEnFirestore === 'function') {
            // Solo los que ya existen en la nube: los que no tienen firebaseId
            // se duplicarían si los mandáramos como nuevos.
            for (const p of tocados) await actualizarEnFirestore(p);
        }
    }

    cerrarPanelRecordatorios();
    renderizarTurnosHoy();
    renderizarSemana();

    alert(
        `✅ ${unificarPendientes.length} número(s) unificado(s).\n` +
        `${turnosACambiar.length} en turnos · ${pacientesACambiar.length} en pacientes.` +
        (soloLocales ? `\n\n⚠️ ${soloLocales} paciente(s) se corrigieron solo en este dispositivo (todavía no están en la nube).` : '')
    );
    unificarPendientes = [];
}

// ---------- Aviso en la página de Turnos ----------
function renderizarAvisoRecordatorios() {
    const cont = document.getElementById('aviso-recordatorios');
    if (!cont) return;

    const manana = turnosParaRecordar(1).filter(t => ESTADOS_RECORDABLES.includes(t.estado));
    if (manana.length === 0) { cont.innerHTML = ''; return; }

    const pendientes = manana.filter(t => !t.recordadoEn).length;
    const listo = pendientes === 0;

    cont.innerHTML = `
        <div class="rec-aviso${listo ? ' rec-aviso-ok' : ''}">
            <span class="rec-aviso-texto">
                ${listo ? '✅' : '📲'} <strong>Mañana:</strong> ${manana.length} turno(s) ·
                ${listo ? 'todos recordados' : `<strong>${pendientes} sin recordar</strong>`}
            </span>
            <button class="btn btn-primary rec-aviso-btn" onclick="abrirPanelRecordatorios(1)">
                ${listo ? 'Ver' : 'Recordar ahora'}
            </button>
        </div>`;
}

// Traer la plantilla compartida al arrancar
setTimeout(sincronizarPlantilla, 1500);
