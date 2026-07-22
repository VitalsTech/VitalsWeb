import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAsyncData } from '@/lib/useAsyncData';
import { doctorsApi, normalizeDoctorList, getDoctorId, formatDoctorName, formatDoctorSpecialty } from '@/api/doctors';

export function Doctors() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data, loading, error, reload } = useAsyncData(
    () => doctorsApi.list({ query: query || undefined, page: 0, pageSize: 30 }),
    [query],
  );

  const doctors = normalizeDoctorList(data);
  const recommended = doctors.slice(0, 2);

  return (
    <div>
      <PageHeader
        title="Врачи"
        description="Поиск по специальности и фамилии, рекомендации платформы."
      />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Фамилия, специальность…"
        className="max-w-[500px]"
      />

      <div className="mt-6">
        <AsyncState loading={loading} error={error} onRetry={reload}>
          {doctors.length === 0 ? (
            <Card className="p-6">
              <p className="text-[14px] text-text-muted">Врачи не найдены.</p>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h3 className="text-[16px] font-semibold text-text">Рекомендации Vitals</h3>
                <p className="mt-2 text-[14px] text-text-muted">
                  На основе последнего триажа и специализации врачей.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {recommended.map((doc) => (
                    <button
                      key={getDoctorId(doc)}
                      type="button"
                      onClick={() => navigate(`/patient/doctors/${getDoctorId(doc)}`)}
                      className="rounded-md border border-border bg-surface p-4 text-left transition-colors hover:border-accent"
                    >
                      <p className="text-[14px] font-semibold text-text">{formatDoctorName(doc)}</p>
                      <p className="mt-1 text-[13px] text-text-muted">{formatDoctorSpecialty(doc)}</p>
                      {doc.tag && <p className="mt-2 text-[12px] text-text-muted">{doc.tag}</p>}
                    </button>
                  ))}
                </div>
              </Card>

              <h3 className="mt-8 text-[16px] font-semibold text-text">Все взаимодействия</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doc) => (
                  <Card key={getDoctorId(doc)} className="p-5">
                    <p className="text-[15px] font-semibold text-text">{formatDoctorName(doc)}</p>
                    <p className="mt-1 text-[14px] text-text-muted">{formatDoctorSpecialty(doc)}</p>
                    <Button
                      size="md"
                      fullWidth
                      className="mt-5"
                      onClick={() => navigate(`/patient/doctors/${getDoctorId(doc)}`)}
                    >
                      Открыть профиль
                    </Button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </AsyncState>
      </div>
    </div>
  );
}
