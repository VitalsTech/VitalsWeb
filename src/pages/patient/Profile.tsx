import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';

export function Profile() {
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader
        title="Профиль пациента"
        description="Основные сведения, состояние здоровья и переход к сервисам."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Основное</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(true);
            }}
            className="mt-4 flex flex-col gap-5"
          >
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
            <Button type="submit" className="w-fit">
              {saved ? 'Сохранено ✓' : 'Сохранить изменения'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Текущее состояние</h3>
          <p className="mt-3 text-[13px] text-text-muted">
            Последнее обращение 28.05 — наблюдается повышенное артериальное давление, назначены
            обследования.
          </p>
          <p className="mt-3 text-[13px] text-text-muted">
            Аллергии: не указаны. Группа крови: A(II) Rh+
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink to="/patient/documents" size="sm">
              Документы
            </ButtonLink>
            <ButtonLink to="/patient/doctors" size="sm">
              Запись к врачу
            </ButtonLink>
            <ButtonLink to="/patient/triage" size="sm">
              ИИ-триаж
            </ButtonLink>
            <ButtonLink to="/patient/profile/edit" variant="secondary" size="sm" className="ml-auto">
              Редактировать профиль
            </ButtonLink>
          </div>

          <p className="mt-6 text-[13px] text-text-muted">Врач наблюдения: Петров А.И., терапевт</p>
        </Card>
      </div>
    </div>
  );
}
