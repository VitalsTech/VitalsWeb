import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

const toneClasses: Record<Tone, string> = {
  success: 'bg-success text-primary-foreground',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
  neutral: 'bg-surface-muted text-text-muted border border-border',
  accent: 'bg-accent text-[#11442f]',
};

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold',
        toneClasses[tone],
        className,
      )}
      {...rest}
    />
  );
}
