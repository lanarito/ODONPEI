// ========== ODONTOGRAMA INTERACTIVO ==========

const colorRojo = '#FF6B6B';
const colorAzul = '#4A90E2';
const colorBlanco = '#FFFFFF';
const colorBorde = '#333333';

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

        // Título
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText('ODONTOGRAMA - Haz clic en cada zona para pintar (Rojo → Azul → Blanco)', w / 2, y);
        y += 30;

        // Temporales Superiores
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#555';
        ctx.fillText('Dientes Temporales Superiores', w / 2, y);
        y += 18;
        dibujarFilaDientes(ctx, canvas, y, [...estructura.temporal_superior_derecha.reverse(), ...estructura.temporal_superior_izquierda], datosOdontograma);
        y += 75;

        // Permanentes Superiores
        ctx.fillText('Dientes Permanentes Superiores', w / 2, y);
        y += 18;
        dibujarFilaDientes(ctx, canvas, y, [...estructura.superior_derecha.reverse(), ...estructura.superior_izquierda], datosOdontograma);
        y += 75;

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
        y += 75;

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
    const tamDiente = 55;
    const espaciado = 8;

    const totalAncho = dientes.length * tamDiente + (dientes.length - 1) * espaciado;
    let x = (w - totalAncho) / 2;

    dientes.forEach(num => {
        dibujarDiente(ctx, canvas, x, y, num, datosOdontograma);
        x += tamDiente + espaciado;
    });
}

function dibujarDiente(ctx, canvas, x, y, numero, datosOdontograma) {
    const tamanio = 50;
    const zona = tamanio / 3;

    const dato = datosOdontograma[numero] || {
        centro: null, norte: null, sur: null, este: null, oeste: null
    };

    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 1.5;

    // Centro
    ctx.fillStyle = obtenerColor(dato.centro);
    ctx.fillRect(x + zona, y + zona, zona, zona);
    ctx.strokeRect(x + zona, y + zona, zona, zona);

    // Norte
    ctx.fillStyle = obtenerColor(dato.norte);
    ctx.fillRect(x + zona, y, zona, zona);
    ctx.strokeRect(x + zona, y, zona, zona);

    // Sur
    ctx.fillStyle = obtenerColor(dato.sur);
    ctx.fillRect(x + zona, y + 2 * zona, zona, zona);
    ctx.strokeRect(x + zona, y + 2 * zona, zona, zona);

    // Este
    ctx.fillStyle = obtenerColor(dato.este);
    ctx.fillRect(x + 2 * zona, y + zona, zona, zona);
    ctx.strokeRect(x + 2 * zona, y + zona, zona, zona);

    // Oeste
    ctx.fillStyle = obtenerColor(dato.oeste);
    ctx.fillRect(x, y + zona, zona, zona);
    ctx.strokeRect(x, y + zona, zona, zona);

    // Número
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(numero, x + zona + zona / 2, y + tamanio + 12);

    // Guardar zonas
    if (!canvas.datosZonas) canvas.datosZonas = [];
    canvas.datosZonas.push(
        { numero, parte: 'centro', x: x + zona, y: y + zona, ancho: zona, alto: zona },
        { numero, parte: 'norte', x: x + zona, y: y, ancho: zona, alto: zona },
        { numero, parte: 'sur', x: x + zona, y: y + 2 * zona, ancho: zona, alto: zona },
        { numero, parte: 'este', x: x + 2 * zona, y: y + zona, ancho: zona, alto: zona },
        { numero, parte: 'oeste', x: x, y: y + zona, ancho: zona, alto: zona }
    );
}

function obtenerColor(valor) {
    if (valor === 'rojo') return colorRojo;
    if (valor === 'azul') return colorAzul;
    return colorBlanco;
}

function manejarClickOdontograma(event, canvas, datosOdontograma) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let zona of canvas.datosZonas) {
        if (x >= zona.x && x <= zona.x + zona.ancho &&
            y >= zona.y && y <= zona.y + zona.alto) {

            if (!datosOdontograma[zona.numero]) {
                datosOdontograma[zona.numero] = {
                    centro: null, norte: null, sur: null, este: null, oeste: null
                };
            }

            const actual = datosOdontograma[zona.numero][zona.parte];
            let nuevo;
            if (actual === null) {
                nuevo = 'rojo';
            } else if (actual === 'rojo') {
                nuevo = 'azul';
            } else {
                nuevo = null;
            }

            datosOdontograma[zona.numero][zona.parte] = nuevo;

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
