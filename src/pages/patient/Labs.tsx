import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { prescriptionsApi, normalizePrescriptions, getPrescriptionId } from '@/api/prescriptions';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Оформляется врачом',
  signed: 'Подписан',
  sent_to_pharmacy: 'Отправлен в аптеку',
  dispensed: 'Выдан',
  cancelled: 'Отменён',
};

export function Labs() {
  const { patientId } = useAuth();

  const { data, loading, error, reload } = useAsyncData(
    () => (patientId ? prescriptionsApi.listForPatient(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const prescriptions = normalizePrescriptions(data);

  return (
    <div>
      <PageHeader
        title="Статус анализов и рецепта"
        description="Связь с лабораторией и аптекой внутри одного маршрута"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Лаборатория Vitals Lab</h3>
            <p className="mt-2 text-[14px] text-text-muted">
              Направления на анализы появляются после консультации врача — статус будет виден в
              документах.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Рецепты</h3>
            {prescriptions.length === 0 ? (
              <p className="mt-2 text-[14px] text-text-muted">Активных рецептов пока нет.</p>
            ) : (
              <div className="mt-5 flex flex-col gap-3">
                {prescriptions.map((p) => (
                  <div
                    key={getPrescriptionId(p)}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-4"
                  >
                    <span className="text-[14px] font-semibold text-text">
                      {p.diagnosisForPrescription ?? 'Рецепт'}
                    </span>
                    <span className="text-[14px] text-text-muted">
                      {STATUS_LABELS[(p.status ?? '').toLowerCase()] ?? p.status ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AsyncState>

      <Card className="mt-6 p-6">
        <h3 className="text-[16px] font-semibold text-text">Всё в одном контексте</h3>
        <p className="mt-3 max-w-[900px] text-[14px] text-text-muted">
          Когда врач назначит анализы и рецепт, статусы обновятся автоматически. Вам не нужно
          переходить на сторонние сайты.
        </p>
        <ButtonLink to="/patient/treatment" className="mt-5">
          Вернуться к маршруту
        </ButtonLink>
      </Card>
    </div>
  );
}
