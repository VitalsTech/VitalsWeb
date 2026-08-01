import { DOCTOR_BIO_PLACEHOLDER } from '@/api/doctors';

export function DoctorBioBlock({
  biography,
  title = 'О враче',
  className = '',
}: {
  biography?: string | null;
  title?: string;
  className?: string;
}) {
  const text = biography?.trim() ? biography.trim() : DOCTOR_BIO_PLACEHOLDER;

  return (
    <div className={className}>
      <h3 className="text-[16px] font-semibold text-text">{title}</h3>
      <p className="mt-3 text-[14px] text-text-muted">{text}</p>
    </div>
  );
}
