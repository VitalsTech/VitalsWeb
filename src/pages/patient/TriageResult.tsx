import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useTriageSession } from './useTriageSession';
import { normalizeTriageSession } from '@/api/triage';

const URGENCY_LABELS: Record<string, string> = {
  emergency: 'Срочно',
  urgent: 'Скоро',
  routine: 'Плановая',
};

export function TriageResult() {
  const { patientId } = useAuth();
  const { session, loading, error, refresh, sessionId, complete, sending } = useTriageSession(patientId);

  const normalized = normalizeTriageSession(session);
  const urgencyKey = (normalized?.urgency ?? '').toLowerCase();
  const urgencyLabel = URGENCY_LABELS[urgencyKey] ?? normalized?.urgency ?? 'Оценивается';
  const recommendation = normalized?.recommendation ?? normalized?.recommendationText;

  return (
    <div>
      <PageHeader
        title="Результат триажа"
        description="Система оценила ситуацию и сформировала маршрут"
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
              <div className="flex flex-col gap-6">
                <Card className="p-6">
                  <p className="text-[13px] font-semibold text-text-muted">
                    Срочность: <span className="text-warning">{urgencyLabel}</span>
                  </p>
                  <p className="mt-2 text-[13px] text-text-muted">
                    {normalized?.urgencyLevel != null
                      ? `Уровень срочности: ${normalized.urgencyLevel}`
                      : 'Итоговая оценка появится после нескольких сообщений в чате.'}
                  </p>
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
                    Рекомендация ещё формируется — продолжите диалог в ИИ-триаже.
                  </p>
                )}
                {normalized?.recommendedSpecialization && (
                  <p className="mt-5 text-[13px] text-text-muted">
                    Рекомендованная специализация: {normalized.recommendedSpecialization}
                  </p>
                )}
              </Card>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <ButtonLink to="/patient/doctors" size="lg">
                Начать маршрут — записаться к врачу
              </ButtonLink>
              <ButtonLink to="/patient" variant="secondary" size="lg">
                На «Мой путь»
              </ButtonLink>
              {!recommendation && sessionId && (
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={sending}
                  onClick={() => void complete().then(() => refresh())}
                >
                  {sending ? 'Завершение…' : 'Завершить триаж (mock)'}
                </Button>
              )}
              <Button variant="secondary" size="lg" onClick={refresh}>
                Обновить статус
              </Button>
            </div>
          </>
        )}
      </AsyncState>
    </div>
  );
}
