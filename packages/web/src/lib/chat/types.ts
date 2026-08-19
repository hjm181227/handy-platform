/**
 * Chat Types
 * 채팅 관련 타입 정의
 */

// 메시지 타입 열거
export type MessageType =
  | 'text'
  | 'custom_order'
  | 'product_inquiry'
  | 'quote'
  | 'system'
  | 'image';

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
  // 메시지 서브타입 (서버에서 전달)
  type?: string;
  // 커스텀 주문 메시지용
  customOrderId?: string;
  // 견적서 메시지용
  quoteId?: string;
  // 시스템 메시지용
  action?: string;
  description?: string;
  // 상품 문의 메시지용
  productUuid?: string;
  name?: string;
  imageUrl?: string;
  price?: number;
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
  deleted?: boolean; // 삭제된 메시지 (자리표시자로 표시)
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

/** 삭제·차단·신고처럼 성공/실패만 알리면 되는 동작의 결과 */
export interface ModerationActionResult {
  success: boolean;
  error?: string;
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
  /** 서버에 붙지 못해 전송이 불가능한 상태 */
  isDegraded: boolean;
  error: string | null;
  currentRoom: ChatRoom | null;
  /** 서버가 발급한 실제 방 ID (라우트 파라미터는 상대방 UUID다) */
  actualRoomId: string | null;

  // Message operations
  sendMessage: (text: string) => Promise<void>;
  sendImage: (file: File, existingClientMessageId?: string) => Promise<void>;
  setInputText: (text: string) => void;
  retryMessage: (clientMessageId: string) => Promise<void>;
  /** 내가 보낸 메시지 삭제 (자리표시자로 남는다) */
  deleteMessage: (messageId: string) => Promise<ModerationActionResult>;

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
  /** 입력 중임을 상대에게 알린다 (내부적으로 스로틀됨) */
  notifyTyping: () => void;
  /** 입력 중 표시를 즉시 종료한다 */
  stopTyping: () => void;

  // Utilities
  clearError: () => void;
  markAsRead: () => void;
  /** 연결 실패 상태에서 다시 시도 */
  retryConnection: () => void;
}

// Service Configuration
export interface ChatServiceConfig {
  serverUrl?: string;
  token?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}
