// src/lib/firebase.js  (o donde decidas ubicarlo)

// 1. Importa las funciones necesarias de Firebase SDK
import { initializeApp } from 'firebase/app'; // Para inicializar la app de Firebase
import { getAuth } from 'firebase/auth';     // Para el servicio de autenticación
import { getFirestore } from 'firebase/firestore'; // Para el servicio de base de datos Cloud Firestore

// 2. Tu objeto de configuración de Firebase
// ESTO ES CRUCIAL: Debes reemplazar los valores de los marcadores de posición
// con tu propia configuración que obtuviste de la Consola de Firebase.
// (Cuando registraste tu app en el Paso 3)
const firebaseConfig = {
  apiKey: "AIzaSyAX4zQ_Pgp7HcHgonj6kRYU8trljn41eNQ",
  authDomain: "cash-51666.firebaseapp.com",
  projectId: "cash-51666",
  storageBucket: "cash-51666.firebasestorage.app",
  messagingSenderId: "355816952799",
  appId: "1:355816952799:web:7325897b23b991a6412a6a",
  measurementId: "G-EC7Q4NHM7B"
};

// 3. Inicializa tu aplicación de Firebase
// Esta es la parte donde Firebase se conecta con tu proyecto.
const app = initializeApp(firebaseConfig);

// 4. Obtén las instancias de los servicios de Firebase que vas a usar
// Exportamos estas instancias para que puedas usarlas fácilmente
// en cualquier parte de tu aplicación sin reinicializar Firebase.
export const auth = getAuth(app);       // Instancia para Firebase Authentication
export const db = getFirestore(app);   // Instancia para Cloud Firestore

// ¡Eso es todo! Este archivo es tu puerta de entrada a Firebase.
