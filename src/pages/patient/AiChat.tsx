import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { useAuth } from '@/auth/AuthProvider';
import { useTriageSession } from './useTriageSession';

const QUICK_PHRASES = ['Стало хуже', 'Нужна консультация', 'После процедуры'];

export function AiChat() {
  const { patientId } = useAuth();
  const navigate = useNavigate();
  const {
    messages,
    sending,
    error,
    send,
    sessionId,
    complete,
    isCompleted,
    readyToComplete,
    completeSuggestion,
  } = useTriageSession(patientId);
  const [draft, setDraft] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  async function submit(text: string) {
    if (!text.trim() || sending || isCompleted) return;
    await send(text);
    setDraft('');
  }

  async function handleComplete() {
    const completed = await complete();
    if (completed) navigate('/patient/triage/result');
  }

  function onComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    void submit(draft);
  }

  const canSend = Boolean(draft.trim()) && !sending && !isCompleted;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Чат с ИИ"
        description="Продолжение диалога ИИ-триажа"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <Card className="flex h-[min(56vh,560px)] flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-5 scrollbar-thin">
          {messages.length === 0 ? (
            <p className="text-[13px] text-text-muted">
              Напишите сообщение, чтобы начать диалог с ИИ-ассистентом Vitals.
            </p>
          ) : (
            messages.map((m) => <ChatBubble key={m.id} message={m} />)
          )}
          {sending && <p className="text-[13px] text-text-muted">ИИ печатает…</p>}
          <div ref={chatEndRef} />
        </div>
      </Card>

      {readyToComplete && (
        <Card className="border-accent/40 bg-accent/10 p-4">
          <Badge tone="accent">Можно завершить</Badge>
          <p className="mt-1.5 text-[13px] text-text">
            {completeSuggestion ?? 'Можно завершить триаж и получить маршрут.'}
          </p>
        </Card>
      )}

      {error && <p className="text-[13px] text-danger">{error}</p>}

      <Card className="flex flex-wrap gap-2 p-4">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            disabled={sending || isCompleted}
            onClick={() => void submit(phrase)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] font-semibold text-text transition-colors hover:border-accent disabled:opacity-60"
          >
            {phrase}
          </button>
        ))}
      </Card>

      <Card className="p-4">
        <Textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onComposerKeyDown}
          placeholder="Опишите симптомы… (Enter — отправить)"
          className="min-h-[72px] resize-y"
          disabled={isCompleted}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={!canSend} onClick={() => void submit(draft)}>
            {sending ? 'Отправка…' : 'Отправить'}
          </Button>
          {sessionId && !isCompleted && (
            <Button
              variant={readyToComplete ? 'primary' : 'secondary'}
              disabled={sending}
              onClick={() => void handleComplete()}
            >
              Завершить триаж
            </Button>
          )}
          {isCompleted && (
            <Button onClick={() => navigate('/patient/triage/result')}>К результату</Button>
          )}
          <p className="text-[12px] text-text-muted sm:ml-auto">
            Enter — отправить · Shift+Enter — новая строка
          </p>
        </div>
      </Card>
    </div>
  );
}
