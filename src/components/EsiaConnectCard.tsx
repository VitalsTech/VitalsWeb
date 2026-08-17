import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import { useAuth } from '@/auth/AuthProvider';
import {
  applyEsiaSession,
  esiaApi,
  isEsiaStubEnabled,
  mapEsiaError,
  parseEsiaAuthResult,
  type EsiaConfig,
} from '@/api/esia';

export function EsiaConnectCard() {
  const { refreshProfile } = useAuth();
  const configQuery = useAsyncData(
    () => esiaApi.getConfig().catch((): EsiaConfig => ({ enabled: false })),
    [],
  );
  const statusQuery = useAsyncData(() => esiaApi.getStatus(), []);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const stub = isEsiaStubEnabled(configQuery.data);
  if (!configQuery.loading && !stub) {
    return null;
  }

  const linked = statusQuery.data?.linked === true;
  const linkedAt = statusQuery.data?.linkedAt
    ? new Date(statusQuery.data.linkedAt).toLocaleString('ru-RU')
    : null;

  async function connect() {
    setActionError(null);
    setBusy(true);
    try {
      const data = await esiaApi.stubLink();
      const result = parseEsiaAuthResult(data);
      applyEsiaSession(result);
      await refreshProfile();
      statusQuery.reload();
    } catch (error) {
      setActionError(mapEsiaError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-[16px] font-semibold text-text">Госуслуги</h3>
      <AsyncState
        loading={configQuery.loading || statusQuery.loading}
        error={statusQuery.error}
        onRetry={statusQuery.reload}
      >
        {linked ? (
          <div className="mt-4 text-[14px] text-text">
            <p>Госуслуги подключены</p>
            {linkedAt && <p className="mt-1 text-[13px] text-text-muted">С {linkedAt}</p>}
            {statusQuery.data?.snilsMasked && (
              <p className="mt-1 text-[13px] text-text-muted">СНИЛС: {statusQuery.data.snilsMasked}</p>
            )}
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-fit"
            disabled={busy || configQuery.data?.configured === false}
            onClick={() => void connect()}
          >
            {busy ? 'Подключаем Госуслуги…' : 'Подключить Госуслуги'}
          </Button>
        )}
        {actionError && <p className="mt-3 text-[13px] text-danger">{actionError}</p>}
      </AsyncState>
    </Card>
  );
}
