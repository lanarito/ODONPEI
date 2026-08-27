// ========== CONFIGURACIÓN FIREBASE ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2tn3mNVocWkafcAH0KNG2sPaEFGyBZJs",
  authDomain: "odonpei.firebaseapp.com",
  projectId: "odonpei",
  storageBucket: "odonpei.firebasestorage.app",
  messagingSenderId: "922061199593",
  appId: "1:922061199593:web:eeae06f69cb1c28fe3b878",
  measurementId: "G-K07RYH7FPH"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Firebase conectado a odonpei');

// ========== FUNCIONES FIRESTORE ==========

// Guardar paciente en Firestore
async function guardarEnFirestore(paciente) {
  try {
    // Usar el id del paciente como ID del documento (setDoc idempotente).
    // ANTES esto era addDoc, que genera un id nuevo cada vez: cada vez que un
    // dispositivo subía sus pacientes creaba OTRO documento del mismo paciente.
    // Así se llegó a 303 documentos para 77 pacientes. Es el mismo arreglo que
    // ya se le había hecho a los turnos.
    if (paciente.id) {
      await setDoc(doc(db, "pacientes", paciente.id), paciente);
      paciente.firebaseId = paciente.id;
      return paciente;
    }
    const docRef = await addDoc(collection(db, "pacientes"), paciente);
    paciente.firebaseId = docRef.id;
    return paciente;
  } catch (error) {
    console.error('Error guardando en Firestore:', error);
    return null;
  }
}

// Obtener todos los pacientes desde Firestore
async function obtenerDesdePacientesFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "pacientes"));
    const pacientes = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.firebaseId = doc.id;
      pacientes.push(data);
    });
    console.log(`✅ Cargados ${pacientes.length} pacientes desde Firestore`);
    return pacientes;
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    return [];
  }
}

// Actualizar paciente en Firestore
async function actualizarEnFirestore(paciente) {
  try {
    // Siempre al documento canónico (id del paciente = id del documento).
    // setDoc en vez de updateDoc: si el documento canónico todavía no existe
    // lo crea, en vez de fallar con "No document to update".
    const docId = paciente.id || paciente.firebaseId;
    if (!docId) {
      console.warn('Paciente sin id, guardando como nuevo');
      return guardarEnFirestore(paciente);
    }
    await setDoc(doc(db, "pacientes", docId), paciente);
    console.log('✅ Paciente actualizado en Firestore');
    return true;
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    return false;
  }
}

// ¿Existe el documento de este paciente? (se usa para no borrar copias
// sin haber confirmado antes que el documento bueno quedó guardado)
async function existePacienteEnFirestore(docId) {
  try {
    const snap = await getDoc(doc(db, "pacientes", docId));
    return snap.exists();
  } catch (e) { console.warn('Verificando paciente:', e); return false; }
}

// Actualizar SOLO algunos campos de un paciente (sin mandar el documento entero,
// que con fotos y odontograma puede pasarse del límite de 1 MB de Firestore)
async function actualizarCamposPacienteEnFirestore(docId, campos) {
  try {
    await setDoc(doc(db, "pacientes", docId), campos, { merge: true });
    return true;
  } catch (error) {
    console.error('Error actualizando campos del paciente:', error);
    return false;
  }
}

// Eliminar paciente desde Firestore
async function eliminarDeFirestore(firebaseId) {
  try {
    await deleteDoc(doc(db, "pacientes", firebaseId));
    console.log('✅ Paciente eliminado de Firestore');
    return true;
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    return false;
  }
}

// Sincronizar en tiempo real
function sincronizarEnTiempoReal(callback) {
  const unsubscribe = onSnapshot(collection(db, "pacientes"), (snapshot) => {
    const pacientes = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      data.firebaseId = doc.id;
      pacientes.push(data);
    });
    callback(pacientes);
  });
  return unsubscribe;
}

// Sincronizar en tiempo real
function sincronizarTurnosEnTiempoReal(callback) {
  const unsubscribe = onSnapshot(collection(db, "turnos"), (snapshot) => {
    const turnos = [];
    snapshot.forEach((d) => {
      const data = d.data();
      data.firebaseId = d.id;
      turnos.push(data);
    });
    callback(turnos);
  });
  return unsubscribe;
}

// ========== FUNCIONES FIRESTORE - TURNOS ==========

async function guardarTurnoEnFirestore(turno) {
  try {
    // Usar el id local como ID del documento en Firebase — evita duplicados
    await setDoc(doc(db, "turnos", turno.id), turno);
    turno.firebaseId = turno.id;
    return turno;
  } catch (e) { console.warn('Firebase turno guardar:', e); return null; }
}

async function obtenerTurnosDesdeFirestore() {
  try {
    const snap = await getDocs(collection(db, "turnos"));
    const turnos = [];
    snap.forEach((d) => { const t = d.data(); t.firebaseId = d.id; turnos.push(t); });
    console.log(`✅ Cargados ${turnos.length} turnos desde Firestore`);
    return turnos;
  } catch (e) { console.warn('Firebase turnos obtener:', e); return []; }
}

async function actualizarTurnoEnFirestore(turno) {
  try {
    if (!turno.firebaseId) return guardarTurnoEnFirestore(turno);
    await updateDoc(doc(db, "turnos", turno.firebaseId), turno);
    return true;
  } catch (e) { console.warn('Firebase turno actualizar:', e); return false; }
}

async function existeTurnoEnFirestore(docId) {
  try {
    const snap = await getDoc(doc(db, "turnos", docId));
    return snap.exists();
  } catch (e) { console.warn('Verificando turno:', e); return false; }
}

async function eliminarTurnoDeFirestore(firebaseId) {
  try {
    await deleteDoc(doc(db, "turnos", firebaseId));
    return true;
  } catch (e) { console.warn('Firebase turno eliminar:', e); return false; }
}

// ========== CHAT INTERNO EN FIREBASE ==========

// Enviar un mensaje al chat
async function enviarMensajeFirestore(mensaje) {
  try {
    const docRef = await addDoc(collection(db, "chat"), mensaje);
    mensaje.firebaseId = docRef.id;
    return mensaje;
  } catch (e) { console.warn('Firebase chat enviar:', e); return null; }
}

// Escuchar el chat en tiempo real (ordenado por fecha de creación)
function escucharChatEnTiempoReal(callback) {
  return onSnapshot(collection(db, "chat"), (snapshot) => {
    const mensajes = [];
    snapshot.forEach((d) => {
      const data = d.data();
      data.firebaseId = d.id;
      mensajes.push(data);
    });
    mensajes.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    callback(mensajes);
  });
}

// Eliminar un mensaje del chat
async function eliminarMensajeFirestore(firebaseId) {
  try {
    await deleteDoc(doc(db, "chat", firebaseId));
    return true;
  } catch (e) { console.warn('Firebase chat eliminar:', e); return false; }
}

// Vaciar todo el chat
async function vaciarChatFirestore() {
  try {
    const snap = await getDocs(collection(db, "chat"));
    const borrados = [];
    snap.forEach((d) => borrados.push(deleteDoc(doc(db, "chat", d.id))));
    await Promise.all(borrados);
    return true;
  } catch (e) { console.warn('Firebase chat vaciar:', e); return false; }
}

// ========== CONTADOR DE ATENCIONES EN FIREBASE ==========

async function guardarContadorEnFirestore(data) {
  try {
    await setDoc(doc(db, "config", "atenciones"), data);
  } catch (e) { console.warn('Firebase contador guardar:', e); }
}

async function obtenerContadorDesdeFirestore() {
  try {
    const snap = await getDoc(doc(db, "config", "atenciones"));
    return snap.exists() ? snap.data() : {};
  } catch (e) { console.warn('Firebase contador obtener:', e); return {}; }
}

function escucharContadorEnFirestore(callback) {
  return onSnapshot(doc(db, "config", "atenciones"), (snap) => {
    callback(snap.exists() ? snap.data() : {});
  });
}

// ========== PLANTILLA DE RECORDATORIOS ==========
// Se guarda en la nube para que las dos estaciones manden el mismo mensaje

async function guardarPlantillaEnFirestore(texto) {
  try {
    await setDoc(doc(db, "config", "recordatorio"), { plantilla: texto });
    return true;
  } catch (e) { console.warn('Firebase plantilla guardar:', e); return false; }
}

async function obtenerPlantillaDesdeFirestore() {
  try {
    const snap = await getDoc(doc(db, "config", "recordatorio"));
    return snap.exists() ? (snap.data().plantilla || '') : '';
  } catch (e) { console.warn('Firebase plantilla obtener:', e); return ''; }
}

// Exponer funciones al scope global para que storage.js pueda usarlas
window.guardarEnFirestore             = guardarEnFirestore;
window.obtenerDesdePacientesFirestore = obtenerDesdePacientesFirestore;
window.actualizarEnFirestore          = actualizarEnFirestore;
window.actualizarCamposPacienteEnFirestore = actualizarCamposPacienteEnFirestore;
window.existePacienteEnFirestore      = existePacienteEnFirestore;
window.eliminarDeFirestore            = eliminarDeFirestore;
window.sincronizarEnTiempoReal        = sincronizarEnTiempoReal;
window.guardarTurnoEnFirestore        = guardarTurnoEnFirestore;
window.obtenerTurnosDesdeFirestore    = obtenerTurnosDesdeFirestore;
window.actualizarTurnoEnFirestore     = actualizarTurnoEnFirestore;
window.eliminarTurnoDeFirestore       = eliminarTurnoDeFirestore;
window.existeTurnoEnFirestore         = existeTurnoEnFirestore;
window.sincronizarTurnosEnTiempoReal  = sincronizarTurnosEnTiempoReal;
window.guardarContadorEnFirestore     = guardarContadorEnFirestore;
window.obtenerContadorDesdeFirestore  = obtenerContadorDesdeFirestore;
window.escucharContadorEnFirestore    = escucharContadorEnFirestore;
window.enviarMensajeFirestore         = enviarMensajeFirestore;
window.escucharChatEnTiempoReal       = escucharChatEnTiempoReal;
window.eliminarMensajeFirestore       = eliminarMensajeFirestore;
window.vaciarChatFirestore            = vaciarChatFirestore;
window.guardarPlantillaEnFirestore    = guardarPlantillaEnFirestore;
window.obtenerPlantillaDesdeFirestore = obtenerPlantillaDesdeFirestore;
