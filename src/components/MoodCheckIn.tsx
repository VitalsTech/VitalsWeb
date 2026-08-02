import { cn } from '@/lib/cn';

export type MoodCode = 'better' | 'same' | 'worse';

export type MoodOption = {
  code: MoodCode;
  label: string;
  hint: string;
  severity: 1 | 2 | 3;
};

export const MOOD_OPTIONS: MoodOption[] = [
  {
    code: 'better',
    label: 'Стало лучше',
    hint: 'Самочувствие улучшилось',
    severity: 1,
  },
  {
    code: 'same',
    label: 'Без изменений',
    hint: 'Как вчера, стабильно',
    severity: 2,
  },
  {
    code: 'worse',
    label: 'Стало хуже',
    hint: 'Врач получит сигнал',
    severity: 3,
  },
];

/** Old labels from earlier UI — map to current options. */
const LEGACY_LABELS: Record<string, MoodCode> = {
  Хорошо: 'better',
  Устала: 'same',
  'Стало хуже': 'worse',
  'Стало лучше': 'better',
  'Без изменений': 'same',
};

const LEGACY_CODES: Record<string, MoodCode> = {
  good: 'better',
  tired: 'same',
  better: 'better',
  same: 'same',
  worse: 'worse',
};

export function moodOptionByLabel(label: string | null | undefined): MoodOption | null {
  if (!label) return null;
  const direct = MOOD_OPTIONS.find((o) => o.label === label);
  if (direct) return direct;
  const legacy = LEGACY_LABELS[label];
  return legacy ? moodOptionByCode(legacy) : null;
}

export function moodOptionByCode(code: string | null | undefined): MoodOption | null {
  if (!code) return null;
  const normalized = LEGACY_CODES[code] ?? (code as MoodCode);
  return MOOD_OPTIONS.find((o) => o.code === normalized) ?? null;
}

export function MoodCheckIn({
  selectedCode,
  saving,
  savedLabel,
  onSelect,
}: {
  selectedCode: MoodCode | null;
  saving: boolean;
  savedLabel?: string | null;
  onSelect: (option: MoodOption) => void;
}) {
  return (
    <div>
      <h3 className="text-[16px] font-semibold text-text">Как себя чувствуете?</h3>
      <p className="mt-1 text-[13px] text-text-muted">
        Краткая отметка обновит маршрут и уведомит врача
      </p>

      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Самочувствие">
        {MOOD_OPTIONS.map((option) => {
          const selected = selectedCode === option.code;
          return (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={saving}
              onClick={() => onSelect(option)}
              className={cn(
                'flex w-full items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition-colors disabled:opacity-60',
                option.code === 'better' &&
                  (selected
                    ? 'border-success/40 bg-success/10'
                    : 'border-border bg-surface hover:border-success/30 hover:bg-success/5'),
                option.code === 'same' &&
                  (selected
                    ? 'border-warning/40 bg-warning/10'
                    : 'border-border bg-surface hover:border-warning/30 hover:bg-warning/5'),
                option.code === 'worse' &&
                  (selected
                    ? 'border-danger/40 bg-danger/10'
                    : 'border-border bg-surface hover:border-danger/30 hover:bg-danger/5'),
              )}
            >
              <span
                className={cn(
                  'h-10 w-1.5 flex-shrink-0 rounded-full',
                  option.code === 'better' && 'bg-success',
                  option.code === 'same' && 'bg-warning',
                  option.code === 'worse' && 'bg-danger',
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-text">{option.label}</span>
                <span className="mt-0.5 block text-[12px] text-text-muted">{option.hint}</span>
              </span>
              <span
                className={cn(
                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[11px]',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-transparent',
                )}
                aria-hidden
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>

      {savedLabel ? (
        <p className="mt-3 text-[12px] text-text-muted" role="status">
          Сохранено: {savedLabel}
        </p>
      ) : null}
    </div>
  );
}
