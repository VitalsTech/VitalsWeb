import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { doctors } from '@/mock/data';

export function Doctors() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = doctors.filter((d) =>
    `${d.name} ${d.specialty}`.toLowerCase().includes(query.toLowerCase()),
  );

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

      <Card className="mt-6 p-6">
        <h3 className="text-[16px] font-semibold text-text">Рекомендации Vitals</h3>
        <p className="mt-2 text-[14px] text-text-muted">
          На основе последнего триажа: кардиология и профилактический осмотр в течение недели.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recommended.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => navigate(`/patient/doctors/${doc.id}`)}
              className="rounded-md border border-border bg-surface p-4 text-left transition-colors hover:border-accent"
            >
              <p className="text-[14px] font-semibold text-text">{doc.name}</p>
              <p className="mt-1 text-[13px] text-text-muted">{doc.specialty}</p>
              <p className="mt-2 text-[12px] text-text-muted">{doc.tag}</p>
            </button>
          ))}
        </div>
      </Card>

      <h3 className="mt-8 text-[16px] font-semibold text-text">Все взаимодействия</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => (
          <Card key={doc.id} className="p-5">
            <p className="text-[15px] font-semibold text-text">{doc.name}</p>
            <p className="mt-1 text-[14px] text-text-muted">{doc.specialty}</p>
            <Button
              size="md"
              fullWidth
              className="mt-5"
              onClick={() => navigate(`/patient/doctors/${doc.id}`)}
            >
              Открыть профиль
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
