import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { useAuth } from '@/auth/AuthProvider';
import { useTriageSession } from './useTriageSession';

const QUICK_PHRASES = ['Стало хуже', 'Нужна консультация', 'После процедуры'];

export function AiChat() {
  const { patientId } = useAuth();
  const { messages, sending, error, send } = useTriageSession(patientId);
  const [draft, setDraft] = useState('');

  async function submit(text: string) {
    if (!text.trim()) return;
    await send(text);
    setDraft('');
  }

  return (
    <div>
      <PageHeader
        title="Чат с ИИ"
        description="Продолжение диалога ИИ-триажа с быстрыми ответами"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <Card className="flex max-h-[560px] flex-col gap-4 overflow-y-auto p-6 scrollbar-thin">
        {messages.length === 0 ? (
          <p className="text-[13px] text-text-muted">
            Напишите сообщение, чтобы начать диалог с ИИ-ассистентом Vitals.
          </p>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} />)
        )}
        {sending && <p className="text-[13px] text-text-muted">ИИ печатает…</p>}
      </Card>

      {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}

      <Card className="mt-6 flex flex-wrap gap-3 p-5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            disabled={sending}
            onClick={() => submit(phrase)}
            className="rounded-md border border-border bg-surface px-4 py-3 text-[13px] font-semibold text-text transition-colors hover:border-accent disabled:opacity-60"
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
        <Button disabled={sending} onClick={() => submit(draft)}>
          Отправить
        </Button>
      </Card>
    </div>
  );
}
