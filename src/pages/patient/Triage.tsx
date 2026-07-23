import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { useAuth } from '@/auth/AuthProvider';
import { useTriageSession } from './useTriageSession';

const QUICK_PHRASES = ['Стало хуже', 'Нужна консультация', 'После процедуры', 'Высокая температура'];

export function Triage() {
  const { patientId } = useAuth();
  const { messages, sending, error, send, hasRouting, complete, sessionId } = useTriageSession(patientId);
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();

  async function submit(text: string) {
    if (!text.trim()) return;
    await send(text);
    setDraft('');
  }

  return (
    <div>
      <PageHeader
        title="ИИ-триаж"
        description="Опишите симптомы — система оценит срочность и предложит маршрут."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="flex max-h-[420px] flex-col gap-3 overflow-y-auto p-6 scrollbar-thin">
          {messages.length === 0 ? (
            <p className="text-[13px] text-text-muted">
              Опишите, что вас беспокоит, или выберите одну из быстрых фраз — это начнёт сессию
              ИИ-триажа.
            </p>
          ) : (
            messages.map((m) => <ChatBubble key={m.id} message={m} />)
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Быстрые фразы</h3>
          <div className="mt-4 flex flex-col gap-2.5">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                disabled={sending}
                onClick={() => submit(phrase)}
                className="rounded-md border border-border bg-surface px-4 py-3 text-left text-[13px] font-semibold text-text transition-colors hover:border-accent disabled:opacity-60"
              >
                {phrase}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <Textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Опишите симптомы…"
        />
        {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button disabled={sending} onClick={() => submit(draft)}>
            {sending ? 'Отправка…' : 'Отправить'}
          </Button>
          <p className="text-[12px] text-text-muted">
            После диалога система покажет маршрут: срочность, врач, анализы → экран «Результат
            триажа»
          </p>
          {hasRouting && (
            <Button
              variant="secondary"
              className="ml-auto"
              onClick={() => navigate('/patient/triage/result')}
            >
              Показать результат триажа →
            </Button>
          )}
          {sessionId && !hasRouting && (
            <Button
              variant="secondary"
              disabled={sending}
              onClick={() => void complete().then((s) => s && navigate('/patient/triage/result'))}
            >
              {sending ? 'Завершение…' : 'Завершить триаж (mock)'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
