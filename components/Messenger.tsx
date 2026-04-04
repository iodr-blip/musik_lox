// Fix: Added global notification logic to monitor all chats for background updates
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message, Chat, MessageAttachment } from '../types';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import ContextMenu, { MenuItem } from './ContextMenu';
import GroupSettingsModal from './GroupSettingsModal';
import { db } from '../services/firebase';
import { encryptText, decryptText } from '../services/encryption';
import { MainLogo } from './Auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  orderBy, 
  where,
  deleteDoc,
  serverTimestamp,
  getDoc,
  increment,
  limit,
  getDocs,
  setDoc,
  arrayUnion,
  arrayRemove,
  documentId,
  writeBatch,
  limitToLast,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

export const VerifiedIcon = ({ className = "", title }: { className?: string, title?: string }) => (
  <svg 
    viewBox="0 0 36 36" 
    className={`w-[14px] h-[14px] flex-shrink-0 inline-block pointer-events-none select-none ${className}`} 
    fill="none" 
    title={title}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fill="#0080FF" d="M15.13 1.848c1.46-2.514 5.057-2.45 6.429.115l1.253 2.343a3.677 3.677 0 0 0 3.762 1.926l2.597-.373c2.842-.408 5.036 2.493 3.92 5.182L32.07 13.5a3.804 3.804 0 0 0 .865 4.192l1.906 1.833c2.086 2.006 1.224 5.56-1.54 6.348l-2.525.721c-1.484.424-2.554 1.74-2.683 3.302l-.22 2.658c-.242 2.91-3.51 4.44-5.84 2.734l-2.13-1.558a3.644 3.644 0 0 0-4.21-.075l-2.181 1.482c-2.387 1.622-5.601-.023-5.743-2.94l-.129-2.664c-.076-1.566-1.1-2.919-2.568-3.395l-2.499-.81c-2.735-.887-3.474-4.469-1.32-6.4l1.967-1.763a3.801 3.801 0 0 0 1.008-4.16l-.935-2.492C2.27 7.785 4.563 4.963 7.39 5.472l2.582.465a3.673 3.673 0 0 0 3.826-1.791l1.333-2.298Z"></path>
    <path d="M12 18L16.5 22.5L24.5 14.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

export const LapkaIcon = ({ className = "", title }: { className?: string, title?: string }) => (
  <svg 
    viewBox="0 0 512 512" 
    className={`w-[14px] h-[14px] flex-shrink-0 inline-block pointer-events-none select-none fill-[#ff9f43] ${className}`} 
    title={title}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87-11.84 43.42 3.64 85.22 34.58 93.36z"/>
  </svg>
);

export const DevIcon = ({ className = "", title }: { className?: string, title?: string }) => (
  <svg 
    viewBox="0 0 174.239 174.239" 
    className={`w-[14px] h-[14px] flex-shrink-0 inline-block pointer-events-none select-none fill-yellow-400 ${className}`} 
    title={title}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M124.863,147.754l-4.581,2.639l-16.877,9.758l-2.589,1.494c-2.987,1.743-6.871,0.697-8.613-2.34l-0.299-0.548
		l-21.458-37.141c-1.146-2.041-3.037-3.336-4.73-3.585c-0.597-0.099-1.195-0.05-1.693,0.15h-0.05c0,0-0.049,0-0.099,0.05
		c-0.05,0-0.15,0.05-0.299,0.099c-20.91,9.011-45.804,1.145-57.455-19.068c-0.15-0.15-0.249-0.299-0.299-0.498
		c-7.169-12.795-7.518-27.582-2.141-40.128c3.335-7.916,8.962-14.936,16.58-20.014c0.1-0.1,0.199-0.199,0.298-0.249
		c1.344-0.796,2.887-0.299,3.834,1.344l18.919,32.81c1.245,2.141,4.083,2.887,6.223,1.643l5.577-3.236l19.616-11.302
		c2.19-1.195,2.888-4.083,1.643-6.273L63.973,31.949l-6.522-11.302c-0.946-1.693-0.598-3.236,0.746-3.983
		c0.1-0.1,0.199-0.149,0.299-0.199c21.259-10.505,47.148-2.938,59.346,17.575c0.1,0.199,0.249,0.349,0.349,0.548
		c2.689,4.63,4.431,9.559,5.328,14.538h-5.975c-4.68,0-10.356,3.336-12.646,7.319l-3.187,5.527l-4.082,7.07L87.025,87.412
		c-1.245,2.141-1.842,4.979-1.742,7.767v0.05c0.05,2.489,0.647,4.929,1.742,6.821l17.874,30.868
		c2.29,4.033,7.965,7.319,12.646,7.319h10.057C128.598,142.975,127.502,146.211,124.863,147.754z"/>
    <path d="M172.559,87.512l-12.347-21.408c-2.29-3.983-7.915-7.219-12.447-7.219h-24.744c-4.58,0-10.207,3.236-12.497,7.219
			l-7.319,12.696l-5.029,8.713c-2.24,3.983-2.24,10.455,0,14.339l2.44,4.282l9.908,17.127c2.141,3.734,7.219,6.821,11.551,7.12
			c0.15,0.05,0.249,0.05,0.398,0.05c0.15,0.05,0.348,0.05,0.548,0.05h24.744c4.531,0,10.157-3.236,12.447-7.219l12.347-21.409
			C174.8,97.967,174.8,91.495,172.559,87.512z M136.912,111.808h-3.137c-0.448,0-0.847-0.05-1.295-0.099
			c-4.282-0.498-9.061-3.485-11.102-7.07l-1.593-2.788c-0.698-1.195-1.195-2.688-1.444-4.232c-0.647-3.435-0.15-7.368,1.444-10.107
			l1.593-2.738c1.394-2.44,4.082-4.63,7.07-5.925c1.742-0.796,3.585-1.245,5.327-1.245h3.137c4.63,0,10.207,3.236,12.497,7.169
			l1.544,2.738c2.29,3.983,2.29,10.455,0,14.339l-0.748,1.344l-0.796,1.444C147.118,108.572,141.541,111.808,136.912,111.808z"/>
  </svg>
);

const DateDivider = ({ date }: { date: string }) => (
  <div className="flex justify-center my-4 sticky top-2 z-30 pointer-events-none">
    <div className="bg-[#1c2a38]/80 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 text-[12px] font-bold text-white shadow-lg">
      {date}
    </div>
  </div>
);

const CustomAlert = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-fade-in">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
    <div className="relative bg-[#17212b] w-full max-w-[320px] rounded-xl shadow-2xl p-6 border border-white/5 animate-slide-up">
      <p className="text-white text-[15px] leading-relaxed mb-6 font-medium">{message}</p>
      <div className="flex justify-end">
        <button 
          onClick={onClose}
          className="text-[#3390ec] font-bold text-sm uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-lg transition-all active:scale-95"
        >
          ОК
        </button>
      </div>
    </div>
  </div>
);

const ConfirmationModal = ({ 
  title, 
  message, 
  confirmText, 
  isDanger = false, 
  onConfirm, 
  onConfirm: handleConfirm, 
  onClose 
}: { 
  title: string, 
  message: string, 
  confirmText: string, 
  isDanger?: boolean, 
  onConfirm: () => void, 
  onClose: () => void 
}) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-fade-in">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-[#17212b] w-full max-w-[320px] rounded-2xl shadow-2xl overflow-hidden border border-white/5 animate-slide-up">
      <div className="p-6">
        <h3 className="text-white font-bold text-[17px] mb-2">{title}</h3>
        <p className="text-[#7f91a4] text-[14px] leading-relaxed">{message}</p>
      </div>
      <div className="flex border-t border-white/5">
        <button 
          onClick={onClose}
          className="flex-1 px-4 py-4 text-[#7f91a4] font-bold text-[13px] uppercase tracking-wider hover:bg-white/5 transition-all"
        >
          Отмена
        </button>
        <button 
          onClick={() => { handleConfirm(); onClose(); }}
          className={`flex-1 px-4 py-4 font-bold text-[13px] uppercase tracking-wider transition-all border-l border-white/5 hover:bg-white/5 ${isDanger ? 'text-red-400' : 'text-blue-400'}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
);

const formatLastSeen = (lastSeen?: number, online?: boolean) => {
  if (online) return 'в сети';
  if (!lastSeen) return 'был(а) недавно';
  const now = Date.now();
  const diff = now - lastSeen;
  const mins = Math.floor(diff / 60000);
  
  if (mins < 1) return 'был(а) только что';
  if (mins < 60) return `был(а) ${mins} мин. назад`;
  
  const d = new Date(lastSeen);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return `был сегодня в ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `был вчера в ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return `был(а) ${d.toLocaleDateString()}`;
};

const Messenger: React.FC<{ user: User, onLogout: () => void, onImpersonate?: (u: User) => void }> = ({ user, onLogout, onImpersonate: onImpersonateProp }) => {
  const currentUser = user;
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [chatParticipants, setChatParticipants] = useState<Record<string, User>>({});
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [groupSettingsChat, setGroupSettingsChat] = useState<Chat | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg?: Message } | null>(null);
  const [headerMenu, setHeaderMenu] = useState<{ x: number; y: number } | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [participant, setParticipant] = useState<User | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string,
    message: string,
    confirmText: string,
    isDanger?: boolean,
    onConfirm: () => void
  } | null>(null);
  const [showInviteBar, setShowInviteBar] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState<User[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef<string | null>(null);
  const lastProcessedMessageTime = useRef<number>(Date.now());
  const lastGlobalMessageTime = useRef<number>(Date.now());
  const snapshotSeqRef = useRef<number>(0);
  
  const activeChat = useMemo<Chat | null>(() => {
    if (!activeChatId) return null;
    const found = chats.find(c => c.id === activeChatId);
    if (found) return found;
    if (activeChatId === 'saved') {
      return { 
        id: 'saved', 
        type: 'saved', 
        participants: [currentUser], 
        participantsUids: [currentUser.id],
        unreadCounts: { [currentUser.id]: 0 }
      } as Chat;
    }
    return null;
  }, [chats, activeChatId, currentUser]);

  const scrollToBottom = (instant = false) => {
    if (scrollRef.current && !isSearching) {
      const isInitial = initialScrollDone.current !== activeChatId;
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: (instant || isInitial) ? 'auto' : 'smooth'
      });
      if (isInitial) initialScrollDone.current = activeChatId;
    }
  };

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (contextMenu) { setContextMenu(null); return; }
        if (headerMenu) { setHeaderMenu(null); return; }
        if (profileUser) { setProfileUser(null); return; }
        if (showSettings) { setShowSettings(false); return; }
        if (groupSettingsChat) { setGroupSettingsChat(null); return; }
        if (showInviteModal) { setShowInviteModal(false); return; }
        if (confirmation) { setConfirmation(null); return; }
        if (alertMessage) { setAlertMessage(null); return; }
        if (editingMessage || replyMessage) { setEditingMessage(null); setReplyMessage(null); return; }
        if (isSearching) { setIsSearching(false); setSearchQuery(''); return; }
        if (activeChatId) { setActiveChatId(null); return; }
      }

      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const chatIds = chats.map(c => c.id);
        if (chatIds.length === 0) return;
        const currentIndex = activeChatId ? chatIds.indexOf(activeChatId) : -1;
        let nextIndex = 0;
        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex <= 0 ? chatIds.length - -1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= chatIds.length - 1 ? 0 : currentIndex + 1;
        }
        setActiveChatId(chatIds[nextIndex]);
      }

      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }

      if (e.ctrlKey && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        const searchInput = document.getElementById('sidebar-search-input');
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [activeChatId, chats, contextMenu, headerMenu, profileUser, showSettings, groupSettingsChat, showInviteModal, confirmation, alertMessage, editingMessage, replyMessage, isSearching, currentUser]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NAVIGATE_CHAT' && event.data.chatId) {
          setActiveChatId(event.data.chatId);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      const params = new URLSearchParams(window.location.search);
      const chatIdParam = params.get('chatId');
      if (chatIdParam) {
        setActiveChatId(chatIdParam);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'chats'), where('participantsUids', 'array-contains', currentUser.id));
    return onSnapshot(q, async (snapshot) => {
      const updatedChats = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Chat));
      setChats(updatedChats);

      if (document.visibilityState === 'hidden') {
        for (const chat of updatedChats) {
          const lastMsg = chat.lastMessage;
          if (
            lastMsg && 
            lastMsg.senderId !== currentUser.id && 
            lastMsg.timestamp > lastGlobalMessageTime.current
          ) {
            const decryptedText = await decryptText(lastMsg.text, chat.id);
            const senderName = lastMsg.senderName || 'MeganNait';
            
            if ("Notification" in window && Notification.permission === "granted") {
              const reg = await navigator.serviceWorker.getRegistration();
              const notificationOptions = {
                body: decryptedText || (lastMsg.text.includes('audioUrl') ? "🎤 Голосовое сообщение" : "Вложение"),
                icon: 'https://cdn-icons-png.flaticon.com/512/906/906338.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/906/906338.png',
                tag: chat.id,
                data: { chatId: chat.id },
                vibrate: [200, 100, 200]
              };

              if (reg) {
                reg.showNotification(`MeganNait: ${senderName}`, notificationOptions);
              } else {
                new Notification(`MeganNait: ${senderName}`, notificationOptions);
              }
            }
          }
        }
      }
      
      const maxTime = Math.max(...updatedChats.map(c => c.lastMessage?.timestamp || 0), lastGlobalMessageTime.current);
      lastGlobalMessageTime.current = maxTime;
    });
  }, [currentUser.id]);

  useEffect(() => {
    if (!activeChatId || activeChatId === 'saved') return;
    const chat = chats.find(c => c.id === activeChatId);
    if (chat && chat.unreadCounts && (chat.unreadCounts[currentUser.id] || 0) > 0) {
      const chatRef = doc(db, 'chats', activeChatId);
      updateDoc(chatRef, { [`unreadCounts.${currentUser.id}`]: 0 }).catch(() => {});
    }
  }, [activeChatId, chats, currentUser.id]);

  useEffect(() => {
    if (!activeChatId || activeChatId === 'saved') {
      setTypingUsers([]);
      return;
    }
    const typingRef = collection(db, 'chats', activeChatId, 'typing');
    const unsub = onSnapshot(typingRef, (snapshot) => {
      const uids = snapshot.docs
        .filter(d => d.id !== currentUser.id)
        .filter(d => {
          const data = d.data();
          return data.timestamp && (Date.now() - data.timestamp < 10000);
        })
        .map(d => d.id);
      setTypingUsers(uids);
      uids.forEach(async (uid) => {
        if (!chatParticipants[uid]) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as DocumentData;
            setChatParticipants(prev => ({ ...prev, [uid]: { id: uid, ...data } as User }));
          }
        }
      });
    });
    return () => unsub();
  }, [activeChatId, currentUser.id, chatParticipants]);

  useEffect(() => {
    if (!activeChat || activeChat.type !== 'group' || !activeChat.participantsUids) return;
    const uids = activeChat.participantsUids;
    if (uids.length === 0) return;
    
    const batches = [];
    for (let i = 0; i < uids.length; i += 10) batches.push(uids.slice(i, i + 10));
    
    const unsubs = batches.map(batch => {
      const q = query(collection(db, 'users'), where(documentId(), 'in', batch));
      return onSnapshot(q, (snap) => {
        const updates: Record<string, User> = {};
        snap.forEach(d => { 
          updates[d.id] = { id: d.id, ...(d.data() as any) } as User; 
        });
        setChatParticipants(prev => ({ ...prev, ...updates }));
      });
    });

    return () => unsubs.forEach(fn => fn());
  }, [activeChatId, activeChat?.participantsUids]);

  useEffect(() => {
    const triggerSearch = async () => {
      if (inviteSearchQuery.length > 0) {
        const lowerQuery = inviteSearchQuery.toLowerCase().trim();
        const searchPrefix = lowerQuery.startsWith('@') ? lowerQuery : '@' + lowerQuery;
        const q = query(collection(db, 'users'), where('username_handle', '>=', searchPrefix), where('username_handle', '<=', searchPrefix + '\uf8ff'), limit(20));
        try {
          const snap = await getDocs(q);
          const results = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as User)).filter((u: User) => u.id !== currentUser.id);
          setInviteSearchResults(results);
        } catch (e) { console.error("Invite search failed", e); }
      } else setInviteSearchResults([]);
    };
    const timeout = setTimeout(triggerSearch, 300);
    return () => clearTimeout(timeout);
  }, [inviteSearchQuery, currentUser.id]);

  useEffect(() => {
    if (!activeChatId) return;
    setIsSearching(false);
    setSearchQuery('');
    if (activeChatId !== 'saved' && activeChat?.type === 'group') {
        const dismissed = localStorage.getItem(`dismissed_invite_bar_${activeChatId}`);
        setShowInviteBar(!dismissed);
    } else setShowInviteBar(false);
    
    const path = activeChatId === 'saved' ? `users/${currentUser.id}/saved_messages` : `chats/${activeChatId}/messages`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'), limitToLast(150));
    
    snapshotSeqRef.current += 1;
    const currentSeq = snapshotSeqRef.current;

    const unsub = onSnapshot(q, async (snapshot) => {
      const msgPromises = snapshot.docs.map(async (d) => {
        const data = d.data();
        const decryptedText = data.text ? await decryptText(data.text, activeChatId) : '';
        const timestamp = data.timestamp?.toMillis?.() || Date.now();
        
        return { 
          id: d.id, 
          senderId: data.senderId,
          text: decryptedText,
          timestamp: timestamp,
          status: data.status || 'sent',
          edited: data.edited || false,
          replyPreview: data.replyPreview ? {
            ...data.replyPreview,
            text: await decryptText(data.replyPreview.text, activeChatId)
          } : null,
          audioUrl: data.audioUrl || '',
          fileUrl: data.fileUrl || '',
          videoUrl: data.videoUrl || '',
          fileName: data.fileName || '',
          attachments: data.attachments || []
        };
      });

      const msgs = await Promise.all(msgPromises) as Message[];
      if (currentSeq !== snapshotSeqRef.current) return;

      if (msgs.length > 0) {
        lastProcessedMessageTime.current = Math.max(...msgs.map(m => m.timestamp));
      }

      const clearedAt = (activeChat as any)?.clearedAt?.[currentUser.id] || 0;
      const filteredMsgs = msgs.filter(m => m.timestamp > clearedAt);
      
      setMessages(prev => ({ ...prev, [activeChatId]: filteredMsgs }));
      
      requestAnimationFrame(() => {
        const isInitialForChat = initialScrollDone.current !== activeChatId;
        scrollToBottom(isInitialForChat);
      });
    });
    return () => {
      unsub();
      snapshotSeqRef.current += 1;
    };
  }, [activeChatId, currentUser.id, (activeChat as any)?.clearedAt?.[currentUser.id], activeChat?.type]);

  useEffect(() => {
    if (!activeChatId || activeChatId === 'saved') return;
    const currentMessages = messages[activeChatId];
    if (!currentMessages || currentMessages.length === 0) return;
    const unreadFromOthers = currentMessages.filter(m => m.senderId !== currentUser.id && m.status !== 'read');
    if (unreadFromOthers.length > 0) {
      const path = `chats/${activeChatId}/messages`;
      const batch = writeBatch(db);
      let count = 0;
      unreadFromOthers.forEach(m => {
        const msgRef = doc(db, path, m.id);
        batch.update(msgRef, { status: 'read' });
        count++;
      });
      if (count > 0) batch.commit().catch(e => console.error("Error committing read receipt batch:", e));
    }
  }, [activeChatId, messages[activeChatId || ''], currentUser.id]);

  useEffect(() => {
    if (!activeChatId || activeChatId === 'saved') return;
    const chatData = chats.find(c => c.id === activeChatId);
    if (chatData?.type === 'group') {
      setParticipant(null);
      return;
    }
    const otherId = chatData?.participantsUids?.find(id => id !== currentUser.id) || (activeChatId.startsWith('c_') ? activeChatId.replace('c_', '').split('_').find(id => id !== currentUser.id) : null);
    if (otherId) {
      const unsub = onSnapshot(doc(db, 'users', otherId), (d) => {
        if (d.exists()) {
          const u = { id: d.id, ...d.data() } as User;
          setParticipant(u);
          setChatParticipants(prev => ({ ...prev, [u.id]: u }));
        }
      });
      return () => unsub();
    } else setParticipant(null);
  }, [activeChatId, chats, currentUser]);

  const handleDismissInviteBar = () => {
    if (activeChatId) {
        localStorage.setItem(`dismissed_invite_bar_${activeChatId}`, 'true');
        setShowInviteBar(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!activeChatId) return;
    const link = `https://mgn.me/+${activeChatId}`;
    navigator.clipboard.writeText(link).then(() => {
      setAlertMessage('Ссылка скопирована!');
    });
  };

  const handleReplyClick = (targetMsgId: string) => {
    const el = document.getElementById(`msg-${targetMsgId}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMsgId(targetMsgId);
        setTimeout(() => setHighlightedMsgId(null), 1500);
    }
  };

  const handleDeleteMessage = async (msg: Message) => {
    if (!activeChatId) return;
    const path = activeChatId === 'saved' ? `users/${currentUser.id}/saved_messages` : `chats/${activeChatId}/messages`;
    await deleteDoc(doc(db, path, msg.id));
    if (activeChatId !== 'saved') {
        const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(1));
        const snap = await getDocs(q);
        const chatRef = doc(db, 'chats', activeChatId);
        if (snap.empty) { await updateDoc(chatRef, { lastMessage: null }); } else {
            const newLast = snap.docs[0].data();
            await updateDoc(chatRef, { lastMessage: { text: newLast.text || (newLast.audioUrl ? '🎤 Голосовое сообщение' : (newLast.attachments?.length ? '📎 Вложение' : 'Сообщение')), timestamp: newLast.timestamp?.toMillis?.() || Date.now(), senderId: newLast.senderId, senderName: chatParticipants[newLast.senderId]?.username || 'Собеседник' } });
        }
    }
  };

  const processMediaFile = async (file: File, rotation: number): Promise<string> => {
    return new Promise((resolve) => {
      if (rotation === 0 || !file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(ev.target?.result as string); return; }
            
            if (rotation === 90 || rotation === 270) {
              canvas.width = img.height;
              canvas.height = img.width;
            } else {
              canvas.width = img.width;
              canvas.height = img.height;
            }
            
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
            resolve(canvas.toDataURL(file.type));
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSendMessage = async (text: string, audioBlob?: Blob, media?: { file: File, rotation: number }[]) => {
    if (!activeChatId) return;

    // Command handling
    const lowerText = text.trim().toLowerCase();
    if (lowerText === '/get_lapka' || lowerText === '/remove_lapka') {
      const otherId = activeChatId.replace('c_', '').split('_').find(id => id !== currentUser.id);
      if (otherId) {
        try {
          const isGranting = lowerText === '/get_lapka';
          await updateDoc(doc(db, 'users', otherId), { hasLapka: isGranting });
          setAlertMessage(isGranting ? 'Лапка успешно выдана пользователю!' : 'Лапка успешно удалена у пользователя!');
          return; // Don't send command as a message
        } catch (e) {
          console.error("Command execution failed", e);
        }
      }
    }

    const encryptedText = text ? await encryptText(text.trim(), activeChatId) : '';

    if (editingMessage) {
      const path = activeChatId === 'saved' ? `users/${currentUser.id}/saved_messages` : `chats/${activeChatId}/messages`;
      await updateDoc(doc(db, 'chats', activeChatId), { text: encryptedText, edited: true });
      if (activeChatId !== 'saved') {
          const chatMessages = messages[activeChatId] || [];
          const isLast = chatMessages.length > 0 && chatMessages[chatMessages.length - 1].id === editingMessage.id;
          if (isLast) { await updateDoc(doc(db, 'chats', activeChatId), { 'lastMessage.text': encryptedText }); }
      }
      setEditingMessage(null);
      return;
    }

    const now = Date.now();
    const path = activeChatId === 'saved' ? `users/${currentUser.id}/saved_messages` : `chats/${activeChatId}/messages`;

    if (audioBlob) {
      const audioUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });
      const msgData: any = { senderId: currentUser.id, text: encryptedText, timestamp: serverTimestamp(), status: 'sent', audioUrl };
      await addDoc(collection(db, path), msgData);
      await updateChatMetadata(activeChatId, '🎤 Голосовое сообщение', now);
      return;
    }

    if (media && media.length > 0) {
      const attachments: MessageAttachment[] = [];
      for (const item of media) {
        const dataUrl = await processMediaFile(item.file, item.rotation);
        attachments.push({
          url: dataUrl,
          type: item.file.type.startsWith('image/') ? 'image' : 'video',
          name: item.file.name
        });
      }

      const msgData: any = { 
        senderId: currentUser.id, 
        text: encryptedText, 
        timestamp: serverTimestamp(), 
        status: 'sent',
        attachments: attachments
      };
      
      if (replyMessage) {
        msgData.replyPreview = { 
          id: replyMessage.id, 
          senderName: replyMessage.senderId === currentUser.id ? 'Вы' : (chatParticipants[replyMessage.senderId]?.username || 'Собеседник'), 
          text: await encryptText(replyMessage.text || (replyMessage.audioUrl ? '🎤 Голосовое сообщение' : 'Вложение'), activeChatId)
        };
      }

      await addDoc(collection(db, path), msgData);
      await updateChatMetadata(activeChatId, text || '📎 Вложение', now);
      setReplyMessage(null);
      requestAnimationFrame(() => scrollToBottom(false));
      return;
    }

    if (text.trim()) {
      const msgData: any = { senderId: currentUser.id, text: encryptedText, timestamp: serverTimestamp(), status: 'sent' };
      if (replyMessage) {
        msgData.replyPreview = { 
          id: replyMessage.id, 
          senderName: replyMessage.senderId === currentUser.id ? 'Вы' : (chatParticipants[replyMessage.senderId]?.username || 'Собеседник'), 
          text: await encryptText(replyMessage.text || (replyMessage.audioUrl ? '🎤 Голосовое сообщение' : 'Вложение'), activeChatId)
        };
      }
      await addDoc(collection(db, path), msgData);
      await updateChatMetadata(activeChatId, encryptedText, now);
    }
    
    setReplyMessage(null);
    requestAnimationFrame(() => scrollToBottom(false));
  };

  const updateChatMetadata = async (chatId: string, displayTxt: string, ts: number) => {
    if (chatId === 'saved') return;
    const updates: any = { 
      lastMessage: { text: displayTxt, timestamp: ts, senderId: currentUser.id, senderName: currentUser.username },
      archivedBy: {} 
    };
    const otherId = chatId.replace('c_', '').split('_').find(id => id !== currentUser.id);
    const chatData = chats.find(c => c.id === activeChatId);
    if (chatData?.type === 'group') { 
      chatData.participantsUids?.forEach(uid => { 
        if (uid !== currentUser.id) updates[`unreadCounts.${uid}`] = increment(1); 
      }); 
    } else if (otherId) { 
      updates[`unreadCounts.${otherId}`] = increment(1); 
      updates.participantsUids = arrayUnion(currentUser.id, otherId); 
      updates.type = 'private'; 
    }
    await setDoc(doc(db, 'chats', chatId), updates, { merge: true });
  };

  const formatDividerDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Сегодня';
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const groupedMessages = useMemo(() => {
    let msgs = [...(messages[activeChatId!] || [])];
    msgs.sort((a, b) => a.timestamp - b.timestamp);
    if (isSearching && searchQuery.trim()) { const q = searchQuery.toLowerCase(); msgs = msgs.filter(m => m.text.toLowerCase().includes(q)); }
    const groups: { date: string, items: Message[] }[] = [];
    let currentGroup: { date: string, items: Message[] } | null = null;
    msgs.forEach(m => { const dateStr = formatDividerDate(m.timestamp); if (!currentGroup || currentGroup.date !== dateStr) { currentGroup = { date: dateStr, items: [] }; groups.push(currentGroup); } currentGroup.items.push(m); });
    return groups;
  }, [messages, activeChatId, isSearching, searchQuery]);

  const renderStatusSubtext = () => {
    if (typingUsers.length > 0) {
      let typingText = 'печатает';
      if (activeChat?.type === 'group') { if (typingUsers.length === 1) typingText = `${chatParticipants[typingUsers[0]]?.username || 'Участник'} печатает`; else typingText = `${typingUsers.length} человека печатают`; }
      return ( <span className="text-[11px] block text-blue-400 font-medium animate-fade-in flex items-center gap-0.5"> <span className="flex items-center"><span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span></span> {typingText} </span> );
    }
    
    if (activeChat?.type === 'saved') return <span className="text-[11px] block text-[#7f91a4]">Ваше личное облако</span>;

    if (activeChat?.type === 'group') {
      const total = activeChat.participantsUids?.length || 0;
      const online = activeChat.participantsUids?.filter(uid => chatParticipants[uid]?.online).length || 0;
      return (
        <span className="text-[11px] block text-[#7f91a4] flex items-center gap-1">
          <i className="fa-solid fa-users text-[8px] opacity-50"></i>
          {total} участников{online > 0 ? `, ${online} в сети` : ''}
        </span>
      );
    }

    return ( <span className={`text-[11px] block flex items-center gap-1 ${participant?.online ? 'text-blue-400' : 'text-[#7f91a4]'}`}> {formatLastSeen(participant?.lastSeen, participant?.online)} </span> );
  };

  const getContextMenuItems = (msg: Message): MenuItem[] => {
    const isMe = msg.senderId === currentUser.id;
    const items: MenuItem[] = [ { label: 'Ответить', icon: 'fa-reply', onClick: () => { setReplyMessage(msg); setEditingMessage(null); } }, { label: 'Копировать', icon: 'fa-copy', onClick: () => navigator.clipboard.writeText(msg.text) }, ];
    if (isMe && !msg.audioUrl && !msg.attachments?.length) items.push({ label: 'Изменить', icon: 'fa-pen', onClick: () => { setEditingMessage(msg); setReplyMessage(null); } });
    items.push({ label: 'Удалить', icon: 'fa-trash-can', onClick: () => handleDeleteMessage(msg), danger: true });
    return items;
  };

  const handleStartNewChat = (u: User) => {
    setProfileUser(null);
    setGroupSettingsChat(null);
    const chatId = `c_${[currentUser.id, u.id].sort().join('_')}`;
    setActiveChatId(chatId);
  };

  const isChatArchived = (activeChat as any)?.archivedBy?.[currentUser.id] || false;

  const handleToggleArchive = async () => {
    if (!activeChatId || activeChatId === 'saved') return;
    const chatRef = doc(db, 'chats', activeChatId);
    await updateDoc(chatRef, { [`archivedBy.${currentUser.id}`]: !isChatArchived });
    setActiveChatId(null);
  };

  return (
    <div className="flex h-full w-full bg-[#0e1621] overflow-hidden">
      <div className={`flex-shrink-0 flex flex-col h-full bg-[#17212b] border-r border-[#0e1621] transition-all duration-300 ${activeChatId ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full md:w-80 lg:w-96'}`}>
        <Sidebar chats={chats} activeChatId={activeChatId} onChatSelect={(id) => { setActiveChatId(id); }} currentUser={currentUser} onLogout={onLogout} onProfileOpen={(u) => setProfileUser(u || currentUser)} onSettingsOpen={() => setShowSettings(true)} onNewChat={handleStartNewChat} activeTab={'all' as any} onTabSelect={() => {}} sidebarSearch={sidebarSearch} setSidebarSearch={setSidebarSearch} />
      </div>

      <div className={`flex-1 flex flex-col relative min-w-0 transition-all duration-300 ${!activeChatId ? 'hidden md:flex' : 'flex h-full'}`}>
        {activeChatId ? (
          <>
            <div className="h-16 bg-[#17212b] border-b border-[#0e1621] flex items-center px-4 gap-2 z-40 shrink-0">
              {isSearching ? (
                <div className="flex-1 flex items-center gap-2 animate-fade-in">
                  <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="p-2 text-[#7f91a4] hover:text-white"><i className="fa-solid fa-arrow-left text-lg"></i></button>
                  <input autoFocus type="text" placeholder="Поиск сообщений..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent outline-none text-white text-sm" />
                </div>
              ) : (
                <>
                  <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 text-[#7f91a4] hover:text-white"><i className="fa-solid fa-chevron-left text-xl"></i></button>
                  <div className="flex-1 flex items-center gap-3 cursor-pointer min-w-0" onClick={() => { if (activeChat?.type === 'group') setGroupSettingsChat(activeChat); else if (participant) setProfileUser(participant); }}>
                    <div className="relative shrink-0"> 
                        {activeChat?.type === 'saved' ? ( 
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
                                <i className="fa-solid fa-bookmark"></i>
                            </div> 
                        ) : activeChat?.type === 'group' ? ( 
                            <img src={activeChat.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-white/5" alt="group" /> 
                        ) : ( 
                            <div className="relative"> 
                                <img src={participant?.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-white/5" alt="avatar" /> 
                                {participant?.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#17212b] rounded-full"></div>}
                            </div> 
                        )} 
                    </div>
                    <div className="min-w-0 flex-1 ml-1"> 
                        <h2 className="font-bold text-white truncate flex items-center gap-1 leading-tight"> 
                            {participant?.developer && <DevIcon className="mr-0.5" />}
                            {activeChat?.type === 'saved' ? 'Избранное' : activeChat?.type === 'group' ? activeChat.name : (participant?.username || 'Загрузка...')} 
                            {participant?.verified && <VerifiedIcon className="ml-0.5" />} 
                            {participant?.hasLapka && <LapkaIcon className="ml-0.5" />}
                        </h2> 
                        {renderStatusSubtext()} 
                    </div>
                  </div>
                  <button onClick={(ev) => setHeaderMenu({ x: ev.clientX, y: ev.clientY })} className="p-2 text-[#7f91a4] hover:text-white transition-all"><i className="fa-solid fa-ellipsis-vertical text-lg"></i></button>
                </>
              )}
            </div>

            {showInviteBar && (
              <div className="bg-[#17212b] border-b border-[#0e1621] flex items-center justify-center px-4 py-3 animate-fade-in relative z-30 shadow-md">
                <button onClick={() => setShowInviteModal(true)} className="text-blue-400 text-sm font-bold hover:underline">Добавить участников</button>
                <button onClick={handleDismissInviteBar} className="absolute right-4 text-[#7f91a4] hover:text-white p-1"><i className="fa-solid fa-xmark"></i></button>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pt-0 no-scrollbar scroll-smooth chat-bg relative">
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
              <div className="relative z-10">
                {groupedMessages.length > 0 ? groupedMessages.map((group) => (
                    <div key={group.date} className="relative">
                      <DateDivider date={group.date} />
                      <div className="space-y-1">
                          {group.items.map(m => {
                          const sender = chatParticipants[m.senderId];
                          return ( 
                            <MessageBubble 
                              key={m.id} 
                              message={m} 
                              isMe={m.senderId === currentUser.id} 
                              currentUserId={currentUser.id} 
                              currentUserAvatar={currentUser.avatarUrl} 
                              participantAvatar={sender?.avatarUrl} 
                              senderName={sender?.username} 
                              chatType={activeChat?.type} 
                              highlighted={highlightedMsgId === m.id} 
                              onMentionClick={async (h) => { 
                                const hStr = String(h);
                                const q = query(collection(db, 'users'), where('username_handle', '==', hStr));
                                const s = await getDocs(q); 
                                if (!s.empty) { 
                                  const userSnap = s.docs[0]; 
                                  const userData = userSnap.data() as DocumentData;
                                  setProfileUser({ id: userSnap.id, ...userData } as User); 
                                } 
                              }} 
                              onPhoneClick={async (p) => { 
                                const pStr = String(p).replace(/\s/g, '');
                                const q = query(collection(db, 'users'), where('phoneNumber', '==', pStr));
                                const s = await getDocs(q); 
                                if (!s.empty) { 
                                  const userSnap = s.docs[0]; 
                                  const userData = userSnap.data() as DocumentData;
                                  setProfileUser({ id: userSnap.id, ...userData } as User); 
                                } 
                              }} 
                              onInviteClick={(link) => { 
                                const id = link.split('/+')[1]; 
                                if (id) setActiveChatId(id); 
                              }} 
                              onReplyClick={handleReplyClick} 
                              onContextMenu={(ev, msg) => setContextMenu({ x: ev.clientX, y: ev.clientY, msg: { ...msg } })} 
                            /> 
                          );
                          })}
                      </div>
                    </div>
                )) : ( <div className="h-full flex items-center justify-center text-[#7f91a4]/30 py-40"><i className="fa-solid fa-message text-6xl"></i></div> )}
              </div>
            </div>

            <div className={`shrink-0 bg-[#17212b] border-t border-[#0e1621] z-50`}>
              <MessageInput chatId={activeChatId} currentUserId={currentUser.id} chatParticipants={Object.values(chatParticipants).filter(p => activeChat?.participantsUids?.includes(p.id))} onSend={handleSendMessage} replyTo={replyMessage ? { senderName: replyMessage.senderId === currentUser.id ? 'Вы' : (chatParticipants[replyMessage.senderId]?.username || 'Собеседник'), text: replyMessage.text || (replyMessage.audioUrl ? '🎤 Голосовое сообщение' : 'Вложение') } : null} editMessage={editingMessage ? { text: editingMessage.text } : null} onCancelReply={() => { setReplyMessage(null); setEditingMessage(null); }} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center chat-bg relative text-center px-10 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0"></div>
            
            <div className="flex flex-col items-center gap-8 z-10 animate-fade-in relative max-w-sm">
               <div className="relative group cursor-default">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-[32px] bg-[#1c2a38] flex items-center justify-center border border-white/5 relative overflow-hidden">
                    <MainLogo className="w-14 h-14 md:w-16 md:h-16 relative z-10" />
                  </div>
               </div>
               
               <div className="space-y-6">
                 <div className="px-6 py-4 rounded-[24px] border border-white/5 animate-slide-up">
                   <div className="text-white/80 font-bold text-[16px] md:text-[18px] uppercase tracking-[0.3em] block leading-none">MeganNait</div>
                   <div className="text-[10px] md:text-[11px] text-[#7f91a4] font-bold uppercase tracking-[0.4em] mt-3 block opacity-60">THE COMMUNICATION</div>
                 </div>
                 
                 <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                   <p className="text-[14px] md:text-[15px] text-[#7f91a4]/80 font-medium leading-relaxed">
                     Выберите чат, чтобы начать общение
                   </p>
                   <p className="text-[10px] text-[#7f91a4]/30 font-bold uppercase tracking-widest">
                     Security • Privacy • Speed
                   </p>
                 </div>
               </div>
               
               <div className="pt-2 flex gap-2.5 opacity-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                 <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
               </div>
            </div>
          </div>
        )}
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17212b] w-full max-w-[340px] rounded-[24px] overflow-hidden shadow-2xl animate-slide-up flex flex-col border border-white/5 max-h-[80vh]">
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
              <span className="font-bold text-white text-[17px]">Добавить участников</span>
              <button onClick={() => { setShowInviteModal(false); setInviteSearchQuery(''); }} className="text-[#7f91a4] p-1.5 active:scale-90 transition-transform"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
              <div className="bg-[#0e1621] rounded-2xl flex items-center gap-3 px-4 py-2.5 border border-white/5 focus-within:border-blue-500/30 transition-all">
                <i className="fa-solid fa-magnifying-glass text-[14px] text-[#7f91a4]"></i>
                <input type="text" placeholder="Поиск людей..." className="bg-transparent outline-none text-sm text-white flex-1 placeholder-[#7f91a4]" value={inviteSearchQuery} onChange={e => setInviteSearchQuery(e.target.value)} />
              </div>

              <button 
                onClick={handleCopyInviteLink}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-all text-left group rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-[#3390ec]/10 flex items-center justify-center text-[#3390ec] shrink-0 group-hover:bg-[#3390ec]/20">
                  <i className="fa-solid fa-link text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#3390ec] font-bold text-[15px] leading-tight">Пригласить в группу по ссылке</div>
                </div>
              </button>

              <div className="space-y-1">
                {inviteSearchResults.map((u: User) => {
                  const isAlreadyInGroup = activeChat?.participantsUids?.includes(u.id) || false;
                  return (
                    <button 
                      key={u.id} 
                      disabled={isAlreadyInGroup} 
                      onClick={async () => { 
                        if (!activeChatId) return; 
                        await updateDoc(doc(db, 'chats', activeChatId), { participantsUids: arrayUnion(u.id) }); 
                        setShowInviteModal(false); 
                        setInviteSearchQuery(''); 
                      }} 
                      className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all text-left group ${isAlreadyInGroup ? 'opacity-80 cursor-default' : 'hover:bg-white/5 active:scale-[0.98]'}`}
                    > 
                      <div className="relative shrink-0"> 
                        <img src={u.avatarUrl} className="w-11 h-11 rounded-full border border-white/10 object-cover" /> 
                        {isAlreadyInGroup && ( 
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#3390ec] rounded-full flex items-center justify-center border-2 border-[#17212b] shadow-lg"> 
                            <i className="fa-solid fa-check text-[10px] text-white"></i> 
                          </div> 
                        )} 
                      </div> 
                      <div className="flex-1 min-w-0"> 
                        <div className="text-white font-bold text-[15px] truncate flex items-center gap-0.5"> 
                          {u.developer && <DevIcon className="mr-0.5" />}
                          {u.username} {u.verified && <VerifiedIcon className="ml-0.5" />}
                          {u.hasLapka && <LapkaIcon className="ml-0.5" />}
                        </div> 
                        <div className="text-blue-400 text-[12px] font-bold">{u.username_handle}</div> 
                      </div> 
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {headerMenu && (
        <ContextMenu 
          x={headerMenu.x} 
          y={headerMenu.y} 
          items={[ 
            { label: 'Поиск в чате', icon: 'fa-magnifying-glass', onClick: () => setIsSearching(true) }, 
            { label: isChatArchived ? 'Из архива' : 'В архив', icon: 'fa-box-archive', onClick: handleToggleArchive },
            { label: 'Очистить историю', icon: 'fa-broom', onClick: () => { setConfirmation({ title: 'Очистить историю?', message: 'Все сообщения из этого чата будут скрыты для Вас. Это действие нельзя отменить.', confirmText: 'Очистить', isDanger: true, onConfirm: () => updateDoc(doc(db, 'chats', activeChatId!), { [`clearedAt.${currentUser.id}`]: Date.now() }) }); } }, 
            { label: 'Удалить чат', icon: 'fa-trash-can', onClick: () => { setConfirmation({ title: 'Удалить чат?', message: 'Чат будет удален из Вашего списка. Вы больше не сможете просматривать историю сообщений.', confirmText: 'Удалить', isDanger: true, onConfirm: () => { updateDoc(doc(db, 'chats', activeChatId!), { participantsUids: arrayRemove(currentUser.id) }); setActiveChatId(null); } }); }, danger: true } 
          ]} 
          onClose={() => setHeaderMenu(null)} 
        />
      )}

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.msg ? getContextMenuItems(contextMenu.msg) : []} onClose={() => setContextMenu(null)} />
      )}

      {confirmation && ( <ConfirmationModal {...confirmation} onClose={() => setConfirmation(null)} /> )}
      
      {profileUser && (
        <ProfileModal 
          user={profileUser} 
          currentUser={currentUser} 
          isMe={profileUser?.id === currentUser.id} 
          onClose={() => setProfileUser(null)} 
          onImpersonate={() => {
            if (onImpersonateProp && profileUser) onImpersonateProp(profileUser);
            setProfileUser(null);
          }}
          // Fix: Explicitly type the updated user to User and perform document update safely
          onUpdate={(updatedUser: User) => {
            const { id, ...userData } = updatedUser;
            if (id) {
              updateDoc(doc(db, 'users', id), userData);
            }
          }} 
          onStartChat={handleStartNewChat} 
        />
      )}
      {showSettings && (
        <SettingsModal 
          currentUser={currentUser}
          onClose={() => setShowSettings(false)}
        />
      )}
      {groupSettingsChat && <GroupSettingsModal chat={groupSettingsChat} currentUser={currentUser} onClose={() => setGroupSettingsChat(null)} onExitGroup={() => { setGroupSettingsChat(null); setActiveChatId(null); }} onAddParticipant={() => setShowInviteModal(true)} onProfileClick={(u: User) => { setGroupSettingsChat(null); setProfileUser(u); }} />}
      {alertMessage && <CustomAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
    </div>
  );
};

export default Messenger;