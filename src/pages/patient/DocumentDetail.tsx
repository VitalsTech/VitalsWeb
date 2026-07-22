import { useNavigate, useParams } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { documents } from '@/mock/data';

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const doc = documents.find((d) => d.id === id) ?? documents[0];

  function close() {
    navigate('/patient/documents');
  }

  return (
    <Modal onClose={close}>
      <h2 className="text-[24px] font-bold text-text">{doc.title}</h2>
      <p className="mt-2 text-[13px] text-text-muted">
        Дата: {doc.date} · Тип: справка · Источник: клиника
      </p>

      <div className="mt-6 flex h-[300px] items-center justify-center rounded-md border border-border">
        <p className="text-[14px] text-text-muted">Превью скана документа</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => alert('Скачивание PDF — демо без бэкенда')}>Скачать PDF</Button>
        <Button variant="secondary" onClick={() => alert('Редактирование — демо без бэкенда')}>
          Редактировать
        </Button>
        <Button variant="secondary" onClick={close}>
          Закрыть
        </Button>
      </div>

      <p className="mt-6 text-[13px] text-text-muted">
        Электронная версия доступна в формате FHIR PDF. Бумажный скан прикреплён.
      </p>
    </Modal>
  );
}
