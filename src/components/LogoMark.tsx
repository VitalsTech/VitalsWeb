export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <img
      src="/label.png"
      alt="Vitals"
      className={className}
      width={160}
      height={48}
      loading="lazy"
    />
  );
}
