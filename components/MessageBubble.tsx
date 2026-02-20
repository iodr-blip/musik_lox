import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Message, MessageAttachment, User } from '../types';
import { VerifiedIcon, DevIcon, LapkaIcon } from './Messenger';
// Added missing firebase imports
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onContextMenu: (e: React.MouseEvent, msg: Message) => void;
  onImageClick?: (url: string) => void;
  currentUserId: string;
  currentUserAvatar?: string;
  participantAvatar?: string;
  senderName?: string;
  chatType?: string;
  onMentionClick?: (handle: string) => void;
  onPhoneClick?: (phone: string) => void;
  onInviteClick?: (link: string) => void;
  highlighted?: boolean;
  onReplyClick?: (msgId: string) => void;
}

const MediaViewer: React.FC<{ attachment: MessageAttachment, onClose: () => void }> = ({ attachment, onClose }) => (
  <div 
    className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fade-in"
    onClick={onClose}
  >
    <div className="absolute top-4 right-4 z-[1001]">
        <button onClick={onClose} className="text-white/60 hover:text-white p-3 transition-all bg-white/10 rounded-full">
            <i className="fa-solid fa-xmark text-2xl"></i>
        </button>
    </div>
    <div className="max-w-full max-h-full flex items-center justify-center animate-slide-up" onClick={e => e.stopPropagation()}>
        {attachment.type === 'video' ? (
            <video src={attachment.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
        ) : (
            <img src={attachment.url} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="Full view" />
        )}
    </div>
  </div>
);

const VoicePlayer: React.FC<{ url: string, isMe: boolean, message: Message }> = ({ url, isMe, message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      if (total) setProgress((current / total) * 100);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatDuration = (d: number) => {
    const min = Math.floor(d / 60);
    const sec = Math.floor(d % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex items-center gap-3 py-1.5 min-w-[220px] relative pr-1">
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={onTimeUpdate} 
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />
      <button 
        onClick={togglePlay} 
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0
          ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
      >
        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm ${!isPlaying ? 'ml-0.5' : ''}`}></i>
      </button>
      
      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        <div className="h-1 bg-white/20 rounded-full relative overflow-hidden">
            <div 
                className={`absolute inset-y-0 left-0 transition-all duration-100 ${isMe ? 'bg-white' : 'bg-blue-400'}`} 
                style={{ width: `${progress}%` }} 
            />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/50">
            {formatDuration(audioRef.current?.currentTime || duration)} / {message.fileSize || '7.9 KB'}
          </span>
        </div>
      </div>

      <div className="absolute right-1 bottom-[-4px] flex items-center gap-1 pointer-events-none">
        <span className="text-[10px] font-bold text-white/40">
          {formatTime(message.timestamp)}
        </span>
        {isMe && <StatusIcon status={message.status} className="w-[16px] h-[10px]" />}
      </div>
    </div>
  );
};

const StatusIcon = ({ status, className = "" }: { status?: string, className?: string }) => {
  const tickColor = "#4cc2ff"; 
  if (status === 'read') {
    return (
      <svg width="15" height="10" viewBox="0 0 18 12" fill="none" className={className}>
        <path d="M1 6.5L5 10.5L13.5 1.5" stroke={tickColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 6.5L9 10.5L17.5 1.5" stroke={tickColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="11" height="10" viewBox="0 0 13 12" fill="none" className={className}>
      <path d="M1 6.5L5 10.5L12 1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Logic to check if message contains ONLY 1 to 3 emojis
const isJumboEmojiOnly = (text: string) => {
  if (!text) return false;
  // Modern emoji regex
  const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c[\udd8e]|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c[\ude1a]|\ud83c[\ude2f]|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c[\udc04]|[\u2705]|\u270a|\u270b|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c[\udccf]|\u2934|\u2935|[\u2194-\u2199]|[\u21a9-\u21aa]|\ufe0f|\u200d)+$/u;
  const clean = text.replace(/\s/g, '');
  const count = Array.from(clean).length; // Proper length for emojis with modifiers
  return count > 0 && count <= 3 && emojiRegex.test(clean);
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isMe, 
  onContextMenu, 
  currentUserId,
  onMentionClick,
  onPhoneClick,
  onInviteClick,
  participantAvatar,
  senderName,
  chatType,
  highlighted,
  onReplyClick
}) => {
  const [viewingMedia, setViewingMedia] = useState<MessageAttachment | null>(null);
  const [senderInfo, setSenderInfo] = useState<User | null>(null);

  useEffect(() => {
    if (message.senderId) {
      getDoc(doc(db, 'users', message.senderId)).then(snap => {
        if (snap.exists()) setSenderInfo({ id: snap.id, ...snap.data() } as User);
      });
    }
  }, [message.senderId]);

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };
  
  const isJumbo = useMemo(() => isJumboEmojiOnly(message.text), [message.text]);

  const parsedContent = useMemo(() => {
    const text = message.text || '';
    if (!text) return null;
    
    const parts = text.split(/(@[a-zA-Z0-9_]+|\+888\s?\d{4}\s?\d{4}|(?:https?:\/\/)?(?:mgn\.me|mgn\.zw)\/\+[a-zA-Z0-9]+)/g);
    
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('@')) {
        return (
          <span 
            key={i} 
            onClick={(e) => { e.stopPropagation(); onMentionClick?.(part); }}
            className="text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('+888')) {
        return (
          <span 
            key={i} 
            onClick={(e) => { e.stopPropagation(); onPhoneClick?.(part); }}
            className="text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      if (part.includes('mgn.me/+') || part.includes('mgn.zw/+')) {
        return (
          <span 
            key={i} 
            onClick={(e) => { e.stopPropagation(); onInviteClick?.(part); }}
            className="text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, [message.text, onMentionClick, onPhoneClick, onInviteClick]);

  const showParticipantInfo = chatType === 'group' && !isMe;

  return (
    <>
      <div 
        id={`msg-${message.id}`}
        className={`flex w-full select-none mb-1 gap-2 items-end transition-all duration-300 ${isMe ? 'justify-end' : 'justify-start'} ${highlighted ? 'bg-blue-500/10' : ''}`}
      >
        {showParticipantInfo && (
          <div className="shrink-0 mb-0.5">
            <img 
              src={participantAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'U')}&background=3390ec&color=fff`} 
              className="w-8 h-8 rounded-full object-cover border border-white/10" 
              alt="avatar"
            />
          </div>
        )}
        <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
          <div 
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu(e, message);
            }}
            className={`relative px-[14px] py-[8px] rounded-[18px] shadow-sm transition-all cursor-pointer group z-10 w-fit max-w-full
              ${isMe ? 'bg-[#2b5278] rounded-br-[4px] text-white' : 'bg-[#182533] rounded-bl-[4px] text-white'}
              ${isJumbo ? 'bg-transparent shadow-none px-0 py-0' : ''}
              active:scale-[0.98]
            `}
          >
            {showParticipantInfo && !isJumbo && (
              <div className="text-[12px] font-bold text-blue-400 mb-0.5 truncate max-w-full flex items-center gap-1">
                {senderName || 'Участник'}
                {senderInfo?.hasLapka && <LapkaIcon className="ml-0.5" />}
              </div>
            )}

            {message.replyPreview && (
              <div 
                  onClick={(e) => { e.stopPropagation(); onReplyClick?.(message.replyPreview!.id); }}
                  className="mb-1.5 bg-black/20 p-1.5 rounded-lg border-l-2 border-blue-400 cursor-pointer hover:bg-black/30 transition-all overflow-hidden max-w-full text-left flex flex-col min-w-0"
              >
                <div className="text-[10px] font-black text-blue-400 uppercase truncate leading-tight mb-0.5">{message.replyPreview.senderName}</div>
                <div className="text-[12px] text-white/50 truncate leading-tight pr-2">
                  {message.replyPreview.text}
                </div>
              </div>
            )}

            <div className={`relative ${message.audioUrl || message.attachments?.length ? 'pb-2' : ''}`}>
              {message.audioUrl && (
                <VoicePlayer url={message.audioUrl} isMe={isMe} message={message} />
              )}

              {message.attachments && message.attachments.length > 0 && (
                <div className={`grid gap-1 mb-1 ${message.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} max-w-[280px]`}>
                  {message.attachments.map((att, idx) => (
                    <div 
                      key={idx} 
                      onClick={(e) => { e.stopPropagation(); setViewingMedia(att); }}
                      className="relative rounded-lg overflow-hidden bg-black/10 aspect-square border border-white/5 group/media"
                    >
                      {att.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <video src={att.url} className="w-full h-full object-cover" />
                          <i className="fa-solid fa-play absolute text-white/70 text-xl drop-shadow-lg"></i>
                        </div>
                      ) : (
                        <img src={att.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="attachment" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className={`flex flex-wrap items-end justify-between gap-x-4 min-w-0 ${isJumbo ? '' : 'pr-1'}`}>
                <span className={`select-text leading-[1.4] whitespace-pre-wrap break-words min-w-[30px] flex-1 pb-1 ${isJumbo ? 'text-5xl py-2 px-1 filter drop-shadow-md' : 'text-[15px]'}`}>
                    {parsedContent}
                </span>
                
                <div className={`flex items-center gap-[4px] shrink-0 self-end mb-[-1px] ml-auto ${isJumbo ? 'absolute -bottom-4 right-0 bg-[#0e1621]/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/5' : ''}`}>
                  {message.edited && (
                    <span className="text-[10px] text-white/30 select-none lowercase leading-none">изм.</span>
                  )}
                  <span className="text-[10px] text-white/30 select-none leading-none tracking-tight">
                    {formatTime(message.timestamp)}
                  </span>
                  {isMe && <StatusIcon status={message.status} className="mt-[1px]" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {viewingMedia && <MediaViewer attachment={viewingMedia} onClose={() => setViewingMedia(null)} />}
    </>
  );
};

export default MessageBubble;