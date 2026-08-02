import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { useAuth } from '@/auth/AuthProvider';
import { useChatAutoScroll } from '@/lib/useChatAutoScroll';
import { useTriageSession } from './useTriageSession';

const QUICK_PHRASES = ['Стало хуже', 'Нужна консультация', 'После процедуры', 'Высокая температура'];

export function Triage() {
  const { patientId } = useAuth();
  const {
    messages,
    sending,
    error,
    send,
    complete,
    sessionId,
    startNew,
    isCompleted,
    readyToComplete,
    completeSuggestion,
    session,
    hypotheses,
  } = useTriageSession(patientId);
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatEndRef = useChatAutoScroll([messages, sending]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      startNew();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, startNew]);

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
    <div className="flex flex-col gap-5">
      <PageHeader
        title="ИИ-триаж"
        description="Опишите симптомы — ИИ уточнит детали, оценит срочность и предложит завершить триаж."
        actions={
          sessionId ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                startNew();
                setDraft('');
              }}
            >
              Новый триаж
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="flex min-h-0 flex-col gap-4">
          <Card className="flex h-[min(52vh,520px)] flex-col overflow-hidden p-0">
            <div className="flex-1 space-y-3 overflow-y-auto p-5 scrollbar-thin">
              {messages.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  Опишите, что вас беспокоит, или выберите быструю фразу справа — начнётся сессия
                  ИИ-триажа.
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Badge tone="accent">Можно завершить</Badge>
                  <p className="mt-1.5 text-[13px] text-text">
                    {completeSuggestion ??
                      'Ключевых деталей достаточно. Завершите триаж, чтобы получить маршрут.'}
                  </p>
                </div>
                <Button size="sm" disabled={sending} onClick={() => void handleComplete()}>
                  {sending ? 'Завершение…' : 'Завершить триаж'}
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <Textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="Опишите симптомы… (Enter — отправить, Shift+Enter — новая строка)"
              disabled={isCompleted}
              className="min-h-[72px] resize-y"
            />
            {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
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
                  {sending ? 'Завершение…' : 'Завершить триаж'}
                </Button>
              )}

              {isCompleted && (
                <Button onClick={() => navigate('/patient/triage/result')}>
                  Результат триажа →
                </Button>
              )}

              <p className="basis-full text-[12px] text-text-muted sm:ml-auto sm:basis-auto">
                Enter — отправить · Shift+Enter — перенос строки
              </p>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-text">Быстрые фразы</h3>
            <div className="mt-3 flex flex-col gap-2">
              {QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  disabled={sending || isCompleted}
                  onClick={() => void submit(phrase)}
                  className="rounded-md border border-border bg-surface px-3 py-2.5 text-left text-[13px] font-semibold text-text transition-colors hover:border-accent disabled:opacity-60"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </Card>

          {(session?.urgencyLevel != null || hypotheses.length > 0) && (
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-text">Оценка ИИ</h3>
              {session?.urgencyLevel != null && (
                <p className="mt-3 text-[13px] text-text-muted">
                  Срочность:{' '}
                  <span className="font-semibold text-text">{session.urgencyLevel}</span>
                  {session.urgency ? ` · ${session.urgency}` : ''}
                </p>
              )}
              {hypotheses.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {hypotheses.slice(0, 3).map((h) => (
                    <li key={h.condition} className="text-[13px] leading-snug text-text">
                      · {h.condition}
                      {h.probability != null ? ` (${Math.round(h.probability * 100)}%)` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
