import type { ChatMessage } from '@/types/chat';
import { formatChatTime } from '@/lib/chatMessage';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const time = formatChatTime(message.sentAt);

  if (message.isSystem) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <p className="max-w-[92%] text-center text-[12px] leading-snug text-text-muted">
          {message.text}
        </p>
        {time ? <span className="text-[11px] text-text-muted">{time}</span> : null}
      </div>
    );
  }

  const isMine = message.isMine ?? message.from === 'user';
  const isAssistant = !isMine && (message.from === 'ai' || message.from === 'doctor');

  return (
    <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-snug ${
          isMine
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : isAssistant
              ? 'rounded-bl-md border border-border bg-surface text-text'
              : 'rounded-bl-md border border-border bg-surface-muted text-text'
        }`}
      >
        {message.text}
      </div>
      <div
        className={`flex items-center gap-2 px-1 text-[11px] text-text-muted ${isMine ? 'flex-row-reverse' : ''}`}
      >
        {time ? <span>{time}</span> : null}
        {isMine ? (
          <span>{message.readAt ? 'Прочитано' : 'Доставлено'}</span>
        ) : null}
      </div>
    </div>
  );
}
