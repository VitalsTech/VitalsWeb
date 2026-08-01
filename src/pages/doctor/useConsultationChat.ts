import { useCallback, useEffect, useRef, useState } from 'react';
import {
  consultationsApi,
  CONSULTATION_TYPE,
  getConsultationId,
  normalizeMessages,
} from '@/api/consultations';
import type { ChatMessage } from '@/types/chat';
import { toChatMessage } from '@/lib/chatMessage';
import { nextId } from '@/lib/id';
import { getPublicId } from '@/api/tokenStore';

function storageKey(patientId: string, doctorId: string) {
  return `vitals.chatConsultationId.${patientId}.${doctorId}`;
}

/**
 * Doctor chat with a patient.
 * Always uses doctor User.PublicId for consultation.DoctorId so it matches the
 * patient-side session (patient opens chat via /doctors/{publicId}).
 */
export function useConsultationChat(
  doctorProfileId: string | null,
  patientId: string | undefined,
  /** Открыть конкретную консультацию (например, из календаря) вместо поиска активной. */
  presetSessionId?: string | null,
) {
  const doctorPublicId = getPublicId();
  const doctorIdForSession = doctorPublicId ?? doctorProfileId;
  const key =
    doctorIdForSession && patientId ? storageKey(patientId, doctorIdForSession) : null;

  const [sessionId, setSessionId] = useState<string | null>(
    () => presetSessionId ?? (key ? window.localStorage.getItem(key) : null),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(sessionId);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  const loadMessages = useCallback(async (id: string, markAsRead = true) => {
    const response = await consultationsApi.getMessages(id, 0, { markAsRead });
    const list = normalizeMessages(response);
    setMessages(list.map((m, i) => toChatMessage(m, `m-${i}`, 'doctor')));
  }, []);

  useEffect(() => {
    if (!doctorIdForSession || !patientId || !key) return;
    const currentDoctorId = doctorIdForSession;
    const currentPatientId = patientId;
    const storageKeyValue = key;
    const profileId = doctorProfileId;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        let id = presetSessionId ?? sessionRef.current;

        if (!presetSessionId) {
          for (const candidate of [currentDoctorId, profileId].filter(Boolean) as string[]) {
            try {
              const active = await consultationsApi.getActive(currentPatientId, candidate);
              const activeId = getConsultationId(active);
              if (activeId) {
                id = activeId;
                break;
              }
            } catch {
              /* 404 */
            }
          }
        }

        if (!id) {
          const created = await consultationsApi.create({
            patientId: currentPatientId,
            doctorId: currentDoctorId,
            consultationType: CONSULTATION_TYPE.chat,
          });
          id = getConsultationId(created) ?? null;
        }

        if (id) {
          window.localStorage.setItem(storageKeyValue, id);
          if (!cancelled) setSessionId(id);
          await consultationsApi.join(id, 'doctor').catch(() => {});
          await loadMessages(id, true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось открыть чат.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [doctorIdForSession, doctorProfileId, patientId, key, presetSessionId, loadMessages]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      void loadMessages(sessionId, true).catch(() => {});
    }, 2000);
    return () => window.clearInterval(timer);
  }, [sessionId, loadMessages]);

  const send = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return;
      setSending(true);
      setError(null);
      const optimistic: ChatMessage = {
        id: nextId('d'),
        from: 'doctor',
        text,
        isMine: true,
        sentAt: new Date().toISOString(),
        readAt: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        await consultationsApi.sendMessage(sessionId, { messageType: 'text', content: text });
        await loadMessages(sessionId, false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение.');
      } finally {
        setSending(false);
      }
    },
    [sessionId, loadMessages],
  );

  return { sessionId, messages, loading, sending, error, send };
}
