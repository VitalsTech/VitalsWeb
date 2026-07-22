import { Outlet, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { documents } from '@/mock/data';

export function Documents() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Документы"
        description="Скан и электронная версия. Просмотр, редактирование и добавление."
        actions={
          <>
            <ButtonLink to="/patient/documents/new">Добавить документ</ButtonLink>
            <Button variant="secondary" onClick={() => alert('Импорт из МИС — демо без бэкенда')}>
              Импорт из МИС
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_140px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold text-text-muted">
          <span>Тип</span>
          <span>Бумажная версия</span>
          <span>Электронная версия</span>
          <span>Дата</span>
          <span />
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_140px] items-center gap-4 border-b border-border px-6 py-5 last:border-b-0"
          >
            <span className="text-[14px] font-semibold text-text">{doc.title}</span>
            <span className="text-[14px] text-text-muted">{doc.paper}</span>
            <span className="text-[14px] text-text-muted">{doc.digital}</span>
            <span className="text-[14px] text-text-muted">{doc.date}</span>
            <Button size="sm" onClick={() => navigate(`/patient/documents/${doc.id}`)}>
              Открыть
            </Button>
          </div>
        ))}
      </Card>

      <Outlet />
    </div>
  );
}
