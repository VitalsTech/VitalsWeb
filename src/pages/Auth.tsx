import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/auth/AuthProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Role } from '@/api/tokenStore';

type Tab = 'login' | 'register';

export function Auth() {
  const [role, setRole] = useState<Role>('patient');
  const [tab, setTab] = useState<Tab>('login');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Храним только цифры (без плюса) для отправки на бэк
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Добавляем состояние для видимости пароля
  const [surename, setSurename] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('Female');
  /** Routing ищет врача по алиасам therapist / терапевт — каноническое значение для MVP. */
  const [specialization, setSpecialization] = useState('therapist');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [biography, setBiography] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Vitals';
  }, []);

  // Функция форматирования для отображения
  const formatDisplayPhone = (digits: string): string => {
    if (!digits) return '+7 ';
    
    // Если номер начинается с 7 или 8, используем его
    let number = digits;
    if (number.startsWith('8')) {
      number = '7' + number.slice(1);
    } else if (!number.startsWith('7') && number.length > 0) {
      // Если не начинается с 7, добавляем 7 (для России)
      number = '7' + number;
    }
    
    // Ограничиваем до 11 цифр (код страны + 10 цифр)
    const limited = number.slice(0, 11);
    
    // Форматируем: +7 (XXX) XXX-XX-XX
    if (limited.length === 0) return '+7 ';
    if (limited.length === 1) return `+${limited}`;
    if (limited.length <= 4) return `+${limited.slice(0, 1)} ${limited.slice(1)}`;
    if (limited.length <= 7) return `+${limited.slice(0, 1)} ${limited.slice(1, 4)} ${limited.slice(4)}`;
    if (limited.length <= 9) return `+${limited.slice(0, 1)} ${limited.slice(1, 4)} ${limited.slice(4, 7)}-${limited.slice(7)}`;
    return `+${limited.slice(0, 1)} ${limited.slice(1, 4)} ${limited.slice(4, 7)}-${limited.slice(7, 9)}-${limited.slice(9, 11)}`;
  };

  // Функция для получения отображаемого значения
  const getDisplayValue = (digits: string): string => {
    return formatDisplayPhone(digits);
  };

  // Обработчик изменения номера телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Удаляем все НЕ цифры
    let digits = raw.replace(/\D/g, '');
    
    // Если пользователь ввел номер с 8, меняем на 7 (для России)
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    
    // Ограничиваем длину до 11 цифр
    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }
    
    setPhoneNumber(digits);
  };

  // Обработчик нажатия клавиш для удаления всего текста
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Если нажали Backspace и поле пустое, ничего не делаем
    if (e.key === 'Backspace' && phoneNumber === '') {
      e.preventDefault();
    }
  };

  // Переключение видимости пароля
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (tab === 'login') {
        // Отправляем только цифры без плюса
        await login({ phoneNumber, password }, role);
        navigate(role === 'doctor' ? '/doctor' : '/patient');
      } else {
        await register(
          {
            phoneNumber, // Здесь уже чистые цифры без плюса
            password,
            firstName,
            secondName,
            surename,
            birthDate,
            sex,
            ...(role === 'doctor'
              ? {
                  specialization: specialization.trim() || 'therapist',
                  licenseNumber,
                  biography,
                }
              : {}),
          },
          role,
        );
        navigate(role === 'doctor' ? '/doctor/profile' : '/patient/profile');
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
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="onLight" layout="stacked" className="justify-center" />
          <p className="mt-3 text-[16px] text-text-muted">
            {role === 'doctor' ? 'Вход для врача' : 'Вход для пациента'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 sm:p-10">
          <div className="mb-5 grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`h-11 text-[14px] font-semibold transition-colors ${
                role === 'patient' ? 'bg-accent text-[#11442f]' : 'bg-surface text-text-muted'
              }`}
            >
              Я пациент
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`h-11 text-[14px] font-semibold transition-colors ${
                role === 'doctor' ? 'bg-accent text-[#11442f]' : 'bg-surface text-text-muted'
              }`}
            >
              Я врач
            </button>
          </div>

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
                      <option value="Female">Женский</option>
                      <option value="Male">Мужской</option>
                    </Select>
                  </div>
                </div>
                {role === 'doctor' && (
                  <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Специальность</FieldLabel>
                        <Select
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          required
                        >
                          <option value="therapist">therapist (терапевт)</option>
                          <option value="терапевт">терапевт</option>
                          <option value="cardiologist">cardiologist</option>
                          <option value="neurologist">neurologist</option>
                          <option value="pediatrician">pediatrician</option>
                        </Select>
                        <p className="mt-1 text-[12px] text-text-muted">
                          Для демо routing: therapist / терапевт — иначе assignedDoctorId может быть
                          пустым.
                        </p>
                      </div>
                      <div>
                        <FieldLabel>Сертификат специалиста</FieldLabel>
                        <Input
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="№778291 / до 2030"
                        />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>О себе (необязательно)</FieldLabel>
                      <Textarea
                        value={biography}
                        onChange={(e) => setBiography(e.target.value)}
                        rows={3}
                        placeholder="Кратко о вашем опыте и специализации…"
                      />
                    </div>
                  </>
                )}
              </>
            )}
            <div>
              <FieldLabel>Номер телефона</FieldLabel>
              <Input
                type="tel"
                value={getDisplayValue(phoneNumber)}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                placeholder="+7 900 000-00-00"
                required
              />
            </div>
            <div>
              <FieldLabel>Пароль</FieldLabel>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10" // Добавляем отступ справа для кнопки
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? (
                    // Иконка "глаз закрыт" (пароль виден)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    // Иконка "глаз открыт" (пароль скрыт)
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
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