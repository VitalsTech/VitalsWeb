import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { fullTriageMessages, triageQuickPhrases } from '@/mock/data';
import type { ChatMessage } from '@/mock/data';
import { nextId } from '@/lib/id';

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(fullTriageMessages);
  const [draft, setDraft] = useState('');

  function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: nextId('u'), from: 'user', text }]);
    setDraft('');
  }

  return (
    <div>
      <PageHeader
        title="Чат с ИИ"
        description="Детальный диалог триажа с быстрыми ответами"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <Card className="flex max-h-[560px] flex-col gap-4 overflow-y-auto p-6 scrollbar-thin">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        <p className="text-[13px] text-text-muted">ИИ печатает…</p>
      </Card>

      <Card className="mt-6 flex flex-wrap gap-3 p-5">
        {triageQuickPhrases.slice(0, 3).map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => sendMessage(phrase)}
            className="rounded-md border border-border bg-surface px-4 py-3 text-[13px] font-semibold text-text transition-colors hover:border-accent"
          >
            {phrase}
          </button>
        ))}
      </Card>

      <Card className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
        <Textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Опишите симптомы…"
          className="flex-1"
        />
        <Button onClick={() => sendMessage(draft)}>Отправить</Button>
      </Card>
    </div>
  );
}
