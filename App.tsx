import React, { useState, useEffect, useRef } from 'react';
import Auth, { MainLogo } from './components/Auth';
import Messenger from './components/Messenger';
import { User } from './types';
import { auth, db } from './services/firebase';
import * as FirebaseAuth from 'firebase/auth';
const { onAuthStateChanged, signOut } = FirebaseAuth as any;
import { doc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  const lastStatusUpdate = useRef<number>(0);
  const lastState = useRef<boolean | null>(null);
  const userUnsubRef = useRef<(() => void) | null>(null);

  // Computed active user (impersonated or real)
  const activeUser = impersonatedUser || realUser;

  useEffect(() => {
    if ('serviceWorker' in navigator && "Notification" in window) {
      navigator.serviceWorker.ready.then(() => {
        if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      });
    }

    const updateStatus = async (isOnline: boolean) => {
      const fbUser = auth.currentUser;
      if (!fbUser || impersonatedUser) return; // Don't update status if impersonating

      const now = Date.now();
      const stateChanged = isOnline !== lastState.current;
      const shouldHeartbeat = isOnline && (now - lastStatusUpdate.current > 60000);

      if (stateChanged || shouldHeartbeat) {
        try {
          lastStatusUpdate.current = now;
          lastState.current = isOnline;
          await updateDoc(doc(db, 'users', fbUser.uid), {
            online: isOnline,
            lastSeen: now
          });
        } catch (e) {
          console.warn("Status sync failed", e);
        }
      }
    };

    const handleActivity = () => updateStatus(true);
    const handleInactivity = () => updateStatus(false);

    window.addEventListener('focus', handleActivity);
    window.addEventListener('blur', handleInactivity);
    window.addEventListener('beforeunload', () => updateStatus(false));
    
    const handleVisibility = () => updateStatus(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibility);

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: any) => {
      try {
        if (fbUser) {
          if (userUnsubRef.current) userUnsubRef.current();
          
          userUnsubRef.current = onSnapshot(doc(db, 'users', fbUser.uid), (snapshot) => {
            if (snapshot.exists()) {
              const userData = { id: fbUser.uid, ...snapshot.data() } as User;
              setRealUser(userData);
            }
          });
          updateStatus(true);
        } else {
          if (userUnsubRef.current) userUnsubRef.current();
          setRealUser(null);
          setImpersonatedUser(null);
        }
      } catch (err: any) {
        setInitError(err.message);
      } finally {
        setTimeout(() => setIsInitializing(false), 200);
      }
    });

    return () => {
      unsubscribeAuth();
      if (userUnsubRef.current) userUnsubRef.current();
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('blur', handleInactivity);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [impersonatedUser]);

  const handleLogout = async () => {
    if (realUser) {
      try {
        await updateDoc(doc(db, 'users', realUser.id), { online: false, lastSeen: Date.now() });
      } catch (e) {}
    }
    await signOut(auth);
    setRealUser(null);
    setImpersonatedUser(null);
  };

  const handleImpersonate = async (targetUser: User) => {
    // Only allow if the real user is an admin
    const isAdmin = ['@bee', '@megannait'].includes(realUser?.username_handle.toLowerCase() || '');
    if (!isAdmin) return;
    
    setImpersonatedUser(targetUser);
  };

  const stopImpersonating = () => {
    setImpersonatedUser(null);
  };

  if (isInitializing) {
    return (
      <div className="h-[100dvh] w-full bg-[#0b0f14] flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center">
          <MainLogo className="w-16 h-16 mb-6 opacity-80" />
          <p className="text-slate-500 font-bold tracking-[0.4em] text-[9px] uppercase opacity-50">MeganNait OS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full overflow-hidden select-none bg-[#0b0f14]">
      {impersonatedUser && (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-red-600 text-white px-4 py-1.5 flex items-center justify-between shadow-xl animate-slide-down">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
            <i className="fa-solid fa-user-secret"></i>
            <span>Режим просмотра: {impersonatedUser.username}</span>
          </div>
          <button 
            onClick={stopImpersonating}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
          >
            Выйти
          </button>
        </div>
      )}
      {activeUser ? (
        <Messenger 
          user={activeUser} 
          onLogout={handleLogout} 
          // Inject impersonate function via a custom prop or context if needed
          // For now, Messenger will handle it through ProfileModal
          onImpersonate={handleImpersonate}
        />
      ) : (
        <Auth onComplete={() => {}} />
      )}
    </div>
  );
};

export default App;