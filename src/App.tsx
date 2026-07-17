import { useState, useEffect } from 'react';
import { SignageState, DisplayItem, AdminUser } from './types';
import { INITIAL_SIGNAGE_STATE } from './initialData';
import AdminDashboard from './components/AdminDashboard';
import SignageDisplay from './components/SignageDisplay';
import AdminLogin from './components/AdminLogin';
import DisplayLogin from './components/DisplayLogin';
import { PRESET_LAYOUTS } from './initialData';
import { doc, onSnapshot, setDoc, updateDoc, collection, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Helper to recursively remove undefined properties from Firestore payloads to prevent payload errors
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (data instanceof Date) return data as any;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned;
}

function getInitialDisplayState(): SignageState {
  if (typeof window !== 'undefined') {
    let activeId = 'global_state';
    try {
      const params = new URLSearchParams(window.location.search);
      const queryDisplayId = params.get('displayId');
      if (queryDisplayId) {
        activeId = queryDisplayId;
      } else {
        activeId = localStorage.getItem('signage_admin_selected_display_id') || 'global_state';
      }
    } catch (e) {
      activeId = localStorage.getItem('signage_admin_selected_display_id') || 'global_state';
    }
    const saved = localStorage.getItem(`signage_state_${activeId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_SIGNAGE_STATE, ...parsed };
      } catch (e) {
        return INITIAL_SIGNAGE_STATE;
      }
    }
  }
  return INITIAL_SIGNAGE_STATE;
}

export default function App() {
  const [state, setState] = useState<SignageState>(getInitialDisplayState);
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('firestore_quota_exceeded');
    }
  }, []);

  const [isStandaloneDisplay, setIsStandaloneDisplay] = useState(false);
  const [displayId, setDisplayId] = useState('global_state');
  const [isDisplayLoggedIn, setIsDisplayLoggedIn] = useState(false);
  
  // Admin selected display being configured
  const [selectedDisplayId, setSelectedDisplayIdState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('signage_admin_selected_display_id') || 'global_state';
    }
    return 'global_state';
  });

  const setSelectedDisplayId = (id: string) => {
    setSelectedDisplayIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('signage_admin_selected_display_id', id);
    }
  };
  const [displaysList, setDisplaysList] = useState<DisplayItem[]>([]);
  const [displayStatuses, setDisplayStatuses] = useState<Record<string, any>>({});
  
  // Admin users state (Real-Time cross-device synchronization)
  const [adminUsersList, setAdminUsersList] = useState<AdminUser[]>([]);
  const [currentAdminUsername, setCurrentAdminUsername] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('signage_admin_username');
    }
    return null;
  });

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('signage_admin_logged_in') === 'true';
    }
    return false;
  });

  // 1. Detect Mode from Query Parameter (?mode=display&displayId=...)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'display') {
          setIsStandaloneDisplay(true);
        }
        const queryDisplayId = params.get('displayId');
        if (queryDisplayId) {
          setDisplayId(queryDisplayId);
          setSelectedDisplayId(queryDisplayId);
        }
      }
    } catch (e) {
      console.warn("Unable to access window.location.search safely inside iframe:", e);
    }
  }, []);

  // 1b. Check if standalone display is authenticated
  useEffect(() => {
    if (isStandaloneDisplay) {
      const savedAuth = localStorage.getItem(`display_logged_in_${displayId}`);
      setIsDisplayLoggedIn(savedAuth === 'true');
    }
  }, [isStandaloneDisplay, displayId]);

  // 2. Subscribe to Available Displays List (Cross-device and persistent in Cloud Firestore)
  useEffect(() => {
    const displaysRef = doc(db, 'signage', 'displays_list');
    
    const unsubscribe = onSnapshot(displaysRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.displays)) {
          setDisplaysList(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.displays)) {
              return prev;
            }
            return data.displays;
          });
        }
      } else {
        // First-time seed of physical displays
        const INITIAL_DISPLAYS: DisplayItem[] = [
          { id: 'global_state', name: 'Layar Utama (Lobi)', location: 'Lobby Utama Gedung', createdAt: Date.now() },
          { id: 'display_cafeteria', name: 'Layar Kafe & Menu', location: 'Area Kafetaria Lantai Dasar', createdAt: Date.now() },
          { id: 'display_office', name: 'Layar Informasi Kantor', location: 'Ruang Kerja Bersama Lantai 2', createdAt: Date.now() }
        ];
        setDoc(displaysRef, sanitizeForFirestore({ displays: INITIAL_DISPLAYS }))
          .then(() => setDisplaysList(prev => {
            if (JSON.stringify(prev) === JSON.stringify(INITIAL_DISPLAYS)) {
              return prev;
            }
            return INITIAL_DISPLAYS;
          }))
          .catch(err => {
            console.error("Error seeding displays list:", err);
            if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
              setFirestoreQuotaExceeded(true);
            }
          });
      }
    }, (error: any) => {
      console.warn("displays_list onSnapshot error:", error);
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota') || error?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
      // Fallback
      const INITIAL_DISPLAYS: DisplayItem[] = [
        { id: 'global_state', name: 'Layar Utama (Lobi)', location: 'Lobby Utama Gedung', createdAt: Date.now() },
        { id: 'display_cafeteria', name: 'Layar Kafe & Menu', location: 'Area Kafetaria Lantai Dasar', createdAt: Date.now() },
        { id: 'display_office', name: 'Layar Informasi Kantor', location: 'Ruang Kerja Bersama Lantai 2', createdAt: Date.now() }
      ];
      setDisplaysList(prev => prev.length > 0 ? prev : INITIAL_DISPLAYS);
    });

    return () => unsubscribe();
  }, []);

  // 2b. Subscribe to Admin Users list (Cloud Firestore)
  useEffect(() => {
    const adminsRef = doc(db, 'signage', 'admins_list');
    
    const unsubscribe = onSnapshot(adminsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.admins)) {
          setAdminUsersList(prev => {
            if (JSON.stringify(prev) === JSON.stringify(data.admins)) {
              return prev;
            }
            return data.admins;
          });
        }
      } else {
        // Seed default super administrator
        const INITIAL_ADMINS: AdminUser[] = [
          {
            id: 'admin_root',
            username: 'admin',
            passwordHash: 'admin', // Simple password storage for kiosk system
            fullName: 'Administrator Utama',
            role: 'super_admin',
            createdAt: Date.now()
          }
        ];
        setDoc(adminsRef, sanitizeForFirestore({ admins: INITIAL_ADMINS }))
          .then(() => setAdminUsersList(prev => {
            if (JSON.stringify(prev) === JSON.stringify(INITIAL_ADMINS)) {
              return prev;
            }
            return INITIAL_ADMINS;
          }))
          .catch(err => {
            console.error("Error seeding admins list:", err);
            if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
              setFirestoreQuotaExceeded(true);
            }
          });
      }
    }, (error: any) => {
      console.warn("admins_list onSnapshot error:", error);
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota') || error?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
      const INITIAL_ADMINS: AdminUser[] = [
        {
          id: 'admin_root',
          username: 'admin',
          passwordHash: 'admin',
          fullName: 'Administrator Utama',
          role: 'super_admin',
          createdAt: Date.now()
        }
      ];
      setAdminUsersList(prev => prev.length > 0 ? prev : INITIAL_ADMINS);
    });

    return () => unsubscribe();
  }, []);

  // 2c. Subscribe to Display Status/Heartbeats (Real-Time live reports)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'display_status'), (snapshot) => {
      const statuses: Record<string, any> = {};
      snapshot.forEach((doc) => {
        statuses[doc.id] = doc.data();
      });
      setDisplayStatuses(prev => {
        if (JSON.stringify(prev) === JSON.stringify(statuses)) {
          return prev;
        }
        return statuses;
      });
    }, (error: any) => {
      console.error("Error fetching display statuses:", error);
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota') || error?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2d. Send Heartbeat when Standalone Display is Active & Logged In
  useEffect(() => {
    if (!isStandaloneDisplay || !isDisplayLoggedIn || !displayId) return;

    const sendHeartbeat = async () => {
      // Don't send heartbeats if the page is not visible, to save Firestore writes
      if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const statusRef = doc(db, 'display_status', displayId);
        await setDoc(statusRef, sanitizeForFirestore({
          displayId,
          lastSeen: Date.now(),
          status: 'online',
          userAgent: navigator.userAgent,
          currentLayoutId: state.currentLayoutId || 'default'
        }), { merge: true });
      } catch (err: any) {
        console.error("Failed to send display heartbeat:", err);
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
          setFirestoreQuotaExceeded(true);
        }
      }
    };

    // Send immediately on mount or status change
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000); // Heartbeat every 60 seconds (1 minute)

    return () => clearInterval(interval);
  }, [isStandaloneDisplay, isDisplayLoggedIn, displayId, state.currentLayoutId]);

  // 3. Subscribe to current active display state (Real-Time cross-device updates)
  const activeSubscriptionId = isStandaloneDisplay ? displayId : selectedDisplayId;

  useEffect(() => {
    let isMounted = true;
    
    const isQuota = firestoreQuotaExceeded;
    if (isQuota) {
      console.log(`[Offline Mode] Loading cached state for '${activeSubscriptionId}' from localStorage`);
      const saved = localStorage.getItem(`signage_state_${activeSubscriptionId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const mergedSaved = { ...INITIAL_SIGNAGE_STATE, ...parsed };
          setState(prev => {
            if (JSON.stringify(prev) === JSON.stringify(mergedSaved)) return prev;
            return mergedSaved;
          });
        } catch (e) {
          setState(INITIAL_SIGNAGE_STATE);
        }
      } else {
        setState(INITIAL_SIGNAGE_STATE);
      }
      return; // Skip Firestore listener
    }

    const docRef = doc(db, 'signage_displays', activeSubscriptionId);
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (!isMounted) return;
      if (firestoreQuotaExceeded) return;

      if (snapshot.exists()) {
        const cloudState = snapshot.data() as SignageState;
        
        // Load the current localStorage state to compare timestamps
        let localState: SignageState | null = null;
        try {
          const saved = localStorage.getItem(`signage_state_${activeSubscriptionId}`);
          if (saved) {
            localState = JSON.parse(saved);
          }
        } catch (e) {
          console.warn("Error parsing local state for timestamp check:", e);
        }

        const cloudTime = cloudState.lastUpdated || 0;
        const localTime = localState?.lastUpdated || 0;

        // If local state has a higher lastUpdated timestamp than cloud state,
        // it means there were unsaved/offline modifications in this browser session.
        // We should retain the local state and push it to Firestore to sync rather than overwriting.
        if (localTime > cloudTime) {
          console.log(`[Sync] Local state for '${activeSubscriptionId}' is newer (${localTime}) than cloud state (${cloudTime}). Preserving local state and pushing update.`);
          const mergedState: SignageState = {
            ...INITIAL_SIGNAGE_STATE,
            ...localState
          };
          setState(prev => {
            if (JSON.stringify(prev) === JSON.stringify(mergedState)) return prev;
            return mergedState;
          });
          // Attempt to sync the newer local state back to Firestore
          try {
            await setDoc(docRef, sanitizeForFirestore(mergedState));
            if (activeSubscriptionId === 'global_state') {
              await setDoc(doc(db, 'signage', 'global_state'), sanitizeForFirestore(mergedState));
            }
          } catch (syncErr) {
            console.warn("Could not sync local changes back to cloud during snapshot update:", syncErr);
          }
          return;
        }

        const mergedState: SignageState = {
          ...INITIAL_SIGNAGE_STATE,
          ...cloudState
        };
        setState(prev => {
          if (JSON.stringify(prev) === JSON.stringify(mergedState)) {
            return prev;
          }
          return mergedState;
        });
        localStorage.setItem(`signage_state_${activeSubscriptionId}`, JSON.stringify(mergedState));
      } else {
        // Document doesn't exist yet, seed it safely with a getDoc fallback
        try {
          if (activeSubscriptionId === 'global_state') {
            const oldRef = doc(db, 'signage', 'global_state');
            const oldSnapshot = await getDoc(oldRef);
            if (oldSnapshot.exists()) {
              const oldData = oldSnapshot.data() as SignageState;
              const mergedOldData: SignageState = {
                ...INITIAL_SIGNAGE_STATE,
                ...oldData,
                lastUpdated: Date.now()
              };
              if (isMounted) {
                setState(prev => {
                  if (JSON.stringify(prev) === JSON.stringify(mergedOldData)) return prev;
                  return mergedOldData;
                });
              }
              await setDoc(docRef, sanitizeForFirestore(mergedOldData));
            } else {
              const seedState = {
                ...INITIAL_SIGNAGE_STATE,
                lastUpdated: Date.now()
              };
              if (isMounted) {
                setState(prev => {
                  if (JSON.stringify(prev) === JSON.stringify(seedState)) return prev;
                  return seedState;
                });
              }
              await setDoc(docRef, sanitizeForFirestore(seedState));
            }
          } else {
            const seedState = {
              ...INITIAL_SIGNAGE_STATE,
              lastUpdated: Date.now()
            };
            if (isMounted) {
              setState(prev => {
                if (JSON.stringify(prev) === JSON.stringify(seedState)) return prev;
                return seedState;
              });
            }
            await setDoc(docRef, sanitizeForFirestore(seedState));
          }
        } catch (err: any) {
          console.warn("Could not seed or fetch legacy display document, using initial/cached state:", err);
          if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
            setFirestoreQuotaExceeded(true);
          }
          if (isMounted) {
            const saved = localStorage.getItem(`signage_state_${activeSubscriptionId}`);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                const mergedSaved = { ...INITIAL_SIGNAGE_STATE, ...parsed };
                setState(prev => {
                  if (JSON.stringify(prev) === JSON.stringify(mergedSaved)) return prev;
                  return mergedSaved;
                });
              } catch (e) {
                setState(prev => {
                  if (JSON.stringify(prev) === JSON.stringify(INITIAL_SIGNAGE_STATE)) return prev;
                  return INITIAL_SIGNAGE_STATE;
                });
              }
            } else {
              setState(prev => {
                if (JSON.stringify(prev) === JSON.stringify(INITIAL_SIGNAGE_STATE)) return prev;
                return INITIAL_SIGNAGE_STATE;
              });
            }
          }
        }
      }
    }, (error: any) => {
      console.warn(`Firestore display '${activeSubscriptionId}' failed, falling back to local storage:`, error);
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota') || error?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
      if (!isMounted) return;
      const saved = localStorage.getItem(`signage_state_${activeSubscriptionId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const mergedSaved = { ...INITIAL_SIGNAGE_STATE, ...parsed };
          setState(prev => {
            if (JSON.stringify(prev) === JSON.stringify(mergedSaved)) return prev;
            return mergedSaved;
          });
        } catch (e) {
          setState(prev => {
            if (JSON.stringify(prev) === JSON.stringify(INITIAL_SIGNAGE_STATE)) return prev;
            return INITIAL_SIGNAGE_STATE;
          });
        }
      } else {
        setState(prev => {
          if (JSON.stringify(prev) === JSON.stringify(INITIAL_SIGNAGE_STATE)) return prev;
          return INITIAL_SIGNAGE_STATE;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeSubscriptionId, firestoreQuotaExceeded]);

  // 3b. Real-Time cross-tab synchronization fallback via localStorage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `signage_state_${activeSubscriptionId}`) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            const mergedParsed = { ...INITIAL_SIGNAGE_STATE, ...parsed };
            setState(prev => {
              if (JSON.stringify(prev) === JSON.stringify(mergedParsed)) return prev;
              return mergedParsed;
            });
          } catch (err) {
            console.warn("Failed to parse localStorage change event:", err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeSubscriptionId]);

  // 4. State update propagation (Writes to Firestore for instant display updates)
  const handleStateChange = async (newState: SignageState) => {
    const updatedStateWithTimestamp: SignageState = {
      ...newState,
      lastUpdated: Date.now()
    };
    setState(updatedStateWithTimestamp);
    localStorage.setItem(`signage_state_${activeSubscriptionId}`, JSON.stringify(updatedStateWithTimestamp));
    
    const isQuota = firestoreQuotaExceeded;
    if (isQuota) {
      return; // Do not attempt remote Firestore write to avoid slow network attempts and console flooding
    }

    try {
      const docRef = doc(db, 'signage_displays', activeSubscriptionId);
      await setDoc(docRef, sanitizeForFirestore(updatedStateWithTimestamp));
      
      // Mirror to old global_state if needed to prevent breaking legacy systems
      if (activeSubscriptionId === 'global_state') {
        await setDoc(doc(db, 'signage', 'global_state'), sanitizeForFirestore(updatedStateWithTimestamp));
      }
    } catch (err: any) {
      console.error("Failed to sync updated state to Firestore:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  // 5. Multi-Display Management Actions
  const handleAddDisplay = async (newDisplay: DisplayItem) => {
    const updated = [...displaysList, newDisplay];
    setDisplaysList(updated);
    try {
      await setDoc(doc(db, 'signage', 'displays_list'), sanitizeForFirestore({ displays: updated }));
      // Initialize state for the new display
      const initialDisplayState = {
        ...INITIAL_SIGNAGE_STATE,
        lastUpdated: Date.now()
      };
      await setDoc(doc(db, 'signage_displays', newDisplay.id), sanitizeForFirestore(initialDisplayState));
    } catch (err: any) {
      console.error("Failed to add display in Firestore:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  const handleEditDisplay = async (updatedDisplay: DisplayItem) => {
    const updated = displaysList.map(d => d.id === updatedDisplay.id ? updatedDisplay : d);
    setDisplaysList(updated);
    try {
      await setDoc(doc(db, 'signage', 'displays_list'), sanitizeForFirestore({ displays: updated }));
    } catch (err: any) {
      console.error("Failed to update display metadata in Firestore:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  const handleDeleteDisplay = async (idToDelete: string) => {
    if (idToDelete === 'global_state') return;
    const updated = displaysList.filter(d => d.id !== idToDelete);
    setDisplaysList(updated);
    try {
      await setDoc(doc(db, 'signage', 'displays_list'), sanitizeForFirestore({ displays: updated }));
      // If deleted was currently configured, fallback to default
      if (selectedDisplayId === idToDelete) {
        setSelectedDisplayId('global_state');
      }
    } catch (err: any) {
      console.error("Failed to delete display in Firestore:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  // 5b. Admin Users Management Actions
  const handleAddAdmin = async (newAdmin: AdminUser) => {
    const updated = [...adminUsersList, newAdmin];
    setAdminUsersList(updated);
    try {
      await setDoc(doc(db, 'signage', 'admins_list'), sanitizeForFirestore({ admins: updated }));
    } catch (err: any) {
      console.error("Failed to add admin user to Firestore:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  const handleEditAdmin = async (updatedAdmin: AdminUser) => {
    const updated = adminUsersList.map(u => u.id === updatedAdmin.id ? updatedAdmin : u);
    setAdminUsersList(updated);
    try {
      await setDoc(doc(db, 'signage', 'admins_list'), sanitizeForFirestore({ admins: updated }));
    } catch (err: any) {
      console.error("Failed to update admin user in Firestore:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  const handleDeleteAdmin = async (idToDelete: string) => {
    if (idToDelete === 'admin_root') return;
    const updated = adminUsersList.filter(u => u.id !== idToDelete);
    setAdminUsersList(updated);
    try {
      await setDoc(doc(db, 'signage', 'admins_list'), sanitizeForFirestore({ admins: updated }));
    } catch (err: any) {
      console.error("Failed to delete admin user in Firestore:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  const handleSyncTVChannelsToAllDisplays = async (channelsToSync: any[], activeTVChannelIdToSync: string) => {
    try {
      // 1. Sync global_state
      const globalDocId = 'global_state';
      const globalDocRef = doc(db, 'signage_displays', globalDocId);
      
      try {
        await updateDoc(globalDocRef, sanitizeForFirestore({
          channels: channelsToSync,
          activeTVChannelId: activeTVChannelIdToSync,
          lastUpdated: Date.now()
        }));
      } catch (err: any) {
        console.warn(`Could not updateDoc for global_state, attempting setDoc:`, err);
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
          setFirestoreQuotaExceeded(true);
        }
        try {
          await setDoc(globalDocRef, sanitizeForFirestore({
            ...INITIAL_SIGNAGE_STATE,
            channels: channelsToSync,
            activeTVChannelId: activeTVChannelIdToSync,
            lastUpdated: Date.now()
          }));
        } catch (setErr: any) {
          console.error("Failed to sync global_state:", setErr);
          if (setErr?.code === 'resource-exhausted' || setErr?.message?.includes('Quota') || setErr?.message?.includes('quota')) {
            setFirestoreQuotaExceeded(true);
          }
        }
      }

      // Also mirror to legacy path
      try {
        await setDoc(doc(db, 'signage', 'global_state'), sanitizeForFirestore({
          ...state,
          channels: channelsToSync,
          activeTVChannelId: activeTVChannelIdToSync,
          lastUpdated: Date.now()
        }));
      } catch (err: any) {
        console.warn("Legacy path write failed:", err);
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
          setFirestoreQuotaExceeded(true);
        }
      }

      // 2. Sync other displays in displaysList
      const promises = displaysList.map(async (display) => {
        if (display.id === 'global_state') return;
        const targetDocRef = doc(db, 'signage_displays', display.id);
        try {
          await updateDoc(targetDocRef, sanitizeForFirestore({
            channels: channelsToSync,
            activeTVChannelId: activeTVChannelIdToSync,
            lastUpdated: Date.now()
          }));
        } catch (err: any) {
          console.warn(`Could not updateDoc for display ${display.id}, attempting setDoc:`, err);
          if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
            setFirestoreQuotaExceeded(true);
          }
          try {
            await setDoc(targetDocRef, sanitizeForFirestore({
              ...INITIAL_SIGNAGE_STATE,
              channels: channelsToSync,
              activeTVChannelId: activeTVChannelIdToSync,
              lastUpdated: Date.now()
            }));
          } catch (setErr: any) {
            console.error(`Failed to sync display ${display.id}:`, setErr);
            if (setErr?.code === 'resource-exhausted' || setErr?.message?.includes('Quota') || setErr?.message?.includes('quota')) {
              setFirestoreQuotaExceeded(true);
            }
          }
        }
      });

      await Promise.all(promises);
    } catch (err: any) {
      console.error("Failed to broadcast channels to all displays:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('quota')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  };

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('signage_admin_logged_in', 'true');
    localStorage.setItem('signage_admin_username', username);
    setCurrentAdminUsername(username);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('signage_admin_logged_in');
    localStorage.removeItem('signage_admin_username');
    setCurrentAdminUsername(null);
    setIsLoggedIn(false);
  };

  // 6. Standalone TV Display Rendering Mode
  if (isStandaloneDisplay) {
    if (!isDisplayLoggedIn) {
      return (
        <DisplayLogin
          onLoginSuccess={(id) => {
            localStorage.setItem(`display_logged_in_${id}`, 'true');
            setDisplayId(id);
            setSelectedDisplayId(id);
            setIsDisplayLoggedIn(true);
          }}
          displaysList={displaysList}
          adminUsers={adminUsersList}
        />
      );
    }

    const layoutsList = state.layouts || PRESET_LAYOUTS;
    const activeLayout = layoutsList.find((l) => l.id === state.currentLayoutId) || layoutsList[0];
    
    return (
      <div className="w-screen h-screen overflow-hidden bg-black flex items-center justify-center relative">
        <div className="w-full h-full">
          <SignageDisplay 
            state={state} 
            layout={activeLayout} 
            previewMode={false} 
            onChange={handleStateChange} 
            onLogoutDisplay={() => {
              localStorage.removeItem(`display_logged_in_${displayId}`);
              setIsDisplayLoggedIn(false);
            }}
          />
        </div>
        {firestoreQuotaExceeded && (
          <div className="fixed bottom-4 right-4 z-50 bg-amber-950/95 backdrop-blur-md border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs max-w-sm pointer-events-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold block text-amber-300">Mode Lokal Aktif (Kuota Terlampaui)</span>
              <span className="opacity-80">Firestore limit harian tercapai. Semua data disimpan secara lokal pada browser ini.</span>
            </div>
            <button 
              onClick={() => setFirestoreQuotaExceeded(false)}
              className="text-amber-400 hover:text-amber-200 font-bold px-1 py-0.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // 7. Security Admin Access Gate
  if (!isLoggedIn) {
    return (
      <AdminLogin 
        onLoginSuccess={handleLoginSuccess} 
        adminUsers={adminUsersList} 
      />
    );
  }

  // Find currently logged-in user object details
  const activeCurrentUser = adminUsersList.find(u => u.username === currentAdminUsername) || {
    id: 'admin_root',
    username: currentAdminUsername || 'admin',
    fullName: 'Administrator',
    role: 'super_admin' as const,
    createdAt: Date.now()
  };

  // 8. Logged-in Administrator Dashboard Panel
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <AdminDashboard 
        state={state} 
        onChange={handleStateChange}
        displaysList={displaysList}
        displayStatuses={displayStatuses}
        selectedDisplayId={selectedDisplayId}
        onSelectDisplay={setSelectedDisplayId}
        onAddDisplay={handleAddDisplay}
        onEditDisplay={handleEditDisplay}
        onDeleteDisplay={handleDeleteDisplay}
        onLogout={handleLogout}
        adminUsers={adminUsersList}
        currentUser={activeCurrentUser}
        onAddAdmin={handleAddAdmin}
        onEditAdmin={handleEditAdmin}
        onDeleteAdmin={handleDeleteAdmin}
        onSyncTVChannelsToAllDisplays={handleSyncTVChannelsToAllDisplays}
      />
      {firestoreQuotaExceeded && (
        <div className="fixed bottom-4 right-4 z-50 bg-amber-950/95 backdrop-blur-md border border-amber-500/40 text-amber-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs max-w-sm pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold block text-amber-300">Mode Lokal Aktif (Kuota Terlampaui)</span>
            <span className="opacity-80">Firestore limit harian tercapai. Semua data disimpan secara lokal pada browser ini.</span>
          </div>
          <button 
            onClick={() => setFirestoreQuotaExceeded(false)}
            className="text-amber-400 hover:text-amber-200 font-bold px-1 py-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
