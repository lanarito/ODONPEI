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
│   ├── turnos.js           # Turnero digital con vista semanal + sync Firebase
│   ├── chat.js             # Chat interno en tiempo real entre estaciones (Firebase)
│   └── recordatorios.js    # Recordatorios de turnos por WhatsApp (un clic)
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
- Teléfono de Contacto (+ campo para aclarar de quién es)
- Otro Teléfono, opcional (+ campo para aclarar de quién es)
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

Al cargar la app (poco después del load) se activa un listener `onSnapshot` que **solo muestra** los cambios (nunca sube). Esa separación es clave: si el listener subiera datos, se dispararía a sí mismo creando un **bucle infinito** que satura Firebase y genera duplicados (bug que ocurrió y se corrigió).

Cualquier modificación desde cualquier dispositivo (agregar paciente, borrar/modificar turno, cambiar contador) se propaga automáticamente a todos los dispositivos que tengan la página abierta, sin recargar.

**Turnos — Firebase es la fuente de verdad (fix jul-2026):**
Al abrir la página de Turnos, el dispositivo **baja lo remoto y pisa lo local**. Solo sube los turnos **realmente nuevos** (sin `firebaseId` y que no existan ya en la nube).

> ⚠️ **Por qué NO se re-suben todos los locales:** antes, al abrir Turnos, cada dispositivo re-subía TODOS sus turnos locales. Si otro dispositivo había borrado un turno, la copia vieja lo **volvía a subir ("resucitaba")**. Con el fix, un turno borrado tiene `firebaseId` y por lo tanto **nunca** se re-sube → el borrado queda firme en todas las estaciones.

También se usa **un único listener** de turnos (antes se apilaba uno nuevo por cada visita a la página).

### IDs idempotentes (anti-duplicados)
Los turnos se guardan en Firebase con `setDoc` usando el **id local como id del documento** (`setDoc(doc(db,"turnos", turno.id), turno)`). Así, guardar el mismo turno muchas veces **sobreescribe el mismo documento** en lugar de crear copias. Por lo mismo, **borrar** usa ese id como id de documento, garantizando que el borrado se propague.

### Mantenimiento automático (sin botones)
Al abrir la app corren solas, una vez por sesión. Ya no hay ningún botón de mantenimiento:

| Rutina | Cuándo | Qué hace |
|--------|--------|----------|
| `deduplicarPacientesAuto()` | Al cargar la app | Un solo documento por paciente en Firebase |
| `deduplicarTurnosAuto()` | Al entrar a Turnos | Junta el mismo turno guardado dos veces |
| `unificarCelularesAuto()` | Después de que llegan los datos de la nube | Todos los teléfonos al mismo formato |

> **Turnos repetidos ≠ turnos duplicados.** Un paciente puede tener 5, 10 o los turnos que sean, y está perfecto. Lo que se junta es el **mismo turno** guardado dos veces: se agrupa por id de turno, **nunca** por nombre del paciente.

Son idempotentes: si no hay nada que hacer, no hacen nada. Van dejando el detalle en la consola (F12).

### Botón que queda en Turnos
- **🔄 Recuperar** — sube a Firebase los turnos que solo estén en este dispositivo. Es un salvavidas manual, no mantenimiento de rutina.
- **🔄 Recuperar** — sube a Firebase todos los turnos que estén en el dispositivo actual. Útil si un dispositivo tiene turnos locales que no llegaron a la nube. ⚠️ **Usar con cuidado:** al re-subir todo, puede revivir turnos borrados en otros dispositivos. Usar solo como recuperación manual e intencional.
- **🧹 Limpiar duplicados** — deja un solo turno de cada uno y elimina los duplicados de Firebase. Hacerlo en UN solo dispositivo con los demás cerrados.

### Claves localStorage
| Clave | Contenido |
|-------|-----------|
| `ODONPEI_PACIENTES` | Array de todos los pacientes con sus historias |
| `ODONPEI_TURNOS` | Array de todos los turnos |
| `ODONPEI_ATENCIONES` | Objeto `{ 'YYYY-MM': N }` con conteo mensual |
| `ODONPEI_ESTACION` | Nombre de la estación de este dispositivo (chat interno) |
| `ODONPEI_PLANTILLA_RECORDATORIO` | Texto del mensaje de recordatorio (copia local; la real vive en Firebase) |
| `odonpei_usuario` | Usuario logueado (sessionStorage) |

### Colecciones y documentos Firebase
| Colección / Documento | Contenido |
|-----------------------|-----------|
| `pacientes` (colección) | Misma estructura que localStorage, con `onSnapshot` activo |
| `turnos` (colección) | Misma estructura que localStorage, con `onSnapshot` activo |
| `config/atenciones` (documento) | Objeto `{ 'YYYY-MM': N }` con contador mensual, con `onSnapshot` activo |
| `chat` (colección) | Mensajes del chat interno `{ texto, estacion, ts, fecha }`, con `onSnapshot` activo |
| `config/recordatorio` (documento) | `{ plantilla }` — texto del mensaje de WhatsApp, compartido entre estaciones |

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
  celular: "+54 9 2966 42-1234",
  celular2: "+54 9 2966 56-7890",    // opcional: el otro contacto (papá/mamá)
  fecha: "YYYY-MM-DD",
  hora: "HH:MM",
  duracion: 30 | 60 | 90,             // minutos
  notas: "texto libre",
  estado: "pendiente|confirmado|cancelado|reprogramado|asistio|noasistio",
  fechaCreacion: "ISO date",
  recordadoEn: "ISO date"             // cuándo se le mandó el recordatorio (vacío = falta)
}
```

---

## Recordatorios por WhatsApp (`js/recordatorios.js`)

Recordatorios de turnos con **un clic**: la app arma la lista del día y abre WhatsApp con el mensaje ya escrito; la doctora solo aprieta enviar.

### Por qué NO es automático
El sitio es estático (GitHub Pages): **no hay un servidor propio** que se despierte a las 9 de la mañana a mandar mensajes. Para que fuera 100% automático haría falta un cron (GitHub Actions o Firebase Functions) más la API oficial de WhatsApp de Meta (verificación de negocio + plantillas aprobadas) o un servicio pago tipo Twilio. Se decidió no ir por ahí: son ~2 minutos de trabajo por día contra bastante infraestructura y trámite.

Lo que **sí** es automático: saber a quién falta recordar. La marca `recordadoEn` viaja por Firebase, así que si ella recuerda un turno desde la notebook, en la máquina del consultorio ya figura como hecho.

### Cómo se usa
1. En **Turnos** aparece arriba un aviso verde: *"📲 Mañana: 6 turnos · 4 sin recordar"* → botón **Recordar ahora**
   (también está el botón **📲 Recordatorios** en la barra de la página, siempre visible)
2. Se abre el panel con los turnos de mañana (se puede navegar a otros días con ← →)
3. Cada turno tiene su botón **📲 Recordar** → abre WhatsApp Web (o la app en el celular) con el mensaje escrito
4. Al usarlo, el turno queda marcado **✅ con la hora**. Si se apretó por error: **deshacer**
5. Cuando el paciente contesta, se le cambia el estado a 🔵 Confirmado como siempre

También hay un botón **📲 Recordar por WhatsApp** dentro del detalle de cada turno, para avisos sueltos.

### Casos que contempla
| Situación | Qué hace |
|-----------|----------|
| Turno sin celular | Botón naranja **✏️ Cargar celular** que abre la edición del turno |
| Turno cancelado / asistió / no asistió | Se muestra gris, sin botón (*"no corresponde"*) |
| Turno que se movió de día u hora | Se le borra `recordadoEn` → vuelve a aparecer como "sin recordar" |
| Ya recordado | Muestra ✅ y la hora; se puede volver a mandar desde el detalle del turno |

### Formato del celular
Los celulares se cargan a mano y cada uno los escribe distinto. Hay dos funciones:
`formatearCelular()` los deja legibles para guardarlos y mostrarlos en pantalla, y `normalizarCelular()` los convierte a lo que necesita `wa.me` (solo dígitos, con código de país) al momento de abrir WhatsApp.

> **El consultorio está en Río Gallegos:** característica **2966** y 6 dígitos de abonado.
> En el código: `AREA_LOCAL`, `PREFIJO_LOCAL` y `LARGO_ABONADO_LOCAL` arriba de `js/recordatorios.js`.
> Si algún día se mudan o abren en otra ciudad, se cambia ahí y listo.

| Se escribe | Se guarda como | Se manda a |
|------------|----------------|-----------|
| `42-1234` (solo el abonado) | `+54 9 2966 42-1234` | `5492966421234` |
| `421234` | `+54 9 2966 42-1234` | `5492966421234` |
| `15 421234` (con el 15 viejo) | `+54 9 2966 42-1234` | `5492966421234` |
| `02966 15 421234` | `+54 9 2966 42-1234` | `5492966421234` |
| `11 1234-5678` (de otra provincia) | `+54 9 11 1234-5678` | `5491112345678` |
| `+54 9 2966 42-1234` | ya está bien | `5492966421234` |

Reglas: saca el `0` de la característica y el `15` del celular; si vienen solo los 6 dígitos del abonado (o `15` + 6 dígitos) les pone **2966** adelante; si el número ya trae característica completa (10 dígitos) se respeta tal cual.

**Los que NO se pueden adivinar** quedan marcados para revisar a mano:

| Caso | Por qué |
|------|---------|
| `1234-5678` | 8 dígitos: no es de acá (serían 6) ni un nacional completo (serían 10) |
| `15 1234-5678` | Empieza con 15 y lo que sigue no da un número de acá. Ninguna característica argentina empieza con 15, así que no hay forma de saber cuál era |
| `11 1234-56789` | Tiene un dígito de más, es un error de tipeo |
| `2966 421234 / 2966 567890` | Dos números en un mismo campo (para eso está el segundo campo de teléfono) |

### El campo de teléfono ya viene con el prefijo

Los campos de celular arrancan con **`+54 9 2966 `** puesto, así solo hay que escribir los 6 dígitos que siguen. Si el paciente es de afuera, se borra el `2966` y se pone la característica que corresponda. Si se deja el prefijo solo, sin número atrás, no se guarda nada (queda vacío).

### Dos teléfonos por paciente (mamá y papá)

Tanto los **turnos** como los **pacientes** aceptan dos números:

| Dónde | Campos |
|-------|--------|
| Turno | `celular` + `celular2` |
| Paciente | `telefono` + `telefonoRef`, `telefono2` + `telefono2Ref` |

Los `Ref` son un texto libre para aclarar de quién es cada uno (*mamá*, *papá*, *abuela*). Se ven en la ficha del paciente y en la historia clínica impresa.

En el panel de recordatorios, un turno con dos números muestra el botón **📲 Recordar** (manda al primero) y al lado un botón **📲 2º** (manda al otro). Cualquiera de los dos marca el turno como recordado.

### Unificar celulares ya cargados (automático)

Deja **todos** los teléfonos guardados en el mismo formato: `+54 9 2966 42-1234`. Recorre los cuatro campos: `celular` y `celular2` de los turnos, `telefono` y `telefono2` de los pacientes.

1. Primero muestra una **vista previa** de qué va a cambiar: `11 1234-5678` → `+54 9 11 1234-5678`
2. Separa en tres grupos: **se corrigen**, **hay que revisarlos a mano**, **ya están bien**
3. Recién con el botón **✅ Unificar** escribe en localStorage y Firebase

Guarda el número viejo en `celularOriginal` / `celular2Original` / `telefonoOriginal` / `telefono2Original` por las dudas.

**Dos números en un mismo campo** (como se venían cargando: `2966-272169 ///2966639384` o `2966- 272169 (HERMANA). 2966639384 mama`) **ya no son un error**: se separan solos en los dos campos, y la aclaración de quién es cada uno va a los campos `Ref`. Si el segundo campo ya está ocupado, queda para revisar a mano. Lo mismo pasa al guardar un turno o un paciente: si en el primer campo entran los dos teléfonos juntos, el segundo se muda solo al campo de al lado.

**Casos que NO toca:** los de la tabla de arriba (los marca en naranja para revisar a mano).

**Pacientes sin `firebaseId`** (que todavía no subieron a la nube) se corrigen solo en ese dispositivo y el aviso final lo aclara. No se mandan a Firebase como nuevos porque `actualizarEnFirestore()` los crearía duplicados.

De acá en adelante el problema no vuelve: al guardar un turno o un paciente, el teléfono ya se guarda unificado (`unificarSiSePuede()` en `js/turnos.js` y `js/app.js`).

### El mensaje
Editable desde el panel (**✏️ Editar el mensaje**) y **compartido entre las dos máquinas** (se guarda en `config/recordatorio` de Firebase). Por defecto:

> Nos comunicamos de ODONPEI para recordar el turno de {completo} este {diacorto} a las {hora}. Confirmar su asistencia.
>
> Cada turno es una oportunidad de salud. Si tienes una cita programada y surge un imprevisto, avísanos con tiempo. Tu cancelación anticipada le da la posibilidad a otra familia de ocupar ese lugar y recibir la atención que necesita.
>
> ¡Gracias por tu respeto y solidaridad!

Reemplazos disponibles:

| Reemplazo | Ejemplo |
|-----------|---------|
| `{completo}` | Sarmiento Romina — apellido y nombre, como esté cargado el turno |
| `{nombre}` | Sarmiento — solo la primera palabra |
| `{diacorto}` | Martes 26/5 |
| `{dia}` | martes, 26 de mayo |
| `{fecha}` | 26/5/2026 |
| `{hora}` | 18:30 |

#### Mayúsculas y orden del nombre

Los nombres se cargan casi siempre en mayúsculas (`SARMIENTO ROMINA`). Mandar eso por WhatsApp queda como si le gritaras al paciente, así que `formatearNombre()` lo pasa a **Sarmiento Romina** antes de armar el mensaje. Las partículas quedan en minúscula: `MARIA DE LOS ANGELES` → *Maria de los Angeles*.

> **Lo que el sistema NO puede hacer:** darse cuenta de cuál es el apellido y cuál el nombre. En los turnos el nombre es texto libre y está cargado de las dos formas (`SARMIENTO ROMINA` y `Romina sarmiento`), y no hay manera de distinguirlos. Por eso `{completo}` respeta el orden tal como se escribió. Si se quisiera que siempre salga el nombre primero, habría que cargarlos siempre igual.

---

## Chat Interno (`js/chat.js`)

Chat grupal en tiempo real entre las **estaciones** del consultorio (secretaría, consultorios, tablets, celulares). Todos escriben en el mismo chat y todos ven todo; cada mensaje va firmado con la estación que lo envió. Usa el mismo Firebase que turnos/pacientes (colección `chat`), sin dependencias nuevas.

**UI:** botón flotante 💬 abajo a la derecha (visible en todas las pantallas tras el login). Abre un panel tipo WhatsApp. Se inicializa en `mostrarApp()` (`initChat()`) y se oculta en `cerrarSesion()` (`chatOcultar()`).

**Identidad de estación:** cada dispositivo elige su nombre la primera vez (Consultorio 1/2, Secretaría, Recepción, u otro libre). Se guarda en `localStorage` bajo `ODONPEI_ESTACION` y se puede cambiar con el botón ✎ del panel.

**Aviso al recibir (fuerte, pensado para escucharse sobre la turbina):**
- **Sonido:** alerta fuerte y repetida estilo ICQ (onda cuadrada, patrón "uh-oh" dos veces), generada con WebAudio (sin archivos externos).
- **Voz:** además, una voz dice *"Mensaje nuevo de [estación]"* usando `SpeechSynthesis` en `es-AR` (`hablar()`). Depende de que el dispositivo tenga voces instaladas; si no, igual suena la alerta.
- Los navegadores no permiten audio/voz hasta la primera interacción del usuario, por eso se "desbloquea" con el primer toque/click en la página (`desbloquearAudio()`).
- Todo junto se dispara en `chatNotificar(estacion)`.

**Apertura automática:** cuando llega un mensaje de **otra** estación y el chat está cerrado, el panel **se abre solo** (`chatAbrir(false, false)`) para que se vea sin tocar nada. No roba el foco ni levanta el teclado en pantalla (importante en tablets/celulares); el teclado aparece recién al tocar el campo para responder.

**No leídos:** globito rojo en el botón 💬 con la cantidad de mensajes ajenos llegados con el panel cerrado. Se resetea al abrir el chat.

**Borrar:** cada mensaje tiene 🗑 (borra ese mensaje para todos), y el panel tiene 🗑️ para vaciar todo el chat. Ambos piden confirmación. Como es compartido, borrar elimina en todas las pantallas.

**Estructura de un mensaje (colección `chat`):**
```javascript
{
  firebaseId: "abc123",     // ID en Firestore (para borrar)
  texto: "ya llegó el de las 15",
  estacion: "Secretaría",   // quién lo mandó
  ts: 1720000000000,        // Date.now() — usado para ordenar y detectar nuevos
  fecha: "ISO date"
}
```

**Funciones Firebase (en `firebase-config.js`, expuestas en `window.*`):** `enviarMensajeFirestore`, `escucharChatEnTiempoReal`, `eliminarMensajeFirestore`, `vaciarChatFirestore`.

**Clave localStorage:** `ODONPEI_ESTACION` (nombre de la estación de este dispositivo).

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
| `v1.2-firebase-estable` | Sync en tiempo real estable, reglas Firebase sin vencimiento, anti-duplicados |
| `v1.3-chat-estable` | Chat interno entre estaciones (sonido fuerte + voz, apertura automática) |
| `v1.4-turnos-sync-estable` | Fix sync de turnos: borrar/modificar firme en todos lados, sin resucitar |
| `v1.5-recordatorios` | Recordatorios de turnos por WhatsApp de un clic |
| `v1.6-celulares-unificados` | Todos los teléfonos en un formato único + unificador de los ya cargados |
| `v1.7-rio-gallegos` | Reglas de Río Gallegos (2966), prefijo precargado y dos teléfonos por paciente |
| `v1.8-pacientes-sin-duplicados` | Pacientes idempotentes en Firebase + limpiador de duplicados |
| `v1.9-mantenimiento-automatico` | Sin botones de mantenimiento: deduplicar y unificar corren solos al cargar |
| `v2.0-recordatorios-whatsapp` | Recordatorios por WhatsApp, teléfonos unificados y base sin duplicados |
| `v2.1-sin-botones-de-mantenimiento` | Cierre: ningún botón de mantenimiento, todo corre solo |

Para volver a un punto: `git checkout v2.1-sin-botones-de-mantenimiento`

### Backups locales
- `c:\Github repos\ODONPEI_backup_2026-05-21.zip` — v1.0
- `c:\Github repos\ODONPEI_backup_2026-05-21_v1.1.zip` — v1.1
- `c:\Github repos\ODONPEI_backup_2026-06-29_v1.2.zip` — v1.2 (Firebase estable)
- `c:\Github repos\ODONPEI_backup_2026-07-03_v1.3.zip` — v1.3 (Chat interno)
- `c:\Github repos\ODONPEI_backup_2026-07-07_v1.4.zip` — v1.4 (Fix sync turnos)
- `c:\Github repos\ODONPEI_backup_2026-08-27_v2.1.zip` — v2.1 (Recordatorios WhatsApp + teléfonos unificados + fix duplicados + mantenimiento automático)

### Backup de la base en la nube
- `c:\Github repos\ODONPEI_backup_firebase_2026-08-27.json` (9,4 MB) — copia cruda de Firestore (303 documentos de `pacientes` + 248 de `turnos`) tomada **antes** de la deduplicación automática.

> ⚠️ Los backups van **fuera de la carpeta del repositorio a propósito**. El repo es público en GitHub Pages y estos archivos tienen datos de pacientes. Nunca moverlos adentro ni commitearlos.

---

## ⚠️ Pacientes duplicados en Firebase (agosto 2026)

**Qué pasó:** los pacientes se guardaban con `addDoc`, que crea un documento con **id al azar cada vez**. Cada vez que un dispositivo subía su copia local, generaba OTRO documento del mismo paciente. Se llegó a **303 documentos para 77 pacientes** (cada uno repetido 3, 6 o 9 veces).

**Cómo se notó:** el botón de unificar celulares corregía el número, pero al rato volvía a aparecer sin corregir. Lo que pasaba era que corregía **una** copia y las otras seguían con el número viejo; cuando la app releía de la nube mostraba cualquiera de ellas.

**Es el mismo bug que ya se había arreglado en turnos** (commit `94712f0`, `setDoc` por id) y que nunca se le aplicó a pacientes.

### El arreglo
- `guardarEnFirestore()` ahora usa **`setDoc(doc(db,'pacientes', paciente.id), ...)`**: el id del documento es el id del paciente, así que guardar dos veces pisa el mismo documento en vez de crear otro.
- `actualizarEnFirestore()` apunta siempre al documento canónico y usa `setDoc` (si el documento no existe lo crea, en vez de fallar con *"No document to update"*).
- El listener de pacientes **deduplica en memoria** mientras queden copias en la nube, así la lista no muestra el mismo paciente tres veces.
- **Limpieza automática al abrir la app** (`deduplicarPacientesAuto()` en `js/storage.js`): junta las copias de cada paciente en un solo documento y borra las sobrantes. Sin botón y sin preguntar nada. **Antes de borrar cada grupo verifica que el documento bueno haya quedado escrito en la nube** (`existePacienteEnFirestore()`); si no lo puede confirmar, no borra nada y lo avisa por consola.

Entre varias copias del mismo paciente gana la que tiene los datos más completos (`puntajeCopiaPaciente()` en `js/storage.js`): prioriza la que tenga el teléfono ya unificado, después la que tenga más campos llenos, odontograma, fotos y archivos.

### Otra cosa que salió de esto
`actualizarEnFirestore()` manda **el paciente entero**, con las fotos y el odontograma en base64. Un documento de Firestore no puede pasar de 1 MB, así que en pacientes con muchas fotos la escritura puede fallar en silencio. Por eso el unificador de celulares usa `actualizarCamposPacienteEnFirestore()`, que manda **solo `datosPersonales`** con `{ merge: true }`.

**Moraleja:** en Firestore, todo lo que tenga un id propio se guarda con `setDoc` usando ese id. Nunca `addDoc` para algo que se puede volver a subir.

### Backup de la nube antes de la limpieza
Se guardó una copia completa de las colecciones `pacientes` (303 docs) y `turnos` (248 docs) tal como estaban antes de deduplicar:

`c:\Github repos\ODONPEI_backup_firebase_2026-08-27.json` (9,4 MB)

Está **fuera de la carpeta del repositorio a propósito**: el repo es público en GitHub y ese archivo tiene datos de pacientes. No moverlo adentro.

### Turnos repetidos: eso está bien
Un mismo paciente puede tener 5, 10 o los turnos que sean, y no son duplicados. Lo que se deduplica de los turnos es otra cosa: que el **mismo turno** (mismo id) esté guardado dos veces. Por eso los turnos se agrupan por `id` de turno, nunca por nombre del paciente.

---

## Historial de Cambios Importantes

| Commit | Cambio |
|--------|--------|
| `4309403` | **Fix turnos:** borrar/modificar se refleja en todos lados y no reaparece (Firebase = fuente de verdad; no re-subir todo lo local; listener único) |
| `42fdf3a` | **Chat:** al llegar un mensaje el panel se abre solo en las demás estaciones |
| `19aaa3d` | **Chat:** aviso más fuerte — sonido tipo ICQ repetido + voz hablada |
| `5541a90` | **Chat interno (nuevo):** mensajería grupal en tiempo real entre estaciones, con sonido, no leídos y borrar (`js/chat.js`) |
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

### Google Calendar (pendiente, analizado en agosto 2026)

Se evaluó y quedó **pendiente a propósito**, no olvidado. Esto es lo que se concluyó, para no volver a analizarlo desde cero:

**Lo único que agrega de verdad:** que le suene una alarma en el celular a la doctora antes de cada turno, con ODONPEI cerrado. Eso hoy no existe de ninguna forma. Los recordatorios de WhatsApp le avisan al *paciente*, no a ella. Lo secundario es poder mezclar los turnos con su agenda personal y tener vista de día/mes.

**Lo que NO agrega:** ver la agenda desde el celular (ya se entra por la URL), compartir entre las dos máquinas (ya sincroniza en tiempo real) y avisarle al paciente (lo hace WhatsApp, y mejor: no requiere el email del paciente, que además no se carga en el sistema).

**Lo que cuesta:** el sitio es estático, así que el OAuth de Google corre en el navegador. El permiso dura 1 hora y para que dure más hace falta un servidor. Para que no salga *"esta app no está verificada"* Google pide verificar la aplicación (formulario, política de privacidad, semanas de espera); mientras tanto funciona agregando las cuentas del consultorio como "usuarios de prueba". La sincronización en dos direcciones es complicada; lo sensato es una sola dirección, ODONPEI → Calendar.

**Los tres caminos, de menor a mayor esfuerzo:**

| | Qué hace | Esfuerzo |
|---|---|---|
| A | Botón "Agregar a Calendar" por turno (link `calendar.google.com/render`) | Un rato, sin permisos ni infraestructura |
| B | Bajar la semana como archivo `.ics` e importarla | Medio día |
| C | Sync automático real (API + OAuth) | Varios días + el trámite de Google |

**Recomendación registrada:** empezar por A para averiguar si el Calendar se va a usar de verdad. Ir directo a C solo si lo que se busca puntualmente es la alarma en el celular.

### Otros pendientes

- Agregar más usuarios al sistema de login (actualmente solo "odonpei")
- Los teléfonos marcados como "revisar" (el que empieza con 15 sin característica, los que tienen dígitos de más) hay que corregirlos a mano desde la ficha del paciente o del turno
