// ========== ODONTOGRAMA INTERACTIVO ==========

// Colores para el odontograma
const colorRojo = '#FF6B6B';    // Prácticas existentes
const colorAzul = '#4A90E2';    // Prácticas requeridas
const colorBlanco = '#FFFFFF';
const colorBorde = '#333333';

// Estructura del odontograma según sistema FDI
const estructura = {
    // Dientes permanentes superiores
    superior_derecha: [18, 17, 16, 15, 14, 13, 12, 11],
    superior_izquierda: [21, 22, 23, 24, 25, 26, 27, 28],
    // Dientes permanentes inferiores
    inferior_derecha: [48, 47, 46, 45, 44, 43, 42, 41],
    inferior_izquierda: [31, 32, 33, 34, 35, 36, 37, 38],
    // Dientes temporales superiores
    temporal_superior_derecha: [55, 54, 53, 52, 51],
    temporal_superior_izquierda: [61, 62, 63, 64, 65],
    // Dientes temporales inferiores
    temporal_inferior_derecha: [85, 84, 83, 82, 81],
    temporal_inferior_izquierda: [71, 72, 73, 74, 75]
};

function dibujarOdontograma(canvas, datosOdontograma = {}) {
    // Establecer tamaño del canvas si no tiene
    if (canvas.width === 0) {
        canvas.width = Math.min(window.innerWidth - 60, 1000);
        canvas.height = 700;
    }

    const ctx = canvas.getContext('2d');
    canvas.datosOdontograma = datosOdontograma; // Guardar datos en el canvas
    const padding = 40;
    const anchoDisponible = canvas.width - 2 * padding;
    const altoDisponible = canvas.height - 2 * padding;

    // Limpiar canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar bordes
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, anchoDisponible, altoDisponible);

    // Parámetros de dientes
    const dimensionesDiente = {
        ancho: 50,
        alto: 50,
        espacioEntreGrupos: 40,
        espacioEntreLineas: 10
    };

    let y = padding + 20;

    // Dibujar dientes temporales superiores
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('Dientes Temporales Superiores', canvas.width / 2, y - 10);

    dibujarFilaDientes(
        ctx, canvas, y,
        [...estructura.temporal_superior_derecha.reverse(), ...estructura.temporal_superior_izquierda],
        datosOdontograma,
        dimensionesDiente
    );
    y += dimensionesDiente.alto + 10;

    // Dibujar dientes permanentes superiores
    ctx.fillText('Dientes Permanentes Superiores', canvas.width / 2, y - 10);
    dibujarFilaDientes(
        ctx, canvas, y,
        [...estructura.superior_derecha.reverse(), ...estructura.superior_izquierda],
        datosOdontograma,
        dimensionesDiente
    );
    y += dimensionesDiente.alto + 20;

    // Línea divisoria
    ctx.strokeStyle = '#CCCCCC';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);

    y += 20;

    // Dibujar dientes permanentes inferiores
    ctx.fillStyle = '#999';
    ctx.fillText('Dientes Permanentes Inferiores', canvas.width / 2, y - 10);
    dibujarFilaDientes(
        ctx, canvas, y,
        [...estructura.inferior_izquierda.reverse(), ...estructura.inferior_derecha],
        datosOdontograma,
        dimensionesDiente
    );
    y += dimensionesDiente.alto + 10;

    // Dibujar dientes temporales inferiores
    ctx.fillText('Dientes Temporales Inferiores', canvas.width / 2, y - 10);
    dibujarFilaDientes(
        ctx, canvas, y,
        [...estructura.temporal_inferior_izquierda.reverse(), ...estructura.temporal_inferior_derecha],
        datosOdontograma,
        dimensionesDiente
    );
}

function dibujarFilaDientes(ctx, canvas, y, dientes, datosOdontograma, dim) {
    const padding = 40;
    const anchoTotal = canvas.width - 2 * padding;
    const espacioTotal = dientes.length * dim.ancho + (dientes.length - 1) * 5;
    let x = padding + (anchoTotal - espacioTotal) / 2;

    dientes.forEach(numeroDiente => {
        dibujarDiente(ctx, x, y, numeroDiente, datosOdontograma, dim);
        x += dim.ancho + 5;

        // Espacio para indicar separación izq/der
        if (numeroDiente === 11 || numeroDiente === 21 || numeroDiente === 41 || numeroDiente === 31 ||
            numeroDiente === 51 || numeroDiente === 61 || numeroDiente === 81 || numeroDiente === 71) {
            x += 15;
        }
    });
}

function dibujarDiente(ctx, x, y, numero, datosOdontograma, dim) {
    const tamanio = 40;
    const tamanioZona = tamanio / 3;

    // Obtener datos del diente
    const datoDiente = datosOdontograma[numero] || {
        centro: null,
        norte: null,
        sur: null,
        este: null,
        oeste: null
    };

    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 2;

    // Centro (cuadrado principal)
    ctx.fillStyle = obtenerColor(datoDiente.centro);
    ctx.fillRect(x + tamanioZona, y + tamanioZona, tamanioZona, tamanioZona);
    ctx.strokeRect(x + tamanioZona, y + tamanioZona, tamanioZona, tamanioZona);

    // Norte (arriba)
    ctx.fillStyle = obtenerColor(datoDiente.norte);
    ctx.fillRect(x + tamanioZona, y, tamanioZona, tamanioZona);
    ctx.strokeRect(x + tamanioZona, y, tamanioZona, tamanioZona);

    // Sur (abajo)
    ctx.fillStyle = obtenerColor(datoDiente.sur);
    ctx.fillRect(x + tamanioZona, y + 2 * tamanioZona, tamanioZona, tamanioZona);
    ctx.strokeRect(x + tamanioZona, y + 2 * tamanioZona, tamanioZona, tamanioZona);

    // Este (derecha)
    ctx.fillStyle = obtenerColor(datoDiente.este);
    ctx.fillRect(x + 2 * tamanioZona, y + tamanioZona, tamanioZona, tamanioZona);
    ctx.strokeRect(x + 2 * tamanioZona, y + tamanioZona, tamanioZona, tamanioZona);

    // Oeste (izquierda)
    ctx.fillStyle = obtenerColor(datoDiente.oeste);
    ctx.fillRect(x, y + tamanioZona, tamanioZona, tamanioZona);
    ctx.strokeRect(x, y + tamanioZona, tamanioZona, tamanioZona);

    // Número del diente
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(numero, x + tamanioZona + tamanioZona / 2, y + tamanioZona * 2.5 + 15);

    // Guardar información de posición para clicks
    if (!canvas.datosZonas) canvas.datosZonas = [];
    const zonas = [
        { numero, parte: 'centro', x: x + tamanioZona, y: y + tamanioZona, ancho: tamanioZona, alto: tamanioZona },
        { numero, parte: 'norte', x: x + tamanioZona, y: y, ancho: tamanioZona, alto: tamanioZona },
        { numero, parte: 'sur', x: x + tamanioZona, y: y + 2 * tamanioZona, ancho: tamanioZona, alto: tamanioZona },
        { numero, parte: 'este', x: x + 2 * tamanioZona, y: y + tamanioZona, ancho: tamanioZona, alto: tamanioZona },
        { numero, parte: 'oeste', x: x, y: y + tamanioZona, ancho: tamanioZona, alto: tamanioZona }
    ];
    canvas.datosZonas.push(...zonas);
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

    // Buscar la zona clickeada
    for (let zona of canvas.datosZonas) {
        if (x >= zona.x && x <= zona.x + zona.ancho &&
            y >= zona.y && y <= zona.y + zona.alto) {

            // Obtener estado actual
            if (!datosOdontograma[zona.numero]) {
                datosOdontograma[zona.numero] = {
                    centro: null, norte: null, sur: null, este: null, oeste: null
                };
            }

            const estadoActual = datosOdontograma[zona.numero][zona.parte];

            // Ciclar: null -> rojo -> azul -> null
            let nuevoEstado;
            if (estadoActual === null) {
                nuevoEstado = 'rojo';
            } else if (estadoActual === 'rojo') {
                nuevoEstado = 'azul';
            } else {
                nuevoEstado = null;
            }

            datosOdontograma[zona.numero][zona.parte] = nuevoEstado;

            // Redibujar
            canvas.datosZonas = [];
            dibujarOdontograma(canvas, datosOdontograma);

            // Re-agregar event listener
            canvas.addEventListener('click', (e) => {
                manejarClickOdontograma(e, canvas, datosOdontograma);
            });

            return;
        }
    }
}

// Funciones para guardar/cargar datos del odontograma en formulario
function obtenerDatosOdontogramaDelCanvas() {
    const canvas = document.getElementById('odontograma-canvas');
    if (canvas && canvas.datosOdontograma) {
        return canvas.datosOdontograma;
    }
    return {};
}

// Guardar odontograma al paciente actual
function guardarOdontogramaAlPaciente() {
    const canvas = document.getElementById('odontograma-canvas');
    if (canvas && canvas.datosOdontograma && pacienteActual) {
        pacienteActual.odontograma = canvas.datosOdontograma;
        actualizar(pacienteActual);
    }
}
