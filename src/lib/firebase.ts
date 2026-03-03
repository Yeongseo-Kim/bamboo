/**
 * Firebase 초기화
 * 환경 변수는 @granite-js/plugin-env를 통해 주입됩니다.
 * - Dev 모드: Babel이 import.meta.env → global.__granite.meta.env로 변환, polyfill이 값 주입
 * - Build 모드: esbuild define으로 import.meta.env에 값 직접 주입
 * getEnv()를 사용하면 번들에서 global.__granite.meta.env가 비어 있어 동작하지 않습니다.
 */
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const existingApps = getApps();
const app = existingApps[0] ?? initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export { httpsCallable };
