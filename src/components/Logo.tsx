import { cn } from '@/lib/cn';

export function Logo({
  className,
  variant = 'sidebar',
  layout = 'inline',
}: {
  className?: string;
  /** `sidebar` - тёмная навигация; `onLight` - светлый фон (auth, header) */
  variant?: 'sidebar' | 'onLight';
  /** `inline` - в строку; `stacked` - крупная надпись (auth) */
  layout?: 'inline' | 'stacked';
}) {
  return (
    <div
      className={cn(
        'flex items-center',
        variant === 'sidebar' ? 'text-sidebar-foreground' : 'text-text',
        className,
      )}
    >
      <span
        className={cn(
          'font-bold leading-none tracking-tight',
          layout === 'stacked' ? 'text-[32px] sm:text-[36px]' : 'text-[22px]',
        )}
      >
        Vitals
      </span>
    </div>
  );
}
