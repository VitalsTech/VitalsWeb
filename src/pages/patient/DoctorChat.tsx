import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatBubble } from '@/components/ChatBubble';
import { doctors, doctorChatMessages } from '@/mock/data';
import type { ChatMessage } from '@/mock/data';
import { nextId } from '@/lib/id';

export function DoctorChat() {
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === id) ?? doctors[0];
  const [messages, setMessages] = useState<ChatMessage[]>(doctorChatMessages);
  const [draft, setDraft] = useState('');

  function send() {
    if (!draft.trim()) return;
    setMessages((prev) => [...prev, { id: nextId('u'), from: 'user', text: draft }]);
    setDraft('');
  }

  return (
    <div>
      <PageHeader
        title={doctor.name}
        description={`${doctor.specialty} · Консультация онлайн · Статус: активна`}
        backTo={`/patient/doctors/${doctor.id}`}
        backLabel="Назад к врачу"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">О враче</h3>
          <p className="mt-3 text-[13px] text-text-muted">
            Стаж {doctor.experienceYears} лет. Клиника-партнёр: {doctor.clinic}. Расписание:{' '}
            {doctor.schedule}.
          </p>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="flex max-h-[540px] flex-col gap-3 overflow-y-auto p-6 scrollbar-thin">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
          </Card>

          <Card className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Напишите сообщение…"
              className="flex-1"
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => alert('Прикрепление файла — демо')}>
                Файл
              </Button>
              <Button onClick={send}>Отпр.</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
