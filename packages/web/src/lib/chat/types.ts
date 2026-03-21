/**
 * Chat Types
 * 채팅 관련 타입 정의
 */

// 메시지 타입 열거
export type MessageType = 'text' | 'custom_order' | 'quote' | 'system' | 'image';

// 커스텀 주문 메시지 데이터
export interface CustomOrderMessageData {
  customOrderId: string;
  title: string;
  shape: string;
  length: string;
  sizes: {
    left: {
      thumb: string;
      index: string;
      middle: string;
      ring: string;
      pinky: string;
    };
    right: {
      thumb: string;
      index: string;
      middle: string;
      ring: string;
      pinky: string;
    };
  };
  desiredColor?: string;
  desiredDate?: string;
  designNotes?: string;
  referenceImages?: string[];
  sellerUuid?: string;
  status: 'pending' | 'quoted' | 'approved' | 'in_production' | 'completed' | 'rejected' | 'cancelled';
  brandName?: string;
}

// 견적서 메시지 데이터
export interface QuoteMessageData {
  quoteId: string;
  customOrderId: string;
  price: number;
  processingDays: number;
  sellerNotes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sellerName?: string;
  createdAt?: string;
}

// 메시지 메타데이터 타입 (서버에서 전송되는 실제 형식)
export interface MessageMetadata {
  // 커스텀 주문 메시지용
  customOrderId?: string;
  // 견적서 메시지용
  quoteId?: string;
  // 시스템 메시지용
  action?: string;
  description?: string;
}

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
  messageType?: MessageType;  // 메시지 타입 (기본: text)
  metadata?: MessageMetadata; // 추가 메타데이터
  fileUrl?: string; // 이미지 메시지용 URL
  failed?: boolean; // 전송 실패 상태
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
  sendImage: (file: File) => Promise<void>;
  setInputText: (text: string) => void;
  retryMessage: (clientMessageId: string) => Promise<void>;

  // Image upload state
  isUploading: boolean;
  uploadProgress: number;

  // Room operations
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;

  // Pagination
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  isLoadingMore: boolean;

  // Typing indicator
  isPartnerTyping: boolean;

  // Utilities
  scrollToLatest: () => void;
  clearError: () => void;
  markAsRead: () => void;
}

// Service Configuration
export interface ChatServiceConfig {
  serverUrl?: string;
  token?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}
