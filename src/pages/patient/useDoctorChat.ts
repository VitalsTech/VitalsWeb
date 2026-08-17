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

function storageKey(patientId: string, doctorId: string) {
  return `vitals.chatConsultationId.${patientId}.${doctorId}`;
}

/**
 * Creates (or reuses) a consultation with a doctor.
 * doctorId must be the doctor's User.PublicId (same id used in /doctors routes).
 */
export function useDoctorChat(patientId: string | null, doctorId: string | undefined, doctorName?: string) {
  const key = patientId && doctorId ? storageKey(patientId, doctorId) : null;
  const [sessionId, setSessionId] = useState<string | null>(() =>
    key ? window.localStorage.getItem(key) : null,
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
    setMessages(list.map((m, i) => toChatMessage(m, `m-${i}`, 'patient')));
  }, []);

  useEffect(() => {
    if (!patientId || !doctorId || !key) return;
    const currentPatientId = patientId;
    const currentDoctorId = doctorId;
    const storageKeyValue = key;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        let id = sessionRef.current;

        try {
          const active = await consultationsApi.getActive(currentPatientId, currentDoctorId);
          const activeId = getConsultationId(active);
          if (activeId) id = activeId;
        } catch {
          /* 404 — create below */
        }

        if (!id) {
          const created = await consultationsApi.create({
            patientId: currentPatientId,
            doctorId: currentDoctorId,
            doctorName,
            consultationType: CONSULTATION_TYPE.chat,
          });
          id = getConsultationId(created) ?? null;
        }

        if (id) {
          window.localStorage.setItem(storageKeyValue, id);
          if (!cancelled) setSessionId(id);
          await consultationsApi.join(id, 'patient').catch(() => {});
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
  }, [patientId, doctorId, key, doctorName, loadMessages]);

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
        id: nextId('u'),
        from: 'user',
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

  const reload = useCallback(async () => {
    if (!sessionId) return;
    await loadMessages(sessionId, false);
  }, [sessionId, loadMessages]);

  return { sessionId, messages, loading, sending, error, send, reload };
}
