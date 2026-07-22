import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import { useAuth } from '@/auth/AuthProvider';
import { authApi } from '@/api/auth';

export function ProfileEdit() {
  const { user, patientName } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить пароль.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Редактирование профиля"
        description="Личные данные заполняются при регистрации. Смена пароля доступна ниже."
        backTo="/patient/profile"
        backLabel="К профилю"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="max-w-[500px] p-8">
          <h3 className="text-[16px] font-semibold text-text">Личные данные</h3>
          <div className="mt-4 flex flex-col gap-4 text-[14px] text-text">
            <p>ФИО: {patientName}</p>
            <p>Телефон: {user?.phoneNumber ?? '—'}</p>
            <p>Email: {user?.email ?? '—'}</p>
          </div>
          <p className="mt-5 text-[12px] text-text-muted">
            Изменение ФИО, даты рождения и телефона пока не поддерживается API — обратитесь в
            поддержку, если данные указаны неверно.
          </p>
        </Card>

        <Card className="max-w-[500px] p-8">
          <h3 className="text-[16px] font-semibold text-text">Смена пароля</h3>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
            <div>
              <FieldLabel>Текущий пароль</FieldLabel>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel>Новый пароль</FieldLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-[13px] text-danger">{error}</p>}
            {done && <p className="text-[13px] text-success">Пароль изменён ✓</p>}

            <div className="mt-2 flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/patient/profile')}>
                Назад
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
