// ========== CONFIGURACIÓN FIREBASE ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
    if (!paciente.firebaseId) {
      console.warn('Paciente sin firebaseId, guardando como nuevo');
      return guardarEnFirestore(paciente);
    }
    await updateDoc(doc(db, "pacientes", paciente.firebaseId), paciente);
    console.log('✅ Paciente actualizado en Firestore');
    return true;
  } catch (error) {
    console.error('Error actualizando paciente:', error);
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
    const docRef = await addDoc(collection(db, "turnos"), turno);
    turno.firebaseId = docRef.id;
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

async function eliminarTurnoDeFirestore(firebaseId) {
  try {
    await deleteDoc(doc(db, "turnos", firebaseId));
    return true;
  } catch (e) { console.warn('Firebase turno eliminar:', e); return false; }
}

// Exponer funciones al scope global para que storage.js pueda usarlas
window.guardarEnFirestore             = guardarEnFirestore;
window.obtenerDesdePacientesFirestore = obtenerDesdePacientesFirestore;
window.actualizarEnFirestore          = actualizarEnFirestore;
window.eliminarDeFirestore            = eliminarDeFirestore;
window.sincronizarEnTiempoReal        = sincronizarEnTiempoReal;
window.guardarTurnoEnFirestore        = guardarTurnoEnFirestore;
window.obtenerTurnosDesdeFirestore    = obtenerTurnosDesdeFirestore;
window.actualizarTurnoEnFirestore     = actualizarTurnoEnFirestore;
window.eliminarTurnoDeFirestore       = eliminarTurnoDeFirestore;
window.sincronizarTurnosEnTiempoReal  = sincronizarTurnosEnTiempoReal;
