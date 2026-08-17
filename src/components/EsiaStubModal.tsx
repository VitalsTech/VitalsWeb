import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input } from '@/components/ui/Input';
import {
  ESIA_EXISTING_ACCOUNT_MESSAGE,
  applyEsiaSession,
  esiaApi,
  mapEsiaError,
  parseEsiaAuthResult,
  type EsiaAuthResult,
} from '@/api/esia';

function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits.length > 0 && !digits.startsWith('7')) digits = `7${digits}`;
  return digits.slice(0, 11);
}

function formatPhone(digits: string): string {
  if (!digits) return '+7 ';
  const limited = digits.slice(0, 11);
  if (limited.length === 1) return `+${limited}`;
  if (limited.length <= 4) return `+${limited.slice(0, 1)} ${limited.slice(1)}`;
  if (limited.length <= 7) return `+${limited.slice(0, 1)} ${limited.slice(1, 4)} ${limited.slice(4)}`;
  if (limited.length <= 9) {
    return `+${limited.slice(0, 1)} ${limited.slice(1, 4)} ${limited.slice(4, 7)}-${limited.slice(7)}`;
  }
  return `+${limited.slice(0, 1)} ${limited.slice(1, 4)} ${limited.slice(4, 7)}-${limited.slice(7, 9)}-${limited.slice(9, 11)}`;
}

export function EsiaStubModal({
  onClose,
  onFinished,
}: {
  onClose: () => void;
  onFinished: (result: EsiaAuthResult) => void;
}) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<EsiaAuthResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!lastName.trim()) nextErrors.lastName = 'Укажите фамилию';
    if (!firstName.trim()) nextErrors.firstName = 'Укажите имя';
    if (!email.trim() || !email.includes('@')) nextErrors.email = 'Укажите корректную почту';
    if (phoneDigits.length < 11) nextErrors.phoneNumber = 'Укажите телефон';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const data = await esiaApi.stubRegister({
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        email: email.trim(),
        phoneNumber: phoneDigits,
      });
      const result = parseEsiaAuthResult(data);
      applyEsiaSession(result, 'patient');
      setDone(result);
    } catch (err) {
      const message = mapEsiaError(err);
      setError(message);
      const lower = message.toLowerCase();
      const highlight: Record<string, string> = {};
      if (lower.includes('фамили') || lower.includes('имя')) {
        highlight.lastName = message;
        highlight.firstName = message;
      }
      if (lower.includes('почт') || lower.includes('email')) highlight.email = message;
      if (lower.includes('телефон')) highlight.phoneNumber = message;
      setFieldErrors(highlight);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const existing = done.esia.existingAccount === true;
    const password = done.esia.devPassword?.trim() || null;
    return (
      <Modal onClose={() => onFinished(done)} widthClassName="max-w-[480px]">
        <h2 className="text-[18px] font-semibold text-text">Госуслуги</h2>
        <p className="mt-3 text-[14px] text-text">
          {existing ? ESIA_EXISTING_ACCOUNT_MESSAGE : 'Аккаунт создан через Госуслуги.'}
        </p>
        {!existing && password && (
          <div className="mt-4 rounded-md border border-border bg-surface-muted px-3 py-3">
            <p className="text-[13px] text-text-muted">Пароль для входа по телефону</p>
            <p className="mt-1 font-mono text-[15px] text-text">{password}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => {
                void navigator.clipboard.writeText(password).then(() => setCopied(true));
              }}
            >
              {copied ? 'Скопировано' : 'Скопировать'}
            </Button>
          </div>
        )}
        <Button type="button" className="mt-5 w-full" onClick={() => onFinished(done)}>
          Продолжить
        </Button>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} widthClassName="max-w-[480px]">
      <h2 className="text-[18px] font-semibold text-text">Войти через Госуслуги</h2>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 flex flex-col gap-4">
        <div>
          <FieldLabel>Фамилия</FieldLabel>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          {fieldErrors.lastName && <p className="mt-1 text-[12px] text-danger">{fieldErrors.lastName}</p>}
        </div>
        <div>
          <FieldLabel>Имя</FieldLabel>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          {fieldErrors.firstName && <p className="mt-1 text-[12px] text-danger">{fieldErrors.firstName}</p>}
        </div>
        <div>
          <FieldLabel>Отчество</FieldLabel>
          <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Почта</FieldLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {fieldErrors.email && <p className="mt-1 text-[12px] text-danger">{fieldErrors.email}</p>}
        </div>
        <div>
          <FieldLabel>Телефон</FieldLabel>
          <Input
            type="tel"
            value={formatPhone(phoneDigits)}
            onChange={(e) => setPhoneDigits(normalizePhoneDigits(e.target.value))}
            placeholder="+7 900 000-00-00"
            required
          />
          {fieldErrors.phoneNumber && (
            <p className="mt-1 text-[12px] text-danger">{fieldErrors.phoneNumber}</p>
          )}
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? 'Входим…' : 'Продолжить'}
        </Button>
      </form>
    </Modal>
  );
}
