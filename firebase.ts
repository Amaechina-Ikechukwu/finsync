import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
    //@ts-ignore
    getReactNativePersistence,
    initializeAuth,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate that all required config values are present
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
for (const key of requiredKeys) {
    if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
        console.error(`Firebase config missing: ${key}`);
    }
}





const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const database = getDatabase(app);
export const storage = getStorage();
