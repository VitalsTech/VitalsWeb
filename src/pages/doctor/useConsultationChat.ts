import { useCallback, useEffect, useState } from 'react';
import { consultationsApi, getConsultationId, normalizeMessages } from '@/api/consultations';
import type { ConsultationMessageDto } from '@/api/consultations';
import type { ChatMessage } from '@/types/chat';
import { nextId } from '@/lib/id';

// Same key shape the patient-side `useDoctorChat` hook uses, so a chat
// session created from either side of a patient↔doctor pair is reused when
// running both roles in the same browser (e.g. during local testing).
function storageKey(patientId: string, doctorId: string) {
  return `vitals.chatConsultationId.${patientId}.${doctorId}`;
}

function toChatMessage(dto: ConsultationMessageDto, fallbackId: string): ChatMessage {
  const role = String(dto.senderRole ?? dto.role ?? 'user').toLowerCase();
  const from: ChatMessage['from'] = role.includes('doctor') ? 'doctor' : 'user';
  return { id: String(dto.id ?? fallbackId), from, text: String(dto.content ?? '') };
}

/** Creates (or reuses) a chat-type consultation session between the current
 * doctor and a given patient. */
export function useConsultationChat(doctorId: string | null, patientId: string | undefined) {
  const key = doctorId && patientId ? storageKey(patientId, doctorId) : null;
  const [sessionId, setSessionId] = useState<string | null>(() =>
    key ? window.localStorage.getItem(key) : null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (id: string) => {
    const response = await consultationsApi.getMessages(id, 0);
    const list = normalizeMessages(response);
    setMessages(list.map((m, i) => toChatMessage(m, `m-${i}`)));
  }, []);

  useEffect(() => {
    if (!doctorId || !patientId || !key) return;
    const currentDoctorId = doctorId;
    const currentPatientId = patientId;
    const storageKeyValue = key;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        let id = sessionId;
        if (!id) {
          const created = await consultationsApi.create({
            patientId: currentPatientId,
            doctorId: currentDoctorId,
            consultationType: 'chat',
          });
          id = getConsultationId(created) ?? null;
          if (id) {
            window.localStorage.setItem(storageKeyValue, id);
            if (!cancelled) setSessionId(id);
          }
        }
        if (id) {
          await consultationsApi.join(id, 'doctor').catch(() => {});
          await loadMessages(id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, patientId, key]);

  const send = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return;
      setSending(true);
      setError(null);
      const optimistic: ChatMessage = { id: nextId('d'), from: 'doctor', text };
      setMessages((prev) => [...prev, optimistic]);
      try {
        await consultationsApi.sendMessage(sessionId, { messageType: 'text', content: text });
        await loadMessages(sessionId);
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
