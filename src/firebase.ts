import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Safely resolve the config variables (supporting VITE_ prefixed overrides or local fallback)
const env = (import.meta as any).env || {};
const actualConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: env.VITE_FIREBASE_API_KEY || (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("PLACEHOLDER") ? firebaseConfig.apiKey : ""),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

// Initialize Firebase App
const app = initializeApp(actualConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
