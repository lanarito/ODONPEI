// ========== ODONTOGRAMA - MODO PAINT ==========

let herramientaActual = 'rojo';
let pintando = false;

const COLORES = {
    rojo: '#E53935',
    azul: '#1E88E5',
    ausente: '#333333',
    borrador: null
};

// Tamaño de pincel por herramienta
const TAMANO = {
    rojo: 8,
    azul: 8,
    ausente: 14,
    borrador: 20
};

function iniciarOdontograma(canvasId, datosGuardados = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const W = 900;
    const H = 380;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');

    // Dibujar fondo del odontograma
    dibujarFondoOdontograma(ctx, W, H);

    // Restaurar pintura guardada si existe
    if (datosGuardados) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = datosGuardados;
    }

    // Guardar fondo para el borrador
    canvas._fondoImageData = null;
    setTimeout(() => {
        canvas._fondoImageData = ctx.getImageData(0, 0, W, H);
    }, 50);

    // Eventos de pintura
    canvas.addEventListener('mousedown', (e) => { pintando = true; pintar(e, canvas); });
    canvas.addEventListener('mousemove', (e) => { if (pintando) pintar(e, canvas); });
    canvas.addEventListener('mouseup', () => { pintando = false; });
    canvas.addEventListener('mouseleave', () => { pintando = false; });

    // Touch (celular/tablet)
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); pintando = true; pintar(e.touches[0], canvas); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (pintando) pintar(e.touches[0], canvas); });
    canvas.addEventListener('touchend', () => { pintando = false; });
}

function pintar(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const ctx = canvas.getContext('2d');

    if (herramientaActual === 'borrador') {
        // Borrador: restaura el fondo original en esa zona
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, TAMANO.borrador, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Redibujar fondo donde se borró
        if (canvas._fondoImageData) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(canvas._fondoImageData, 0, 0);
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();
        }
        return;
    }

    if (herramientaActual === 'ausente') {
        // X para diente ausente
        const tam = TAMANO.ausente;
        ctx.strokeStyle = COLORES.ausente;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - tam, y - tam);
        ctx.lineTo(x + tam, y + tam);
        ctx.moveTo(x + tam, y - tam);
        ctx.lineTo(x - tam, y + tam);
        ctx.stroke();
        return;
    }

    // Pincel circular rojo o azul
    ctx.fillStyle = COLORES[herramientaActual];
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x, y, TAMANO[herramientaActual], 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function dibujarFondoOdontograma(ctx, W, H) {
    const fondo = '#FAFAFA';
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#FAFAFA';

    const TAM = 42;       // tamaño del diente
    const INNER = 28;     // cuadrado interior
    const OFFSET = (TAM - INNER) / 2;
    const GAP = 4;

    function diente(x, y) {
        // Cuadrado exterior
        ctx.strokeRect(x, y, TAM, TAM);
        // Cuadrado interior (más pequeño)
        ctx.strokeRect(x + OFFSET, y + OFFSET, INNER, INNER);
        // Líneas diagonales del exterior al interior (esquinas)
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + OFFSET, y + OFFSET);
        ctx.moveTo(x + TAM, y); ctx.lineTo(x + TAM - OFFSET, y + OFFSET);
        ctx.moveTo(x, y + TAM); ctx.lineTo(x + OFFSET, y + TAM - OFFSET);
        ctx.moveTo(x + TAM, y + TAM); ctx.lineTo(x + TAM - OFFSET, y + TAM - OFFSET);
        ctx.stroke();
    }

    function fila(dientes, startX, startY, numeros, numArriba) {
        const paso = TAM + GAP;
        dientes.forEach((num, i) => {
            const x = startX + i * paso;
            // Rellenar de blanco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + 1, startY + 1, TAM - 2, TAM - 2);
            diente(x, startY);

            // Número
            ctx.fillStyle = '#333';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            if (numArriba) {
                ctx.fillText(num, x + TAM / 2, startY - 4);
            } else {
                ctx.fillText(num, x + TAM / 2, startY + TAM + 13);
            }
        });
    }

    const paso = TAM + GAP;

    // ====== CALCULAR POSICIONES ======
    // Fila superior permanentes: 18-11 | 21-28
    const superiorIzq = [18, 17, 16, 15, 14, 13, 12, 11];
    const superiorDer = [21, 22, 23, 24, 25, 26, 27, 28];
    const totalSuperior = (superiorIzq.length + superiorDer.length) * paso + 20;
    const startXSuperior = (W - totalSuperior) / 2;
    const Y1 = 40;  // fila permanentes superiores (números arriba)

    // Fila inferior permanentes: 48-41 | 31-38
    const inferiorIzq = [48, 47, 46, 45, 44, 43, 42, 41];
    const inferiorDer = [31, 32, 33, 34, 35, 36, 37, 38];
    const Y2 = Y1 + TAM + 2;  // pega justo debajo

    // Temporales superiores: 55-51 | 61-65
    const tempSupIzq = [55, 54, 53, 52, 51];
    const tempSupDer = [61, 62, 63, 64, 65];
    const totalTemp = (tempSupIzq.length + tempSupDer.length) * paso + 20;
    const startXTemp = (W - totalTemp) / 2;
    const Y3 = Y2 + TAM + 40;  // temporales superiores

    // Temporales inferiores: 85-81 | 71-75
    const tempInfIzq = [85, 84, 83, 82, 81];
    const tempInfDer = [71, 72, 73, 74, 75];
    const Y4 = Y3 + TAM + 2;  // pega justo debajo

    // ====== DIBUJAR ======

    // Permanentes superiores (números arriba)
    fila(superiorIzq, startXSuperior, Y1, true, true);
    fila(superiorDer, startXSuperior + superiorIzq.length * paso + 20, Y1, true, true);

    // Permanentes inferiores (números abajo) - sin espacio
    fila(inferiorIzq, startXSuperior, Y2, false, false);
    fila(inferiorDer, startXSuperior + inferiorIzq.length * paso + 20, Y2, false, false);

    // Temporales superiores (números arriba)
    fila(tempSupIzq, startXTemp, Y3, true, true);
    fila(tempSupDer, startXTemp + tempSupIzq.length * paso + 20, Y3, true, true);

    // Temporales inferiores (números abajo) - sin espacio
    fila(tempInfIzq, startXTemp, Y4, false, false);
    fila(tempInfDer, startXTemp + tempInfIzq.length * paso + 20, Y4, false, false);

    // Línea vertical central (divide Derecha / Izquierda)
    const centroX = startXSuperior + superiorIzq.length * paso + 10;
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centroX, Y1 - 15);
    ctx.lineTo(centroX, Y2 + TAM + 5);
    ctx.stroke();

    const centroXTemp = startXTemp + tempSupIzq.length * paso + 10;
    ctx.beginPath();
    ctx.moveTo(centroXTemp, Y3 - 15);
    ctx.lineTo(centroXTemp, Y4 + TAM + 5);
    ctx.stroke();

    // Línea horizontal divisoria entre superior e inferior
    const midY = (Y2 + TAM / 2 + Y1 + TAM / 2) / 2;
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startXSuperior - 5, midY);
    ctx.lineTo(startXSuperior + totalSuperior - 15, midY);
    ctx.stroke();

    // Etiquetas D / I
    ctx.fillStyle = '#888';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('D', startXSuperior - 22, Y1 + TAM);
    ctx.textAlign = 'right';
    ctx.fillText('I', startXSuperior + totalSuperior - 10, Y1 + TAM);

    // Difuminar bordes del canvas (efecto fade)
    const fadeSize = 40;
    const gradTop = ctx.createLinearGradient(0, 0, 0, fadeSize);
    gradTop.addColorStop(0, fondo); gradTop.addColorStop(1, 'transparent');
    ctx.fillStyle = gradTop; ctx.fillRect(0, 0, W, fadeSize);

    const gradBot = ctx.createLinearGradient(0, H - fadeSize, 0, H);
    gradBot.addColorStop(0, 'transparent'); gradBot.addColorStop(1, fondo);
    ctx.fillStyle = gradBot; ctx.fillRect(0, H - fadeSize, W, fadeSize);

    const gradLeft = ctx.createLinearGradient(0, 0, fadeSize, 0);
    gradLeft.addColorStop(0, fondo); gradLeft.addColorStop(1, 'transparent');
    ctx.fillStyle = gradLeft; ctx.fillRect(0, 0, fadeSize, H);

    const gradRight = ctx.createLinearGradient(W - fadeSize, 0, W, 0);
    gradRight.addColorStop(0, 'transparent'); gradRight.addColorStop(1, fondo);
    ctx.fillStyle = gradRight; ctx.fillRect(W - fadeSize, 0, fadeSize, H);
}

function setHerramienta(h) {
    herramientaActual = h;
    // Actualizar botones activos
    document.querySelectorAll('.btn-herramienta').forEach(b => b.classList.remove('activo'));
    const btn = document.getElementById('btn-' + h);
    if (btn) btn.classList.add('activo');
}

function obtenerDatosOdontogramaDelCanvas() {
    const canvas = document.getElementById('odontograma-canvas');
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
}

function guardarOdontogramaAlPaciente() {
    const canvas = document.getElementById('odontograma-canvas');
    if (canvas && pacienteActual) {
        pacienteActual.odontograma = canvas.toDataURL('image/png');
        actualizar(pacienteActual);
    }
}

// Limpiar odontograma
function limpiarOdontograma() {
    const canvas = document.getElementById('odontograma-canvas');
    if (!canvas) return;
    if (!confirm('¿Borrar todo lo pintado en el odontograma?')) return;
    const ctx = canvas.getContext('2d');
    dibujarFondoOdontograma(ctx, canvas.width, canvas.height);
    canvas._fondoImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}
