import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB_6LGyF2mTd8O_2sBPLcjKFlto0_ni_vM",
  authDomain: "connect-e0f8b.firebaseapp.com",
  projectId: "connect-e0f8b",
  storageBucket: "connect-e0f8b.firebasestorage.app",
  messagingSenderId: "574299953459",
  appId: "1:574299953459:web:81790b4e48df9b96a98646",
  measurementId: "G-KPTK6CN10W"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage }; 