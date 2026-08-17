import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { EsiaConnectCard } from '@/components/EsiaConnectCard';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi } from '@/api/medicalRecords';
import { consultationsApi, normalizeMine } from '@/api/consultations';
import { maskSensitive, patientImportedFields } from '@/api/esia';
import {
  pickLatestConsultation,
  summaryFromConsultation,
} from '@/lib/consultationSummary';

export function Profile() {
  const { user, patientId, patientName } = useAuth();
  const imported = patientImportedFields(user);

  const stateQuery = useAsyncData(
    () => (patientId ? medicalRecordsApi.getState(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const mineQuery = useAsyncData(
    () =>
      patientId
        ? consultationsApi.listMine({ includeCompleted: true, limit: 30 }).catch(() => null)
        : Promise.resolve(null),
    [patientId],
  );

  const latestConsultation = pickLatestConsultation(normalizeMine(mineQuery.data), patientId);
  const summaryText =
    stateQuery.data?.summary ??
    summaryFromConsultation(latestConsultation) ??
    'Сводка появится после первой консультации или триажа.';

  return (
    <div>
      <PageHeader
        title="Профиль пациента"
        description="Основные сведения и состояние здоровья"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Основное</h3>
          <div className="mt-4 flex flex-col gap-4 text-[14px] text-text">
            <p>ФИО: {patientName}</p>
            <p>
              Дата рождения:{' '}
              {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '-'}
            </p>
            <p>Телефон: {user?.phoneNumber ?? '-'}</p>
            <p>Email: {user?.email ?? '-'}</p>
            <p>Полис ОМС: {maskSensitive(imported.insuranceNumber) ?? '-'}</p>
            <p>Адрес: {imported.residenceAddress ?? '-'}</p>
          </div>
          <ButtonLink to="/patient/profile/edit" size="sm" className="mt-5 w-fit">
            Сменить пароль
          </ButtonLink>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Текущее состояние</h3>
          <AsyncState
            loading={stateQuery.loading || mineQuery.loading}
            error={stateQuery.error}
            onRetry={() => {
              stateQuery.reload();
              mineQuery.reload();
            }}
          >
            <p className="mt-3 text-[13px] text-text-muted">{summaryText}</p>
            <p className="mt-3 text-[13px] text-text-muted">
              Аллергии: {stateQuery.data?.allergies ?? 'не указаны'}. Группа крови:{' '}
              {stateQuery.data?.bloodType ?? 'не указана'}
            </p>
          </AsyncState>

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
          </div>
        </Card>

        <div className="lg:col-span-2">
          <EsiaConnectCard />
        </div>
      </div>
    </div>
  );
}
