import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import {
  labOrdersApi,
  normalizeLabOrders,
  getLabOrderId,
  getLabOrderStatusLabel,
  getLabOrderStatusTone,
  formatLabOrderItems,
  type LabOrderDto,
} from '@/api/labOrders';
import { consultationsApi, normalizeMine, getConsultationId } from '@/api/consultations';
import {
  routingApi,
  normalizeRouteSteps,
  labsFromRouteSteps,
  getRouteDecisionId,
  getDecisionLabs,
} from '@/api/routing';
import { formatDayTime } from '@/lib/scheduleSlot';

function LabOrderCard({
  order,
  consultationId,
}: {
  order: LabOrderDto;
  /** Если в order.consultationId пусто - подставляем из mine по совпадению */
  consultationId?: string;
}) {
  const items = order.items ?? [];
  const sessionId = order.consultationId ?? consultationId;

  return (
    <div className="rounded-md border border-border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-text">{formatLabOrderItems(order)}</p>
          <p className="mt-1 text-[12px] text-text-muted">
            {order.orderedAt ? formatDayTime(order.orderedAt) : '-'}
            {order.priority === 'urgent' ? ' · срочно' : ''}
            {sessionId ? ' · после консультации' : ''}
          </p>
        </div>
        <Badge tone={getLabOrderStatusTone(order.status)}>
          {getLabOrderStatusLabel(order.status)}
        </Badge>
      </div>

      {order.clinicalIndication && (
        <p className="mt-2 text-[13px] text-text-muted">{order.clinicalIndication}</p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {items.map((item, index) => (
            <li
              key={item.itemId ?? `${item.testName}-${index}`}
              className="text-[13px] text-text"
            >
              · {item.testName}
              {item.testCode ? ` (${item.testCode})` : ''}
              {item.resultValue ? (
                <span className="text-text-muted">
                  {' '}
                  - {item.resultValue}
                  {item.unit ? ` ${item.unit}` : ''}
                  {item.isCritical ? ' · критично' : ''}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {sessionId ? (
        <ButtonLink
          to={`/patient/consultations/${sessionId}`}
          variant="secondary"
          size="sm"
          className="mt-3"
        >
          Открыть консультацию
        </ButtonLink>
      ) : null}
    </div>
  );
}

export function Labs() {
  const { patientId, publicId } = useAuth();
  const [selected, setSelected] = useState<PrescriptionDto | null>(null);

  const patientAliases = [patientId, publicId].filter(Boolean) as string[];

  const prescriptionsQuery = useAsyncData(
    () =>
      patientId
        ? prescriptionsApi.listForPatientAliases(patientAliases)
        : Promise.resolve(null),
    [patientId, publicId],
  );

  const labOrdersQuery = useAsyncData(
    () =>
      patientId ? labOrdersApi.listForPatientAliases(patientAliases) : Promise.resolve(null),
    [patientId, publicId],
  );

  const consultationsQuery = useAsyncData(
    () =>
      patientId
        ? consultationsApi.listMine({ includeCompleted: true, limit: 30 }).catch(() => null)
        : Promise.resolve(null),
    [patientId],
  );

  const activeRouteQuery = useAsyncData(
    () =>
      patientId
        ? routingApi.getActiveRoute(patientId).catch(() => null)
        : Promise.resolve(null),
    [patientId],
  );

  const decisionId = getRouteDecisionId(activeRouteQuery.data ?? undefined);

  const decisionQuery = useAsyncData(
    () => (decisionId ? routingApi.getDecision(decisionId).catch(() => null) : Promise.resolve(null)),
    [decisionId],
  );

  const prescriptions = normalizePrescriptions(prescriptionsQuery.data);
  const labOrders = useMemo(
    () =>
      normalizeLabOrders(labOrdersQuery.data).sort((a, b) =>
        (b.orderedAt ?? '').localeCompare(a.orderedAt ?? ''),
      ),
    [labOrdersQuery.data],
  );

  const mineConsultations = useMemo(
    () => normalizeMine(consultationsQuery.data),
    [consultationsQuery.data],
  );

  const protocolLabEntries = useMemo(() => {
    const entries: Array<{ key: string; names: string[]; sessionId?: string; completedAt?: string }> =
      [];
    for (const c of mineConsultations) {
      const names = (c.protocol?.labOrders ?? []).map((n) => n.trim()).filter(Boolean);
      if (names.length === 0) continue;
      entries.push({
        key: getConsultationId(c) ?? names.join('|'),
        names,
        sessionId: getConsultationId(c),
        completedAt: c.completedAt ?? undefined,
      });
    }
    return entries;
  }, [mineConsultations]);

  /** sessionId для lab-order без consultationId - по названию анализа из протокола. */
  const consultationIdByLabName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of mineConsultations) {
      const sessionId = getConsultationId(c);
      if (!sessionId) continue;
      for (const name of c.protocol?.labOrders ?? []) {
        const key = name.trim().toLowerCase();
        if (key && !map.has(key)) map.set(key, sessionId);
      }
    }
    return map;
  }, [mineConsultations]);

  function resolveConsultationId(order: LabOrderDto): string | undefined {
    if (order.consultationId) return order.consultationId;
    for (const item of order.items ?? []) {
      const key = item.testName?.trim().toLowerCase();
      if (key && consultationIdByLabName.has(key)) return consultationIdByLabName.get(key);
    }
    const title = formatLabOrderItems(order).trim().toLowerCase();
    return consultationIdByLabName.get(title);
  }

  const recommendedLabs = useMemo(() => {
    const fromDecision = getDecisionLabs(decisionQuery.data ?? undefined);
    if (fromDecision.length > 0) return fromDecision;
    const fromRoute = activeRouteQuery.data?.recommendedLabs;
    if (Array.isArray(fromRoute) && fromRoute.length > 0) return fromRoute;
    return labsFromRouteSteps(normalizeRouteSteps(activeRouteQuery.data ?? undefined));
  }, [decisionQuery.data, activeRouteQuery.data]);

  const loading =
    prescriptionsQuery.loading ||
    labOrdersQuery.loading ||
    consultationsQuery.loading ||
    activeRouteQuery.loading;
  const error = labOrdersQuery.error ?? prescriptionsQuery.error;

  return (
    <div>
      <PageHeader
        title="Анализы и рецепты"
        description="Направления и рецепты"
        backTo="/patient"
        backLabel="К моему пути"
      />

      <AsyncState
        loading={loading}
        error={error}
        onRetry={() => {
          labOrdersQuery.reload();
          prescriptionsQuery.reload();
          consultationsQuery.reload();
          activeRouteQuery.reload();
          decisionQuery.reload();
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Направления на анализы</h3>

            {labOrders.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {labOrders.map((order) => (
                  <LabOrderCard
                    key={getLabOrderId(order)}
                    order={order}
                    consultationId={resolveConsultationId(order)}
                  />
                ))}
              </div>
            ) : protocolLabEntries.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {protocolLabEntries.map((entry) => (
                  <div key={entry.key} className="rounded-md border border-border px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-text">
                          {entry.names.join(', ')}
                        </p>
                        <p className="mt-1 text-[12px] text-text-muted">
                          {entry.completedAt ? formatDayTime(entry.completedAt) : 'После консультации'}
                        </p>
                      </div>
                      <Badge tone="accent">Из консультации</Badge>
                    </div>
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {entry.names.map((name) => (
                        <li key={name} className="text-[13px] text-text">
                          · {name}
                        </li>
                      ))}
                    </ul>
                    {entry.sessionId ? (
                      <ButtonLink
                        to={`/patient/consultations/${entry.sessionId}`}
                        variant="secondary"
                        className="mt-3"
                      >
                        Открыть консультацию
                      </ButtonLink>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : recommendedLabs.length > 0 ? (
              <div className="mt-4 rounded-md border border-border px-4 py-4">
                <p className="text-[14px] font-semibold text-text">Рекомендовано маршрутом</p>
                <p className="mt-1 text-[13px] text-text-muted">
                  Ещё без оформленного направления в лабораторию.
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {recommendedLabs.map((name) => (
                    <li key={name} className="text-[13px] text-text">
                      · {name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-[14px] text-text-muted">
                Направлений пока нет. Они появятся, когда врач завершит консультацию с назначениями
                анализов или маршрут потребует обследований до приёма.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-[16px] font-semibold text-text">Рецепты</h3>
            <p className="mt-1 text-[13px] text-text-muted">
              Нажмите на рецепт, чтобы открыть детали и QR
            </p>
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
                          <p className="mt-2 text-[12px] font-semibold text-primary">
                            Есть QR для аптеки
                          </p>
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
        <div className="mt-0 flex flex-wrap gap-3">
          <ButtonLink to="/patient">К моему пути</ButtonLink>
          <ButtonLink to="/patient/consultations" variant="secondary">
            Мои консультации
          </ButtonLink>
        </div>
      </Card>

      {selected && (
        <PrescriptionDetailModal
          prescription={selected}
          variant="patient"
          onClose={() => setSelected(null)}
          onUpdated={prescriptionsQuery.reload}
        />
      )}
    </div>
  );
}
