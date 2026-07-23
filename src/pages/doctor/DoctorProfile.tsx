import { useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Textarea } from '@/components/ui/Input';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/auth/AuthProvider';
import { useAsyncData } from '@/lib/useAsyncData';
import { usersApi, findDoctorProfile } from '@/api/users';
import { authApi } from '@/api/auth';

export function DoctorProfile() {
  const { user, publicId, doctorName } = useAuth();

  const { data: profiles, loading, error, reload } = useAsyncData(
    () => (publicId ? usersApi.getProfiles(publicId) : Promise.resolve(null)),
    [publicId],
  );

  const doctorProfile = findDoctorProfile(profiles ?? []) as
    | {
        specialization?: string;
        licenseNumber?: string;
        clinicName?: string;
        data?: {
          specialization?: string;
          certificateNumber?: string;
          biography?: string;
          rating?: number;
        };
        [key: string]: unknown;
      }
    | undefined;

  const profileData = doctorProfile?.data ?? {};

  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinic, setClinic] = useState('');
  const [hours, setHours] = useState('Пн–Пт 9:00–18:00, суббота по записи.');
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordDone, setPasswordDone] = useState(false);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setPasswordError(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordDone(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Не удалось изменить пароль.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveNote(
      'Изменение профессиональных данных не поддерживается текущим контрактом API (нет эндпоинта обновления профиля врача).',
    );
  }

  return (
    <div>
      <PageHeader
        title="Профиль врача"
        description="Профессиональные данные и привязка к организациям"
      />

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-[16px] font-semibold text-text">Основное</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <FieldLabel>ФИО</FieldLabel>
                  <Input value={doctorName} disabled />
                </div>
                <div>
                  <FieldLabel>Специальность</FieldLabel>
                  <Input
                    value={
                      specialization ||
                      (doctorProfile?.specialization as string) ||
                      (profileData.specialization as string) ||
                      ''
                    }
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="Врач-терапевт участковый"
                  />
                </div>
                <div>
                  <FieldLabel>Сертификат специалиста</FieldLabel>
                  <Input
                    value={
                      licenseNumber ||
                      (doctorProfile?.licenseNumber as string) ||
                      (profileData.certificateNumber as string) ||
                      ''
                    }
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="№778291 / до 2030"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-[16px] font-semibold text-text">Клиники Vitals</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <FieldLabel>Клиника</FieldLabel>
                  <Input
                    value={clinic || (doctorProfile?.clinicName as string) || ''}
                    onChange={(e) => setClinic(e.target.value)}
                    placeholder="ГК №4, ул. Свободы"
                  />
                </div>
                {(profileData.biography as string | undefined) && (
                  <div>
                    <FieldLabel>О враче</FieldLabel>
                    <p className="text-[14px] text-text-muted">{profileData.biography as string}</p>
                  </div>
                )}
                <div>
                  <FieldLabel>Рабочее время по умолчанию</FieldLabel>
                  <Textarea value={hours} onChange={(e) => setHours(e.target.value)} rows={3} />
                </div>
                <Button type="submit" className="w-fit">
                  Сохранить
                </Button>
                {saveNote && <p className="text-[12px] text-text-muted">{saveNote}</p>}
              </div>
            </Card>
          </div>
        </form>

        <Card className="mt-6 max-w-[500px] p-6">
          <h3 className="mb-4 text-[16px] font-semibold text-text">Смена пароля</h3>
          <p className="mb-4 text-[13px] text-text-muted">
            Телефон: {user?.phoneNumber ?? '—'} · Email: {user?.email ?? '—'}
          </p>
          <form onSubmit={(e) => void handlePasswordSubmit(e)} className="flex flex-col gap-4">
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
            {passwordError && <p className="text-[13px] text-danger">{passwordError}</p>}
            {passwordDone && <p className="text-[13px] text-success">Пароль изменён ✓</p>}
            <Button type="submit" disabled={submitting} className="w-fit">
              {submitting ? 'Сохранение…' : 'Изменить пароль'}
            </Button>
          </form>
        </Card>
      </AsyncState>
    </div>
  );
}
