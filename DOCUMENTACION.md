# ODONPEI — Documentación Completa del Proyecto

## ¿Qué es ODONPEI?

Sistema web de gestión de historiales clínicos odontológicos pediátricos para pacientes con necesidades especiales. Diseñado para la odontopediatra del consultorio, reemplaza la papelería física y permite trabajar desde cualquier dispositivo con sincronización automática.

**URL en producción:** https://lanarito.github.io/ODONPEI/  
**Repositorio GitHub:** https://github.com/lanarito/ODONPEI  
**Hosting:** GitHub Pages (gratuito, automático al hacer push a `main`)  
**Base de datos:** Firebase Firestore (gratuito, sincronización en la nube)

---

## Stack Tecnológico

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- **Base de datos local:** localStorage del navegador (cache rápido)
- **Base de datos en la nube:** Firebase Firestore (proyecto: `odonpei`)
- **Hosting:** GitHub Pages
- **Gráficos:** Canvas API (odontograma modo Paint)

> **Regla importante:** No usar frameworks ni npm. Todo debe funcionar directamente en el navegador sin build step, ya que el hosting es GitHub Pages estático.

---

## Estructura de Archivos

```
ODONPEI/
├── index.html              # Estructura principal de la app
├── css/
│   └── styles.css          # Todos los estilos (colores pasteles, responsive)
├── js/
│   ├── firebase-config.js  # Configuración Firebase + funciones Firestore (ES Module)
│   ├── storage.js          # Gestión localStorage + sync Firebase para PACIENTES
│   ├── app.js              # Lógica principal: login, navegación, pacientes, reloj, contador
│   ├── formularios.js      # Generación dinámica de formularios de historia clínica
│   ├── odontograma.js      # Canvas modo Paint para dibujar el odontograma
│   ├── tratamientos.js     # Tratamientos, presupuestos e impresión
│   └── turnos.js           # Turnero digital con vista semanal + sync Firebase
├── ODONPEI 2.png           # Logo principal (puzzle de dientes coloridos)
├── Muela.png               # Imagen de muela (usada en bienvenida y marca de agua)
└── DOCUMENTACION.md        # Este archivo
```

---

## Login y Sesión

- **Usuario único:** `odonpei` (pre-cargado en el input, no hay que escribirlo)
- **Sin contraseña** por diseño (consultorio privado, acceso por URL)
- La sesión se guarda en `sessionStorage` → se mantiene mientras el tab esté abierto
- Al cerrar el tab o hacer "Salir", vuelve al login

**Archivo:** `js/app.js` — funciones `hacerLogin()`, `verificarSesion()`, `cerrarSesion()`

---

## Navbar (barra superior)

Estructura de izquierda a derecha:
1. **Reloj digital** — hora en formato 24h (HH:MM:SS) + fecha corta. Actualiza cada segundo.
2. **Logo ODONPEI** centrado — imagen + links de navegación debajo
3. **Contador mensual de atenciones** — número del mes actual con botones `−` y `+`

Los tres elementos son transparentes (sin fondo), integrados al degradado del navbar.

**Navegación:** Inicio | Pacientes | Turnos | Nuevo Paciente | ODONPEI (usuario) | Salir

---

## Páginas / Secciones

### 1. Inicio (`pagina-inicio`)
- Bienvenida con logo de muela
- Fondo decorativo: 7 niños coloridos en SVG (fijo en todas las páginas)
- Welcome card semitransparente (efecto vidrio/blur)
- Botones rápidos: Ver Pacientes / Crear Nuevo Paciente

### 2. Pacientes (`pagina-pacientes`)
- Muestra los **5 pacientes más recientes** ordenados por fecha
- Si hay más, indica cuántos quedan y sugiere usar el buscador
- **Buscador** en tiempo real por nombre, alias o edad
- Cada tarjeta muestra: nombre, alias, edad, tipo de historia, fecha, cantidad de fotos

### 3. Turnos (`pagina-turnos`)
- Vista semanal Lunes a Sábado, franjas horarias de **15:00 a 20:00** cada 30 minutos
- Navegación entre semanas: ← Anterior / Hoy / Siguiente →
- Día actual resaltado en azul
- **Sincroniza con Firebase** al abrir la sección

#### Crear turno
- Click en cualquier celda del calendario o botón "+ Nuevo Turno"
- Campos: **Nombre** (libre, sin requerir paciente existente), **Celular**, Fecha, Hora, Duración, Notas
- El nombre se ve directamente en la celda del calendario

#### Estados de turno (selector al hacer click en el turno)
| Letra | Estado | Color |
|-------|--------|-------|
| P | Pendiente | 🟡 Amarillo |
| C | Confirmado | 🔵 Azul |
| X | Cancelado | 🔴 Rojo |
| R | Reprogramado | 🟠 Naranja |
| A | Asistió | 🟢 Verde |
| NA | No Asistió | ⚫ Gris |

Cambiar estado → botón **Guardar** para confirmar.

### 4. Nuevo Paciente / Editar Paciente (`pagina-nuevo-paciente`)
Selector de tipo de historia clínica:
- **Odontopediátrica** (default)
- **Neurodivergente**

#### Datos Personales (comunes a ambos tipos)
- Apellido y Nombre *
- ¿Cómo le gusta que lo llamen? (alias)
- Edad *
- Fecha de Nacimiento
- Domicilio
- Nombre de Madre/Padre
- Teléfono de Contacto
- Obra Social
- N° Afiliado
- DNI

#### Historia Odontopediátrica
- Observaciones del paciente

#### Historia Neurodivergente
- Diagnóstico
- Enfermedades Preexistentes
- Medicación
- Cirugías
- Comunicación y Lenguaje
- Conducta (Nivel de Apoyo)
- Desafíos Sensoriales
- Desafíos en la Motricidad
- Terapias que Realiza
- Escala de Frank
- ¿Qué le gusta?

#### Tratamientos (sección común)
- Tratamientos Realizados (textarea)
- Propuesta de Tratamiento (textarea)

#### Odontograma (modo Paint)
Herramientas disponibles:
- 🔴 **Rojo** — tratamientos existentes
- 🔵 **Azul** — tratamientos requeridos
- **✕ Ausente** — pieza dentaria ausente (dibuja una X)
- **🧹 Borrador** — borra lo pintado
- **🗑 Limpiar todo** — limpia el canvas completo (pide confirmación)

Numeración FDI (internacional):
- Permanentes superiores: 18–11 | 21–28
- Permanentes inferiores: 48–41 | 31–38
- Temporales superiores: 55–51 | 61–65
- Temporales inferiores: 85–81 | 71–75

El odontograma se guarda como imagen PNG (base64) junto con el paciente.

### 3b. Turnos — Funciones adicionales

**Turnos de hoy** — al abrir la sección Turnos aparece automáticamente arriba una lista con todos los turnos del día actual: hora, nombre, celular y estado. Si no hay turnos dice "Sin turnos para hoy". Se actualiza cuando se cambia el estado de un turno.

**Buscador de turnos** — campo de texto encima del calendario. Al escribir un nombre muestra todos los turnos de esa persona en cualquier fecha, ordenados cronológicamente. Útil para ver el historial de visitas de un paciente tentativo o existente.

**Scroll horizontal** — el calendario semanal tiene scroll horizontal en mobile para que no se aplaste la grilla.

### 5. Detalle del Paciente (`pagina-detalle-paciente`)
Pestañas:
- **Historia Clínica** — muestra todos los datos + odontograma
- **Tratamientos** — lista de tratamientos con fecha, puede agregar nuevos
- **Presupuesto** — presupuesto editable con ítems, valores, descuento e impresión
- **Fotos (Evolución)** — galería con miniaturas reales, ordenadas por fecha
- **Archivos** — PDFs y documentos; las imágenes muestran miniatura, los demás muestran ícono

Botones: ← Atrás | 💰 Presupuesto | 🖨️ Imprimir Historia | ✏️ Editar | 🗑️ Eliminar

---

## Presupuesto e Impresión

### Presupuesto
- Número de presupuesto, fecha, vigencia
- Ítems: descripción, cantidad, valor unitario → subtotal automático
- Descuento porcentual opcional
- Observaciones / términos

### Impresión del presupuesto
Genera una ventana de impresión con:
- Logo ODONPEI (Muela.png) en el encabezado
- **Muela como marca de agua** (50% del fondo, opacidad 8%)
- Tabla de ítems, totales, datos del paciente

### Impresión de historia clínica completa
Incluye todos los datos del paciente, tratamientos, odontograma y presupuesto si existe.
El odontograma en la impresión se muestra como imagen PNG (la misma que ve la doctora en pantalla).

> **Fix aplicado:** antes la impresión intentaba leer el odontograma como objeto por diente y siempre salía en blanco. Corregido en commit `7217eac`.

---

## Sistema de Almacenamiento

### Arquitectura dual (localStorage + Firebase)
Todos los datos se guardan primero en `localStorage` (instantáneo) y luego se sincronizan con Firebase Firestore (en la nube).

```
Acción del usuario
      ↓
localStorage (inmediato, local)
      ↓
Firebase Firestore (async, nube compartida)
```

### Sincronización al iniciar + en tiempo real

Al cargar la app (1.5 segundos después del load), para pacientes y turnos:
1. **Primero sube** los datos locales que todavía no están en Firebase (una sola vez)
2. **Después activa** un listener `onSnapshot` que SOLO muestra los cambios (nunca sube)

Esta separación es clave: **el listener nunca sube datos**, porque si lo hiciera dispararía el propio listener de nuevo creando un **bucle infinito** que satura Firebase y genera duplicados (bug que ocurrió y se corrigió).

Cualquier modificación desde cualquier dispositivo (agregar paciente, modificar turno, cambiar contador) se propaga automáticamente a todos los dispositivos que tengan la página abierta, sin recargar.

### IDs idempotentes (anti-duplicados)
Los turnos se guardan en Firebase con `setDoc` usando el **id local como id del documento** (`setDoc(doc(db,"turnos", turno.id), turno)`). Así, guardar el mismo turno muchas veces **sobreescribe el mismo documento** en lugar de crear copias. Esto elimina de raíz los duplicados.

### Botones de mantenimiento (página Turnos)
- **🔄 Recuperar** — sube a Firebase todos los turnos que estén en el dispositivo actual. Útil si un dispositivo tiene turnos locales que no llegaron a la nube.
- **🧹 Limpiar duplicados** — deja un solo turno de cada uno y elimina los duplicados de Firebase. Hacerlo en UN solo dispositivo con los demás cerrados.

### Claves localStorage
| Clave | Contenido |
|-------|-----------|
| `ODONPEI_PACIENTES` | Array de todos los pacientes con sus historias |
| `ODONPEI_TURNOS` | Array de todos los turnos |
| `ODONPEI_ATENCIONES` | Objeto `{ 'YYYY-MM': N }` con conteo mensual |
| `odonpei_usuario` | Usuario logueado (sessionStorage) |

### Colecciones y documentos Firebase
| Colección / Documento | Contenido |
|-----------------------|-----------|
| `pacientes` (colección) | Misma estructura que localStorage, con `onSnapshot` activo |
| `turnos` (colección) | Misma estructura que localStorage, con `onSnapshot` activo |
| `config/atenciones` (documento) | Objeto `{ 'YYYY-MM': N }` con contador mensual, con `onSnapshot` activo |

### Estructura de un paciente
```javascript
{
  id: "timestamp",           // ID local
  firebaseId: "abc123",      // ID en Firestore
  fechaCreacion: "ISO date",
  tipoHistoria: "odontopediatrica" | "neurodivergente",
  datosPersonales: {
    nombre, alias, edad, fechaNacimiento, domicilio,
    nombrePadre, telefono, obraSocial, nAfiliado, dni
  },
  // Solo neurodivergente:
  antecedentes: { diagnostico, enfermedadesPreexistentes, medicacion, cirugias },
  desafios: { comunicacion, conducta, sensoriales, motricidad, terapias, frank, leGusta },
  // Solo odontopediatrica:
  caracteristicas: { observaciones },
  tratamientos: { realizados, propuesta },
  odontograma: "data:image/png;base64,...",
  fotos: [{ id, nombre, data, fecha }],
  archivos: [{ id, nombre, tipo, data, fecha, tamaño }],
  presupuesto: { numero, fecha, vigencia, items, descuento, observaciones }
}
```

### Estructura de un turno
```javascript
{
  id: "timestamp",
  firebaseId: "abc123",
  pacienteNombre: "Apellido Nombre",   // Texto libre
  celular: "11 1234-5678",
  fecha: "YYYY-MM-DD",
  hora: "HH:MM",
  duracion: 30 | 60 | 90,             // minutos
  notas: "texto libre",
  estado: "pendiente|confirmado|cancelado|reprogramado|asistio|noasistio",
  fechaCreacion: "ISO date"
}
```

---

## ⚠️ Reglas de Seguridad de Firebase (CRÍTICO — LEER)

**El problema más grave que tuvo el sistema fue por acá.** Cuando se crea Firestore "en modo prueba", las reglas de seguridad traen un **candado con fecha de vencimiento de 30 días**:

```
allow read, write: if request.time < timestamp.date(2026, 6, 19);
```

Cuando llega esa fecha, **Firebase bloquea TODAS las lecturas y escrituras** con el error `permission-denied: Missing or insufficient permissions`. El síntoma: los datos dejan de sincronizar entre dispositivos y cada uno solo ve lo que tiene guardado localmente. Es silencioso y traicionero porque la app parece funcionar.

### Regla correcta (sin vencimiento)
En la consola de Firebase → Firestore Database → pestaña **Reglas**, debe decir:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

`if true;` **no tiene fecha → nunca se vence**. Después de editar hay que apretar **Publicar**.

> **Cómo detectar este problema en el futuro:** abrir la consola del navegador (F12 → Console). Si aparecen errores rojos que dicen `permission-denied` o `Missing or insufficient permissions`, las reglas se vencieron → reemplazarlas por la regla de arriba.

---

## Firebase — Configuración

**Proyecto:** `odonpei`  
**Archivo:** `js/firebase-config.js` (ES Module con `type="module"`)

> **Importante:** Como es un ES Module, sus funciones NO son globales automáticamente. Por eso al final del archivo se asignan a `window.*` para que `storage.js` y `turnos.js` (scripts normales) puedan usarlas.

```javascript
window.guardarEnFirestore             // pacientes — CRUD
window.obtenerDesdePacientesFirestore
window.actualizarEnFirestore
window.eliminarDeFirestore
window.sincronizarEnTiempoReal        // pacientes — listener onSnapshot en tiempo real
window.guardarTurnoEnFirestore        // turnos — CRUD
window.obtenerTurnosDesdeFirestore
window.actualizarTurnoEnFirestore
window.eliminarTurnoDeFirestore
window.sincronizarTurnosEnTiempoReal  // turnos — listener onSnapshot en tiempo real
window.guardarContadorEnFirestore     // contador mensual
window.obtenerContadorDesdeFirestore
window.escucharContadorEnFirestore    // contador — listener onSnapshot en tiempo real
```

---

## Contador Mensual de Atenciones

- Se incrementa manualmente con el botón `+` en el navbar
- Se decrementa con `−` (no baja de 0)
- Se reinicia automáticamente cada mes (clave por mes: `YYYY-MM`)
- El último día del mes muestra el mensaje: "Total de atenciones de [mes]: N"
- Los datos se guardan en localStorage **y en Firebase** (documento `config/atenciones`)
- **Sincronización en tiempo real** con `onSnapshot` — si la señora presiona `+` en la tablet, el número se actualiza automáticamente en la notebook sin recargar

---

## Fondo Decorativo (Niños Coloridos)

SVG inline con 7 figuras de niños en posición fija en el fondo de todas las páginas:
- Colores: violeta, verde, rojo, amarillo, azul, rosa, naranja
- Opacidad 55%, `pointer-events: none` (no interfiere con clicks)
- Con sombras/reflejo debajo de cada figura
- `z-index: 0` — el contenido siempre queda encima

---

## Odontograma — Comportamiento Correcto

### Al crear/editar un paciente
1. El canvas se inicializa con `iniciarOdontograma('odontograma-canvas', datosGuardados)`
2. Se dibuja la grilla de dientes con `dibujarFondo(canvas)`
3. Si hay imagen guardada (base64), se superpone sobre la grilla
4. El usuario pinta libremente con mouse o touch
5. Al hacer **Guardar Paciente**, se llama a `obtenerDatosOdontogramaDelCanvas()` que ejecuta `canvas.toDataURL('image/png')` y guarda la imagen completa

### Al ver la historia clínica (solo lectura)
1. Se crea un canvas con id `odontograma-canvas-detalle`
2. Se fijan dimensiones 900×380
3. Se dibuja el fondo con `dibujarFondo(canvas)`
4. Si el paciente tiene odontograma guardado (string base64), se dibuja encima con `drawImage`
5. **No tiene eventos de mouse** — es solo visualización

### Bug conocido y resuelto
El guardado usaba `canvas.datosOdontograma` (propiedad inexistente) en lugar de `canvas.toDataURL()`. Corregido en commit `59cc58c`. Los pacientes guardados antes de esa corrección tienen el odontograma vacío — hay que entrar a Editar, pintar nuevamente y Guardar.

---

## Tags de Restauración (Git)

| Tag | Descripción |
|-----|-------------|
| `v1.0-estable` | Diseño aprobado, sin turnero |
| `v1.1-turnero` | Turnero completo, antes del fix de odontograma |

Para volver a un punto: `git checkout v1.0-estable`

### Backups locales
- `c:\Github repos\ODONPEI_backup_2026-05-21.zip` — v1.0
- `c:\Github repos\ODONPEI_backup_2026-05-21_v1.1.zip` — v1.1

---

## Historial de Cambios Importantes

| Commit | Cambio |
|--------|--------|
| `0d806a5` | Botón Limpiar duplicados + normalización de ids de turnos |
| `aeb1e3c` | Sync robusto: subir local-only una vez al cargar, listener solo muestra |
| `94712f0` | **Fix raíz duplicados:** `setDoc` por id (idempotente) en turnos |
| `e597d94` | Fix bucle infinito en `onSnapshot` (separar subida de visualización) |
| **REGLAS** | **Firebase: candado vencido el 19/06 reemplazado por `if true;` (sin vencimiento)** |
| `7217eac` | **Auditoría completa:** sync en tiempo real para pacientes, contador y odontograma en impresión |
| `9452a47` | **Fix:** turnos sincronizan en tiempo real con `onSnapshot` (antes solo al abrir la página) |
| `edad232` | Contador de atenciones sincronizado con Firebase — compartido entre dispositivos |
| `5bf6eba` | Turnos del día, buscador de turnos, responsive móvil completo |
| `59cc58c` | **Fix crítico:** odontograma se guarda correctamente como PNG |
| `d239f6e` | Odontograma visible en vista detalle del paciente |
| `82c1b7a` | Turnos: estados Asistió/No Asistió; formulario: Apellido y Nombre |
| `b1a0cf0` | Turnos: horario 15-20, sync Firebase, botón Guardar |
| `e993342` | Turnos: estados P/C/X/R con colores e iniciales |
| `2b4f9ff` | Turnero digital completo con vista semanal |
| `952a957` | Navbar: reloj izq, logo centro, contador der, transparentes |
| `a46d090` | Fix Firebase: funciones expuestas a window.* |

---

## Cómo Hacer Deploy

Cualquier `git push` a la rama `main` actualiza automáticamente el sitio en GitHub Pages.  
El sitio tarda **2-3 minutos** en reflejar los cambios.  
Para ver los cambios sin caché: **Ctrl+Shift+R** en el navegador.

---

## Responsive / Móvil

El sitio está optimizado para celular y tablet. Breakpoints:

### 768px (tablet / landscape móvil)
- Navbar: reloj y contador se achican, logo y links se centran
- Formularios: columna única
- Pacientes: 2 columnas
- Calendario: scroll horizontal, columnas mínimo 80px
- Modal: ancho 96%, padding reducido

### 480px (celular)
- Navbar más compacto (reloj 14px, contador 18px)
- Pacientes: 1 columna
- Datos personales: 1 columna forzada
- Calendario: columnas mínimo 60px, scroll horizontal
- Container: padding 12px

Para recargar cambios en mobile: Chrome → menú 3 puntos → Actualizar, o cerrar y reabrir el navegador.

---

## 🔧 Diagnóstico Rápido (si algo no sincroniza)

Si los datos no aparecen en todos los dispositivos, seguir este orden:

1. **Abrir consola del navegador** (F12 → pestaña Console) en el dispositivo que falla
2. **Buscar errores rojos:**
   - `permission-denied` / `Missing or insufficient permissions` → **las reglas de Firebase se vencieron**. Ir a la consola de Firebase → Firestore → Reglas → poner `if true;` → Publicar. (Ver sección "Reglas de Seguridad de Firebase")
   - `Firebase conectado a odonpei` (verde) y `Cargados N pacientes` → la conexión está OK
3. **Verificar en la consola de Firebase** (Firestore → Datos) que las colecciones `pacientes`, `turnos` y el documento `config/atenciones` tengan datos
4. Si un dispositivo tiene turnos que no subieron: abrir Turnos → botón **🔄 Recuperar**
5. Si hay turnos duplicados: abrir Turnos en UN dispositivo (los demás cerrados) → botón **🧹 Limpiar duplicados**

### Lección aprendida (junio 2026)
El sistema estuvo ~10 días sin sincronizar porque las reglas de Firebase se vencieron el 19/06 sin que nadie lo notara. Cada dispositivo siguió funcionando con su copia local, pero los datos no se compartían. Algunos turnos cargados en esos días, que solo vivían en un dispositivo, se perdieron al recargar. **Moraleja:** las reglas con fecha (`timestamp.date(...)`) son una bomba de tiempo — usar siempre `if true;` o reglas sin vencimiento.

---

## Ideas Pendientes / Futuras Mejoras

- Integración con Google Calendar (Opción A del turnero)
- Agregar más usuarios al sistema de login (actualmente solo "odonpei")
- Notificaciones/recordatorios de turnos
