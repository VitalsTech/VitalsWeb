import { useCallback, useEffect, useRef, useState } from 'react';
import { consultationsApi, getConsultationId, normalizeMessages } from '@/api/consultations';
import type { ConsultationMessageDto } from '@/api/consultations';
import type { ChatMessage } from '@/types/chat';
import { nextId } from '@/lib/id';
import { getPublicId } from '@/api/tokenStore';

function storageKey(patientId: string, doctorId: string) {
  return `vitals.chatConsultationId.${patientId}.${doctorId}`;
}

function toChatMessage(dto: ConsultationMessageDto, fallbackId: string): ChatMessage {
  const role = String(dto.senderRole ?? dto.role ?? 'user').toLowerCase();
  const from: ChatMessage['from'] = role.includes('doctor') ? 'doctor' : 'user';
  const id = String(dto.id ?? dto.messageId ?? fallbackId);
  return { id, from, text: String(dto.content ?? '') };
}

/**
 * Doctor chat with a patient.
 * Always uses doctor User.PublicId for consultation.DoctorId so it matches the
 * patient-side session (patient opens chat via /doctors/{publicId}).
 */
export function useConsultationChat(doctorProfileId: string | null, patientId: string | undefined) {
  const doctorPublicId = getPublicId();
  const doctorIdForSession = doctorPublicId ?? doctorProfileId;
  const key =
    doctorIdForSession && patientId ? storageKey(patientId, doctorIdForSession) : null;

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
        let id = sessionRef.current;

        // Resolve shared session: publicId first (canonical), then profileId (legacy).
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

        if (!id) {
          const created = await consultationsApi.create({
            patientId: currentPatientId,
            doctorId: currentDoctorId,
            consultationType: 'chat',
          });
          id = getConsultationId(created) ?? null;
        }

        if (id) {
          window.localStorage.setItem(storageKeyValue, id);
          if (!cancelled) setSessionId(id);
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
  }, [doctorIdForSession, doctorProfileId, patientId, key, loadMessages]);

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
