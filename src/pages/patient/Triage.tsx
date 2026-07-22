import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { initialTriageMessages, triageQuickPhrases } from '@/mock/data';
import type { ChatMessage } from '@/mock/data';
import { nextId } from '@/lib/id';

const AI_REPLIES = [
  'Спасибо, уточню ещё пару моментов, чтобы предложить точный маршрут.',
  'Учла. Есть ли повышение температуры или другие симптомы?',
  'Хорошо, формирую рекомендацию на основе ваших ответов.',
];

export function Triage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialTriageMessages);
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();

  const userMessageCount = messages.filter((m) => m.from === 'user').length;
  const readyForResult = userMessageCount >= 2;

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: nextId('u'), from: 'user', text };
    const aiMsg: ChatMessage = {
      id: nextId('a'),
      from: 'ai',
      text: AI_REPLIES[Math.min(userMessageCount, AI_REPLIES.length - 1)],
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
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
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Быстрые фразы</h3>
          <div className="mt-4 flex flex-col gap-2.5">
            {triageQuickPhrases.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => sendMessage(phrase)}
                className="rounded-md border border-border bg-surface px-4 py-3 text-left text-[13px] font-semibold text-text transition-colors hover:border-accent"
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
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button onClick={() => sendMessage(draft)}>Отправить</Button>
          <p className="text-[12px] text-text-muted">
            После диалога система покажет маршрут: срочность, врач, анализы → экран «Результат
            триажа»
          </p>
          {readyForResult && (
            <Button
              variant="secondary"
              className="ml-auto"
              onClick={() => navigate('/patient/triage/result')}
            >
              Показать результат триажа →
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
