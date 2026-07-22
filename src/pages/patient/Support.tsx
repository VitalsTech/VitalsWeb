import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Select, Textarea } from '@/components/ui/Input';
import { faqItems } from '@/mock/data';

export function Support() {
  const [sent, setSent] = useState(false);

  return (
    <div>
      <PageHeader title="Поддержка и FAQ" description="Вопросы и обращение в службу сопровождения" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">FAQ</h3>
          <div className="mt-4 flex flex-col gap-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-md border border-border px-4 py-3 open:bg-surface-muted"
              >
                <summary className="cursor-pointer list-none text-[14px] font-semibold text-text">
                  {item.q}
                </summary>
                <p className="mt-2 text-[13px] text-text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Обратиться</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-4 flex flex-col gap-5"
          >
            <div>
              <FieldLabel>Тема</FieldLabel>
              <Select defaultValue="tech">
                <option value="tech">Техника</option>
                <option value="billing">Оплата</option>
                <option value="medical">Медицинский вопрос</option>
                <option value="other">Другое</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Сообщение</FieldLabel>
              <Textarea rows={7} placeholder="Опишите проблему" required />
            </div>
            <Button type="submit" size="lg" fullWidth>
              {sent ? 'Отправлено ✓' : 'Отправить'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
