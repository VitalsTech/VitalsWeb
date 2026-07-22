import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi } from '@/api/medicalRecords';

export function Profile() {
  const { user, patientId, patientName } = useAuth();

  const { data: state, loading, error, reload } = useAsyncData(
    () => (patientId ? medicalRecordsApi.getState(patientId) : Promise.resolve(null)),
    [patientId],
  );

  return (
    <div>
      <PageHeader
        title="Профиль пациента"
        description="Основные сведения, состояние здоровья и переход к сервисам."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Основное</h3>
          <div className="mt-4 flex flex-col gap-4 text-[14px] text-text">
            <p>ФИО: {patientName}</p>
            <p>Дата рождения: {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : '—'}</p>
            <p>Телефон: {user?.phoneNumber ?? '—'}</p>
            <p>Email: {user?.email ?? '—'}</p>
          </div>
          <ButtonLink to="/patient/profile/edit" size="sm" className="mt-5 w-fit">
            Сменить пароль
          </ButtonLink>
        </Card>

        <Card className="p-6">
          <h3 className="text-[16px] font-semibold text-text">Текущее состояние</h3>
          <AsyncState loading={loading} error={error} onRetry={reload}>
            <p className="mt-3 text-[13px] text-text-muted">
              {state?.summary ?? 'Сводка появится после первой консультации или триажа.'}
            </p>
            <p className="mt-3 text-[13px] text-text-muted">
              Аллергии: {state?.allergies ?? 'не указаны'}. Группа крови: {state?.bloodType ?? 'не указана'}
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
      </div>
    </div>
  );
}
