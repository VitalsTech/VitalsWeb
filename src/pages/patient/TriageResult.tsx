import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { useTriageSession } from './useTriageSession';
import { isTriageCompleted, normalizeTriageSession } from '@/api/triage';
import {
  routingApi,
  normalizeRouteSteps,
  routeStepTitle,
  routeStepNumber,
  labsFromRouteSteps,
  getRouteDecisionId,
  getDecisionLabs,
  getDecisionSpecialty,
} from '@/api/routing';
import { labOrdersApi, normalizeLabOrders } from '@/api/labOrders';
import { consultationsApi, CONSULTATION_TYPE, getConsultationId } from '@/api/consultations';
import { formatApiError } from '@/api/http';

const URGENCY_LABELS: Record<string, string> = {
  emergency: 'Срочно',
  urgent: 'Скоро',
  routine: 'Плановая',
};

async function fetchActiveRouteWithRetry(patientId: string) {
  let route = await routingApi.getActiveRoute(patientId).catch(() => null);
  // Kafka-only: решение может появиться с задержкой.
  if (!route) {
    await new Promise((r) => window.setTimeout(r, 1200));
    route = await routingApi.getActiveRoute(patientId).catch(() => null);
  }
  return route;
}

export function TriageResult() {
  const { patientId } = useAuth();
  const navigate = useNavigate();
  const { session, loading, error, refresh, sessionId, complete, sending } =
    useTriageSession(patientId);
  const [chatBusy, setChatBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const normalized = normalizeTriageSession(session);
  const completed = isTriageCompleted(normalized);

  const urgencyKey = (normalized?.urgency ?? '').toLowerCase();
  const urgencyLabel = URGENCY_LABELS[urgencyKey] ?? normalized?.urgency ?? 'Оценивается';
  const recommendation = normalized?.recommendation ?? normalized?.recommendationText;
  const hypotheses = normalized?.latestAssessment?.llmResult?.hypotheses ?? [];

  // После complete — active-route → currentDecisionId → getDecision.
  const activeRouteQuery = useAsyncData(
    () =>
      patientId && completed
        ? fetchActiveRouteWithRetry(patientId)
        : Promise.resolve(null),
    [patientId, completed, normalized?.routingDecisionId, normalized?.consultationSessionId],
  );

  const decisionId =
    getRouteDecisionId(activeRouteQuery.data ?? undefined) ??
    normalized?.routingDecisionId ??
    undefined;

  const decisionQuery = useAsyncData(
    () => (decisionId ? routingApi.getDecision(decisionId).catch(() => null) : Promise.resolve(null)),
    [decisionId],
  );

  const labOrdersQuery = useAsyncData(
    () =>
      patientId && completed
        ? labOrdersApi.listForPatient(patientId).catch(() => null)
        : Promise.resolve(null),
    [patientId, completed],
  );

  const routeSteps = useMemo(
    () => normalizeRouteSteps(activeRouteQuery.data ?? undefined),
    [activeRouteQuery.data],
  );

  const recommendedLabs = useMemo(() => {
    const fromComplete = normalized?.recommendedLabs ?? [];
    if (fromComplete.length > 0) return fromComplete;
    const fromDecision = getDecisionLabs(decisionQuery.data ?? undefined);
    if (fromDecision.length > 0) return fromDecision;
    return labsFromRouteSteps(routeSteps);
  }, [normalized?.recommendedLabs, decisionQuery.data, routeSteps]);

  const assignedDoctorId =
    normalized?.assignedDoctorId ?? decisionQuery.data?.assignedDoctorId ?? undefined;
  const assignedDoctorName =
    normalized?.assignedDoctorName ??
    decisionQuery.data?.assignedDoctorName ??
    getDecisionSpecialty(decisionQuery.data ?? undefined) ??
    normalized?.recommendedSpecialization ??
    undefined;
  const consultationSessionId = normalized?.consultationSessionId;

  async function openFreeChat() {
    if (!patientId || !assignedDoctorId) return;
    setChatBusy(true);
    setActionError(null);
    try {
      let id: string | undefined;
      try {
        const active = await consultationsApi.getActive(patientId, assignedDoctorId);
        id = getConsultationId(active);
      } catch {
        /* create below */
      }
      if (!id) {
        const created = await consultationsApi.create({
          patientId,
          doctorId: assignedDoctorId,
          doctorName: assignedDoctorName,
          consultationType: CONSULTATION_TYPE.chat,
          triageSessionId: sessionId ?? undefined,
          routingDecisionId: decisionId ?? normalized?.routingDecisionId,
        });
        id = getConsultationId(created);
      }
      if (id) navigate(`/patient/consultations/${id}`);
      else navigate(`/patient/doctors/${assignedDoctorId}/chat`);
    } catch (err) {
      setActionError(formatApiError(err, 'Не удалось открыть чат с врачом.'));
    } finally {
      setChatBusy(false);
    }
  }

  const labOrders = normalizeLabOrders(labOrdersQuery.data);

  return (
    <div>
      <PageHeader
        title="Результат триажа"
        description="Маршрут после ИИ-триажа: врач, консультация, анализы"
        backTo="/patient/triage"
        backLabel="Назад к триажу"
      />

      <AsyncState loading={loading} error={error} onRetry={refresh}>
        {!sessionId ? (
          <Card className="p-6">
            <p className="text-[14px] text-text-muted">
              Сессия ИИ-триажа ещё не начата. Опишите симптомы на предыдущем экране, чтобы получить
              маршрут.
            </p>
            <ButtonLink to="/patient/triage" className="mt-5">
              К ИИ-триажу
            </ButtonLink>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
              <div className="flex flex-col gap-6">
                <Card className="p-6">
                  <p className="text-[13px] font-semibold text-text-muted">
                    Срочность: <span className="text-warning">{urgencyLabel}</span>
                  </p>
                  <p className="mt-2 text-[13px] text-text-muted">
                    {normalized?.urgencyLevel != null || normalized?.latestUrgencyLevel != null
                      ? `Уровень срочности: ${normalized.urgencyLevel ?? normalized.latestUrgencyLevel}`
                      : 'Итоговая оценка появится после завершения триажа.'}
                  </p>
                  {normalized?.routingOutcomeType && (
                    <p className="mt-2 text-[13px] text-text-muted">
                      Исход маршрута: {normalized.routingOutcomeType}
                    </p>
                  )}
                  {hypotheses.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1">
                      {hypotheses.slice(0, 3).map((h) => (
                        <li key={h.condition} className="text-[13px] text-text">
                          · {h.condition}
                          {h.probability != null
                            ? ` (${Math.round(h.probability * 100)}%)`
                            : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-[16px] font-semibold text-text">Можно удалённо</h3>
                  <p className="mt-3 text-[13px] text-text-muted">
                    {normalized?.canBeRemote === false
                      ? 'Нет — рекомендован очный визит.'
                      : 'Да — первичная консультация возможна онлайн. Очный визит — при ухудшении.'}
                  </p>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-[16px] font-semibold text-text">Рекомендованный маршрут</h3>
                {recommendation ? (
                  <p className="mt-4 whitespace-pre-line text-[14px] text-text">{recommendation}</p>
                ) : (
                  <p className="mt-4 text-[14px] text-text-muted">
                    {completed
                      ? 'Текст рекомендации не пришёл — смотрите шаги маршрута ниже.'
                      : 'Завершите триаж, чтобы получить маршрут.'}
                  </p>
                )}
                {(assignedDoctorName || normalized?.recommendedSpecialization) && (
                  <p className="mt-5 text-[13px] text-text-muted">
                    Специализация:{' '}
                    {assignedDoctorName ?? normalized?.recommendedSpecialization}
                  </p>
                )}

                {routeSteps.length > 0 && (
                  <ol className="mt-5 flex flex-col gap-2">
                    {routeSteps.map((step, index) => {
                      const number = routeStepNumber(step, index);
                      const current = activeRouteQuery.data?.currentStep ?? 1;
                      return (
                        <li key={`${number}-${routeStepTitle(step, index)}`} className="flex gap-3">
                          <span
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                              number === current
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border bg-surface text-text-muted'
                            }`}
                          >
                            {number}
                          </span>
                          <div>
                            <p className="text-[14px] font-semibold text-text">
                              {routeStepTitle(step, index)}
                            </p>
                            {step.description && (
                              <p className="text-[13px] text-text-muted">{step.description}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Card>
            </div>

            {recommendedLabs.length > 0 && (
              <Card className="mt-6 p-6">
                <h3 className="text-[16px] font-semibold text-text">Сдайте анализы</h3>
                <p className="mt-1 text-[13px] text-text-muted">
                  Из routing decision / шага «Назначены анализы…»
                </p>
                <ul className="mt-3 list-inside list-disc text-[14px] text-text">
                  {recommendedLabs.map((lab) => (
                    <li key={lab}>{lab}</li>
                  ))}
                </ul>
                {labOrders.length > 0 && (
                  <p className="mt-3 text-[13px] text-text-muted">
                    Уже есть направлений: {labOrders.length} — смотрите статусы в разделе «Анализы».
                  </p>
                )}
                <ButtonLink to="/patient/labs" className="mt-4" variant="secondary">
                  К анализам
                </ButtonLink>
              </Card>
            )}

            {(assignedDoctorId || assignedDoctorName) && (
              <Card className="mt-6 p-6">
                <h3 className="text-[16px] font-semibold text-text">Назначенный врач</h3>
                <p className="mt-2 text-[18px] font-bold text-text">
                  {assignedDoctorName ?? 'Врач по маршруту'}
                </p>
                <p className="mt-1 text-[13px] text-text-muted">
                  {consultationSessionId
                    ? 'Консультация уже открыта по решению маршрутизации.'
                    : 'Можно написать в чат сейчас или записаться на слот расписания.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {consultationSessionId ? (
                    <Button
                      onClick={() => navigate(`/patient/consultations/${consultationSessionId}`)}
                    >
                      Открыть консультацию
                    </Button>
                  ) : assignedDoctorId ? (
                    <>
                      <Button disabled={chatBusy} onClick={() => void openFreeChat()}>
                        {chatBusy ? 'Открытие…' : 'Написать врачу'}
                      </Button>
                      <ButtonLink
                        to={`/patient/doctors/${assignedDoctorId}/book`}
                        variant="secondary"
                      >
                        Записаться
                      </ButtonLink>
                      <ButtonLink
                        to={`/patient/doctors/${assignedDoctorId}`}
                        variant="secondary"
                      >
                        Карточка врача
                      </ButtonLink>
                    </>
                  ) : null}
                </div>
              </Card>
            )}

            {actionError && <p className="mt-4 text-[13px] text-danger">{actionError}</p>}

            <div className="mt-6 flex flex-wrap gap-4">
              {consultationSessionId ? (
                <Button
                  size="lg"
                  onClick={() => navigate(`/patient/consultations/${consultationSessionId}`)}
                >
                  Открыть консультацию
                </Button>
              ) : null}

              {!completed && (
                <Button
                  size="lg"
                  disabled={sending}
                  onClick={() => void complete().then((s) => s && refresh())}
                >
                  {sending ? 'Завершение…' : 'Завершить триаж'}
                </Button>
              )}

              {!consultationSessionId && !assignedDoctorId && (
                <ButtonLink
                  to="/patient/doctors"
                  size="lg"
                  variant={completed ? 'primary' : 'secondary'}
                >
                  К врачу / каталог
                </ButtonLink>
              )}

              <ButtonLink to="/patient" variant="secondary" size="lg">
                На «Мой путь»
              </ButtonLink>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  refresh();
                  activeRouteQuery.reload();
                  decisionQuery.reload();
                  labOrdersQuery.reload();
                }}
              >
                Обновить маршрут
              </Button>
            </div>
          </>
        )}
      </AsyncState>
    </div>
  );
}
