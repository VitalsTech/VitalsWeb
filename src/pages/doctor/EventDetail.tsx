import { useNavigate, useParams } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/auth/AuthProvider';
import { getContact, removeContact } from './contacts';

export function EventDetail() {
  const { patientId } = useParams();
  const { doctorId } = useAuth();
  const navigate = useNavigate();

  const contact = getContact(doctorId, patientId);

  function close() {
    navigate('/doctor/calendar');
  }

  return (
    <Modal onClose={close}>
      {!contact ? (
        <p className="text-[14px] text-text-muted">Запись не найдена.</p>
      ) : (
        <>
          <p className="text-[13px] font-semibold text-accent">Пациент</p>
          <h2 className="mt-2 text-[24px] font-bold text-text">{contact.label}</h2>
          <p className="mt-2 text-[14px] text-text-muted">
            Последняя активность: {new Date(contact.lastActivityAt).toLocaleString('ru-RU')}
          </p>

          <div className="mt-6 rounded-md border border-border bg-surface-muted p-4">
            <p className="text-[12px] font-semibold text-text-muted">Сводка</p>
            <p className="mt-1 text-[13px] text-text">
              {contact.summary ?? 'Сводка появится после консультации.'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/doctor/patients/${contact.patientId}`)}>
              Открыть карточку пациента
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/doctor/patients/${contact.patientId}/chat`)}
            >
              Начать приём
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (doctorId) removeContact(doctorId, contact.patientId);
                close();
              }}
            >
              Убрать из списка
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
