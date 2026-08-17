import { useCallback, useEffect, useState } from 'react';
import {
  triageApi,
  getSessionId,
  normalizeTriageSession,
  isTriageCompleted,
  type TriageMessageDto,
  type TriageSessionDto,
} from '@/api/triage';
import type { ChatMessage } from '@/types/chat';
import { nextId } from '@/lib/id';

function storageKey(patientId: string) {
  return `vitals.triageSessionId.${patientId}`;
}

function toChatMessage(dto: TriageMessageDto, fallbackId: string): ChatMessage {
  const role = String(dto.role ?? dto.from ?? dto.sender ?? 'ai').toLowerCase();
  const from: ChatMessage['from'] = role.includes('user') || role.includes('patient') ? 'user' : 'ai';
  return {
    id: String(dto.id ?? fallbackId),
    from,
    text: String(dto.content ?? dto.text ?? dto.message ?? ''),
  };
}

function looksLikeSession(value: unknown): value is TriageSessionDto {
  if (!value || typeof value !== 'object') return false;
  const obj = value as TriageSessionDto;
  return Boolean(
    obj.sessionId ||
      obj.id ||
      Array.isArray(obj.messages) ||
      obj.latestAssessment ||
      typeof obj.readyToComplete === 'boolean',
  );
}

/**
 * Shared triage-session state - guided «ИИ-триаж» and «Чат с ИИ».
 */
export function useTriageSession(patientId: string | null) {
  const [sessionId, setSessionId] = useState<string | null>(() =>
    patientId ? window.localStorage.getItem(storageKey(patientId)) : null,
  );
  const [session, setSession] = useState<TriageSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((next: TriageSessionDto) => {
    const normalized = normalizeTriageSession(next) ?? next;
    setSession(normalized);
    if (Array.isArray(normalized.messages) && normalized.messages.length > 0) {
      setMessages(
        normalized.messages
          .map((m, i) => toChatMessage(m, `s-${i}`))
          .filter((m) => m.text.trim().length > 0),
      );
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const next = await triageApi.getSession(sessionId);
      applySession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить сессию триажа.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, applySession]);

  useEffect(() => {
    if (sessionId) void refresh();
  }, [sessionId, refresh]);

  const send = useCallback(
    async (text: string) => {
      if (!patientId || !text.trim()) return;
      setSending(true);
      setError(null);

      const optimisticUser: ChatMessage = { id: nextId('u'), from: 'user', text };
      setMessages((prev) => [...prev, optimisticUser]);

      try {
        if (!sessionId) {
          const created = await triageApi.createSession({
            patientId,
            chiefComplaint: text,
            locale: 'ru',
          });
          const createdId = getSessionId(created);
          if (createdId) {
            window.localStorage.setItem(storageKey(patientId), createdId);
            setSessionId(createdId);
          }
          applySession(created);
        } else {
          const reply = await triageApi.sendMessage(sessionId, text);
          if (looksLikeSession(reply)) {
            applySession(reply);
            // Если в ответе нет полного messages - подтянем GET.
            if (!Array.isArray(reply.messages) || reply.messages.length === 0) {
              const refreshed = await triageApi.getSession(sessionId);
              applySession(refreshed);
            }
          } else {
            const maybeMessage = reply as TriageMessageDto;
            if (maybeMessage && (maybeMessage.content || maybeMessage.text || maybeMessage.message)) {
              setMessages((prev) => [...prev, toChatMessage(maybeMessage, nextId('a'))]);
            }
            const refreshed = await triageApi.getSession(sessionId);
            applySession(refreshed);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение.');
      } finally {
        setSending(false);
      }
    },
    [patientId, sessionId, applySession],
  );

  const isCompleted = isTriageCompleted(session);
  const readyToComplete = Boolean(session?.readyToComplete) && !isCompleted;
  const completeSuggestion = session?.completeSuggestion?.trim() || undefined;
  const hypotheses = session?.latestAssessment?.llmResult?.hypotheses ?? [];

  /** Совместимость: «есть маршрут» = триаж завершён (не промежуточная срочность ИИ). */
  const hasRouting = isCompleted;

  const complete = useCallback(async () => {
    if (!sessionId) return null;
    setSending(true);
    setError(null);
    try {
      const completed = await triageApi.completeSession(sessionId);
      applySession(completed);
      return normalizeTriageSession(completed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось завершить триаж.');
      return null;
    } finally {
      setSending(false);
    }
  }, [sessionId, applySession]);

  const startNew = useCallback(() => {
    if (patientId) window.localStorage.removeItem(storageKey(patientId));
    setSessionId(null);
    setSession(null);
    setMessages([]);
    setError(null);
  }, [patientId]);

  return {
    sessionId,
    session,
    messages,
    loading,
    sending,
    error,
    send,
    refresh,
    complete,
    startNew,
    hasRouting,
    isCompleted,
    readyToComplete,
    completeSuggestion,
    hypotheses,
  };
}
