// ========== CHAT INTERNO ODONPEI ==========
// Chat grupal en tiempo real entre las estaciones del consultorio
// (secretaría, consultorios, tablets, celulares). Usa Firebase.

const ESTACION_KEY = 'ODONPEI_ESTACION';
const ESTACIONES_SUGERIDAS = ['Consultorio 1', 'Consultorio 2', 'Secretaría', 'Recepción'];

let chatIniciado   = false;
let chatEscuchando  = null;   // función para cortar el listener
let chatMensajes    = [];
let chatPanelAbierto = false;
let chatNoLeidos    = 0;
let chatUltimoTs    = 0;       // ts más alto conocido (para detectar mensajes nuevos)
let chatPrimeraCarga = true;
let chatAudioCtx    = null;

// ---------- Identidad de esta estación ----------
function getEstacion() {
    return localStorage.getItem(ESTACION_KEY) || '';
}
function setEstacion(nombre) {
    localStorage.setItem(ESTACION_KEY, nombre);
}

// ---------- Sonido (beep con WebAudio, sin archivos externos) ----------
function desbloquearAudio() {
    if (chatAudioCtx) return;
    try {
        chatAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (chatAudioCtx.state === 'suspended') chatAudioCtx.resume();
    } catch (e) { /* navegador sin soporte */ }
}
// Un blip corto y fuerte a una frecuencia dada
function chatBlip(t0, freq, dur) {
    const osc = chatAudioCtx.createOscillator();
    const gain = chatAudioCtx.createGain();
    osc.connect(gain); gain.connect(chatAudioCtx.destination);
    osc.type = 'square';                       // onda cuadrada = más penetrante
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.9, t0 + 0.01);   // volumen alto
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

// Sonido de alerta fuerte y repetido (estilo ICQ) — pensado para escucharse sobre la turbina
function beep() {
    if (!chatAudioCtx) return;
    try {
        if (chatAudioCtx.state === 'suspended') chatAudioCtx.resume();
        const t = chatAudioCtx.currentTime;
        // Patrón "uh-oh" repetido dos veces: nota grave + aguda
        const patron = [
            [0.00, 700, 0.10],
            [0.13, 1050, 0.14],
            [0.40, 700, 0.10],
            [0.53, 1050, 0.14]
        ];
        patron.forEach(([off, f, d]) => chatBlip(t + off, f, d));
    } catch (e) { /* ignorar */ }
}

// Aviso hablado (se escucha por encima del ruido) — dice quién mandó el mensaje
function hablar(texto) {
    try {
        if (!('speechSynthesis' in window) || !texto) return;
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = 'es-AR';
        u.rate = 1;
        u.pitch = 1;
        u.volume = 1;
        window.speechSynthesis.cancel();  // corta lo anterior si hay
        window.speechSynthesis.speak(u);
    } catch (e) { /* ignorar */ }
}

// Aviso completo: sonido fuerte + voz con el nombre de la estación
function chatNotificar(estacion) {
    beep();
    setTimeout(() => hablar('Mensaje nuevo' + (estacion ? ' de ' + estacion : '')), 500);
}

// ---------- Utilidades ----------
function chatEscapar(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
}
function chatHora(ts) {
    return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
function chatDiaLabel(ts) {
    const d = new Date(ts);
    const hoy = new Date();
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    const esMismoDia = (a, b) => a.toDateString() === b.toDateString();
    if (esMismoDia(d, hoy)) return 'Hoy';
    if (esMismoDia(d, ayer)) return 'Ayer';
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ---------- Estilos (inyectados una sola vez) ----------
function chatInyectarEstilos() {
    if (document.getElementById('chat-estilos')) return;
    const st = document.createElement('style');
    st.id = 'chat-estilos';
    st.textContent = `
    #chat-fab { position: fixed; bottom: 22px; right: 22px; width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(135deg, #4A90E2, #A8D8EA); color: #fff; border: none; cursor: pointer;
        box-shadow: 0 6px 18px rgba(0,0,0,0.28); font-size: 26px; z-index: 9998; display: flex;
        align-items: center; justify-content: center; transition: transform .15s; }
    #chat-fab:hover { transform: scale(1.07); }
    #chat-fab .chat-badge { position: absolute; top: -4px; right: -4px; background: #FF3B30; color: #fff;
        min-width: 22px; height: 22px; border-radius: 11px; font-size: 12px; font-weight: bold;
        display: none; align-items: center; justify-content: center; padding: 0 6px; border: 2px solid #fff; }
    #chat-panel { position: fixed; bottom: 92px; right: 22px; width: 350px; max-width: calc(100vw - 32px);
        height: 500px; max-height: calc(100vh - 130px); background: #fff; border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.3); z-index: 9999; display: none; flex-direction: column;
        overflow: hidden; }
    #chat-panel.abierto { display: flex; }
    .chat-header { background: linear-gradient(135deg, #4A90E2, #6AA9E9); color: #fff; padding: 12px 14px;
        display: flex; align-items: center; gap: 8px; }
    .chat-header .chat-titulo { font-weight: bold; font-size: 15px; flex: 1; line-height: 1.2; }
    .chat-header .chat-estacion-lbl { font-size: 11px; opacity: .9; font-weight: normal; display: block; }
    .chat-header button { background: rgba(255,255,255,0.2); border: none; color: #fff; cursor: pointer;
        width: 30px; height: 30px; border-radius: 8px; font-size: 15px; }
    .chat-header button:hover { background: rgba(255,255,255,0.35); }
    .chat-body { flex: 1; overflow-y: auto; padding: 12px; background: #F4F7FB; display: flex;
        flex-direction: column; gap: 6px; }
    .chat-dia { text-align: center; font-size: 11px; color: #888; margin: 8px 0 4px; }
    .chat-dia span { background: #E3E9F2; padding: 3px 10px; border-radius: 10px; }
    .chat-msg { max-width: 82%; padding: 7px 11px; border-radius: 14px; word-wrap: break-word;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
    .chat-msg .chat-quien { font-size: 11px; font-weight: bold; color: #4A90E2; margin-bottom: 2px; }
    .chat-msg .chat-texto { font-size: 14px; color: #222; white-space: pre-wrap; }
    .chat-msg .chat-pie { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 3px; }
    .chat-msg .chat-hora { font-size: 10px; color: #999; }
    .chat-msg .chat-del { background: none; border: none; color: #c0392b; cursor: pointer; font-size: 12px;
        opacity: .5; padding: 0; line-height: 1; }
    .chat-msg .chat-del:hover { opacity: 1; }
    .chat-msg-otro { align-self: flex-start; background: #fff; border-bottom-left-radius: 4px; }
    .chat-msg-mio  { align-self: flex-end; background: #DCF3D8; border-bottom-right-radius: 4px; }
    .chat-msg-mio .chat-del { color: #8aa886; }
    .chat-vacio { text-align: center; color: #999; font-size: 13px; margin: auto; padding: 20px; }
    .chat-input-row { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #E6EAF0; background: #fff; }
    .chat-input-row textarea { flex: 1; resize: none; border: 1px solid #D5DCE6; border-radius: 18px;
        padding: 9px 14px; font-size: 14px; font-family: inherit; max-height: 90px; outline: none; }
    .chat-input-row textarea:focus { border-color: #4A90E2; }
    .chat-input-row button { background: #4A90E2; color: #fff; border: none; width: 42px; height: 42px;
        border-radius: 50%; cursor: pointer; font-size: 18px; flex-shrink: 0; }
    .chat-input-row button:hover { background: #3a7bc8; }
    /* Modal de elegir estación */
    #chat-modal-estacion { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10000;
        display: flex; align-items: center; justify-content: center; padding: 20px; }
    #chat-modal-estacion .cme-box { background: #fff; border-radius: 16px; padding: 26px; max-width: 360px;
        width: 100%; text-align: center; }
    #chat-modal-estacion h3 { color: #333; margin-bottom: 6px; }
    #chat-modal-estacion p { color: #888; font-size: 13px; margin-bottom: 18px; }
    #chat-modal-estacion .cme-opts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    #chat-modal-estacion .cme-opts button { padding: 12px; border: 2px solid #A8D8EA; background: #F4FAFE;
        color: #2c6fb5; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; }
    #chat-modal-estacion .cme-opts button:hover { background: #A8D8EA; color: #fff; }
    #chat-modal-estacion .cme-otro { display: flex; gap: 8px; }
    #chat-modal-estacion .cme-otro input { flex: 1; padding: 10px; border: 1px solid #D5DCE6; border-radius: 10px; font-size: 14px; }
    #chat-modal-estacion .cme-otro button { padding: 10px 14px; background: #4CAF50; color: #fff; border: none; border-radius: 10px; cursor: pointer; }
    @media (max-width: 480px) {
        #chat-panel { width: calc(100vw - 24px); right: 12px; bottom: 84px; height: calc(100vh - 110px); }
        #chat-fab { bottom: 16px; right: 16px; }
    }`;
    document.head.appendChild(st);
}

// ---------- Construcción del panel ----------
function chatConstruirUI() {
    if (document.getElementById('chat-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'chat-fab';
    fab.title = 'Chat interno';
    fab.innerHTML = `💬<span class="chat-badge" id="chat-badge">0</span>`;
    fab.onclick = chatToggle;
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'chat-panel';
    panel.innerHTML = `
        <div class="chat-header">
            <div class="chat-titulo">💬 Chat interno
                <span class="chat-estacion-lbl" id="chat-estacion-lbl"></span>
            </div>
            <button id="chat-btn-estacion" title="Cambiar estación">✎</button>
            <button id="chat-btn-vaciar" title="Vaciar chat">🗑️</button>
            <button id="chat-btn-cerrar" title="Cerrar">✕</button>
        </div>
        <div class="chat-body" id="chat-body"></div>
        <div class="chat-input-row">
            <textarea id="chat-input" rows="1" placeholder="Escribí un mensaje..."></textarea>
            <button id="chat-btn-enviar" title="Enviar">➤</button>
        </div>`;
    document.body.appendChild(panel);

    document.getElementById('chat-btn-cerrar').onclick   = chatToggle;
    document.getElementById('chat-btn-vaciar').onclick   = chatVaciar;
    document.getElementById('chat-btn-estacion').onclick = () => chatPedirEstacion(true);
    document.getElementById('chat-btn-enviar').onclick   = chatEnviar;

    const input = document.getElementById('chat-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatEnviar(); }
    });
}

// ---------- Elegir / cambiar estación ----------
function chatPedirEstacion(esCambio = false) {
    if (document.getElementById('chat-modal-estacion')) return;
    const overlay = document.createElement('div');
    overlay.id = 'chat-modal-estacion';
    const actual = getEstacion();
    overlay.innerHTML = `
        <div class="cme-box">
            <h3>${esCambio ? 'Cambiar estación' : '¿Desde dónde escribís?'}</h3>
            <p>Se muestra junto a cada mensaje que envíes.${actual ? '<br>Actual: <strong>' + chatEscapar(actual) + '</strong>' : ''}</p>
            <div class="cme-opts">
                ${ESTACIONES_SUGERIDAS.map(e => `<button data-est="${chatEscapar(e)}">${chatEscapar(e)}</button>`).join('')}
            </div>
            <div class="cme-otro">
                <input type="text" id="cme-otro-input" placeholder="Otro nombre..." maxlength="24" value="${esCambio ? chatEscapar(actual) : ''}">
                <button id="cme-otro-ok">OK</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.cme-opts button').forEach(b => {
        b.onclick = () => { chatConfirmarEstacion(b.getAttribute('data-est')); };
    });
    const okBtn = overlay.querySelector('#cme-otro-ok');
    const inp = overlay.querySelector('#cme-otro-input');
    okBtn.onclick = () => {
        const v = inp.value.trim();
        if (v) chatConfirmarEstacion(v);
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') okBtn.click(); });
    // Si es cambio permitido cerrar tocando afuera
    if (esCambio) overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    setTimeout(() => inp.focus(), 100);
}
function chatConfirmarEstacion(nombre) {
    setEstacion(nombre);
    const m = document.getElementById('chat-modal-estacion');
    if (m) m.remove();
    chatActualizarEtiquetaEstacion();
    chatRenderizar();
}
function chatActualizarEtiquetaEstacion() {
    const lbl = document.getElementById('chat-estacion-lbl');
    if (lbl) lbl.textContent = getEstacion() ? '— ' + getEstacion() : '';
}

// ---------- Abrir / cerrar ----------
// pedirEstacion: si no hay estación elegida, mostrar el modal (solo al abrir a mano)
// foco: poner el cursor en el input (evitamos hacerlo al abrir automático para no
//       levantar el teclado en pantalla en tablets/celulares)
function chatAbrir(pedirEstacion = true, foco = true) {
    desbloquearAudio();
    chatPanelAbierto = true;
    const panel = document.getElementById('chat-panel');
    if (panel) panel.classList.add('abierto');
    if (pedirEstacion && !getEstacion()) chatPedirEstacion(false);
    chatNoLeidos = 0;
    chatActualizarBadge();
    chatRenderizar();
    chatScrollAbajo();
    if (foco) setTimeout(() => document.getElementById('chat-input')?.focus(), 120);
}
function chatCerrar() {
    chatPanelAbierto = false;
    const panel = document.getElementById('chat-panel');
    if (panel) panel.classList.remove('abierto');
}
function chatToggle() {
    if (chatPanelAbierto) chatCerrar();
    else chatAbrir(true, true);
}

// ---------- Enviar ----------
function chatEnviar() {
    desbloquearAudio();
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto) return;
    if (!getEstacion()) { chatPedirEstacion(false); return; }
    const msg = {
        texto: texto,
        estacion: getEstacion(),
        ts: Date.now(),
        fecha: new Date().toISOString()
    };
    input.value = '';
    input.focus();
    if (typeof enviarMensajeFirestore === 'function') {
        enviarMensajeFirestore(msg).then((ok) => {
            if (!ok) alert('No se pudo enviar el mensaje. Revisá la conexión a internet.');
        });
    }
}

// ---------- Borrar ----------
function chatEliminarMensaje(firebaseId) {
    if (!firebaseId) return;
    if (!confirm('¿Borrar este mensaje para todos?')) return;
    if (typeof eliminarMensajeFirestore === 'function') eliminarMensajeFirestore(firebaseId);
}
function chatVaciar() {
    if (!confirm('¿Vaciar TODO el chat? Se borra en todas las pantallas y no se puede deshacer.')) return;
    if (typeof vaciarChatFirestore === 'function') vaciarChatFirestore();
}

// ---------- Render ----------
function chatRenderizar() {
    const body = document.getElementById('chat-body');
    if (!body) return;
    const mi = getEstacion();
    if (chatMensajes.length === 0) {
        body.innerHTML = `<div class="chat-vacio">Todavía no hay mensajes.<br>Escribí el primero 👇</div>`;
        return;
    }
    let html = '';
    let ultimoDia = '';
    chatMensajes.forEach(m => {
        const dia = chatDiaLabel(m.ts);
        if (dia !== ultimoDia) { html += `<div class="chat-dia"><span>${chatEscapar(dia)}</span></div>`; ultimoDia = dia; }
        const mio = m.estacion === mi;
        html += `
            <div class="chat-msg ${mio ? 'chat-msg-mio' : 'chat-msg-otro'}">
                ${!mio ? `<div class="chat-quien">${chatEscapar(m.estacion)}</div>` : ''}
                <div class="chat-texto">${chatEscapar(m.texto)}</div>
                <div class="chat-pie">
                    <button class="chat-del" title="Borrar" onclick="chatEliminarMensaje('${m.firebaseId}')">🗑</button>
                    <span class="chat-hora">${chatHora(m.ts)}</span>
                </div>
            </div>`;
    });
    body.innerHTML = html;
}
function chatScrollAbajo() {
    const body = document.getElementById('chat-body');
    if (body) body.scrollTop = body.scrollHeight;
}
function chatActualizarBadge() {
    const badge = document.getElementById('chat-badge');
    if (!badge) return;
    if (chatNoLeidos > 0) {
        badge.textContent = chatNoLeidos > 99 ? '99+' : chatNoLeidos;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ---------- Recepción en tiempo real ----------
function chatOnSnapshot(mensajes) {
    const mi = getEstacion();
    const tsPrevio = chatUltimoTs;
    const nuevosAjenos = mensajes.filter(m => (m.ts || 0) > tsPrevio && m.estacion !== mi);

    chatMensajes = mensajes;
    chatUltimoTs = mensajes.reduce((mx, m) => Math.max(mx, m.ts || 0), chatUltimoTs);

    if (!chatPrimeraCarga && nuevosAjenos.length > 0) {
        // Avisar con sonido fuerte + voz, nombrando la estación del último mensaje nuevo
        const ultimo = nuevosAjenos[nuevosAjenos.length - 1];
        chatNotificar(ultimo ? ultimo.estacion : '');
        // Abrir el chat solo en las estaciones donde esté cerrado (sin levantar el teclado)
        if (!chatPanelAbierto) chatAbrir(false, false);
    }
    chatPrimeraCarga = false;

    if (chatPanelAbierto) {
        chatNoLeidos = 0;
        chatActualizarBadge();
        chatRenderizar();
        chatScrollAbajo();
    }
}

// ---------- Init / cerrar ----------
function initChat() {
    if (chatIniciado) { chatMostrar(); return; }
    chatIniciado = true;
    chatInyectarEstilos();
    chatConstruirUI();
    chatActualizarEtiquetaEstacion();
    chatPrimeraCarga = true;

    // Desbloquear el audio con la primera interacción del usuario
    const unlock = () => { desbloquearAudio(); document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);

    if (typeof escucharChatEnTiempoReal === 'function') {
        if (chatEscuchando) chatEscuchando();
        chatEscuchando = escucharChatEnTiempoReal(chatOnSnapshot);
    }
    chatMostrar();
}
function chatMostrar() {
    const fab = document.getElementById('chat-fab');
    if (fab) fab.style.display = 'flex';
}
function chatOcultar() {
    const fab = document.getElementById('chat-fab');
    const panel = document.getElementById('chat-panel');
    if (fab) fab.style.display = 'none';
    if (panel) { panel.classList.remove('abierto'); chatPanelAbierto = false; }
}

// Exponer al scope global (para onclick y llamadas desde app.js)
window.initChat = initChat;
window.chatOcultar = chatOcultar;
window.chatEliminarMensaje = chatEliminarMensaje;
