import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select } from '@/components/ui/Input';
import { useAuth } from '@/auth/AuthProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

type Tab = 'login' | 'register';

export function Auth() {
  const [tab, setTab] = useState<Tab>('login');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [surename, setSurename] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('female');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await login({ phoneNumber, password });
        navigate('/patient');
      } else {
        await register({ phoneNumber, password, firstName, secondName, surename, birthDate, sex });
        navigate('/patient/profile');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Что-то пошло не так, попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-16">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[800px]">
        <div className="mb-8 text-center">
          <p className="text-[36px] font-bold text-primary">Vitals</p>
          <p className="mt-2 text-[16px] text-text-muted">Вход для пациента</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-10">
          <div className="mb-7 grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`h-12 text-[15px] font-semibold transition-colors ${
                tab === 'login' ? 'bg-primary text-primary-foreground' : 'bg-surface text-text'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`h-12 text-[15px] font-semibold transition-colors ${
                tab === 'register' ? 'bg-primary text-primary-foreground' : 'bg-surface text-text'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {tab === 'register' && (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <FieldLabel>Фамилия</FieldLabel>
                    <Input
                      value={surename}
                      onChange={(e) => setSurename(e.target.value)}
                      placeholder="Иванова"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>Имя</FieldLabel>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Анна"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>Отчество</FieldLabel>
                    <Input
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      placeholder="Сергеевна"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Дата рождения</FieldLabel>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>Пол</FieldLabel>
                    <Select value={sex} onChange={(e) => setSex(e.target.value)}>
                      <option value="female">Женский</option>
                      <option value="male">Мужской</option>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <div>
              <FieldLabel>Номер телефона</FieldLabel>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+7 900 000-00-00"
                required
              />
            </div>
            <div>
              <FieldLabel>Пароль</FieldLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {formError && <p className="text-[13px] text-danger">{formError}</p>}

            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting ? 'Подождите…' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>

          <p className="mt-6 text-[12px] text-text-muted">
            Данные передаются напрямую в API Vitals (Auth Gateway) — бэкенд обязателен для работы
            интерфейса.
          </p>
        </div>
      </div>
    </div>
  );
}
