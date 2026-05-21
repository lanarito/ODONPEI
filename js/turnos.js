// ========== TURNERO DIGITAL ==========

const TURNOS_KEY = 'ODONPEI_TURNOS';
let semanaOffset = 0;

function obtenerTurnos() {
    return JSON.parse(localStorage.getItem(TURNOS_KEY) || '[]');
}

function guardarTurnosStorage(turnos) {
    localStorage.setItem(TURNOS_KEY, JSON.stringify(turnos));
}

async function sincronizarTurnosDesdeFirebase() {
    if (typeof obtenerTurnosDesdeFirestore !== 'function') return;
    try {
        const remotos = await obtenerTurnosDesdeFirestore();
        if (remotos.length > 0) {
            localStorage.setItem(TURNOS_KEY, JSON.stringify(remotos));
            renderizarSemana();
        } else {
            const locales = obtenerTurnos();
            for (const t of locales) {
                if (!t.firebaseId) await guardarTurnoEnFirestore(t);
            }
        }
    } catch (e) { console.warn('Sync turnos:', e); }
}

function getLunesDeSemana(offset) {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diffLunes = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes + offset * 7);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
}

function fechaStr(date) {
    return date.toISOString().split('T')[0];
}

function cargarTurnos() {
    semanaOffset = 0;
    renderizarSemana();
    setTimeout(sincronizarTurnosDesdeFirebase, 1500);
}

function navegarSemana(dir) {
    semanaOffset = dir === 0 ? 0 : semanaOffset + dir;
    renderizarSemana();
}

function renderizarSemana() {
    const lunes = getLunesDeSemana(semanaOffset);
    const dias = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(lunes);
        d.setDate(lunes.getDate() + i);
        return d;
    });

    const titulo = document.getElementById('semana-titulo');
    if (titulo) {
        const ini = dias[0].toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
        const fin = dias[5].toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        titulo.textContent = `${ini} — ${fin}`;
    }

    const turnos = obtenerTurnos();
    const horas = [];
    for (let h = 15; h <= 19; h++) {
        horas.push(`${String(h).padStart(2, '0')}:00`);
        horas.push(`${String(h).padStart(2, '0')}:30`);
    }
    horas.push('20:00');

    const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const hoyStr = fechaStr(new Date());

    let html = '<div class="cal-grid">';

    // Encabezado
    html += '<div class="cal-corner"></div>';
    dias.forEach((d, i) => {
        const esHoy = fechaStr(d) === hoyStr;
        html += `<div class="cal-header-dia${esHoy ? ' cal-hoy' : ''}">
            <span class="cal-dia-nombre">${DIAS_CORTOS[i]}</span>
            <span class="cal-dia-num">${d.getDate()}</span>
        </div>`;
    });

    // Filas horarias
    horas.forEach(hora => {
        const esMediaHora = hora.endsWith(':30');
        html += `<div class="cal-hora-label${esMediaHora ? ' cal-media-hora' : ''}">${hora}</div>`;
        dias.forEach(d => {
            const fStr = fechaStr(d);
            const slot = turnos.filter(t => t.fecha === fStr && t.hora === hora);
            html += `<div class="cal-celda${esMediaHora ? ' cal-celda-media' : ''}" onclick="mostrarFormTurno('${fStr}','${hora}')">`;
            const ESTADO_LETRA = { pendiente:'P', confirmado:'C', cancelado:'X', reprogramado:'R', asistio:'A', noasistio:'NA' };
            slot.forEach(t => {
                const letra = ESTADO_LETRA[t.estado] || 'P';
                html += `<div class="cal-turno estado-${t.estado}" onclick="event.stopPropagation();verTurno('${t.id}')">
                    <span class="cal-turno-badge">${letra}</span> ${t.pacienteNombre}
                </div>`;
            });
            html += '</div>';
        });
    });

    html += '</div>';
    document.getElementById('calendario-semana').innerHTML = html;
}

function mostrarFormTurno(fecha = '', hora = '') {
    const horas = [];
    for (let h = 15; h <= 19; h++) {
        horas.push(`${String(h).padStart(2, '0')}:00`);
        horas.push(`${String(h).padStart(2, '0')}:30`);
    }
    horas.push('20:00');

    const horaOpts = horas.map(h =>
        `<option value="${h}"${h === hora ? ' selected' : ''}>${h}</option>`
    ).join('');

    document.getElementById('form-turno-container').innerHTML = `
        <div class="modal-overlay" onclick="cerrarFormTurno()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h3 style="margin-bottom:20px; color:#333;">Nuevo Turno</h3>
                <form onsubmit="guardarTurno(event)">
                    <div class="form-group">
                        <label>Nombre *</label>
                        <input type="text" id="turno-nombre" placeholder="Ej: Pepe Robledo" required autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Celular</label>
                        <input type="tel" id="turno-celular" placeholder="Ej: 11 1234-5678" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" id="turno-fecha" value="${fecha}" required>
                    </div>
                    <div class="form-group">
                        <label>Hora *</label>
                        <select id="turno-hora" required>${horaOpts}</select>
                    </div>
                    <div class="form-group">
                        <label>Duración</label>
                        <select id="turno-duracion">
                            <option value="30">30 minutos</option>
                            <option value="60" selected>1 hora</option>
                            <option value="90">1 hora 30 min</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Notas</label>
                        <textarea id="turno-notas" rows="2" placeholder="Tratamiento, observaciones..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="cerrarFormTurno()" class="btn btn-outline">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Turno</button>
                    </div>
                </form>
            </div>
        </div>`;

    setTimeout(() => document.getElementById('turno-nombre')?.focus(), 100);
}

function cerrarFormTurno() {
    document.getElementById('form-turno-container').innerHTML = '';
}

function guardarTurno(event) {
    event.preventDefault();
    const turno = {
        id: Date.now().toString(),
        pacienteNombre: document.getElementById('turno-nombre').value.trim(),
        celular: document.getElementById('turno-celular').value.trim(),
        fecha: document.getElementById('turno-fecha').value,
        hora: document.getElementById('turno-hora').value,
        duracion: parseInt(document.getElementById('turno-duracion').value),
        notas: document.getElementById('turno-notas').value.trim(),
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString()
    };
    const turnos = obtenerTurnos();
    turnos.push(turno);
    guardarTurnosStorage(turnos);
    if (typeof guardarTurnoEnFirestore === 'function') guardarTurnoEnFirestore(turno);
    cerrarFormTurno();
    renderizarSemana();
}

function verTurno(id) {
    const turno = obtenerTurnos().find(t => t.id === id);
    if (!turno) return;
    const fechaLegible = new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    document.getElementById('form-turno-container').innerHTML = `
        <div class="modal-overlay" onclick="cerrarFormTurno()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h3 style="margin-bottom:16px; color:#333;">${turno.pacienteNombre}</h3>
                <p style="margin-bottom:8px;">📅 <strong>${fechaLegible}</strong></p>
                <p style="margin-bottom:8px;">🕐 ${turno.hora} · ${turno.duracion} min</p>
                ${turno.celular ? `<p style="margin-bottom:8px;">📱 ${turno.celular}</p>` : ''}
                ${turno.notas ? `<p style="margin-bottom:12px;">📝 ${turno.notas}</p>` : ''}
                <div class="form-group" style="margin-top:16px;">
                    <label>Estado</label>
                    <select id="turno-estado-select" style="padding:8px; border-radius:6px; border:1px solid #ddd; font-size:14px; width:100%;">
                        <option value="pendiente"${turno.estado==='pendiente'?' selected':''}>🟡 P — Pendiente</option>
                        <option value="confirmado"${turno.estado==='confirmado'?' selected':''}>🔵 C — Confirmado</option>
                        <option value="cancelado"${turno.estado==='cancelado'?' selected':''}>🔴 X — Cancelado</option>
                        <option value="reprogramado"${turno.estado==='reprogramado'?' selected':''}>🟠 R — Reprogramado</option>
                        <option value="asistio"${turno.estado==='asistio'?' selected':''}>🟢 A — Asistió</option>
                        <option value="noasistio"${turno.estado==='noasistio'?' selected':''}>⚫ NA — No Asistió</option>
                    </select>
                </div>
                <div class="form-actions" style="margin-top:20px;">
                    <button onclick="eliminarTurno('${turno.id}')" class="btn btn-danger">Eliminar</button>
                    <button onclick="guardarEstadoTurno('${turno.id}')" class="btn btn-primary">Guardar</button>
                    <button onclick="cerrarFormTurno()" class="btn btn-outline">Cerrar</button>
                </div>
            </div>
        </div>`;
}

function guardarEstadoTurno(id) {
    const estado = document.getElementById('turno-estado-select')?.value;
    if (!estado) return;
    const turnos = obtenerTurnos();
    const t = turnos.find(t => t.id === id);
    if (t) {
        t.estado = estado;
        guardarTurnosStorage(turnos);
        if (typeof actualizarTurnoEnFirestore === 'function') actualizarTurnoEnFirestore(t);
        cerrarFormTurno();
        renderizarSemana();
    }
}

function eliminarTurno(id) {
    if (!confirm('¿Eliminar este turno?')) return;
    const turnos = obtenerTurnos();
    const t = turnos.find(t => t.id === id);
    guardarTurnosStorage(turnos.filter(t => t.id !== id));
    if (t?.firebaseId && typeof eliminarTurnoDeFirestore === 'function') eliminarTurnoDeFirestore(t.firebaseId);
    cerrarFormTurno();
    renderizarSemana();
}
