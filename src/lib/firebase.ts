
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseEnvValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const placeholderValues = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const envVarNames = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

let configIsValid = true;
for (const key in firebaseEnvValues) {
  const typedKey = key as keyof typeof firebaseEnvValues;
  if (!firebaseEnvValues[typedKey] || firebaseEnvValues[typedKey] === placeholderValues[typedKey]) {
    console.error(
      `Firebase config error: ${envVarNames[typedKey]} is missing or still a placeholder in your .env file. Current value: '${firebaseEnvValues[typedKey]}'. Please update it with your actual Firebase project credentials and restart the development server.`
    );
    configIsValid = false;
  }
}

if (!configIsValid) {
  console.error("Firebase configuration is invalid. Please check the messages above and your .env file. The application may not work correctly.");
}

const firebaseConfig = {
  apiKey: firebaseEnvValues.apiKey!,
  authDomain: firebaseEnvValues.authDomain!,
  projectId: firebaseEnvValues.projectId!,
  storageBucket: firebaseEnvValues.storageBucket!,
  messagingSenderId: firebaseEnvValues.messagingSenderId!,
  appId: firebaseEnvValues.appId!,
};

let app: FirebaseApp;
// Initialize Firebase
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
