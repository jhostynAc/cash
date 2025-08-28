// src/lib/firebase.js

// 1. Importa las funciones necesarias de Firebase SDK
import { initializeApp } from 'firebase/app'; // Para inicializar la app de Firebase

// === CAMBIOS AQUÍ para la persistencia de React Native ===
// Antes: import { getAuth } from 'firebase/auth';
// Ahora: Usaremos 'initializeAuth' y 'getReactNativePersistence'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
// Importa el almacenamiento asíncrono para React Native
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// =======================================================

import { getFirestore } from 'firebase/firestore'; // Para el servicio de base de datos Cloud Firestore

// 2. Tu objeto de configuración de Firebase
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
const app = initializeApp(firebaseConfig);

// 4. Obtén las instancias de los servicios de Firebase que vas a usar

// === CAMBIO CLAVE AQUÍ para la persistencia ===
// Antes: export const auth = getAuth(app);
// Ahora: Inicializamos la autenticación con la persistencia de AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
// ===============================================

export const db = getFirestore(app);   // Instancia para Cloud Firestore

// ¡Eso es todo! Este archivo es tu puerta de entrada a Firebase.
