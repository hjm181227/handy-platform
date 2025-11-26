/**
 * Chat Types
 * 채팅 관련 타입 정의
 */

export interface Message {
  id: string;
  roomId: string;
  sender: 'me' | 'other';
  senderId: string;
  text: string;
  timestamp: string;  // 표시용 시간 (HH:MM)
  createdAt?: string; // ISO 형식 전체 날짜 (날짜 구분용)
  read: boolean;
  clientMessageId?: string;
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

// Hook Return Types
export interface UseChatReturn {
  // State
  messages: Message[];
  inputText: string;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  currentRoom: ChatRoom | null;

  // Message operations
  sendMessage: (text: string) => Promise<void>;
  setInputText: (text: string) => void;

  // Room operations
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;

  // Utilities
  scrollToLatest: () => void;
  clearError: () => void;
}

// Service Configuration
export interface ChatServiceConfig {
  serverUrl?: string;
  token?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}
