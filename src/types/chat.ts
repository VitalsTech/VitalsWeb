export type ChatMessage = {
  id: string;
  from: 'ai' | 'user' | 'doctor';
  text: string;
  sentAt?: string;
  readAt?: string | null;
  isMine?: boolean;
  isSystem?: boolean;
};
