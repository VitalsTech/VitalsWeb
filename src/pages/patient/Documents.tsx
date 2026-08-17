import { useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import {
  medicalRecordsApi,
  normalizeHistory,
  normalizeAttachments,
  parseEventPayload,
  DOCUMENT_EVENT_TYPES,
} from '@/api/medicalRecords';
import type { MedicalRecordEventDto } from '@/api/medicalRecords';
import { prescriptionsApi } from '@/api/prescriptions';
import { formatApiError } from '@/api/http';

export type DocumentPayload = {
  title?: string;
  docType?: string;
  hasPaper?: boolean;
  hasDigital?: boolean;
  prescriptionId?: string;
};

type DocumentRow = {
  id: string;
  title: string;
  kind: 'history' | 'attachment' | 'prescription';
  date: string;
  prescriptionId?: string;
  event?: MedicalRecordEventDto;
};

function isPrescriptionEvent(event: MedicalRecordEventDto) {
  const type = event.eventType ?? '';
  return type === 'prescription' || type === 'PrescriptionIssued';
}

function formatRowDate(raw?: string) {
  if (!raw) return '-';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('ru-RU');
}

export function Documents() {
  const { patientId } = useAuth();
  const navigate = useNavigate();
  const [openingPrescription, setOpeningPrescription] = useState<string | null>(null);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);

  const historyQuery = useAsyncData(
    () =>
      patientId
        ? medicalRecordsApi.getHistory(patientId, { eventTypes: DOCUMENT_EVENT_TYPES })
        : Promise.resolve(null),
    [patientId],
  );

  const attachmentsQuery = useAsyncData(
    () => (patientId ? medicalRecordsApi.getAttachments(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const rows = useMemo(() => {
    const result: DocumentRow[] = [];
    const seen = new Set<string>();

    for (const doc of normalizeHistory(historyQuery.data)) {
      const payload = parseEventPayload<DocumentPayload>(doc) ?? {};
      const id = String(doc.id ?? `${doc.eventType}-${doc.occurredAt}`);
      if (seen.has(id)) continue;
      seen.add(id);
      const prescriptionId = payload.prescriptionId ?? (doc as { prescriptionId?: string }).prescriptionId;
      result.push({
        id,
        title: isPrescriptionEvent(doc)
          ? 'Рецепт'
          : (payload.title ?? payload.docType ?? 'Документ'),
        kind: isPrescriptionEvent(doc) ? 'prescription' : 'history',
        date: formatRowDate(doc.occurredAt ?? doc.createdAt),
        prescriptionId: typeof prescriptionId === 'string' ? prescriptionId : undefined,
        event: doc,
      });
    }

    for (const attachment of normalizeAttachments(attachmentsQuery.data)) {
      const id = String(attachment.id ?? attachment.attachmentId ?? attachment.fileName);
      if (seen.has(id)) continue;
      seen.add(id);
      result.push({
        id,
        title: attachment.title ?? attachment.fileName ?? 'Вложение',
        kind: attachment.prescriptionId ? 'prescription' : 'attachment',
        date: formatRowDate(attachment.createdAt),
        prescriptionId:
          typeof attachment.prescriptionId === 'string' ? attachment.prescriptionId : undefined,
      });
    }

    return result.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [historyQuery.data, attachmentsQuery.data]);

  async function openPrescriptionInstructions(prescriptionId: string) {
    setOpeningPrescription(prescriptionId);
    setPrescriptionError(null);
    try {
      const instructions = await prescriptionsApi.getInstructions(prescriptionId);
      const text =
        typeof instructions === 'string'
          ? instructions
          : JSON.stringify(instructions, null, 2);
      window.open(
        `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (err) {
      setPrescriptionError(formatApiError(err));
    } finally {
      setOpeningPrescription(null);
    }
  }

  const loading = historyQuery.loading || attachmentsQuery.loading;
  const error = historyQuery.error ?? attachmentsQuery.error;

  function reload() {
    historyQuery.reload();
    attachmentsQuery.reload();
  }

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
        {prescriptionError && (
          <p className="mb-4 text-[13px] text-danger">{prescriptionError}</p>
        )}
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_140px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold text-text-muted sm:grid-cols-[2fr_1.2fr_1fr_140px]">
            <span>Тип</span>
            <span className="hidden sm:block">Источник</span>
            <span>Дата</span>
            <span />
          </div>
          {rows.length === 0 ? (
            <p className="px-6 py-8 text-[14px] text-text-muted">Документов пока нет.</p>
          ) : (
            rows.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-[2fr_1fr_140px] items-center gap-4 border-b border-border px-6 py-5 last:border-b-0 sm:grid-cols-[2fr_1.2fr_1fr_140px]"
              >
                <span className="text-[14px] font-semibold text-text">{doc.title}</span>
                <span className="hidden text-[14px] text-text-muted sm:block">
                  {doc.kind === 'prescription'
                    ? 'Рецепт'
                    : doc.kind === 'attachment'
                      ? 'Вложение'
                      : 'Документ'}
                </span>
                <span className="text-[14px] text-text-muted">{doc.date}</span>
                <div className="flex flex-col gap-2">
                  {doc.prescriptionId ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={openingPrescription === doc.prescriptionId}
                      onClick={() => void openPrescriptionInstructions(doc.prescriptionId!)}
                    >
                      Инструкция
                    </Button>
                  ) : null}
                  {doc.event ? (
                    <Button size="sm" onClick={() => navigate(`/patient/documents/${doc.id}`)}>
                      Открыть
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </Card>
      </AsyncState>

      <Outlet />
    </div>
  );
}
