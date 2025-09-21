// utils/chatMapper.ts - Data mapper between API and UI types
import type { ChatMessageDTO, FirestoreTimestamp } from '@/models/Chat';

// Extended ChatMessage interface to match UI expectations
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'staff' | 'anonymous';
  content: string;
  timestamp: string; // ISO string or number as string
  isRead: boolean;
  attachments?: any[];
}

/**
 * Convert FirestoreTimestamp to milliseconds
 */
const timestampToMillis = (timestamp: FirestoreTimestamp | number): number => {
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  return (timestamp.seconds * 1000) + Math.floor(timestamp.nanos / 1000000);
};

/**
 * Map ChatMessageDTO from API to ChatMessage for UI
 */
export const mapChatMessageDTOToUI = (
  dto: ChatMessageDTO, 
  currentUserId: string,
  participantNames?: Record<string, string> // Optional name mapping
): ChatMessage => {
  const timestampMs = timestampToMillis(dto.createAt);
  
  return {
    id: dto.id,
    senderId: dto.senderId,
    senderName: '', // Nếu có
    senderType: dto.senderId === currentUserId ? 'customer' : 'staff', // hoặc logic khác
    content: dto.content,
    timestamp: firestoreTimestampToISO(dto.createAt),
    isRead: false,
    attachments: [],
  };
};

/**
 * Map array of ChatMessageDTO to ChatMessage array
 */
export const mapChatMessageDTOArrayToUI = (
  dtos: ChatMessageDTO[],
  currentUserId: string,
  participantNames?: Record<string, string>
): ChatMessage[] => {
  return dtos.map(dto => mapChatMessageDTOToUI(dto, currentUserId, participantNames));
};

/**
 * Convert Firestore Timestamp to ISO string
 */
export function firestoreTimestampToISO(ts: any): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (typeof ts === 'number') return new Date(ts).toISOString();
  if (typeof ts === 'object' && typeof ts.seconds === 'number') {
    return new Date(ts.seconds * 1000 + Math.floor((ts.nanos || 0) / 1e6)).toISOString();
  }
  return '';
}