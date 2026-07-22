import { useCallback, useEffect, useState } from 'react';
import { consultationsApi, getConsultationId, normalizeMessages } from '@/api/consultations';
import type { ConsultationMessageDto } from '@/api/consultations';
import type { ChatMessage } from '@/types/chat';
import { nextId } from '@/lib/id';

function storageKey(patientId: string, doctorId: string) {
  return `vitals.chatConsultationId.${patientId}.${doctorId}`;
}

function toChatMessage(dto: ConsultationMessageDto, fallbackId: string): ChatMessage {
  const role = String(dto.senderRole ?? dto.role ?? 'doctor').toLowerCase();
  const from: ChatMessage['from'] = role.includes('patient') || role.includes('user') ? 'user' : 'doctor';
  return { id: String(dto.id ?? fallbackId), from, text: String(dto.content ?? '') };
}

/** Creates (or reuses) a chat-type consultation session with a given doctor. */
export function useDoctorChat(patientId: string | null, doctorId: string | undefined, doctorName?: string) {
  const key = patientId && doctorId ? storageKey(patientId, doctorId) : null;
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
    if (!patientId || !doctorId || !key) return;
    const currentPatientId = patientId;
    const currentDoctorId = doctorId;
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
            doctorName,
            consultationType: 'chat',
          });
          id = getConsultationId(created) ?? null;
          if (id) {
            window.localStorage.setItem(storageKeyValue, id);
            if (!cancelled) setSessionId(id);
          }
        }
        if (id) await loadMessages(id);
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
  }, [patientId, doctorId, key]);

  const send = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return;
      setSending(true);
      setError(null);
      const optimistic: ChatMessage = { id: nextId('u'), from: 'user', text };
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
