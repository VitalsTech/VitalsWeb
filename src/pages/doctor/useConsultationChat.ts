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
 * Чат врача с пациентом.
 * `patientId` - Patient ProfileId (не User.PublicId).
 * DoctorId в сессии: publicId врача (как на стороне пациента при записи через /doctors/{publicId}).
 */
export function useConsultationChat(
  doctorProfileId: string | null,
  patientProfileId: string | undefined,
  presetSessionId?: string | null,
  patientAliases: string[] = [],
) {
  const doctorPublicId = getPublicId();
  const doctorIdForSession = doctorPublicId ?? doctorProfileId;
  const key =
    doctorIdForSession && patientProfileId
      ? storageKey(patientProfileId, doctorIdForSession)
      : null;

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
    if (!doctorIdForSession || !patientProfileId || !key) {
      setLoading(Boolean(patientProfileId));
      return;
    }
    const currentDoctorId = doctorIdForSession;
    const profilePatientId = patientProfileId;
    const patientCandidates = [
      ...new Set([profilePatientId, ...patientAliases].filter(Boolean)),
    ] as string[];
    const doctorCandidates = [
      ...new Set([currentDoctorId, doctorProfileId].filter(Boolean)),
    ] as string[];
    const storageKeyValue = key;
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        let id = presetSessionId ?? sessionRef.current;

        if (!presetSessionId) {
          outer: for (const patientCandidate of patientCandidates) {
            for (const doctorCandidate of doctorCandidates) {
              try {
                const active = await consultationsApi.getActive(
                  patientCandidate,
                  doctorCandidate,
                );
                const activeId = getConsultationId(active);
                if (activeId) {
                  id = activeId;
                  break outer;
                }
              } catch {
                /* 404 */
              }
            }
          }
        }

        if (!id) {
          // Новые консультации - строго на Patient ProfileId.
          const created = await consultationsApi.create({
            patientId: profilePatientId,
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
  }, [
    doctorIdForSession,
    doctorProfileId,
    patientProfileId,
    patientAliases.join('|'),
    key,
    presetSessionId,
    loadMessages,
  ]);

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
