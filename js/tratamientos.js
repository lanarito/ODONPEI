// ========== TRATAMIENTOS Y PRESUPUESTOS ==========

// ========== TRATAMIENTOS ==========
function mostrarTratamientos() {
    const container = document.getElementById('contenido-tratamientos');
    if (!pacienteActual.tratamientos) {
        container.innerHTML = '<p style="color: #999;">Sin tratamientos registrados</p>';
        return;
    }

    const trat = pacienteActual.tratamientos;
    let html = `<div class="tratamiento-card">`;

    if (trat.realizados) {
        html += `
            <div class="tratamiento-item">
                <h4 style="color: var(--primary-pastel); margin-bottom: 10px;">✓ Tratamientos Realizados</h4>
                <p style="white-space: pre-wrap;">${trat.realizados}</p>
            </div>
        `;
    }

    if (trat.propuesta) {
        html += `
            <div class="tratamiento-item" style="margin-top: 20px;">
                <h4 style="color: var(--secondary-pastel); margin-bottom: 10px;">→ Propuesta de Tratamiento</h4>
                <p style="white-space: pre-wrap;">${trat.propuesta}</p>
            </div>
        `;
    }

    html += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--border-color);">
                <button onclick="mostrarFormTratamientos()" class="btn btn-secondary">
                    ✏️ Editar Tratamientos
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function mostrarFormTratamientos() {
    const trat = pacienteActual.tratamientos || {};
    const html = `
        <form onsubmit="guardarTratamientos(event)" class="historia-clinica">
            <div class="historia-section">
                <h3>Tratamientos Realizados</h3>
                <div class="form-group">
                    <textarea id="edit-tratamientos-realizados" placeholder="Describe detalladamente los tratamientos realizados..." style="min-height: 150px;">${trat.realizados || ''}</textarea>
                </div>
            </div>

            <div class="historia-section">
                <h3>Propuesta de Tratamiento</h3>
                <div class="form-group">
                    <textarea id="edit-propuesta-tratamiento" placeholder="Describe la propuesta de tratamiento, plan, duración estimada, etc..." style="min-height: 150px;">${trat.propuesta || ''}</textarea>
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn btn-primary">Guardar</button>
                <button type="button" onclick="mostrarTratamientos()" class="btn btn-outline">Cancelar</button>
            </div>
        </form>
    `;

    document.getElementById('contenido-tratamientos').innerHTML = html;
}

function guardarTratamientos(event) {
    event.preventDefault();
    pacienteActual.tratamientos = {
        realizados: document.getElementById('edit-tratamientos-realizados').value,
        propuesta: document.getElementById('edit-propuesta-tratamiento').value
    };
    actualizar(pacienteActual);
    mostrarTratamientos();
}

// ========== PRESUPUESTO ==========
function mostrarPresupuesto() {
    const container = document.getElementById('contenido-presupuesto');
    if (!pacienteActual.presupuesto || Object.keys(pacienteActual.presupuesto).length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">Sin presupuestos creados. Crea uno para comenzar.</p>';
        return;
    }

    const pres = pacienteActual.presupuesto;
    let html = '<div class="presupuesto-vista">';

    // Mostrar presupuesto
    html += `
        <div class="presupuesto-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                <div>
                    <h3>${pres.numero || 'PRESUPUESTO'}</h3>
                    <p style="color: #999; margin: 5px 0;">Fecha: ${new Date(pres.fecha).toLocaleDateString('es-AR')}</p>
                    ${pres.vigencia ? `<p style="color: #999; margin: 5px 0;">Vigencia: ${new Date(pres.vigencia).toLocaleDateString('es-AR')}</p>` : ''}
                </div>
                <div style="text-align: right;">
                    <p><strong>Paciente:</strong> ${pacienteActual.datosPersonales.nombre}</p>
                    ${pacienteActual.datosPersonales.telefono ? `<p><strong>Teléfono:</strong> ${pacienteActual.datosPersonales.telefono}</p>` : ''}
                </div>
            </div>

            <table class="presupuesto-tabla">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th style="width: 100px;">Cantidad</th>
                        <th style="width: 120px;">Valor Unitario</th>
                        <th style="width: 120px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let total = 0;
    if (pres.items && Array.isArray(pres.items)) {
        pres.items.forEach(item => {
            const subtotal = item.cantidad * item.valor;
            total += subtotal;
            html += `
                <tr>
                    <td>${item.descripcion}</td>
                    <td style="text-align: center;">${item.cantidad}</td>
                    <td style="text-align: right;">$${item.valor.toFixed(2)}</td>
                    <td style="text-align: right; font-weight: 600;">$${subtotal.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>

            <div class="presupuesto-resumen">
                <div class="resumen-item">
                    <span>Subtotal:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
    `;

    if (pres.descuento && pres.descuento > 0) {
        const montoDescuento = total * (pres.descuento / 100);
        total = total - montoDescuento;
        html += `
                <div class="resumen-item">
                    <span>Descuento (${pres.descuento}%):</span>
                    <span style="color: var(--success-pastel);">-$${montoDescuento.toFixed(2)}</span>
                </div>
        `;
    }

    html += `
                <div class="resumen-item" style="font-size: 18px; font-weight: bold; border-top: 2px solid var(--border-color); padding-top: 10px; margin-top: 10px;">
                    <span>TOTAL:</span>
                    <span style="color: var(--primary-pastel);">$${total.toFixed(2)}</span>
                </div>
            </div>

            ${pres.observaciones ? `
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--border-color);">
                    <h5>Observaciones:</h5>
                    <p style="white-space: pre-wrap;">${pres.observaciones}</p>
                </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--border-color); display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="mostrarFormPresupuesto()" class="btn btn-secondary">✏️ Editar</button>
                <button onclick="imprimirPresupuesto()" class="btn btn-primary">🖨️ Imprimir</button>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;
}

function mostrarFormPresupuesto() {
    const pres = pacienteActual.presupuesto || { items: [], descuento: 0 };

    let itemsHtml = '';
    if (pres.items && Array.isArray(pres.items)) {
        pres.items.forEach((item, idx) => {
            itemsHtml += `
                <div class="presupuesto-item-form">
                    <input type="text" placeholder="Descripción" value="${item.descripcion}" data-idx="${idx}" class="item-desc">
                    <input type="number" placeholder="Cant." value="${item.cantidad}" min="1" data-idx="${idx}" class="item-cant">
                    <input type="number" placeholder="Valor" value="${item.valor}" step="0.01" data-idx="${idx}" class="item-val">
                    <button type="button" onclick="eliminarItemPresupuesto(${idx})" class="btn btn-danger" style="padding: 8px 12px;">✕</button>
                </div>
            `;
        });
    }

    const html = `
        <form onsubmit="guardarPresupuesto(event)" class="historia-clinica">
            <div class="historia-section">
                <h3>Información del Presupuesto</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="form-group">
                        <label>Número de Presupuesto</label>
                        <input type="text" id="pres-numero" value="${pres.numero || 'PRES-' + new Date().getTime()}" placeholder="Ej: PRES-001">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="pres-fecha" value="${pres.fecha ? pres.fecha.split('T')[0] : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Vigencia (hasta)</label>
                        <input type="date" id="pres-vigencia" value="${pres.vigencia ? pres.vigencia.split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label>Descuento (%)</label>
                        <input type="number" id="pres-descuento" value="${pres.descuento || 0}" min="0" max="100" step="0.5">
                    </div>
                </div>
            </div>

            <div class="historia-section">
                <h3>Ítems del Presupuesto</h3>
                <div id="presupuesto-items">
                    ${itemsHtml}
                </div>
                <button type="button" onclick="agregarItemPresupuesto()" class="btn btn-outline" style="margin-top: 10px;">+ Agregar Ítem</button>
            </div>

            <div class="historia-section">
                <h3>Observaciones</h3>
                <div class="form-group">
                    <textarea id="pres-observaciones" placeholder="Términos, condiciones, notas adicionales..." style="min-height: 100px;">${pres.observaciones || ''}</textarea>
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn btn-primary">Guardar Presupuesto</button>
                <button type="button" onclick="mostrarPresupuesto()" class="btn btn-outline">Cancelar</button>
            </div>
        </form>
    `;

    document.getElementById('contenido-presupuesto').innerHTML = html;
}

function agregarItemPresupuesto() {
    const container = document.getElementById('presupuesto-items');
    const itemCount = container.children.length;
    const newItem = document.createElement('div');
    newItem.className = 'presupuesto-item-form';
    newItem.innerHTML = `
        <input type="text" placeholder="Descripción" class="item-desc" data-idx="${itemCount}">
        <input type="number" placeholder="Cant." value="1" min="1" class="item-cant" data-idx="${itemCount}">
        <input type="number" placeholder="Valor" step="0.01" class="item-val" data-idx="${itemCount}">
        <button type="button" onclick="this.parentElement.remove()" class="btn btn-danger" style="padding: 8px 12px;">✕</button>
    `;
    container.appendChild(newItem);
}

function eliminarItemPresupuesto(idx) {
    document.querySelectorAll('.presupuesto-item-form')[idx].remove();
}

function guardarPresupuesto(event) {
    event.preventDefault();

    const items = [];
    document.querySelectorAll('.presupuesto-item-form').forEach((form) => {
        const desc = form.querySelector('.item-desc')?.value || '';
        const cant = parseFloat(form.querySelector('.item-cant')?.value || 0);
        const val = parseFloat(form.querySelector('.item-val')?.value || 0);

        if (desc && cant > 0 && val > 0) {
            items.push({
                descripcion: desc,
                cantidad: cant,
                valor: val
            });
        }
    });

    if (items.length === 0) {
        alert('Debe agregar al menos un ítem');
        return;
    }

    pacienteActual.presupuesto = {
        numero: document.getElementById('pres-numero')?.value || '',
        fecha: document.getElementById('pres-fecha')?.value,
        vigencia: document.getElementById('pres-vigencia')?.value,
        descuento: parseFloat(document.getElementById('pres-descuento')?.value || 0),
        items: items,
        observaciones: document.getElementById('pres-observaciones')?.value || ''
    };

    actualizar(pacienteActual);
    mostrarPresupuesto();
}

function imprimirPresupuesto() {
    if (!pacienteActual.presupuesto) {
        alert('No hay presupuesto para imprimir');
        return;
    }

    const html = generarHTMLPresupuestoPrint();
    const ventana = window.open('', '', 'width=900,height=700');
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => ventana.print(), 250);
}

function generarHTMLPresupuestoPrint() {
    const pres = pacienteActual.presupuesto;
    const pac = pacienteActual.datosPersonales;

    let itemsHtml = '';
    let total = 0;

    pres.items.forEach(item => {
        const subtotal = item.cantidad * item.valor;
        total += subtotal;
        itemsHtml += `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.descripcion}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center; width: 80px;">${item.cantidad}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; width: 100px;">$${item.valor.toFixed(2)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; width: 100px; font-weight: bold;">$${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    let descuentoHtml = '';
    let totalFinal = total;
    if (pres.descuento && pres.descuento > 0) {
        const montoDesc = total * (pres.descuento / 100);
        totalFinal = total - montoDesc;
        descuentoHtml = `
            <tr>
                <td colspan="3" style="text-align: right; padding: 10px; font-weight: bold;">Descuento (${pres.descuento}%):</td>
                <td style="text-align: right; padding: 10px; color: #4CAF50;">-$${montoDesc.toFixed(2)}</td>
            </tr>
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Presupuesto - ${pres.numero}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    background: #f5f5f5;
                }
                .presupuesto {
                    background: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    max-width: 900px;
                    margin: 0 auto;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #A8D8EA;
                    padding-bottom: 20px;
                }
                .logo {
                    width: 100px;
                    height: auto;
                }
                .empresa-info {
                    text-align: right;
                }
                .empresa-info h2 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 24px;
                }
                .empresa-info p {
                    color: #666;
                    font-size: 13px;
                }
                .titulo {
                    text-align: center;
                    font-size: 28px;
                    font-weight: bold;
                    color: #A8D8EA;
                    margin: 30px 0;
                    text-transform: uppercase;
                }
                .info-presupuesto {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f9f9f9;
                    border-radius: 4px;
                }
                .info-section h4 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 14px;
                    text-transform: uppercase;
                    font-weight: bold;
                }
                .info-section p {
                    color: #666;
                    margin: 5px 0;
                    font-size: 13px;
                }
                .tabla-presupuesto {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 30px 0;
                }
                .tabla-presupuesto thead {
                    background: #A8D8EA;
                    color: #333;
                }
                .tabla-presupuesto th {
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                    border: 1px solid #ddd;
                }
                .tabla-presupuesto td {
                    padding: 10px;
                }
                .totales {
                    display: flex;
                    justify-content: flex-end;
                    margin: 20px 0;
                }
                .totales-box {
                    width: 350px;
                    border: 2px solid #A8D8EA;
                    border-radius: 4px;
                    padding: 15px;
                    background: #f5f9fc;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #ddd;
                    color: #666;
                }
                .total-final {
                    display: flex;
                    justify-content: space-between;
                    padding: 15px 0;
                    font-weight: bold;
                    font-size: 18px;
                    color: #A8D8EA;
                    border-top: 2px solid #A8D8EA;
                    margin-top: 10px;
                }
                .observaciones {
                    margin-top: 20px;
                    padding: 15px;
                    background: #fff5f7;
                    border-left: 4px solid #FFB6C1;
                    border-radius: 4px;
                }
                .observaciones h5 {
                    color: #333;
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                .observaciones p {
                    color: #666;
                    font-size: 13px;
                    white-space: pre-wrap;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #999;
                    font-size: 12px;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .presupuesto { box-shadow: none; border-radius: 0; }
                }
            </style>
        </head>
        <body>
            <div class="presupuesto">
                <div class="header">
                    <div style="width: 80px; height: 80px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999;">
                        [Logo ODONPEI]
                    </div>
                    <div class="empresa-info">
                        <h2>ODONPEI</h2>
                        <p>Odontología Pediátrica Inclusiva</p>
                        <p style="margin-top: 10px; color: #999; font-size: 12px;">Sistema de Gestión de Historiales Clínicos</p>
                    </div>
                </div>

                <div class="titulo">${pres.numero}</div>

                <div class="info-presupuesto">
                    <div class="info-section">
                        <h4>Datos del Paciente</h4>
                        <p><strong>${pac.nombre}</strong></p>
                        ${pac.telefono ? `<p>Teléfono: ${pac.telefono}</p>` : ''}
                        ${pac.domicilio ? `<p>Domicilio: ${pac.domicilio}</p>` : ''}
                        ${pac.edad ? `<p>Edad: ${pac.edad} años</p>` : ''}
                    </div>
                    <div class="info-section">
                        <h4>Información del Presupuesto</h4>
                        <p><strong>Fecha:</strong> ${new Date(pres.fecha).toLocaleDateString('es-AR')}</p>
                        ${pres.vigencia ? `<p><strong>Vigencia:</strong> ${new Date(pres.vigencia).toLocaleDateString('es-AR')}</p>` : ''}
                    </div>
                </div>

                <table class="tabla-presupuesto">
                    <thead>
                        <tr>
                            <th>Descripción del Servicio/Producto</th>
                            <th style="width: 80px; text-align: center;">Cantidad</th>
                            <th style="width: 100px; text-align: right;">Valor Unitario</th>
                            <th style="width: 100px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="totales">
                    <div class="totales-box">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                        ${descuentoHtml}
                        <div class="total-final">
                            <span>TOTAL:</span>
                            <span>$${totalFinal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                ${pres.observaciones ? `
                    <div class="observaciones">
                        <h5>Términos y Observaciones:</h5>
                        <p>${pres.observaciones}</p>
                    </div>
                ` : ''}

                <div class="footer">
                    <p>Presupuesto válido hasta ${pres.vigencia ? new Date(pres.vigencia).toLocaleDateString('es-AR') : 'consultar'}</p>
                    <p style="margin-top: 5px;">Generado por ODONPEI | Odontología Pediátrica Inclusiva</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ========== IMPRIMIR HISTORIA CLÍNICA COMPLETA ==========
function imprimirHistoriaCompleta() {
    if (!pacienteActual) {
        alert('No hay paciente para imprimir');
        return;
    }

    const html = generarHTMLHistoriaCompletaPrint();
    const ventana = window.open('', '', 'width=900,height=700');
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => ventana.print(), 250);
}

function generarHTMLHistoriaCompletaPrint() {
    const pac = pacienteActual;
    const trat = pac.tratamientos || {};
    const pres = pac.presupuesto || {};

    // Generar tabla del odontograma
    let odontogramaHTML = generarTablaOdontogramaPrint(pac.odontograma || {});

    // Generar sección de presupuesto si existe
    let presupuestoHTML = '';
    if (pres.items && pres.items.length > 0) {
        presupuestoHTML = generarSeccioPresupuestoPrint(pres);
    }

    // Datos personales
    const datosPersonales = pac.datosPersonales || {};

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Historia Clínica - ${datosPersonales.nombre}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    background: #f5f5f5;
                    line-height: 1.6;
                }
                .pagina {
                    background: white;
                    padding: 40px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    page-break-after: always;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #A8D8EA;
                    padding-bottom: 20px;
                }
                .empresa-info h2 {
                    color: #333;
                    margin-bottom: 5px;
                    font-size: 24px;
                }
                .empresa-info p {
                    color: #666;
                    font-size: 12px;
                }
                .titulo-pagina {
                    text-align: center;
                    font-size: 20px;
                    font-weight: bold;
                    color: #A8D8EA;
                    margin: 20px 0;
                    text-transform: uppercase;
                }
                .seccion {
                    margin: 25px 0;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #E0E0E0;
                }
                .seccion h3 {
                    color: #333;
                    font-size: 16px;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-left: 4px solid #A8D8EA;
                    padding-left: 10px;
                    text-transform: uppercase;
                }
                .datos-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .dato-item {
                    background: #f9f9f9;
                    padding: 10px;
                    border-radius: 4px;
                }
                .dato-label {
                    font-weight: bold;
                    color: #666;
                    font-size: 12px;
                    text-transform: uppercase;
                }
                .dato-valor {
                    color: #333;
                    margin-top: 3px;
                    word-break: break-word;
                }
                .texto-largo {
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 4px;
                    white-space: pre-wrap;
                    line-height: 1.5;
                    margin: 10px 0;
                }
                .odontograma-img {
                    width: 100%;
                    max-width: 800px;
                    margin: 20px auto;
                    display: block;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .tabla-odonto {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 11px;
                }
                .tabla-odonto td {
                    padding: 8px;
                    text-align: center;
                    border: 1px solid #ddd;
                }
                .tabla-odonto td.numero {
                    font-weight: bold;
                    background: #f0f0f0;
                }
                .tabla-odonto td.rojo {
                    background: #FF6B6B;
                    color: white;
                    font-weight: bold;
                }
                .tabla-odonto td.azul {
                    background: #4A90E2;
                    color: white;
                    font-weight: bold;
                }
                .tabla-odonto td.blanco {
                    background: white;
                }
                .leyenda {
                    display: flex;
                    gap: 20px;
                    margin: 15px 0;
                    flex-wrap: wrap;
                    font-size: 12px;
                }
                .leyenda-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .leyenda-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 3px;
                    border: 1px solid #ddd;
                }
                .presupuesto-tabla {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 12px;
                }
                .presupuesto-tabla thead {
                    background: #A8D8EA;
                }
                .presupuesto-tabla th,
                .presupuesto-tabla td {
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                .presupuesto-tabla td.numero {
                    text-align: right;
                }
                .totales-box {
                    width: 300px;
                    margin-left: auto;
                    margin-top: 15px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #ddd;
                    font-size: 12px;
                }
                .total-final {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    font-weight: bold;
                    font-size: 14px;
                    color: #A8D8EA;
                    border-top: 2px solid #A8D8EA;
                    margin-top: 10px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 11px;
                    color: #999;
                }
                @media print {
                    body { background: white; }
                    .pagina { box-shadow: none; page-break-after: always; }
                }
            </style>
        </head>
        <body>
            <!-- PÁGINA 1: DATOS Y HISTORIA CLÍNICA -->
            <div class="pagina">
                <div class="header">
                    <div style="width: 80px; height: 80px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999;">
                        [Logo ODONPEI]
                    </div>
                    <div class="empresa-info">
                        <h2>ODONPEI</h2>
                        <p>Odontología Pediátrica Inclusiva</p>
                        <p style="margin-top: 10px; color: #999; font-size: 11px;">Gestión de Historiales Clínicos</p>
                    </div>
                </div>

                <div class="titulo-pagina">Historia Clínica</div>

                <!-- DATOS PERSONALES -->
                <div class="seccion">
                    <h3>Datos Personales</h3>
                    <div class="datos-grid">
                        <div class="dato-item">
                            <div class="dato-label">Nombre Completo</div>
                            <div class="dato-valor">${datosPersonales.nombre || 'N/A'}</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-label">Alias/Apodo</div>
                            <div class="dato-valor">${datosPersonales.alias || 'N/A'}</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-label">Edad</div>
                            <div class="dato-valor">${datosPersonales.edad || 'N/A'} años</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-label">Fecha de Nacimiento</div>
                            <div class="dato-valor">${datosPersonales.fechaNacimiento || 'N/A'}</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-label">Domicilio</div>
                            <div class="dato-valor">${datosPersonales.domicilio || 'N/A'}</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-label">Teléfono de Contacto</div>
                            <div class="dato-valor">${datosPersonales.telefono || 'N/A'}</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-label">Obra Social</div>
                            <div class="dato-valor">${datosPersonales.obraSocial || 'N/A'}</div>
                        </div>
                        <div class="dato-item">
                            <div class="dato-label">N° Afiliado</div>
                            <div class="dato-valor">${datosPersonales.nAfiliado || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                <!-- HISTORIA CLÍNICA ESPECÍFICA -->
                ${pac.tipoHistoria === 'neurodivergente' ? generarHistoriaNeuroHTML(pac) : generarHistoriaOdontoHTML(pac)}

                <!-- TRATAMIENTOS -->
                ${trat.realizados || trat.propuesta ? `
                    <div class="seccion">
                        <h3>Tratamientos</h3>
                        ${trat.realizados ? `
                            <div>
                                <strong>Realizados:</strong>
                                <div class="texto-largo">${trat.realizados}</div>
                            </div>
                        ` : ''}
                        ${trat.propuesta ? `
                            <div>
                                <strong>Propuesta de Tratamiento:</strong>
                                <div class="texto-largo">${trat.propuesta}</div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>

            <!-- PÁGINA 2: ODONTOGRAMA -->
            <div class="pagina">
                <div class="titulo-pagina">Odontograma</div>

                <div class="seccion">
                    <h3>Estado Dental - Registrado: ${new Date().toLocaleDateString('es-AR')}</h3>

                    ${odontogramaHTML}

                    <div class="leyenda">
                        <div class="leyenda-item">
                            <div class="leyenda-color rojo" style="background: #FF6B6B;"></div>
                            <span>Prácticas Existentes</span>
                        </div>
                        <div class="leyenda-item">
                            <div class="leyenda-color azul" style="background: #4A90E2;"></div>
                            <span>Prácticas Requeridas</span>
                        </div>
                        <div class="leyenda-item">
                            <div class="leyenda-color blanco" style="background: white; border: 1px solid #ddd;"></div>
                            <span>Sin marcar</span>
                        </div>
                    </div>
                </div>
            </div>

            ${presupuestoHTML}

            <div class="pagina">
                <div class="footer">
                    <p>Documento generado por ODONPEI - Odontología Pediátrica Inclusiva</p>
                    <p>Fecha de impresión: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
                    <p>Este documento es confidencial y privado del paciente</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function generarHistoriaNeuroHTML(pac) {
    const ant = pac.antecedentes || {};
    const desafios = pac.desafios || {};

    return `
        <div class="seccion">
            <h3>Antecedentes Patológicos</h3>
            <div class="datos-grid">
                <div class="dato-item">
                    <div class="dato-label">Diagnóstico</div>
                    <div class="dato-valor">${ant.diagnostico || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Enfermedades Preexistentes</div>
                    <div class="dato-valor">${ant.enfermedadesPreexistentes || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Medicación</div>
                    <div class="dato-valor">${ant.medicacion || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Cirugías</div>
                    <div class="dato-valor">${ant.cirugias || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="seccion">
            <h3>Desafíos y Características</h3>
            <div class="datos-grid">
                <div class="dato-item">
                    <div class="dato-label">Comunicación y Lenguaje</div>
                    <div class="dato-valor">${desafios.comunicacion || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Conducta</div>
                    <div class="dato-valor">${desafios.conducta || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Desafíos Sensoriales</div>
                    <div class="dato-valor">${desafios.sensoriales || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Motricidad</div>
                    <div class="dato-valor">${desafios.motricidad || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Terapias</div>
                    <div class="dato-valor">${desafios.terapias || 'N/A'}</div>
                </div>
                <div class="dato-item">
                    <div class="dato-label">Escala de Frank</div>
                    <div class="dato-valor">${desafios.frank || 'N/A'}</div>
                </div>
            </div>
            ${desafios.leGusta ? `
                <div style="margin-top: 15px;">
                    <strong>¿Qué le gusta?</strong>
                    <div class="texto-largo">${desafios.leGusta}</div>
                </div>
            ` : ''}
        </div>
    `;
}

function generarHistoriaOdontoHTML(pac) {
    const carac = pac.caracteristicas || {};

    return `
        <div class="seccion">
            <h3>Características del Paciente</h3>
            ${carac.observaciones ? `
                <div>
                    <strong>Observaciones:</strong>
                    <div class="texto-largo">${carac.observaciones}</div>
                </div>
            ` : '<p>Sin observaciones registradas</p>'}
        </div>
    `;
}

function generarTablaOdontogramaPrint(odontograma) {
    const colorRojo = '#FF6B6B';
    const colorAzul = '#4A90E2';
    const colorBlanco = '#FFFFFF';
    const colorBorde = '#333333';

    function obtenerColor(valor) {
        if (valor === 'rojo') return colorRojo;
        if (valor === 'azul') return colorAzul;
        return colorBlanco;
    }

    function generarDiente(numero, dato) {
        const tamanio = 40;
        const zona = tamanio / 3;
        const d = dato || { centro: null, norte: null, sur: null, este: null, oeste: null };

        let html = `
            <div style="position: relative; width: ${tamanio}px; height: ${tamanio + 15}px; margin: 5px; display: inline-block; text-align: center;">
                <div style="position: relative; width: ${tamanio}px; height: ${tamanio}px;">
                    <!-- Centro -->
                    <div style="position: absolute; left: ${zona}px; top: ${zona}px; width: ${zona}px; height: ${zona}px; background: ${obtenerColor(d.centro)}; border: 1px solid ${colorBorde};"></div>
                    <!-- Norte -->
                    <div style="position: absolute; left: ${zona}px; top: 0; width: ${zona}px; height: ${zona}px; background: ${obtenerColor(d.norte)}; border: 1px solid ${colorBorde};"></div>
                    <!-- Sur -->
                    <div style="position: absolute; left: ${zona}px; top: ${zona * 2}px; width: ${zona}px; height: ${zona}px; background: ${obtenerColor(d.sur)}; border: 1px solid ${colorBorde};"></div>
                    <!-- Este -->
                    <div style="position: absolute; left: ${zona * 2}px; top: ${zona}px; width: ${zona}px; height: ${zona}px; background: ${obtenerColor(d.este)}; border: 1px solid ${colorBorde};"></div>
                    <!-- Oeste -->
                    <div style="position: absolute; left: 0; top: ${zona}px; width: ${zona}px; height: ${zona}px; background: ${obtenerColor(d.oeste)}; border: 1px solid ${colorBorde};"></div>
                </div>
                <div style="font-weight: bold; font-size: 10px; margin-top: 3px;">${numero}</div>
            </div>
        `;
        return html;
    }

    let html = `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #DDD; border-radius: 5px;">
            <h3 style="text-align: center; margin-bottom: 20px;">ODONTOGRAMA</h3>

            <div style="margin-bottom: 15px;">
                <strong>Dientes Temporales Superiores</strong>
                <div style="text-align: center;">
                    ${['55', '54', '53', '52', '51', '61', '62', '63', '64', '65']
                        .map(num => generarDiente(num, odontograma[num]))
                        .join('')}
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <strong>Dientes Permanentes Superiores</strong>
                <div style="text-align: center;">
                    ${[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
                        .map(num => generarDiente(num, odontograma[num]))
                        .join('')}
                </div>
            </div>

            <div style="border-top: 2px solid #999; margin: 15px 0;"></div>

            <div style="margin-bottom: 15px;">
                <strong>Dientes Permanentes Inferiores</strong>
                <div style="text-align: center;">
                    ${[31, 32, 33, 34, 35, 36, 37, 38, 48, 47, 46, 45, 44, 43, 42, 41]
                        .map(num => generarDiente(num, odontograma[num]))
                        .join('')}
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <strong>Dientes Temporales Inferiores</strong>
                <div style="text-align: center;">
                    ${['71', '72', '73', '74', '75', '85', '84', '83', '82', '81']
                        .map(num => generarDiente(num, odontograma[num]))
                        .join('')}
                </div>
            </div>

            <div style="margin-top: 20px; padding: 10px; background: #F5F5F5; border-radius: 3px;">
                <strong>Leyenda:</strong>
                <span style="display: inline-block; margin: 0 15px;"><span style="display: inline-block; width: 15px; height: 15px; background: #FF6B6B; border: 1px solid #333; margin-right: 5px;"></span>Rojo = Prácticas Existentes</span>
                <span style="display: inline-block; margin: 0 15px;"><span style="display: inline-block; width: 15px; height: 15px; background: #4A90E2; border: 1px solid #333; margin-right: 5px;"></span>Azul = Prácticas Requeridas</span>
            </div>
        </div>
    `;

    return html;
}

function generarSeccioPresupuestoPrint(pres) {
    let itemsHtml = '';
    let total = 0;

    pres.items.forEach(item => {
        const subtotal = item.cantidad * item.valor;
        total += subtotal;
        itemsHtml += `
            <tr>
                <td>${item.descripcion}</td>
                <td class="numero">${item.cantidad}</td>
                <td class="numero">$${item.valor.toFixed(2)}</td>
                <td class="numero" style="font-weight: bold;">$${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    let descuentoHtml = '';
    let totalFinal = total;
    if (pres.descuento && pres.descuento > 0) {
        const montoDesc = total * (pres.descuento / 100);
        totalFinal = total - montoDesc;
        descuentoHtml = `
            <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">Descuento (${pres.descuento}%):</td>
                <td class="numero" style="color: #4CAF50;">-$${montoDesc.toFixed(2)}</td>
            </tr>
        `;
    }

    return `
        <div class="pagina">
            <div class="titulo-pagina">Presupuesto</div>

            <div class="seccion">
                <h3>Presupuesto N° ${pres.numero}</h3>
                <div class="datos-grid">
                    <div class="dato-item">
                        <div class="dato-label">Fecha</div>
                        <div class="dato-valor">${new Date(pres.fecha).toLocaleDateString('es-AR')}</div>
                    </div>
                    <div class="dato-item">
                        <div class="dato-label">Vigencia</div>
                        <div class="dato-valor">${pres.vigencia ? new Date(pres.vigencia).toLocaleDateString('es-AR') : 'A consultar'}</div>
                    </div>
                </div>

                <table class="presupuesto-tabla">
                    <thead>
                        <tr>
                            <th>Descripción</th>
                            <th style="width: 80px;">Cantidad</th>
                            <th style="width: 100px;">Valor Unitario</th>
                            <th style="width: 100px;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="totales-box">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    ${descuentoHtml}
                    <div class="total-final">
                        <span>TOTAL:</span>
                        <span>$${totalFinal.toFixed(2)}</span>
                    </div>
                </div>

                ${pres.observaciones ? `
                    <div style="margin-top: 20px;">
                        <strong>Observaciones:</strong>
                        <div class="texto-largo">${pres.observaciones}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}
