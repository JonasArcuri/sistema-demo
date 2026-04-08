import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useAuth } from './AuthContext';

interface WorkshopSettings {
  name: string;
  logoUrl: string;
  phone?: string;
  address?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface WorkshopContextType {
  settings: WorkshopSettings;
  updateSettings: (newSettings: Partial<WorkshopSettings>) => Promise<void>;
  loading: boolean;
}

const defaultSettings: WorkshopSettings = {
  name: 'Precision Parts',
  logoUrl: '',
};

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export function WorkshopProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WorkshopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'workshop');
    
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as WorkshopSettings);
      } else {
        // Initialize with defaults if it doesn't exist
        setDoc(settingsDocRef, defaultSettings).catch(err => {
          console.error("Error initializing workshop settings:", err);
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workshop settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<WorkshopSettings>) => {
    const path = 'settings/workshop';
    const settingsDocRef = doc(db, 'settings', 'workshop');
    try {
      await updateDoc(settingsDocRef, newSettings);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      
      try {
        await setDoc(settingsDocRef, { ...settings, ...newSettings });
      } catch (setErr: any) {
        handleFirestoreError(setErr, setErr.code === 'permission-denied' ? OperationType.WRITE : OperationType.UPDATE, path);
      }
    }
  };

  return (
    <WorkshopContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshop() {
  const context = useContext(WorkshopContext);
  if (context === undefined) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
}
