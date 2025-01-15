import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAePwz2e7wol8_spTiIpfY_Ue4AuwItAK4",
  authDomain: "piyushgpt-97b7f.firebaseapp.com",
  projectId: "piyushgpt-97b7f",
  storageBucket: "piyushgpt-97b7f.firebasestorage.app",
  messagingSenderId: "510652004100",
  appId: "1:510652004100:web:2d5054adedd3598a35c251",
  measurementId: "G-1G0N7QPEN0"
};

// Initialize Firebase
let firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(firebase_app);
export const googleProvider = new GoogleAuthProvider();

