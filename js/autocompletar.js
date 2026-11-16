// ========== SUGERENCIAS DE NOMBRES ==========
//
// Cada vez que alguien escribe un nombre a mano inventa una variante nueva:
// así aparecieron "GONZALES" junto a "GONZALEZ", "MELIAM" junto a "MELIAN", y
// 18 fichas duplicadas del mismo paciente. Esto ataca la causa: en vez de
// escribir el nombre entero, se elige de los que ya existen.
//
// Busca sin tildes y sin importar el orden de las palabras: escribiendo "iker"
// encuentra "QUIROGA IKER". La Ñ se conserva al guardar, pero el buscador la
// ignora, así que escribiendo "munoz" también encuentra "MUÑOZ".

// Dónde se enganchan las sugerencias. 'completar' llena el campo;
// 'avisar' no lo llena: avisa que ya existe una ficha parecida.
const CAMPOS_CON_SUGERENCIAS = {
    'turno-nombre': { modo: 'completar' },
    'caja-nombre':  { modo: 'completar' },
    'campo-nombre': { modo: 'avisar' }
};

// Mayúsculas y sin tildes, pero la Ñ se respeta: no es un acento, es otra letra.
// Para buscar sí se vuelve N, así "munoz" encuentra "MUÑOZ".
function paraBuscar(texto) {
    return String(texto || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')   // saca las tildes (y la virgulilla de la Ñ)
        .replace(/[^A-Z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function palabrasDe(texto) {
    return paraBuscar(texto).split(' ').filter(p => p.length > 1);
}

// Todos los nombres que el sistema ya conoce: los de las fichas y los de los
// turnos (hay gente con turno que todavía no tiene ficha)
function nombresConocidos() {
    const vistos = new Map();

    if (typeof obtenerTodos === 'function') {
        obtenerTodos().forEach(p => {
            const dp = p.datosPersonales || {};
            if (!dp.nombre) return;
            const clave = paraBuscar(dp.nombre);
            if (!vistos.has(clave)) {
                vistos.set(clave, { nombre: dp.nombre, edad: dp.edad || '', id: p.id, tieneFicha: true });
            }
        });
    }

    if (typeof obtenerTurnos === 'function') {
        obtenerTurnos().forEach(t => {
            if (!t.pacienteNombre) return;
            const clave = paraBuscar(t.pacienteNombre);
            if (!vistos.has(clave)) {
                vistos.set(clave, { nombre: t.pacienteNombre, edad: '', id: null, tieneFicha: false });
            }
        });
    }

    return [...vistos.values()];
}

// Coincide si CADA palabra escrita es el comienzo de alguna palabra del nombre,
// sin importar el orden. "quir ik" encuentra "QUIROGA IKER".
function coincide(escrito, candidato) {
    const buscadas = palabrasDe(escrito);
    if (!buscadas.length) return false;
    const disponibles = palabrasDe(candidato.nombre);
    return buscadas.every(b => disponibles.some(d => d.startsWith(b)));
}

function buscarSugerencias(escrito, limite) {
    const candidatos = nombresConocidos().filter(c => coincide(escrito, c));
    // Primero los que tienen ficha, después alfabético
    candidatos.sort((a, b) => (b.tieneFicha - a.tieneFicha) || a.nombre.localeCompare(b.nombre));
    return candidatos.slice(0, limite || 6);
}

// ---------- El desplegable ----------
let cajaSugerencias = null;
let campoActivo = null;
let indiceResaltado = -1;

function cerrarSugerencias() {
    if (cajaSugerencias) cajaSugerencias.remove();
    cajaSugerencias = null;
    campoActivo = null;
    indiceResaltado = -1;
}

function elegirSugerencia(nombre) {
    if (campoActivo) {
        campoActivo.value = nombre;
        campoActivo.dispatchEvent(new Event('input', { bubbles: true }));
    }
    cerrarSugerencias();
}

function mostrarSugerencias(input, lista) {
    cerrarSugerencias();
    if (!lista.length) return;

    campoActivo = input;
    cajaSugerencias = document.createElement('div');
    cajaSugerencias.className = 'sug-caja';
    cajaSugerencias.innerHTML = lista.map((c, i) => `
        <button type="button" class="sug-item" data-i="${i}">
            <span class="sug-nombre">${c.nombre}</span>
            ${c.edad ? `<span class="sug-edad">${c.edad} años</span>` : ''}
            ${c.tieneFicha ? '' : '<span class="sug-sinficha">sin ficha</span>'}
        </button>`).join('');

    cajaSugerencias.querySelectorAll('.sug-item').forEach((btn, i) => {
        // mousedown y no click: el click llega después del blur y el campo ya se cerró
        btn.addEventListener('mousedown', e => { e.preventDefault(); elegirSugerencia(lista[i].nombre); });
    });

    // Se cuelga del mismo contenedor del campo, así funciona dentro de los modales
    const padre = input.parentElement;
    if (getComputedStyle(padre).position === 'static') padre.style.position = 'relative';
    padre.appendChild(cajaSugerencias);
}

// ---------- Aviso de ficha repetida (en Nuevo Paciente) ----------
function avisarFichaParecida(input, lista) {
    let aviso = document.getElementById('aviso-ficha-parecida');
    const conFicha = lista.filter(c => c.tieneFicha);

    if (!conFicha.length) { if (aviso) aviso.remove(); return; }

    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'aviso-ficha-parecida';
        aviso.className = 'aviso-repetida';
        input.parentElement.appendChild(aviso);
    }
    aviso.innerHTML = `
        <div class="aviso-repetida-titulo">⚠️ Ya existe una ficha parecida</div>
        ${conFicha.map(c => `
            <div class="aviso-repetida-fila">
                <span>${c.nombre}${c.edad ? ` · ${c.edad} años` : ''}</span>
                <button type="button" class="aviso-repetida-btn" onclick="verDetallesPaciente('${c.id}')">Abrir esta ficha</button>
            </div>`).join('')}
        <div class="aviso-repetida-pie">Si es la misma persona, abrí la ficha que ya existe en vez de crear otra.</div>`;
}

// ---------- Enganche ----------
// Los formularios se arman en el momento (modales, pestañas), así que no se
// puede enganchar al cargar la página: se escucha a todo el documento.
document.addEventListener('input', (e) => {
    const conf = CAMPOS_CON_SUGERENCIAS[e.target.id];
    if (!conf) return;

    const escrito = e.target.value.trim();
    if (escrito.length < 2) {
        cerrarSugerencias();
        const aviso = document.getElementById('aviso-ficha-parecida');
        if (aviso) aviso.remove();
        return;
    }

    const lista = buscarSugerencias(escrito, conf.modo === 'avisar' ? 3 : 6);
    if (conf.modo === 'avisar') avisarFichaParecida(e.target, lista);
    else mostrarSugerencias(e.target, lista);
});

document.addEventListener('keydown', (e) => {
    if (!cajaSugerencias || e.target !== campoActivo) return;
    const items = cajaSugerencias.querySelectorAll('.sug-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        indiceResaltado += (e.key === 'ArrowDown' ? 1 : -1);
        if (indiceResaltado < 0) indiceResaltado = items.length - 1;
        if (indiceResaltado >= items.length) indiceResaltado = 0;
        items.forEach((it, i) => it.classList.toggle('resaltado', i === indiceResaltado));
    } else if (e.key === 'Enter' && indiceResaltado >= 0) {
        e.preventDefault();
        items[indiceResaltado].dispatchEvent(new Event('mousedown'));
    } else if (e.key === 'Escape') {
        cerrarSugerencias();
    }
});

document.addEventListener('focusout', (e) => {
    if (e.target === campoActivo) setTimeout(cerrarSugerencias, 150);
});
