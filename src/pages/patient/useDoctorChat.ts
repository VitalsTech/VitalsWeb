import { useCallback, useEffect, useRef, useState } from 'react';
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
  const id = String(dto.id ?? dto.messageId ?? fallbackId);
  return { id, from, text: String(dto.content ?? '') };
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
  sessionRef.current = sessionId;

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
        let id = sessionRef.current;

        // Prefer server-side active session so doctor/patient share one chat across browsers.
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
            consultationType: 'chat',
          });
          id = getConsultationId(created) ?? null;
        }

        if (id) {
          window.localStorage.setItem(storageKeyValue, id);
          if (!cancelled) setSessionId(id);
          await consultationsApi.join(id, 'patient').catch(() => {});
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
  }, [patientId, doctorId, key, doctorName, loadMessages]);

  // Poll so messages from the other participant appear without SignalR.
  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      void loadMessages(sessionId).catch(() => {});
    }, 2000);
    return () => window.clearInterval(timer);
  }, [sessionId, loadMessages]);

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
