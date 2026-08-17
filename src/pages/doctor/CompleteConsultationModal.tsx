import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Textarea } from '@/components/ui/Input';
import {
  consultationsApi,
  type CompleteConsultationPayload,
} from '@/api/consultations';
import { formatApiError } from '@/api/http';

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CompleteConsultationModal({
  sessionId,
  onClose,
  onCompleted,
}: {
  sessionId: string;
  /** @deprecated бэкенд сам создаёт lab-orders/prescriptions из протокола */
  patientId?: string | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [complaints, setComplaints] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [diagnosisIcd10, setDiagnosisIcd10] = useState('');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [prescriptionsText, setPrescriptionsText] = useState('');
  const [labOrdersText, setLabOrdersText] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: CompleteConsultationPayload = {
      complaints: complaints.trim(),
      anamnesis: anamnesis.trim(),
      examinationNotes: examinationNotes.trim() || undefined,
      preliminaryDiagnosisIcd10: diagnosisIcd10.trim(),
      preliminaryDiagnosisText: diagnosisText.trim(),
      recommendations: recommendations.trim(),
      prescriptions: splitLines(prescriptionsText),
      labOrders: splitLines(labOrdersText),
      nextVisitDate: nextVisitDate
        ? new Date(`${nextVisitDate}T00:00:00`).toISOString()
        : null,
    };

    try {
      // Бэкенд сам создаёт lab-orders и рецепты из массивов протокола - не дублируем.
      await consultationsApi.complete(sessionId, payload);
      onCompleted();
    } catch (err) {
      const message = formatApiError(err, 'Не удалось завершить консультацию.');
      // Гонка/старый бэк: протокол уже записан, system-message упал на Completed.
      if (/session is completed/i.test(message)) {
        onCompleted();
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} widthClassName="max-w-[720px]">
      <p className="text-[13px] font-semibold text-accent">Протокол консультации</p>
      <h2 className="mt-2 text-[22px] font-bold text-text">Завершить консультацию</h2>
      <p className="mt-2 text-[13px] text-text-muted">Обязательные поля отмечены *.</p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 flex flex-col gap-4">
        <div>
          <FieldLabel>Жалобы *</FieldLabel>
          <Textarea
            rows={2}
            required
            value={complaints}
            onChange={(e) => setComplaints(e.target.value)}
            placeholder="Основные жалобы пациента"
          />
        </div>

        <div>
          <FieldLabel>Анамнез *</FieldLabel>
          <Textarea
            rows={3}
            required
            value={anamnesis}
            onChange={(e) => setAnamnesis(e.target.value)}
            placeholder="Анамнез заболевания и жизни"
          />
        </div>

        <div>
          <FieldLabel>Данные осмотра</FieldLabel>
          <Textarea
            rows={2}
            value={examinationNotes}
            onChange={(e) => setExaminationNotes(e.target.value)}
            placeholder="Объективный статус, результаты осмотра"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
          <div>
            <FieldLabel>МКБ-10 *</FieldLabel>
            <Input
              required
              value={diagnosisIcd10}
              onChange={(e) => setDiagnosisIcd10(e.target.value)}
              placeholder="J06.9"
              maxLength={32}
            />
          </div>
          <div>
            <FieldLabel>Диагноз *</FieldLabel>
            <Input
              required
              value={diagnosisText}
              onChange={(e) => setDiagnosisText(e.target.value)}
              placeholder="ОРВИ"
              maxLength={500}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Рекомендации *</FieldLabel>
          <Textarea
            rows={3}
            required
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="Лечение, режим, наблюдение"
          />
        </div>

        <div>
          <FieldLabel>Рецепты (по одному на строку)</FieldLabel>
          <Textarea
            rows={2}
            value={prescriptionsText}
            onChange={(e) => setPrescriptionsText(e.target.value)}
            placeholder={'Парацетамол 500 мг - при температуре\nАмоксициллин 500 мг - 3 р/день 7 дней'}
          />
        </div>

        <div>
          <FieldLabel>Направления на анализы (по одному на строку)</FieldLabel>
          <Textarea
            rows={3}
            value={labOrdersText}
            onChange={(e) => setLabOrdersText(e.target.value)}
            placeholder={'ОАК\nСРБ'}
          />
        </div>

        <div className="max-w-[220px]">
          <FieldLabel>Следующий визит</FieldLabel>
          <Input
            type="date"
            value={nextVisitDate}
            onChange={(e) => setNextVisitDate(e.target.value)}
          />
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="mt-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Сохранение…' : 'Завершить и сохранить протокол'}
          </Button>
          <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </Modal>
  );
}
