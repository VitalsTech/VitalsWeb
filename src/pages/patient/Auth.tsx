import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import { useAuth } from '@/auth/AuthProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

type Tab = 'login' | 'register';

export function Auth() {
  const [tab, setTab] = useState<Tab>('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login();
    navigate(tab === 'login' ? '/patient' : '/patient/profile');
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
                tab === 'login'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-text'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`h-12 text-[15px] font-semibold transition-colors ${
                tab === 'register'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-text'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {tab === 'register' && (
              <div>
                <FieldLabel>ФИО</FieldLabel>
                <Input defaultValue="" placeholder="Иванова Анна Сергеевна" required />
              </div>
            )}
            <div>
              <FieldLabel>Номер телефона</FieldLabel>
              <Input
                type="tel"
                defaultValue={tab === 'login' ? '+7 900 000-00-00' : ''}
                placeholder="+7 900 000-00-00"
                required
              />
            </div>
            <div>
              <FieldLabel>Пароль</FieldLabel>
              <Input type="password" placeholder="••••••••" required />
            </div>

            <Button type="submit" size="lg" fullWidth>
              {tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            <Button type="button" variant="secondary" size="md" fullWidth onClick={handleSubmit}>
              Войти через ЕСИА (Госуслуги)
            </Button>
          </form>

          <p className="mt-6 text-[12px] text-text-muted">
            Демо-интерфейс без бэкенда. Кнопки ведут в мок-приложение.
          </p>
        </div>
      </div>
    </div>
  );
}
