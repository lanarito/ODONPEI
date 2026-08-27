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
const PLANTILLA_DEFAULT = 'Hola {nombre}! 😊 Te recordamos tu turno en el consultorio el {dia} a las {hora} hs. Respondé CONFIRMO para confirmarlo. ¡Gracias!';

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
    return obtenerPlantilla()
        .replace(/\{nombre\}/g, primerNombre(turno.pacienteNombre))
        .replace(/\{completo\}/g, turno.pacienteNombre || '')
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
               <textarea id="rec-plantilla-texto" rows="4">${obtenerPlantilla()}</textarea>
               <div class="rec-plantilla-ayuda">
                   Podés usar: <code>{nombre}</code> <code>{completo}</code> <code>{dia}</code> <code>{fecha}</code> <code>{hora}</code>
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
