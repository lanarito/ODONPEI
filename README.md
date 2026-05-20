# 🦷 ODONPEI - Sistema de Historiales Clínicos Odontopediátricos

Sistema de gestión digital de historiales clínicos para **Odontología Pediátrica Inclusiva**.

## ✨ Características

### 📋 Dos tipos de Historias Clínicas
- **Neurodivergente**: Para pacientes neurodivergentes con secciones para:
  - Antecedentes patológicos y medicación
  - Desafíos de comunicación, conducta y sensoriales
  - Terapias y Escala de Frank
  - Preferencias y gustos del paciente

- **Odontopediátrica**: Formulario simplificado para odontología pediátrica

### 🦷 Odontograma Interactivo
- Canvas con dientes de todas las denticiones (permanentes y temporales)
- Cada diente tiene 5 zonas (centro + 4 bordes)
- Coloreo interactivo:
  - **Rojo**: Prácticas existentes
  - **Azul**: Prácticas requeridas
- Click para ciclar entre colores

### 💊 Sección de Tratamientos
- **Tratamientos Realizados**: Registro detallado de tratamientos completados
- **Propuesta de Tratamiento**: Plan de tratamiento futuro con descripción completa

### 💰 Presupuestos
- Crear presupuestos profesionales con ítems
- Agregar cantidad y valor unitario (se calcula automáticamente)
- Aplicar descuentos en porcentaje
- Imprimir presupuesto con:
  - Logo y datos de ODONPEI
  - Datos del paciente
  - Tabla de servicios detallada
  - Resumen de totales
  - Observaciones y términos

### 📄 Impresión Completa
- **Imprimir Historia Clínica Completa** con:
  - Datos personales del paciente
  - Historia clínica (según tipo: neurodivergente u odontopediátrica)
  - Tratamientos realizados y propuestos
  - Odontograma con números de dientes (izquierda/derecha)
  - Presupuesto (si existe)
  - Múltiples páginas profesionales
  - Formato listo para presentar al cliente

### 📷 Galería Fotográfica
- Línea de tiempo de fotos de evolución del paciente
- Ver evolución visual de tratamientos
- Organizado por fecha

### 📎 Gestión de Archivos
- Subir informes, radiografías panorámicas y documentos
- Descargar y eliminar archivos
- Soporte para PDF, Word, imágenes

### 🎨 Diseño
- Interfaz minimalista con colores pasteles
- Responsive (funciona en móvil)
- Logo de ODONPEI integrado
- Tema amigable y profesional

---

## 🚀 Cómo Usar

### Opción 1: Abrir Directamente en Navegador
```
Abre: c:\Github repos\ODONPEI\index.html
```
En tu navegador favorito (Chrome, Firefox, Edge, Safari)

### Opción 2: Usar Servidor Local (Recomendado)
```powershell
cd "c:\Github repos\ODONPEI"
& ".\start-server.ps1"
```
Luego abre: `http://localhost:8000/`

---

## 📖 Guía de Uso

### 1️⃣ Crear un Nuevo Paciente
1. Click en "Nuevo Paciente"
2. Selecciona tipo de historia clínica (Neurodivergente u Odontopediátrica)
3. Completa datos personales
4. Rellena campos específicos según el tipo
5. Agrega tratamientos (opcional)
6. Colorea el odontograma según corresponda
7. Click "Guardar Paciente"

### 2️⃣ Trabajar con Historias Clínicas
- **Ver**: Click en la tarjeta del paciente
- **Editar**: Click en "Editar" en la página del paciente
- Ver/editar tratamientos en el tab "Tratamientos"

### 3️⃣ Crear Presupuestos
1. En la página del paciente, click tab "Presupuesto"
2. Click "+ Nuevo Presupuesto"
3. Agrega ítems:
   - Descripción del servicio
   - Cantidad
   - Valor unitario
4. Aplica descuento si es necesario
5. Agrega observaciones/términos
6. Click "Guardar Presupuesto"
7. Click "Imprimir" para ver/imprimir el presupuesto

### 4️⃣ Fotos y Evolución
1. Tab "Fotos" en la página del paciente
2. Click "+ Agregar Foto"
3. Selecciona fotos (puedes agregar varias)
4. Se ordenan automáticamente por fecha
5. Perfecto para ver evolución del paciente

### 5️⃣ Odontograma
- Haz **click en cada zona** del diente para colorear
- Primer click: Rojo
- Segundo click: Azul
- Tercer click: Sin color
- Los cambios se guardan automáticamente

---

## 🔐 Almacenamiento

Todo se guarda en **localStorage del navegador**:
- ✅ No requiere servidor
- ✅ No requiere conexión a internet (después de la carga inicial)
- ✅ Datos privados en tu dispositivo
- ⚠️ Datos se pierden si limpias el cache del navegador

### Exportar/Importar Datos
Los datos se almacenan en localStorage. Para hacer backup:
1. Abre DevTools (F12 en el navegador)
2. Console → `exportarDatos()` 
3. Se descargará archivo JSON con todos los pacientes

---

## 🎨 Colores

| Color | Uso |
|-------|-----|
| Azul Pastel (#A8D8EA) | Primario, odontograma requerido |
| Rosa Pastel (#FFB6C1) | Secundario |
| Verde Pastel (#B5E7A0) | Éxito |
| Amarillo Pastel (#FFFACD) | Áreas de upload |
| Rojo (#FF6B6B) | Prácticas existentes en odontograma |

---

## 📋 Estructura de Datos

Cada paciente contiene:
```javascript
{
  id: "timestamp",
  tipoHistoria: "odontopediatrica" | "neurodivergente",
  datosPersonales: { nombre, alias, edad, fechaNacimiento, ... },
  antecedentes: { diagnostico, medicacion, ... },     // Solo neurodivergente
  desafios: { comunicacion, conducta, sensoriales, ... }, // Solo neurodivergente
  caracteristicas: { observaciones },                  // Solo odontopediátrica
  tratamientos: { realizados, propuesta },
  odontograma: { 11: { centro: "rojo", norte: null, ... }, ... },
  presupuesto: { numero, fecha, items: [], descuento, ... },
  fotos: [{ id, nombre, data, fecha }, ...],
  archivos: [{ id, nombre, tipo, data, fecha }, ...]
}
```

---

## 🐛 Troubleshooting

### No se cargan las imágenes del logo
- Asegúrate que `ODONPEI 2.png` está en la raíz de la carpeta
- Actualiza la página (Ctrl+F5)

### Los datos se perdieron
- Los datos en localStorage pueden eliminarse si:
  - Limpias el cache del navegador
  - Desinstales el navegador
  - Activas "borrar datos al cerrar"
- **Solución**: Hace backup regulares exportando los datos

### El presupuesto no se abre para imprimir
- Asegúrate de haber creado primero un presupuesto
- Revisa que la ventana pop-up no esté bloqueada

### Las fotos no se suben
- Verifica que el tamaño del archivo no sea muy grande
- Intenta con JPEG en lugar de PNG
- Actualiza el navegador

---

## 🔄 Próximas Mejoras Sugeridas

- [ ] Backend Node.js + MongoDB para almacenamiento en cloud
- [ ] Sincronización entre dispositivos
- [ ] Envío de presupuestos por email
- [ ] Exportación de historia clínica a PDF
- [ ] Notas/observaciones con timestamps
- [ ] Sistema de turnos y recordatorios
- [ ] Integración con calendario

---

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al desarrollador.

---

**Versión**: 1.0  
**Última actualización**: Mayo 2026  
**Autor**: Sistema de Gestión ODONPEI
