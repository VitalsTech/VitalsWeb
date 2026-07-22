import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select } from '@/components/ui/Input';

export function DocumentNew() {
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    navigate('/patient/documents');
  }

  return (
    <div>
      <PageHeader
        title="Добавление документа"
        description="Загрузите скан и/или электронную версию мед. документа"
        backTo="/patient/documents"
        backLabel="К документам"
      />

      <Card className="max-w-[800px] p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <FieldLabel>Тип документа</FieldLabel>
            <Select defaultValue="">
              <option value="" disabled>
                Справка / Выписка / Рецепт
              </option>
              <option value="reference">Справка</option>
              <option value="extract">Выписка</option>
              <option value="prescription">Рецепт</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Название</FieldLabel>
            <Input placeholder="Справка для работы" required />
          </div>
          <div>
            <FieldLabel>Дата документа</FieldLabel>
            <Input type="date" defaultValue="2026-03-12" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel>Бумажная версия (скан)</FieldLabel>
              <div className="flex h-[120px] items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-[13px] text-text-muted">
                Перетащите файл или нажмите для загрузки
              </div>
            </div>
            <div>
              <FieldLabel>Электронная версия</FieldLabel>
              <div className="flex h-[120px] items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-[13px] text-text-muted">
                FHIR PDF / XML
              </div>
            </div>
          </div>

          <div className="mt-2 flex gap-3">
            <Button type="submit">Сохранить</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/patient/documents')}>
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
