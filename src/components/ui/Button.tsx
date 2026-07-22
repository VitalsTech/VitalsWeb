import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline-accent';
type Size = 'md' | 'sm' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-muted',
  ghost: 'bg-transparent text-text hover:bg-surface-muted',
  'outline-accent': 'bg-transparent text-text border border-accent hover:bg-surface-muted',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-[13px]',
  lg: 'h-14 px-5 text-[15px]',
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
    to?: undefined;
  };

type LinkProps = BaseProps & {
  to: string;
  href?: undefined;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  to,
}: LinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {children}
    </Link>
  );
}
