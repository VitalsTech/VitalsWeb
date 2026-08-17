import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { PrescriptionDetailModal } from '@/components/PrescriptionDetailModal';
import { MoodCheckIn, moodOptionByCode, moodOptionByLabel } from '@/components/MoodCheckIn';
import type { MoodCode, MoodOption } from '@/components/MoodCheckIn';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { medicalRecordsApi, normalizeHistory, parseEventPayload } from '@/api/medicalRecords';
import type { MedicalRecordEventDto } from '@/api/medicalRecords';
import {
  prescriptionsApi,
  normalizePrescriptions,
  normalizePrescriptionStatus,
  getPrescriptionId,
  getPrescriptionStatusLabel,
} from '@/api/prescriptions';
import { useTriageSession } from './useTriageSession';
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
import { consultationsApi, normalizeMine, getConsultationId } from '@/api/consultations';

type MoodPayload = {
  mood?: string;
  moodCode?: string;
  severity?: number;
};

const EVENT_LABELS: Record<string, string> = {
  triage_session: 'ИИ-триаж',
  AiTriageUrgencyDetermined: 'Маршрут после ИИ-триажа',
  consultation: 'Консультация',
  ConsultationStarted: 'Консультация начата',
  ConsultationCompleted: 'Консультация завершена',
  ConsultationJoined: 'Подключение к консультации',
  ConsultationMessage: 'Сообщение в консультации',
  document: 'Документ',
  DocumentUploaded: 'Документ',
  prescription: 'Рецепт',
  PrescriptionIssued: 'Рецепт',
  mood_check: 'Отметка самочувствия',
  VitalSignRecorded: 'Отметка самочувствия',
  DiagnosisConfirmed: 'Диагноз',
  support_request: 'Обращение в поддержку',
  house_call_request: 'Вызов врача на дом',
  TreatmentStarted: 'Направление',
};

type TriagePayload = {
  recommendation?: string;
  recommendedSpecialization?: string;
  urgencyLevel?: number | string;
  route?: string[];
  sessionId?: string;
  mood?: string;
};

type PathStepStatus = 'done' | 'current' | 'upcoming';

type PathStep = {
  title: string;
  description: string;
  status: PathStepStatus;
};

function isTriagePathEvent(event: MedicalRecordEventDto) {
  return event.eventType === 'AiTriageUrgencyDetermined' || event.eventType === 'triage_session';
}

function isConsultationEvent(event: MedicalRecordEventDto) {
  const type = event.eventType ?? '';
  return (
    type === 'consultation' ||
    type === 'ConsultationStarted' ||
    type === 'ConsultationCompleted' ||
    type === 'ConsultationJoined' ||
    type === 'TreatmentStarted'
  );
}

function isPrescriptionEvent(event: MedicalRecordEventDto) {
  const type = event.eventType ?? '';
  return type === 'prescription' || type === 'PrescriptionIssued';
}

function isMoodEvent(event: MedicalRecordEventDto) {
  return event.eventType === 'mood_check' || event.eventType === 'VitalSignRecorded';
}

function isSameLocalDay(iso?: string) {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatEventTitle(event: MedicalRecordEventDto) {
  const type = event.eventType ?? 'event';
  const payload = parseEventPayload<TriagePayload>(event);
  if (isTriagePathEvent(event)) {
    const specialty = payload?.recommendedSpecialization;
    return specialty ? `Маршрут: ${specialty}` : (EVENT_LABELS[type] ?? type);
  }
  if (payload?.mood) return `Самочувствие: ${payload.mood}`;
  return EVENT_LABELS[type] ?? type;
}

function formatEventDate(event: MedicalRecordEventDto) {
  const raw = event.occurredAt ?? event.createdAt;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventTime(event: MedicalRecordEventDto) {
  const raw = event.occurredAt ?? event.createdAt;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function urgencyLabel(level: number | string | undefined) {
  const n = typeof level === 'string' ? Number(level) : level;
  if (n == null || Number.isNaN(n)) return null;
  if (n >= 5) return 'Срочно';
  if (n >= 4) return 'Скоро';
  return 'Плановая';
}

function formatValidUntil(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function StepDot({ status }: { status: PathStepStatus }) {
  if (status === 'done') {
    return <span className="h-6 w-6 flex-shrink-0 rounded-full bg-success" />;
  }
  if (status === 'current') {
    return <span className="h-6 w-6 flex-shrink-0 rounded-full bg-primary" />;
  }
  return <span className="h-6 w-6 flex-shrink-0 rounded-full border border-border bg-surface" />;
}

export function Home() {
  const { patientName, patientId, publicId } = useAuth();
  const navigate = useNavigate();
  const [moodCode, setMoodCode] = useState<MoodCode | null>(null);
  const [savingMood, setSavingMood] = useState(false);
  const [moodFeedback, setMoodFeedback] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<
    ReturnType<typeof normalizePrescriptions>[number] | null
  >(null);
  const triage = useTriageSession(patientId);
  const patientAliases = [patientId, publicId].filter(Boolean) as string[];

  const history = useAsyncData(
    () => (patientId ? medicalRecordsApi.getHistory(patientId) : Promise.resolve(null)),
    [patientId],
  );

  const prescriptions = useAsyncData(
    () =>
      patientId
        ? prescriptionsApi.listForPatientAliases(patientAliases)
        : Promise.resolve(null),
    [patientId, publicId],
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

  const labOrdersQuery = useAsyncData(
    () =>
      patientId
        ? labOrdersApi.listForPatientAliases(patientAliases).catch(() => null)
        : Promise.resolve(null),
    [patientId, publicId],
  );

  const consultationsQuery = useAsyncData(
    () =>
      patientId
        ? consultationsApi.listMine({ includeCompleted: true, limit: 30 }).catch(() => null)
        : Promise.resolve(null),
    [patientId],
  );

  const apiRouteSteps = useMemo(
    () => normalizeRouteSteps(activeRouteQuery.data ?? undefined),
    [activeRouteQuery.data],
  );

  const mineConsultations = useMemo(
    () => normalizeMine(consultationsQuery.data),
    [consultationsQuery.data],
  );

  const openConsultation = useMemo(() => {
    return (
      mineConsultations.find((c) => {
        const status = (c.status ?? '').toLowerCase();
        return status !== 'completed' && status !== 'cancelled' && status !== 'expired';
      }) ?? null
    );
  }, [mineConsultations]);

  const protocolLabs = useMemo(() => {
    const names = new Set<string>();
    for (const c of mineConsultations) {
      for (const name of c.protocol?.labOrders ?? []) {
        const trimmed = name?.trim();
        if (trimmed) names.add(trimmed);
      }
    }
    return [...names];
  }, [mineConsultations]);

  const protocolHasPrescription = useMemo(() => {
    return mineConsultations.some((c) =>
      (c.protocol?.prescriptions ?? []).some((line) => Boolean(line?.trim())),
    );
  }, [mineConsultations]);

  const hasOpenLabOrders = useMemo(() => {
    return normalizeLabOrders(labOrdersQuery.data).some((order) => {
      const status = (order.status ?? '').toLowerCase();
      return status === 'ordered' || status === 'inprogress';
    });
  }, [labOrdersQuery.data]);

  const hasAnyLabOrders = useMemo(
    () => normalizeLabOrders(labOrdersQuery.data).length > 0,
    [labOrdersQuery.data],
  );

  const recommendedLabs = useMemo(() => {
    const fromDecision = getDecisionLabs(decisionQuery.data ?? undefined);
    if (fromDecision.length > 0) return fromDecision;
    const fromRoute = activeRouteQuery.data?.recommendedLabs;
    if (Array.isArray(fromRoute) && fromRoute.length > 0) return fromRoute;
    const fromSteps = labsFromRouteSteps(apiRouteSteps);
    if (fromSteps.length > 0) return fromSteps;
    return protocolLabs;
  }, [decisionQuery.data, activeRouteQuery.data, apiRouteSteps, protocolLabs]);

  const events = useMemo(() => {
    return [...normalizeHistory(history.data)].sort((a, b) => eventTime(b) - eventTime(a));
  }, [history.data]);

  const latestPath = events.find(isTriagePathEvent);
  const latestPathPayload = latestPath ? parseEventPayload<TriagePayload>(latestPath) : null;
  const hasConsultation =
    events.some(isConsultationEvent) ||
    mineConsultations.length > 0 ||
    mineConsultations.some((c) => Boolean(c.hasProtocol || c.protocol || c.completedAt));
  const consultCompleted =
    mineConsultations.some((c) => {
      const status = (c.status ?? '').toLowerCase();
      return status === 'completed' || Boolean(c.hasProtocol || c.protocol);
    }) || events.some((e) => e.eventType === 'ConsultationCompleted');
  const hasPrescription =
    events.some(isPrescriptionEvent) ||
    normalizePrescriptions(prescriptions.data).length > 0 ||
    protocolHasPrescription;

  const specialty =
    getDecisionSpecialty(decisionQuery.data ?? undefined) ??
    latestPathPayload?.recommendedSpecialization ??
    triage.session?.recommendedSpecialization ??
    null;

  const recommendation =
    decisionQuery.data?.patientMessage ??
    decisionQuery.data?.recommendation ??
    latestPathPayload?.recommendation ??
    triage.session?.recommendation ??
    triage.session?.recommendationText ??
    null;

  const hasTriage =
    Boolean(latestPath) ||
    triage.hasRouting ||
    apiRouteSteps.length > 0 ||
    Boolean(triage.sessionId && recommendation);

  const currentRouteAction = useMemo(() => {
    if (apiRouteSteps.length === 0) return null;
    const current = activeRouteQuery.data?.currentStep ?? 1;
    const step =
      apiRouteSteps.find((s, i) => routeStepNumber(s, i) === current) ??
      apiRouteSteps[Math.max(0, current - 1)];
    return (step?.action ?? step?.type ?? '').toLowerCase() || null;
  }, [apiRouteSteps, activeRouteQuery.data?.currentStep]);

  const consultationFormat = (
    decisionQuery.data?.consultationFormat ??
    ''
  ).toLowerCase();
  const isChatConsultation =
    consultationFormat.includes('chat') ||
    apiRouteSteps.some((step) =>
      (step.description ?? '').toLowerCase().includes('чат'),
    );

  const pathSteps = useMemo((): PathStep[] => {
    if (!hasTriage && apiRouteSteps.length === 0) {
      return [
        {
          title: '1. ИИ-триаж',
          description: 'Опишите симптомы - система подберёт маршрут',
          status: 'current',
        },
        {
          title: '2. Консультация врача',
          description: 'После триажа запишемся к нужному специалисту',
          status: 'upcoming',
        },
        {
          title: '3. Анализы',
          description: 'Ожидают назначения после приёма',
          status: 'upcoming',
        },
        {
          title: '4. Получение рецепта',
          description: 'Аптека-партнёр · после назначения врача',
          status: 'upcoming',
        },
      ];
    }

    const consultDone =
      consultCompleted ||
      apiRouteSteps.some((step) => {
        const action = (step.action ?? step.type ?? '').toLowerCase();
        const status = String(step.status ?? '').toLowerCase();
        return (
          action === 'consultation' && (status === 'done' || status === 'completed')
        );
      });

    const hasLabApiStep = apiRouteSteps.some((step) => {
      const action = (step.action ?? step.type ?? '').toLowerCase();
      return action === 'lab.order' || action === 'lab';
    });

    const labsPending =
      hasOpenLabOrders ||
      hasAnyLabOrders ||
      protocolLabs.length > 0 ||
      recommendedLabs.length > 0;

    const labsBeforeConsult =
      !consultDone &&
      (currentRouteAction === 'lab.order' ||
        (hasLabApiStep && (activeRouteQuery.data?.currentStep ?? 1) === 1));

    const rxDone = hasPrescription;

    const triageDesc = recommendation
      ? `Завершён · ${recommendation.split('\n')[0].slice(0, 90)}${recommendation.length > 90 ? '…' : ''}`
      : specialty
        ? `Завершён · рекомендован специалист: ${specialty}`
        : 'Завершён';

    const built: PathStep[] = [];
    const push = (title: string, description: string, status: PathStepStatus) => {
      built.push({
        title: `${built.length + 1}. ${title}`,
        description,
        status,
      });
    };

    push('ИИ-триаж', triageDesc, 'done');

    const routeCurrent = activeRouteQuery.data?.currentStep ?? 1;

    if (apiRouteSteps.length > 0) {
      for (const [index, step] of apiRouteSteps.entries()) {
        const action = (step.action ?? step.type ?? '').toLowerCase();
        const stepStatus = String(step.status ?? '').toLowerCase();
        const number = routeStepNumber(step, index);

        let status: PathStepStatus = 'upcoming';
        if (stepStatus === 'done' || stepStatus === 'completed') status = 'done';
        else if (action === 'consultation' && consultDone) status = 'done';
        else if (number < routeCurrent) status = 'done';
        else if (number === routeCurrent) status = 'current';

        let description = step.description ?? 'Этап маршрута';
        if ((action === 'lab.order' || action === 'lab') && hasOpenLabOrders) {
          description = `${description} · направление оформлено`;
        }
        if (action === 'consultation' && consultDone) {
          description = 'Консультация завершена';
        } else if (action === 'consultation' && openConsultation) {
          description = isChatConsultation
            ? 'Открыт чат с врачом'
            : description;
        }

        const title =
          action === 'consultation' && specialty
            ? `Консультация: ${specialty}`
            : routeStepTitle(step, index);

        push(title, description, status);
      }
    } else if (labsBeforeConsult) {
      push(
        'Анализы',
        hasOpenLabOrders
          ? 'Есть активные направления - откройте статусы'
          : `Рекомендовано: ${recommendedLabs.slice(0, 3).join(', ')}${
              recommendedLabs.length > 3 ? '…' : ''
            }`,
        'current',
      );
      push(
        specialty ? `Консультация: ${specialty}` : 'Консультация врача',
        'После анализов - запись к специалисту',
        'upcoming',
      );
    } else {
      push(
        specialty ? `Консультация: ${specialty}` : 'Консультация врача',
        consultDone
          ? 'Консультация завершена'
          : openConsultation
            ? isChatConsultation
              ? 'Открыт чат с врачом'
            : 'Консультация в процессе'
            : isChatConsultation
              ? 'Врач ответит в чате'
              : 'Запишитесь к врачу по рекомендации триажа',
        consultDone ? 'done' : 'current',
      );
    }

    const alreadyHasLabs = built.some((s) => /анализ/i.test(s.title));
    if (!alreadyHasLabs && (labsPending || consultDone)) {
      const labsDesc = hasOpenLabOrders || hasAnyLabOrders
        ? 'Направления на вкладке «Анализы и рецепты»'
        : protocolLabs.length > 0
          ? protocolLabs.slice(0, 3).join(', ') + (protocolLabs.length > 3 ? '…' : '')
          : recommendedLabs.length > 0
            ? `Рекомендовано: ${recommendedLabs.slice(0, 3).join(', ')}${
                recommendedLabs.length > 3 ? '…' : ''
              }`
            : consultDone
              ? 'Ожидают назначения после приёма'
              : 'Ожидают назначения после приёма';

      push(
        'Анализы',
        labsDesc,
        !consultDone
          ? labsBeforeConsult
            ? 'current'
            : 'upcoming'
          : labsPending && !rxDone
            ? 'current'
            : labsPending
              ? 'done'
              : 'upcoming',
      );
    }

    const alreadyHasRx = built.some((s) => /рецепт/i.test(s.title));
    if (!alreadyHasRx) {
      push(
        'Получение рецепта',
        rxDone
          ? 'Рецепт оформлен · аптека-партнёр'
          : 'Аптека-партнёр · после назначения врача',
        !consultDone ? 'upcoming' : rxDone ? 'done' : 'current',
      );
    }

    // Один «текущий» шаг - первый незавершённый.
    let sawCurrent = false;
    return built.map((step) => {
      if (step.status === 'done') return step;
      if (!sawCurrent) {
        sawCurrent = true;
        return { ...step, status: 'current' as const };
      }
      return { ...step, status: 'upcoming' as const };
    });
  }, [
    apiRouteSteps,
    activeRouteQuery.data?.currentStep,
    hasTriage,
    consultCompleted,
    hasPrescription,
    hasOpenLabOrders,
    hasAnyLabOrders,
    specialty,
    recommendation,
    recommendedLabs,
    protocolLabs,
    currentRouteAction,
    openConsultation,
    isChatConsultation,
  ]);

  const currentStepIndex = pathSteps.findIndex((s) => s.status === 'current');
  const activeStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;

  const cta = useMemo(() => {
    const currentTitle = pathSteps[currentStepIndex]?.title?.toLowerCase() ?? '';

    if (currentTitle.includes('анализ') || hasOpenLabOrders) {
      return {
        label: 'Следующий шаг: анализы и рецепты',
        action: () => navigate('/patient/labs'),
      };
    }
    if (currentTitle.includes('рецепт')) {
      return {
        label: 'Следующий шаг: анализы и рецепты',
        action: () => navigate('/patient/labs'),
      };
    }
    if (currentTitle.includes('консультац') || currentRouteAction === 'consultation') {
      if (openConsultation) {
        const id = getConsultationId(openConsultation);
        return {
          label: isChatConsultation
            ? 'Следующий шаг: открыть чат с врачом'
            : 'Следующий шаг: открыть консультацию',
          action: () => navigate(id ? `/patient/consultations/${id}` : '/patient/consultations'),
        };
      }
      if (consultCompleted) {
        return {
          label: 'Следующий шаг: анализы и рецепты',
          action: () => navigate('/patient/labs'),
        };
      }
      if (isChatConsultation) {
        return {
          label: 'Следующий шаг: мои консультации',
          action: () => navigate('/patient/consultations'),
        };
      }
      return {
        label: specialty
          ? `Следующий шаг: записаться к ${specialty}`
          : 'Следующий шаг: записаться к врачу',
        action: () => navigate('/patient/doctors'),
      };
    }
    if (!hasTriage) {
      return { label: 'Следующий шаг: начать ИИ-триаж', action: () => navigate('/patient/triage?new=1') };
    }
    if (!hasConsultation) {
      if (isChatConsultation) {
        return {
          label: 'Следующий шаг: мои консультации',
          action: () => navigate('/patient/consultations'),
        };
      }
      return {
        label: specialty
          ? `Следующий шаг: записаться к ${specialty}`
          : 'Следующий шаг: записаться к врачу',
        action: () => navigate('/patient/doctors'),
      };
    }
    if (recommendedLabs.length > 0 || protocolLabs.length > 0 || !hasPrescription) {
      return {
        label: 'Следующий шаг: анализы и рецепты',
        action: () => navigate('/patient/labs'),
      };
    }
    return {
      label: 'Следующий шаг: мои консультации',
      action: () => navigate('/patient/consultations'),
    };
  }, [
    pathSteps,
    currentStepIndex,
    currentRouteAction,
    hasOpenLabOrders,
    hasTriage,
    hasConsultation,
    hasPrescription,
    recommendedLabs.length,
    protocolLabs.length,
    specialty,
    navigate,
    openConsultation,
    consultCompleted,
    isChatConsultation,
  ]);

  const latestMoodEvent = useMemo(() => events.find(isMoodEvent) ?? null, [events]);
  const moodMarkedToday = useMemo(() => {
    const raw = latestMoodEvent?.occurredAt ?? latestMoodEvent?.createdAt;
    return isSameLocalDay(raw);
  }, [latestMoodEvent]);

  const resolvedMoodCode = useMemo(() => {
    if (moodCode) return moodCode;
    const payload = latestMoodEvent
      ? parseEventPayload<MoodPayload & TriagePayload>(latestMoodEvent)
      : null;
    return (
      moodOptionByCode(payload?.moodCode)?.code ??
      moodOptionByLabel(payload?.mood)?.code ??
      null
    );
  }, [moodCode, latestMoodEvent]);

  const activePrescription = useMemo(() => {
    const list = normalizePrescriptions(prescriptions.data);
    return (
      list.find((p) => {
        const status = normalizePrescriptionStatus(p.status);
        return status !== 'cancelled' && status !== 'dispensed';
      }) ?? list[0] ?? null
    );
  }, [prescriptions.data]);

  async function submitMood(option: MoodOption) {
    setMoodCode(option.code);
    setMoodFeedback(null);
    if (!patientId) return;
    setSavingMood(true);
    try {
      await medicalRecordsApi.appendEvent(patientId, {
        eventType: 'mood_check',
        sourceService: 'patient-portal',
        payloadJson: JSON.stringify({
          mood: option.label,
          moodCode: option.code,
          severity: option.severity,
          notifyDoctor: true,
          escalate: option.code === 'worse',
        }),
        occurredAt: new Date().toISOString(),
      });
      setMoodFeedback(
        option.code === 'worse'
          ? 'Отметка сохранена. Врач получит уведомление.'
          : 'Отметка сохранена.',
      );
      history.reload();
      if (option.code === 'worse') {
        // Soft prompt: keep user on page but surface triage CTA below.
      }
    } finally {
      setSavingMood(false);
    }
  }

  function startNewTriage() {
    triage.startNew();
    navigate('/patient/triage?new=1');
  }

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${patientName}`}
        description="Следующий шаг маршрута"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_302px]">
        <Card className="p-6">
          <h2 className="text-[20px] font-bold text-text">Ваш маршрут</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            {hasTriage || apiRouteSteps.length > 0
              ? `Ваш путь · шаг ${activeStepNumber} из ${pathSteps.length}`
              : 'Маршрут начнётся после ИИ-триажа'}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {pathSteps.map((step) => (
              <div
                key={`${step.title}-${step.description}`}
                className="flex items-start gap-4 rounded-[12px] border border-border px-4 py-5"
              >
                <StepDot status={step.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-text">{step.title}</p>
                  <p className="mt-1 text-[13px] text-text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {recommendedLabs.length > 0 && (
            <div className="mt-4 rounded-[12px] border border-border bg-surface-muted px-4 py-4">
              <p className="text-[13px] font-semibold text-text">Рекомендованные анализы</p>
              <ul className="mt-2 list-inside list-disc text-[13px] text-text-muted">
                {recommendedLabs.map((lab) => (
                  <li key={lab}>{lab}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" className="w-full justify-start sm:max-w-[400px]" onClick={cta.action}>
              {cta.label}
            </Button>
            {triage.sessionId && !triage.hasRouting && (
              <ButtonLink to="/patient/triage" variant="secondary" size="lg">
                Продолжить текущий
              </ButtonLink>
            )}
            {triage.hasRouting && (
              <ButtonLink to="/patient/triage/result" variant="secondary" size="lg">
                Результат текущего триажа
              </ButtonLink>
            )}
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <MoodCheckIn
            selectedCode={resolvedMoodCode}
            saving={savingMood}
            savedLabel={moodFeedback}
            onSelect={(option) => void submitMood(option)}
          />

          {resolvedMoodCode === 'worse' && (
            <div className="mt-4 rounded-[12px] border border-danger/30 bg-danger/5 px-3 py-3">
              <p className="text-[13px] text-text">
                Если стало хуже - пройдите короткий ИИ-триаж, чтобы обновить маршрут.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => navigate('/patient/triage')}
              >
                К ИИ-триажу
              </Button>
            </div>
          )}

          <h3 className="mt-8 text-[16px] font-semibold text-text">На сегодня</h3>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-text-muted">
            {activePrescription ? (
              <button
                type="button"
                onClick={() => setSelectedPrescription(activePrescription)}
                className="w-full rounded-md border border-border px-3 py-2 text-left text-[13px] text-text transition-colors hover:border-accent hover:bg-surface-muted"
              >
                <span className="font-semibold">
                  Рецепт
                  {getPrescriptionId(activePrescription)
                    ? ` №${getPrescriptionId(activePrescription).slice(0, 6)}`
                    : ''}
                </span>
                <span className="mt-1 block text-text-muted">
                  {activePrescription.validUntil
                    ? `до ${formatValidUntil(activePrescription.validUntil)}`
                    : getPrescriptionStatusLabel(activePrescription.status)}
                  {' · открыть'}
                </span>
              </button>
            ) : (
              <p className="text-center">Активных рецептов пока нет</p>
            )}
            {!moodMarkedToday && !moodFeedback ? (
              <p className="text-center">Напоминание: отметить самочувствие</p>
            ) : (
              <p className="text-center text-success">Самочувствие на сегодня отмечено</p>
            )}
          </div>

          <div className="mt-8 flex w-full flex-col gap-3">
            <Link
              to="/patient/house-call"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Вызов врача на дом
            </Link>
            <Link
              to="/patient/treatment"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Активное лечение
            </Link>
            <Link
              to="/patient/labs"
              className="rounded-md border border-border py-2.5 text-center text-[13px] font-semibold text-text transition-colors hover:border-accent"
            >
              Анализы и рецепты
            </Link>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setHistoryOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          aria-expanded={historyOpen}
        >
          <div>
            <h2 className="text-[20px] font-bold text-text">История</h2>
            <p className="mt-1 text-[13px] text-text-muted">
              {historyOpen
                ? 'Сначала самое свежее · триажи и маршруты раскрываются по клику'
                : events.length > 0
                  ? `${events.length} событий · нажмите, чтобы развернуть`
                  : 'Пока пусто · нажмите, чтобы развернуть'}
            </p>
          </div>
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-border text-[18px] text-text-muted transition-transform ${
              historyOpen ? 'rotate-180' : ''
            }`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {historyOpen && (
          <div className="border-t border-border px-6 pb-6 pt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              {latestPathPayload?.recommendation && (
                <p className="text-[12px] text-text-muted">
                  Текущий маршрут: {latestPathPayload.recommendedSpecialization ?? 'терапевт'}
                </p>
              )}
              <Button size="sm" variant="secondary" onClick={startNewTriage}>
                Начать новый ИИ-триаж
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              <AsyncState loading={history.loading} error={history.error} onRetry={history.reload}>
                {events.length === 0 ? (
                  <p className="rounded-md border border-border px-4 py-5 text-[13px] text-text-muted">
                    Пока нет событий - начните с ИИ-триажа или запишитесь к врачу.
                  </p>
                ) : (
                  events.map((event, i) => {
                    const id = String(event.id ?? event.eventId ?? i);
                    const payload = parseEventPayload<TriagePayload>(event);
                    const isPath = isTriagePathEvent(event);
                    const open = expandedId === id;
                    const steps = payload?.route ?? [];

                    return (
                      <div key={id} className="rounded-md border border-border">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : id)}
                          className="flex w-full items-center gap-4 px-4 py-5 text-left transition-colors hover:bg-surface-muted"
                        >
                          <span
                            className={`h-6 w-6 flex-shrink-0 rounded-full ${
                              isPath ? 'bg-accent' : 'bg-primary'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold text-text">{formatEventTitle(event)}</p>
                            <p className="mt-1 text-[13px] text-text-muted">{formatEventDate(event)}</p>
                          </div>
                          {isPath && (
                            <span className="text-[12px] font-semibold text-text-muted">
                              {open ? 'Свернуть' : 'Маршрут'}
                            </span>
                          )}
                        </button>

                        {open && isPath && (
                          <div className="border-t border-border bg-surface-muted px-4 py-4">
                            {urgencyLabel(payload?.urgencyLevel) && (
                              <p className="text-[13px] text-text-muted">
                                Срочность:{' '}
                                <span className="font-semibold text-warning">
                                  {urgencyLabel(payload?.urgencyLevel)}
                                </span>
                              </p>
                            )}
                            {payload?.recommendation && (
                              <p className="mt-2 whitespace-pre-line text-[14px] text-text">
                                {payload.recommendation}
                              </p>
                            )}
                            {steps.length > 0 && (
                              <ol className="mt-4 flex flex-col gap-2">
                                {steps.map((step, stepIndex) => (
                                  <li key={step} className="flex items-center gap-3 text-[14px] text-text">
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
                                      {stepIndex + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <ButtonLink to="/patient/triage/result" size="sm" variant="secondary">
                                Открыть результат
                              </ButtonLink>
                              <ButtonLink to="/patient/doctors" size="sm">
                                К врачам
                              </ButtonLink>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </AsyncState>
            </div>
          </div>
        )}
      </Card>

      {selectedPrescription && (
        <PrescriptionDetailModal
          prescription={selectedPrescription}
          variant="patient"
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </div>
  );
}
