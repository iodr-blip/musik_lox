
export type AuthStep = 'welcome' | 'choice' | 'login' | 'register_creds' | 'register_username' | 'register_profile';

export enum AppTab {
  ALL = 'all',
  PRIVATE = 'private',
  GROUPS = 'groups',
  BOTS = 'bots'
}

export interface User {
  id: string;
  username: string;
  surname?: string;
  username_handle: string;
  phoneNumber?: string;
  email: string;
  bio: string;
  avatarUrl: string;
  online: boolean;
  lastSeen: number;
  verified?: boolean;
  developer?: boolean;
  hasLapka?: boolean;
  createdAt?: number;
}

export interface MessageAttachment {
  url: string;
  type: 'image' | 'video';
  name?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
  edited?: boolean;
  audioUrl?: string;
  fileUrl?: string;
  videoUrl?: string;
  fileName?: string;
  fileSize?: string;
  attachments?: MessageAttachment[];
  replyPreview?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'bot' | 'saved';
  name?: string;
  avatarUrl?: string;
  description?: string;
  ownerId?: string;
  inviteLink?: string;
  participants: User[];
  participantsUids?: string[];
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
    senderName?: string;
  };
  unreadCount?: number; 
  unreadCounts?: Record<string, number>; 
  pinned?: boolean;
  archived?: boolean;
  pinnedMessageId?: string | null;
  historyVisible?: boolean;
}

export interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'ringing' | 'active' | 'ended' | 'declined';
  type: 'audio' | 'video';
  offer?: any;
  answer?: any;
  createdAt: number;
}
