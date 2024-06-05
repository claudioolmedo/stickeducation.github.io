// Importa as bibliotecas necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBaATlo1GuJw7s7Vb0jT7Hf7J7l9sbsaOY",
  authDomain: "auth.stick.education",
  databaseURL: "https://editor-1946b-default-rtdb.firebaseio.com",
  projectId: "editor-1946b",
  storageBucket: "editor-1946b.appspot.com",
  messagingSenderId: "462487638341",
  appId: "1:462487638341:web:7e56e691d9c12daa8eee2c",
  measurementId: "G-K15B7WVP0J"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Funções para exportar
export const firebaseAuth = auth;
export const firebaseDB = db;

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

export function pushData(path, data) {
  return push(ref(db, path), data);
}

