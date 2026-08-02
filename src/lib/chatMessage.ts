import type { ConsultationMessageDto } from '@/api/consultations';
import type { ChatMessage } from '@/types/chat';

export function toChatMessage(
  dto: ConsultationMessageDto,
  fallbackId: string,
  viewer: 'patient' | 'doctor',
): ChatMessage {
  const role = String(dto.senderRole ?? dto.role ?? 'doctor').toLowerCase();
  const fromPatient = role.includes('patient') || role.includes('user');
  const from: ChatMessage['from'] = fromPatient ? 'user' : 'doctor';
  const isMine = viewer === 'patient' ? fromPatient : !fromPatient;
  const id = String(dto.id ?? dto.messageId ?? fallbackId);
  const sentAt = dto.sentAt ?? dto.createdAt;
  return {
    id,
    from,
    text: String(dto.content ?? ''),
    sentAt: typeof sentAt === 'string' ? sentAt : undefined,
    readAt: dto.readAt ?? null,
    isMine,
  };
}

export function formatChatTime(sentAt?: string) {
  if (!sentAt) return '';
  const date = new Date(sentAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
