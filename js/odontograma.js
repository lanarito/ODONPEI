// ========== ODONTOGRAMA MODO PAINT ==========

let herramientaActual = 'rojo';
let pintando = false;

const COLORES_HERRAMIENTA = {
    rojo: '#E53935',
    azul: '#1E88E5',
    ausente: '#222222'
};

function setHerramienta(h) {
    herramientaActual = h;
    document.querySelectorAll('.btn-herramienta').forEach(b => b.classList.remove('activo'));
    const btn = document.getElementById('btn-' + h);
    if (btn) btn.classList.add('activo');
}

function iniciarOdontograma(canvasId, datosGuardados) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) { console.error('No encontré canvas:', canvasId); return; }

    canvas.width  = 900;
    canvas.height = 380;

    dibujarFondo(canvas);

    // Restaurar pintura guardada
    if (datosGuardados && typeof datosGuardados === 'string' && datosGuardados.startsWith('data:')) {
        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        };
        img.src = datosGuardados;
    }

    // ---- EVENTOS MOUSE ----
    canvas.onmousedown = (e) => { pintando = true; dibujarPunto(e, canvas); };
    canvas.onmousemove = (e) => { if (pintando) dibujarPunto(e, canvas); };
    canvas.onmouseup   = () => { pintando = false; };
    canvas.onmouseleave = () => { pintando = false; };

    // ---- EVENTOS TOUCH ----
    canvas.ontouchstart = (e) => { e.preventDefault(); pintando = true; dibujarPunto(e.touches[0], canvas); };
    canvas.ontouchmove  = (e) => { e.preventDefault(); if (pintando) dibujarPunto(e.touches[0], canvas); };
    canvas.ontouchend   = () => { pintando = false; };
}

function dibujarPunto(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top)  * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';

    if (herramientaActual === 'borrador') {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FAFAFA';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
    }

    if (herramientaActual === 'ausente') {
        const t = 12;
        ctx.strokeStyle = COLORES_HERRAMIENTA.ausente;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - t, y - t); ctx.lineTo(x + t, y + t);
        ctx.moveTo(x + t, y - t); ctx.lineTo(x - t, y + t);
        ctx.stroke();
        return;
    }

    ctx.fillStyle = COLORES_HERRAMIENTA[herramientaActual];
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function dibujarFondo(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const BG = '#FAFAFA';

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;

    const TAM    = 40;   // tamaño diente
    const INNER  = 26;   // cuadro interior
    const OFF    = (TAM - INNER) / 2;
    const GAP    = 5;
    const PASO   = TAM + GAP;

    function diente(x, y) {
        // relleno blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, TAM, TAM);
        // cuadrado exterior
        ctx.strokeStyle = '#444';
        ctx.strokeRect(x, y, TAM, TAM);
        // cuadrado interior
        ctx.strokeRect(x + OFF, y + OFF, INNER, INNER);
        // líneas esquinas
        ctx.beginPath();
        ctx.moveTo(x,       y);       ctx.lineTo(x + OFF,       y + OFF);
        ctx.moveTo(x + TAM, y);       ctx.lineTo(x + TAM - OFF, y + OFF);
        ctx.moveTo(x,       y + TAM); ctx.lineTo(x + OFF,       y + TAM - OFF);
        ctx.moveTo(x + TAM, y + TAM); ctx.lineTo(x + TAM - OFF, y + TAM - OFF);
        ctx.stroke();
    }

    function fila(nums, x0, y0, labelsArriba) {
        nums.forEach((n, i) => {
            const x = x0 + i * PASO;
            diente(x, y0);
            ctx.fillStyle = '#333';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            const labelY = labelsArriba ? y0 - 5 : y0 + TAM + 12;
            ctx.fillText(n, x + TAM / 2, labelY);
        });
    }

    // ---- LAYOUT ----
    // Permanentes: 8+8 = 16 dientes, + separador 16px
    const anchoPerms = 16 * PASO + 16;
    const x0Perms = (W - anchoPerms) / 2;
    const sepPerms = x0Perms + 8 * PASO + 8;  // línea central

    // Temporales: 5+5 = 10 dientes, + separador 16px
    const anchoTemps = 10 * PASO + 16;
    const x0Temps = (W - anchoTemps) / 2;
    const sepTemps = x0Temps + 5 * PASO + 8;

    const Y_SUP  = 30;           // permanentes superiores (números arriba)
    const Y_INF  = Y_SUP + TAM;  // permanentes inferiores, pegados
    const Y_TSUP = Y_INF + TAM + 38; // temporales superiores
    const Y_TINF = Y_TSUP + TAM;     // temporales inferiores, pegados

    // Permanentes superiores
    fila([18,17,16,15,14,13,12,11], x0Perms,            Y_SUP, true);
    fila([21,22,23,24,25,26,27,28], x0Perms + 8*PASO+16, Y_SUP, true);

    // Permanentes inferiores
    fila([48,47,46,45,44,43,42,41], x0Perms,            Y_INF, false);
    fila([31,32,33,34,35,36,37,38], x0Perms + 8*PASO+16, Y_INF, false);

    // Temporales superiores
    fila([55,54,53,52,51], x0Temps,            Y_TSUP, true);
    fila([61,62,63,64,65], x0Temps + 5*PASO+16, Y_TSUP, true);

    // Temporales inferiores
    fila([85,84,83,82,81], x0Temps,            Y_TINF, false);
    fila([71,72,73,74,75], x0Temps + 5*PASO+16, Y_TINF, false);

    // Líneas centrales verticales
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);

    ctx.beginPath();
    ctx.moveTo(sepPerms, Y_SUP - 14);
    ctx.lineTo(sepPerms, Y_INF + TAM + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sepTemps, Y_TSUP - 14);
    ctx.lineTo(sepTemps, Y_TINF + TAM + 5);
    ctx.stroke();

    ctx.setLineDash([]);

    // Línea horizontal divisoria permanentes
    const midPerm = Y_SUP + TAM;
    ctx.strokeStyle = '#AAA';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0Perms - 5, midPerm);
    ctx.lineTo(x0Perms + anchoPerms - 5, midPerm);
    ctx.stroke();

    // Etiquetas D / I
    ctx.fillStyle = '#888';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('D', x0Perms - 14, Y_SUP + TAM);
    ctx.fillText('I', x0Perms + anchoPerms + 2, Y_SUP + TAM);

    // Bordes suavizados (fade)
    const fade = 35;
    [[0,0,0,fade,'down'],[0,H-fade,0,H,'up'],
     [0,0,fade,0,'right'],[W-fade,0,W,0,'left']].forEach(([x1,y1,x2,y2,dir]) => {
        let g;
        if (dir === 'down')  g = ctx.createLinearGradient(0,0,0,fade);
        if (dir === 'up')    g = ctx.createLinearGradient(0,H-fade,0,H);
        if (dir === 'right') g = ctx.createLinearGradient(0,0,fade,0);
        if (dir === 'left')  g = ctx.createLinearGradient(W-fade,0,W,0);
        g.addColorStop(0, dir==='down'||dir==='right' ? BG : 'rgba(250,250,250,0)');
        g.addColorStop(1, dir==='down'||dir==='right' ? 'rgba(250,250,250,0)' : BG);
        ctx.fillStyle = g;
        if (dir==='down')  ctx.fillRect(0,     0,     W,    fade);
        if (dir==='up')    ctx.fillRect(0,     H-fade,W,    fade);
        if (dir==='right') ctx.fillRect(0,     0,     fade, H);
        if (dir==='left')  ctx.fillRect(W-fade,0,     fade, H);
    });
}

function limpiarOdontograma() {
    const canvas = document.getElementById('odontograma-canvas');
    if (!canvas) return;
    if (!confirm('¿Borrar todo lo pintado?')) return;
    dibujarFondo(canvas);
}

function obtenerDatosOdontogramaDelCanvas() {
    const canvas = document.getElementById('odontograma-canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
}
