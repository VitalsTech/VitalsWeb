import { apiRequest } from './http';

export interface RouteStepDto {
  stepNumber?: number;
  /** Например `lab.order`, `consultation` */
  action?: string;
  status?: string;
  description?: string;
  /** legacy / fallback */
  title?: string;
  type?: string;
  order?: number;
  [key: string]: unknown;
}

export interface RoutingDecisionDto {
  decisionId?: string;
  id?: string;
  patientId?: string;
  triageSessionId?: string;
  outcomeType?: string;
  specialist?: string;
  consultationFormat?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  priority?: number;
  urgencyLevel?: number;
  recommendedLabs?: string[];
  patientMessage?: string;
  rationale?: string;
  algorithmVersion?: string;
  isFallback?: boolean;
  /** legacy aliases */
  recommendedSpecialization?: string;
  recommendation?: string;
  steps?: RouteStepDto[];
  [key: string]: unknown;
}

export interface ActiveRouteDto {
  routeId?: string;
  patientId?: string;
  status?: string;
  /** 1-based индекс текущего шага */
  currentStep?: number;
  totalSteps?: number;
  steps?: RouteStepDto[];
  /** если шлюз начнёт отдавать — подтянем decision */
  currentDecisionId?: string;
  decisionId?: string;
  recommendedLabs?: string[];
  [key: string]: unknown;
}

const ACTION_TITLES: Record<string, string> = {
  'lab.order': 'Анализы',
  consultation: 'Консультация врача',
  'house.call': 'Вызов на дом',
  emergency: 'Экстренная помощь',
};

export const routingApi = {
  getDecision(decisionId: string) {
    return apiRequest<RoutingDecisionDto>(`/api/v1/routing/decisions/${decisionId}`);
  },

  getActiveRoute(patientId: string) {
    return apiRequest<ActiveRouteDto>(`/api/v1/routing/patients/${patientId}/active-route`);
  },
};

export function getDecisionId(decision: RoutingDecisionDto | null | undefined): string | undefined {
  return decision?.decisionId ?? decision?.id;
}

export function getRouteDecisionId(route: ActiveRouteDto | null | undefined): string | undefined {
  return route?.currentDecisionId ?? route?.decisionId;
}

export function normalizeRouteSteps(
  route: ActiveRouteDto | RoutingDecisionDto | null | undefined,
): RouteStepDto[] {
  if (!route?.steps?.length) return [];
  return [...route.steps].sort(
    (a, b) => (a.stepNumber ?? a.order ?? 0) - (b.stepNumber ?? b.order ?? 0),
  );
}

export function routeStepTitle(step: RouteStepDto, index = 0): string {
  if (step.title?.trim()) return step.title.trim();
  const action = (step.action ?? step.type ?? '').toLowerCase();
  if (ACTION_TITLES[action]) return ACTION_TITLES[action];
  return `Шаг ${step.stepNumber ?? index + 1}`;
}

export function routeStepNumber(step: RouteStepDto, index: number): number {
  return step.stepNumber ?? step.order ?? index + 1;
}

/** Backend часто пишет анализы только в description шага `lab.order`. */
export function labsFromRouteSteps(steps: RouteStepDto[]): string[] {
  for (const step of steps) {
    const action = (step.action ?? step.type ?? '').toLowerCase();
    if (action !== 'lab.order' && action !== 'lab') continue;
    const description = step.description ?? '';
    const match = description.match(/анализы:\s*(.+)$/i);
    if (match) {
      return match[1]
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function getDecisionLabs(decision: RoutingDecisionDto | null | undefined): string[] {
  if (!decision?.recommendedLabs?.length) return [];
  return decision.recommendedLabs.filter(Boolean);
}

export function getDecisionSpecialty(decision: RoutingDecisionDto | null | undefined): string | null {
  return decision?.specialist ?? decision?.recommendedSpecialization ?? null;
}
