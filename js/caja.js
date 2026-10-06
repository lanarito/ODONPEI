// ========== CAJA — COMPROBANTES DE PAGO ==========
//
// NO es una factura. Es un comprobante interno del consultorio: si el paciente
// necesita factura, la Dra. la emite aparte.
//
// La pantalla está pensada para que la administrativa haga lo mínimo:
// toca el nombre (sale de los turnos del día), escribe el monto, toca la forma
// de pago e imprime. Todo lo demás se completa solo.
//
// Los pagos SÍ se guardan (colección `pagos` en Firebase), pero eso es invisible
// para ella. Sirve para dos cosas: ver el total cobrado del día y poder
// reimprimir un comprobante si se traspapela el papel.

const PAGOS_KEY = 'ODONPEI_PAGOS';

const DATOS_CONSULTORIO = {
    nombre: 'ODONPEI',
    profesional: 'Dra. María Luján Díaz',
    direccion: 'Laprida 772',
    telefono: '+54 9 2966 67-3798'
};

// El ícono va dibujado en el propio comprobante (SVG) y no como imagen aparte:
// así se imprime siempre, aunque la impresora no tenga internet o la máquina
// esté sin conexión.
const ICONO_WHATSAPP = `<svg viewBox="0 0 24 24" class="icono-wsp" aria-hidden="true"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

const FORMAS_PAGO = ['Efectivo', 'Transferencia', 'Débito', 'Mercado Pago'];
const CONCEPTO_DEFAULT = 'TRATAMIENTO ODONTOLÓGICO';

let cajaFormaPago = 'Efectivo';
let cajaListenerActivo = false;

// ---------- Guardado ----------
function obtenerPagos() {
    return JSON.parse(localStorage.getItem(PAGOS_KEY) || '[]');
}

function guardarPagosStorage(pagos) {
    try {
        localStorage.setItem(PAGOS_KEY, JSON.stringify(pagos));
    } catch (e) {
        console.warn('No se pudo guardar la copia local de pagos:', e);
    }
}

function cargarCaja() {
    cajaFormaPago = 'Efectivo';
    renderizarCaja();

    setTimeout(async () => {
        if (typeof obtenerPagosDesdeFirestore === 'function') {
            try {
                const remotos = await obtenerPagosDesdeFirestore();
                const idsRemotos = new Set(remotos.map(p => p.id));
                // Subir solo los que se emitieron sin conexión y nunca llegaron
                const nuevos = obtenerPagos().filter(p => !p.firebaseId && !idsRemotos.has(p.id));
                for (const p of nuevos) await guardarPagoEnFirestore(p);
                const finales = nuevos.length ? await obtenerPagosDesdeFirestore() : remotos;
                guardarPagosStorage(finales);
                renderizarCaja();
            } catch (e) { console.warn('Carga pagos:', e); }
        }

        if (!cajaListenerActivo && typeof sincronizarPagosEnTiempoReal === 'function') {
            cajaListenerActivo = true;
            sincronizarPagosEnTiempoReal((remotos) => {
                guardarPagosStorage(remotos);
                renderizarCaja();
            });
        }
    }, 800);
}

// ---------- Número del comprobante ----------
// Formato 06102026-01: fecha + el número que va ese día. No es numeración
// fiscal, solo sirve para identificar el papel.
function proximoNumero(fecha) {
    const delDia = obtenerPagos().filter(p => p.fecha === fecha).length;
    const [a, m, d] = fecha.split('-');
    return `${d}${m}${a}-${String(delDia + 1).padStart(2, '0')}`;
}

// ---------- Monto en letras ----------
// Un recibo con el monto escrito en letras no se puede adulterar con una lapicera
const NUM_UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho',
    'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const NUM_DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const NUM_CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function menorQueMil(n) {
    if (n === 0) return '';
    if (n === 100) return 'cien';
    const c = Math.floor(n / 100), r = n % 100;
    let texto = c ? NUM_CENTENAS[c] : '';
    if (r) {
        if (texto) texto += ' ';
        if (r < 30) texto += NUM_UNIDADES[r];
        else {
            const d = Math.floor(r / 10), u = r % 10;
            texto += NUM_DECENAS[d] + (u ? ' y ' + NUM_UNIDADES[u] : '');
        }
    }
    return texto;
}

// "uno" se apocopa cuando va delante de un sustantivo: un peso, veintiún mil,
// treinta y un mil. Ojo con la tilde: "veintiún" la lleva, "treinta y un" no.
function apocopar(texto) {
    if (texto.endsWith('veintiuno')) return texto.slice(0, -'veintiuno'.length) + 'veintiún';
    if (texto.endsWith('uno'))       return texto.slice(0, -'uno'.length) + 'un';
    return texto;
}

function numeroATexto(n) {
    n = Math.floor(Math.abs(n));
    if (n === 0) return 'cero';

    const millones = Math.floor(n / 1000000);
    const miles = Math.floor((n % 1000000) / 1000);
    const resto = n % 1000;
    const partes = [];

    if (millones) partes.push(millones === 1 ? 'un millón' : apocopar(menorQueMil(millones)) + ' millones');
    if (miles)    partes.push(miles === 1 ? 'mil' : apocopar(menorQueMil(miles)) + ' mil');
    if (resto)    partes.push(menorQueMil(resto));

    return partes.join(' ');
}

function montoEnLetras(monto) {
    const entero = Math.floor(monto);
    const centavos = Math.round((monto - entero) * 100);

    // "un millón DE pesos", pero "dos millones quinientos mil pesos" (sin "de",
    // porque el millón no es lo último que se dice)
    const millonRedondo = entero >= 1000000 && entero % 1000000 === 0;
    const sustantivo = (millonRedondo ? ' de ' : ' ') + (entero === 1 ? 'peso' : 'pesos');

    let texto = apocopar(numeroATexto(entero)) + sustantivo;
    if (centavos > 0) texto += ` con ${String(centavos).padStart(2, '0')}/100`;
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearMonto(monto) {
    return '$ ' + Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ---------- Quién ya pagó hoy ----------
// Se compara por nombre, sin importar mayúsculas ni espacios de más, porque el
// turno puede decir "MELANO ALFONSO" y el comprobante "Melano Alfonso".
function nombreNormalizado(nombre) {
    return String(nombre || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function pagosDeHoyDe(nombre) {
    const hoy = fechaStr(new Date());
    const buscado = nombreNormalizado(nombre);
    if (!buscado) return [];
    return obtenerPagos().filter(p => p.fecha === hoy && nombreNormalizado(p.nombre) === buscado);
}

// ---------- Pantalla ----------
function seleccionarPacienteCaja(nombre) {
    const input = document.getElementById('caja-nombre');
    if (input) input.value = nombre;
    document.querySelectorAll('.caja-turno-btn').forEach(b => b.classList.remove('activo'));
    const btn = [...document.querySelectorAll('.caja-turno-btn')].find(b => b.dataset.nombre === nombre);
    if (btn) btn.classList.add('activo');
    document.getElementById('caja-monto')?.focus();
}

function seleccionarFormaPago(forma) {
    cajaFormaPago = forma;
    document.querySelectorAll('.caja-pago-btn').forEach(b => {
        b.classList.toggle('activo', b.dataset.forma === forma);
    });
}

function renderizarCaja() {
    const cont = document.getElementById('caja-contenido');
    if (!cont) return;

    const hoy = fechaStr(new Date());
    const fechaLegible = new Date().toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Los turnos de hoy, para no tener que escribir el nombre
    const turnosHoy = (typeof obtenerTurnos === 'function' ? obtenerTurnos() : [])
        .filter(t => t.fecha === hoy && t.estado !== 'cancelado')
        .sort((a, b) => a.hora.localeCompare(b.hora));

    const botonesTurnos = turnosHoy.length
        ? turnosHoy.map(t => {
            // Si ya se le cobró hoy, el botón queda marcado con el ✓ y lo cobrado
            const cobrados = pagosDeHoyDe(t.pacienteNombre);
            const totalCobrado = cobrados.reduce((s, p) => s + Number(p.monto || 0), 0);
            return `
            <button class="caja-turno-btn${cobrados.length ? ' pagado' : ''}" data-nombre="${t.pacienteNombre}"
                    onclick="seleccionarPacienteCaja('${String(t.pacienteNombre).replace(/'/g, "\\'")}')">
                <span class="caja-turno-nombre">${t.pacienteNombre}</span>
                <span class="caja-turno-pie">
                    <span class="caja-turno-hora">${t.hora}</span>
                    ${cobrados.length ? `<span class="caja-turno-pagado">✓ ${formatearMonto(totalCobrado)}</span>` : ''}
                </span>
            </button>`;
        }).join('')
        : `<div class="caja-sin-turnos">No hay turnos cargados para hoy. Escribí el nombre abajo.</div>`;

    // Lo cobrado hoy
    const pagosHoy = obtenerPagos().filter(p => p.fecha === hoy)
        .sort((a, b) => (b.hora || '').localeCompare(a.hora || ''));
    const totalHoy = pagosHoy.reduce((s, p) => s + Number(p.monto || 0), 0);

    const listaHoy = pagosHoy.length ? `
        <div class="caja-cobrado">
            <div class="caja-cobrado-header">
                <span>Cobrado hoy</span>
                <span class="caja-total">${formatearMonto(totalHoy)}</span>
            </div>
            ${pagosHoy.map(p => `
                <div class="caja-pago-fila">
                    <span class="caja-pago-num">${p.numero}</span>
                    <span class="caja-pago-nombre">${p.nombre}</span>
                    <span class="caja-pago-forma">${p.formaPago}</span>
                    <span class="caja-pago-monto">${formatearMonto(p.monto)}</span>
                    <button class="caja-link" onclick="reimprimirPago('${p.id}')" title="Volver a imprimir">🖨️</button>
                    <button class="caja-link caja-link-borrar" onclick="anularPago('${p.id}')" title="Anular">✕</button>
                </div>`).join('')}
        </div>` : '';

    cont.innerHTML = `
        <div class="caja-fecha">${fechaLegible}</div>

        <div class="caja-paso">
            <div class="caja-paso-titulo"><span class="caja-paso-num">1</span> ¿A quién le cobrás?</div>
            <div class="caja-turnos">${botonesTurnos}</div>
            <input type="text" id="caja-nombre" class="caja-input" placeholder="Nombre y apellido" autocomplete="off">
        </div>

        <div class="caja-paso">
            <div class="caja-paso-titulo"><span class="caja-paso-num">2</span> ¿Cuánto pagó?</div>
            <div class="caja-monto-wrap">
                <span class="caja-signo">$</span>
                <input type="number" id="caja-monto" class="caja-input caja-input-monto"
                       placeholder="0" min="0" step="any" autocomplete="off"
                       oninput="mostrarMontoEnLetras()">
            </div>
            <div id="caja-monto-letras" class="caja-monto-letras"></div>
        </div>

        <div class="caja-paso">
            <div class="caja-paso-titulo"><span class="caja-paso-num">3</span> ¿Cómo pagó?</div>
            <div class="caja-pagos">
                ${FORMAS_PAGO.map(f => `
                    <button class="caja-pago-btn${f === cajaFormaPago ? ' activo' : ''}" data-forma="${f}"
                            onclick="seleccionarFormaPago('${f}')">${f}</button>`).join('')}
            </div>
        </div>

        <div class="caja-paso caja-paso-concepto">
            <label class="caja-concepto-label">Concepto (se puede dejar así)</label>
            <input type="text" id="caja-concepto" class="caja-input" value="${CONCEPTO_DEFAULT}" autocomplete="off">
        </div>

        <button class="caja-imprimir" onclick="emitirComprobante()">🖨️ IMPRIMIR COMPROBANTE</button>

        ${listaHoy}`;
}

function mostrarMontoEnLetras() {
    const el = document.getElementById('caja-monto-letras');
    if (!el) return;
    const monto = parseFloat(document.getElementById('caja-monto')?.value);
    el.textContent = (monto > 0) ? montoEnLetras(monto) : '';
}

// ---------- Emitir ----------
function emitirComprobante() {
    const nombre = aMayusculas(document.getElementById('caja-nombre')?.value.trim());
    const monto = parseFloat(document.getElementById('caja-monto')?.value);
    const concepto = aMayusculas(document.getElementById('caja-concepto')?.value.trim()) || CONCEPTO_DEFAULT;

    if (!nombre) {
        alert('Falta el nombre del paciente.');
        document.getElementById('caja-nombre')?.focus();
        return;
    }
    if (!monto || monto <= 0) {
        alert('Falta el monto, o no es un número válido.');
        document.getElementById('caja-monto')?.focus();
        return;
    }

    // Aviso por si se le está cobrando dos veces a la misma persona en el día.
    // No se bloquea: puede ser legítimo (dos tratamientos, dos hijos del mismo
    // apellido), pero conviene que lo confirme.
    const previos = pagosDeHoyDe(nombre);
    if (previos.length) {
        const yaCobrado = previos.reduce((s, p) => s + Number(p.monto || 0), 0);
        const detalle = previos.map(p => `   ${p.numero}  ${formatearMonto(p.monto)}  ${p.formaPago}`).join('\n');
        if (!confirm(
            `A ${nombre} ya se le cobró hoy ${formatearMonto(yaCobrado)}:\n\n${detalle}\n\n` +
            `¿Querés cobrarle ${formatearMonto(monto)} de nuevo?`
        )) return;
    }

    const ahora = new Date();
    const fecha = fechaStr(ahora);
    const pago = {
        id: Date.now().toString(),
        numero: proximoNumero(fecha),
        fecha: fecha,
        hora: ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        nombre: nombre,
        monto: monto,
        formaPago: cajaFormaPago,
        concepto: concepto,
        fechaCreacion: ahora.toISOString()
    };

    // Primero se imprime: si falla el guardado, el papel igual salió
    imprimirComprobante(pago);

    const pagos = obtenerPagos();
    pagos.push(pago);
    guardarPagosStorage(pagos);
    if (typeof guardarPagoEnFirestore === 'function') {
        guardarPagoEnFirestore(pago).catch(e => console.warn('Guardando pago:', e));
    }

    // Dejar la pantalla lista para el próximo cobro
    renderizarCaja();
}

function reimprimirPago(id) {
    const pago = obtenerPagos().find(p => p.id === id);
    if (pago) imprimirComprobante(pago);
}

function anularPago(id) {
    const pago = obtenerPagos().find(p => p.id === id);
    if (!pago) return;
    if (!confirm(`¿Anular el comprobante ${pago.numero} de ${pago.nombre} por ${formatearMonto(pago.monto)}?\n\nSe borra de la lista del día.`)) return;

    guardarPagosStorage(obtenerPagos().filter(p => p.id !== id));
    if (typeof eliminarPagoDeFirestore === 'function') {
        eliminarPagoDeFirestore(pago.firebaseId || pago.id).catch(e => console.warn('Anulando pago:', e));
    }
    renderizarCaja();
}

// ---------- Impresión: dos copias en una hoja ----------
function imprimirComprobante(pago) {
    const ventana = window.open('', '', 'width=900,height=800');
    ventana.document.write(generarHTMLComprobante(pago));
    ventana.document.close();
    setTimeout(() => ventana.print(), 300);
}

function unaCopia(pago, etiqueta) {
    const fechaLegible = new Date(pago.fecha + 'T12:00:00').toLocaleDateString('es-AR');
    return `
        <div class="comprobante">
            <div class="watermark"></div>
            <div class="cuerpo">
                <div class="logo-top">
                    <img src="${new URL('ODONPEI 2.png', window.location.href).href}"
                         alt="${DATOS_CONSULTORIO.nombre}" class="logo">
                </div>

                <div class="encabezado">
                    <div class="datos-prof">
                        <div class="profesional">${DATOS_CONSULTORIO.profesional}</div>
                        <div class="dato">${DATOS_CONSULTORIO.direccion}</div>
                        <div class="dato telefono-wsp">${ICONO_WHATSAPP}${DATOS_CONSULTORIO.telefono}</div>
                    </div>
                    <div class="recuadro">
                        <div class="titulo">Comprobante de pago</div>
                        <div class="numero">N° ${pago.numero}</div>
                        <div class="dato">Fecha: ${fechaLegible}</div>
                        <div class="sin-valor-fiscal">Documento no válido como factura</div>
                    </div>
                </div>

                <table class="datos">
                    <tr>
                        <td class="etiqueta">Recibí de</td>
                        <td class="valor fuerte" colspan="3">${pago.nombre}</td>
                    </tr>
                    <tr>
                        <td class="etiqueta">La suma de</td>
                        <td class="valor" colspan="3">
                            <span class="monto">${formatearMonto(pago.monto)}</span>
                            <span class="letras">(${montoEnLetras(pago.monto)})</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="etiqueta">En concepto de</td>
                        <td class="valor">${pago.concepto}</td>
                        <td class="etiqueta etiqueta-der">Forma de pago</td>
                        <td class="valor">${pago.formaPago}</td>
                    </tr>
                </table>

                <div class="pie">
                    <div class="etiqueta-copia">${etiqueta}</div>
                </div>
            </div>
        </div>`;
}

function generarHTMLComprobante(pago) {
    const muelaUrl = new URL('Muela.png', window.location.href).href;
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Comprobante ${pago.numero} - ${pago.nombre}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #333; background: #f5f5f5; }

    .hoja { max-width: 190mm; margin: 0 auto; }

    .comprobante {
        background: white;
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 7mm 9mm;
        height: 125mm;
        position: relative;
        overflow: hidden;
    }
    .watermark {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 260px; height: 260px;
        background-image: url('${muelaUrl}');
        background-size: contain; background-repeat: no-repeat; background-position: center;
        opacity: 0.07; pointer-events: none;
    }
    .cuerpo { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }

    /* El logo ya es la marca (dice ODONPEI y Odontología Pediátrica Inclusiva),
       así que va solo, centrado y a lo ancho. No hace falta repetir el nombre
       al lado: era justamente lo que lo hacía ver chico y apretado. */
    .logo-top { text-align: center; margin-bottom: 3mm; }
    .logo { width: 95mm; height: auto; max-width: 100%; }

    .encabezado {
        display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm;
        border-top: 3px solid #A8D8EA;
        border-bottom: 3px solid #A8D8EA;
        padding: 3mm 0; margin-bottom: 5mm;
    }
    .datos-prof { text-align: left; }
    .profesional { font-size: 15px; font-weight: bold; color: #333; margin-bottom: 1mm; }
    .dato { font-size: 12px; color: #666; line-height: 1.6; }

    /* El celular con el dibujito de WhatsApp al lado */
    .telefono-wsp { display: flex; align-items: center; gap: 1.5mm; }
    .icono-wsp { width: 13px; height: 13px; flex-shrink: 0; }

    .recuadro { text-align: right; border: 2px solid #A8D8EA; border-radius: 6px; padding: 3mm 5mm; }
    .titulo { font-size: 14px; font-weight: bold; color: #4A90E2; text-transform: uppercase; }
    .numero { font-size: 16px; font-weight: bold; color: #333; margin: 1mm 0; }
    .sin-valor-fiscal { font-size: 9px; color: #999; font-style: italic; margin-top: 1mm; }

    .datos { width: 100%; border-collapse: collapse; }
    .datos td { padding: 3mm 0; vertical-align: middle; border-bottom: 1px dotted #ddd; }
    .datos tr:last-child td { border-bottom: none; }
    .etiqueta { width: 34mm; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .etiqueta-der { width: 30mm; padding-left: 6mm !important; }
    .valor { font-size: 14px; }
    .fuerte { font-weight: bold; font-size: 17px; }
    .monto { font-weight: bold; font-size: 23px; color: #2E7D32; margin-right: 3mm; }
    .letras { font-size: 11.5px; color: #666; font-style: italic; }

    .pie { margin-top: auto; display: flex; justify-content: flex-end; align-items: flex-end; }
    .etiqueta-copia {
        font-size: 12px; font-weight: bold; color: #4A90E2;
        border: 1px solid #A8D8EA; border-radius: 4px; padding: 1.5mm 4mm;
    }

    .corte {
        border-top: 2px dashed #bbb;
        text-align: center; font-size: 9px; color: #aaa;
        margin: 2.5mm 0 0; padding-top: 0.5mm; line-height: 1.2;
    }

    @media print {
        html, body { background: white; margin: 0; padding: 0; }
        .hoja { max-width: none; width: 100%; }
        /* Que no se parta una copia ni se vaya a la hoja siguiente */
        .hoja, .comprobante { page-break-inside: avoid; break-inside: avoid; }
        .comprobante { border: none; border-radius: 0; }
    }
</style>
</head>
<body>
    <div class="hoja">
        ${unaCopia(pago, 'ORIGINAL — Paciente')}
        <div class="corte">✂ — — — — — — — — — — — —  cortar por aquí  — — — — — — — — — — — —</div>
        ${unaCopia(pago, 'DUPLICADO — Consultorio')}
    </div>
</body>
</html>`;
}
