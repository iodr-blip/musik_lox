
import React, { useState, useEffect, useRef } from 'react';
import { Chat, User } from '../types';
import { db } from '../services/firebase';
import { doc, updateDoc, arrayRemove, onSnapshot, collection, query, where, getDoc } from 'firebase/firestore';
import { VerifiedIcon } from './Messenger';

interface GroupSettingsModalProps {
  chat: Chat;
  currentUser: User;
  onClose: () => void;
  onExitGroup: () => void;
  onAddParticipant: () => void;
  onProfileClick: (user: User) => void;
}

const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ chat, currentUser, onClose, onExitGroup, onAddParticipant, onProfileClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(chat.name || '');
  const [desc, setDesc] = useState(chat.description || '');
  const [participants, setParticipants] = useState<User[]>([]);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const isOwner = chat.ownerId === currentUser.id;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!chat.participantsUids || chat.participantsUids.length === 0) return;
    const q = query(collection(db, 'users'), where('__name__', 'in', chat.participantsUids));
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      users.sort((a, b) => {
        if (a.id === chat.ownerId) return -1;
        if (b.id === chat.ownerId) return 1;
        if (a.online && !b.online) return -1;
        if (!a.online && b.online) return 1;
        return a.username.localeCompare(b.username);
      });
      setParticipants(users);
    });
    return () => unsub();
  }, [chat.participantsUids, chat.ownerId]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await updateDoc(doc(db, 'chats', chat.id), {
      name: name.trim(),
      description: desc.trim()
    });
    setIsEditing(false);
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (userId === chat.ownerId) return;
    await updateDoc(doc(db, 'chats', chat.id), {
      participantsUids: arrayRemove(userId),
      [`unreadCounts.${userId}`]: 0 
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 10);
  };

  const getParticipantCountText = (count: number) => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastDigit === 1 && lastTwoDigits !== 11) return `${count} участник`;
    if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) return `${count} участника`;
    return `${count} участников`;
  };

  const formatLastSeen = (user: User) => {
    if (user.online) return 'в сети';
    if (!user.lastSeen) return 'был(а) недавно';
    const now = Date.now();
    const diff = now - user.lastSeen;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'был(а) только что';
    if (mins < 60) return `был(а) ${mins} мин. назад`;
    const d = new Date(user.lastSeen);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return `был сегодня в ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (d.toDateString() === yesterday.toDateString()) return `был вчера в ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `был(а) ${d.toLocaleDateString()}`;
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-[420px] bg-[#17212b] md:rounded-[28px] shadow-2xl overflow-hidden animate-slide-up flex flex-col border border-white/5 h-full md:h-auto md:max-h-[90vh]">
        
        <div className={`flex items-center justify-between p-4 px-6 shrink-0 z-50 transition-all ${scrolled ? 'bg-[#17212b]/90 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-[#7f91a4] hover:text-white transition-all active:scale-90">
              <i className="fa-solid fa-chevron-left text-lg"></i>
            </button>
            <h2 className={`text-[17px] font-semibold text-white transition-opacity ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
              {chat.name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                className={`p-2 rounded-full transition-all active:scale-90 ${isEditing ? 'text-blue-400 bg-blue-400/10' : 'text-[#7f91a4] hover:bg-white/5'}`}
              >
                <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-pen-to-square'} text-lg`}></i>
              </button>
            )}
            <button onClick={() => setShowConfirmExit(true)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all active:scale-90">
              <i className="fa-solid fa-right-from-bracket text-lg"></i>
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto no-scrollbar pb-8"
        >
          <div className="px-8 pt-2 pb-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-[38px] overflow-hidden border-4 border-[#0e1621] shadow-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative group">
                {chat.avatarUrl ? (
                  <img src={chat.avatarUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="avatar" />
                ) : (
                  <span className="text-4xl font-bold text-white uppercase">{chat.name?.[0]}</span>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                    <i className="fa-solid fa-camera text-white text-2xl"></i>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white w-9 h-9 rounded-2xl flex items-center justify-center border-4 border-[#17212b] shadow-xl">
                 <i className="fa-solid fa-users text-sm"></i>
              </div>
            </div>
            
            {isEditing ? (
              <div className="w-full max-w-[280px]">
                <input 
                  autoFocus
                  className="w-full bg-transparent text-2xl font-bold outline-none text-white border-b-2 border-blue-500 text-center pb-2 placeholder:text-white/20"
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Название группы"
                />
              </div>
            ) : (
              <h3 className="text-2xl font-bold text-white leading-tight mb-2 tracking-tight px-4">{chat.name}</h3>
            )}
            <span className="text-[14px] font-semibold text-blue-400/80 tracking-wide uppercase">{getParticipantCountText(participants.length)}</span>
          </div>

          <div className="px-6 space-y-2">
            <div className="bg-[#0e1621]/40 rounded-[24px] p-5 border border-white/5 group hover:bg-[#0e1621]/60 transition-all cursor-default">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-quote-left text-blue-500 text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <textarea 
                      className="w-full bg-transparent text-[15px] outline-none text-white border-b border-white/10 focus:border-blue-500 transition-all resize-none py-1 no-scrollbar"
                      rows={3}
                      value={desc} onChange={e => setDesc(e.target.value)}
                      placeholder="Добавьте описание группы..."
                    />
                  ) : (
                    <div className="text-[15px] text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
                      {chat.description || 'У этой группы пока нет описания. Владелец может добавить его в настройках.'}
                    </div>
                  )}
                  <div className="text-[#7f91a4] text-[11px] font-semibold uppercase tracking-widest mt-2 opacity-50">Описание</div>
                </div>
              </div>
            </div>

            {isOwner && (
              <button className="w-full bg-[#0e1621]/40 rounded-[24px] p-5 border border-white/5 flex items-center gap-4 hover:bg-blue-500/5 transition-all active:scale-[0.98]">
                 <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-link text-green-500 text-sm"></i>
                 </div>
                 <div className="flex-1 text-left">
                    <div className="text-[14px] text-white font-semibold">Ссылка-приглашение</div>
                    <div className="text-[11px] text-[#7f91a4] font-semibold truncate opacity-50">mgn.me/+{chat.id}</div>
                 </div>
                 <i className="fa-solid fa-chevron-right text-[12px] text-[#7f91a4]"></i>
              </button>
            )}
          </div>

          <div className="mt-8">
            <div className="px-8 mb-4 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#7f91a4] uppercase tracking-[0.2em] opacity-60">
                Участники
              </span>
              <button 
                onClick={onAddParticipant}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all active:scale-95 border border-blue-400/20"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span className="text-[11px] font-semibold uppercase">Добавить</span>
              </button>
            </div>

            <div className="flex flex-col px-4">
              {participants.map(p => (
                <div 
                  key={p.id} 
                  className="flex items-center gap-4 p-3 hover:bg-white/[0.03] transition-all rounded-[20px] group relative"
                >
                  <button onClick={() => onProfileClick(p)} className="relative shrink-0 active:scale-90 transition-transform">
                    <img src={p.avatarUrl} className="w-12 h-12 rounded-[18px] object-cover border border-white/5 shadow-md" alt="avatar" />
                    {p.online && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-[3px] border-[#17212b] rounded-full" />}
                  </button>
                  <div className="flex-1 min-w-0 pr-2 flex items-center justify-between">
                    <div className="flex flex-col truncate pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-white font-semibold text-[15px] truncate">{p.username} {p.surname || ''}</span>
                            {p.verified && <VerifiedIcon />}
                        </div>
                        <div className={`text-[12px] font-medium ${p.online ? 'text-blue-400' : 'text-[#7f91a4]'}`}>
                            {formatLastSeen(p)}
                        </div>
                    </div>
                    {p.id === chat.ownerId && (
                        <span className="text-blue-500 font-bold uppercase text-[9px] tracking-wider shrink-0 ml-4">Владелец</span>
                    )}
                  </div>
                  
                  {isOwner && p.id !== currentUser.id && (
                    <button 
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="opacity-0 group-hover:opacity-100 p-2.5 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-90"
                      title="Удалить из группы"
                    >
                      <i className="fa-solid fa-user-minus"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {showConfirmExit && (
          <div className="absolute inset-0 z-[100] bg-[#17212b]/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#0e1621] p-8 rounded-[32px] border border-white/5 shadow-2xl w-full max-w-[320px] text-center animate-slide-up">
               <div className="w-16 h-16 bg-red-500/10 rounded-[22px] flex items-center justify-center mx-auto mb-6">
                  <i className="fa-solid fa-door-open text-red-500 text-2xl"></i>
               </div>
               <h4 className="text-white font-bold text-xl mb-3">Покинуть группу?</h4>
               <p className="text-[#7f91a4] text-sm leading-relaxed mb-8">
                 {isOwner ? 'Вы владелец этой группы. При выходе группа будет полностью удалена для всех участников.' : 'Вы больше не сможете просматривать историю сообщений.'}
               </p>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={onExitGroup}
                    className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-500/20"
                  >
                    Да, покинуть
                  </button>
                  <button 
                    onClick={() => setShowConfirmExit(false)}
                    className="w-full py-4 text-[#7f91a4] font-bold hover:bg-white/5 rounded-2xl transition-all"
                  >
                    Отмена
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupSettingsModal;
