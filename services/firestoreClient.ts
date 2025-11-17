import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import type { InventoryItem, Invoice } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: any;
let db: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

// Inventory Items
export async function addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!db) throw new Error('Firebase not configured');

  const docRef = await addDoc(collection(db, 'inventory'), {
    ...item,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
}

export async function addInventoryItems(items: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
  if (!db) throw new Error('Firebase not configured');

  const ids: string[] = [];
  for (const item of items) {
    const id = await addInventoryItem(item);
    ids.push(id);
  }
  return ids;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (!db) return []; // Return empty array if not configured

  const q = query(collection(db, 'inventory'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as InventoryItem[];
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
  if (!db) throw new Error('Firebase not configured');

  const docRef = doc(db, 'inventory', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
}

export async function deleteInventoryItem(id: string): Promise<void> {
  if (!db) throw new Error('Firebase not configured');

  await deleteDoc(doc(db, 'inventory', id));
}

// Invoices
export async function addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'>): Promise<string> {
  if (!db) throw new Error('Firebase not configured');

  const docRef = await addDoc(collection(db, 'invoices'), {
    ...invoice,
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!db) return [];

  const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Invoice[];
}
