/**
 * Chat Types
 * 채팅 관련 타입 정의 (공통)
 */

// 메시지 타입 열거
export type MessageType = 'text' | 'custom_order' | 'system';

// 커스텀 주문 메시지 데이터
export interface CustomOrderMessageData {
  customOrderId: string;
  title: string;
  shape: string;
  length: string;
  sizes: {
    thumb: string;
    index: string;
    middle: string;
    ring: string;
    pinky: string;
  };
  desiredColor?: string;
  desiredDate?: string;
  designNotes?: string;
  referenceImages?: string[];
  status: 'pending' | 'quoted' | 'approved' | 'in_production' | 'completed' | 'rejected' | 'cancelled';
  brandName?: string;
}

// 메시지 메타데이터 타입
export type MessageMetadata =
  | { type: 'custom_order'; data: CustomOrderMessageData }
  | { type: 'system'; data: { action: string; description?: string } };

export interface Message {
  id: string;
  roomId: string;
  sender: 'me' | 'other';
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
  clientMessageId?: string;
  messageType?: MessageType;  // 메시지 타입 (기본: text)
  metadata?: MessageMetadata; // 추가 메타데이터
}

export interface ChatRoom {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  userIds?: string[];
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface TypingIndicator {
  roomId: string;
  userId: string;
  isTyping: boolean;
}

// Socket Event Types
export interface SocketEvents {
  // Incoming events (server -> client)
  message: (message: Message) => void;
  'message:sent': (data: { clientMessageId: string; serverMessage: Message }) => void;
  'message:read': (data: { messageId: string; roomId: string }) => void;
  'room:joined': (data: { roomId: string }) => void;
  'room:left': (data: { roomId: string }) => void;
  'user:typing': (data: TypingIndicator) => void;
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
}

// Service Configuration
export interface ChatServiceConfig {
  serverUrl?: string;
  token?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

// Callback Types
export type MessageCallback = (message: Message) => void;
export type TypingCallback = (data: TypingIndicator) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (error: Error) => void;
