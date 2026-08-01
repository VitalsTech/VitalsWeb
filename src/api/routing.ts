import { apiRequest } from './http';

export interface RouteStepDto {
  title?: string;
  description?: string;
  status?: string;
  type?: string;
  order?: number;
  [key: string]: unknown;
}

export interface RoutingDecisionDto {
  id?: string;
  patientId?: string;
  urgencyLevel?: number;
  recommendedSpecialization?: string;
  recommendation?: string;
  recommendedLabs?: string[];
  steps?: RouteStepDto[];
  [key: string]: unknown;
}

export interface ActiveRouteDto {
  patientId?: string;
  decisionId?: string;
  status?: string;
  currentStepIndex?: number;
  steps?: RouteStepDto[];
  recommendedLabs?: string[];
  [key: string]: unknown;
}

export const routingApi = {
  getDecision(decisionId: string) {
    return apiRequest<RoutingDecisionDto>(`/api/v1/routing/decisions/${decisionId}`);
  },

  getActiveRoute(patientId: string) {
    return apiRequest<ActiveRouteDto>(`/api/v1/routing/patients/${patientId}/active-route`);
  },
};

export function normalizeRouteSteps(route: ActiveRouteDto | RoutingDecisionDto | null | undefined): RouteStepDto[] {
  if (!route?.steps?.length) return [];
  return [...route.steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
