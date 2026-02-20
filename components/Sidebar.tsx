
import React, { useState, useEffect, useMemo } from 'react';
import { Chat, User, AppTab } from '../types';
import { db } from '../services/firebase';
import { decryptText } from '../services/encryption';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { VerifiedIcon, DevIcon, LapkaIcon } from './Messenger';
import { MainLogo } from './Auth';
import GroupCreateModal from './GroupCreateModal';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onChatSelect: (id: string) => void;
  activeTab: AppTab;
  onTabSelect: (tab: AppTab) => void;
  currentUser: User;
  onLogout: () => void;
  onProfileOpen: (user?: User) => void;
  onSettingsOpen: () => void;
  onNewChat: (targetUser: User) => void;
  sidebarSearch: string;
  setSidebarSearch: (val: string) => void;
}

const ChatItem: React.FC<{ 
  chat: Chat, 
  isActive: boolean, 
  currentUserId: string, 
  onClick: () => void 
}> = ({ chat, isActive, currentUserId, onClick }) => {
  const [participant, setParticipant] = useState<User | null>(null);
  const [decryptedLastText, setDecryptedLastText] = useState<string>('');
  const isSaved = chat.type === 'saved';
  const isGroup = chat.type === 'group';
  const unreadCount = chat.unreadCounts?.[currentUserId] || 0;

  useEffect(() => {
    if (isSaved || isGroup) return;
    const otherId = chat.participantsUids?.find(id => id !== currentUserId);
    if (otherId) {
      const unsub = onSnapshot(doc(db, 'users', otherId), (doc) => {
        if (doc.exists()) setParticipant({ id: doc.id, ...doc.data() } as User);
      });
      return () => unsub();
    }
  }, [chat.id, currentUserId, isSaved, isGroup, chat.participantsUids]);

  useEffect(() => {
    const updateLastText = async () => {
        const clearedAt = (chat as any)?.clearedAt?.[currentUserId] || 0;
        
        if (!chat.lastMessage || chat.lastMessage.timestamp <= clearedAt) {
            setDecryptedLastText('История очищена');
            return;
        }

        const isMe = chat.lastMessage.senderId === currentUserId;
        const rawText = chat.lastMessage.text;
        
        let display = await decryptText(rawText, chat.id);
        
        if (isMe) display = 'Вы: ' + display;
        else if (isGroup && chat.lastMessage.senderName) display = `${chat.lastMessage.senderName}: ${display}`;
        
        setDecryptedLastText(display);
    };

    updateLastText();
  }, [chat.lastMessage, currentUserId, chat.id, (chat as any)?.clearedAt?.[currentUserId]]);

  const showTime = useMemo(() => {
    const clearedAt = (chat as any)?.clearedAt?.[currentUserId] || 0;
    if (chat.lastMessage && chat.lastMessage.timestamp > clearedAt) {
      return new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return null;
  }, [chat.lastMessage, (chat as any)?.clearedAt?.[currentUserId]]);

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3.5 p-3 md:p-3.5 transition-all relative group active:scale-[0.98] ${isActive ? 'bg-blue-600' : 'hover:bg-white/[0.03]'}`}>
      <div className="relative flex-shrink-0">
        {isSaved ? (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
            <i className="fa-solid fa-bookmark text-xl md:text-2xl" />
          </div>
        ) : isGroup ? (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden shadow-md border border-white/5">
            <img src={chat.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
          </div>
        ) : (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-700 flex items-center justify-center text-white overflow-hidden shadow-md border border-white/5">
            {participant?.avatarUrl ? <img src={participant.avatarUrl} className="w-full h-full object-cover" alt="avatar" /> : <i className="fa-solid fa-user text-lg md:text-xl" />}
          </div>
        )}
        {!isSaved && !isGroup && participant?.online && <div className="absolute bottom-0.5 right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-[#17212b] rounded-full" />}
      </div>
      <div className="flex-1 text-left truncate">
        <div className="flex justify-between items-center mb-0.5">
          <span className={`font-bold text-[15px] md:text-[16px] truncate flex items-center gap-0.5 ${isActive ? 'text-white' : 'text-gray-100'}`}>
            {participant?.developer && <DevIcon className="flex-shrink-0 mr-0.5" />}
            <span className="truncate">{isSaved ? 'Избранное' : isGroup ? chat.name : (participant?.username || 'Загрузка...')}</span>
            {!isSaved && !isGroup && participant?.verified && (
              <VerifiedIcon className="flex-shrink-0 ml-0.5" />
            )}
            {!isSaved && !isGroup && participant?.hasLapka && (
              <LapkaIcon className="flex-shrink-0 ml-0.5" />
            )}
          </span>
          {showTime && (
            <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-white/60' : 'text-[#7f91a4]'}`}>
              {showTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
            <p className={`text-[12px] md:text-[13px] truncate flex-1 pr-2 ${isActive ? 'text-white/80' : 'text-[#7f91a4]'}`}>
                {decryptedLastText}
            </p>
            {unreadCount > 0 && !isActive && (
                <div className="bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg animate-fade-in border border-white/10">
                    {unreadCount}
                </div>
            )}
        </div>
      </div>
      {!isActive && <div className="absolute bottom-0 left-20 right-0 h-[0.5px] bg-white/[0.04]" />}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  chats, activeChatId, onChatSelect, activeTab, onTabSelect, currentUser, onLogout, onProfileOpen, onSettingsOpen, onNewChat, sidebarSearch, setSidebarSearch
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showContactsSearch, setShowContactsSearch] = useState(false);
  const [registry, setRegistry] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [canInstall, setCanInstall] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [isArchivedView, setIsArchivedView] = useState(false);

  const isAdmin = ['@bee', '@megannait'].includes(currentUser.username_handle.toLowerCase());

  useEffect(() => {
    const handleInstallable = () => setCanInstall(true);
    window.addEventListener('pwa-installable', handleInstallable);
    return () => window.removeEventListener('pwa-installable', handleInstallable);
  }, []);

  const displayChats = useMemo(() => {
    let all = [...chats];
    
    all = all.filter(c => {
      const isArchived = (c as any).archivedBy?.[currentUser.id] || false;
      return isArchivedView ? isArchived : !isArchived;
    });

    if (!isArchivedView && !all.find(c => c.type === 'saved')) {
      all.push({ id: 'saved', type: 'saved', participants: [currentUser], unreadCounts: { [currentUser.id]: 0 } } as Chat);
    }
    
    return all.sort((a, b) => {
        const clearedA = (a as any).clearedAt?.[currentUser.id] || 0;
        const clearedB = (b as any).clearedAt?.[currentUser.id] || 0;
        
        const timeA = (a.lastMessage?.timestamp || 0) > clearedA ? (a.lastMessage?.timestamp || 0) : 0;
        const timeB = (b.lastMessage?.timestamp || 0) > clearedB ? (b.lastMessage?.timestamp || 0) : 0;
        
        return timeB - timeA;
    });
  }, [chats, currentUser, isArchivedView]);

  const archivedCount = useMemo(() => {
    return chats.filter(c => (c as any).archivedBy?.[currentUser.id]).length;
  }, [chats, currentUser.id]);

  const archivedUnreadCount = useMemo(() => {
    return chats
      .filter(c => (c as any).archivedBy?.[currentUser.id])
      .reduce((sum, c) => sum + (c.unreadCounts?.[currentUser.id] || 0), 0);
  }, [chats, currentUser.id]);

  useEffect(() => {
    const trimmed = sidebarSearch.trim();
    if (trimmed.length > 1) {
      let q;
      if (trimmed.startsWith('+')) {
        q = query(collection(db, 'users'), where('phoneNumber', '==', trimmed));
      } else {
        const lowerSearch = trimmed.toLowerCase();
        const prefix = lowerSearch.startsWith('@') ? lowerSearch : '@' + lowerSearch;
        q = query(
          collection(db, 'users'),
          where('username_handle', '>=', prefix),
          where('username_handle', '<=', prefix + '\uf8ff')
        );
      }
      
      getDocs(q).then(snap => {
        setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() }) as User).filter(u => u.id !== currentUser.id));
      }).catch(err => {
        console.error("Search query failed", err);
        setSearchResults([]);
      });
    } else {
      setSearchResults([]);
    }
  }, [sidebarSearch, currentUser.id]);

  const loadAllUsers = () => {
    getDocs(collection(db, 'users')).then(snap => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }) as User).filter(u => u.id !== currentUser.id);
      const sortedUsers = users.sort((a, b) => {
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        const timeA = a.createdAt || a.lastSeen || 0;
        const timeB = b.createdAt || b.lastSeen || 0;
        return timeB - timeA;
      });
      setRegistry(sortedUsers);
    });
  };

  const handleInstallApp = async () => {
    const prompt = (window as any).deferredPrompt;
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      (window as any).deferredPrompt = null;
      setCanInstall(false);
    }
  };

  const handleUserSelect = (u: User) => {
    onNewChat(u);
    setSidebarSearch('');
    setIsDrawerOpen(false);
    setShowContactsSearch(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#17212b] border-r border-[#0e1621] w-full relative overflow-hidden pt-[env(safe-area-inset-top)]">
      {isDrawerOpen && <div className="fixed inset-0 bg-black/50 z-[100] animate-fade-in" onClick={() => setIsDrawerOpen(false)} />}

      {showContactsSearch && (
        <div className="fixed inset-0 z-[102] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#17212b] w-full max-w-[340px] rounded-[24px] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[70vh] border border-white/5">
            <div className="p-4 border-b border-[#0e1621] flex items-center justify-between shrink-0">
              <span className="font-bold text-white">Пользователи</span>
              <button onClick={() => setShowContactsSearch(false)} className="text-[#7f91a4] p-1.5 hover:text-white transition-all active:scale-90"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div className="p-4 overflow-y-auto no-scrollbar flex-1 space-y-1">
              {registry.map(u => (
                <div key={u.id} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all group">
                  <button onClick={() => { onProfileOpen(u); setShowContactsSearch(false); }} className="relative shrink-0 active:scale-90 transition-transform">
                    <img src={u.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="avatar" />
                    {u.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#17212b] rounded-full" />}
                  </button>
                  <button onClick={() => handleUserSelect(u)} className="text-left truncate min-w-0 flex-1 active:scale-[0.98]">
                    <div className="font-bold text-sm text-white flex items-center gap-0.5 min-w-0">
                      {u.developer && <DevIcon className="flex-shrink-0 mr-0.5" />}
                      <span className="truncate">{u.username}</span>
                      {u.verified && <VerifiedIcon className="flex-shrink-0 ml-0.5" />}
                      {u.hasLapka && <LapkaIcon className="flex-shrink-0 ml-0.5" />}
                    </div>
                    <div className="text-[11px] text-blue-400 font-bold truncate">{u.username_handle}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showGroupCreate && (
        <GroupCreateModal 
          currentUser={currentUser} 
          onClose={() => setShowGroupCreate(false)} 
          onCreated={(id) => { onChatSelect(id); setShowGroupCreate(false); }}
        />
      )}

      <div className={`fixed inset-y-0 left-0 w-72 bg-[#17212b] z-[101] transform transition-transform duration-300 ease-out flex flex-col border-r border-[#0e1621] pt-[env(safe-area-inset-top)] ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex flex-col gap-4 border-b border-black/20 shrink-0 relative">
          <div className="flex justify-between items-start">
            <img src={currentUser.avatarUrl} className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white/5" alt="avatar" />
            <MainLogo className="w-10 h-10 opacity-30 drop-shadow-[0_0_8px_rgba(0,198,255,0.3)]" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-lg text-white flex items-center gap-0.5 min-w-0">
              {currentUser.developer && <DevIcon className="mr-0.5 mb-0.5" />}
              <span className="truncate">{currentUser.username} {currentUser.surname || ''}</span>
              {currentUser.verified && <VerifiedIcon className="w-5 h-5 ml-0.5 mb-0.5" />}
              {currentUser.hasLapka && <LapkaIcon className="w-5 h-5 ml-0.5 mb-0.5" />}
            </div>
            <div className="text-xs text-blue-400 font-bold mt-1 truncate">{currentUser.username_handle}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          <button onClick={() => { onProfileOpen(); setIsDrawerOpen(false); }} className="w-full flex items-center gap-6 px-5 py-3.5 hover:bg-white/5 transition-all group text-left">
            <i className="fa-solid fa-circle-user text-xl text-[#7f91a4] group-hover:text-white transition-all w-6 text-center"></i>
            <span className="text-sm font-medium text-white">Мой профиль</span>
          </button>
          
          {isAdmin && (
            <button onClick={() => { loadAllUsers(); setShowContactsSearch(true); setIsDrawerOpen(false); }} className="w-full flex items-center gap-6 px-5 py-3.5 hover:bg-white/5 transition-all group text-left">
              <i className="fa-solid fa-users text-xl text-[#7f91a4] group-hover:text-white transition-all w-6 text-center"></i>
              <span className="text-sm font-medium text-white">Пользователи</span>
            </button>
          )}

          <button onClick={() => { setShowGroupCreate(true); setIsDrawerOpen(false); }} className="w-full flex items-center gap-6 px-5 py-3.5 hover:bg-white/5 transition-all group text-left">
            <i className="fa-solid fa-users text-xl text-[#7f91a4] group-hover:text-white transition-all w-6 text-center"></i>
            <span className="text-sm font-medium text-white">Создать группу</span>
          </button>

          <button onClick={() => { onChatSelect('saved'); setIsDrawerOpen(false); }} className="w-full flex items-center gap-6 px-5 py-3.5 hover:bg-white/5 transition-all group text-left">
            <i className="fa-solid fa-bookmark text-xl text-[#7f91a4] group-hover:text-white transition-all w-6 text-center"></i>
            <span className="text-sm font-medium text-white">Избранное</span>
          </button>
          
          {canInstall && (
            <button onClick={handleInstallApp} className="mx-4 my-4 flex items-center gap-4 px-4 py-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-left rounded-xl active:scale-95">
              <i className="fa-solid fa-mobile-screen-button text-lg w-5 text-center"></i>
              <span className="text-[11px] font-bold uppercase tracking-wider">Установить приложение</span>
            </button>
          )}

          <button onClick={() => { onSettingsOpen(); setIsDrawerOpen(false); }} className="w-full flex items-center gap-6 px-5 py-3.5 hover:bg-white/5 transition-all group text-left mt-2">
            <i className="fa-solid fa-gear text-xl text-[#7f91a4] group-hover:text-white transition-all w-6 text-center"></i>
            <span className="text-sm font-medium text-white">Настройки</span>
          </button>

          <button onClick={onLogout} className="w-full flex items-center gap-6 px-5 py-3.5 hover:bg-red-500/10 text-red-400 transition-all mt-4 text-left">
            <i className="fa-solid fa-right-from-bracket text-xl w-6 text-center"></i>
            <span className="text-sm font-medium">Выйти</span>
          </button>
        </div>
        <div className="p-5 text-[11px] text-[#7f91a4] shrink-0 pb-[max(env(safe-area-inset-bottom),20px)]">MeganNait E2EE 1.4.0</div>
      </div>

      <div className="p-2 md:p-3 flex items-center gap-2 shrink-0">
        <button onClick={() => setIsDrawerOpen(true)} className="text-[#7f91a4] p-2 hover:text-white transition-all active:scale-90">
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
        {isArchivedView ? (
          <div className="flex-1 flex items-center gap-3 pl-2">
            <button 
              onClick={() => setIsArchivedView(false)}
              className="text-blue-400 hover:text-white p-1 transition-all"
            >
              <i className="fa-solid fa-arrow-left text-lg"></i>
            </button>
            <span className="font-bold text-white">Архив чатов</span>
          </div>
        ) : (
          <div className="flex-1 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[12px] text-[#7f91a4]"></i>
            <input 
              id="sidebar-search-input"
              type="text" placeholder="Поиск (имя или номер)" value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} 
              className="w-full bg-[#0e1621] rounded-full py-2 pl-10 pr-4 text-sm outline-none text-white placeholder-[#7f91a4] border border-white/5 focus:border-blue-500/30 transition-all" 
            />
            {sidebarSearch && (
              <button onClick={() => setSidebarSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f91a4] hover:text-white transition-colors">
                <i className="fa-solid fa-circle-xmark text-sm"></i>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {sidebarSearch.trim().length > 1 && searchResults.length > 0 && (
          <div className="p-2">
            <div className="px-4 py-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">Глобальный поиск</div>
            {searchResults.map(u => (
              <div key={u.id} className="w-full flex items-center gap-3.5 p-3.5 hover:bg-white/5 transition-all animate-fade-in rounded-2xl group">
                <button onClick={() => onProfileOpen(u)} className="relative flex-shrink-0 active:scale-90 transition-transform">
                  <img src={u.avatarUrl} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-white/10" alt="avatar" />
                </button>
                <button onClick={() => handleUserSelect(u)} className="text-left truncate flex-1 min-w-0 active:scale-[0.98]">
                  <div className="font-bold text-[15px] md:text-[16px] text-white flex items-center gap-0.5 min-w-0">
                    {u.developer && <DevIcon className="flex-shrink-0 mr-0.5" />}
                    <span className="truncate">{u.username}</span>
                    {u.verified && <VerifiedIcon className="flex-shrink-0 ml-0.5" />}
                    {u.hasLapka && <LapkaIcon className="flex-shrink-0 ml-0.5" />}
                  </div>
                  <div className="text-[11px] md:text-[12px] text-blue-400 font-bold truncate">{u.username_handle}</div>
                </button>
              </div>
            ))}
          </div>
        )}

        {sidebarSearch.trim().length <= 1 && (
          <div className="flex flex-col pb-[max(env(safe-area-inset-bottom),10px)]">
            {!isArchivedView && archivedCount > 0 && (
              <button 
                onClick={() => setIsArchivedView(true)}
                className="w-full flex items-center gap-3.5 p-3 md:p-3.5 hover:bg-white/[0.03] transition-all relative group"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1c2a38] flex items-center justify-center text-[#7f91a4] shrink-0">
                  <i className="fa-solid fa-box-archive text-xl"></i>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Архив чатов</span>
                    {archivedUnreadCount > 0 && (
                      <div className="bg-[#7f91a4] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {archivedUnreadCount}
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] text-[#7f91a4] truncate">
                    Чаты, в которых скрыты уведомления
                  </p>
                </div>
                <div className="absolute bottom-0 left-20 right-0 h-[0.5px] bg-white/[0.04]" />
              </button>
            )}

            {displayChats.length === 0 && isArchivedView && (
              <div className="p-20 text-center text-[#7f91a4] flex flex-col items-center gap-4">
                <i className="fa-solid fa-box-archive text-5xl opacity-20"></i>
                <p className="text-sm font-medium">Здесь будут храниться заархивированные чаты</p>
              </div>
            )}

            {displayChats.map(chat => (
              <ChatItem 
                key={chat.id} chat={chat} isActive={activeChatId === chat.id} 
                currentUserId={currentUser.id} onClick={() => onChatSelect(chat.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
