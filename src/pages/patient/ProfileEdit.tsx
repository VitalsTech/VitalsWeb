import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';

export function ProfileEdit() {
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    navigate('/patient/profile');
  }

  return (
    <div>
      <PageHeader
        title="Редактирование профиля"
        description="Ручное изменение сведений о пациенте"
        backTo="/patient/profile"
        backLabel="К профилю"
      />

      <Card className="max-w-[800px] p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <FieldLabel>ФИО</FieldLabel>
            <Input defaultValue="Иванова Анна Сергеевна" />
          </div>
          <div>
            <FieldLabel>Дата рождения</FieldLabel>
            <Input defaultValue="08.04.1991" />
          </div>
          <div>
            <FieldLabel>Номер полиса ОМС</FieldLabel>
            <Input defaultValue="7734 8921 0912 4512" />
          </div>
          <div>
            <FieldLabel>Телефон</FieldLabel>
            <Input defaultValue="+7 900 123-45-67" />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input defaultValue="anna.ivanova@mail.ru" />
          </div>

          <div className="mt-2 flex gap-3">
            <Button type="submit">Сохранить</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/patient/profile')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
