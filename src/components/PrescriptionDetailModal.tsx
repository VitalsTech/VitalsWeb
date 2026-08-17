import { useEffect, useId, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FieldLabel, Textarea } from '@/components/ui/Input';
import {
  prescriptionsApi,
  getPrescriptionId,
  getPrescriptionStatusLabel,
  getPrescriptionStatusTone,
  canCancelPrescription,
  canSendPrescriptionToPharmacy,
  canShowPrescriptionQr,
} from '@/api/prescriptions';
import type { PrescriptionDto } from '@/api/prescriptions';

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function instructionsToText(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return instructionsToText(parsed);
      } catch {
        return trimmed || null;
      }
    }
    return trimmed;
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of [
      'instructions',
      'instruction',
      'text',
      'content',
      'message',
      'patientInstructions',
      'summary',
    ]) {
      if (typeof obj[key] === 'string' && (obj[key] as string).trim()) {
        return (obj[key] as string).trim();
      }
    }
    return null;
  }
  return String(data);
}

export function PrescriptionStatusBadge({ status }: { status?: string | null }) {
  return <Badge tone={getPrescriptionStatusTone(status)}>{getPrescriptionStatusLabel(status)}</Badge>;
}

/** Pulls an <img> src from common QR API payload shapes. */
export function extractQrImageSrc(data: unknown): string | null {
  if (data == null) return null;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.replace(/\s/g, '').length > 64) {
      return `data:image/png;base64,${trimmed.replace(/\s/g, '')}`;
    }
    return null;
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of [
      'qrCodeBase64Png',
      'qrCodeBase64',
      'qrBase64',
      'imageBase64',
      'base64',
      'qrCode',
      'qrImage',
      'image',
      'qrUrl',
      'url',
      'dataUrl',
      'qr',
      'data',
    ]) {
      const nested = extractQrImageSrc(obj[key]);
      if (nested) return nested;
    }
  }

  return null;
}

/** Payload string to encode into a QR if the API did not return an image. */
export function extractQrPayload(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image') || trimmed.startsWith('http')) return null;
    if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.replace(/\s/g, '').length > 64) return null;
    return trimmed;
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['payload', 'content', 'data', 'code', 'token', 'value', 'qrPayload', 'text']) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) {
        const asImage = extractQrImageSrc(value);
        if (asImage) continue;
        return value.trim();
      }
    }
  }
  return null;
}

function qrFallbackSrc(payload: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`;
}

export function PrescriptionQrModal({
  prescription,
  onClose,
}: {
  prescription: PrescriptionDto;
  onClose: () => void;
}) {
  const id = getPrescriptionId(prescription);
  const titleId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setImageSrc(null);
    setPayload(null);

    void prescriptionsApi
      .getQr(id)
      .then((data) => {
        if (cancelled) return;
        const src = extractQrImageSrc(data);
        const text = extractQrPayload(data);
        if (src) setImageSrc(src);
        else if (text) {
          setPayload(text);
          setImageSrc(qrFallbackSrc(text));
        } else {
          setError('QR пока недоступен для этого рецепта.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить QR.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  return (
    <Modal onClose={onClose} widthClassName="max-w-[420px]">
      <h3 id={titleId} className="text-[18px] font-bold text-text">
        QR рецепта
      </h3>
      <p className="mt-2 text-[13px] text-text-muted">
        Покажите код фармацевту в аптеке-партнёре.
      </p>

      <div className="mt-6 flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-border bg-surface-muted p-6">
        {loading && <p className="text-[14px] text-text-muted">Загрузка QR…</p>}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-[14px] text-danger">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
              Повторить
            </Button>
          </div>
        )}
        {!loading && !error && imageSrc && (
          <img
            src={imageSrc}
            alt="QR-код рецепта"
            className="h-[240px] w-[240px] bg-white object-contain p-2"
            onError={() => setError('Не удалось отобразить QR-изображение.')}
          />
        )}
      </div>

      {payload && !error && (
        <p className="mt-3 break-all text-center text-[11px] text-text-muted" aria-hidden>
          {payload.length > 120 ? `${payload.slice(0, 120)}…` : payload}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Modal>
  );
}

export function PrescriptionDetailModal({
  prescription,
  onClose,
  variant = 'doctor',
  onUpdated,
}: {
  prescription: PrescriptionDto;
  onClose: () => void;
  variant?: 'doctor' | 'patient';
  onUpdated?: () => void;
}) {
  const id = getPrescriptionId(prescription);
  const [detail, setDetail] = useState<PrescriptionDto>(prescription);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Больше не актуально');

  useEffect(() => {
    let cancelled = false;
    setLoadingExtra(true);
    setDetail(prescription);
    setActionError(null);
    setActionOk(null);

    void (async () => {
      const [fresh, instr] = await Promise.all([
        prescriptionsApi.get(id).catch(() => null),
        prescriptionsApi.getInstructions(id).catch(() => null),
      ]);
      if (cancelled) return;
      if (fresh) setDetail(fresh);
      setInstructions(instructionsToText(instr));
      setLoadingExtra(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, prescription]);

  async function refreshDetail() {
    const [fresh, instr] = await Promise.all([
      prescriptionsApi.get(id).catch(() => null),
      prescriptionsApi.getInstructions(id).catch(() => null),
    ]);
    if (fresh) setDetail(fresh);
    setInstructions(instructionsToText(instr));
  }

  const meds = detail.medications ?? [];
  const title =
    meds[0]?.tradeName ?? detail.diagnosisForPrescription ?? `Рецепт ${id ? `№${id.slice(0, 8)}` : ''}`;
  const qrAvailable = canShowPrescriptionQr(detail.status);
  const canSend = variant === 'patient' && canSendPrescriptionToPharmacy(detail.status);
  const canCancel = variant === 'patient' && canCancelPrescription(detail.status);

  async function sendToPharmacy() {
    setActionBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      const updated = await prescriptionsApi.sendToPharmacy(id, { autoSelectNearest: true });
      setDetail((prev) => ({ ...prev, ...updated, status: updated.status ?? 'SentToPharmacy' }));
      setActionOk('Рецепт отправлен в ближайшую аптеку.');
      onUpdated?.();
      await refreshDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось отправить в аптеку.');
    } finally {
      setActionBusy(false);
    }
  }

  async function confirmCancel() {
    if (!cancelReason.trim()) return;
    setActionBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      await prescriptionsApi.cancel(id, cancelReason.trim());
      setCancelOpen(false);
      setDetail((prev) => ({ ...prev, status: 'Cancelled' }));
      setActionOk('Рецепт отменён.');
      onUpdated?.();
      await refreshDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось отменить рецепт.');
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <>
      <Modal onClose={onClose} widthClassName="max-w-[640px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[20px] font-bold text-text">{title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PrescriptionStatusBadge status={detail.status} />
              {id ? (
                <span className="text-[12px] text-text-muted" title={id}>
                  №{id.slice(0, 8)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {(actionError || actionOk) && (
          <p className={`mt-4 text-[13px] ${actionError ? 'text-danger' : 'text-success'}`}>
            {actionError ?? actionOk}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-semibold text-text-muted">Диагноз</dt>
            <dd className="mt-1 text-[14px] text-text">{detail.diagnosisForPrescription ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-text-muted">Действует до</dt>
            <dd className="mt-1 text-[14px] text-text">{formatShortDate(detail.validUntil) ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-[12px] font-semibold text-text-muted">Создан</dt>
            <dd className="mt-1 text-[14px] text-text">{formatDate(detail.createdAt) ?? '-'}</dd>
          </div>
          {detail.signedAt && (
            <div>
              <dt className="text-[12px] font-semibold text-text-muted">Подписан</dt>
              <dd className="mt-1 text-[14px] text-text">{formatDate(detail.signedAt)}</dd>
            </div>
          )}
          {detail.sentToPharmacyAt && (
            <div>
              <dt className="text-[12px] font-semibold text-text-muted">Отправлен в аптеку</dt>
              <dd className="mt-1 text-[14px] text-text">{formatDate(detail.sentToPharmacyAt)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <h4 className="text-[14px] font-semibold text-text">Препараты</h4>
          {meds.length === 0 ? (
            <p className="mt-2 text-[14px] text-text-muted">Список препаратов пуст.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {meds.map((med, index) => (
                <li
                  key={`${med.tradeName ?? med.inn ?? 'med'}-${index}`}
                  className="rounded-md border border-border px-4 py-3"
                >
                  <p className="text-[14px] font-semibold text-text">
                    {med.tradeName ?? med.inn ?? `Препарат ${index + 1}`}
                  </p>
                  <p className="mt-1 text-[13px] text-text-muted">
                    {[
                      med.inn && med.inn !== med.tradeName ? `МНН: ${med.inn}` : null,
                      med.dosageForm,
                      med.dosage,
                      med.frequency,
                      med.courseDays != null ? `${med.courseDays} дн.` : null,
                      med.packageQuantity,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Схема не указана'}
                  </p>
                  {med.specialInstructions && (
                    <p className="mt-2 text-[13px] text-text">{med.specialInstructions}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <h4 className="text-[14px] font-semibold text-text">Инструкция</h4>
          {loadingExtra ? (
            <p className="mt-2 text-[13px] text-text-muted">Загрузка…</p>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-[14px] text-text-muted">
              {instructions ??
                (variant === 'patient'
                  ? 'Следуйте схеме приёма на препаратах выше. Подробная инструкция появится после подписи рецепта.'
                  : 'Инструкция для пациента пока не сформирована.')}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          {canCancel && (
            <Button
              variant="secondary"
              disabled={actionBusy}
              onClick={() => {
                setCancelReason('Больше не актуально');
                setCancelOpen(true);
              }}
            >
              Отменить рецепт
            </Button>
          )}
          {canSend && (
            <Button variant="secondary" disabled={actionBusy} onClick={() => void sendToPharmacy()}>
              {actionBusy ? 'Отправка…' : 'Отправить в аптеку'}
            </Button>
          )}
          {variant === 'patient' && (
            <Button
              disabled={!qrAvailable || actionBusy}
              title={qrAvailable ? undefined : 'QR доступен после подписи рецепта'}
              onClick={() => setShowQr(true)}
            >
              Показать QR
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </Modal>

      {showQr && <PrescriptionQrModal prescription={detail} onClose={() => setShowQr(false)} />}

      {cancelOpen && (
        <Modal onClose={() => setCancelOpen(false)} widthClassName="max-w-[480px]">
          <h3 className="text-[18px] font-bold text-text">Отмена рецепта</h3>
          <p className="mt-2 text-[14px] text-text-muted">
            {title} · {getPrescriptionStatusLabel(detail.status)}
          </p>
          <div className="mt-5">
            <FieldLabel>Причина</FieldLabel>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={!cancelReason.trim() || actionBusy} onClick={() => void confirmCancel()}>
              {actionBusy ? 'Отмена…' : 'Подтвердить'}
            </Button>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Назад
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
