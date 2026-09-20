import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function VideoConsentModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (videoRecordingConsent: boolean) => void;
  onClose: () => void;
}) {
  const [recording, setRecording] = useState(false);

  return (
    <Modal onClose={onClose} widthClassName="max-w-[480px]">
      <p className="text-[13px] font-semibold text-accent">Видеоконсультация</p>
      <h2 className="mt-2 text-[22px] font-bold text-text">Согласие на видео</h2>
      <p className="mt-2 text-[14px] text-text-muted">
        Для звонка нужны камера и микрофон. Обработка данных консультации необходима, чтобы врач мог
        провести приём.
      </p>

      <label className="mt-5 flex items-start gap-3 text-[13px] text-text">
        <input type="checkbox" checked disabled className="mt-1" />
        <span>Согласие на обработку данных консультации</span>
      </label>

      <label className="mt-3 flex items-start gap-3 text-[13px] text-text">
        <input
          type="checkbox"
          checked={recording}
          onChange={(e) => setRecording(e.target.checked)}
          className="mt-1"
        />
        <span>Согласие на запись звонка (запись сейчас не ведётся)</span>
      </label>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => onConfirm(recording)}>Продолжить</Button>
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </Modal>
  );
}
