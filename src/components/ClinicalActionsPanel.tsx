import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Input';
import {
  consultationsApi,
  normalizeClinical,
  type CertificateType,
  type ClinicalActionDto,
} from '@/api/consultations';
import { formatApiError } from '@/api/http';
import type { ConsultationHub } from '@/lib/useConsultationHub';
import { cn } from '@/lib/cn';

const CERTIFICATE_TYPES: { value: CertificateType; label: string }[] = [
  { value: 'HealthStatus', label: 'О состоянии здоровья' },
  { value: 'StudyExcuse', label: 'В учебное заведение' },
  { value: 'WorkExcuse', label: 'На работу' },
  { value: 'Other', label: 'Другое' },
];

function payloadRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object') return payload as Record<string, unknown>;
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function actionSummary(action: ClinicalActionDto): string {
  const kind = String(action.kind ?? '');
  const payload = payloadRecord(action.payload);
  if (kind === 'Diagnosis') {
    const icd10 = typeof payload.icd10 === 'string' ? payload.icd10 : '';
    const text = typeof payload.text === 'string' ? payload.text : '';
    return [icd10, text].filter(Boolean).join(' ') || 'Диагноз';
  }
  if (kind === 'Prescription') {
    const lines = Array.isArray(payload.lines) ? payload.lines.filter((line) => typeof line === 'string') : [];
    return lines.join('; ') || 'Рецепт';
  }
  if (kind === 'Certificate') {
    return typeof payload.title === 'string' ? payload.title : 'Справка';
  }
  return kind || 'Действие';
}

function kindLabel(kind: string | undefined): string {
  if (kind === 'Diagnosis') return 'Диагноз';
  if (kind === 'Prescription') return 'Рецепт';
  if (kind === 'Certificate') return 'Справка';
  return kind || 'Действие';
}

export function ClinicalActionsPanel({
  sessionId,
  hub,
  enabled,
  className,
}: {
  sessionId: string;
  hub: ConsultationHub;
  enabled: boolean;
  className?: string;
}) {
  const [items, setItems] = useState<ClinicalActionDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [icd10, setIcd10] = useState('');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [prescriptionsText, setPrescriptionsText] = useState('');
  const [certType, setCertType] = useState<CertificateType>('HealthStatus');
  const [certTitle, setCertTitle] = useState('');
  const [certBody, setCertBody] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const load = useCallback(async () => {
    const response = await consultationsApi.getClinical(sessionId);
    setItems(normalizeClinical(response));
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    void consultationsApi
      .getClinical(sessionId)
      .then((response) => {
        if (!cancelled) setItems(normalizeClinical(response));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    return hub.subscribe({
      onClinicalAction: (action) => {
        setItems((prev) => {
          const id = String(action.id ?? '');
          if (id && prev.some((item) => String(item.id) === id)) return prev;
          return [...prev, action];
        });
      },
    });
  }, [hub]);

  async function submitDiagnosis(e: FormEvent) {
    e.preventDefault();
    if (!enabled) return;
    setSaving(true);
    setError(null);
    try {
      await consultationsApi.addDiagnosis(sessionId, {
        icd10: icd10.trim(),
        text: diagnosisText.trim(),
      });
      setIcd10('');
      setDiagnosisText('');
      await load();
    } catch (err) {
      setError(formatApiError(err, 'Не удалось сохранить диагноз.'));
    } finally {
      setSaving(false);
    }
  }

  async function submitPrescriptions(e: FormEvent) {
    e.preventDefault();
    if (!enabled) return;
    const lines = prescriptionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      await consultationsApi.addPrescriptions(sessionId, { lines });
      setPrescriptionsText('');
      await load();
    } catch (err) {
      setError(formatApiError(err, 'Не удалось выписать рецепт.'));
    } finally {
      setSaving(false);
    }
  }

  async function submitCertificate(e: FormEvent) {
    e.preventDefault();
    if (!enabled) return;
    setSaving(true);
    setError(null);
    try {
      await consultationsApi.issueCertificate(sessionId, {
        type: certType,
        title: certTitle.trim(),
        body: certBody.trim(),
        validFrom: validFrom ? new Date(`${validFrom}T00:00:00`).toISOString() : undefined,
        validUntil: validUntil ? new Date(`${validUntil}T23:59:59`).toISOString() : undefined,
      });
      setCertTitle('');
      setCertBody('');
      setValidFrom('');
      setValidUntil('');
      await load();
    } catch (err) {
      setError(formatApiError(err, 'Не удалось выдать справку.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={cn('flex flex-col gap-5 p-5', className)}>
      <div>
        <h3 className="text-[16px] font-semibold text-text">Клинические действия</h3>
        <p className="mt-1 text-[12px] text-text-muted">
          Диагноз, рецепт и справка сразу попадают в чат. Протокол завершения приёма заполняется отдельно.
        </p>
      </div>

      <form onSubmit={(e) => void submitDiagnosis(e)} className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-text">Диагноз</p>
        <div className="grid grid-cols-[100px_1fr] gap-2">
          <Input
            value={icd10}
            onChange={(e) => setIcd10(e.target.value)}
            placeholder="МКБ-10"
            disabled={!enabled || saving}
          />
          <Input
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
            placeholder="Формулировка"
            disabled={!enabled || saving}
          />
        </div>
        <Button type="submit" size="sm" disabled={!enabled || saving || (!icd10.trim() && !diagnosisText.trim())}>
          Поставить диагноз
        </Button>
      </form>

      <form onSubmit={(e) => void submitPrescriptions(e)} className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-text">Рецепт</p>
        <Textarea
          rows={3}
          value={prescriptionsText}
          onChange={(e) => setPrescriptionsText(e.target.value)}
          placeholder={'Парацетамол 500 мг — при температуре до 3 дней'}
          disabled={!enabled || saving}
        />
        <Button type="submit" size="sm" disabled={!enabled || saving || !prescriptionsText.trim()}>
          Выписать рецепт
        </Button>
      </form>

      <form onSubmit={(e) => void submitCertificate(e)} className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-text">Справка</p>
        <Select
          value={certType}
          onChange={(e) => setCertType(e.target.value as CertificateType)}
          disabled={!enabled || saving}
        >
          {CERTIFICATE_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          value={certTitle}
          onChange={(e) => setCertTitle(e.target.value)}
          placeholder="Заголовок"
          disabled={!enabled || saving}
        />
        <Textarea
          rows={3}
          value={certBody}
          onChange={(e) => setCertBody(e.target.value)}
          placeholder="Текст справки"
          disabled={!enabled || saving}
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel className="text-[12px]">С</FieldLabel>
            <Input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              disabled={!enabled || saving}
            />
          </div>
          <div>
            <FieldLabel className="text-[12px]">По</FieldLabel>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              disabled={!enabled || saving}
            />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={!enabled || saving || !certTitle.trim() || !certBody.trim()}>
          Выдать справку
        </Button>
      </form>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      <div>
        <p className="text-[13px] font-semibold text-text">В этом приёме</p>
        {items.length === 0 ? (
          <p className="mt-2 text-[13px] text-text-muted">Пока нет диагноза, рецепта или справки.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((item) => (
              <li key={String(item.id)} className="rounded-md border border-border px-3 py-2">
                <p className="text-[12px] font-semibold text-text-muted">{kindLabel(item.kind)}</p>
                <p className="mt-1 text-[13px] text-text">{actionSummary(item)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
