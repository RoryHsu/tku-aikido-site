import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBOSfiMlIYIf56K41wXCScQo8k7zBOE74",
  authDomain: "tku-aikido-admin.firebaseapp.com",
  projectId: "tku-aikido-admin",
  storageBucket: "tku-aikido-admin.firebasestorage.app",
  messagingSenderId: "917187117578",
  appId: "1:917187117578:web:fa84543de092b433d855f3"
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);

export const db = getFirestore(app);