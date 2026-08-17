import { useNavigate, useParams } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi, normalizeHistory, parseEventPayload } from '@/api/medicalRecords';
import type { DocumentPayload } from './Documents';

export function DocumentDetail() {
  const { id } = useParams();
  const { patientId } = useAuth();
  const navigate = useNavigate();

  // The contract has no "get single event" endpoint, so we load the history
  // list (already filtered to documents) and find the matching entry by id.
  const { data, loading, error, reload } = useAsyncData(
    () =>
      patientId
        ? medicalRecordsApi.getHistory(patientId, { eventTypes: 'document' })
        : Promise.resolve(null),
    [patientId],
  );

  const doc = normalizeHistory(data).find((d) => d.id === id);
  const payload = doc ? parseEventPayload<DocumentPayload>(doc) ?? {} : {};

  function close() {
    navigate('/patient/documents');
  }

  return (
    <Modal onClose={close}>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        {!doc ? (
          <p className="text-[14px] text-text-muted">Документ не найден.</p>
        ) : (
          <>
            <h2 className="text-[24px] font-bold text-text">{payload.title ?? 'Документ'}</h2>
            <p className="mt-2 text-[13px] text-text-muted">
              Дата: {doc.occurredAt ? new Date(doc.occurredAt).toLocaleDateString('ru-RU') : '-'}
              {payload.docType ? ` · ${payload.docType}` : ''}
            </p>

            <div className="mt-6 flex h-[300px] items-center justify-center rounded-md border border-border">
              <p className="text-[14px] text-text-muted">Превью скана документа</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled>Скачать PDF</Button>
              <Button variant="secondary" disabled>
                Редактировать
              </Button>
              <Button variant="secondary" onClick={close}>
                Закрыть
              </Button>
            </div>

            <p className="mt-6 text-[13px] text-text-muted">
              {payload.hasDigital ? 'Электронная версия доступна в формате FHIR PDF. ' : ''}
              {payload.hasPaper ? 'Бумажный скан прикреплён.' : ''}
            </p>
          </>
        )}
      </AsyncState>
    </Modal>
  );
}
