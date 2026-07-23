import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import {
  PrescriptionDetailModal,
  PrescriptionStatusBadge,
} from '@/components/PrescriptionDetailModal';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import {
  prescriptionsApi,
  normalizePrescriptions,
  getPrescriptionId,
  canShowPrescriptionQr,
} from '@/api/prescriptions';
import type { PrescriptionDto } from '@/api/prescriptions';

export function Labs() {
  const { patientId } = useAuth();
  const [selected, setSelected] = useState<PrescriptionDto | null>(null);

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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-semibold text-text">Рецепты</h3>
                <p className="mt-1 text-[13px] text-text-muted">Нажмите на рецепт, чтобы открыть детали и QR</p>
              </div>
            </div>
            {prescriptions.length === 0 ? (
              <p className="mt-4 text-[14px] text-text-muted">Активных рецептов пока нет.</p>
            ) : (
              <div className="mt-5 flex flex-col gap-3">
                {prescriptions.map((p) => {
                  const med = p.medications?.[0];
                  const scheme = [med?.dosage, med?.frequency].filter(Boolean).join(' · ');
                  return (
                    <button
                      key={getPrescriptionId(p)}
                      type="button"
                      onClick={() => setSelected(p)}
                      className="flex w-full items-start justify-between gap-4 rounded-md border border-border px-4 py-4 text-left transition-colors hover:border-accent hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-text">
                          {med?.tradeName ?? p.diagnosisForPrescription ?? 'Рецепт'}
                        </p>
                        {scheme ? (
                          <p className="mt-1 text-[13px] text-text-muted">{scheme}</p>
                        ) : null}
                        {canShowPrescriptionQr(p.status) ? (
                          <p className="mt-2 text-[12px] font-semibold text-primary">Есть QR для аптеки</p>
                        ) : null}
                      </div>
                      <PrescriptionStatusBadge status={p.status} />
                    </button>
                  );
                })}
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

      {selected && (
        <PrescriptionDetailModal
          prescription={selected}
          variant="patient"
          onClose={() => setSelected(null)}
          onUpdated={reload}
        />
      )}
    </div>
  );
}
