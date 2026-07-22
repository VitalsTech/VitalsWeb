import type { ChatMessage } from '@/mock/data';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.from === 'ai' || message.from === 'doctor';

  return (
    <div
      className={`max-w-full rounded-lg px-4 py-4 text-[14px] leading-snug ${
        isAssistant
          ? 'bg-primary text-primary-foreground'
          : 'border border-border bg-surface text-text'
      }`}
    >
      {message.text}
    </div>
  );
}
