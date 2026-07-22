import { Outlet, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi, normalizeHistory, parseEventPayload } from '@/api/medicalRecords';

export type DocumentPayload = {
  title?: string;
  docType?: string;
  hasPaper?: boolean;
  hasDigital?: boolean;
};

export function Documents() {
  const { patientId } = useAuth();
  const navigate = useNavigate();

  const { data, loading, error, reload } = useAsyncData(
    () =>
      patientId
        ? medicalRecordsApi.getHistory(patientId, { eventTypes: 'document' })
        : Promise.resolve(null),
    [patientId],
  );

  const documents = normalizeHistory(data);

  return (
    <div>
      <PageHeader
        title="Документы"
        description="Скан и электронная версия. Просмотр, редактирование и добавление."
        actions={
          <>
            <ButtonLink to="/patient/documents/new">Добавить документ</ButtonLink>
            <Button variant="secondary" disabled>
              Импорт из МИС
            </Button>
          </>
        }
      />

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_140px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold text-text-muted">
            <span>Тип</span>
            <span>Бумажная версия</span>
            <span>Электронная версия</span>
            <span>Дата</span>
            <span />
          </div>
          {documents.length === 0 ? (
            <p className="px-6 py-8 text-[14px] text-text-muted">Документов пока нет.</p>
          ) : (
            documents.map((doc) => {
              const payload = parseEventPayload<DocumentPayload>(doc) ?? {};
              const date = doc.occurredAt ? new Date(doc.occurredAt).toLocaleDateString('ru-RU') : '—';
              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_140px] items-center gap-4 border-b border-border px-6 py-5 last:border-b-0"
                >
                  <span className="text-[14px] font-semibold text-text">
                    {payload.title ?? payload.docType ?? 'Документ'}
                  </span>
                  <span className="text-[14px] text-text-muted">{payload.hasPaper ? 'Скан' : '—'}</span>
                  <span className="text-[14px] text-text-muted">
                    {payload.hasDigital ? 'FHIR PDF' : '—'}
                  </span>
                  <span className="text-[14px] text-text-muted">{date}</span>
                  <Button size="sm" onClick={() => navigate(`/patient/documents/${doc.id}`)}>
                    Открыть
                  </Button>
                </div>
              );
            })
          )}
        </Card>
      </AsyncState>

      <Outlet />
    </div>
  );
}
