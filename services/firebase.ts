import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwwE23pWVpNpSt37XGeWc3HIRsCX9l5c4",
  authDomain: "lyvo-finance.firebaseapp.com",
  projectId: "lyvo-finance",
  storageBucket: "lyvo-finance.firebasestorage.app",
  messagingSenderId: "436110327256",
  appId: "1:436110327256:web:d9a64b5ed93c128bc986ad"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);