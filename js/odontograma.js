// ========== ODONTOGRAMA INTERACTIVO ==========

const colorRojo = '#FF6B6B';
const colorAzul = '#4A90E2';
const colorBlanco = '#FFFFFF';
const colorBorde = '#333333';

let colorSeleccionado = 'rojo'; // Color a usar al hacer clic

const estructura = {
    superior_derecha: [18, 17, 16, 15, 14, 13, 12, 11],
    superior_izquierda: [21, 22, 23, 24, 25, 26, 27, 28],
    inferior_derecha: [48, 47, 46, 45, 44, 43, 42, 41],
    inferior_izquierda: [31, 32, 33, 34, 35, 36, 37, 38],
    temporal_superior_derecha: [55, 54, 53, 52, 51],
    temporal_superior_izquierda: [61, 62, 63, 64, 65],
    temporal_inferior_derecha: [85, 84, 83, 82, 81],
    temporal_inferior_izquierda: [71, 72, 73, 74, 75]
};

function dibujarOdontograma(canvas, datosOdontograma = {}) {
    try {
        if (!canvas) {
            console.error('Canvas no existe');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('No hay contexto 2D');
            return;
        }

        canvas.datosOdontograma = datosOdontograma;
        canvas.datosZonas = canvas.datosZonas || [];

        const w = canvas.width || 1200;
        const h = canvas.height || 900;

        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);

        let y = 30;

        // Selector de color
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('ODONTOGRAMA - Elige color y haz clic en cada zona', w / 2, y);
        y += 25;

        // Mostrar color seleccionado
        const colorMostrar = colorSeleccionado === 'rojo' ? '🔴' : '🔵';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`Color actual: ${colorMostrar} ${colorSeleccionado.toUpperCase()}`, w / 2, y);
        y += 20;

        // Temporales Superiores
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#555';
        ctx.fillText('Dientes Temporales Superiores', w / 2, y);
        y += 18;
        dibujarFilaDientes(ctx, canvas, y, [...estructura.temporal_superior_derecha.reverse(), ...estructura.temporal_superior_izquierda], datosOdontograma);
        y += 90;

        // Permanentes Superiores
        ctx.fillText('Dientes Permanentes Superiores', w / 2, y);
        y += 18;
        dibujarFilaDientes(ctx, canvas, y, [...estructura.superior_derecha.reverse(), ...estructura.superior_izquierda], datosOdontograma);
        y += 90;

        // Línea
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(w - 30, y);
        ctx.stroke();
        y += 25;

        // Permanentes Inferiores
        ctx.fillText('Dientes Permanentes Inferiores', w / 2, y);
        y += 18;
        dibujarFilaDientes(ctx, canvas, y, [...estructura.inferior_izquierda.reverse(), ...estructura.inferior_derecha], datosOdontograma);
        y += 90;

        // Temporales Inferiores
        ctx.fillText('Dientes Temporales Inferiores', w / 2, y);
        y += 18;
        dibujarFilaDientes(ctx, canvas, y, [...estructura.temporal_inferior_izquierda.reverse(), ...estructura.temporal_inferior_derecha], datosOdontograma);

    } catch(e) {
        console.error('Error dibujarOdontograma:', e);
    }
}

function dibujarFilaDientes(ctx, canvas, y, dientes, datosOdontograma) {
    const w = canvas.width || 1200;
    const tamDiente = 60;
    const espaciado = 4;

    const totalAncho = dientes.length * tamDiente + (dientes.length - 1) * espaciado;
    let x = (w - totalAncho) / 2;

    dientes.forEach(num => {
        dibujarDiente(ctx, canvas, x, y, num, datosOdontograma);
        x += tamDiente + espaciado;
    });
}

function dibujarDiente(ctx, canvas, x, y, numero, datosOdontograma) {
    const SIZE = 55;  // Tamaño total del diente
    const TERCIO = SIZE / 3;

    const dato = datosOdontograma[numero] || {
        centro: null, norte: null, sur: null, este: null, oeste: null
    };

    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 2;

    // DIBUJAR COMO CUADRADO DIVIDIDO EN 5 ZONAS (no cruz)
    // La idea es hacer un cuadrado 3x3 donde usamos 5 zonas del medio

    // Zona OESTE (izquierda del centro)
    ctx.fillStyle = obtenerColor(dato.oeste);
    ctx.fillRect(x, y + TERCIO, TERCIO, TERCIO);
    ctx.strokeRect(x, y + TERCIO, TERCIO, TERCIO);

    // Zona NORTE (arriba del centro)
    ctx.fillStyle = obtenerColor(dato.norte);
    ctx.fillRect(x + TERCIO, y, TERCIO, TERCIO);
    ctx.strokeRect(x + TERCIO, y, TERCIO, TERCIO);

    // Zona CENTRO (el centro)
    ctx.fillStyle = obtenerColor(dato.centro);
    ctx.fillRect(x + TERCIO, y + TERCIO, TERCIO, TERCIO);
    ctx.strokeRect(x + TERCIO, y + TERCIO, TERCIO, TERCIO);

    // Zona SUR (abajo del centro)
    ctx.fillStyle = obtenerColor(dato.sur);
    ctx.fillRect(x + TERCIO, y + 2 * TERCIO, TERCIO, TERCIO);
    ctx.strokeRect(x + TERCIO, y + 2 * TERCIO, TERCIO, TERCIO);

    // Zona ESTE (derecha del centro)
    ctx.fillStyle = obtenerColor(dato.este);
    ctx.fillRect(x + 2 * TERCIO, y + TERCIO, TERCIO, TERCIO);
    ctx.strokeRect(x + 2 * TERCIO, y + TERCIO, TERCIO, TERCIO);

    // Número del diente
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(numero, x + SIZE / 2, y + SIZE + 12);

    // REGISTRAR ZONAS PARA CLICKS - COORDENADAS EXACTAS
    if (!canvas.datosZonas) canvas.datosZonas = [];

    // Cada zona se define con sus coordenadas exactas
    canvas.datosZonas.push(
        { numero, parte: 'oeste', x: x, y: y + TERCIO, ancho: TERCIO, alto: TERCIO },
        { numero, parte: 'norte', x: x + TERCIO, y: y, ancho: TERCIO, alto: TERCIO },
        { numero, parte: 'centro', x: x + TERCIO, y: y + TERCIO, ancho: TERCIO, alto: TERCIO },
        { numero, parte: 'sur', x: x + TERCIO, y: y + 2 * TERCIO, ancho: TERCIO, alto: TERCIO },
        { numero, parte: 'este', x: x + 2 * TERCIO, y: y + TERCIO, ancho: TERCIO, alto: TERCIO }
    );
}

function obtenerColor(valor) {
    if (valor === 'rojo') return colorRojo;
    if (valor === 'azul') return colorAzul;
    return colorBlanco;
}

function establecerColorOdontograma(color) {
    colorSeleccionado = color;
    // Redibujar con el nuevo color seleccionado
    const canvas = document.getElementById('odontograma-canvas');
    if (canvas && canvas.datosOdontograma) {
        canvas.datosZonas = [];
        dibujarOdontograma(canvas, canvas.datosOdontograma);
    }
}

function manejarClickOdontograma(event, canvas, datosOdontograma) {
    if (!canvas.datosZonas || canvas.datosZonas.length === 0) {
        console.warn('datosZonas vacío');
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Buscar la zona exacta donde se hizo clic
    for (let zona of canvas.datosZonas) {
        if (x >= zona.x && x < zona.x + zona.ancho &&
            y >= zona.y && y < zona.y + zona.alto) {

            // Inicializar diente si no existe
            if (!datosOdontograma[zona.numero]) {
                datosOdontograma[zona.numero] = {
                    centro: null, norte: null, sur: null, este: null, oeste: null
                };
            }

            // Aplicar color seleccionado
            datosOdontograma[zona.numero][zona.parte] = colorSeleccionado;

            // Redibujar
            canvas.datosZonas = [];
            dibujarOdontograma(canvas, datosOdontograma);
            return;
        }
    }
}

function obtenerDatosOdontogramaDelCanvas() {
    const canvas = document.getElementById('odontograma-canvas');
    if (canvas && canvas.datosOdontograma) {
        return canvas.datosOdontograma;
    }
    return {};
}

function guardarOdontogramaAlPaciente() {
    const canvas = document.getElementById('odontograma-canvas');
    if (canvas && canvas.datosOdontograma && pacienteActual) {
        pacienteActual.odontograma = canvas.datosOdontograma;
        actualizar(pacienteActual);
    }
}
