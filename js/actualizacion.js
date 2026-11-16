// ========== ACTUALIZACION AUTOMATICA ==========
//
// En el consultorio nadie va a apretar Ctrl+F5, y con razón: están atendiendo.
// El problema es real: una tablet que quedó con el código de hace dos semanas
// llegó a resucitar fichas que ya se habían borrado.
//
// Esto se fija sola si hay una versión nueva publicada y recarga la página,
// PERO solo cuando nadie está usando la app. Nunca en el medio de una carga:
// recargar mientras alguien escribe un turno sería peor que no actualizar.
//
// Cómo sabe la versión: el `?v=` que ya usan los archivos en index.html.
// No hay un segundo archivo que mantener al día, y por lo tanto tampoco uno
// que se pueda desincronizar.

const CADA_CUANTO_MIRA = 15 * 60 * 1000;   // cada 15 minutos
const REINTENTO_SI_OCUPADO = 60 * 1000;    // si está ocupada, vuelve a mirar en 1 min
const QUIETO_PARA_RECARGAR = 90 * 1000;    // 90 segundos sin tocar nada = está libre

let versionCargada = null;
let hayVersionNueva = false;
let ultimoMovimiento = Date.now();

['click', 'keydown', 'touchstart', 'input'].forEach(evento => {
    document.addEventListener(evento, () => { ultimoMovimiento = Date.now(); }, true);
});

function versionDeEstaPagina() {
    if (versionCargada) return versionCargada;
    const etiqueta = document.querySelector('script[src*="app.js"], link[href*="styles.css"]');
    const url = etiqueta ? (etiqueta.src || etiqueta.href) : '';
    versionCargada = (url.match(/[?&]v=([\d.]+)/) || [])[1] || null;
    return versionCargada;
}

async function versionPublicada() {
    // cache:no-store para preguntarle al servidor de verdad, no al caché
    const r = await fetch('index.html?mirando=' + Date.now(), { cache: 'no-store' });
    const html = await r.text();
    return (html.match(/[?&]v=([\d.]+)/) || [])[1] || null;
}

// ¿Se puede recargar sin interrumpir a nadie?
function laAppEstaLibre() {
    // Hay un modal abierto (turno, comprobante, recordatorios...)
    if (document.querySelector('.modal-overlay')) return false;

    // Están cargando o editando un paciente
    const form = document.getElementById('pagina-nuevo-paciente');
    if (form && form.style.display !== 'none') return false;

    // Hay algo escrito en algún campo sin guardar
    const conTexto = [...document.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], textarea')]
        .some(c => c.value && c.value.trim() && c.offsetParent !== null);
    if (conTexto) return false;

    // El chat abierto puede tener un mensaje a medio escribir
    const chat = document.getElementById('chat-panel');
    if (chat && chat.style.display !== 'none' && chat.offsetParent !== null) return false;

    // Y que haga un rato que nadie toca nada
    return (Date.now() - ultimoMovimiento) > QUIETO_PARA_RECARGAR;
}

function recargarAhora() {
    console.log('🔄 Hay una versión nueva: actualizando...');
    const aviso = document.createElement('div');
    aviso.className = 'aviso-actualizando';
    aviso.textContent = '🔄 Actualizando el sistema...';
    document.body.appendChild(aviso);
    // Un segundo para que se vea el cartel y no parezca que la pantalla parpadeó sola
    setTimeout(() => location.reload(), 1000);
}

async function mirarSiHayVersionNueva() {
    try {
        const aca = versionDeEstaPagina();
        const alla = await versionPublicada();
        if (aca && alla && aca !== alla) {
            hayVersionNueva = true;
            console.log(`🔄 Versión nueva disponible: ${aca} → ${alla}`);
        }
    } catch (e) {
        // Sin internet o GitHub caído: no pasa nada, se vuelve a mirar después
    }

    if (hayVersionNueva && laAppEstaLibre()) recargarAhora();
    else setTimeout(mirarSiHayVersionNueva, hayVersionNueva ? REINTENTO_SI_OCUPADO : CADA_CUANTO_MIRA);
}

// Al volver a la pestaña (prendieron la tablet, cambiaron de app) se mira enseguida
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && hayVersionNueva && laAppEstaLibre()) recargarAhora();
});

// Al recuperar internet, idem
window.addEventListener('online', () => { setTimeout(mirarSiHayVersionNueva, 3000); });

// La primera mirada, 30 segundos después de abrir: así un dispositivo que
// estuvo días prendido se pone al día sin esperar los 15 minutos
setTimeout(mirarSiHayVersionNueva, 30 * 1000);
